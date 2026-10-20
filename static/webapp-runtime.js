(function () {
  "use strict";

  if (window.WebAppRuntime) return;

  var nativeFetch = window.fetch.bind(window);
  var INIT_DATA_KEY = "mlb.webapp.initData";
  var inflight = 0;

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (_e) {
      return "";
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_e) {}
  }

  function getTelegram() {
    return (window.Telegram && window.Telegram.WebApp) || null;
  }

  function getInitData() {
    var tg = getTelegram();
    var current = (tg && tg.initData) || "";
    if (current) {
      storageSet(INIT_DATA_KEY, current);
      return current;
    }
    return storageGet(INIT_DATA_KEY);
  }

  function safeTelegramInit(colors) {
    var tg = getTelegram();
    if (!tg) return null;
    var bg = (colors && colors.background) || "#050508";
    var header = (colors && colors.header) || bg;
    try {
      if (tg.ready) tg.ready();
    } catch (_e) {}
    try {
      if (tg.expand) tg.expand();
    } catch (_e) {}
    try {
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    } catch (_e) {}
    try {
      if (tg.setHeaderColor) tg.setHeaderColor(header);
    } catch (_e) {}
    try {
      if (tg.setBackgroundColor) tg.setBackgroundColor(bg);
    } catch (_e) {}
    getInitData();
    return tg;
  }

  function setBusy(delta) {
    inflight = Math.max(0, inflight + delta);
    document.documentElement.toggleAttribute("data-network-busy", inflight > 0);
  }

  function sameOriginUrl(input) {
    try {
      var raw = typeof input === "string" ? input : input.url;
      return (
        new URL(raw, window.location.href).origin === window.location.origin
      );
    } catch (_e) {
      return false;
    }
  }

  function injectCachedInitData(input, options) {
    if (!sameOriginUrl(input) || !options || typeof options.body !== "string")
      return options;
    var headers = new Headers(options.headers || {});
    if (
      !(headers.get("content-type") || "")
        .toLowerCase()
        .includes("application/json")
    )
      return options;
    try {
      var body = JSON.parse(options.body);
      if (
        body &&
        typeof body === "object" &&
        Object.prototype.hasOwnProperty.call(body, "initData") &&
        !body.initData
      ) {
        var cached = getInitData();
        if (cached) {
          options = Object.assign({}, options, {
            body: JSON.stringify(Object.assign({}, body, { initData: cached })),
          });
        }
      }
    } catch (_e) {}
    return options;
  }

  function fetchWithTimeout(input, init) {
    var options = Object.assign({}, init || {});
    options = injectCachedInitData(input, options);
    if (options.keepalive) return nativeFetch(input, options);

    var timeoutMs = Number(options.timeoutMs || 25000);
    delete options.timeoutMs;
    var controller = new AbortController();
    var externalSignal = options.signal;
    var onAbort = function () {
      controller.abort();
    };
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onAbort, { once: true });
    }
    options.signal = controller.signal;
    var timer = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs);
    setBusy(1);

    return nativeFetch(input, options)
      .catch(function (error) {
        if (
          error &&
          error.name === "AbortError" &&
          !(externalSignal && externalSignal.aborted)
        ) {
          var timeoutError = new Error("Сервер не ответил вовремя");
          timeoutError.name = "TimeoutError";
          window.dispatchEvent(
            new CustomEvent("webapp:request-error", {
              detail: { input: String(input), error: timeoutError },
            })
          );
          throw timeoutError;
        }
        throw error;
      })
      .finally(function () {
        window.clearTimeout(timer);
        if (externalSignal)
          externalSignal.removeEventListener("abort", onAbort);
        setBusy(-1);
      });
  }

  // Не даём двойному тапу дважды отправить одну и ту же операцию.
  var lastButtonTap = new WeakMap();
  document.addEventListener(
    "click",
    function (event) {
      var button =
        event.target &&
        event.target.closest &&
        event.target.closest('button, [role="button"]');
      if (!button) return;
      var now = Date.now();
      var previous = lastButtonTap.get(button) || 0;
      if (now - previous < 350) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      lastButtonTap.set(button, now);
    },
    true
  );

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) window.dispatchEvent(new CustomEvent("webapp:resume"));
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible")
      window.dispatchEvent(new CustomEvent("webapp:resume"));
  });

  window.fetch = fetchWithTimeout;
  window.WebAppRuntime = {
    getTelegram: getTelegram,
    getInitData: getInitData,
    safeTelegramInit: safeTelegramInit,
    nativeFetch: nativeFetch,
    fetch: fetchWithTimeout,
  };
})();
