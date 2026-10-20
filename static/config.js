/**
 * Локальный режим (localhost): ничего не трогайте — API и стикеры с того же хоста/папки, что и страница.
 *
 * MARKET_API_ORIGIN — только если API на другом домене (полный URL без слэша в конце).
 * MARKET_STIC_BASE — только если .tgs лежат не в ./Stic/ (полный URL к папке Stic).
 */
(function () {
  "use strict";

  if (typeof window.MARKET_API_ORIGIN === "undefined") {
    // 🔧 НАСТРОЙКА: Укажите URL вашего бэкенда
    // Для локальной разработки: "http://localhost:3000"
    // Для продакшена на bothost.ru: "https://mybot45669.bothost.tech"
    window.MARKET_API_ORIGIN = "https://mybot45669.bothost.tech";
  }
  if (typeof window.MARKET_STIC_BASE === "undefined") {
    window.MARKET_STIC_BASE = "";
  }

  window.marketSticUrl = function (file) {
    var b = window.MARKET_STIC_BASE;
    if (b) {
      return (
        String(b).replace(/\/$/, "") + "/" + String(file).replace(/^\//, "")
      );
    }
    return "Stic/" + String(file).replace(/^\//, "");
  };
})();
