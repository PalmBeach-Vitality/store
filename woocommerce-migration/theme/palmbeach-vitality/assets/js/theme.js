(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-mobile-nav]");
  if (toggle && nav) {
    function setMenuOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) nav.removeAttribute("hidden");
      else nav.setAttribute("hidden", "");
    }

    toggle.addEventListener("click", function () {
      setMenuOpen(!nav.classList.contains("is-open"));
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setMenuOpen(false);
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
  var ageAccepted = false;

  function hasAgeAccepted() {
    try {
      return window.localStorage.getItem("pbv_age_gate_v1") === "accepted";
    } catch (e) {
      return false;
    }
  }

  function acceptAgeGate() {
    try {
      window.localStorage.setItem("pbv_age_gate_v1", "accepted");
    } catch (e) {}
    if (gate) gate.setAttribute("hidden", "");
    document.body.classList.remove("pbv-age-gate-open");
    ageAccepted = true;
    scheduleLeadPopup();
  }

  if (gate) {
    var ageInput = gate.querySelector("[data-age-gate-age]");
    var termsInput = gate.querySelector("[data-age-gate-terms]");
    var errorEl = gate.querySelector("[data-age-gate-error]");
    var enterBtn = gate.querySelector("[data-age-gate-enter]");
    var exitBtn = gate.querySelector("[data-age-gate-exit]");

    if (hasAgeAccepted()) {
      gate.setAttribute("hidden", "");
      ageAccepted = true;
    } else {
      gate.removeAttribute("hidden");
      document.body.classList.add("pbv-age-gate-open");
      if (ageInput) ageInput.focus();
    }

    if (enterBtn) {
      enterBtn.addEventListener("click", function () {
        var okAge = ageInput && ageInput.checked;
        var okTerms = termsInput && termsInput.checked;
        if (!okAge || !okTerms) {
          if (errorEl) errorEl.removeAttribute("hidden");
          return;
        }
        if (errorEl) errorEl.setAttribute("hidden", "");
        acceptAgeGate();
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener("click", function () {
        window.location.href = "https://www.google.com/";
      });
    }

    gate.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  } else {
    ageAccepted = true;
  }

  // Homepage lead popup — 10 seconds after landing (after age gate)
  var lead = document.querySelector("[data-lead-popup]");
  var leadTimer = null;
  var cfg = window.pbvTheme || {};

  function hasLeadDismissed() {
    try {
      return window.localStorage.getItem("pbv_lead_popup_v1") === "done";
    } catch (e) {
      return false;
    }
  }

  function markLeadDone() {
    try {
      window.localStorage.setItem("pbv_lead_popup_v1", "done");
    } catch (e) {}
  }

  function closeLeadPopup() {
    if (!lead) return;
    lead.setAttribute("hidden", "");
    document.body.classList.remove("pbv-lead-popup-open");
  }

  function openLeadPopup() {
    if (!lead || hasLeadDismissed()) return;
    lead.removeAttribute("hidden");
    document.body.classList.add("pbv-lead-popup-open");
    var email = lead.querySelector("#pbv-lead-email");
    if (email) email.focus();
  }

  function scheduleLeadPopup() {
    if (!lead || !cfg.isHome || hasLeadDismissed() || !ageAccepted) return;
    if (leadTimer) window.clearTimeout(leadTimer);
    leadTimer = window.setTimeout(openLeadPopup, 10000);
  }

  if (lead) {
    lead.querySelectorAll("[data-lead-popup-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        markLeadDone();
        closeLeadPopup();
      });
    });

    var form = lead.querySelector("[data-lead-popup-form]");
    var statusEl = lead.querySelector("[data-lead-popup-status]");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var emailInput = form.querySelector('input[name="email"]');
        var optinInput = form.querySelector('input[name="optin"]');
        var email = emailInput ? emailInput.value.trim() : "";
        if (!email || email.indexOf("@") === -1) {
          if (statusEl) {
            statusEl.textContent = "Please enter a valid email address.";
            statusEl.hidden = false;
            statusEl.classList.add("is-error");
          }
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        var body = new FormData();
        body.append("action", "pbv_lead_popup");
        body.append("nonce", cfg.nonce || "");
        body.append("email", email);
        if (optinInput && optinInput.checked) body.append("optin", "1");

        fetch(cfg.ajaxUrl || "/wp-admin/admin-ajax.php", {
          method: "POST",
          body: body,
          credentials: "same-origin",
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { ok: res.ok && data && data.success, data: data };
            });
          })
          .then(function (result) {
            if (statusEl) {
              statusEl.classList.remove("is-error");
              statusEl.hidden = false;
              statusEl.textContent =
                (result.data && result.data.data && result.data.data.message) ||
                (result.ok
                  ? "Thanks — we will be in touch soon."
                  : "Something went wrong. Please try again.");
              if (!result.ok) statusEl.classList.add("is-error");
            }
            if (result.ok) {
              markLeadDone();
              window.setTimeout(closeLeadPopup, 1600);
            }
          })
          .catch(function () {
            if (statusEl) {
              statusEl.hidden = false;
              statusEl.classList.add("is-error");
              statusEl.textContent = "Something went wrong. Please try again.";
            }
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "I'd like to know more";
            }
          });
      });
    }

    if (ageAccepted) scheduleLeadPopup();
  }

  // Contact page form → sales@palmbeach-vitality.com
  var contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    var contactStatus = document.querySelector("[data-contact-status]");
    var contactSubmit = contactForm.querySelector("[data-contact-submit]");
    var cfg = window.pbvTheme || {};

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var first = (contactForm.querySelector('[name="first_name"]') || {}).value || "";
      var last = (contactForm.querySelector('[name="last_name"]') || {}).value || "";
      var email = (contactForm.querySelector('[name="email"]') || {}).value || "";
      var phone = (contactForm.querySelector('[name="phone"]') || {}).value || "";
      var subject = (contactForm.querySelector('[name="subject"]') || {}).value || "";

      if (contactStatus) {
        contactStatus.hidden = true;
        contactStatus.classList.remove("is-error", "is-success");
        contactStatus.textContent = "";
      }

      if (!first.trim() || !last.trim() || !email.trim() || !phone.trim() || !subject.trim()) {
        if (contactStatus) {
          contactStatus.hidden = false;
          contactStatus.classList.add("is-error");
          contactStatus.textContent = "Please fill in all required fields.";
        }
        return;
      }

      if (contactSubmit) {
        contactSubmit.disabled = true;
        contactSubmit.textContent = "Sending…";
      }

      var body = new FormData(contactForm);
      body.set("action", "pbv_contact_form");
      body.set("nonce", cfg.contactNonce || "");
      if (!body.get("pbv_contact_nonce") && cfg.contactNonce) {
        body.set("pbv_contact_nonce", cfg.contactNonce);
      }

      fetch(cfg.ajaxUrl || "/wp-admin/admin-ajax.php", {
        method: "POST",
        credentials: "same-origin",
        body: body,
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok && data && data.success, data: data };
          });
        })
        .then(function (result) {
          var message =
            (result.data && result.data.data && result.data.data.message) ||
            (result.ok
              ? "Thanks — your message has been sent."
              : "Something went wrong. Please try again.");
          if (contactStatus) {
            contactStatus.hidden = false;
            contactStatus.classList.add(result.ok ? "is-success" : "is-error");
            contactStatus.textContent = message;
          }
          if (result.ok) {
            contactForm.reset();
          }
        })
        .catch(function () {
          if (contactStatus) {
            contactStatus.hidden = false;
            contactStatus.classList.add("is-error");
            contactStatus.textContent =
              "Something went wrong. Please email sales@palmbeach-vitality.com directly.";
          }
        })
        .finally(function () {
          if (contactSubmit) {
            contactSubmit.disabled = false;
            contactSubmit.textContent = "Submit";
          }
        });
    });
  }

  // Checkout policy dropdowns: only one open at a time.
  var policyRoot = document.querySelector(".pbv-checkout-policies");
  if (policyRoot) {
    policyRoot.addEventListener("toggle", function (event) {
      var target = event.target;
      if (!target || target.tagName !== "DETAILS" || !target.open) return;
      policyRoot.querySelectorAll("details.pbv-checkout-policy__dropdown").forEach(function (panel) {
        if (panel !== target) panel.open = false;
      });
    }, true);
  }
})();
