<?php
/**
 * Front page template — brand-first hero + featured products.
 *
 * @package PalmBeachPeptides
 */

get_header();
?>

<section class="pb-hero">
  <div class="pb-container pb-hero__inner">
    <p class="pb-hero__tagline">Precision. Purity. Palm Beach Made.</p>
    <h1 class="pb-hero__brand">Palm Beach Peptides</h1>
    <p class="pb-hero__text">Pharmacy-grade research peptides synthesized domestically, independently verified, and shipped with full documentation.</p>
    <div class="pb-hero__actions">
      <a class="btn btn-primary" href="<?php echo esc_url(home_url('/shop/')); ?>">Browse Catalog</a>
      <a class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.25)" href="<?php echo esc_url(home_url('/contact/#pricing')); ?>">Get Pricing</a>
    </div>
  </div>
</section>

<section class="pb-section">
  <div class="pb-container">
    <p class="pb-section__eyebrow">Featured Compounds</p>
    <h2 class="pb-section__title">Built for serious research buyers.</h2>
    <p class="pb-section__lead">Every compound is USA-origin, COA-backed, and available in the forms your lab needs.</p>

    <?php if (function_exists('woocommerce_product_loop') && class_exists('WooCommerce')) : ?>
      <?php
      $featured = new WP_Query(array(
          'post_type'      => 'product',
          'posts_per_page' => 6,
          'post_status'    => 'publish',
      ));
      if ($featured->have_posts()) :
          echo '<ul class="products columns-3">';
          while ($featured->have_posts()) :
              $featured->the_post();
              wc_get_template_part('content', 'product');
          endwhile;
          echo '</ul>';
          wp_reset_postdata();
      else :
          echo '<p>Import products to populate this grid. See <code>woocommerce-migration/PLAN.md</code>.</p>';
      endif;
      ?>
      <p style="margin-top:2rem">
        <a class="btn btn-primary" href="<?php echo esc_url(home_url('/shop/')); ?>">View Full Catalog</a>
      </p>
    <?php else : ?>
      <p><strong>WooCommerce is required.</strong> Install and activate WooCommerce, then import <code>products-woocommerce.csv</code>.</p>
    <?php endif; ?>
  </div>
</section>

<section class="pb-section pb-section--sand">
  <div class="pb-container">
    <p class="pb-section__eyebrow">Why Palm Beach</p>
    <h2 class="pb-section__title">99%+ purity. USA made. COA every shipment.</h2>
    <p class="pb-section__lead">Wholesale accounts welcome for clinics, research labs, and distributors.</p>
    <a class="btn btn-primary" href="<?php echo esc_url(home_url('/wholesale/')); ?>">Apply for Wholesale</a>
  </div>
</section>

<?php
get_footer();
