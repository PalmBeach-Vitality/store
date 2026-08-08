<?php
/**
 * Technical SEO helpers (indexing, robots, sitemap, product schema).
 * No visual / copy / checkout / menu changes.
 *
 * @package PalmBeach_Vitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Append crawl rules that keep junk / legacy Shopify asset paths out of the index.
 *
 * @param string $output Robots.txt body.
 * @param bool   $public Blog public flag.
 * @return string
 */
function pbv_robots_txt($output, $public) {
    if (!$public) {
        return $output;
    }

    $extra = array(
        '',
        '# Palm Beach Vitality — keep non-storefront junk out of Google',
        'User-agent: *',
        'Disallow: /cdn/shop/',
        'Disallow: /services/',
        'Disallow: /wpm',
        'Disallow: /wpm/',
        'Disallow: /*?action=qcld_',
        'Disallow: /*?*action=qcld_',
        'Disallow: /*?wc-ajax=',
        'Disallow: /*?*wc-ajax=',
        'Disallow: /feed/',
        'Disallow: /*/feed/',
        'Disallow: /*/feed/atom/',
        'Disallow: /wp-json/woocommerce-analytics/',
    );

    return rtrim((string) $output) . "\n" . implode("\n", $extra) . "\n";
}
add_filter('robots_txt', 'pbv_robots_txt', 100, 2);

/**
 * Send X-Robots-Tag / wp_robots noindex for feeds, chatbot API query routes, and hello-world.
 *
 * @param array<string,bool|string> $robots Robots directives.
 * @return array<string,bool|string>
 */
function pbv_wp_robots_noindex_junk($robots) {
    $noindex = false;

    if (is_feed()) {
        $noindex = true;
    }

    if (is_singular('post')) {
        $slug = get_post_field('post_name', get_queried_object_id());
        if ($slug === 'hello-world') {
            $noindex = true;
        }
    }

    $action = isset($_GET['action']) ? sanitize_text_field(wp_unslash((string) $_GET['action'])) : '';
    if ($action !== '' && (strpos($action, 'qcld_') === 0 || strpos($action, 'qcld') !== false)) {
        $noindex = true;
    }

    if (isset($_GET['wc-ajax'])) {
        $noindex = true;
    }

    if ($noindex) {
        $robots['noindex'] = true;
        $robots['follow']  = true;
        unset($robots['index']);
    }

    return $robots;
}
add_filter('wp_robots', 'pbv_wp_robots_noindex_junk', 100);

/**
 * Extra X-Robots-Tag header for query-string API junk that may not hit wp_robots cleanly.
 */
function pbv_send_x_robots_for_junk() {
    if (is_admin()) {
        return;
    }

    $action = isset($_GET['action']) ? (string) wp_unslash($_GET['action']) : '';
    if ($action !== '' && strpos($action, 'qcld') !== false) {
        header('X-Robots-Tag: noindex, follow', true);
    }
    if (isset($_GET['wc-ajax'])) {
        header('X-Robots-Tag: noindex, follow', true);
    }
    if (is_feed()) {
        header('X-Robots-Tag: noindex, follow', true);
    }
}
add_action('send_headers', 'pbv_send_x_robots_for_junk', 20);

/**
 * 301 legacy Shopify policy / collection URLs to live WooCommerce destinations.
 * Not for marketing — crawl consolidation only. Do not promote /products/ or /collections/ URLs.
 */
function pbv_redirect_legacy_storefront_paths() {
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return;
    }

    $path = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
    $path = strtok($path, '?');
    $path = '/' . trim((string) $path, '/');
    if ($path !== '/') {
        $path = rtrim($path, '/');
    }
    $lower = strtolower($path);

    $map = array(
        '/policies/shipping-policy'  => home_url('/terms/#shipping'),
        '/policies/terms-of-service' => home_url('/terms/#terms-of-service'),
        '/policies/refund-policy'    => home_url('/terms/#refund'),
        '/policies/privacy-policy'   => home_url('/terms/#privacy'),
        '/collections/weight-loss-pens' => home_url('/product-category/weight-loss-pens/'),
        '/collections/weight-loss'      => home_url('/product-category/weight-loss/'),
        '/collections/peptides'         => home_url('/product-category/peptides/'),
        '/collections/peptide-pens'     => home_url('/product-category/peptide-pens/'),
        '/collections/all'              => home_url('/shop/'),
        '/wpm'                          => home_url('/'),
    );

    if (isset($map[$lower])) {
        wp_safe_redirect($map[$lower], 301);
        exit;
    }

    // Any other /policies/* → terms hub.
    if (strpos($lower, '/policies/') === 0) {
        wp_safe_redirect(home_url('/terms/'), 301);
        exit;
    }
}
add_action('template_redirect', 'pbv_redirect_legacy_storefront_paths', 0);

