<?php
/**
 * Minimal footer matching Shopify screenshot.
 *
 * @package PalmBeachVitality
 */
?>
  <footer class="site-footer">
    <div class="pbv-container site-footer__inner">
      <p>&copy; <?php echo esc_html(gmdate('Y')); ?> Palm Beach Vitality</p>
      <p><a href="<?php echo esc_url(home_url('/terms/')); ?>">Terms and Policies</a></p>
    </div>
  </footer>
</div>
<?php wp_footer(); ?>
</body>
</html>
