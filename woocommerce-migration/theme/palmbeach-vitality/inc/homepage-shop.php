<?php
/**
 * Homepage merchandising: collection tiles + one product from each collection.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Four storefront collections, in menu order.
 *
 * @return array<int, array{slug:string,title:string,kicker:string,image:string}>
 */
function pbv_homepage_collections() {
    return array(
        array(
            'slug'   => 'peptides',
            'title'  => 'Peptides',
            'kicker' => 'Vials',
            'image'  => 'peptides-header.jpg',
        ),
        array(
            'slug'   => 'peptide-pens',
            'title'  => 'Peptide Pens',
            'kicker' => 'Ready to use',
            'image'  => 'peptide-pens-header.jpg',
        ),
        array(
            'slug'   => 'weight-loss',
            'title'  => 'Weight Loss',
            'kicker' => 'Vials',
            'image'  => 'weight-loss-header.jpg',
        ),
        array(
            'slug'   => 'weight-loss-pens',
            'title'  => 'Weight Loss Pens',
            'kicker' => 'Ready to use',
            'image'  => 'weight-loss-pens-header.jpg',
        ),
    );
}

/**
 * Two catalog products from each collection so the homepage is not BPC-only.
 *
 * @return int[]
 */
function pbv_homepage_featured_product_ids() {
    if (!function_exists('wc_get_products')) {
        return array();
    }

    $ids = array();
    foreach (pbv_homepage_collections() as $collection) {
        $found = wc_get_products(
            array(
                'status'   => 'publish',
                'limit'    => 2,
                'category' => array($collection['slug']),
                'orderby'  => 'menu_order',
                'order'    => 'ASC',
                'return'   => 'ids',
            )
        );
        if (is_array($found)) {
            foreach ($found as $id) {
                $ids[] = (int) $id;
            }
        }
    }

    return array_values(array_unique(array_filter($ids)));
}

/**
 * Collection tiles between the hero and the product grid.
 */
function pbv_render_homepage_collections() {
    $cards = pbv_homepage_collections();
    ?>
    <section class="pbv-home-shop" id="shop-collections" aria-labelledby="pbv-home-collections-title">
      <div class="pbv-container pbv-home-shop__inner">
        <h2 class="pbv-home-shop__title" id="pbv-home-collections-title">Shop collections</h2>
        <p class="pbv-home-shop__lede">Peptides, pens, and metabolic research compounds — equal space for every line.</p>
        <div class="pbv-home-collections">
          <?php foreach ($cards as $card) :
              $url   = function_exists('pbv_category_url') ? pbv_category_url($card['slug']) : home_url('/shop/');
              $image = pbv_asset_uri('assets/images/' . $card['image']);
              ?>
            <a class="pbv-home-collection" href="<?php echo esc_url($url); ?>">
              <span class="pbv-home-collection__media" style="background-image:url('<?php echo esc_url($image); ?>');"></span>
              <span class="pbv-home-collection__overlay" aria-hidden="true"></span>
              <span class="pbv-home-collection__copy">
                <span class="pbv-home-collection__kicker"><?php echo esc_html($card['kicker']); ?></span>
                <span class="pbv-home-collection__name"><?php echo esc_html($card['title']); ?></span>
              </span>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    </section>
    <?php
}

/**
 * Balanced product grid (two SKUs per collection).
 */
function pbv_render_homepage_products() {
    $ids = pbv_homepage_featured_product_ids();
    if (!$ids) {
        return;
    }

    $shop = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/');
    $id_list = implode(',', array_map('absint', $ids));
    ?>
    <section class="pbv-home-products woocommerce" aria-labelledby="pbv-home-products-title">
      <div class="pbv-container pbv-home-products__inner">
        <h2 class="pbv-home-shop__title" id="pbv-home-products-title">Featured in the lab</h2>
        <p class="pbv-home-shop__lede">Two compounds from each collection. Open any card, or browse the full catalog.</p>
        <?php
        echo do_shortcode('[products ids="' . esc_attr($id_list) . '" columns="4" orderby="post__in" limit="8"]');
        ?>
        <p class="pbv-home-products__more">
          <a class="btn" href="<?php echo esc_url($shop); ?>"><?php esc_html_e('View all products', 'palmbeach-vitality'); ?></a>
        </p>
      </div>
    </section>
    <?php
}
