<?php
/**
 * Technical SEO helpers (indexing, robots, sitemap, product schema).
 * No visual / copy / checkout / menu changes.
 *
 * @package PalmBeach_Vitality
 */

/**
 * Skip storefront 301s on wp-admin, AJAX, cron, and REST (MailPoet uses /wp-json/).
 *
 * @return bool
 */
function pbv_is_wp_system_request() {
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) {
        return true;
    }
    if (defined('REST_REQUEST') && REST_REQUEST) {
        return true;
    }
    $uri = isset($_SERVER['REQUEST_URI']) ? strtolower((string) wp_unslash($_SERVER['REQUEST_URI'])) : '';
    if ($uri === '') {
        return false;
    }
    if (strpos($uri, '/wp-json') !== false || strpos($uri, 'rest_route=') !== false) {
        return true;
    }
    return false;
}

/**
 * Do not let the edge cache store empty REST responses (breaks MailPoet admin).
 */
function pbv_nocache_rest_api() {
    nocache_headers();
    if (!headers_sent()) {
        header('Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0', true);
    }
}
add_action('rest_api_init', 'pbv_nocache_rest_api', 1);

/**
 * Pages that must never appear in sitemaps or Google's index.
 *
 * @return string[]
 */
function pbv_seo_noindex_slugs() {
    return array(
        'cart',
        'checkout',
        'my-account',
        'hello-world',
        'communication-preferences',
        'telehealth',
    );
}

/**
 * Crawl rules: only block private / cart-trap paths.
 * Do not Disallow URLs we 301 (Google must recrawl the redirect to drop GSC "blocked" rows).
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
        '# Palm Beach Vitality — private / cart-trap paths only',
        'User-agent: *',
        'Disallow: /*?action=qcld_',
        'Disallow: /*?*action=qcld_',
        'Disallow: /*?wc-ajax=',
        'Disallow: /*?*wc-ajax=',
        'Disallow: /wp-json/woocommerce-analytics/',
    );

    return rtrim((string) $output) . "\n" . implode("\n", $extra) . "\n";
}
add_filter('robots_txt', 'pbv_robots_txt', 100, 2);

/**
 * Storefront does not publish news — hide Jetpack news sitemap from robots.txt.
 *
 * @param bool $discover Whether to advertise news-sitemap.xml.
 * @return bool
 */
function pbv_disable_news_sitemap($discover) {
    return false;
}
add_filter('jetpack_news_sitemap_generate', 'pbv_disable_news_sitemap');

/**
 * Send X-Robots-Tag / wp_robots noindex for feeds, chatbot API query routes, and hello-world.
 *
 * @param array<string,bool|string> $robots Robots directives.
 * @return array<string,bool|string>
 */
