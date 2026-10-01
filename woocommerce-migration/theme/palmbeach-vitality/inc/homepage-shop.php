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
 * Tile artwork already includes VIALS/PENS + Peptides/Metabolic labels.
 *
 * @return array<int, array{slug:string,title:string,alt:string,image:string}>
 */
function pbv_homepage_collections() {
    return array(
        array(
            'slug'   => 'peptides',
            'title'  => 'Peptides',
            'alt'    => 'Vials — Peptides',
            'image'  => 'home-peptides.jpg',
            'width'  => 1824,
            'height' => 1024,
        ),
        array(
            'slug'   => 'peptide-pens',
            'title'  => 'Peptide Pens',
            'alt'    => 'Pens — Peptides',
            'image'  => 'home-peptide-pens.jpg',
            'width'  => 1824,
            'height' => 1024,
        ),
        array(
            'slug'   => 'weight-loss',
            'title'  => 'Weight Loss',
            'alt'    => 'Vials — Metabolic',
            'image'  => 'home-weight-loss.jpg',
            'width'  => 1824,
            'height' => 1024,
        ),
        array(
            'slug'   => 'weight-loss-pens',
            'title'  => 'Weight Loss Pens',
            'alt'    => 'Pens — Metabolic',
            'image'  => 'home-weight-loss-pens.jpg',
            'width'  => 1824,
            'height' => 1024,
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
 * Tile order for the homepage grid. Same sequence on every viewport:
 * Peptide Pens, Peptide Vials, Metabolic Pens, Metabolic Vials.
 *
 * @return array<int, array{slug:string,title:string,alt:string,image:string,width:int,height:int}>
 */
function pbv_homepage_collection_tiles() {
    $by_slug = array();
    foreach (pbv_homepage_collections() as $card) {
        $by_slug[$card['slug']] = $card;
    }

    $tiles = array();
    foreach (array('peptide-pens', 'peptides', 'weight-loss-pens', 'weight-loss') as $slug) {
        if (isset($by_slug[$slug])) {
            $tiles[] = $by_slug[$slug];
        }
    }

    return $tiles;
}

/**
 * Collection tiles between the hero and the product grid.
 */
function pbv_render_homepage_collections() {
    $cards = pbv_homepage_collection_tiles();
    ?>
    <section class="pbv-home-shop" id="shop-collections" aria-labelledby="pbv-home-collections-title">
      <div class="pbv-container pbv-home-shop__inner">
        <h2 class="pbv-home-shop__title" id="pbv-home-collections-title">Shop collections</h2>
        <p class="pbv-home-shop__lede">Peptides, pens, and metabolic research compounds — intended for laboratory research use only.</p>
        <div class="pbv-home-collections">
          <?php foreach ($cards as $card) :
              $url      = function_exists('pbv_category_url') ? pbv_category_url($card['slug']) : home_url('/shop/');
              $relative = 'assets/images/' . $card['image'];
              $image    = pbv_asset_uri($relative);
              $ver      = defined('PBV_THEME_VERSION') ? PBV_THEME_VERSION : '';
              $path     = function_exists('pbv_asset_path') ? pbv_asset_path($relative) : '';
              if ($path && file_exists($path)) {
                  $ver = $ver . '-' . (string) filemtime($path);
              }
              if ($ver !== '') {
                  $image .= '?ver=' . rawurlencode($ver);
              }
              ?>
            <a
              class="pbv-home-collection"
              href="<?php echo esc_url($url); ?>"
              aria-label="<?php echo esc_attr($card['title']); ?>"
            >
              <img
                class="pbv-home-collection__img"
                src="<?php echo esc_url($image); ?>"
                alt="<?php echo esc_attr($card['alt']); ?>"
                width="<?php echo (int) $card['width']; ?>"
                height="<?php echo (int) $card['height']; ?>"
                loading="lazy"
                decoding="async"
              />
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
        <p class="pbv-home-shop__lede">Two compounds from each collection. Intended for laboratory research use only.</p>
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
