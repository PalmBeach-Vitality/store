<?php
/**
 * Palm Beach Vitality — Shopify Horizon homepage match.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PBV_THEME_VERSION', '2.7.8');
define('PBV_SEED_VERSION', '2.5.3');
define('PBV_MENU_FIX_VERSION', '2.7.1');

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
 * Bundled 9:16 mobile hero (portrait crop). Falls back to desktop hero.
 */
function pbv_hero_mobile_image_url() {
    if (file_exists(pbv_asset_path('assets/images/hero-mobile.jpg'))) {
        return pbv_asset_uri('assets/images/hero-mobile.jpg');
    }
    return pbv_hero_image_url();
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
    wp_localize_script('pbv-theme', 'pbvTheme', array(
        'ajaxUrl'       => admin_url('admin-ajax.php'),
        'nonce'         => wp_create_nonce('pbv_lead_popup'),
        'contactNonce'  => wp_create_nonce('pbv_contact_form'),
        'isHome'        => is_front_page() ? 1 : 0,
    ));
}
add_action('wp_enqueue_scripts', 'pbv_assets');

/**
 * Contact form → sales@palmbeach-vitality.com
 */
function pbv_handle_contact_form() {
    $nonce = isset($_POST['pbv_contact_nonce']) ? sanitize_text_field(wp_unslash($_POST['pbv_contact_nonce'])) : '';
    if (!$nonce) {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
    }
    if (!wp_verify_nonce($nonce, 'pbv_contact_form')) {
        wp_send_json_error(array('message' => 'Security check failed. Please refresh and try again.'), 403);
    }

    // Honeypot — bots fill this; humans leave it empty.
    $honeypot = isset($_POST['company']) ? trim((string) wp_unslash($_POST['company'])) : '';
    if ($honeypot !== '') {
        wp_send_json_success(array('message' => 'Thanks — your message has been sent.'));
    }

    $first   = isset($_POST['first_name']) ? sanitize_text_field(wp_unslash($_POST['first_name'])) : '';
    $last    = isset($_POST['last_name']) ? sanitize_text_field(wp_unslash($_POST['last_name'])) : '';
    $email   = isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
    $phone   = isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';
    $subject = isset($_POST['subject']) ? sanitize_text_field(wp_unslash($_POST['subject'])) : '';

    $errors = array();
    if ($first === '') {
        $errors[] = 'First name is required.';
    }
    if ($last === '') {
        $errors[] = 'Last name is required.';
    }
    if (!$email || !is_email($email)) {
        $errors[] = 'A valid email is required.';
    }
    if ($phone === '') {
        $errors[] = 'Phone number is required.';
    }
    if ($subject === '') {
        $errors[] = 'Subject is required.';
    }

    if ($errors) {
        wp_send_json_error(array('message' => implode(' ', $errors)), 400);
    }

    $to = 'sales@palmbeach-vitality.com';
    $mail_subject = sprintf(
        '[%s] Contact: %s',
        wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES),
        $subject
    );
    $body = "New contact form submission from palmbeach-vitality.store\n\n"
        . "First name: {$first}\n"
        . "Last name: {$last}\n"
        . "Email: {$email}\n"
        . "Phone: {$phone}\n"
        . "Subject: {$subject}\n"
        . 'Submitted: ' . gmdate('Y-m-d H:i:s') . " UTC\n"
        . 'Page: ' . home_url('/contact/') . "\n";

    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . $first . ' ' . $last . ' <' . $email . '>',
    );

    $sent = wp_mail($to, $mail_subject, $body, $headers);

    if (!$sent) {
        wp_send_json_error(array('message' => 'Could not send right now. Please email sales@palmbeach-vitality.com directly.'), 500);
    }

    wp_send_json_success(array('message' => 'Thanks — your message has been sent. We will be in touch soon.'));
}
add_action('wp_ajax_pbv_contact_form', 'pbv_handle_contact_form');
add_action('wp_ajax_nopriv_pbv_contact_form', 'pbv_handle_contact_form');

/**
 * Shopify used /products/{handle}. WooCommerce uses /product/{slug}/.
 * Old links were falling through to the blog index ("Updates").
 */
