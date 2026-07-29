<?php
/**
 * Palm Beach Vitality — Horizon-matched WooCommerce theme.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PBV_THEME_VERSION', '2.0.0');

function pbv_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    add_theme_support('custom-logo', array(
        'height'      => 80,
        'width'       => 240,
        'flex-height' => true,
        'flex-width'  => true,
    ));

    register_nav_menus(array(
        'primary' => __('Primary Menu', 'palmbeach-vitality'),
        'footer'  => __('Footer Menu', 'palmbeach-vitality'),
    ));
}
add_action('after_setup_theme', 'pbv_setup');

function pbv_assets() {
    wp_enqueue_style(
        'pbv-fonts',
        'https://fonts.googleapis.com/css2?family=Anonymous+Pro:wght@400;700&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
        array(),
        null
    );
    wp_enqueue_style('pbv-theme', get_stylesheet_uri(), array('pbv-fonts'), PBV_THEME_VERSION);
    wp_enqueue_script(
        'pbv-theme',
        get_template_directory_uri() . '/assets/js/theme.js',
        array(),
        PBV_THEME_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'pbv_assets');

remove_action('woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10);
remove_action('woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10);

function pbv_woo_wrapper_start() {
    echo '<main id="primary" class="site-main pbv-section"><div class="pbv-container">';
}
add_action('woocommerce_before_main_content', 'pbv_woo_wrapper_start', 10);

function pbv_woo_wrapper_end() {
    echo '</div></main>';
}
add_action('woocommerce_after_main_content', 'pbv_woo_wrapper_end', 10);

function pbv_products_per_page() {
    return 24;
}
add_filter('loop_shop_per_page', 'pbv_products_per_page');

function pbv_product_disclaimer() {
    echo '<div class="pbv-disclaimer"><strong>Research Use Only:</strong> All products are intended for research purposes only. Not for human consumption. Not evaluated by the FDA.</div>';
}
add_action('woocommerce_single_product_summary', 'pbv_product_disclaimer', 35);

function pbv_cart_link() {
    if (!function_exists('WC')) {
        return;
    }
    $count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
    echo '<a class="pbv-cart-link" href="' . esc_url(wc_get_cart_url()) . '">Cart (' . esc_html((string) $count) . ')</a>';
}

function pbv_cart_count_fragment($fragments) {
    ob_start();
    pbv_cart_link();
    $fragments['a.pbv-cart-link'] = ob_get_clean();
    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', 'pbv_cart_count_fragment');

/**
 * Product category URL helper.
 */
function pbv_category_url($slug) {
    if (function_exists('get_term_by')) {
        $term = get_term_by('slug', $slug, 'product_cat');
        if ($term && !is_wp_error($term)) {
            $link = get_term_link($term);
            if (!is_wp_error($link)) {
                return $link;
            }
        }
    }
    return home_url('/product-category/' . $slug . '/');
}

/**
 * Default primary menu: 4 shop groups + company links.
 */
function pbv_fallback_menu() {
    $links = array(
        pbv_category_url('peptides')          => 'Peptides',
        pbv_category_url('peptide-pens')      => 'Peptide Pens',
        pbv_category_url('weight-loss')       => 'Weight Loss',
        pbv_category_url('weight-loss-pens')  => 'Weight Loss Pens',
        home_url('/telehealth/')              => 'Telehealth',
        home_url('/wholesale/')               => 'Wholesale',
        home_url('/faq/')                     => 'FAQ',
        home_url('/contact/')                 => 'Contact',
    );
    echo '<ul class="menu">';
    foreach ($links as $url => $label) {
        printf('<li><a href="%s">%s</a></li>', esc_url($url), esc_html($label));
    }
    echo '</ul>';
}

/**
 * Four shop collections for homepage tiles.
 */
function pbv_shop_groups() {
    return array(
        array(
            'name'  => 'Peptides',
            'slug'  => 'peptides',
            'blurb' => 'Research vials',
            'image' => 'https://cdn.shopify.com/s/files/1/1056/1447/5345/files/image_90.jpg?v=1784042737',
        ),
        array(
            'name'  => 'Peptide Pens',
            'slug'  => 'peptide-pens',
            'blurb' => 'Ready-to-use pens',
            'image' => 'https://cdn.shopify.com/s/files/1/1056/1447/5345/files/KLOW_PEN_e76c3970-1145-46d6-adcd-cf2db8b633fe.jpg?v=1784146441',
        ),
        array(
            'name'  => 'Weight Loss',
            'slug'  => 'weight-loss',
            'blurb' => 'Metabolic vials',
            'image' => 'https://cdn.shopify.com/s/files/1/1056/1447/5345/files/image_95.jpg?v=1784047924',
        ),
        array(
            'name'  => 'Weight Loss Pens',
            'slug'  => 'weight-loss-pens',
            'blurb' => 'Metabolic pens',
            'image' => 'https://cdn.shopify.com/s/files/1/1056/1447/5345/files/SEMAGLUTIDE_PEN.jpg?v=1784299830',
        ),
    );
}
