<?php
/**
 * Palm Beach Peptides theme functions.
 *
 * @package PalmBeachPeptides
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PBP_THEME_VERSION', '1.0.0');

/**
 * Theme setup.
 */
function pbp_setup() {
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
        'primary' => __('Primary Menu', 'palmbeach-peptides'),
        'footer'  => __('Footer Menu', 'palmbeach-peptides'),
    ));
}
add_action('after_setup_theme', 'pbp_setup');

/**
 * Enqueue fonts + styles + mobile menu script.
 */
function pbp_assets() {
    wp_enqueue_style(
        'pbp-fonts',
        'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap',
        array(),
        null
    );
    wp_enqueue_style('pbp-theme', get_stylesheet_uri(), array('pbp-fonts'), PBP_THEME_VERSION);

    wp_enqueue_script(
        'pbp-theme',
        get_template_directory_uri() . '/assets/js/theme.js',
        array(),
        PBP_THEME_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'pbp_assets');

/**
 * WooCommerce: use theme wrappers.
 */
remove_action('woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10);
remove_action('woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10);

function pbp_woo_wrapper_start() {
    echo '<main id="primary" class="site-main pb-section"><div class="pb-container">';
}
add_action('woocommerce_before_main_content', 'pbp_woo_wrapper_start', 10);

function pbp_woo_wrapper_end() {
    echo '</div></main>';
}
add_action('woocommerce_after_main_content', 'pbp_woo_wrapper_end', 10);

/**
 * Products per page.
 */
function pbp_products_per_page() {
    return 24;
}
add_filter('loop_shop_per_page', 'pbp_products_per_page');

/**
 * Research-use disclaimer under add-to-cart.
 */
function pbp_product_disclaimer() {
    echo '<div class="pb-disclaimer"><strong>Research Use Only:</strong> All products are intended for research purposes only. Not for human consumption. Not evaluated by the FDA.</div>';
}
add_action('woocommerce_single_product_summary', 'pbp_product_disclaimer', 35);

/**
 * Cart fragment count in header.
 */
function pbp_cart_link() {
    if (!function_exists('WC')) {
        return;
    }
    $count = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
    echo '<a class="pb-cart-link" href="' . esc_url(wc_get_cart_url()) . '">Cart (' . esc_html((string) $count) . ')</a>';
}

function pbp_cart_count_fragment($fragments) {
    ob_start();
    pbp_cart_link();
    $fragments['a.pb-cart-link'] = ob_get_clean();
    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', 'pbp_cart_count_fragment');

/**
 * Fallback primary menu when no menu assigned.
 */
function pbp_fallback_menu() {
    $links = array(
        home_url('/shop/')      => 'Products',
        home_url('/about/')     => 'About',
        home_url('/research/')  => 'Research',
        home_url('/faq/')       => 'FAQ',
        home_url('/wholesale/') => 'Wholesale',
        home_url('/contact/')   => 'Contact',
    );

    echo '<ul class="menu">';
    foreach ($links as $url => $label) {
        printf('<li><a href="%s">%s</a></li>', esc_url($url), esc_html($label));
    }
    echo '</ul>';
}