function pbv_redirect_shopify_product_urls() {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return;
    }

    $path = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
    $path = strtok($path, '?');
    $path = trim((string) $path, '/');

    if (!preg_match('#^products/([^/]+)/?$#i', $path, $matches)) {
        return;
    }

    $handle = sanitize_title(rawurldecode($matches[1]));
    if ($handle === '') {
        return;
    }

    // Audited Shopify / marketing handles → live WooCommerce product slugs.
    $aliases = array(
        '5-amino-mq' => '5-amino-mq-pen',
        '5-amino-mq-pen' => '5-amino-mq-pen',
        'aod-9604' => 'aod-9604',
        'bpc-157' => 'bpc-157-20mg',
        'bpc-157-10mg' => 'bpc-157-10mg-vial',
        'bpc-157-10mg-vial' => 'bpc-157-10mg-vial',
        'bpc-157-20mg' => 'bpc-157-20mg',
        'bpc-157-pen' => 'bpc-157-20mg',
        'cagrilintide' => 'cargrilinitide-vial',
        'cargrilinitide' => 'cargrilinitide-vial',
        'cargrilinitide-vial' => 'cargrilinitide-vial',
        'cjc-1295' => 'cjc-vial',
        'cjc-1295-dac' => 'cjc-vial',
        'cjc-ipamorelin' => 'cjc-ipamorelin-pen',
        'cjc-ipamorelin-1' => 'cjc-ipamorelin-pen',
        'cjc-ipamorelin-pen' => 'cjc-ipamorelin-pen',
        'cjc-ipamorelin-vial' => 'cjc-ipamorelin-vial',
        'cjc-vial' => 'cjc-vial',
        'dsip' => 'dsip-pen',
        'dsip-pen' => 'dsip-pen',
        'ghk-cu' => 'ghk-cu-pen',
        'ghk-cu-pen' => 'ghk-cu-pen',
        'ghk-cu-vial' => 'ghk-cu-vial',
        'glow' => 'glow-pen',
        'glow-pen' => 'glow-pen',
        'glow-vial' => 'glow-vial',
        'ipamorelin' => 'cjc-ipamorelin-pen',
        'klow' => 'klow-pen',
        'klow-pen' => 'klow-pen',
        'klow-vial' => 'klow-vial',
        'kpv' => 'kpv-pen',
        'kpv-pen' => 'kpv-pen',
        'melanotan' => 'melonotan',
        'melanotan-2' => 'melonotan',
        'melonotan' => 'melonotan',
        'mots-c' => 'mots-c-pen',
        'mots-c-pen' => 'mots-c-pen',
        'mots-c-vial' => 'mots-c-vial',
        'nad' => 'nad-pen-1000mg',
        'nad-1' => 'nad-1000mg',
        'nad-1000mg' => 'nad-1000mg',
        'nad-500mg' => 'nad-500mg',
        'nad-pen-1000mg' => 'nad-pen-1000mg',
        'nad-pen-500mg' => 'nad-pen-500mg',
        'nad-plus' => 'nad-pen-1000mg',
        'pt-141' => 'pt-141-pen',
        'pt-141-pen' => 'pt-141-pen',
        'pt-141-vial' => 'pt-141-vial',
        'retatrutide' => 'retatrutide-60mg',
        'retatrutide-100mg' => 'retatrutide-100mg',
        'retatrutide-200mg' => 'retatrutide-200mg',
        'retatrutide-60mg' => 'retatrutide-60mg',
        'retatrutride-16mg-pen' => 'retatrutride-16mg-pen',
        'retatrutride-24mg-pen' => 'retatrutride-24mg-pen',
        'retatrutride-32mg-pen' => 'retatrutride-32mg-pen',
        'retatrutride-40mg-pen' => 'retatrutride-40mg-pen',
        'retatrutride-8mg-pen' => 'retatrutride-8mg-pen',
        'selank' => 'selank-pen',
        'selank-pen' => 'selank-pen',
        'selank-vial' => 'selank-vial',
        'semaglutide' => 'semaglutide-25mg',
        'semaglutide-1-5mg-pen' => 'semaglutide-1-5mg-pen',
        'semaglutide-10mg-pen' => 'semaglutide-10mg-pen',
        'semaglutide-15mg-pen' => 'semaglutide-15mg-pen',
        'semaglutide-25mg' => 'semaglutide-25mg',
        'semaglutide-3-5mg-pen' => 'semaglutide-3-5mg-pen',
        'semaglutide-5-5mg-pen' => 'semaglutide-5-5mg-pen',
        'semaglutide-50mg' => 'semaglutide-50mg',
        'semaglutide-7-5mg-pen' => 'semaglutide-7-5mg-pen',
        'semax' => 'semax-pen',
        'semax-pen' => 'semax-pen',
        'semax-vial' => 'semax-vial',
        'sermorelin' => 'sermorelin-pen',
        'sermorelin-pen' => 'sermorelin-pen',
        'sermorelin-vial' => 'sermorelin-vial',
        'ss-31' => 'ss-31-pen',
        'ss-31-pen' => 'ss-31-pen',
        'ss-31-vial' => 'ss-31-vial',
        'ta-1' => 'ta-1',
        'ta-1-2' => 'ta-1-2',
        'ta-2' => 'ta-1',
        'tb-500' => 'tb-500-vial',
        'tb-500-pen' => 'wolverine-pen',
        'tb-500-vial' => 'tb-500-vial',
        'tesamorelin' => 'tesamorelin-10mg-pen',
        'tesamorelin-10mg-pen' => 'tesamorelin-10mg-pen',
        'tesamorelin-30mg-pen' => 'tesamorelin-30mg-pen',
        'tesamorelin-ipamorelin-pen' => 'tesamorelin-ipamorelin-pen',
        'tesamorelin-vial' => 'tesamorelin-vial',
        'tirzepatide' => 'tirzepatide-100mg',
        'tirzepatide-100mg' => 'tirzepatide-100mg',
        'tirzepatide-10mg-pen' => 'tirzepatide-10mg-pen',
        'tirzepatide-200mg' => 'tirzepatide-200mg',
        'tirzepatide-20mg-pen' => 'tirzepatide-20mg-pen',
        'tirzepatide-30mg-pen' => 'tirzepatide-30mg-pen',
        'tirzepatide-40mg-pen' => 'tirzepatide-40mg-pen',
        'tirzepatide-40mg-pen-copy' => 'tirzepatide-60mg-pen',
        'tirzepatide-50mg-pen' => 'tirzepatide-50mg-pen',
        'tirzepatide-60mg-pen' => 'tirzepatide-60mg-pen',
        'wolverine' => 'wolverine-pen',
        'wolverine-pen' => 'wolverine-pen',
        'wolverine-vial' => 'wolverine-vial',
    );

    $candidates = array($handle);
    if (isset($aliases[$handle])) {
        array_unshift($candidates, $aliases[$handle]);
    }

    // Heuristics when a pen handle has no exact match.
    if (substr($handle, -4) === '-pen') {
        $base = substr($handle, 0, -4);
        $candidates[] = $base;
        $candidates[] = $base . '-20mg';
        $candidates[] = $base . '-10mg-vial';
        $candidates[] = $base . '-10mg';
    } else {
        $candidates[] = $handle . '-pen';
        $candidates[] = $handle . '-20mg';
        $candidates[] = $handle . '-10mg-vial';
    }

    $candidates = array_values(array_unique(array_filter($candidates)));

    foreach ($candidates as $slug) {
        $posts = get_posts(array(
            'name'           => $slug,
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'fields'         => 'ids',
        ));
        if ($posts) {
            $url = get_permalink((int) $posts[0]);
            if ($url) {
                wp_safe_redirect($url, 301);
                exit;
            }
        }
    }

    // Last resort: category that matches the handle intent.
    if (strpos($handle, 'pen') !== false) {
        $term = get_term_by('slug', 'peptide-pens', 'product_cat');
        if ($term && !is_wp_error($term)) {
            $link = get_term_link($term);
            if (!is_wp_error($link)) {
                wp_safe_redirect($link, 301);
                exit;
            }
        }
    }

    wp_safe_redirect(home_url('/shop/'), 301);
    exit;
}
add_action('template_redirect', 'pbv_redirect_shopify_product_urls', 1);