function pbv_wp_robots_noindex_junk($robots) {
    $noindex = false;

    if (is_feed() || is_search() || is_author() || is_date() || is_attachment()) {
        $noindex = true;
    }

    if (function_exists('is_cart') && (is_cart() || is_checkout() || is_account_page())) {
        $noindex = true;
    }

    if (function_exists('is_product_tag') && is_product_tag()) {
        $noindex = true;
    }

    if (is_singular()) {
        $slug = get_post_field('post_name', get_queried_object_id());
        if ($slug && in_array($slug, pbv_seo_noindex_slugs(), true)) {
            $noindex = true;
        }
    }

    if (isset($_GET['s'])) {
        $noindex = true;
    }

    $action = isset($_GET['action']) ? sanitize_text_field(wp_unslash((string) $_GET['action'])) : '';
    if ($action !== '' && (strpos($action, 'qcld_') === 0 || strpos($action, 'qcld') !== false)) {
        $noindex = true;
    }

    if (isset($_GET['wc-ajax']) || isset($_GET['add-to-cart'])) {
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
    if (pbv_is_wp_system_request()) {
        return;
    }

    $path = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
    $path = strtok($path, '?');
    $path = '/' . trim((string) $path, '/');
    if ($path !== '/') {
        $path = rtrim($path, '/');
    }
    $lower = strtolower($path);

    $shop = home_url('/shop/');
    $home = home_url('/');

    $map = array(
        '/policies/shipping-policy'     => home_url('/terms/#shipping'),
        '/policies/terms-of-service'    => home_url('/terms/#terms-of-service'),
        '/policies/refund-policy'       => home_url('/terms/#refund'),
        '/policies/privacy-policy'      => home_url('/terms/#privacy'),
        '/collections/weight-loss-pens' => home_url('/product-category/weight-loss-pens/'),
        '/collections/weight-loss'      => home_url('/product-category/weight-loss/'),
        '/collections/peptides'         => home_url('/product-category/peptides/'),
        '/collections/peptide-pens'     => home_url('/product-category/peptide-pens/'),
        '/collections/all'              => $shop,
        '/wpm'                          => $home,
        '/services'                     => $home,
        '/products'                     => $shop,
        '/products.html'                => $shop,
        '/collections'                  => $shop,
        '/search'                       => $shop,
        '/blog'                         => $home,
        '/sample-page'                  => $home,
        '/protocols'                    => $shop,
        '/product-category'             => $shop,
        '/product'                      => $shop,
        '/cdn/shop'                     => $home,
        '/pages/about'                  => home_url('/about/'),
        '/pages/contact'                => home_url('/contact/'),
        '/pages/faq'                    => home_url('/faq/'),
        '/pages/wholesale'              => home_url('/wholesale/'),
        '/pages/terms'                  => home_url('/terms/'),
        '/pages/telehealth'             => home_url('/contact/'),
        '/peptides'                     => home_url('/product-category/peptides/'),
        '/telehealth'                   => home_url('/contact/'),
        '/hello-world'                  => $home,
        '/2026/07/29/hello-world'       => $home,
        '/research'                     => $home,
        '/privacy-policy'               => home_url('/terms/#privacy'),
        '/refund-policy'                => home_url('/terms/#refund'),
        '/refund_returns'               => home_url('/terms/#refund'),
        '/shipping-policy'              => home_url('/terms/#shipping'),
        '/terms-of-service'             => home_url('/terms/#terms-of-service'),
        '/pages/privacy-policy'         => home_url('/terms/#privacy'),
        '/pages/refund-policy'          => home_url('/terms/#refund'),
        '/pages/shipping-policy'        => home_url('/terms/#shipping'),
        '/pages/terms-of-service'       => home_url('/terms/#terms-of-service'),
        '/account'                      => home_url('/my-account/'),
        '/account/login'                => home_url('/my-account/'),
        '/account/register'             => home_url('/my-account/'),
        '/contact-us'                   => home_url('/contact/'),
        '/about-us'                     => home_url('/about/'),
        '/faqs'                         => home_url('/faq/'),
        '/about.html'                   => home_url('/about/'),
        '/faq.html'                     => home_url('/faq/'),
        '/contact.html'                 => home_url('/contact/'),
        '/wholesale.html'               => home_url('/wholesale/'),
        '/peptide-vials'                => home_url('/product-category/peptides/'),
        '/peptide-pens'                 => home_url('/product-category/peptide-pens/'),
        '/weight-loss'                  => home_url('/product-category/weight-loss/'),
        '/weight-loss-pens'             => home_url('/product-category/weight-loss-pens/'),
        '/collection/peptides'          => home_url('/product-category/peptides/'),
        '/wp-sitemap.xml'               => home_url('/sitemap.xml'),
        '/sitemap_products_1.xml'       => home_url('/sitemap.xml'),
        '/sitemap_pages_1.xml'          => home_url('/sitemap.xml'),
    );

    if (isset($map[$lower])) {
        wp_safe_redirect($map[$lower], 301);
        exit;
    }

    if (strpos($lower, '/policies/') === 0) {
        wp_safe_redirect(home_url('/terms/'), 301);
        exit;
    }

    if (strpos($lower, '/collections/') === 0) {
        wp_safe_redirect($shop, 301);
        exit;
    }

    if (strpos($lower, '/cdn/shop') === 0) {
        wp_safe_redirect($home, 301);
        exit;
    }

    if (is_attachment()) {
        $parent = wp_get_post_parent_id(get_queried_object_id());
        $dest   = $parent ? get_permalink($parent) : $home;
        if ($dest) {
            wp_safe_redirect($dest, 301);
            exit;
        }
    }

    if (is_singular('post')) {
        $slug = get_post_field('post_name', get_queried_object_id());
        if ($slug === 'hello-world') {
            wp_safe_redirect($home, 301);
            exit;
        }
    }

    if (is_page('peptides')) {
        wp_safe_redirect(home_url('/product-category/peptides/'), 301);
        exit;
    }

    if (is_page('telehealth')) {
        wp_safe_redirect(home_url('/contact/'), 301);
        exit;
    }

    if (is_author() || is_date()) {
        wp_safe_redirect($home, 301);
        exit;
    }

    if (strpos($lower, '/research/') === 0) {
        wp_safe_redirect($home, 301);
        exit;
    }

    if (strpos($lower, '/account/') === 0) {
        wp_safe_redirect(home_url('/my-account/'), 301);
        exit;
    }

    if (preg_match('#^/wp-sitemap(-.*)?\.xml$#', $lower) || preg_match('#^/sitemap_.+\.xml$#', $lower)) {
        wp_safe_redirect(home_url('/sitemap.xml'), 301);
        exit;
    }
}
add_action('template_redirect', 'pbv_redirect_legacy_storefront_paths', 0);

/**
 * Remaining HTML 404s from the Shopify / static-site era → shop.
 * Leaves wp-admin, wp-json, uploads, and binary assets as true 404s.
 */
function pbv_redirect_remaining_html_404s() {
    if (!is_404() || pbv_is_wp_system_request()) {
        return;
    }
    if (isset($_SERVER['REQUEST_METHOD']) && strtoupper((string) $_SERVER['REQUEST_METHOD']) !== 'GET') {
        return;
    }

    $path = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
    $path = strtok($path, '?');
    $lower = strtolower((string) $path);

    if (strpos($lower, '/wp-admin') === 0 || strpos($lower, '/wp-json') === 0 || strpos($lower, '/wp-content/') === 0) {
        return;
    }

    if (preg_match('/\.(png|jpe?g|gif|webp|svg|css|js|txt|json|ico|woff2?|map|pdf|xml)$/i', $lower)) {
        return;
    }

    wp_safe_redirect(home_url('/shop/'), 301);
    exit;
}
add_action('template_redirect', 'pbv_redirect_remaining_html_404s', 99);

/**
 * 301 leftover Woo product slugs that 404 (discontinued / never imported).
 */
function pbv_redirect_missing_product_slugs() {
    if (!is_404() || pbv_is_wp_system_request()) {
        return;
    }

    $path = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
    $path = strtok($path, '?');
    $path = trim((string) $path, '/');

    if (!preg_match('#^product/([^/]+)/?$#i', $path, $matches)) {
        return;
    }

    $slug = sanitize_title(rawurldecode($matches[1]));
    $weight_loss = array(
        'retatrutide',
        'retatrutide-60mg',
        'retatrutide-100mg',
        'retatrutide-200mg',
        'retatrutride-8mg-pen',
        'retatrutride-16mg-pen',
        'retatrutride-24mg-pen',
        'retatrutride-32mg-pen',
        'retatrutride-40mg-pen',
    );

    if (in_array($slug, $weight_loss, true) || strpos($slug, 'retatrut') === 0) {
        wp_safe_redirect(home_url('/product-category/weight-loss/'), 301);
        exit;
    }

    wp_safe_redirect(home_url('/shop/'), 301);
    exit;
}
add_action('template_redirect', 'pbv_redirect_missing_product_slugs', 20);

/**
 * Skip transactional / junk / attachment URLs from Jetpack XML sitemaps.
 * Jetpack passes a $wpdb row object here, not a WP_Post — do not use instanceof WP_Post.
 *
 * @param bool   $skip Whether to skip.
 * @param object $post Database row.
 * @return bool
 */
function pbv_jetpack_sitemap_skip_post($skip, $post) {
    if (!is_object($post)) {
        return $skip;
    }

    $type = isset($post->post_type) ? (string) $post->post_type : '';
    $name = isset($post->post_name) ? (string) $post->post_name : '';
    $pass = isset($post->post_password) ? (string) $post->post_password : '';

    if ($type === 'attachment' || $type === 'post') {
        return true;
    }

    $skip_slugs = array_merge(pbv_seo_noindex_slugs(), array('peptides'));
    if ($name !== '' && in_array($name, $skip_slugs, true)) {
        return true;
    }

    if ($pass !== '') {
        return true;
    }

    return $skip;
}
add_filter('jetpack_sitemap_skip_post', 'pbv_jetpack_sitemap_skip_post', 10, 2);
add_filter('jetpack_sitemap_news_skip_post', 'pbv_jetpack_sitemap_skip_post', 10, 2);

/**
 * Skip every post from the news sitemap (this is not a news publisher).
 *
 * @param bool   $skip Whether to skip.
 * @param object $post Database row.
 * @return bool
 */
function pbv_jetpack_news_skip_all($skip, $post) {
    return true;
}
add_filter('jetpack_sitemap_news_skip_post', 'pbv_jetpack_news_skip_all', 20, 2);

/**
 * Add live product category URLs to the Jetpack page sitemap.
 *
 * @param array<int,array<string,string>> $urls Extra URLs.
 * @return array<int,array<string,string>>
 */
function pbv_jetpack_sitemap_other_urls($urls) {
    if (!is_array($urls)) {
        $urls = array();
    }
    if (!taxonomy_exists('product_cat')) {
        return $urls;
    }

    $terms = get_terms(array(
        'taxonomy'   => 'product_cat',
        'hide_empty' => true,
    ));
    if (is_wp_error($terms) || empty($terms)) {
        return $urls;
    }

    foreach ($terms as $term) {
        $link = get_term_link($term);
        if (is_wp_error($link) || !$link) {
            continue;
        }
        $urls[] = array(
            'loc'     => $link,
            'lastmod' => gmdate('Y-m-d\TH:i:s\Z'),
        );
    }

    return $urls;
}
add_filter('jetpack_page_sitemap_other_urls', 'pbv_jetpack_sitemap_other_urls');

/**
 * Also exclude cart/checkout/account from core wp_sitemaps if used.
 *
 * @param array<string,mixed> $args Query args.
 * @return array<string,mixed>
 */
function pbv_wp_sitemaps_exclude_pages($args) {
    $exclude = array();
    foreach (array_merge(pbv_seo_noindex_slugs(), array('peptides')) as $slug) {
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
    if ($long !== '' && !pbv_is_ruo_boilerplate($long)) {
        return wp_html_excerpt($long, 300, '…');
    }

    $short = trim(wp_strip_all_tags((string) $product->get_short_description()));
    if ($short !== '' && !pbv_is_ruo_boilerplate($short)) {
        return wp_html_excerpt($short, 300, '…');
    }

    return sprintf(
        '%s — research-use compound from Palm Beach Vitality. Sold for laboratory research only.',
        $product->get_name()
    );
}

/**
 * Detect RUO short-description boilerplate that should never be used as SEO/meta copy.
 *
 * @param string $text Text to test.
 * @return bool
 */
function pbv_is_ruo_boilerplate($text) {
    $text = trim(wp_strip_all_tags((string) $text));
    if ($text === '') {
        return false;
    }
    return (bool) preg_match(
        '/^research[-\s]?use peptide vial\.?(\s*not for human consumption\.?)?$/i',
        $text
    );
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
            return sprintf(
                '%s — research-use compound from Palm Beach Vitality. Third-party tested with COA documentation. Laboratory research only.',
                $product->get_name()
            );
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
    } elseif (function_exists('is_product_tag') && is_product_tag()) {
        $term = get_queried_object();
        if ($term && !is_wp_error($term)) {
            $cat = get_term_by('slug', $term->slug, 'product_cat');
            if ($cat && !is_wp_error($cat)) {
                $link = get_term_link($cat);
                if (!is_wp_error($link)) {
                    $url = $link;
                }
            }
        }
    }

    if ($url) {
        echo '<link rel="canonical" href="' . esc_url($url) . '" />' . "\n";
    }
}
add_action('wp_head', 'pbv_output_seo_canonical', 3);

/**
 * Keep checkout canonical on checkout (Woo otherwise points it at cart).
 *
 * @param string  $canonical Canonical URL.
 * @param WP_Post $post      Post object.
 * @return string
 */
function pbv_filter_canonical_url($canonical, $post = null) {
    if (function_exists('is_checkout') && is_checkout() && function_exists('wc_get_checkout_url')) {
        return wc_get_checkout_url();
    }
    return $canonical;
}
add_filter('get_canonical_url', 'pbv_filter_canonical_url', 20, 2);

/**
 * Drop author/user sitemaps (those URLs 404 on this store).
 *
 * @param object|false $provider Provider.
 * @param string       $name     Provider name.
 * @return object|false
 */
function pbv_remove_users_sitemap($provider, $name) {
    if ($name === 'users') {
        return false;
    }
    return $provider;
}
add_filter('wp_sitemaps_add_provider', 'pbv_remove_users_sitemap', 10, 2);

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

/**
 * Stronger SERP title tags (document title only — no on-page visual changes).
 *
 * @param array<string,string> $parts Title parts.
 * @return array<string,string>
 */
function pbv_document_title_parts($parts) {
    $site = isset($parts['site']) && $parts['site'] !== '' ? $parts['site'] : 'Palm Beach Vitality';

    if (is_front_page()) {
        $parts['title'] = 'Palm Beach Vitality';
        $parts['tagline'] = 'Research Peptides & Peptide Pens';
        unset($parts['site']);
        return $parts;
    }

    if (function_exists('is_shop') && is_shop()) {
        $parts['title'] = 'Shop Research Peptides';
        $parts['site']  = $site;
        return $parts;
    }

    if (function_exists('is_product_category') && is_product_category()) {
        $term = get_queried_object();
        if ($term && !is_wp_error($term)) {
            $parts['title'] = sprintf('%s | Research Compounds', $term->name);
            $parts['site']  = $site;
        }
        return $parts;
    }

    if (function_exists('is_product') && is_product()) {
        global $product;
        if ($product instanceof WC_Product) {
            $parts['title'] = sprintf('%s | Research Use', $product->get_name());
            $parts['site']  = $site;
        }
        return $parts;
    }

    if (is_page('about')) {
        $parts['title'] = 'About Palm Beach Vitality';
        $parts['site']  = 'Research Peptide Supplier';
        return $parts;
    }

    if (is_page('contact')) {
        $parts['title'] = 'Contact Palm Beach Vitality';
        $parts['site']  = $site;
        return $parts;
    }

    if (is_page('wholesale')) {
        $parts['title'] = 'Wholesale Research Peptides';
        $parts['site']  = $site;
        return $parts;
    }

    return $parts;
}
add_filter('document_title_parts', 'pbv_document_title_parts', 20);

/**
 * Organization + WebSite JSON-LD (sitewide). No review/aggregateRating fields.
 */
function pbv_output_organization_website_schema() {
    if (is_admin()) {
        return;
    }

    $logo = '';
    if (function_exists('pbv_default_logo_uri')) {
        $logo = pbv_default_logo_uri();
    }
    if (has_custom_logo()) {
        $logo_id = get_theme_mod('custom_logo');
        if ($logo_id) {
            $src = wp_get_attachment_image_url((int) $logo_id, 'full');
            if ($src) {
                $logo = $src;
            }
        }
    }

    $org = array(
        '@type' => 'Organization',
        '@id'   => home_url('/#organization'),
        'name'  => 'Palm Beach Vitality',
        'url'   => home_url('/'),
        'description' => 'U.S. supplier of research-use peptides and peptide pens with third-party testing and cold-pack shipping.',
        'email' => 'sales@palmbeach-vitality.com',
        'sameAs' => array(
            'https://www.palmbeach-vitality.com',
        ),
    );
    if ($logo) {
        $org['logo'] = array(
            '@type' => 'ImageObject',
            'url'   => $logo,
        );
    }

    $website = array(
        '@type' => 'WebSite',
        '@id'   => home_url('/#website'),
        'url'   => home_url('/'),
        'name'  => 'Palm Beach Vitality',
        'description' => 'Research-use peptides and peptide pens for laboratory research.',
        'publisher' => array('@id' => home_url('/#organization')),
        'inLanguage' => 'en-US',
    );

    $graph = array(
        '@context' => 'https://schema.org',
        '@graph'   => array($org, $website),
    );

    echo '<script type="application/ld+json">' . wp_json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
}
add_action('wp_head', 'pbv_output_organization_website_schema', 4);

/**
 * Open Graph basics for key templates.
 * Keep minimal — Jetpack OG is filtered separately to avoid duplicate junk values.
 */
function pbv_output_og_basics() {
    if (is_admin()) {
        return;
    }

    // If Jetpack OG is active, it will emit tags; our jetpack_open_graph_tags filter corrects them.
    if (class_exists('Jetpack') || function_exists('jetpack_og_tags') || has_filter('jetpack_open_graph_tags')) {
        return;
    }

    $title = wp_get_document_title();
    $url   = '';
    $type  = 'website';

    if (is_front_page()) {
        $url = home_url('/');
    } elseif (function_exists('is_shop') && is_shop() && function_exists('wc_get_page_id')) {
        $url = get_permalink(wc_get_page_id('shop'));
    } elseif (function_exists('is_product_category') && is_product_category()) {
        $term = get_queried_object();
        if ($term && !is_wp_error($term)) {
            $link = get_term_link($term);
            if (!is_wp_error($link)) {
                $url = $link;
            }
        }
    } elseif (function_exists('is_product') && is_product()) {
        $url  = get_permalink();
        $type = 'product';
    } elseif (is_singular()) {
        $url = get_permalink();
    }

    if ($title) {
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
    }
    if ($url) {
        echo '<meta property="og:url" content="' . esc_url($url) . '" />' . "\n";
    }
    echo '<meta property="og:site_name" content="Palm Beach Vitality" />' . "\n";
    echo '<meta property="og:type" content="' . esc_attr($type) . '" />' . "\n";
    echo '<meta property="og:locale" content="en_US" />' . "\n";
}
add_action('wp_head', 'pbv_output_og_basics', 2);

/**
 * Prefer our document titles over Jetpack/custom SEO title fields when we have a curated pattern.
 *
 * @param string $title Current title.
 * @return string
 */
function pbv_pre_get_document_title($title) {
    if (is_search() || is_feed() || isset($_GET['s'])) {
        return $title;
    }
    $parts = array(
        'title'   => '',
        'page'    => '',
        'tagline' => '',
        'site'    => get_bloginfo('name', 'display'),
    );
    $parts = pbv_document_title_parts($parts);

    if (is_front_page()) {
        return 'Palm Beach Vitality – Research Peptides & Peptide Pens';
    }

    if (!empty($parts['title'])) {
        $site = !empty($parts['site']) ? $parts['site'] : get_bloginfo('name', 'display');
        if (!empty($parts['tagline'])) {
            return $parts['title'] . ' – ' . $parts['tagline'];
        }
        if ($site && $parts['title'] !== $site) {
            return $parts['title'] . ' – ' . $site;
        }
        return $parts['title'];
    }

    return $title;
}
add_filter('pre_get_document_title', 'pbv_pre_get_document_title', 20);

/**
 * Disable Jetpack per-page SEO title/description tags so theme-curated meta wins
 * (avoids RUO short-desc + accidental wrong About SEO fields).
 */
add_filter('jetpack_seo_meta_tags_enabled', '__return_false');

/**
 * Force Jetpack Open Graph title/description to our curated SEO values.
 *
 * @param array<string,string> $tags OG tags.
 * @return array<string,string>
 */
function pbv_filter_jetpack_open_graph_tags($tags) {
    if (!is_array($tags)) {
        $tags = array();
    }

    $desc = pbv_seo_meta_description();
    if ($desc !== '') {
        $tags['og:description'] = $desc;
    }

    $tags['og:title'] = wp_get_document_title();
    $tags['og:site_name'] = 'Palm Beach Vitality';

    if (function_exists('is_product') && is_product()) {
        $tags['og:type'] = 'product';
    }

    return $tags;
}
add_filter('jetpack_open_graph_tags', 'pbv_filter_jetpack_open_graph_tags', 99);

/**
 * Also override Jetpack's twitter card description when present.
 *
 * @param array<string,string> $tags Twitter tags.
 * @return array<string,string>
 */
function pbv_filter_jetpack_twitter_cards($tags) {
    if (!is_array($tags)) {
        return $tags;
    }
    $desc = pbv_seo_meta_description();
    if ($desc !== '') {
        $tags['twitter:description'] = $desc;
        $tags['twitter:title'] = wp_get_document_title();
    }
    return $tags;
}
add_filter('jetpack_twitter_cards_site_tag', function ($tag) {
    return $tag;
}, 10);
add_filter('twitter_cards_tags', 'pbv_filter_jetpack_twitter_cards', 99);
add_filter('jetpack_twitter_cards_title', function ($title) {
    return wp_get_document_title();
}, 99);

