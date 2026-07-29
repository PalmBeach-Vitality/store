<?php
/**
 * Homepage — beach hero, Most Popular (middle), FAQ accordion.
 *
 * @package PalmBeachVitality
 */

get_header();

$hero = get_header_image();
$hero_style = $hero
    ? '--pbv-hero-image:url(' . esc_url($hero) . ')'
    : '';
?>

<section class="pbv-hero-photo<?php echo $hero ? '' : ' pbv-hero-photo--placeholder'; ?>" style="<?php echo esc_attr($hero_style); ?>" aria-label="<?php esc_attr_e('Homepage banner', 'palmbeach-vitality'); ?>">
  <?php if (!$hero) : ?>
    <div class="pbv-hero-photo__hint pbv-container">
      <p>Upload your beach homepage image:<br><strong>Appearance → Customize → Header Image</strong></p>
    </div>
  <?php endif; ?>
</section>

<section class="pbv-section pbv-popular" id="most-popular">
  <div class="pbv-container">
    <div class="pbv-popular__header">
      <h2 class="pbv-popular__title">Most Popular</h2>
      <a class="pbv-popular__link" href="<?php echo esc_url(home_url('/shop/')); ?>">View all</a>
    </div>

    <?php if (class_exists('WooCommerce')) : ?>
      <?php
      $popular_args = array(
          'post_type'      => 'product',
          'posts_per_page' => 8,
          'post_status'    => 'publish',
      );

      $most_cat = get_term_by('slug', 'most-popular', 'product_cat');
      if ($most_cat && !is_wp_error($most_cat)) {
          $popular_args['tax_query'] = array(
              array(
                  'taxonomy' => 'product_cat',
                  'field'    => 'slug',
                  'terms'    => 'most-popular',
              ),
          );
      }

      $popular = new WP_Query($popular_args);
      if ($popular->have_posts()) :
          echo '<ul class="products columns-4">';
          while ($popular->have_posts()) :
              $popular->the_post();
              wc_get_template_part('content', 'product');
          endwhile;
          echo '</ul>';
          wp_reset_postdata();
      else :
          echo '<p class="pbv-popular__empty">Products will appear here after import.</p>';
      endif;
      ?>
    <?php endif; ?>
  </div>
</section>

<section class="pbv-faq" id="faq">
  <div class="pbv-container pbv-faq__inner">
    <h2 class="pbv-faq__title">Frequently asked questions</h2>

    <div class="pbv-faq__list">
      <details class="pbv-faq__item">
        <summary>Are your peptides intended for human consumption or medical use?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">No. All products are intended strictly for research purposes only. They are not for human or veterinary use, not evaluated by the FDA, and not sold as drugs, supplements, or cosmetics for consumption.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>Do you provide Certificates of Analysis (COAs) and purity testing?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Yes. Every order includes a Certificate of Analysis. Most batches test at 99%+ purity via independent third-party HPLC, with full batch traceability.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>How should research peptides be stored?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Lyophilized peptides are typically stable at room temperature for short periods but should be refrigerated (2–8°C) or frozen for long-term storage. Once reconstituted, follow the protocol for that compound. Protect from light and moisture.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>Do you ship to all 50 states? How fast is shipping?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Yes. We ship to all 50 states with cold-chain packaging as needed. Overnight options are available Monday through Friday where carriers allow.</div>
      </details>

      <details class="pbv-faq__item">
        <summary>Do you offer volume or bulk pricing?<span class="pbv-faq__chevron" aria-hidden="true"></span></summary>
        <div class="pbv-faq__answer">Yes. Volume pricing is available for verified wholesale buyers. Visit our <a href="<?php echo esc_url(home_url('/wholesale/')); ?>">Wholesale</a> page to apply, or <a href="<?php echo esc_url(home_url('/contact/')); ?>">contact us</a> for a custom quote.</div>
      </details>
    </div>
  </div>
</section>

<?php
get_footer();