/**
 * Never expose a posts/"Updates" index on this commerce site.
 */
function pbv_disable_blog_index() {
    if (is_home() && !is_front_page()) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
}
add_action('template_redirect', 'pbv_disable_blog_index', 2);

/**
 * Homepage lead popup form submission → email site admin.
 */
function pbv_handle_lead_popup() {
    check_ajax_referer('pbv_lead_popup', 'nonce');

    $email = isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
    $optin = !empty($_POST['optin']);

    if (!$email || !is_email($email)) {
        wp_send_json_error(array('message' => 'Please enter a valid email address.'), 400);
    }

    $to = get_option('admin_email');
    $subject = sprintf('[%s] Learn more request', wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES));
    $body = "New homepage lead popup submission:\n\n"
        . "Email: {$email}\n"
        . 'Marketing opt-in: ' . ($optin ? 'Yes' : 'No') . "\n"
        . 'Submitted: ' . gmdate('Y-m-d H:i:s') . " UTC\n"
        . 'Page: ' . home_url('/') . "\n";

    $headers = array('Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . $email);
    $sent = wp_mail($to, $subject, $body, $headers);

    if (!$sent) {
        wp_send_json_error(array('message' => 'Could not send right now. Please try again.'), 500);
    }

    wp_send_json_success(array('message' => 'Thanks — we will be in touch soon.'));
}
add_action('wp_ajax_pbv_lead_popup', 'pbv_handle_lead_popup');
add_action('wp_ajax_nopriv_pbv_lead_popup', 'pbv_handle_lead_popup');

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

/**
 * Prefer sharper catalog images, displayed smaller in CSS.
 * Avoid tiny 300px thumbs that look grainy when scaled up.
 */
function pbv_product_thumbnail_size($size) {
    return array(
        'width'  => 800,
        'height' => 1200,
        'crop'   => 0,
    );
}
add_filter('woocommerce_get_image_size_thumbnail', 'pbv_product_thumbnail_size');

function pbv_single_product_image_size($size) {
    return array(
        'width'  => 1000,
        'height' => 1500,
        'crop'   => 0,
    );
}
add_filter('woocommerce_get_image_size_single', 'pbv_single_product_image_size');

function pbv_archive_thumbnail_size() {
    return 'woocommerce_single';
}
add_filter('single_product_archive_thumbnail_size', 'pbv_archive_thumbnail_size');

function pbv_loop_columns() {
    return 2;
}
add_filter('loop_shop_columns', 'pbv_loop_columns');

/**
 * Single product layout (all products):
 * - Centered image + text
 * - Main description first
 * - Research use only banner at bottom of description (every product)
 * - Short description + Add to cart below it
 * - No related products / upsells / data tabs
 * - No SKU / category / tags meta row
 */
function pbv_single_product_layout() {
    remove_action('woocommerce_after_single_product_summary', 'woocommerce_output_product_data_tabs', 10);
    remove_action('woocommerce_after_single_product_summary', 'woocommerce_upsell_display', 15);
    remove_action('woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20);

    // Cover both classic and current WooCommerce hook priorities.
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 40);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 50);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40);
    remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_meta', 60);

    add_action('woocommerce_after_single_product_summary', 'pbv_single_product_details_and_cart', 10);
}
add_action('init', 'pbv_single_product_layout', 20);

/**
 * Remove every embedded Research Use Only disclaimer (text blocks + old Shopify image)
 * so each product shows exactly one theme banner.
 */
function pbv_strip_embedded_research_disclaimer($html) {
    $html = (string) $html;
    if ($html === '') {
        return $html;
    }

    // Old Shopify disclaimer graphic (image_6.jpg) pasted into many product descriptions.
    $html = preg_replace(
        '/<li[^>]*>\s*<img[^>]+(?:image_6\.jpg|Research\s*use\s*only)[^>]*>\s*<\/li>/iu',
        '',
        $html
    );
    $html = preg_replace(
        '/<p[^>]*>\s*<img[^>]+(?:image_6\.jpg|Research\s*use\s*only)[^>]*>\s*<\/p>/iu',
        '',
        $html
    );
    $html = preg_replace(
        '/<img[^>]+src=["\'][^"\']*image_6\.jpg[^"\']*["\'][^>]*>/iu',
        '',
        $html
    );
    $html = preg_replace(
        '/<img[^>]+alt=["\'][^"\']*Research\s+use\s+only[^"\']*["\'][^>]*>/iu',
        '',
        $html
    );

    if (stripos($html, 'research use only') !== false || stripos($html, 'not for human consumption') !== false) {
        $patterns = array(
            '/<(div|aside|section|p|blockquote|figure)(\s[^>]*)?>[\s\S]*?Research\s+use\s+only[\s\S]*?(?:disease\.|FDA\.)[\s\S]*?<\/\1>/iu',
            '/<(div|aside|section|p|blockquote)(\s[^>]*)?>[\s\S]*?Not for human consumption\.[\s\S]*?(?:disease\.|FDA\.)[\s\S]*?<\/\1>/iu',
            '/<(strong|b|span)(\s[^>]*)?>\s*(?:⚠️|⚠)?\s*Research\s+use\s+only:?\s*<\/\1>\s*[^<]*(?:disease\.|FDA\.)/iu',
        );

        foreach ($patterns as $pattern) {
            $html = preg_replace($pattern, '', $html);
        }
    }

    // Clean empty list items / wrappers left behind.
    $html = preg_replace('/<li[^>]*>\s*<\/li>/iu', '', $html);
    $html = preg_replace('/<p[^>]*>\s*<\/p>/iu', '', $html);
    $html = preg_replace('/<ul[^>]*>\s*<\/ul>/iu', '', $html);

    return trim((string) $html);
}

function pbv_research_use_banner() {
    echo '<aside class="pbv-ruo-banner" role="note">';
    echo '<p class="pbv-ruo-banner__title"><span class="pbv-ruo-banner__icon" aria-hidden="true">⚠</span> Research use only</p>';
    echo '<p class="pbv-ruo-banner__body">Not for human consumption. This product is sold exclusively for research and educational purposes. It is not intended to diagnose, treat, cure, or prevent any disease.</p>';
    echo '</aside>';
}

