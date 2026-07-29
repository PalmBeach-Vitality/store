<?php
/**
 * Front page — brand hero + 4 Shopify-style shop groups + featured products.
 *
 * @package PalmBeachVitality
 */

get_header();

$hero_image = 'https://cdn.shopify.com/s/files/1/1056/1447/5345/files/NAD__500mg.jpg?v=1784650000';
// Prefer a known tropical vial shot from the catalog if CDN path differs:
$hero_image = 'https://cdn.shopify.com/s/files/1/1056/1447/5345/files/image_90.jpg?v=1784042737';
$groups = function_exists('pbv_shop_groups') ? pbv_shop_groups() : array();
?>

<section class="pbv-hero pbv-hero--photo" style="--pbv-hero-image:url('<?php echo esc_url($hero_image); ?>')">
  <div class="pbv-container pbv-hero__inner">
    <p class="pbv-hero__eyebrow">Palm Beach · Research grade</p>
    <h1 class="pbv-hero__brand">Palm Beach Vitality</h1>
    <p class="pbv-hero__text">Shop peptides and weight-loss compounds in vials or pens — documented, priced, and ready to order.</p>
    <div class="pbv-hero__actions">
      <a class="btn" href="<?php echo esc_url(home_url('/shop/')); ?>">Shop all</a>
      <a class="btn btn-outline" href="<?php echo esc_url(pbv_category_url('peptide-pens')); ?>">Peptide Pens</a>
    </div>
  </div>
</section>

<section class="pbv-section">
  <div class="pbv-container">
    <p class="pbv-section__eyebrow">Shop by group</p>
    <h2 class="pbv-section__title">Four collections</h2>
    <p class="pbv-section__lead">Same structure as your Shopify storefront — pick a group to browse.</p>

    <div class="pbv-collections">
      <?php foreach ($groups as $group) : ?>
        <a class="pbv-collection-card" href="<?php echo esc_url(pbv_category_url($group['slug'])); ?>">
          <span class="pbv-collection-card__media" style="background-image:url('<?php echo esc_url($group['image']); ?>')"></span>
          <span class="pbv-collection-card__body">
            <span class="pbv-collection-card__name"><?php echo esc_html($group['name']); ?></span>
            <span class="pbv-collection-card__blurb"><?php echo esc_html($group['blurb']); ?></span>
          </span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="pbv-section pbv-section--soft">
  <div class="pbv-container">
    <p class="pbv-section__eyebrow">Featured</p>
    <h2 class="pbv-section__title">Latest products</h2>
    <p class="pbv-section__lead">Fresh from the catalog.</p>

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
    <?php endif; ?>
  </div>
</section>

<section class="pbv-section">
  <div class="pbv-container">
    <p class="pbv-section__eyebrow">Standards</p>
    <h2 class="pbv-section__title">COA-backed. Research use only.</h2>
    <p class="pbv-section__lead">Every order ships with documentation. Products are intended strictly for laboratory research.</p>
    <a class="btn btn-outline" href="<?php echo esc_url(home_url('/contact/')); ?>">Contact</a>
  </div>
</section>

<?php
get_footer();
