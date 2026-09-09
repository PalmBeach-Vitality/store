<?php
/**
 * Checkout page — force classic WooCommerce shortcode checkout
 * (WooCommerce Checkout block does not support theme PHP checkbox hooks).
 *
 * @package PalmBeachVitality
 */

defined('ABSPATH') || exit;

get_header();
?>
<main id="primary" class="site-main pbv-section pbv-checkout-page">
  <div class="pbv-container">
    <?php echo do_shortcode('[woocommerce_checkout]'); ?>
  </div>
</main>
<?php
get_footer();