function pbv_single_product_details_and_cart() {
    if (!is_product()) {
        return;
    }

    global $product;

    echo '<div class="pbv-product-purchase">';

    $description = ($product instanceof WC_Product) ? $product->get_description() : '';
    $description = pbv_strip_embedded_research_disclaimer($description);

    echo '<div class="pbv-product-description">';
    if (trim(wp_strip_all_tags((string) $description)) !== '') {
        echo apply_filters('the_content', $description);
    }
    // Exactly one disclaimer — the large theme banner.
    pbv_research_use_banner();
    echo '</div>';

    // Short description without any embedded RUO copy/images.
    $short = ($product instanceof WC_Product) ? $product->get_short_description() : '';
    $short = pbv_strip_embedded_research_disclaimer($short);
    if (trim(wp_strip_all_tags((string) $short)) !== '') {
        echo '<div class="woocommerce-product-details__short-description">';
        echo apply_filters('woocommerce_short_description', $short);
        echo '</div>';
    }

    woocommerce_template_single_add_to_cart();

    echo '</div>';
}

add_filter('woocommerce_output_related_products_args', 'pbv_disable_related_products');
function pbv_disable_related_products($args) {
    $args['posts_per_page'] = 0;
    return $args;
}

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
 * Footer social links. Empty URL = icon shown, link pending.
 *
 * @return array<string,array{label:string,url:string,icon:string}>
 */
function pbv_social_links() {
    return array(
        'instagram' => array(
            'label' => 'Instagram',
            'url'   => 'https://www.instagram.com/palmbeachvitality/',
            'icon'  => pbv_icon_instagram(),
        ),
        'facebook' => array(
            'label' => 'Facebook',
            'url'   => 'https://www.facebook.com/profile.php?id=61592263329627',
            'icon'  => pbv_icon_facebook(),
        ),
        'whatsapp' => array(
            'label' => 'WhatsApp',
            'url'   => 'https://wa.me/19172509323',
            'icon'  => pbv_icon_whatsapp(),
        ),
        'tiktok' => array(
            'label' => 'TikTok',
            'url'   => '',
            'icon'  => pbv_icon_tiktok(),
        ),
        'youtube' => array(
            'label' => 'YouTube',
            'url'   => '',
            'icon'  => pbv_icon_youtube(),
        ),
        'twitter' => array(
            'label' => 'Twitter / X',
            'url'   => '',
            'icon'  => pbv_icon_twitter(),
        ),
    );
}

function pbv_icon_instagram() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
}

function pbv_icon_facebook() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>';
}

function pbv_icon_whatsapp() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a9.9 9.9 0 0 0-8.6 14.8L2 22l5.4-1.4A9.9 9.9 0 1 0 12 2zm0 18a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20zm4.6-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.6 6.6 0 0 1-3.1-2.7c-.2-.4.2-.4.6-1.3.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3s-1 1-1 2.4 1 2.8 1.2 3 .1.2 2 3.1c1.7 1.5 2.2 1.7 2.6 1.9.3.1.7.1 1 .1.4 0 1.1-.4 1.3-.8s.4-.7.3-.9-.2-.2-.4-.3z"/></svg>';
}

function pbv_icon_tiktok() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.5 3c.4 2.4 1.9 4.1 4.3 4.4v2.7c-1.5 0-2.9-.5-4.1-1.3v6.2c0 3.2-2.6 5.7-5.8 5.7S3 18.2 3 15s2.6-5.7 5.9-5.7c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.6 0-2.9 1.3-2.9 3s1.3 3 2.9 3 2.9-1.3 2.9-3V3h2.7z"/></svg>';
}

function pbv_icon_youtube() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.2s0-3.2-.4-4.6c-.2-.8-.9-1.5-1.7-1.7C18.5 5.5 12 5.5 12 5.5s-6.5 0-7.9.4c-.8.2-1.5.9-1.7 1.7C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.8.9 1.5 1.7 1.7 1.4.4 7.9.4 7.9.4s6.5 0 7.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.4.4-4.6.4-4.6zM10 15.2V9.3l5.2 2.95L10 15.2z"/></svg>';
}

function pbv_icon_twitter() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.7 10.5 22 3h-1.9l-6.3 6.5L8.7 3H2.5l7.7 10.2L2.5 21h1.9l6.7-6.9L15.8 21h6.2l-7.3-10.5zm-2.4 2.5-1.1-1.4L5.3 4.4h2.7l4.5 5.9 1.1 1.4 6.5 8.5h-2.7l-4.9-6.6z"/></svg>';
}

