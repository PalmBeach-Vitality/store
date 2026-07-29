<?php
/**
 * Palm Beach Vitality — Shopify Horizon homepage match.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PBV_THEME_VERSION', '2.4.1');
define('PBV_SEED_VERSION', '2.4.0');

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
 * Primary menu links (used by fallback + seed).
 *
 * @return array<string,string> URL => label
 */
function pbv_menu_links() {
    $shop = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/');
    if (!$shop) {
        $shop = home_url('/shop/');
    }

    return array(
        $shop                                    => 'Most Popular',
        pbv_category_url('peptides')             => 'Peptides',
        pbv_category_url('peptide-pens')         => 'Peptide Pens',
        pbv_category_url('weight-loss')          => 'Weight Loss',
        pbv_category_url('weight-loss-pens')     => 'Weight Loss Pens',
        home_url('/wholesale/')                  => 'Wholesale',
        home_url('/contact/')                    => 'Contact Us',
        home_url('/telehealth/')                 => 'Telehealth',
    );
}

/**
 * Shopify homepage menu order.
 */
function pbv_fallback_menu() {
    echo '<ul class="menu">';
    foreach (pbv_menu_links() as $url => $label) {
        printf('<li><a href="%s">%s</a></li>', esc_url($url), esc_html($label));
    }
    echo '</ul>';
}

/**
 * Ensure product categories exist for menu links.
 */
function pbv_ensure_product_categories() {
    if (!taxonomy_exists('product_cat')) {
        return;
    }

    $cats = array(
        'peptides'         => 'Peptides',
        'peptide-pens'     => 'Peptide Pens',
        'weight-loss'      => 'Weight Loss',
        'weight-loss-pens' => 'Weight Loss Pens',
    );

    foreach ($cats as $slug => $name) {
        if (!term_exists($slug, 'product_cat')) {
            wp_insert_term($name, 'product_cat', array('slug' => $slug));
        }
    }
}

/**
 * Create a published page by slug if missing.
 *
 * @param string $slug    Page slug.
 * @param string $title   Page title.
 * @param string $content HTML content.
 * @return int Page ID.
 */
function pbv_ensure_page($slug, $title, $content = '') {
    $existing = get_page_by_path($slug);
    if ($existing) {
        return (int) $existing->ID;
    }

    return (int) wp_insert_post(array(
        'post_title'   => $title,
        'post_name'    => $slug,
        'post_status'  => 'publish',
        'post_type'    => 'page',
        'post_content' => $content,
    ));
}

/**
 * Default Terms and Conditions HTML.
 */
function pbv_default_terms_html() {
    $year = gmdate('Y');
    return <<<HTML
<p><strong>Effective date:</strong> {$year}</p>
<p>Welcome to Palm Beach Vitality. By accessing this website and placing an order, you agree to these Terms and Conditions. If you do not agree, do not use this site or purchase products.</p>

<h2>1. Research use only</h2>
<p>All products sold by Palm Beach Vitality are intended strictly for laboratory research purposes only. Products are not for human or veterinary consumption, clinical use, diagnostic use, or household use. Nothing on this site is medical advice.</p>

<h2>2. Eligibility</h2>
<p>By purchasing, you represent that you are at least 18 years of age and a qualified researcher or purchasing on behalf of a research organization. You agree to handle, store, and use products in accordance with all applicable laws and institutional policies.</p>

<h2>3. Orders and payment</h2>
<p>Orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Prices may change without notice. Payment is due as specified at checkout. For wholesale accounts, separate payment terms may apply.</p>

<h2>4. Shipping</h2>
<p>We ship to destinations we support at checkout. Delivery times are estimates. Risk of loss passes to you upon delivery to the carrier, except where prohibited by law. Cold-chain packaging is used when required for product integrity.</p>

<h2>5. Inspection and returns</h2>
<p>Inspect shipments promptly. Contact us within 48 hours of delivery for damaged, incorrect, or missing items. Because products are research materials, returns may be limited; approved returns must be unused and in original packaging unless we made an error.</p>

<h2>6. Certificates of Analysis</h2>
<p>Where provided, Certificates of Analysis (COAs) describe tested lot characteristics. You are responsible for verifying suitability for your research protocol.</p>

<h2>7. Intellectual property</h2>
<p>Site content, branding, and product imagery are owned by Palm Beach Vitality or its licensors. You may not copy or reuse them without written permission.</p>

<h2>8. Limitation of liability</h2>
<p>To the fullest extent permitted by law, Palm Beach Vitality is not liable for indirect, incidental, special, or consequential damages arising from use of the site or products. Our total liability for any claim related to an order will not exceed the amount you paid for that order.</p>

<h2>9. Indemnification</h2>
<p>You agree to indemnify and hold harmless Palm Beach Vitality from claims arising out of your misuse of products, violation of these terms, or violation of law.</p>

<h2>10. Privacy</h2>
<p>Information collected through this site is used to process orders and operate the storefront. See our privacy practices as published on this site or at checkout.</p>

<h2>11. Changes</h2>
<p>We may update these Terms and Conditions at any time by posting a revised version on this page. Continued use of the site after changes constitutes acceptance.</p>

<h2>12. Contact</h2>
<p>Questions about these terms: use our <a href="/contact/">Contact</a> page or email the address listed on the site.</p>
<p><em>Palm Beach Vitality — Precision. Purity. Performance.</em></p>
HTML;
}

