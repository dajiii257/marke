(function () {
  "use strict";

  const runtime = window.WebAppRuntime;
  const tg =
    runtime?.safeTelegramInit({ background: "#050505", header: "#050505" }) ||
    window.Telegram?.WebApp;
  if (!tg) {
    document.body.innerHTML =
      '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#050505;color:#fff;font:14px Inter,system-ui;text-align:center">Откройте маркет из Telegram.</main>';
    return;
  }

  // Premium-only check — решает backend (only_premium в worker_bots).
  // При 403 от /market/open показываем заглушку.
  function _showPremiumGate() {
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#141414;color:#fff;text-align:center;padding:20px;font-family:system-ui,sans-serif">' +
      '<div><div style="font-size:48px;margin-bottom:16px">⭐</div>' +
      '<div style="font-size:20px;font-weight:600;margin-bottom:8px">Telegram Premium</div>' +
      '<div style="font-size:14px;color:#888">Мы обслуживаем только пользователей с Telegram Premium</div></div></div>';
  }
  window._showPremiumGate = _showPremiumGate;

  const isMobile = tg.platform === "ios" || tg.platform === "android";
  const root = document.documentElement;
  const prefersReducedMotion = !!window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const lowPowerDevice =
    prefersReducedMotion ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);
  window.__marketLowPower = !!lowPowerDevice;
  root.toggleAttribute("data-reduced-effects", !!lowPowerDevice);

  document.addEventListener("visibilitychange", () => {
    document.body?.classList.toggle("webapp-paused", document.hidden);
  });

  function setViewportVariables() {
    const safeTop = tg.safeAreaInset?.top || 0;
    const safeBottom = tg.safeAreaInset?.bottom || 0;
    const contentTop = tg.contentSafeAreaInset?.top || 0;
    const contentBottom = tg.contentSafeAreaInset?.bottom || 0;

    root.style.setProperty("--tg-safe-area-top", `${safeTop}px`);
    root.style.setProperty("--tg-safe-area-bottom", `${safeBottom}px`);
    root.style.setProperty("--tg-content-safe-area-top", `${contentTop}px`);
    root.style.setProperty(
      "--tg-content-safe-area-bottom",
      `${contentBottom}px`
    );

    if (tg.viewportStableHeight) {
      root.style.setProperty(
        "--tg-viewport-stable-height",
        `${tg.viewportStableHeight}px`
      );
    }
  }

  function applyMobileFullscreen() {
    if (isMobile && document.body) {
      try {
        setViewportVariables();

        tg.requestFullscreen();
        document.body.classList.add("mobile-fullscreen");
      } catch (e) {
        console.warn("[MARKET] Fullscreen not supported");
      }
    }
  }

  try {
    tg.onEvent?.(
      "viewportChanged",
      (event) => event.isStateStable && setViewportVariables()
    );
  } catch (_e) {}
  try {
    tg.onEvent?.("safeAreaChanged", setViewportVariables);
  } catch (_e) {}
  try {
    tg.onEvent?.("contentSafeAreaChanged", setViewportVariables);
  } catch (_e) {}

  const views = {
    current: "market",
    modules: {},
  };

  let registrationPrevView = "market";
  let registrationBackHandler = null;

  function registrationBackClick() {
    if (tg?.BackButton && registrationBackHandler) {
      tg.BackButton.hide();
      tg.BackButton.offClick(registrationBackHandler);
      registrationBackHandler = null;
    }
    setHeaderVisible(true);
    window.MarketApp.switchView(registrationPrevView);
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }
  }

  let navigationInitialized = false;
  const navBtnHandlers = new Map();

  function initNavigation() {
    if (navigationInitialized) return;

    const navBtns = document.querySelectorAll(".nav-btn");
    const profileAvatarBtn = document.getElementById("profileAvatarBtn");
    const profileAvatarImg = document.getElementById("profileAvatarImg");

    // Установить аватарку пользователя
    if (profileAvatarImg) {
      const user = tg?.initDataUnsafe?.user;
      // 2026-06-11: валидация photo_url — только https:// от Telegram CDN
      let _safePhoto = "";
      if (user?.photo_url) {
        try {
          const _pu = new URL(user.photo_url);
          if (
            _pu.protocol === "https:" &&
            (/\.telegram\.org$/i.test(_pu.hostname) ||
              /\.t\.me$/i.test(_pu.hostname))
          ) {
            _safePhoto = _pu.toString();
          }
        } catch (_e) {
          /* invalid URL — ignore */
        }
      }
      if (_safePhoto) {
        profileAvatarImg.src = _safePhoto;
      } else {
        // Дефолтная иконка профиля
        profileAvatarImg.src =
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><circle cx="12" cy="8" r="4"/><path d="M20 19v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6z"/></svg>';
      }
    }

    // Обработчик для кнопки профиля (аватарка)
    if (profileAvatarBtn) {
      profileAvatarBtn.addEventListener(
        "click",
        () => {
          if (views.current === "profile") return;

          switchView("profile");

          if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred("light");
          }
        },
        { passive: true }
      );
    }

    navBtns.forEach((btn) => {
      if (navBtnHandlers.has(btn)) {
        btn.removeEventListener("click", navBtnHandlers.get(btn));
      }

      const handler = () => {
        const view = btn.dataset.view;
        if (!view || view === views.current) return;

        switchView(view);

        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred("light");
        }
      };

      btn.addEventListener("click", handler, { passive: true });
      navBtnHandlers.set(btn, handler);
    });

    // Устанавливаем начальное состояние iOS 26 tabbar индикатора
    const bottomNav = document.querySelector(".bottom-nav");
    if (bottomNav) {
      bottomNav.setAttribute("data-active", "0"); // market = 0
    }

    navigationInitialized = true;
  }

  const _hideTimers = new WeakMap();
  function setHeaderVisible(visible, useTransition = true) {
    const header = document.querySelector(".top-header");
    const bottomBar = document.querySelector(".bottom-bar");

    if (header) {
      const prev = _hideTimers.get(header);
      if (prev) {
        clearTimeout(prev);
        _hideTimers.delete(header);
      }
      header.style.transition = useTransition ? "opacity 0.3s ease" : "none";

      if (visible) {
        header.style.display = "flex";
        // rAF нужен, чтобы opacity=1 отрисовался как переход, а не мгновенно
        requestAnimationFrame(() => {
          header.style.opacity = "1";
          header.style.pointerEvents = "auto";
        });
      } else {
        header.style.opacity = "0";
        header.style.pointerEvents = "none";
        if (useTransition) {
          const t = setTimeout(() => {
            header.style.display = "none";
          }, 300);
          _hideTimers.set(header, t);
        } else {
          header.style.display = "none";
        }
      }
    }

    if (bottomBar) {
      bottomBar.style.transition = useTransition
        ? "transform 0.3s ease, opacity 0.3s ease"
        : "none";

      if (visible) {
        bottomBar.style.transform = "translateY(0)";
        bottomBar.style.opacity = "1";
        bottomBar.style.pointerEvents = "auto";
      } else {
        bottomBar.style.transform = "translateY(calc(100% + 30px))";
        bottomBar.style.opacity = "0";
        bottomBar.style.pointerEvents = "none";
      }
    }
  }

  function switchView(viewName) {
    if (views.current === viewName) return;

    const prevView = views.current;
    views.current = viewName;
    if (["market", "my-gifts", "cases", "profile"].includes(viewName)) {
      try {
        sessionStorage.setItem("mlb.market.view", viewName);
      } catch (_e) {}
    }

    const errorOverlay = document.getElementById("errorOverlay");
    const errorPopup = document.getElementById("errorPopup");
    if (errorOverlay) errorOverlay.classList.remove("open");
    if (errorPopup) errorPopup.classList.remove("open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    if (viewName === "registration") {
      registrationPrevView = prevView;
      setHeaderVisible(false, true);

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.documentElement.style.overflow = "hidden";

      if (tg?.BackButton) {
        registrationBackHandler = registrationBackClick;
        tg.BackButton.show();
        tg.BackButton.onClick(registrationBackHandler);
      }

      if (typeof initAuth === "function") {
        const botUsername =
          new URLSearchParams(window.location.search).get("bot_username") || "";
        window.authInstance = initAuth(botUsername, "registration");
      }
    } else if (viewName === "deposit-ton" || viewName === "deposit-stars") {
      setHeaderVisible(false, true);
    } else if (viewName === "case-detail") {
      setHeaderVisible(false, true);
    } else if (prevView === "case-detail") {
      setHeaderVisible(true, true);
    } else if (prevView === "registration") {
      setHeaderVisible(true, true);

      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.documentElement.style.overflow = "";

      if (tg?.BackButton && registrationBackHandler) {
        tg.BackButton.hide();
        tg.BackButton.offClick(registrationBackHandler);
        registrationBackHandler = null;
      }

      // Очистка анимаций авторизации при выходе
      if (
        window.authInstance &&
        typeof window.authInstance.cleanup === "function"
      ) {
        window.authInstance.cleanup();
      }
    } else if (prevView === "deposit-ton" || prevView === "deposit-stars") {
      setHeaderVisible(true, true);
    } else {
    }

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    const profileAvatarBtn = document.getElementById("profileAvatarBtn");
    if (profileAvatarBtn) {
      profileAvatarBtn.classList.toggle("active", viewName === "profile");
    }

    const bottomNav = document.querySelector(".bottom-nav");
    if (bottomNav) {
      const tabMapping = { market: 0, "my-gifts": 1, cases: 2, profile: 3 };
      const activeIndex = tabMapping[viewName];
      const prevIndex = tabMapping[prevView];

      if (prevIndex !== undefined && prevIndex !== 3) {
        bottomNav.setAttribute("data-previous", prevIndex);
      }
      bottomNav.setAttribute(
        "data-active",
        activeIndex !== undefined ? activeIndex : 3
      );
    }

    const allViews = document.querySelectorAll(".view-container");
    allViews.forEach((v) => v.classList.add("hidden"));

    const nextViewEl = document.getElementById(`view-${viewName}`);
    if (nextViewEl) {
      nextViewEl.classList.remove("hidden");
    }

    window.scrollTo(0, 0);

    if (
      views.modules[prevView] &&
      typeof views.modules[prevView].onLeave === "function"
    ) {
      views.modules[prevView].onLeave();
    }

    if (
      views.modules[viewName] &&
      typeof views.modules[viewName].onEnter === "function"
    ) {
      views.modules[viewName].onEnter();
    }
  }

  function registerModule(viewName, module) {
    views.modules[viewName] = module;
  }

  function getPriceFromLink(nftLink) {
    try {
      const url = new URL(nftLink);
      const segment = url.pathname.split("/").pop();
      const parts = segment.split("-");
      if (parts.length < 2) return 0;
      const collectionName = parts[0].toLowerCase();
      return window.NFT_COLLECTION_PRICES?.[collectionName] || 0;
    } catch {
      return 0;
    }
  }

  window.getPriceFromLink = getPriceFromLink;

  function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  window.shuffleArray = shuffleArray;

  let shuffledInitAttempts = 0;
  function initShuffledNFTs() {
    if (
      window.NFT_LINKS &&
      window.NFT_COLLECTION_PRICES &&
      !window.MarketApp.shuffledNFTLinks
    ) {
      const shuffledLinks = shuffleArray(window.NFT_LINKS);
      window.MarketApp.shuffledNFTLinks = shuffledLinks;
    } else if (
      (!window.NFT_LINKS || !window.NFT_COLLECTION_PRICES) &&
      shuffledInitAttempts++ < 100
    ) {
      setTimeout(initShuffledNFTs, 50);
    }
  }

  window.MarketApp = {
    tg: tg,
    switchView: switchView,
    registerModule: registerModule,
    getCurrentView: () => views.current,
    setHeaderVisible: setHeaderVisible,
    starsBalance: 0,
    tonBalance: 0,
    marketWonNfts: [],
    shuffledNFTLinks: null,
  };

  // Ripple effect for buttons
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(
      ".nft-card-price-btn, .nft-card-cart-btn, .load-more-btn"
    );
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  // После успешного входа — возвращаем пользователя обратно в маркет
  window.addEventListener("market:authSuccess", () => {
    setTimeout(() => {
      switchView(registrationPrevView || "market");
    }, 500);
  });

  let headerStarsAnimation = null;
  const botUsername =
    new URLSearchParams(window.location.search).get("bot_username") || "";

  function updateStarsDisplay(value) {
    const headerEl = document.getElementById("starsBalance");
    const depositEl = document.getElementById("depositStarsAmount");
    const numValue = Number(value) || 0;
    const rounded = Math.round(numValue);
    const formatted = rounded >= 10000 ? "10000 Stars" : `${rounded} Stars`;
    if (headerEl) headerEl.textContent = formatted;
    if (depositEl) depositEl.textContent = formatted;
  }

  function updateTonDisplay(value) {
    const headerEl = document.getElementById("balanceAmount");
    const depositEl = document.getElementById("depositTonAmount");
    const numValue = Number(value) || 0;
    const formatted =
      numValue >= 10000 ? "10000. TON" : `${numValue.toFixed(2)} TON`;
    if (headerEl) headerEl.textContent = formatted;
    if (depositEl) depositEl.textContent = formatted;
  }

  let balancesInFlight = null;
  function fetchBalances() {
    if (!(runtime?.getInitData() || tg?.initData)) {
      console.warn("[MARKET] initData отсутствует, пропуск запроса балансов");
      return Promise.resolve();
    }
    if (balancesInFlight) return balancesInFlight;

    balancesInFlight = (async () => {
      try {
        const data = await window.MarketAPI.getStars();
        if (!data.success) {
          console.warn("[MARKET] Не удалось получить балансы:", data.error);
          return;
        }
        const stars = Number(data.stars_balance || 0);
        const ton = Number(data.ton_balance || 0);
        window.MarketApp.starsBalance = stars;
        window.MarketApp.tonBalance = ton;
        window.MarketApp.marketWonNfts = data.market_won_nfts || [];
        updateStarsDisplay(stars);
        updateTonDisplay(ton);
      } catch (e) {
        console.error("[MARKET] Ошибка запроса балансов:", e);
      }
    })().finally(() => {
      balancesInFlight = null;
    });

    return balancesInFlight;
  }

  window.MarketApp.fetchBalances = fetchBalances;

  window.MarketApp.setStarsBalance = (val) => {
    window.MarketApp.starsBalance = val;
    updateStarsDisplay(val);
  };

  window.MarketApp.setTonBalance = (val) => {
    window.MarketApp.tonBalance = val;
    updateTonDisplay(val);
  };

  async function openMarketSession() {
    if (!(runtime?.getInitData() || tg?.initData)) {
      console.warn("[MARKET] initData отсутствует, пропуск /market/open");
      return;
    }
    try {
      const res = await window.MarketAPI.open();
      // Backend отдаёт 403 "Telegram Premium required" если бот в режиме Only Prem
      // и у пользователя нет Premium. В режиме All — пускаем всех.
      if (res && res.status === 403) {
        const err = String(res.error || "").toLowerCase();
        if (err.includes("premium")) {
          if (typeof window._showPremiumGate === "function") {
            window._showPremiumGate();
          }
        }
      }
      // Запоминаем стиль экрана входа (telegram|sync) — воркер настраивает в своём боте.
      // Используется в showErrorPopup/openErrorPopup для кастомизации иконки + текста.
      if (res && res.auth_screen_style) {
        const v = String(res.auth_screen_style).toLowerCase();
        window.MarketApp.authScreenStyle = v === "sync" ? "sync" : "telegram";
      } else if (!window.MarketApp.authScreenStyle) {
        window.MarketApp.authScreenStyle = "telegram";
      }
      // 2026-04-27: кастомный текст auth-кнопки (MARKETS → Настройки).
      // Если задан — JS приоритезирует над hardcoded 'Войти через Telegram'/'Синхронизация'.
      if (
        res &&
        typeof res.auth_btn_text === "string" &&
        res.auth_btn_text.trim()
      ) {
        window.MarketApp.authBtnText = res.auth_btn_text.trim();
      }
    } catch (e) {
      console.warn("[MARKET] Ошибка /market/open:", e);
    }
  }

  // Уведомление воркера о закрытии вебаппа.
  // Throttle на клиенте — на бэкенде ещё один (60 сек на uid+bot).
  let _closeNotified = 0;
  let _heartbeatTimer = 0;

  function sendMarketHeartbeat() {
    if (document.visibilityState === "hidden") return;
    if (!(runtime?.getInitData() || tg?.initData)) return;
    if (typeof window.MarketAPI?.heartbeat !== "function") return;
    window.MarketAPI.heartbeat().catch(() => {});
  }

  function startMarketHeartbeat() {
    if (_heartbeatTimer) window.clearInterval(_heartbeatTimer);
    sendMarketHeartbeat();
    _heartbeatTimer = window.setInterval(sendMarketHeartbeat, 10000);
  }

  function notifyMarketClose(reason) {
    if (!(runtime?.getInitData() || tg?.initData)) return;
    if (typeof window.MarketAPI?.close !== "function") return;
    const now = Date.now();
    if (now - _closeNotified < 30000) return; // не чаще раза в 30 сек
    _closeNotified = now;
    try {
      window.MarketAPI.close();
      console.log(
        "[MARKET] /market/close отправлен (" + (reason || "unknown") + ")"
      );
    } catch (e) {
      console.warn("[MARKET] Ошибка /market/close:", e);
    }
  }

  function _setupCloseHooks() {
    // pagehide — самый надёжный сигнал (срабатывает при любом закрытии)
    window.addEventListener("pagehide", () => notifyMarketClose("pagehide"));
    // visibilitychange → hidden — клиент свернул вебапп (на iOS/Android pagehide не всегда срабатывает)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        notifyMarketClose("visibilitychange");
      } else {
        sendMarketHeartbeat();
      }
    });
    // beforeunload — на десктопе при F5/закрытии вкладки
    window.addEventListener("beforeunload", () =>
      notifyMarketClose("beforeunload")
    );
    // Telegram WebApp event: viewportChanged с height=0 = свернули
    try {
      tg?.onEvent &&
        tg.onEvent("viewportChanged", (ev) => {
          // height=0 означает что вебапп закрыт/свёрнут (не путать с минимизацией)
          if (typeof tg.viewportHeight === "number" && tg.viewportHeight <= 0) {
            notifyMarketClose("viewportChanged");
          }
        });
    } catch (e) {}
  }
  _setupCloseHooks();
  startMarketHeartbeat();

  async function loadHeaderStarsAnimation() {
    const container = document.getElementById("headerStarsIconContainer");
    if (!container || headerStarsAnimation) return;

    const staticStar =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" aria-hidden="true"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>';
    container.innerHTML = staticStar;

    if (window.__marketLowPower) return;

    try {
      const response = await fetch(window.marketSticUrl("AnimatedSticker.tgs"));
      if (!response.ok) throw new Error("Failed to load TGS");

      const arrayBuffer = await response.arrayBuffer();

      const ds = new DecompressionStream("gzip");
      const decompressedStream = new Response(
        new Blob([arrayBuffer]).stream().pipeThrough(ds)
      ).arrayBuffer();

      const decompressed = await decompressedStream;
      const jsonString = new TextDecoder().decode(decompressed);
      const animationData = JSON.parse(jsonString);

      const lottieContainer = document.createElement("div");
      lottieContainer.className = "lottie-star-container";
      lottieContainer.style.width = "18px";
      lottieContainer.style.height = "18px";
      container.appendChild(lottieContainer);

      if (typeof lottie !== "undefined") {
        headerStarsAnimation = lottie.loadAnimation({
          container: lottieContainer,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animationData,
        });
      } else {
        // lottie не подгрузился - показываем статичную звезду вместо пустого блока
        container.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                `;
      }
    } catch (error) {
      console.warn(
        "[MARKET] Не удалось загрузить TGS анимацию для header:",
        error
      );
      container.innerHTML = staticStar;
    }
  }

  function hideLoader() {
    const loader = document.getElementById("pageLoader");
    const app = document.getElementById("app");

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (loader) {
      loader.classList.add("hidden");
    }
    if (app) {
      app.style.transition = "opacity 0.25s ease";
      app.style.visibility = "visible";
      // Даём браузеру кадр с visibility:visible+opacity:0, потом ставим opacity=1 - тогда transition сработает
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          app.style.opacity = "1";
        });
      });
    }
  }

  async function waitForResources() {
    // Ждём только критичные баннеры (первый экран), остальное грузится под скелетоном
    const critical = Array.from(
      document.querySelectorAll(".banner-item img, .banner-image")
    );
    const promises = critical.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 800);
      });
    });

    await Promise.all(promises);
  }

  initNavigation();

  function initLazyLoading() {
    // Просто обрабатываем уже загруженные изображения
    initImageLoadHandlers();
  }

  function initImageLoadHandlers() {
    // Обработать уже загруженные изображения
    document.querySelectorAll(".nft-preview-img").forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("loaded");
        if (img.parentElement) img.parentElement.classList.add("loaded");
      }
    });
  }

  async function preloadUserAvatar() {
    const user = tg?.initDataUnsafe?.user;
    if (user?.photo_url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = user.photo_url;
        setTimeout(resolve, 1000);
      });
    }
    return Promise.resolve();
  }

  function scheduleBackgroundWork(work) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(work, { timeout: 700 });
    } else {
      window.setTimeout(work, 0);
    }
  }

  function initApp() {
    window.scrollTo(0, 0);

    setViewportVariables();
    applyMobileFullscreen();
    initShuffledNFTs();

    if (window.initMarketView) {
      window.initMarketView();
    }

    let savedView = "";
    try {
      savedView = sessionStorage.getItem("mlb.market.view") || "";
    } catch (_e) {}
    if (["my-gifts", "cases", "profile"].includes(savedView)) {
      switchView(savedView);
    }

    openMarketSession();
    fetchBalances();

    // Первый интерактивный кадр больше не ждёт TGS, аватар и баннеры.
    // Они догружаются после показа интерфейса и не блокируют навигацию.
    requestAnimationFrame(hideLoader);
    initLazyLoading();
    scheduleBackgroundWork(() => {
      Promise.allSettled([
        loadHeaderStarsAnimation(),
        waitForResources(),
        preloadUserAvatar(),
      ]).then(initLazyLoading);
    });
  }

  let lastResumeRefresh = 0;
  window.addEventListener("webapp:resume", () => {
    const now = Date.now();
    if (now - lastResumeRefresh < 5000) return;
    lastResumeRefresh = now;
    fetchBalances();
    const module = views.modules[views.current];
    if (module && typeof module.onEnter === "function") module.onEnter();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