function pbv_social_links_html() {
    $links = pbv_social_links();
    if (!$links) {
        return '';
    }

    $html = '<nav class="pbv-social" aria-label="Social media">';
    $html .= '<ul class="pbv-social__list">';

    foreach ($links as $key => $item) {
        $label = $item['label'];
        $url   = trim((string) $item['url']);
        $icon  = $item['icon'];
        $ready = $url !== '';

        $html .= '<li class="pbv-social__item">';
        if ($ready) {
            $html .= sprintf(
                '<a class="pbv-social__link" href="%s" target="_blank" rel="noopener noreferrer" aria-label="%s">%s</a>',
                esc_url($url),
                esc_attr($label),
                $icon
            );
        } else {
            $html .= sprintf(
                '<span class="pbv-social__link pbv-social__link--pending" aria-label="%s (coming soon)" title="Coming soon">%s</span>',
                esc_attr($label),
                $icon
            );
        }
        $html .= '</li>';
    }

    $html .= '</ul></nav>';
    return $html;
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
        home_url('/')                            => 'Home',
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
 * Category title-image map (Peptides, Peptide Pens, Weight Loss, Weight Loss Pens).
 *
 * @return array<string,array{file:string,alt:string,width:int,height:int}>
 */
function pbv_category_title_images() {
    return array(
        'peptides' => array(
            'file'   => 'assets/images/peptides-title.png',
            'alt'    => 'Peptides',
            'width'  => 1679,
            'height' => 504,
        ),
        'peptide-pens' => array(
            'file'   => 'assets/images/peptide-pens-title.png',
            'alt'    => 'Peptide Pens',
            'width'  => 1679,
            'height' => 504,
        ),
        'weight-loss' => array(
            'file'   => 'assets/images/weight-loss-title.png',
            'alt'    => 'Weight Loss',
            'width'  => 1679,
            'height' => 504,
        ),
        'weight-loss-pens' => array(
            'file'   => 'assets/images/weight-loss-pens-title.png',
            'alt'    => 'Weight Loss Pens',
            'width'  => 1679,
            'height' => 504,
        ),
    );
}

/**
 * Shared centered category title banner markup.
 */
function pbv_category_title_banner_html($slug) {
    $map = pbv_category_title_images();
    if (!isset($map[$slug])) {
        return '';
    }

    $item = $map[$slug];
    $path = pbv_asset_path($item['file']);
    if (!file_exists($path)) {
        return '';
    }

    return sprintf(
        '<figure class="pbv-cat-title-image%s"><img src="%s" alt="%s" width="%d" height="%d" loading="eager" decoding="async" /></figure>',
        (strpos($slug, 'weight-loss') === 0) ? ' pbv-cat-title-image--weight' : '',
        esc_url(pbv_asset_uri($item['file'])),
        esc_attr($item['alt']),
        (int) $item['width'],
        (int) $item['height']
    );
}

/**
 * Render matching title images on the four main category archives.
 */
function pbv_render_category_title_banners() {
    if (!function_exists('is_product_category')) {
        return;
    }

    foreach (array_keys(pbv_category_title_images()) as $slug) {
        if (is_product_category($slug)) {
            echo pbv_category_title_banner_html($slug); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            return;
        }
    }
}
add_action('woocommerce_archive_description', 'pbv_render_category_title_banners', 4);

/**
 * Hide default WooCommerce term descriptions on categories that use title graphics.
 */
function pbv_suppress_category_term_descriptions() {
    if (!function_exists('is_product_category')) {
        return;
    }

    foreach (array_keys(pbv_category_title_images()) as $slug) {
        if (is_product_category($slug)) {
            remove_action('woocommerce_archive_description', 'woocommerce_taxonomy_archive_description', 10);
            return;
        }
    }
}
add_action('wp', 'pbv_suppress_category_term_descriptions');


/**
 * Terms and Policies sections for footer dropdown + /terms/ accordion.
 *
 * Shopify platform language removed. Brand: Palm Beach Vitality.
 *
 * @return array<string,array{title:string,html:string}>
 */
function pbv_terms_policy_sections() {
    return array(
        'refund' => array(
            'title' => 'Refund and Return Policy',
            'html'  => pbv_policy_refund_html(),
        ),
        'privacy' => array(
            'title' => 'Privacy Policy',
            'html'  => pbv_policy_privacy_html(),
        ),
        'terms-of-service' => array(
            'title' => 'Terms of Service',
            'html'  => pbv_policy_tos_html(),
        ),
        'shipping' => array(
            'title' => 'Shipping Policy',
            'html'  => pbv_policy_shipping_html(),
        ),
        'legal-notice' => array(
            'title' => 'Legal Notice',
            'html'  => pbv_policy_legal_notice_html(),
        ),
    );
}

/**
 * Combined terms HTML (legacy helper / page seed).
 */
function pbv_default_terms_html() {
    $out = '';
    foreach (pbv_terms_policy_sections() as $section) {
        $out .= '<h2>' . esc_html($section['title']) . '</h2>' . $section['html'];
    }
    return $out;
}

function pbv_policy_refund_html() {
    return <<<HTML
<h3>No Refund / No Return Policy</h3>
<p>Due to the nature of our products being research chemicals intended for laboratory use only, all sales are final. We do not accept returns, refunds, or exchanges for any reason. Please make sure you are certain about your purchase before ordering, as we cannot accept opened, used, or unused products back for hygiene, safety, and regulatory reasons.</p>
<p>By completing your purchase, you acknowledge and agree to this no refund / no return policy. If you have any questions about a product before buying, feel free to contact us. Thank you for understanding.</p>
HTML;
}

function pbv_policy_privacy_html() {
    return <<<HTML
<p><strong>Last updated:</strong> July 15, 2026</p>
<p>Palm Beach Vitality operates this store and website, including all related information, content, features, tools, products and services, in order to provide you, the customer, with a curated shopping experience (the "Services"). This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use, or make a purchase or other transaction using the Services or otherwise communicate with us. If there is a conflict between our Terms of Service and this Privacy Policy, this Privacy Policy controls with respect to the collection, processing, and disclosure of your personal information.</p>
<p>Please read this Privacy Policy carefully. By using and accessing any of the Services, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described in this Privacy Policy.</p>

<h3>Personal Information We Collect or Process</h3>
<p>When we use the term "personal information," we are referring to information that identifies or can reasonably be linked to you or another person. Personal information does not include information that is collected anonymously or that has been de-identified, so that it cannot identify or be reasonably linked to you. We may collect or process the following categories of personal information, including inferences drawn from this personal information, depending on how you interact with the Services, where you live, and as permitted or required by applicable law:</p>
<ul>
<li>Contact details including your name, address, billing address, shipping address, phone number, and email address.</li>
<li>Financial information including credit card, debit card, and financial account numbers, payment card information, financial account information, transaction details, form of payment, payment confirmation and other payment details.</li>
<li>Account information including your username, password, security questions, preferences and settings.</li>
<li>Transaction information including the items you view, put in your cart, add to your wishlist, or purchase, return, exchange or cancel and your past transactions.</li>
<li>Communications with us including the information you include in communications with us, for example, when sending a customer support inquiry.</li>
<li>Device information including information about your device, browser, or network connection, your IP address, and other unique identifiers.</li>
<li>Usage information including information regarding your interaction with the Services, including how and when you interact with or navigate the Services.</li>
</ul>

<h3>Personal Information Sources</h3>
<p>We may collect personal information from the following sources:</p>
<ul>
<li>Directly from you including when you create an account, visit or use the Services, communicate with us, or otherwise provide us with your personal information;</li>
<li>Automatically through the Services including from your device when you use our products or services or visit our websites, and through the use of cookies and similar technologies;</li>
<li>From our service providers including when we engage them to enable certain technology and when they collect or process your personal information on our behalf;</li>
<li>From our partners or other third parties.</li>
</ul>

<h3>How We Use Your Personal Information</h3>
<p>Depending on how you interact with us or which of the Services you use, we may use personal information for the following purposes:</p>
<ul>
<li><strong>Provide, Tailor, and Improve the Services.</strong> We use your personal information to provide you with the Services, including to perform our contract with you, to process your payments, to fulfill your orders, to remember your preferences and items you are interested in, to send notifications to you related to your account, to process purchases, returns, exchanges or other transactions, to create, maintain and otherwise manage your account, to arrange for shipping, to facilitate any returns and exchanges, to enable you to post reviews, and to create a customized shopping experience for you, such as recommending products related to your purchases. This may include using your personal information to better tailor and improve the Services.</li>
<li><strong>Marketing and Advertising.</strong> We use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you online advertisements for products or services on the Services or other websites, including based on items you previously have purchased or added to your cart and other activity on the Services.</li>
<li><strong>Security and Fraud Prevention.</strong> We use your personal information to authenticate your account, to provide a secure payment and shopping experience, detect, investigate or take action regarding possible fraudulent, illegal, unsafe, or malicious activity, protect public safety, and to secure our services. If you choose to use the Services and register an account, you are responsible for keeping your account credentials safe. We highly recommend that you do not share your username, password or other access details with anyone else.</li>
<li><strong>Communicating with You.</strong> We use your personal information to provide you with customer support, to be responsive to you, to provide effective services to you and to maintain our business relationship with you.</li>
<li><strong>Legal Reasons.</strong> We use your personal information to comply with applicable law or respond to valid legal process, including requests from law enforcement or government agencies, to investigate or participate in civil discovery, potential or actual litigation, or other adversarial legal proceedings, and to enforce or investigate potential violations of our terms or policies.</li>
</ul>

<h3>How We Disclose Personal Information</h3>
<p>In certain circumstances, we may disclose your personal information to third parties for legitimate purposes subject to this Privacy Policy. Such circumstances may include:</p>
<ul>
<li>With vendors and other third parties who perform services on our behalf (e.g. IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).</li>
<li>With business and marketing partners to provide marketing services and advertise to you. Our business and marketing partners will use your information in accordance with their own privacy notices. Depending on where you reside, you may have a right to direct us not to share information about you to show you targeted advertisements and marketing based on your online activity with different merchants and websites.</li>
<li>When you direct, request us or otherwise consent to our disclosure of certain information to third parties, such as to ship you products or through your use of social media widgets or login integrations.</li>
<li>With our affiliates or otherwise within our corporate group.</li>
<li>In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any applicable terms of service or policies, and to protect or defend the Services, our rights, and the rights of our users or others.</li>
</ul>

<h3>Website Hosting and Service Providers</h3>
<p>The Services are hosted and operated using third-party website, ecommerce, and infrastructure providers that collect and process personal information about your access to and use of the Services in order to provide and improve the Services for you. Information you submit to the Services may be transmitted to and shared with those providers as well as other third parties that may be located in countries other than where you reside, in order to provide and improve the Services for you.</p>

<h3>Third Party Websites and Links</h3>
<p>The Services may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies and other terms and conditions. We do not guarantee and are not responsible for the privacy or security of such sites, including the accuracy, completeness, or reliability of information found on these sites. Information you provide on public or semi-public venues, including information you share on third-party social networking platforms may also be viewable by other users of the Services and/or users of those third-party platforms without limitation as to its use by us or by a third party. Our inclusion of such links does not, by itself, imply any endorsement of the content on such platforms or of their owners or operators, except as disclosed on the Services.</p>

<h3>Children's Data</h3>
<p>The Services are not intended to be used by children, and we do not knowingly collect any personal information about children under the age of majority in your jurisdiction. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted. As of the Effective Date of this Privacy Policy, we do not have actual knowledge that we "share" or "sell" (as those terms are defined in applicable law) personal information of individuals under 16 years of age.</p>

<h3>Security and Retention of Your Information</h3>
<p>Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee "perfect security." In addition, any information you send to us may not be secure while in transit. We recommend that you do not use unsecure channels to communicate sensitive or confidential information to us.</p>
<p>How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide you with Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.</p>

<h3>Your Rights and Choices</h3>
<p>Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. However, these rights are not absolute, may apply only in certain circumstances and, in certain cases, we may decline your request as permitted by law.</p>
<ul>
<li><strong>Right to Access / Know.</strong> You may have a right to request access to personal information that we hold about you.</li>
<li><strong>Right to Delete.</strong> You may have a right to request that we delete personal information we maintain about you.</li>
<li><strong>Right to Correct.</strong> You may have a right to request that we correct inaccurate personal information we maintain about you.</li>
<li><strong>Right of Portability.</strong> You may have a right to receive a copy of the personal information we hold about you and to request that we transfer it to a third party, in certain circumstances and with certain exceptions.</li>
<li><strong>Right to Opt out of Sale or Sharing for Targeted Advertising.</strong> Depending on where you reside, you may have a right to opt out of the "sale" or "share" of your personal information or to opt out of the processing of your personal information for purposes considered to be "targeted advertising", as defined in applicable privacy laws. Please note that if you visit our website with the Global Privacy Control opt-out preference signal enabled, depending on where you are, we will automatically treat this as a request to opt-out for the device and browser that you use to visit the website. To learn more about Global Privacy Control, you can visit <a href="https://globalprivacycontrol.org/" rel="noopener noreferrer" target="_blank">https://globalprivacycontrol.org/</a>.</li>
<li><strong>Managing Communication Preferences.</strong> We may send you promotional emails, and you may opt out of receiving these at any time by using the unsubscribe option displayed in our emails to you. If you opt out, we may still send you non-promotional emails, such as those about your account or orders that you have made.</li>
</ul>
<p>You may exercise any of these rights where indicated on the Services or by contacting us using the contact details provided below.</p>
<p>We will not discriminate against you for exercising any of these rights. We may need to verify your identity before we can process your requests, as permitted or required under applicable law. In accordance with applicable laws, you may designate an authorized agent to make requests on your behalf to exercise your rights. Before accepting such a request from an agent, we will require that the agent provide proof you have authorized them to act on your behalf, and we may need you to verify your identity directly with us. We will respond to your request in a timely manner as required under applicable law.</p>

<h3>Complaints</h3>
<p>If you have complaints about how we process your personal information, please contact us using the contact details provided below. Depending on where you live, you may have the right to appeal our decision by contacting us using the contact details set out below, or lodge your complaint with your local data protection authority.</p>

<h3>International Transfers</h3>
<p>Please note that we may transfer, store and process your personal information outside the country you live in.</p>
<p>If we transfer your personal information out of the European Economic Area or the United Kingdom, we will rely on recognized transfer mechanisms like the European Commission's Standard Contractual Clauses, or any equivalent contracts issued by the relevant competent authority of the UK, as relevant, unless the data transfer is to a country that has been determined to provide an adequate level of protection.</p>

<h3>Changes to This Privacy Policy</h3>
<p>We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on this website, update the "Last updated" date and provide notice as required by applicable law.</p>

<h3>Contact</h3>
<p>Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please call <a href="tel:+15612916304">+1 561-291-6304</a> or email us at <a href="mailto:palmbeachpeptides@gmail.com">palmbeachpeptides@gmail.com</a>.</p>
HTML;
}

function pbv_policy_tos_html() {
    return <<<HTML
<p><strong>Last Updated:</strong> July 22, 2026</p>
<p>Welcome to Palm Beach Vitality (also referred to as “Palm Beach Vitality,” “we,” “us,” or “our”). By accessing or using our website and purchasing any products, you agree to be bound by these Terms of Service. Please read them carefully.</p>

<h3>1. Research Use Only</h3>
<p>All products sold on this website are intended strictly for laboratory and research use only. They are not intended for human consumption, medical treatment, or any therapeutic purpose. By purchasing from us, you confirm that you are purchasing these products solely for legitimate research purposes and that you are qualified to handle them responsibly.</p>

<h3>2. No Medical Claims or Advice</h3>
<p>We make no claims that our products can diagnose, treat, cure, or prevent any disease or medical condition. The information on this site is for informational and research purposes only and should not be considered medical advice. Always consult with a licensed healthcare professional before using any research compound.</p>

<h3>3. Eligibility</h3>
<p>You must be at least 21 years of age to purchase products from this website. By placing an order, you represent and warrant that you are 18 years or older and legally able to enter into this agreement.</p>

<h3>4. Orders, Shipping &amp; Returns</h3>
<p>All sales are final. Due to the nature of research chemicals, we do not accept returns or offer refunds. Please review our full Shipping Policy and No Refund Policy before placing an order.</p>

<h3>5. Limitation of Liability</h3>
<p>To the fullest extent permitted by law, Palm Beach Vitality shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use or inability to use our products or website. This includes, but is not limited to, any damages resulting from misuse, improper handling, or failure to follow applicable laws and regulations.</p>

<h3>6. Intellectual Property</h3>
<p>All content on this website, including text, images, logos, and product descriptions, is the property of Palm Beach Vitality and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, or use any content without prior written permission.</p>

<h3>7. Governing Law</h3>
<p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law principles. Any disputes arising under these terms shall be resolved in the courts located in Palm Beach County, Florida.</p>

<h3>8. Changes to Terms</h3>
<p>We reserve the right to update or modify these Terms of Service at any time. Any changes will be effective immediately upon posting on this page. Your continued use of the website after changes are posted constitutes your acceptance of the updated terms.</p>
<p>By using this website and making a purchase, you acknowledge that you have read, understood, and agree to these Terms of Service.</p>
<p>Questions about the Terms of Service should be sent to us at <a href="mailto:Sales@palmbeach-vitality.com">Sales@palmbeach-vitality.com</a>.</p>
<p>Sal Johnson<br><a href="mailto:Sales@palmbeach-vitality.com">Sales@palmbeach-vitality.com</a><br><a href="tel:+15612919304">(561) 291-9304</a></p>
HTML;
}

function pbv_policy_shipping_html() {
    return <<<HTML
<p>At Palm Beach Vitality, we want your experience to be as smooth and stress-free as possible. All orders are carefully packaged and shipped with full insurance included at no extra cost to you. We proudly cover all standard shipping fees within the United States.</p>

<h3>Shipping &amp; Delivery</h3>
<p>Most orders ship within 1–2 business days. Delivery times typically range from 3–7 business days depending on your location. You will receive a tracking number via email once your order has shipped.</p>

<h3>Damaged, Lost, or Stolen Packages</h3>
<p>All shipments are fully insured. In the rare event that your package arrives damaged, is lost, or is stolen, please contact us immediately with a report from the shipping carrier (USPS, UPS, FedEx, etc.). Upon receiving the required documentation, we will gladly replace your order at no additional charge.</p>
<p>We take great care in packaging and shipping every order. If you have any questions about your shipment, feel free to reach out to our support team — we’re here to help.</p>
<p>Thank you for choosing Palm Beach Vitality.</p>
HTML;
}

function pbv_policy_legal_notice_html() {
    return <<<HTML
<p><strong>Legal Notice &amp; Research Use Only Disclaimer</strong><br>Palm Beach Vitality<br><strong>Effective Date:</strong> July 22, 2026</p>
<p>All products sold by Palm Beach Vitality are intended strictly for laboratory research purposes only.</p>
<p>These materials are not:</p>
<ul>
<li>Intended for human consumption</li>
<li>Intended for veterinary use</li>
<li>Intended for medical, diagnostic, therapeutic, or clinical use</li>
<li>Intended to diagnose, treat, cure, or prevent any disease</li>
</ul>
<p>By purchasing from this website, you represent and warrant that:</p>
<ul>
<li>You are at least 18 years of age.</li>
<li>You are a qualified researcher or laboratory professional purchasing these materials solely for legitimate scientific research.</li>
<li>You understand the potential hazards associated with handling research-grade compounds and will handle, store, and dispose of them in accordance with proper laboratory safety protocols.</li>
<li>You will comply with all applicable local, state, federal, and international laws and regulations regarding the purchase, possession, and use of these materials.</li>
<li>You will not use these products in or on humans or animals under any circumstances.</li>
</ul>

<h3>No Medical Claims</h3>
<p>Nothing on this website constitutes medical advice. Palm Beach Vitality does not make any claims regarding the safety, efficacy, or suitability of any product for any purpose other than laboratory research. These statements have not been evaluated by the U.S. Food and Drug Administration (FDA).</p>

<h3>Assumption of Risk &amp; Limitation of Liability</h3>
<p>All products are sold “as is.” The purchaser assumes full responsibility and risk for the handling, storage, use, and disposal of any products purchased from Palm Beach Vitality. Palm Beach Vitality, its owners, employees, and affiliates shall not be held liable for any damages, injuries, losses, or legal consequences arising from the misuse, mishandling, or unauthorized use of these materials.</p>

<h3>Indemnification</h3>
<p>By completing a purchase, you agree to indemnify, defend, and hold harmless Palm Beach Vitality and its affiliates from any and all claims, liabilities, damages, costs, and expenses (including reasonable attorney’s fees) arising out of your use or misuse of any products purchased from this site.</p>

<h3>Age &amp; Qualification Requirement</h3>
<p>You must be 18 years of age or older to purchase. By placing an order you confirm you meet this requirement and are purchasing solely for research purposes.</p>
<p>If you do not agree to these terms in full, do not purchase or use any products from this website.</p>
HTML;
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
        // Keep Terms page title/content in sync with latest policies.
        if ($slug === 'terms') {
            wp_update_post(array(
                'ID'           => $existing->ID,
                'post_title'   => $title,
                'post_content' => $content,
            ));
        }
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
 * Seed pages, categories, and Primary menu so links work out of the box.
 */
function pbv_seed_storefront() {
    if (get_option('pbv_seed_version') === PBV_SEED_VERSION) {
        return;
    }

    pbv_ensure_page(
        'terms',
        'Terms and Policies',
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
    // Do not rebuild menu on every seed — menu has its own one-time fix routine.
    update_option('pbv_seed_version', PBV_SEED_VERSION);
}
add_action('after_switch_theme', 'pbv_seed_storefront');
add_action('init', 'pbv_seed_storefront', 30);
add_action('woocommerce_init', 'pbv_seed_storefront');

/**
 * One-time Primary menu rebuild: wipe duplicates, keep a single clean set.
 */
function pbv_fix_primary_menu_once() {
    if (get_option('pbv_menu_fix_version') === PBV_MENU_FIX_VERSION) {
        return;
    }
    if (!taxonomy_exists('product_cat')) {
        return;
    }

    pbv_ensure_product_categories();
    pbv_seed_primary_menu(true);
    update_option('pbv_menu_fix_version', PBV_MENU_FIX_VERSION);
}
add_action('init', 'pbv_fix_primary_menu_once', 40);
add_action('woocommerce_init', 'pbv_fix_primary_menu_once');

/**
 * Build / refresh the Primary menu.
 *
 * Always uses custom URL items so missing pages/terms never drop links
 * from the nav (WP hides broken object-based menu items).
 *
 * @param bool $force_wipe Delete every existing item before recreating.
 */
function pbv_seed_primary_menu($force_wipe = false) {
    $menu_name = 'Primary';
    $menu = wp_get_nav_menu_object($menu_name);
    if (!$menu) {
        $menu_id = wp_create_nav_menu($menu_name);
    } else {
        $menu_id = (int) $menu->term_id;
    }

    if (is_wp_error($menu_id) || !$menu_id) {
        return;
    }

    // Only wipe when explicitly rebuilding (one-time menu fix).
    if ($force_wipe) {
        $object_ids = get_objects_in_term($menu_id, 'nav_menu');
        if (!is_wp_error($object_ids) && $object_ids) {
            foreach ($object_ids as $object_id) {
                wp_delete_post((int) $object_id, true);
            }
        }
        $items = wp_get_nav_menu_items($menu_id, array('post_status' => 'any'));
        if ($items) {
            foreach ($items as $item) {
                wp_delete_post($item->ID, true);
            }
        }
    }

    $desired = array(
        'Home',
        'Most Popular',
        'Peptides',
        'Peptide Pens',
        'Weight Loss',
        'Weight Loss Pens',
        'Wholesale',
        'Contact Us',
        'Telehealth',
    );

    // Custom links only — never skip an item if a page/term lookup fails.
    $position = 1;
    foreach (pbv_menu_links() as $url => $label) {
        wp_update_nav_menu_item($menu_id, 0, array(
            'menu-item-title'    => $label,
            'menu-item-url'      => $url,
            'menu-item-type'     => 'custom',
            'menu-item-status'   => 'publish',
            'menu-item-position' => $position++,
        ));
    }

    $locations = get_theme_mod('nav_menu_locations');
    if (!is_array($locations)) {
        $locations = array();
    }
    $locations['primary'] = $menu_id;
    set_theme_mod('nav_menu_locations', $locations);

    // Final safety: remove any leftover duplicate titles.
    pbv_dedupe_menu_items($menu_id, $desired);
}

/**
 * Keep only the first menu item for each expected title.
 *
 * @param int   $menu_id Menu term ID.
 * @param array $titles  Allowed titles in order.
 */
function pbv_dedupe_menu_items($menu_id, $titles) {
    $items = wp_get_nav_menu_items($menu_id, array('post_status' => 'any'));
    if (!$items) {
        return;
    }

    $seen = array();
    foreach ($items as $item) {
        $title = trim(wp_strip_all_tags($item->title));
        if ($title === '') {
            continue;
        }
        if (isset($seen[$title])) {
            wp_delete_post($item->ID, true);
            continue;
        }
        // Drop unexpected duplicates of known labels only; keep unknown custom links.
        if (in_array($title, $titles, true)) {
            $seen[$title] = true;
        }
    }
}

