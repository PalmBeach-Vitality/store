<?php
/**
 * Front page — brand-first full-bleed hero + shop grid.
 *
 * @package PalmBeachVitality
 */

get_header();
?>

<section class="pbv-hero">
  <div class="pbv-container pbv-hero__inner">
    <p class="pbv-hero__eyebrow">Precision compounds · Palm Beach made</p>
    <h1 class="pbv-hero__brand">Palm Beach Vitality</h1>
    <p class="pbv-hero__text">Research-grade peptides with clean documentation, verified purity, and a storefront built for serious buyers.</p>
    <div class="pbv-hero__actions">
      <a class="btn" href="<?php echo esc_url(home_url('/shop/')); ?>">Shop catalog</a>
      <a class="btn btn-outline" href="<?php echo esc_url(home_url('/about/')); ?>">About us</a>
    </div>
  </div>
</section>

<section class="pbv-section">
  <div class="pbv-container">
    <p class="pbv-section__eyebrow">Catalog</p>
    <h2 class="pbv-section__title">Featured products</h2>
    <p class="pbv-section__lead">Vials and pens photographed for clarity — priced and ready to order.</p>

    <?php if (class_exists('WooCommerce')) : ?>
      <?php
      $featured = new WP_Query(array(
          'post_type'      => 'product',
          'posts_per_page' => 8,
          'post_status'    => 'publish',
      ));
      if ($featured->have_posts()) :
          echo '<ul class="products columns-4">';
          while ($featured->have_posts()) :
              $featured->the_post();
              wc_get_template_part('content', 'product');
          endwhile;
          echo '</ul>';
          wp_reset_postdata();
      endif;
      ?>
      <p style="margin-top:2rem">
        <a class="btn" href="<?php echo esc_url(home_url('/shop/')); ?>">View all products</a>
      </p>
    <?php endif; ?>
  </div>
</section>

<section class="pbv-section pbv-section--soft">
  <div class="pbv-container">
    <p class="pbv-section__eyebrow">Standards</p>
    <h2 class="pbv-section__title">COA-backed. Research use only.</h2>
    <p class="pbv-section__lead">Every order ships with documentation. Products are intended strictly for laboratory research.</p>
    <a class="btn btn-outline" href="<?php echo esc_url(home_url('/faq/')); ?>">Read FAQ</a>
  </div>
</section>

<?php
get_footer();