/**
 * Skip transactional / junk pages from Jetpack XML sitemaps.
 *
 * @param bool     $skip Whether to skip.
 * @param WP_Post  $post Post object.
 * @return bool
 */
function pbv_jetpack_sitemap_skip_post($skip, $post) {
    if (!$post instanceof WP_Post) {
        return $skip;
    }

    $skip_slugs = array('cart', 'checkout', 'my-account', 'hello-world');
    if (in_array($post->post_name, $skip_slugs, true)) {
        return true;
    }

    // Never sitemap feeds or password posts.
    if (!empty($post->post_password)) {
        return true;
    }

    return $skip;
}
add_filter('jetpack_sitemap_skip_post', 'pbv_jetpack_sitemap_skip_post', 10, 2);

/**
 * Also exclude cart/checkout/account from core wp_sitemaps if used.
 *
 * @param array<string,mixed> $args Query args.
 * @return array<string,mixed>
 */
function pbv_wp_sitemaps_exclude_pages($args) {
    $exclude = array();
    foreach (array('cart', 'checkout', 'my-account', 'hello-world') as $slug) {
        $page = get_page_by_path($slug);
        if ($page) {
            $exclude[] = (int) $page->ID;
        }
    }
    $hello = get_page_by_path('hello-world', OBJECT, 'post');
    if ($hello) {
        $exclude[] = (int) $hello->ID;
    }
    if ($exclude) {
        $existing = isset($args['post__not_in']) ? (array) $args['post__not_in'] : array();
        $args['post__not_in'] = array_values(array_unique(array_merge($existing, $exclude)));
    }
    return $args;
}
add_filter('wp_sitemaps_posts_query_args', 'pbv_wp_sitemaps_exclude_pages', 10, 1);

/**
 * Build OfferShippingDetails from the live shipping policy (flat $35 cold-pack, US).
 *
 * @return array<string,mixed>
 */
function pbv_schema_shipping_details() {
    return array(
        '@type'               => 'OfferShippingDetails',
        'shippingRate'        => array(
            '@type'    => 'MonetaryAmount',
            'value'    => '35.00',
            'currency' => 'USD',
        ),
        'shippingDestination' => array(
            '@type'          => 'DefinedRegion',
            'addressCountry' => 'US',
        ),
        'deliveryTime'        => array(
            '@type'        => 'ShippingDeliveryTime',
            'handlingTime' => array(
                '@type'    => 'QuantitativeValue',
                'minValue' => 1,
                'maxValue' => 2,
                'unitCode' => 'DAY',
            ),
            'transitTime'  => array(
                '@type'    => 'QuantitativeValue',
                'minValue' => 1,
                'maxValue' => 1,
                'unitCode' => 'DAY',
            ),
        ),
    );
}

/**
 * Build MerchantReturnPolicy — all sales final (matches /terms/#refund).
 *
 * @return array<string,mixed>
 */
function pbv_schema_return_policy() {
    return array(
        '@type'                => 'MerchantReturnPolicy',
        'applicableCountry'    => 'US',
        'returnPolicyCategory' => 'https://schema.org/MerchantReturnNotPermitted',
        'merchantReturnLink'   => home_url('/terms/#refund'),
        'url'                  => home_url('/terms/#refund'),
    );
}

/**
 * Prefer a real product description in schema (not the stripped RUO short line).
 *
 * @param WC_Product $product Product.
 * @return string
 */
function pbv_schema_product_description($product) {
    if (!$product instanceof WC_Product) {
        return '';
    }

    $long = trim(wp_strip_all_tags((string) $product->get_description()));
    if ($long !== '') {
        return wp_html_excerpt($long, 300, '…');
    }

    $short = trim(wp_strip_all_tags((string) $product->get_short_description()));
    // Never emit the boilerplate vial line into schema.
    if ($short !== '' && !preg_match('/^research-use peptide vial\.?/i', $short)) {
        return wp_html_excerpt($short, 300, '…');
    }

    return '';
}

/**
 * Enhance WooCommerce product JSON-LD offers for Merchant listings.
 *
 * @param array<string,mixed> $markup  Structured data.
 * @param WC_Product          $product Product.
 * @return array<string,mixed>
 */
