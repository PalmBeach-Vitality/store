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
        <h2 id="pbv-lead-popup-title" class="pbv-lead-popup__title">Subscribe for updates and discounts</h2>
        <p class="pbv-lead-popup__subtitle">Join the list for new compounds, research notes, and subscriber-only offers.</p>

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
          <button type="submit" class="pbv-lead-popup__submit">Subscribe</button>
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
