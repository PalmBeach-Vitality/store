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

<?php wp_footer(); ?>
</body>
</html>
