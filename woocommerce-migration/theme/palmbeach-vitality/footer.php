<?php
/**
 * Site footer with social links + Terms and Policies dropdown.
 *
 * @package PalmBeachVitality
 */
$policy_sections = function_exists('pbv_terms_policy_sections') ? pbv_terms_policy_sections() : array();
?>
  <footer class="site-footer">
    <div class="pbv-container site-footer__inner">
      <?php echo function_exists('pbv_social_links_html') ? pbv_social_links_html() : ''; ?>

      <div class="site-footer__row">
        <p>&copy; <?php echo esc_html(gmdate('Y')); ?> Palm Beach Vitality</p>

        <div class="pbv-terms-menu">
          <details class="pbv-terms-menu__dropdown">
            <summary class="pbv-terms-menu__summary">Terms and Policies</summary>
            <ul class="pbv-terms-menu__list">
              <?php foreach ($policy_sections as $id => $section) : ?>
                <li>
                  <a href="<?php echo esc_url(home_url('/terms/#' . $id)); ?>">
                    <?php echo esc_html($section['title']); ?>
                  </a>
                </li>
              <?php endforeach; ?>
            </ul>
          </details>
        </div>
      </div>
    </div>
  </footer>
</div>

<div class="pbv-age-gate" id="pbv-age-gate" hidden data-age-gate>
  <div class="pbv-age-gate__backdrop" aria-hidden="true"></div>
  <div
    class="pbv-age-gate__dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pbv-age-gate-title"
    aria-describedby="pbv-age-gate-copy"
  >
    <p class="pbv-age-gate__eyebrow">Age verification required</p>
    <h2 id="pbv-age-gate-title" class="pbv-age-gate__title">Confirm you are 21 or older</h2>
    <p id="pbv-age-gate-copy" class="pbv-age-gate__copy">
      This website sells research-use products. You must be at least 21 years old and agree to our Terms of Service to continue.
    </p>

    <label class="pbv-age-gate__check">
      <input type="checkbox" id="pbv-age-gate-age" data-age-gate-age />
      <span>I confirm that I am <strong>21 years of age or older</strong>.</span>
    </label>

    <label class="pbv-age-gate__check">
      <input type="checkbox" id="pbv-age-gate-terms" data-age-gate-terms />
      <span>
        I agree to the
        <a href="<?php echo esc_url(home_url('/terms/#terms-of-service')); ?>" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        and related policies.
      </span>
    </label>

    <p class="pbv-age-gate__error" data-age-gate-error hidden>Please confirm both checkboxes to enter the site.</p>

    <div class="pbv-age-gate__actions">
      <button type="button" class="pbv-age-gate__btn pbv-age-gate__btn--primary" data-age-gate-enter>
        Enter site
      </button>
      <button type="button" class="pbv-age-gate__btn pbv-age-gate__btn--ghost" data-age-gate-exit>
        I am under 21 — Exit
      </button>
    </div>
  </div>
</div>

<?php
$lead_img = file_exists(pbv_asset_path('assets/images/hero.jpg'))
    ? pbv_asset_uri('assets/images/hero.jpg')
    : '';
?>
<div class="pbv-lead-popup" id="pbv-lead-popup" hidden data-lead-popup>
  <div class="pbv-lead-popup__backdrop" data-lead-popup-close aria-hidden="true"></div>
  <div
    class="pbv-lead-popup__dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pbv-lead-popup-title"
  >
    <button type="button" class="pbv-lead-popup__close" data-lead-popup-close aria-label="Close">×</button>
    <div class="pbv-lead-popup__split">
      <div class="pbv-lead-popup__form-side">
        <h2 id="pbv-lead-popup-title" class="pbv-lead-popup__title">Learn more!</h2>
        <p class="pbv-lead-popup__subtitle">Looking for more information on a specific product?</p>

        <form class="pbv-lead-popup__form" data-lead-popup-form novalidate>
          <label class="screen-reader-text" for="pbv-lead-email">Email</label>
          <input
            id="pbv-lead-email"
            class="pbv-lead-popup__input"
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            autocomplete="email"
          />
          <button type="submit" class="pbv-lead-popup__submit">I'd like to know more</button>
          <label class="pbv-lead-popup__optin">
            <input type="checkbox" name="optin" value="1" />
            <span>Keep me up to date on news and offers</span>
          </label>
          <p class="pbv-lead-popup__status" data-lead-popup-status hidden></p>
        </form>

        <p class="pbv-lead-popup__privacy">
          For more information on how we process your data for marketing communication.
          Check our
          <a href="<?php echo esc_url(home_url('/terms/#privacy')); ?>" target="_blank" rel="noopener noreferrer">Privacy policy</a>.
        </p>
      </div>
      <div
        class="pbv-lead-popup__media"
        style="<?php echo $lead_img ? 'background-image:url(' . esc_url($lead_img) . ')' : ''; ?>"
        role="img"
        aria-label="Palm Beach Vitality research products"
      ></div>
    </div>
  </div>
</div>

<?php wp_footer(); ?>
</body>
</html>
