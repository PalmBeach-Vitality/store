(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-mobile-nav]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) nav.removeAttribute("hidden");
    else nav.setAttribute("hidden", "");
  });
})();
