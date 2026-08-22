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

  // Product pages: hide only the old Shopify disclaimer image.
  // NEVER remove product description text/nodes.
  var description = document.querySelector(".pbv-product-description");
  if (description) {
    description.querySelectorAll('img[src*="image_6.jpg"]').forEach(function (img) {
      img.remove();
    });
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
    if (!lead || !cfg.isHome || hasLeadDismissed()) return;
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
        body.append("optin", "1");

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
                  ? "You’re in — check your inbox for the welcome note."
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

    scheduleLeadPopup();
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

  (function initBtcUsdRate() {
    var REFRESH_MS = 30000;
    var pollTimer = null;
    var ageTimer = null;
    var lastRate = null;

    function boxes() {
      return document.querySelectorAll("[data-pbv-btc-rate]");
    }

    function formatUsd(n) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(n);
    }

    function formatBtc(n) {
      return n.toFixed(8);
    }

    function parseUsdFromText(text) {
      var cleaned = String(text || "").replace(/[^0-9.]/g, "");
      var n = parseFloat(cleaned);
      return n > 0 ? n : 0;
    }

    function latestUsd(box) {
      var compact = document.querySelector(".pbv-btc-rate-row [data-pbv-btc-rate]");
      if (compact) {
        var fromCompact = parseFloat(compact.getAttribute("data-usd-total") || "");
        if (fromCompact > 0) return fromCompact;
      }
      var fromBox = parseFloat(box.getAttribute("data-usd-total") || "");
      if (fromBox > 0) return fromBox;
      var totalEl = document.querySelector(".order-total .woocommerce-Price-amount, .order-total .amount");
      if (totalEl) return parseUsdFromText(totalEl.textContent);
      return 0;
    }

    function setStatus(box, message, isError) {
      var status = box.querySelector("[data-pbv-btc-status]");
      box.classList.toggle("is-error", !!isError);
      if (!status) return;
      status.textContent = message || "";
      status.hidden = !message;
    }

    function ageLabel(fetchedAt) {
      var seconds = Math.max(0, Math.round((Date.now() - fetchedAt) / 1000));
      if (seconds < 5) return "Updated just now";
      if (seconds < 60) return "Updated " + seconds + "s ago";
      return "Updated " + Math.round(seconds / 60) + "m ago";
    }

    function applyRate(rate) {
      lastRate = rate;
      boxes().forEach(function (box) {
        var usd = latestUsd(box);
        var amountEl = box.querySelector("[data-pbv-btc-amount]");
        var spotEl = box.querySelector("[data-pbv-btc-spot]");
        var updatedEl = box.querySelector("[data-pbv-btc-updated]");
        var liveEl = box.querySelector("[data-pbv-btc-live]");
        if (!(usd > 0) || !(rate.usdPerBtc > 0)) {
          if (amountEl) amountEl.textContent = "—";
          if (liveEl) liveEl.hidden = true;
          setStatus(box, "Live Bitcoin rate unavailable. Use your wallet’s current USD conversion for the checkout total.", true);
          return;
        }
        var btc = usd / rate.usdPerBtc;
        if (amountEl) amountEl.textContent = formatBtc(btc);
        if (spotEl) spotEl.textContent = "1 BTC = " + formatUsd(rate.usdPerBtc) + " · " + rate.source;
        if (updatedEl) updatedEl.textContent = ageLabel(rate.fetchedAt);
        if (liveEl) liveEl.hidden = false;
        setStatus(box, "", false);
      });
    }

    function refreshAges() {
      if (!lastRate) return;
      boxes().forEach(function (box) {
        var updatedEl = box.querySelector("[data-pbv-btc-updated]");
        if (updatedEl && lastRate.fetchedAt) {
          updatedEl.textContent = ageLabel(lastRate.fetchedAt);
        }
      });
    }

    function readJson(res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error("http");
        return data;
      });
    }

    function fromCoinbase() {
      return fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { cache: "no-store" })
        .then(readJson)
        .then(function (data) {
          var n = parseFloat(data && data.data && data.data.amount);
          if (!(n > 0)) throw new Error("coinbase");
          return { usdPerBtc: n, source: "Coinbase", fetchedAt: Date.now() };
        });
    }

    function fromKraken() {
      return fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD", { cache: "no-store" })
        .then(readJson)
        .then(function (data) {
          var n = parseFloat(
            data &&
              data.result &&
              ((data.result.XXBTZUSD && data.result.XXBTZUSD.c && data.result.XXBTZUSD.c[0]) ||
                (data.result.XBTUSD && data.result.XBTUSD.c && data.result.XBTUSD.c[0]))
          );
          if (!(n > 0)) throw new Error("kraken");
          return { usdPerBtc: n, source: "Kraken", fetchedAt: Date.now() };
        });
    }

    function fromBinance() {
      return fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", { cache: "no-store" })
        .then(readJson)
        .then(function (data) {
          var n = parseFloat(data && data.price);
          if (!(n > 0)) throw new Error("binance");
          return { usdPerBtc: n, source: "Binance", fetchedAt: Date.now() };
        });
    }

    function fromWp() {
      var url = (cfg.ajaxUrl || "/wp-admin/admin-ajax.php") + "?action=pbv_btc_usd_rate";
      return fetch(url, { credentials: "same-origin", cache: "no-store" })
        .then(readJson)
        .then(function (data) {
          var payload = data && data.success ? data.data : null;
          var n = parseFloat(payload && payload.usd_per_btc);
          if (!(n > 0)) throw new Error("wp");
          return {
            usdPerBtc: n,
            source: payload.source || "Live rate",
            fetchedAt: Date.now(),
          };
        });
    }

    function refresh() {
      if (!boxes().length) return;
      fromCoinbase()
        .catch(fromKraken)
        .catch(fromBinance)
        .catch(fromWp)
        .then(applyRate)
        .catch(function () {
          lastRate = null;
          boxes().forEach(function (box) {
            var amountEl = box.querySelector("[data-pbv-btc-amount]");
            var liveEl = box.querySelector("[data-pbv-btc-live]");
            if (amountEl) amountEl.textContent = "—";
            if (liveEl) liveEl.hidden = true;
            setStatus(
              box,
              "Live Bitcoin rate unavailable. Use your wallet’s current USD conversion for the checkout total.",
              true
            );
          });
        });
    }

    function start() {
      if (!boxes().length) return;
      refresh();
      if (pollTimer) window.clearInterval(pollTimer);
      pollTimer = window.setInterval(refresh, REFRESH_MS);
      if (!ageTimer) {
        ageTimer = window.setInterval(refreshAges, 1000);
      }
    }

    start();
    if (window.jQuery) {
      window.jQuery(document.body).on("updated_checkout updated_wc_div", start);
    }
  })();

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-pbv-copy]");
    if (!btn) return;
    var target = document.getElementById(btn.getAttribute("data-pbv-copy") || "");
    if (!target) return;
    var text = (target.textContent || "").trim();
    if (!text) return;
    var label = btn.textContent;
    function copied() {
      btn.textContent = "Copied";
      window.setTimeout(function () {
        btn.textContent = label;
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(copied).catch(function () {
        btn.textContent = label;
      });
      return;
    }
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "absolute";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
      copied();
    } catch (e) {}
    document.body.removeChild(field);
  });
})();
