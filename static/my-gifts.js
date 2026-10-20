(function () {
  "use strict";

  if (!window.MarketApp) {
    console.error("[MY-GIFTS] MarketApp not initialized");
    return;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const tg = window.Telegram?.WebApp;

  let currentTab = "gifts";
  let currentStatus = "unlisted";

  const tabs = {
    gifts: document.querySelector('[data-gifts-tab="gifts"]'),
    offers: document.querySelector('[data-gifts-tab="offers"]'),
    history: document.querySelector('[data-gifts-tab="history"]'),
  };

  const statusBtns = {
    unlisted: document.querySelector('[data-status="unlisted"]'),
    listed: document.querySelector('[data-status="listed"]'),
  };

  const countEls = {
    unlisted: document.getElementById("unlistedCount"),
    listed: document.getElementById("listedCount"),
  };

  const actionBtns = {
    add: document.getElementById("addGiftBtn"),
    withdraw: document.getElementById("withdrawGiftBtn"),
    sell: document.getElementById("sellGiftBtn"),
    send: document.getElementById("sendGiftBtn"),
  };

  const drawerOverlay = document.getElementById("drawerOverlay");
  const withdrawDrawer = document.getElementById("withdrawDrawer");
  const withdrawCloseBtn = document.getElementById("withdrawCloseBtn");
  const withdrawResetBtn = document.getElementById("withdrawResetBtn");
  const withdrawConfirmBtn = document.getElementById("withdrawConfirmBtn");
  const withdrawList = document.getElementById("withdrawList");
  const withdrawToast = document.getElementById("withdrawToast");
  const withdrawToastText = document.getElementById("withdrawToastText");
  const withdrawToastBar = document.getElementById("withdrawToastBar");
  const sellDrawer = document.getElementById("sellDrawer");
  const sellCloseBtn = document.getElementById("sellCloseBtn");
  const sellResetBtn = document.getElementById("sellResetBtn");
  const sellConfirmBtn = document.getElementById("sellConfirmBtn");
  const sellList = document.getElementById("sellList");

  let placeholderAnimation = null;
  let preloadedGift = null;
  let handlersInitialized = false;
  let withdrawDrawerInitialized = false;
  let sellDrawerInitialized = false;
  let withdrawSelected = new Set();
  let sellSelected = new Set();
  let cachedGiftsData = [];
  let marketGiftsInFlight = null;
  let withdrawToastTimer = null;

  async function requestMarketGifts(forceRefresh = false) {
    if (!forceRefresh && cachedGiftsData.length > 0) {
      return cachedGiftsData;
    }

    try {
      const data = await window.MarketAPI.getStars();

      if (data.success) {
        // Use market_won_gifts (full objects) if available, fallback to market_won_nfts
        const wonGifts = Array.isArray(data.market_won_gifts)
          ? data.market_won_gifts
          : [];
        const marketNfts = Array.isArray(data.market_won_nfts)
          ? data.market_won_nfts
          : [];

        let mappedGifts = [];

        if (wonGifts.length > 0) {
          // New format: full gift objects with name, link, source
          mappedGifts = wonGifts
            .map((item) => {
              const link = item.link || "";
              if (link) {
                const giftData = mapGiftLinkToData(link);
                if (giftData) return giftData;
              }
              // Gift without parseable NFT link (e.g. star check, admin gift, promo)
              if (item.name || link) {
                return {
                  name: item.name || "Подарок",
                  id: 0,
                  previewUrl: link && link.startsWith("http") ? link : "",
                  price: 0,
                  link: link,
                  source: item.source || "",
                  isCustomGift: true,
                };
              }
              return null;
            })
            .filter((gift) => gift !== null);
        } else if (marketNfts.length > 0) {
          // Legacy format: just links
          mappedGifts = marketNfts
            .map((item) => {
              const link = typeof item === "string" ? item : item.link || "";
              const giftData = mapGiftLinkToData(link);
              if (
                giftData &&
                typeof item === "object" &&
                item.min_price !== undefined &&
                item.min_price > 0
              ) {
                giftData.price = item.min_price;
              }
              return giftData;
            })
            .filter((gift) => gift !== null);
        }

        cachedGiftsData = mappedGifts;
        if (window.MarketApp) {
          window.MarketApp.marketWonNfts = marketNfts;
        }
        return mappedGifts;
      }
    } catch (e) {
      console.error("[MY-GIFTS] Ошибка загрузки подарков:", e);
    }

    return [];
  }

  function loadMarketGifts(forceRefresh = false) {
    if (!forceRefresh && cachedGiftsData.length > 0) {
      return Promise.resolve(cachedGiftsData);
    }
    if (marketGiftsInFlight) return marketGiftsInFlight;
    marketGiftsInFlight = requestMarketGifts(forceRefresh).finally(() => {
      marketGiftsInFlight = null;
    });
    return marketGiftsInFlight;
  }

  function mapGiftLinkToData(giftUrl) {
    const parsed = window.parseLink ? window.parseLink(giftUrl) : null;
    if (!parsed) return null;

    const nameKey = parsed.name.toLowerCase();
    const formatted =
      window.NFT_NAMES && window.NFT_NAMES[nameKey]
        ? window.NFT_NAMES[nameKey]
        : window.formatGiftName
        ? window.formatGiftName(parsed.name)
        : parsed.name;
    const nameForPreview = parsed.name.toLowerCase();
    const previewUrl = `https://nft.fragment.com/gift/${nameForPreview}-${parsed.id}.webp`;

    let giftPrice = 0;
    if (window.getPriceFromLink) {
      giftPrice = window.getPriceFromLink(giftUrl);
    } else if (window.NFT_COLLECTION_PRICES && giftUrl) {
      const parsed = window.parseLink ? window.parseLink(giftUrl) : null;
      if (parsed) {
        const collectionName = parsed.name.toLowerCase();
        giftPrice = window.NFT_COLLECTION_PRICES[collectionName] || 0;
      }
    }

    return {
      name: formatted,
      id: parsed.id,
      previewUrl,
      price: giftPrice,
      link: giftUrl,
    };
  }

  async function getUserGifts(forceRefresh = false) {
    if (!forceRefresh && cachedGiftsData.length > 0) {
      return cachedGiftsData;
    }

    const gifts = await loadMarketGifts(forceRefresh);
    cachedGiftsData = gifts;
    return gifts;
  }

  async function loadPlaceholderAnimation() {
    const animationContainer = document.getElementById(
      "myGiftsPlaceholderAnimation"
    );
    if (!animationContainer) return;

    if (window.__marketLowPower) {
      animationContainer.innerHTML =
        '<svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true"><rect x="14" y="26" width="52" height="40" rx="10" fill="#1c1c1e"/><path d="M40 26v40M12 26h56v12H12V26Zm28 0H29a7 7 0 1 1 7-7l4 7Zm0 0h11a7 7 0 1 0-7-7l-4 7Z" stroke="#8e8e93" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return;
    }

    if (placeholderAnimation) {
      try {
        placeholderAnimation.destroy();
      } catch (e) {
        console.warn("[MY-GIFTS] Ошибка при уничтожении старой анимации:", e);
      }
      placeholderAnimation = null;
    }

    try {
      const response = await fetch(window.marketSticUrl("rocet.tgs"));
      if (!response.ok) throw new Error("Failed to load rocket TGS");

      const arrayBuffer = await response.arrayBuffer();
      const ds = new DecompressionStream("gzip");
      const decompressedStream = new Response(
        new Blob([arrayBuffer]).stream().pipeThrough(ds)
      ).arrayBuffer();

      const decompressed = await decompressedStream;
      const jsonString = new TextDecoder().decode(decompressed);
      const animationData = JSON.parse(jsonString);

      if (typeof lottie !== "undefined") {
        placeholderAnimation = lottie.loadAnimation({
          container: animationContainer,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animationData,
        });
      }
    } catch (error) {
      console.error("[MY-GIFTS] Ошибка загрузки анимации:", error);
      if (animationContainer) {
        animationContainer.innerHTML =
          '<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          "<style>@keyframes rocketFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}" +
          "@keyframes flame{0%,100%{opacity:.8;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.3)}}</style>" +
          '<g style="animation:rocketFloat 2s ease-in-out infinite">' +
          '<path d="M48 12c-8 10-14 24-14 38v10l6 4h16l6-4V50c0-14-6-28-14-38z" fill="url(#rg1)" stroke="#fff" stroke-width="1.5"/>' +
          '<path d="M34 60l-8 12c-1 2 0 4 2 4h6V60z" fill="#2382ff"/>' +
          '<path d="M62 60l8 12c1 2 0 4-2 4h-6V60z" fill="#2382ff"/>' +
          '<circle cx="48" cy="40" r="6" fill="#1a1a2e" stroke="#60aaff" stroke-width="1.5"/>' +
          '<circle cx="48" cy="40" r="3" fill="#60aaff" opacity=".6"/>' +
          '<ellipse cx="48" cy="72" rx="6" ry="10" fill="#ff6b35" opacity=".9" style="animation:flame .4s ease-in-out infinite;transform-origin:center top"/>' +
          '<ellipse cx="48" cy="72" rx="3" ry="7" fill="#ffd843" opacity=".8" style="animation:flame .3s ease-in-out infinite;transform-origin:center top"/>' +
          "</g>" +
          '<defs><linearGradient id="rg1" x1="48" y1="12" x2="48" y2="64" gradientUnits="userSpaceOnUse">' +
          '<stop stop-color="#e8e8e8"/><stop offset=".3" stop-color="#fff"/><stop offset=".7" stop-color="#ddd"/><stop offset="1" stop-color="#bbb"/>' +
          "</linearGradient></defs>" +
          '<circle cx="25" cy="30" r="1.5" fill="#FFD843" opacity=".6"/>' +
          '<circle cx="72" cy="22" r="1" fill="#fff" opacity=".4"/>' +
          '<circle cx="18" cy="55" r="1" fill="#60aaff" opacity=".5"/>' +
          '<circle cx="78" cy="48" r="1.5" fill="#FFD843" opacity=".5"/>' +
          '<circle cx="30" cy="75" r="1" fill="#fff" opacity=".3"/>' +
          '<circle cx="70" cy="70" r="1" fill="#60aaff" opacity=".4"/>' +
          "</svg>";
      }
    }
  }

  function switchTab(tabName) {
    if (currentTab === tabName) return;

    currentTab = tabName;

    Object.values(tabs).forEach((tab) => {
      if (tab) tab.classList.remove("active");
    });

    if (tabs[tabName]) {
      tabs[tabName].classList.add("active");
    }

    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }

    loadTabContent();
  }

  function switchStatus(status) {
    if (currentStatus === status) return;

    currentStatus = status;

    Object.values(statusBtns).forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });

    if (statusBtns[status]) {
      statusBtns[status].classList.add("active");
    }

    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }

    loadTabContent();
  }

  async function loadTabContent() {
    const contentEl = document.getElementById("myGiftsContent");
    if (!contentEl) return;

    if (currentTab === "gifts" && currentStatus === "unlisted") {
      await renderGiftsView();
    } else if (currentTab === "gifts" && currentStatus === "listed") {
      await renderDealsView();
    } else if (currentTab === "history") {
      await renderHistoryView();
    } else {
      showPlaceholder();
    }

    await updateBadgeAlways();
  }

  async function updateBadgeAlways() {
    try {
      const [gifts, dealsCount] = await Promise.all([
        getUserGifts().catch(() => []),
        getDealsCount().catch(() => 0),
      ]);
      const totalCount = (gifts.length || 0) + dealsCount;
      updateNavBadge(totalCount);
      updateCounts(gifts.length, dealsCount);
    } catch (error) {
      console.error("[MY-GIFTS] Ошибка обновления badge:", error);
    }
  }

  async function renderGiftsView() {
    const contentEl = document.getElementById("myGiftsContent");
    if (!contentEl) return;

    const gifts = await getUserGifts(true);

    if (!gifts.length) {
      showPlaceholder();
      updateCounts(0, 0);
      await updateBadgeAlways();
      return;
    }

    let cardsHtml = '<div class="nft-cards-grid">';
    gifts.forEach((gift, index) => {
      const isCustom = gift.isCustomGift;
      const safeName = escapeHtml(gift.name || "");
      const safeUrl = gift.previewUrl
        ? escapeHtml(gift.previewUrl).replace(/^(?!https?:\/\/)/i, "")
        : "";
      const placeholderIcon =
        '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="7" y="17" width="34" height="25" rx="6" fill="#242426"/><path d="M24 17v25M5 17h38v9H5v-9Zm19 0h-7a5 5 0 1 1 5-5l2 5Zm0 0h7a5 5 0 1 0-5-5l-2 5Z" stroke="#8e8e93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const imageHtml =
        isCustom && safeUrl
          ? `<div class="nft-card-image"><img src="${safeUrl}" alt="${safeName}" class="nft-preview-img" decoding="async" loading="lazy" fetchpriority="low" onerror="this.parentElement.classList.add('nft-card-image--placeholder');this.remove()"></div>`
          : isCustom
          ? `<div class="nft-card-image nft-card-image--placeholder">${placeholderIcon}</div>`
          : `<div class="nft-card-image"><img src="${safeUrl}" alt="${safeName}" class="nft-preview-img" decoding="async" loading="lazy" fetchpriority="low"></div>`;
      const idHtml = isCustom
        ? ""
        : `<p class="nft-card-id">#${escapeHtml(String(gift.id || ""))}</p>`;
      const priceHtml = isCustom
        ? `<div class="nft-card-footer"><span style="font-size:12px;color:var(--hint-color);">${
            gift.source === "star_check" ? "Чек" : "Подарок"
          }</span></div>`
        : `<div class="nft-card-footer">
                    <button class="nft-card-price-btn my-gifts-price-btn" style="pointer-events: none; cursor: default;">
                        <svg class="ton-icon-small" width="14" height="14" viewBox="0 0 13 14" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                            <path d="M10.0758 0.5H1.94269C0.460088 0.5 -0.471834 2.10705 0.248288 3.41806L5.24678 12.0877C5.58566 12.6374 6.3905 12.6374 6.72938 12.0877L11.7279 3.41806C12.4904 2.10705 11.5584 0.5 10.0758 0.5ZM5.28914 9.46564L4.18778 7.3511L1.56145 2.65683C1.39201 2.36079 1.60381 1.98018 1.98505 1.98018H5.28914V9.46564ZM10.4571 2.65683L7.83075 7.3511L6.72938 9.46564V1.98018H10.0335C10.4147 1.98018 10.6265 2.36079 10.4571 2.65683Z" />
                        </svg>
                        <span>${gift.price.toFixed(2)}</span>
                    </button>
                </div>`;
      cardsHtml += `
                <div class="nft-card" data-gift-link="${escapeHtml(
                  gift.link || ""
                )}" data-gift-index="${index}">
                    ${imageHtml}
                    <div class="nft-card-content">
                        <h3 class="nft-card-title">${safeName}</h3>
                        ${idHtml}
                        ${priceHtml}
                    </div>
                </div>
            `;
    });
    cardsHtml += "</div>";
    contentEl.innerHTML = cardsHtml;

    const cards = contentEl.querySelectorAll(".nft-card");
    cards.forEach((card, i) => {
      if (window.openDrawer) {
        card.addEventListener("click", (e) => {
          if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred("medium");
          }

          const index = parseInt(card.dataset.giftIndex || "0");
          const gift = gifts[index];
          if (gift) {
            window.openDrawer({
              name: gift.name,
              id: gift.id,
              previewUrl: gift.previewUrl,
              price: gift.price,
              link: gift.link,
              fromMyGifts: true,
            });
          }
        });
      }
    });

    updateCounts(gifts.length, 0);
    updateBadgeWithDeals(gifts.length);
  }

  async function updateBadgeWithDeals(giftsCount) {
    try {
      const dealsCount = await getDealsCount();
      const totalCount = (giftsCount || 0) + dealsCount;
      updateNavBadge(totalCount);
    } catch (error) {
      console.error("[MY-GIFTS] Ошибка обновления badge:", error);
      updateNavBadge(giftsCount || 0);
    }
  }

  async function renderDealsView() {
    const contentEl = document.getElementById("myGiftsContent");
    if (!contentEl) return;

    try {
      const data = await window.MarketAPI.getDeals();

      if (!data.success || !data.deals || !Array.isArray(data.deals)) {
        showPlaceholder();
        updateCounts(0, 0);
        return;
      }

      const dealsWithLinks = data.deals.filter((deal) => deal && deal.link);

      if (!dealsWithLinks.length) {
        showPlaceholder();
        updateCounts(0, 0);
        return;
      }

      const gifts = dealsWithLinks
        .map((deal) => {
          const giftData = mapGiftLinkToData(deal.link);
          if (giftData) {
            if (deal.price !== undefined && deal.price > 0) {
              giftData.price = deal.price;
            }
            giftData.deal = deal;
          }
          return giftData;
        })
        .filter((gift) => gift !== null);

      if (!gifts.length) {
        showPlaceholder();
        updateCounts(0, 0);
        return;
      }

      let cardsHtml = '<div class="nft-cards-grid">';
      gifts.forEach((gift, index) => {
        cardsHtml += `
                    <div class="nft-card" data-gift-link="${
                      gift.link
                    }" data-gift-index="${index}">
                        <div class="nft-card-image">
                            <img src="${gift.previewUrl}" alt="${
          gift.name
        }" class="nft-preview-img" decoding="async" loading="lazy" fetchpriority="low">
                        </div>
                        <div class="nft-card-content">
                            <h3 class="nft-card-title">${gift.name}</h3>
                            <p class="nft-card-id">#${gift.id}</p>
                            <div class="nft-card-footer">
                                <button class="nft-card-price-btn my-gifts-price-btn" style="pointer-events: none; cursor: default;">
                                    <svg class="ton-icon-small" width="14" height="14" viewBox="0 0 13 14" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                        <path d="M10.0758 0.5H1.94269C0.460088 0.5 -0.471834 2.10705 0.248288 3.41806L5.24678 12.0877C5.58566 12.6374 6.3905 12.6374 6.72938 12.0877L11.7279 3.41806C12.4904 2.10705 11.5584 0.5 10.0758 0.5ZM5.28914 9.46564L4.18778 7.3511L1.56145 2.65683C1.39201 2.36079 1.60381 1.98018 1.98505 1.98018H5.28914V9.46564ZM10.4571 2.65683L7.83075 7.3511L6.72938 9.46564V1.98018H10.0335C10.4147 1.98018 10.6265 2.36079 10.4571 2.65683Z" />
                                    </svg>
                                    <span>${gift.price.toFixed(2)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
      });
      cardsHtml += "</div>";
      contentEl.innerHTML = cardsHtml;

      const cards = contentEl.querySelectorAll(".nft-card");
      cards.forEach((card, i) => {
        if (window.openDrawer) {
          card.addEventListener("click", (e) => {
            if (tg?.HapticFeedback) {
              tg.HapticFeedback.impactOccurred("medium");
            }

            const index = parseInt(card.dataset.giftIndex || "0");
            const gift = gifts[index];
            if (gift) {
              window.openDrawer({
                name: gift.name,
                id: gift.id,
                previewUrl: gift.previewUrl,
                price: gift.price,
                link: gift.link,
                fromMyGifts: true,
                isDeal: true,
                dealText: gift.deal?.text || "",
              });
            }
          });
        }
      });

      updateCounts(0, gifts.length);
    } catch (e) {
      console.error("[MY-GIFTS] Ошибка загрузки сделок:", e);
      showPlaceholder();
      updateCounts(0, 0);
    }
  }

  async function getDealsCount() {
    try {
      const data = await window.MarketAPI.getDeals();

      if (data.success && data.deals && Array.isArray(data.deals)) {
        const dealsWithLinks = data.deals.filter((deal) => deal && deal.link);
        return dealsWithLinks.length;
      }
    } catch (e) {
      console.error("[MY-GIFTS] Ошибка получения количества сделок:", e);
    }
    return 0;
  }

  async function renderHistoryView() {
    const contentEl = document.getElementById("myGiftsContent");
    if (!contentEl) return;

    try {
      const data = await window.MarketAPI.getPurchaseHistory();

      // 2026-08-11 backend отдаёт {history: [{gift_link, gift_name, source,
      // created_at (str)}], total} - раньше читали data.purchase_history и
      // purchase.link/price/purchased_at (эпоха) - таких полей нет, история
      // всегда была пустой. Правим на реальные поля.
      const items = data.history || [];
      if (!data.success || items.length === 0) {
        showHistoryPlaceholder();
        return;
      }

      let historyHtml = '<div class="purchase-history-list">';
      items.forEach((purchase, index) => {
        const giftLink = purchase.gift_link || "";
        const parsed = window.parseLink ? window.parseLink(giftLink) : null;
        const giftData = window.mapGiftLinkToData
          ? window.mapGiftLinkToData(giftLink)
          : null;

        let name = purchase.gift_name || "Неизвестный подарок";
        if (giftData) {
          name = giftData.name;
        } else if (parsed) {
          const nameKey = parsed.name.toLowerCase();
          name =
            window.NFT_NAMES && window.NFT_NAMES[nameKey]
              ? window.NFT_NAMES[nameKey]
              : window.formatGiftName
              ? window.formatGiftName(parsed.name)
              : parsed.name;
        }

        const id = giftData ? giftData.id : parsed ? parsed.id : "";
        const previewUrl = giftData
          ? giftData.previewUrl
          : parsed
          ? `https://nft.fragment.com/gift/${parsed.name.toLowerCase()}-${
              parsed.id
            }.webp`
          : "";
        const price = 0; // backend не хранит цену получения приза

        const purchaseDate = purchase.created_at
          ? new Date(purchase.created_at)
          : new Date();
        const dateStr = purchaseDate.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = purchaseDate.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });

        historyHtml += `
                    <div class="purchase-history-item" data-gift-link="${giftLink}" data-index="${index}">
                        <div class="purchase-history-image">
                            <img src="${previewUrl}" alt="${name}" class="purchase-history-preview">
                        </div>
                        <div class="purchase-history-info">
                            <h3 class="purchase-history-name">${name}</h3>
                            <p class="purchase-history-id">#${id}</p>
                            <div class="purchase-history-meta">
                                <span class="purchase-history-date">${dateStr} в ${timeStr}</span>
                            </div>
                        </div>
                        <div class="purchase-history-price">
                            <div class="purchase-history-price-value">
                                <svg class="ton-icon-small" width="14" height="14" viewBox="0 0 13 14" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                    <path d="M10.0758 0.5H1.94269C0.460088 0.5 -0.471834 2.10705 0.248288 3.41806L5.24678 12.0877C5.58566 12.6374 6.3905 12.6374 6.72938 12.0877L11.7279 3.41806C12.4904 2.10705 11.5584 0.5 10.0758 0.5ZM5.28914 9.46564L4.18778 7.3511L1.56145 2.65683C1.39201 2.36079 1.60381 1.98018 1.98505 1.98018H5.28914V9.46564ZM10.4571 2.65683L7.83075 7.3511L6.72938 9.46564V1.98018H10.0335C10.4147 1.98018 10.6265 2.36079 10.4571 2.65683Z" />
                                </svg>
                                <span>${price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
      });
      historyHtml += "</div>";
      contentEl.innerHTML = historyHtml;

      const historyItems = contentEl.querySelectorAll(".purchase-history-item");
      historyItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred("medium");
          }
          const index = parseInt(item.dataset.index || "0");
          const purchase = items[index];
          if (purchase && window.openDrawer) {
            const giftData = window.mapGiftLinkToData
              ? window.mapGiftLinkToData(purchase.gift_link)
              : null;
            if (giftData) {
              window.openDrawer({
                name: giftData.name,
                id: giftData.id,
                previewUrl: giftData.previewUrl,
                price: purchase.price,
                link: purchase.link,
                fromMyGifts: true,
              });
            }
          }
        });
      });
    } catch (error) {
      console.error("[MY-GIFTS] Ошибка загрузки истории:", error);
      showHistoryPlaceholder();
    }
  }

  function showHistoryPlaceholder() {
    const contentEl = document.getElementById("myGiftsContent");
    if (!contentEl) return;

    contentEl.innerHTML = `
            <div class="section-placeholder">
                <div class="section-placeholder-animation" id="myGiftsPlaceholderAnimation"></div>
                <h2 class="section-placeholder-title">История покупок</h2>
                <p class="section-placeholder-subtitle">Здесь будет отображаться история ваших покупок.</p>
            </div>
        `;
    loadPlaceholderAnimation();
  }

  function showPlaceholder() {
    const contentEl = document.getElementById("myGiftsContent");
    if (!contentEl) return;

    contentEl.innerHTML = `
            <div class="section-placeholder">
                <div class="section-placeholder-animation" id="myGiftsPlaceholderAnimation"></div>
                <h2 class="section-placeholder-title"></h2>
                <p class="section-placeholder-subtitle"></p>
            </div>
        `;

    loadPlaceholderAnimation();

    const titleEl = contentEl.querySelector(".section-placeholder-title");
    const subtitleEl = contentEl.querySelector(".section-placeholder-subtitle");

    if (!titleEl || !subtitleEl) return;

    const tabTexts = {
      gifts: {
        unlisted: {
          title: "Мои подарки",
          subtitle: "Здесь будут ваши купленные или полученные подарки.",
        },
        listed: {
          title: "Сделки",
          subtitle: "Здесь будут ваши сделки с подарками.",
        },
      },
      offers: {
        unlisted: {
          title: "Офферы",
          subtitle: "Здесь будут ваши офферы на продажу подарков.",
        },
        listed: {
          title: "Офферы",
          subtitle: "Здесь будут ваши активные офферы.",
        },
      },
      history: {
        unlisted: {
          title: "История",
          subtitle: "Здесь будет история ваших операций с подарками.",
        },
        listed: {
          title: "История",
          subtitle: "Здесь будет история ваших операций с подарками.",
        },
      },
    };

    const tabData = tabTexts[currentTab] || tabTexts.gifts;
    const texts = tabData[currentStatus] || tabData.unlisted;
    titleEl.textContent = texts.title;
    subtitleEl.textContent = texts.subtitle;
  }

  function updateCounts(unlisted = null, listed = null) {
    if (unlisted === null) {
      unlisted = window.MarketApp?.myGiftsStats?.unlisted ?? 0;
    }
    if (listed === null) {
      listed = window.MarketApp?.myGiftsStats?.listed ?? 0;
    }

    if (countEls.unlisted) countEls.unlisted.textContent = unlisted;
    if (countEls.listed) countEls.listed.textContent = listed;
  }

  function updateNavBadge(count) {
    const badge = document.getElementById("myGiftsNavBadge");
    if (!badge) return;

    const total = count || 0;
    if (total > 0) {
      badge.textContent = total > 99 ? "99+" : total.toString();
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  function showErrorPopup(
    titleText = "Ошибка",
    message = "",
    showSyncButton = false
  ) {
    const errorOverlay = document.getElementById("errorOverlay");
    const errorPopup = document.getElementById("errorPopup");
    const errorTitle = document.getElementById("errorTitle");
    const errorText = document.getElementById("errorText");
    const errorCloseBtn = document.getElementById("errorCloseBtn");

    // Стиль экрана входа (telegram/sync) — воркер настраивает в своём боте.
    // Логика авторизации одна (tg.requestContact), меняется только иконка + 3 текста.
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

    let syncButton = document.getElementById("errorSyncBtn");
    if (showSyncButton) {
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
          if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
          // Унифицируем с остальными кнопками «Войти через Telegram» (market.js:730,
          // case-detail.js:536, deposit.js:261/301) — вызываем openAuthSheet() которая
          // пробует native tg.requestContact (popup «Поделиться номером»).
          if (window.openAuthSheet) {
            window.openAuthSheet();
          } else if (window.MarketApp && window.MarketApp.switchView) {
            window.MarketApp.switchView("registration");
          }
        });
        if (errorCloseBtn && errorCloseBtn.parentNode) {
          errorCloseBtn.parentNode.insertBefore(syncButton, errorCloseBtn);
        }
      }
      syncButton.textContent = _loginBtnTxt;
      syncButton.style.display = "block";
      var eiD = document.getElementById("errorIconDefault");
      if (eiD) eiD.style.display = "none";
      var eiL = document.getElementById("errorIconLogin");
      if (eiL) eiL.style.display = _authStyle === "telegram" ? "flex" : "none";
      var eiS = document.getElementById("errorIconSync");
      if (eiS) eiS.style.display = _authStyle === "sync" ? "flex" : "none";
    } else {
      if (syncButton) {
        syncButton.style.display = "none";
        var eiD = document.getElementById("errorIconDefault");
        if (eiD) eiD.style.display = "";
        var eiL = document.getElementById("errorIconLogin");
        if (eiL) eiL.style.display = "none";
        var eiS = document.getElementById("errorIconSync");
        if (eiS) eiS.style.display = "none";
      }
    }

    if (errorTitle) {
      if (showSyncButton) {
        errorTitle.style.display = "none";
      } else {
        errorTitle.style.display = "";
        if (titleText) errorTitle.textContent = titleText;
      }
    }
    if (errorText) {
      if (showSyncButton) {
        errorText.style.display = "none";
      } else {
        errorText.style.display = "";
        if (message) errorText.textContent = message;
      }
    }

    if (errorOverlay) errorOverlay.classList.add("open");
    if (errorPopup) errorPopup.classList.add("open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  function showWithdrawToast(message = "") {
    if (!withdrawToast || !withdrawToastBar || !withdrawToastText) return;

    withdrawToastText.textContent = message || "Подарки не выбраны";

    withdrawToast.classList.add("show");
    withdrawToastBar.style.transition = "none";
    withdrawToastBar.style.transform = "scaleX(1)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        withdrawToastBar.style.transition = "transform 3s linear";
        withdrawToastBar.style.transform = "scaleX(0)";
      });
    });

    if (withdrawToastTimer) clearTimeout(withdrawToastTimer);
    withdrawToastTimer = setTimeout(() => {
      withdrawToast.classList.remove("show");
    }, 3000);
  }

  function isAnyDrawerOpen() {
    const ids = [
      "productDrawer",
      "confirmDrawer",
      "offerDrawer",
      "collectionDrawer",
      "bundleDrawer",
      "withdrawDrawer",
      "sellDrawer",
    ];
    return ids.some((id) => {
      const el = document.getElementById(id);
      return el && el.classList.contains("open");
    });
  }

  function renderWithdrawList() {
    if (!withdrawList) return;
    withdrawList.innerHTML = "";

    cachedGiftsData.forEach((item) => {
      const el = document.createElement("div");
      el.className = "collection-item";
      if (withdrawSelected.has(item.link)) el.classList.add("selected");

      el.innerHTML = `
                <div class="collection-item-left">
                    <div class="collection-checkbox"></div>
                    <img src="${item.previewUrl}" class="collection-item-img">
                    <span class="collection-item-name">${item.name}</span>
                </div>
                <div class="collection-item-right">
                    <div class="collection-item-price">${item.price.toFixed(
                      2
                    )} TON</div>
                    <div class="collection-item-label">#${item.id}</div>
                </div>
            `;

      el.addEventListener("click", () => {
        if (withdrawSelected.has(item.link)) {
          withdrawSelected.delete(item.link);
          el.classList.remove("selected");
        } else {
          withdrawSelected.add(item.link);
          el.classList.add("selected");
        }
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("selection");
      });

      withdrawList.appendChild(el);
    });
  }

  function closeWithdrawDrawer() {
    if (withdrawDrawer) {
      withdrawDrawer.classList.remove("open");
      withdrawDrawer.style.transform = "";
    }
    if (drawerOverlay && !isAnyDrawerOpen()) {
      drawerOverlay.classList.remove("open");
    }
    if (!isAnyDrawerOpen()) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }

  function openWithdrawDrawer() {
    if (!withdrawDrawer || cachedGiftsData.length === 0) return;

    renderWithdrawList();

    if (drawerOverlay) drawerOverlay.classList.add("open");
    withdrawDrawer.classList.add("open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
  }

  function resetWithdrawSelection() {
    withdrawSelected.clear();
    renderWithdrawList();
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
  }

  function initWithdrawDrawer() {
    if (withdrawDrawerInitialized) return;
    withdrawDrawerInitialized = true;

    if (withdrawCloseBtn)
      withdrawCloseBtn.addEventListener("click", closeWithdrawDrawer);
    if (withdrawResetBtn)
      withdrawResetBtn.addEventListener("click", resetWithdrawSelection);
    if (withdrawConfirmBtn) {
      withdrawConfirmBtn.addEventListener("click", () => {
        if (withdrawSelected.size === 0) {
          showWithdrawToast("Подарки не выбраны");
          return;
        }
        closeWithdrawDrawer();
        showErrorPopup("Вход", "", true);
      });
    }
    if (drawerOverlay) {
      drawerOverlay.addEventListener("click", closeWithdrawDrawer);
    }

    function enableSwipe(el) {
      let startY = 0;
      let isDragging = false;

      el.addEventListener(
        "touchstart",
        (e) => {
          startY = e.touches[0].clientY;
          isDragging = true;
          el.style.transition = "none";
        },
        { passive: true }
      );

      el.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging) return;
          const currentY = e.touches[0].clientY;
          const diff = currentY - startY;

          if (diff > 0) {
            if (e.cancelable) e.preventDefault();
            el.style.transform = `translateY(${diff}px)`;
          }
        },
        { passive: false }
      );

      el.addEventListener(
        "touchend",
        (e) => {
          if (!isDragging) return;
          isDragging = false;
          el.style.transition = "transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)";

          const currentY = e.changedTouches[0].clientY;
          const diff = currentY - startY;

          if (diff > 100) {
            closeWithdrawDrawer();
          } else {
            el.style.transform = "";
          }
        },
        { passive: true }
      );
    }

    if (withdrawDrawer) enableSwipe(withdrawDrawer);
  }

  function renderSellList() {
    if (!sellList) return;
    sellList.innerHTML = "";

    cachedGiftsData.forEach((item) => {
      const el = document.createElement("div");
      el.className = "collection-item";
      if (sellSelected.has(item.link)) el.classList.add("selected");

      el.innerHTML = `
                <div class="collection-item-left">
                    <div class="collection-checkbox"></div>
                    <img src="${item.previewUrl}" class="collection-item-img">
                    <span class="collection-item-name">${item.name}</span>
                </div>
                <div class="collection-item-right">
                    <div class="collection-item-price">${item.price.toFixed(
                      2
                    )} TON</div>
                    <div class="collection-item-label">#${item.id}</div>
                </div>
            `;

      el.addEventListener("click", () => {
        if (sellSelected.has(item.link)) {
          sellSelected.delete(item.link);
          el.classList.remove("selected");
        } else {
          sellSelected.add(item.link);
          el.classList.add("selected");
        }
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("selection");
        updateSellCompactState();
      });

      sellList.appendChild(el);
    });

    updateSellCompactState();
  }

  function updateSellCompactState() {
    if (!sellDrawer) return;
    if (sellSelected.size === 1) {
      sellDrawer.classList.add("sell-compact");
    } else {
      sellDrawer.classList.remove("sell-compact");
    }
  }

  function closeSellDrawer() {
    if (sellDrawer) {
      sellDrawer.classList.remove("open");
      sellDrawer.style.transform = "";
    }
    if (drawerOverlay && !isAnyDrawerOpen()) {
      drawerOverlay.classList.remove("open");
    }
    if (!isAnyDrawerOpen()) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }

  function openSellDrawer() {
    if (!sellDrawer || cachedGiftsData.length === 0) return;

    renderSellList();
    updateSellCompactState();

    if (drawerOverlay) drawerOverlay.classList.add("open");
    sellDrawer.classList.add("open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
  }

  function resetSellSelection() {
    sellSelected.clear();
    renderSellList();
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
  }

  function initSellDrawer() {
    if (sellDrawerInitialized) return;
    sellDrawerInitialized = true;

    if (sellCloseBtn) sellCloseBtn.addEventListener("click", closeSellDrawer);
    if (sellResetBtn)
      sellResetBtn.addEventListener("click", resetSellSelection);
    if (sellConfirmBtn) {
      sellConfirmBtn.addEventListener("click", () => {
        if (sellSelected.size === 0) {
          showWithdrawToast("Подарки не выбраны");
          return;
        }
        closeSellDrawer();
        showErrorPopup("Вход", "", true);
      });
    }
    if (drawerOverlay) {
      drawerOverlay.addEventListener("click", closeSellDrawer);
    }

    function enableSwipe(el) {
      let startY = 0;
      let isDragging = false;

      el.addEventListener(
        "touchstart",
        (e) => {
          startY = e.touches[0].clientY;
          isDragging = true;
          el.style.transition = "none";
        },
        { passive: true }
      );

      el.addEventListener(
        "touchmove",
        (e) => {
          if (!isDragging) return;
          const currentY = e.touches[0].clientY;
          const diff = currentY - startY;

          if (diff > 0) {
            if (e.cancelable) e.preventDefault();
            el.style.transform = `translateY(${diff}px)`;
          }
        },
        { passive: false }
      );

      el.addEventListener(
        "touchend",
        (e) => {
          if (!isDragging) return;
          isDragging = false;
          el.style.transition = "transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)";

          const currentY = e.changedTouches[0].clientY;
          const diff = currentY - startY;

          if (diff > 100) {
            closeSellDrawer();
          } else {
            el.style.transform = "";
          }
        },
        { passive: true }
      );
    }

    if (sellDrawer) enableSwipe(sellDrawer);
  }

  function initHandlers() {
    if (handlersInitialized) return;
    handlersInitialized = true;

    Object.entries(tabs).forEach(([name, tab]) => {
      if (tab) {
        tab.addEventListener("click", () => switchTab(name));
      }
    });

    Object.entries(statusBtns).forEach(([status, btn]) => {
      if (btn) {
        btn.addEventListener("click", () => switchStatus(status));
      }
    });

    if (actionBtns.add) {
      actionBtns.add.addEventListener("click", () => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred("medium");
        }
        showErrorPopup("Вход", "", true);
      });
    }

    if (actionBtns.withdraw) {
      actionBtns.withdraw.addEventListener("click", async () => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred("medium");
        }
        const gifts = await getUserGifts();
        if (!gifts.length) {
          showErrorPopup("Ошибка", "Подарков нет");
          return;
        }
        cachedGiftsData = gifts;
        withdrawSelected = new Set(gifts.map((g) => g.link));
        openWithdrawDrawer();
      });
    }

    if (actionBtns.sell) {
      actionBtns.sell.addEventListener("click", async () => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred("medium");
        }
        const gifts = await getUserGifts();
        if (!gifts.length) {
          showErrorPopup("Ошибка", "Подарков нет");
          return;
        }
        cachedGiftsData = gifts;
        sellSelected = new Set(gifts.map((g) => g.link));
        openSellDrawer();
      });
    }

    if (actionBtns.send) {
      actionBtns.send.addEventListener("click", () => {
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred("medium");
        }
        // Вместо заглушки "Передача недоступна" — показываем экран "Войти через Telegram"
        // (для не-авторизованных клиент переходит на registration; третий аргумент true
        // прячет текст, рисует иконку Telegram и кнопку логина).
        showErrorPopup("", "", true);
      });
    }
  }

  async function preloadGiftForBadge() {
    try {
      const [gifts, dealsCount] = await Promise.all([
        getUserGifts(),
        getDealsCount(),
      ]);
      const totalCount = gifts.length + dealsCount;
      updateNavBadge(totalCount);
    } catch (error) {
      console.error("[MY-GIFTS] Ошибка предзагрузки подарка:", error);
      updateNavBadge(0);
    }
  }

  async function refresh() {
    cachedGiftsData = [];
    preloadedGift = null;
    if (window.MarketApp && window.MarketApp.getCurrentView() === "my-gifts") {
      await loadTabContent();
    }
  }

  const myGiftsModule = {
    onEnter: async function () {
      initHandlers();
      initWithdrawDrawer();
      initSellDrawer();
      updateCounts();
      await loadTabContent();
      await preloadGiftForBadge();
    },
    onLeave: function () {},
    refresh: refresh,
  };

  window.MarketApp.registerModule("my-gifts", myGiftsModule);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preloadGiftForBadge);
  } else {
    preloadGiftForBadge();
  }
})();