function pbv_enhance_product_structured_data($markup, $product) {
    if (!is_array($markup)) {
        return $markup;
    }

    $desc = pbv_schema_product_description($product);
    if ($desc !== '') {
        $markup['description'] = $desc;
    }

    if (empty($markup['offers'])) {
        return $markup;
    }

    $shipping = pbv_schema_shipping_details();
    $returns  = pbv_schema_return_policy();
    $valid_from = gmdate('Y-m-d');

    $offers = $markup['offers'];
    $is_list = isset($offers[0]) && is_array($offers[0]);
    if (!$is_list) {
        $offers = array($offers);
    }

    foreach ($offers as $i => $offer) {
        if (!is_array($offer)) {
            continue;
        }
        if (empty($offer['@type'])) {
            $offer['@type'] = 'Offer';
        }
        if (empty($offer['validFrom'])) {
            $offer['validFrom'] = $valid_from;
        }
        // Mirror into priceSpecification entries when present (Jetpack/WC variant).
        if (!empty($offer['priceSpecification']) && is_array($offer['priceSpecification'])) {
            foreach ($offer['priceSpecification'] as $j => $spec) {
                if (is_array($spec) && empty($spec['validFrom'])) {
                    $offer['priceSpecification'][$j]['validFrom'] = $valid_from;
                }
            }
        }
        $offer['shippingDetails'] = $shipping;
        $offer['hasMerchantReturnPolicy'] = $returns;
        $offers[$i] = $offer;
    }

    $markup['offers'] = $is_list ? $offers : $offers[0];
    return $markup;
}
add_filter('woocommerce_structured_data_product', 'pbv_enhance_product_structured_data', 20, 2);

/**
 * Enhance individual offer markup when Woo fires the offer-specific filter.
 *
 * @param array<string,mixed> $markup  Offer markup.
 * @param WC_Product          $product Product.
 * @return array<string,mixed>
 */
function pbv_enhance_product_offer_structured_data($markup, $product) {
    if (!is_array($markup)) {
        return $markup;
    }
    if (empty($markup['validFrom'])) {
        $markup['validFrom'] = gmdate('Y-m-d');
    }
    $markup['shippingDetails'] = pbv_schema_shipping_details();
    $markup['hasMerchantReturnPolicy'] = pbv_schema_return_policy();
    return $markup;
}
add_filter('woocommerce_structured_data_product_offer', 'pbv_enhance_product_offer_structured_data', 20, 2);

/**
 * Fallback: if another plugin printed Product JSON-LD without our fields, patch in footer.
 * Only runs on single products; does not alter visible HTML.
 */
function pbv_patch_product_jsonld_footer() {
    if (!function_exists('is_product') || !is_product()) {
        return;
    }
    global $product;
    if (!$product instanceof WC_Product) {
        return;
    }

    $desc = pbv_schema_product_description($product);
    $payload = array(
        'validFrom'                 => gmdate('Y-m-d'),
        'shippingDetails'           => pbv_schema_shipping_details(),
        'hasMerchantReturnPolicy'   => pbv_schema_return_policy(),
        'description'               => $desc,
    );
    ?>
<script id="pbv-product-schema-patch">
(function(){
  var patch = <?php echo wp_json_encode($payload); ?>;
  var nodes = document.querySelectorAll('script[type="application/ld+json"]');
  nodes.forEach(function(node){
    var raw = node.textContent || '';
    if (!raw || raw.indexOf('"Product"') === -1) return;
    try {
      var data = JSON.parse(raw);
      var list = Array.isArray(data) ? data : [data];
      list.forEach(function(item){
        if (!item || item['@type'] !== 'Product') return;
        if (patch.description) item.description = patch.description;
        var offers = item.offers;
        if (!offers) return;
        var arr = Array.isArray(offers) ? offers : [offers];
        arr.forEach(function(offer){
          if (!offer || typeof offer !== 'object') return;
          if (!offer.validFrom) offer.validFrom = patch.validFrom;
          offer.shippingDetails = patch.shippingDetails;
          offer.hasMerchantReturnPolicy = patch.hasMerchantReturnPolicy;
          if (Array.isArray(offer.priceSpecification)) {
            offer.priceSpecification.forEach(function(spec){
              if (spec && !spec.validFrom) spec.validFrom = patch.validFrom;
            });
          }
        });
        item.offers = Array.isArray(offers) ? arr : arr[0];
      });
      node.textContent = JSON.stringify(Array.isArray(data) ? list : list[0]);
    } catch (e) {}
  });
})();
</script>
    <?php
}
add_action('wp_footer', 'pbv_patch_product_jsonld_footer', 99);

