(function () {
  "use strict";

  const urlParams = new URLSearchParams(window.location.search);
  const botIdFromUrl = urlParams.get("bot_id");
  if (botIdFromUrl) {
    window.botId = String(botIdFromUrl).trim();
  }
  const botUsernameFromUrl = urlParams.get("bot_username");
  if (botUsernameFromUrl && !window.botId) {
    window.botUsername = String(botUsernameFromUrl).trim().replace(/^@/, "");
  }

  // Хранилище активных AbortController для отмены запросов
  const activeControllers = new Map();

  function getValidBotId() {
    return (window.botId && String(window.botId).trim()) || null;
  }

  function getBotUsername() {
    return (window.botUsername && String(window.botUsername).trim()) || null;
  }

  // Отмена запроса по ключу
  function abortRequest(key) {
    const controller = activeControllers.get(key);
    if (controller) {
      controller.abort();
      activeControllers.delete(key);
    }
  }

  // Отмена всех активных запросов
  function abortAllRequests() {
    activeControllers.forEach((controller, key) => {
      controller.abort();
    });
    activeControllers.clear();
  }

  function apiUrl(endpoint) {
    const origin =
      (typeof window !== "undefined" && window.MARKET_API_ORIGIN) || "";
    const o = String(origin).trim().replace(/\/$/, "");
    if (o) {
      const path = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
      return o + path;
    }
    if (typeof window !== "undefined" && endpoint.indexOf("/market/") === 0) {
      const rest = endpoint.slice("/market/".length);
      try {
        return new URL(rest, window.location.href).href;
      } catch (e) {
        return endpoint;
      }
    }
    return endpoint;
  }

  async function apiRequest(
    endpoint,
    method = "POST",
    body = null,
    options = {}
  ) {
    const tg = window.Telegram?.WebApp;
    const runtime = window.WebAppRuntime;
    const botId = getValidBotId();
    const botUsername = getBotUsername();

    // Создаём AbortController если нужна отмена
    let controller = null;
    let signal = null;

    if (options.abortKey) {
      // Отменяем предыдущий запрос с тем же ключом
      abortRequest(options.abortKey);
      controller = new AbortController();
      signal = controller.signal;
      activeControllers.set(options.abortKey, controller);
    }

    const requestBody = {
      initData: runtime?.getInitData() || tg?.initData || "",
      bot_id: botId || "",
    };

    if (botUsername && !botId) {
      requestBody.bot_username = botUsername;
    }

    if (body) {
      Object.assign(requestBody, body);
      requestBody.bot_id = botId || "";
      requestBody.initData = runtime?.getInitData() || tg?.initData || "";
      if (botUsername && !botId) {
        requestBody.bot_username = botUsername;
      }
    }

    try {
      const fetchOptions = {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      };

      if (signal) {
        fetchOptions.signal = signal;
      }
      fetchOptions.timeoutMs = Number(options.timeoutMs || 20000);

      const response = await fetch(apiUrl(endpoint), fetchOptions);

      const ct = response.headers.get("content-type") || "";
      if (!response.ok) {
        let errMsg = "HTTP " + response.status;
        try {
          if (ct.includes("application/json")) {
            const errBody = await response.json();
            if (errBody && errBody.error) errMsg = errBody.error;
          } else {
            const txt = await response.text();
            if (txt) errMsg = txt.slice(0, 200);
          }
        } catch (e) {
          errMsg = response.statusText || errMsg;
        }
        console.warn("[API]", endpoint, response.status, errMsg);
        return { success: false, error: errMsg, status: response.status };
      }

      if (!ct.includes("application/json")) {
        return { success: false, error: "Неверный ответ сервера" };
      }

      const result = await response.json();

      if (result.success && result.bot_username && !window.botUsername) {
        window.botUsername = String(result.bot_username)
          .trim()
          .replace(/^@/, "");
      }

      return result;
    } catch (error) {
      // Не логируем ошибку отмены — это ожидаемое поведение
      if (error?.name === "AbortError") {
        return { success: false, error: "Запрос отменён", aborted: true };
      }

      console.error(`[API] ${endpoint}:`, error?.message || "network error");
      return { success: false, error: "Ошибка сети" };
    } finally {
      // Очищаем ссылку на завершённый controller при любом исходе, включая HTTP-ошибку.
      if (
        options.abortKey &&
        activeControllers.get(options.abortKey) === controller
      ) {
        activeControllers.delete(options.abortKey);
      }
    }
  }

  // Баланс одновременно нужен шапке и разделу подарков. Раньше оба запроса
  // использовали один abortKey и отменяли друг друга на старте, из-за чего
  // один из экранов мог бесконечно показывать загрузку или нули.
  let starsInFlight = null;
  function getStars() {
    if (starsInFlight) return starsInFlight;
    starsInFlight = apiRequest("/market/stars", "POST").finally(() => {
      starsInFlight = null;
    });
    return starsInFlight;
  }

  // Beacon-friendly close: использует sendBeacon если доступен, иначе keepalive fetch.
  // sendBeacon гарантирует доставку даже когда страница закрывается (pagehide).
  function notifyClose() {
    const tg = window.Telegram?.WebApp;
    const botId = getValidBotId();
    const botUsername = getBotUsername();
    const payload = {
      initData: window.WebAppRuntime?.getInitData() || tg?.initData || "",
      bot_id: botId || "",
    };
    if (botUsername && !botId) payload.bot_username = botUsername;
    const url = apiUrl("/market/close");
    try {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        const ok = navigator.sendBeacon(url, blob);
        if (ok) return true;
      }
      // Fallback: keepalive fetch (поддерживает Safari/iOS)
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  }

  window.MarketAPI = {
    getValidBotId: getValidBotId,
    getBotUsername: getBotUsername,
    url: apiUrl,
    request: apiRequest,
    abortRequest: abortRequest,
    abortAllRequests: abortAllRequests,
    getStars: getStars,
    open: () => apiRequest("/market/open"),
    heartbeat: () => apiRequest("/market/heartbeat"),
    close: notifyClose,
    buyGift: (gift_link, price) =>
      apiRequest("/market/buy_gift", "POST", { gift_link, price }),
    exchangeStars: (stars_amount) =>
      apiRequest("/market/exchange_stars", "POST", { stars_amount }),
    getStarsHistory: (options = {}) =>
      apiRequest("/market/stars_history", "POST", null, {
        abortKey: "stars-history",
        ...options,
      }),
    getDeals: (body = null, options = {}) =>
      apiRequest("/market/deals", "POST", body, {
        abortKey: "deals",
        ...options,
      }),
    getPurchaseHistory: (options = {}) =>
      apiRequest("/market/purchase_history", "POST", null, {
        abortKey: "purchase-history",
        ...options,
      }),
    getProfileStats: (options = {}) =>
      apiRequest("/market/profile_stats", "POST", null, {
        abortKey: "profile-stats",
        ...options,
      }),
    auth: (action, body = {}) =>
      apiRequest("/market/auth", "POST", { action, ...body }),
  };
})();
