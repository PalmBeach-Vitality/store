<?php
/**
 * Palm Beach Vitality — Shopify Horizon homepage match.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PBV_THEME_VERSION', '2.6.3');
define('PBV_SEED_VERSION', '2.5.3');
define('PBV_MENU_FIX_VERSION', '2.5.3');

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
 * Peptides category collection header markup (lab image + centered copy).
 */
function pbv_peptides_collection_header_html() {
    $img = esc_url(pbv_asset_uri('assets/images/peptides-header.jpg'));
    return '<section class="pbv-cat-banner" style="--pbv-cat-banner-image:url(' . $img . ')" aria-label="Peptide Vials Collection">'
        . '<div class="pbv-cat-banner__overlay" aria-hidden="true"></div>'
        . '<div class="pbv-cat-banner__content">'
        . '<p class="pbv-cat-banner__title">Peptide Vials <span>Collection</span></p>'
        . '<p>Discover our premium range of pre-mixed, ready-to-use peptide vials — no reconstitution or mixing required. Each sterile multi-dose vial is third-party tested to 99.99% purity, delivering maximum convenience and potency straight from the vial.</p>'
        . '<p>Whether you\'re looking for single peptides like BPC-157, GHK-Cu, or advanced blends such as KLOW our pre-mixed vials are designed for precise dosing and reliable results. Available in multiple strengths to perfectly match your protocol needs.</p>'
        . '<p>Every product is manufactured in state-of-the-art U.S. facilities using advanced automated peptide synthesis technology. Our process combines precision solid-phase synthesis with rigorous multi-stage purification and comprehensive quality control, including HPLC and mass spectrometry testing. Produced under strict cGMP standards with full traceability and third-party verification, each vial delivers exceptional purity, potency, and consistency you can trust.</p>'
        . '<p>High-quality, hassle-free, and made for those who demand the best. Shop our full collection of pre-mixed peptide vials and elevate your research today.</p>'
        . '</div>'
        . '</section>';
}

/**
 * Output Peptides collection header on the category archive (above products).
 */
function pbv_render_peptides_archive_header() {
    if (!function_exists('is_product_category') || !is_product_category('peptides')) {
        return;
    }
    echo pbv_peptides_collection_header_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
add_action('woocommerce_archive_description', 'pbv_render_peptides_archive_header', 4);

/**
 * Prevent WooCommerce from printing a duplicate term description on Peptides
 * (we render the collection header ourselves).
 */
function pbv_suppress_peptides_term_description() {
    if (function_exists('is_product_category') && is_product_category('peptides')) {
        remove_action('woocommerce_archive_description', 'woocommerce_taxonomy_archive_description', 10);
    }
}
add_action('wp', 'pbv_suppress_peptides_term_description');


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
 * Build / refresh the Primary menu with working category + page links.
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

    // Thorough wipe — WP.com sometimes leaves orphaned nav items if only wp_delete_post is used once.
    if ($force_wipe || true) {
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

    $position = 1;
    $desired  = array(
        'Most Popular',
        'Peptides',
        'Peptide Pens',
        'Weight Loss',
        'Weight Loss Pens',
        'Wholesale',
        'Contact Us',
        'Telehealth',
    );

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