/**
 * Seed pages, categories, and Primary menu so links work out of the box.
 */
function pbv_seed_storefront() {
    if (get_option('pbv_seed_version') === PBV_SEED_VERSION) {
        return;
    }

    pbv_ensure_page(
        'terms',
        'Terms and Conditions',
        pbv_default_terms_html()
    );
    pbv_ensure_page(
        'wholesale',
        'Wholesale',
        '<p>Volume pricing is available for verified wholesale buyers. Contact us to apply for a wholesale account or request a custom quote.</p><p><a href="/contact/">Contact us</a> to get started.</p>'
    );
    pbv_ensure_page(
        'contact',
        'Contact Us',
        '<p>Reach Palm Beach Vitality for order support, wholesale inquiries, or research documentation questions.</p><p>Email us through your preferred contact method, or use the form plugin on this page if installed.</p>'
    );
    pbv_ensure_page(
        'telehealth',
        'Telehealth',
        '<p>Telehealth information and partner resources will appear here. Check back soon or contact us for current options.</p>'
    );
    pbv_ensure_page(
        'faq',
        'FAQ',
        '<p>See the frequently asked questions on our <a href="/">homepage</a>, or contact us for additional support.</p>'
    );

    // Categories + taxonomy menu items need WooCommerce loaded.
    if (!taxonomy_exists('product_cat')) {
        return;
    }

    pbv_ensure_product_categories();
    pbv_seed_primary_menu();
    update_option('pbv_seed_version', PBV_SEED_VERSION);
}
add_action('after_switch_theme', 'pbv_seed_storefront');
add_action('init', 'pbv_seed_storefront', 30);
add_action('woocommerce_init', 'pbv_seed_storefront');

/**
 * Build / refresh the Primary menu with working category + page links.
 */
function pbv_seed_primary_menu() {
    $menu_name = 'Primary';
    $menu = wp_get_nav_menu_object($menu_name);
    if (!$menu) {
        $menu_id = wp_create_nav_menu($menu_name);
    } else {
        $menu_id = (int) $menu->term_id;
        $items = wp_get_nav_menu_items($menu_id);
        if ($items) {
            foreach ($items as $item) {
                wp_delete_post($item->ID, true);
            }
        }
    }

    if (is_wp_error($menu_id) || !$menu_id) {
        return;
    }

    $position = 1;

    // Most Popular → Shop
    $shop_id = function_exists('wc_get_page_id') ? wc_get_page_id('shop') : 0;
    if ($shop_id && $shop_id > 0) {
        wp_update_nav_menu_item($menu_id, 0, array(
            'menu-item-title'     => 'Most Popular',
            'menu-item-object'    => 'page',
            'menu-item-object-id' => $shop_id,
            'menu-item-type'      => 'post_type',
            'menu-item-status'    => 'publish',
            'menu-item-position'  => $position++,
        ));
    } else {
        wp_update_nav_menu_item($menu_id, 0, array(
            'menu-item-title'    => 'Most Popular',
            'menu-item-url'      => home_url('/shop/'),
            'menu-item-type'     => 'custom',
            'menu-item-status'   => 'publish',
            'menu-item-position' => $position++,
        ));
    }

    $cat_slugs = array(
        'peptides'         => 'Peptides',
        'peptide-pens'     => 'Peptide Pens',
        'weight-loss'      => 'Weight Loss',
        'weight-loss-pens' => 'Weight Loss Pens',
    );
    foreach ($cat_slugs as $slug => $label) {
        $term = get_term_by('slug', $slug, 'product_cat');
        if ($term && !is_wp_error($term)) {
            wp_update_nav_menu_item($menu_id, 0, array(
                'menu-item-title'     => $label,
                'menu-item-object'    => 'product_cat',
                'menu-item-object-id' => $term->term_id,
                'menu-item-type'      => 'taxonomy',
                'menu-item-status'    => 'publish',
                'menu-item-position'  => $position++,
            ));
        } else {
            wp_update_nav_menu_item($menu_id, 0, array(
                'menu-item-title'    => $label,
                'menu-item-url'      => home_url('/product-category/' . $slug . '/'),
                'menu-item-type'     => 'custom',
                'menu-item-status'   => 'publish',
                'menu-item-position' => $position++,
            ));
        }
    }

    foreach (array(
        'wholesale'  => 'Wholesale',
        'contact'    => 'Contact Us',
        'telehealth' => 'Telehealth',
    ) as $slug => $label) {
        $page = get_page_by_path($slug);
        if ($page) {
            wp_update_nav_menu_item($menu_id, 0, array(
                'menu-item-title'     => $label,
                'menu-item-object'    => 'page',
                'menu-item-object-id' => $page->ID,
                'menu-item-type'      => 'post_type',
                'menu-item-status'    => 'publish',
                'menu-item-position'  => $position++,
            ));
        }
    }

    $locations = get_theme_mod('nav_menu_locations');
    if (!is_array($locations)) {
        $locations = array();
    }
    $locations['primary'] = $menu_id;
    set_theme_mod('nav_menu_locations', $locations);
}

