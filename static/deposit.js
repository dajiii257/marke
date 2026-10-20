(function () {
  "use strict";

  if (!window.MarketApp) {
    console.error("[DEPOSIT] MarketApp not initialized");
    return;
  }

  const tg = window.MarketApp.tg;
  let previousView = "market";

  function setHeaderVisible(visible) {
    const header = document.querySelector(".top-header");
    const bottomNav = document.querySelector(".bottom-nav");

    if (header) {
      if (visible) {
        header.style.display = "flex";
        header.style.opacity = "1";
        header.style.pointerEvents = "auto";
      } else {
        header.style.display = "none";
        header.style.opacity = "0";
        header.style.pointerEvents = "none";
      }
      header.style.transition = "opacity 0.3s ease";
    }

    if (bottomNav) {
      bottomNav.style.transform = visible
        ? "translateY(0)"
        : "translateY(100%)";
      bottomNav.style.transition = "transform 0.3s ease";
    }
  }

  function setupBackButton() {
    if (tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackClick);
    }
  }

  function hideBackButton() {
    if (tg.BackButton) {
      tg.BackButton.hide();
      tg.BackButton.offClick(handleBackClick);
    }
  }

  function handleBackClick() {
    hideBackButton();
    setHeaderVisible(true);
    window.MarketApp.switchView(previousView);

    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }
  }

  function openDepositTon() {
    previousView = window.MarketApp.getCurrentView();
    setHeaderVisible(false);
    setupBackButton();
    window.MarketApp.switchView("deposit-ton");

    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("medium");
    }
  }

  function openDepositStars() {
    previousView = window.MarketApp.getCurrentView();
    setHeaderVisible(false);
    setupBackButton();
    window.MarketApp.switchView("deposit-stars");

    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("medium");
    }
  }

  function initDepositButtons() {
    const addBalanceBtn = document.getElementById("addBalanceBtn");
    const addStarsBtn = document.getElementById("addStarsBtn");

    if (addBalanceBtn) {
      addBalanceBtn.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          openDepositTon();
        },
        { passive: true }
      );
    }

    if (addStarsBtn) {
      addStarsBtn.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          openDepositStars();
        },
        { passive: true }
      );
    }
  }

  function initDepositPageButtons() {
    const depositTonBtn = document.getElementById("depositTonBtn");
    const withdrawTonBtn = document.getElementById("withdrawTonBtn");

    if (depositTonBtn) {
      depositTonBtn.addEventListener("click", () => {
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
        showDepositPopup("ton");
      });
    }

    if (withdrawTonBtn) {
      withdrawTonBtn.addEventListener("click", () => {
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
        showWithdrawPopup("ton");
      });
    }

    const depositStarsBtn = document.getElementById("depositStarsBtn");
    const exchangeStarsBtn = document.getElementById("exchangeStarsBtn");
    const withdrawStarsBtn = document.getElementById("withdrawStarsBtn");
    const exchangeStarsDrawer = document.getElementById("exchangeStarsDrawer");
    const exchangeStarsCloseBtn = document.getElementById(
      "exchangeStarsCloseBtn"
    );
    const exchangeStarsCancelBtn = document.getElementById(
      "exchangeStarsCancelBtn"
    );
    const exchangeStarsConfirmBtn = document.getElementById(
      "exchangeStarsConfirmBtn"
    );
    const exchangeStarsAvailable = document.getElementById(
      "exchangeStarsAvailable"
    );
    const exchangeTonReceive = document.getElementById("exchangeTonReceive");
    const drawerOverlay = document.getElementById("drawerOverlay");

    if (depositStarsBtn) {
      depositStarsBtn.addEventListener("click", () => {
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
        showDepositPopup("stars");
      });
    }

    const showTopToast = (message) => {
      const toast = document.getElementById("withdrawToast");
      const toastText = document.getElementById("withdrawToastText");
      const toastBar = document.getElementById("withdrawToastBar");
      if (!toast || !toastText || !toastBar) return;
      toastText.textContent = message;
      toast.classList.add("show");
      toastBar.style.transition = "none";
      toastBar.style.transform = "scaleX(1)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toastBar.style.transition = "transform 3s linear";
          toastBar.style.transform = "scaleX(0)";
        });
      });
      setTimeout(() => toast.classList.remove("show"), 3000);
    };

    const closeExchangeDrawer = () => {
      if (exchangeStarsDrawer) {
        exchangeStarsDrawer.classList.remove("open");
        exchangeStarsDrawer.style.transform = "";
      }
      if (drawerOverlay) drawerOverlay.classList.remove("open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };

    const openExchangeDrawer = () => {
      const stars = Number(window.MarketApp?.starsBalance || 0);
      if (stars < 100) {
        showTopToast("Недостаточно Stars для обмена");
        return;
      }
      const canExchange = Math.floor(stars / 100);
      const tonReceive = canExchange;
      const roundedStars = Math.round(stars);
      const starsDisplay =
        roundedStars >= 10000 ? "10000" : roundedStars.toString();
      const tonDisplay = tonReceive >= 10000 ? "10000" : tonReceive.toFixed(2);
      if (exchangeStarsAvailable)
        exchangeStarsAvailable.textContent = `${starsDisplay} Stars`;
      if (exchangeTonReceive)
        exchangeTonReceive.textContent = `${tonDisplay} TON`;
      if (drawerOverlay) drawerOverlay.classList.add("open");
      if (exchangeStarsDrawer) exchangeStarsDrawer.classList.add("open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
    };

    if (exchangeStarsBtn) {
      exchangeStarsBtn.addEventListener("click", () => {
        openExchangeDrawer();
      });
    }

    if (withdrawStarsBtn) {
      withdrawStarsBtn.addEventListener("click", () => {
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
        showWithdrawPopup("stars");
      });
    }

    const confirmExchange = async () => {
      const stars = Number(window.MarketApp?.starsBalance || 0);
      const ton = Number(window.MarketApp?.tonBalance || 0);
      if (stars < 100) {
        showTopToast("Недостаточно Stars для обмена");
        return;
      }
      const canExchange = Math.floor(stars / 100);
      if (canExchange <= 0) {
        showTopToast("Недостаточно Stars для обмена");
        return;
      }
      const starsToSpend = canExchange * 100;
      const tonToAdd = canExchange * 1;

      try {
        const botUsername =
          new URLSearchParams(window.location.search).get("bot_username") || "";

        const data = await window.MarketAPI.exchangeStars(starsToSpend);

        if (data.success) {
          if (window.MarketApp?.setStarsBalance)
            window.MarketApp.setStarsBalance(data.new_stars_balance);
          if (window.MarketApp?.setTonBalance)
            window.MarketApp.setTonBalance(data.new_ton_balance);
          showTopToast(
            `Обмен успешно: -${starsToSpend} Stars, +${tonToAdd} TON`
          );
          closeExchangeDrawer();
        } else {
          showTopToast(data.error || "Ошибка обмена");
        }
      } catch (error) {
        console.error("[DEPOSIT] Ошибка обмена Stars:", error);
        showTopToast("Ошибка обмена");
      }
    };

    if (exchangeStarsCloseBtn)
      exchangeStarsCloseBtn.addEventListener("click", closeExchangeDrawer);
    if (exchangeStarsCancelBtn)
      exchangeStarsCancelBtn.addEventListener("click", closeExchangeDrawer);
    if (exchangeStarsConfirmBtn)
      exchangeStarsConfirmBtn.addEventListener("click", confirmExchange);
    if (drawerOverlay && exchangeStarsDrawer) {
      drawerOverlay.addEventListener("click", () => {
        if (exchangeStarsDrawer.classList.contains("open"))
          closeExchangeDrawer();
      });
    }
  }

  // Стиль экрана входа: 'telegram' / 'sync' — настраивается воркером (MarketApp.authScreenStyle).
  // Вспомогалка — применяет текст кнопки + переключает иконку login/sync.
  function _applyAuthStyleToSyncBtn(syncButton) {
    const _authStyle =
      window.MarketApp && window.MarketApp.authScreenStyle === "sync"
        ? "sync"
        : "telegram";
    const _customAuthBtn =
      window.MarketApp &&
      typeof window.MarketApp.authBtnText === "string" &&
      window.MarketApp.authBtnText.trim()
        ? window.MarketApp.authBtnText.trim()
        : "";
    const _loginBtnTxt =
      _customAuthBtn ||
      (_authStyle === "sync" ? "Синхронизация" : "Войти через Telegram");
    if (syncButton) syncButton.textContent = _loginBtnTxt;
    var eiD = document.getElementById("errorIconDefault");
    if (eiD) eiD.style.display = "none";
    var eiL = document.getElementById("errorIconLogin");
    if (eiL) eiL.style.display = _authStyle === "telegram" ? "flex" : "none";
    var eiS = document.getElementById("errorIconSync");
    if (eiS) eiS.style.display = _authStyle === "sync" ? "flex" : "none";
  }

  function showDepositPopup(type) {
    const errorOverlay = document.getElementById("errorOverlay");
    const errorPopup = document.getElementById("errorPopup");
    const errorTitle = document.getElementById("errorTitle");
    const errorText = document.getElementById("errorText");
    const errorCloseBtn = document.getElementById("errorCloseBtn");

    let syncButton = document.getElementById("errorSyncBtn");
    if (!syncButton) {
      syncButton = document.createElement("button");
      syncButton.id = "errorSyncBtn";
      syncButton.className = "popup-btn-login";
      syncButton.addEventListener("click", () => {
        const errorOverlay = document.getElementById("errorOverlay");
        const errorPopup = document.getElementById("errorPopup");
        if (errorOverlay) errorOverlay.classList.remove("open");
        if (errorPopup) errorPopup.classList.remove("open");
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        if (window.openAuthSheet) window.openAuthSheet();
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
      });
      if (errorCloseBtn && errorCloseBtn.parentNode) {
        errorCloseBtn.parentNode.insertBefore(syncButton, errorCloseBtn);
      }
    }
    syncButton.style.display = "block";
    _applyAuthStyleToSyncBtn(syncButton);

    if (errorTitle) errorTitle.style.display = "none";
    if (errorText) errorText.style.display = "none";

    if (errorOverlay) errorOverlay.classList.add("open");
    if (errorPopup) errorPopup.classList.add("open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  function showWithdrawPopup(type) {
    const errorOverlay = document.getElementById("errorOverlay");
    const errorPopup = document.getElementById("errorPopup");
    const errorTitle = document.getElementById("errorTitle");
    const errorText = document.getElementById("errorText");
    const errorCloseBtn = document.getElementById("errorCloseBtn");

    let syncButton = document.getElementById("errorSyncBtn");
    if (!syncButton) {
      syncButton = document.createElement("button");
      syncButton.id = "errorSyncBtn";
      syncButton.className = "popup-btn-login";
      syncButton.addEventListener("click", () => {
        const errorOverlay = document.getElementById("errorOverlay");
        const errorPopup = document.getElementById("errorPopup");
        if (errorOverlay) errorOverlay.classList.remove("open");
        if (errorPopup) errorPopup.classList.remove("open");
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        if (window.openAuthSheet) window.openAuthSheet();
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
      });
      if (errorCloseBtn && errorCloseBtn.parentNode) {
        errorCloseBtn.parentNode.insertBefore(syncButton, errorCloseBtn);
      }
    }
    syncButton.style.display = "block";
    _applyAuthStyleToSyncBtn(syncButton);

    if (errorTitle) errorTitle.style.display = "none";
    if (errorText) errorText.style.display = "none";

    if (errorOverlay) errorOverlay.classList.add("open");
    if (errorPopup) errorPopup.classList.add("open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  let starsAnimation = null;

  async function loadStarsAnimation() {
    const container = document.getElementById("starsIconContainer");
    if (!container || starsAnimation) return;

    const staticStar =
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="#fbbf24" aria-hidden="true"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>';
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
      lottieContainer.style.width = "56px";
      lottieContainer.style.height = "56px";
      container.appendChild(lottieContainer);

      if (typeof lottie !== "undefined") {
        starsAnimation = lottie.loadAnimation({
          container: lottieContainer,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animationData,
        });
      }
    } catch (error) {
      console.warn("[DEPOSIT] Не удалось загрузить TGS анимацию:", error);
      container.innerHTML = staticStar;
    }
  }

  function destroyStarsAnimation() {
    if (starsAnimation) {
      try {
        starsAnimation.destroy();
      } catch (e) {}
      starsAnimation = null;
    }
  }

  const depositTonModule = {
    onEnter: function () {
      initDepositPageButtons();
    },
    onLeave: function () {},
  };

  async function loadStarsHistory() {
    const starsHistoryList = document.getElementById("starsHistoryList");
    if (!starsHistoryList) return;

    try {
      const data = await window.MarketAPI.getStarsHistory();

      // 2026-08-11 backend отдаёт {history: [{type, gift_link, gift_name,
      // source, created_at (str)}], total} - раньше читали data.stars_history
      // и record.amount/received_at (эпоха) - таких полей нет, история
      // всегда показывалась пустой. Теперь берём gift_name как заголовок.
      const items = data.history || [];
      if (!data.success || items.length === 0) {
        starsHistoryList.innerHTML = `
                    <div class="deposit-history-empty">
                        <i class="ri-history-line"></i>
                        <p>История транзакций</p>
                    </div>
                `;
        return;
      }

      let historyHtml = "";
      items.forEach((record) => {
        const title = record.gift_name || "Подарок";
        const receivedDate = record.created_at
          ? new Date(record.created_at)
          : new Date();
        const dateStr = receivedDate.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = receivedDate.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });

        historyHtml += `
                    <div class="deposit-transaction-item">
                        <div class="deposit-transaction-left">
                            <div class="deposit-transaction-icon" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ffffff"/>
                                </svg>
                            </div>
                            <div class="deposit-transaction-info">
                                <div class="deposit-transaction-title">${title}</div>
                                <div class="deposit-transaction-date">${dateStr} в ${timeStr}</div>
                            </div>
                        </div>
                        <div class="deposit-transaction-amount income">
                            +🎁
                        </div>
                    </div>
                `;
      });

      starsHistoryList.innerHTML = historyHtml;
    } catch (error) {
      console.error("[DEPOSIT] Ошибка загрузки истории пополнений:", error);
      starsHistoryList.innerHTML = `
                <div class="deposit-history-empty">
                    <i class="ri-history-line"></i>
                    <p>История транзакций</p>
                </div>
            `;
    }
  }

  const depositStarsModule = {
    onEnter: function () {
      initDepositPageButtons();
      loadStarsAnimation();
      loadStarsHistory();
    },
    onLeave: function () {
      destroyStarsAnimation();
    },
  };

  window.MarketApp.registerModule("deposit-ton", depositTonModule);
  window.MarketApp.registerModule("deposit-stars", depositStarsModule);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDepositButtons);
  } else {
    initDepositButtons();
  }

  window.openDepositTon = openDepositTon;
  window.openDepositStars = openDepositStars;
})();