/**
 * Meta description for key templates (not visible on-page copy).
 *
 * @return string Empty if none.
 */
function pbv_seo_meta_description() {
    if (is_front_page()) {
        return 'Palm Beach Vitality supplies research-use peptides and peptide pens with third-party testing, COAs, and cold-pack shipping across the United States.';
    }

    if (function_exists('is_shop') && is_shop()) {
        return 'Shop research-use peptides, peptide pens, and weight-loss research compounds from Palm Beach Vitality. Lab-grade quality with documented purity testing.';
    }

    if (function_exists('is_product_category') && is_product_category()) {
        $term = get_queried_object();
        if ($term && !is_wp_error($term)) {
            $name = $term->name;
            $map  = array(
                'peptides'          => 'Browse research-use peptide vials from Palm Beach Vitality — ready-to-use formats with COA documentation.',
                'peptide-pens'      => 'Browse research-use peptide pens from Palm Beach Vitality — pre-filled pens for laboratory research workflows.',
                'weight-loss'       => 'Browse weight-loss research compounds from Palm Beach Vitality, including GLP-1 related research peptides.',
                'weight-loss-pens'  => 'Browse weight-loss research pens from Palm Beach Vitality for laboratory research use only.',
            );
            if (isset($map[$term->slug])) {
                return $map[$term->slug];
            }
            return sprintf('Browse %s from Palm Beach Vitality — research-use compounds with quality documentation.', $name);
        }
    }

    if (function_exists('is_product') && is_product()) {
        global $product;
        if ($product instanceof WC_Product) {
            $desc = pbv_schema_product_description($product);
            if ($desc !== '') {
                return $desc;
            }
            return sprintf('%s — research-use compound from Palm Beach Vitality. Not for human consumption.', $product->get_name());
        }
    }

    if (is_page('about')) {
        return 'Learn about Palm Beach Vitality — a U.S. research peptide supplier focused on purity testing, documentation, and reliable cold-chain fulfillment.';
    }

    if (is_page('contact')) {
        return 'Contact Palm Beach Vitality for order support, wholesale inquiries, or research documentation questions.';
    }

    if (is_page('wholesale')) {
        return 'Apply for Palm Beach Vitality wholesale access for verified research buyers seeking volume peptide supply.';
    }

    if (is_page('terms')) {
        return 'Palm Beach Vitality terms, shipping, privacy, and research-use policies.';
    }

    return '';
}

/**
 * Print meta description + og:description when we have a curated value.
 */
function pbv_output_seo_meta_tags() {
    if (is_admin()) {
        return;
    }

    $desc = pbv_seo_meta_description();
    if ($desc === '') {
        return;
    }

    // Avoid duplicating if an SEO plugin already printed one.
    if (defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION')) {
        // Still filter product junk via dedicated filters below.
    }

    echo '<meta name="description" content="' . esc_attr($desc) . '" />' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($desc) . '" />' . "\n";
}
add_action('wp_head', 'pbv_output_seo_meta_tags', 2);

/**
 * Ensure a self-referencing canonical on templates that currently omit one.
 */
function pbv_output_seo_canonical() {
    if (is_admin()) {
        return;
    }

    // Products / singular pages usually already have one from Woo/core.
    if (function_exists('is_product') && is_product()) {
        return;
    }
    if (is_singular() && !is_front_page()) {
        // Core often prints canonical for pages/posts.
        return;
    }

    $url = '';
    if (is_front_page()) {
        $url = home_url('/');
    } elseif (function_exists('is_shop') && is_shop()) {
        $url = get_permalink(wc_get_page_id('shop'));
    } elseif (function_exists('is_product_category') && is_product_category()) {
        $term = get_queried_object();
        if ($term && !is_wp_error($term)) {
            $link = get_term_link($term);
            if (!is_wp_error($link)) {
                $url = $link;
            }
        }
    }

    if ($url) {
        echo '<link rel="canonical" href="' . esc_url($url) . '" />' . "\n";
    }
}
add_action('wp_head', 'pbv_output_seo_canonical', 3);

/**
 * Stop Woo/Jetpack from using the RUO short-description line as the social/meta blurb.
 *
 * @param string $desc Existing description.
 * @return string
 */
function pbv_filter_product_meta_description($desc) {
    if (!function_exists('is_product') || !is_product()) {
        return $desc;
    }
    $better = pbv_seo_meta_description();
    return $better !== '' ? $better : $desc;
}
add_filter('wpseo_metadesc', 'pbv_filter_product_meta_description', 20);
add_filter('rank_math/frontend/description', 'pbv_filter_product_meta_description', 20);

