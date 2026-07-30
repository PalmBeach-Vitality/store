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
<?php wp_footer(); ?>
</body>
</html>
