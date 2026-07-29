<?php
/**
 * Palm Beach Vitality — Shopify Horizon homepage match.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PBV_THEME_VERSION', '2.2.0');

function pbv_asset_uri($relative) {
    return trailingslashit(get_template_directory_uri()) . ltrim($relative, '/');
}

function pbv_asset_path($relative) {
    return trailingslashit(get_template_directory()) . ltrim($relative, '/');
}

/**
 * Default bundled hero (lab + Palm Beach view). Overridable via Header Image.
 */
function pbv_default_hero_uri() {
    return pbv_asset_uri('assets/images/hero.jpg');
}

/**
 * Default bundled logo mark. Overridable via Custom Logo.
 */
function pbv_default_logo_uri() {
    return pbv_asset_uri('assets/images/logo.jpg');
}

function pbv_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    add_theme_support('custom-logo', array(
        'height'      => 72,
        'width'       => 168,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    add_theme_support('custom-header', array(
        'default-image' => pbv_default_hero_uri(),
        'width'         => 1536,
        'height'        => 1024,
        'flex-height'   => true,
        'flex-width'    => true,
        'header-text'   => false,
    ));

    register_default_headers(array(
        'pbv_lab_hero' => array(
            'url'           => pbv_default_hero_uri(),
            'thumbnail_url' => pbv_default_hero_uri(),
            'description'   => __('Palm Beach Vitality lab hero', 'palmbeach-vitality'),
        ),
    ));

    register_nav_menus(array(
        'primary' => __('Primary Menu', 'palmbeach-vitality'),
    ));
}
add_action('after_setup_theme', 'pbv_setup');

/**
 * Hero URL: Customizer header image, else bundled default.
 */
function pbv_hero_image_url() {
    $hero = get_header_image();
    if ($hero) {
        return $hero;
    }
    if (file_exists(pbv_asset_path('assets/images/hero.jpg'))) {
        return pbv_default_hero_uri();
    }
    return '';
}

/**
 * Print site logo: custom logo, else bundled logo mark.
 */
function pbv_site_logo() {
    if (has_custom_logo()) {
        the_custom_logo();
        return;
    }

    $logo = pbv_default_logo_uri();
    printf(
        '<a class="custom-logo-link pbv-logo-link" href="%s" rel="home"><img class="custom-logo pbv-logo" src="%s" alt="%s" width="140" height="120" decoding="async" /></a>',
        esc_url(home_url('/')),
        esc_url($logo),
        esc_attr(get_bloginfo('name'))
    );
}

function pbv_assets() {
    wp_enqueue_style(
        'pbv-fonts',
        'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400;1,700&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
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

function pbv_customize_register($wp_customize) {
    $wp_customize->add_section('pbv_storefront', array(
        'title'    => __('Palm Beach Storefront', 'palmbeach-vitality'),
        'priority' => 30,
    ));

    $wp_customize->add_setting('pbv_announcement', array(
        'default'           => 'Notice: During the ongoing FDA compounding review, certain peptides may experience temporary supply delays. We appreciate your patience as we continue providing research-grade compounds with full documentation.',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_announcement', array(
        'label'   => __('Announcement bar text', 'palmbeach-vitality'),
        'section' => 'pbv_storefront',
        'type'    => 'textarea',
    ));
}
add_action('customize_register', 'pbv_customize_register');

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
    printf(
        '<a class="pbv-icon-link pbv-cart-link" href="%s" aria-label="%s">%s<span class="pbv-cart-count">%s</span></a>',
        esc_url(wc_get_cart_url()),
        esc_attr__('Cart', 'palmbeach-vitality'),
        pbv_icon_bag(),
        esc_html((string) $count)
    );
}

function pbv_cart_count_fragment($fragments) {
    ob_start();
    pbv_cart_link();
    $fragments['a.pbv-cart-link'] = ob_get_clean();
    return $fragments;
}
add_filter('woocommerce_add_to_cart_fragments', 'pbv_cart_count_fragment');

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

function pbv_icon_search() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
}

function pbv_icon_account() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 19c1.8-3.2 4.2-4.5 7-4.5s5.2 1.3 7 4.5"/></svg>';
}

function pbv_icon_bag() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>';
}

/**
 * Shopify homepage menu order.
 */
function pbv_fallback_menu() {
    $links = array(
        home_url('/product-category/most-popular/') => 'Most Popular',
        pbv_category_url('peptides')                => 'Peptides',
        pbv_category_url('peptide-pens')            => 'Peptide Pens',
        pbv_category_url('weight-loss')             => 'Weight Loss',
        pbv_category_url('weight-loss-pens')        => 'Weight Loss Pens',
        home_url('/wholesale/')                     => 'Wholesale',
        home_url('/contact/')                       => 'Contact Us',
        home_url('/telehealth/')                    => 'Telehealth',
    );

    // Prefer shop page as Most Popular if that category does not exist yet.
    $most = get_term_by('slug', 'most-popular', 'product_cat');
    if (!$most) {
        $links = array(home_url('/shop/') => 'Most Popular') + array_slice($links, 1, null, true);
    }

    echo '<ul class="menu">';
    foreach ($links as $url => $label) {
        printf('<li><a href="%s">%s</a></li>', esc_url($url), esc_html($label));
    }
    echo '</ul>';
}
