<?php
/**
 * Cart page — force classic WooCommerce shortcode cart
 * so checkout policy UI is consistent with classic checkout.
 *
 * @package PalmBeachVitality
 */

defined('ABSPATH') || exit;

get_header();
?>
<main id="primary" class="site-main pbv-section pbv-cart-page">
  <div class="pbv-container">
    <?php echo do_shortcode('[woocommerce_cart]'); ?>
  </div>
</main>
<?php
get_footer();
