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

  // Product pages: hide only the old Shopify disclaimer image + extra theme banners.
  // NEVER remove product description text/nodes.
  var description = document.querySelector(".pbv-product-description");
  if (description) {
    description.querySelectorAll('img[src*="image_6.jpg"]').forEach(function (img) {
      img.remove();
    });

    var banners = description.querySelectorAll(".pbv-ruo-banner");
    banners.forEach(function (banner, index) {
      if (index > 0) banner.remove();
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
    var path = (window.location.pathname || "").replace(/\/+$/, "") || "/";
    var isTermsPage = path === "/terms";

    if (hasAgeAccepted() || isTermsPage) {
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

  // Welcome discount popup — banner click + homepage timer
  var lead = document.querySelector("[data-lead-popup]");
  var leadTimer = null;
  var cfg = window.pbvTheme || {};

  function hasLeadDismissed() {
    try {
      return window.localStorage.getItem("pbv_lead_popup_v3") === "done";
    } catch (e) {
      return false;
    }
  }

  function markLeadDone() {
    try {
      window.localStorage.setItem("pbv_lead_popup_v3", "done");
    } catch (e) {}
  }

  function closeLeadPopup() {
    if (!lead) return;
    lead.setAttribute("hidden", "");
    document.body.classList.remove("pbv-lead-popup-open");
  }

  function openLeadPopup(force) {
    if (!lead) return;
    if (!force && hasLeadDismissed()) return;
    lead.removeAttribute("hidden");
    document.body.classList.add("pbv-lead-popup-open");
    var email = lead.querySelector("#pbv-lead-email");
    if (email) email.focus();
  }

  function scheduleLeadPopup() {
    if (!lead || !cfg.isHome || hasLeadDismissed() || !ageAccepted) return;
    if (leadTimer) window.clearTimeout(leadTimer);
    leadTimer = window.setTimeout(function () {
      openLeadPopup(false);
    }, 10000);
  }

  document.querySelectorAll("[data-lead-popup-open]").forEach(function (el) {
    el.addEventListener("click", function () {
      openLeadPopup(true);
    });
  });

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
                  ? "You’re in — check your inbox for the welcome note, then confirm to get monthly research emails."
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
              submitBtn.textContent = "Subscribe";
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

  // Google Sign-In (My Account / Checkout when logged out)
  (function initGoogleSignIn() {
    var googleRoot = document.querySelector("[data-pbv-google-signin]");
    if (!googleRoot || !window.pbvGoogleSignIn || !pbvGoogleSignIn.clientId) return;

    function setGoogleStatus(message, isError) {
      var googleStatus = googleRoot.querySelector("[data-pbv-google-status]");
      if (!googleStatus) return;
      googleStatus.hidden = !message;
      googleStatus.textContent = message || "";
      googleStatus.classList.toggle("is-error", !!isError);
    }

    function onCredential(response) {
      if (!response || !response.credential) {
        setGoogleStatus("Google sign-in failed. Please try again.", true);
        return;
      }
      setGoogleStatus("Signing you in…", false);
      var body = new URLSearchParams();
      body.set("action", "pbv_google_signin");
      body.set("nonce", pbvGoogleSignIn.nonce);
      body.set("credential", response.credential);
      body.set("redirect", pbvGoogleSignIn.redirect || window.location.href);

      fetch(pbvGoogleSignIn.ajaxUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: body.toString(),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.success) {
            setGoogleStatus(
              (data && data.data && data.data.message) || "Could not complete Google sign-in.",
              true
            );
            return;
          }
          window.location.href =
            (data.data && data.data.redirect) || pbvGoogleSignIn.redirect || "/my-account/";
        })
        .catch(function () {
          setGoogleStatus("Network error during Google sign-in. Please try again.", true);
        });
    }

    function render() {
      if (!(window.google && google.accounts && google.accounts.id)) return false;
      google.accounts.id.initialize({
        client_id: pbvGoogleSignIn.clientId,
        callback: onCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      var googleBtn = googleRoot.querySelector("[data-pbv-google-btn]");
      if (googleBtn) {
        google.accounts.id.renderButton(googleBtn, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 320,
        });
      }
      return true;
    }

    if (render()) return;
    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (render() || tries > 40) window.clearInterval(timer);
    }, 100);
  })();
})();
