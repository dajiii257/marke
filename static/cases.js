(function () {
  "use strict";

  if (!window.MarketApp) {
    console.error("[CASES] MarketApp not initialized");
    return;
  }

  const tg = window.MarketApp.tg;
  let cardsInitialized = false;

  function openCase(caseId, caseUrl) {
    if (window.openCaseDetail) {
      window.openCaseDetail(caseId, "cases", caseUrl);
    }
  }

  function initCards() {
    if (cardsInitialized) return;
    cardsInitialized = true;

    // Regular grid cards
    document
      .querySelectorAll("#view-cases .case-card")
      .forEach(function (card) {
        var caseId = card.dataset.caseId;
        if (!caseId) return;
        card.addEventListener("click", function () {
          openCase(caseId, card.dataset.caseUrl);
        });
      });

    // Featured card
    var featured = document.querySelector("#view-cases .case-featured");
    if (featured) {
      var caseId = featured.dataset.caseId;
      if (caseId) {
        featured.addEventListener("click", function () {
          openCase(caseId, featured.dataset.caseUrl);
        });
      }
    }
  }

  var casesModule = {
    onEnter: function () {
      initCards();
    },
    onLeave: function () {},
  };

  window.MarketApp.registerModule("cases", casesModule);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCards);
  } else {
    initCards();
  }
})();
