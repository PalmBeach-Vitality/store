(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-mobile-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) nav.removeAttribute("hidden");
      else nav.setAttribute("hidden", "");
    });
  }

  // Product pages: keep exactly one Research use only banner (the large theme one).
  var description = document.querySelector(".pbv-product-description");
  if (description) {
    description.querySelectorAll('img[src*="image_6.jpg"]').forEach(function (img) {
      var wrap = img.closest("li, p, figure, div");
      if (wrap && wrap !== description && !wrap.classList.contains("pbv-ruo-banner")) {
        wrap.remove();
      } else {
        img.remove();
      }
    });

    var banners = description.querySelectorAll(".pbv-ruo-banner");
    banners.forEach(function (banner, index) {
      if (index > 0) banner.remove();
    });

    Array.prototype.slice.call(description.children).forEach(function (node) {
      if (node.classList && node.classList.contains("pbv-ruo-banner")) return;
      var text = (node.textContent || "").toLowerCase();
      if (
        text.indexOf("research use only") !== -1 &&
        text.indexOf("not for human consumption") !== -1
      ) {
        node.remove();
      }
    });
  }

  // Age gate + required Terms checkbox (21+)
  var gate = document.querySelector("[data-age-gate]");
  if (!gate) return;

  var storageKey = "pbv_age_gate_v1";
  var ageInput = gate.querySelector("[data-age-gate-age]");
  var termsInput = gate.querySelector("[data-age-gate-terms]");
  var errorEl = gate.querySelector("[data-age-gate-error]");
  var enterBtn = gate.querySelector("[data-age-gate-enter]");
  var exitBtn = gate.querySelector("[data-age-gate-exit]");

  function hasAccepted() {
    try {
      return window.localStorage.getItem(storageKey) === "accepted";
    } catch (e) {
      return false;
    }
  }

  function accept() {
    try {
      window.localStorage.setItem(storageKey, "accepted");
    } catch (e) {}
    gate.setAttribute("hidden", "");
    document.body.classList.remove("pbv-age-gate-open");
  }

  function showGate() {
    gate.removeAttribute("hidden");
    document.body.classList.add("pbv-age-gate-open");
    if (ageInput) ageInput.focus();
  }

  if (hasAccepted()) {
    gate.setAttribute("hidden", "");
    return;
  }

  showGate();

  if (enterBtn) {
    enterBtn.addEventListener("click", function () {
      var okAge = ageInput && ageInput.checked;
      var okTerms = termsInput && termsInput.checked;
      if (!okAge || !okTerms) {
        if (errorEl) errorEl.removeAttribute("hidden");
        return;
      }
      if (errorEl) errorEl.setAttribute("hidden", "");
      accept();
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", function () {
      window.location.href = "https://www.google.com/";
    });
  }

  // Block Esc / backdrop click — user must choose.
  gate.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
    }
  });
})();
