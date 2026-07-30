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
  if (!description) return;

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
})();
