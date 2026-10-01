<?php
/**
 * Template D research pages: one card-stack overview for every compound.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once get_template_directory() . '/inc/research-catalog.php';

/**
 * @return array<string,string> Normalized related label => catalog slug.
 */
function pbv_research_label_index() {
    $index = array();
    foreach (pbv_research_catalog() as $slug => $row) {
        $index[strtolower($row['title'])] = $slug;
    }
    $index['cjc'] = 'cjc-1295';
    $index['cjc-1295 (dac)'] = 'cjc-1295';
    $index['nad+'] = 'nad';
    $index['glow stack'] = 'glow';
    $index['klow stack'] = 'klow';
    $index['wolverine stack'] = 'wolverine';
    $index['melanotan ii'] = 'melanotan';
    return $index;
}

/**
 * @param string $label Related label from the overview.
 * @return string Catalog slug or empty.
 */
function pbv_research_slug_for_label($label) {
    $index = pbv_research_label_index();
    $key = strtolower(trim($label));
    return isset($index[$key]) ? $index[$key] : '';
}

/**
 * @param string $slug Catalog slug.
 * @return string
 */
function pbv_research_url($slug = '') {
    $base = home_url('/research/');
    if ($slug === '') {
        return $base;
    }
    return home_url('/research/' . rawurlencode($slug) . '/');
}

/**
 * Amino-acid class used by the Template D sequence ruler.
 *
 * @param string $token Residue token.
 * @return string polar|hydrophobic|acidic|basic|other
 */
function pbv_research_residue_class($token) {
    $letter = strtoupper($token);
    if (strlen($letter) !== 1) {
        return 'other';
    }
    if (strpos('DE', $letter) !== false) {
        return 'acidic';
    }
    if (strpos('KRH', $letter) !== false) {
        return 'basic';
    }
    if (strpos('GSTNQYCW', $letter) !== false) {
        return 'polar';
    }
    if (strpos('AVLIMFP', $letter) !== false) {
        return 'hydrophobic';
    }
    return 'other';
}

/**
 * @param string $token Residue token.
 * @return string Three-letter code, or the token itself.
 */
function pbv_research_residue_code($token) {
    $map = array(
        'A' => 'Ala', 'R' => 'Arg', 'N' => 'Asn', 'D' => 'Asp', 'C' => 'Cys',
        'E' => 'Glu', 'Q' => 'Gln', 'G' => 'Gly', 'H' => 'His', 'I' => 'Ile',
        'L' => 'Leu', 'K' => 'Lys', 'M' => 'Met', 'F' => 'Phe', 'P' => 'Pro',
        'S' => 'Ser', 'T' => 'Thr', 'W' => 'Trp', 'Y' => 'Tyr', 'V' => 'Val',
    );
    $letter = strtoupper($token);
    return isset($map[$letter]) ? $map[$letter] : $token;
}

/**
 * @param array<string,mixed> $row Catalog row.
 */
function pbv_research_render_ruler($row) {
    $tokens = isset($row['tokens']) && is_array($row['tokens']) ? $row['tokens'] : array();
    $kind = isset($row['kind']) ? $row['kind'] : 'linear';
    echo '<div class="pbv-rd__ruler">';
    echo '<p class="pbv-rd__ruler-kicker">Amino acid sequence</p>';
    if ($tokens) {
        $dir = $kind === 'cyclic' ? 'Cyclic · N-terminus →' : 'N-terminus →';
        echo '<p class="pbv-rd__ruler-dir">' . esc_html($dir) . '</p>';
        $rows = array_chunk($tokens, 8);
        echo '<div class="pbv-rd__rows">';
        foreach ($rows as $i => $chunk) {
            echo '<div class="pbv-rd__row">';
            foreach ($chunk as $n => $token) {
                $pos = ($i * 8) + $n + 1;
                $class = pbv_research_residue_class($token);
                echo '<div class="pbv-rd__res pbv-rd__res--' . esc_attr($class) . '">';
                echo '<span class="pbv-rd__bar" aria-hidden="true"></span>';
                echo '<span class="pbv-rd__pos">' . esc_html(sprintf('%02d', $pos)) . '</span>';
                echo '<span class="pbv-rd__letter">' . esc_html($token) . '</span>';
                echo '<span class="pbv-rd__code">' . esc_html(pbv_research_residue_code($token)) . '</span>';
                echo '</div>';
            }
            if ($i === count($rows) - 1 && $kind === 'linear') {
                echo '<div class="pbv-rd__cap">→ C</div>';
            }
            echo '</div>';
        }
        echo '</div>';
        echo '<ul class="pbv-rd__legend">';
        foreach (array('polar' => 'Polar', 'hydrophobic' => 'Hydrophobic', 'acidic' => 'Acidic', 'basic' => 'Basic') as $class => $label) {
            echo '<li><span class="pbv-rd__swatch pbv-rd__swatch--' . esc_attr($class) . '"></span>' . esc_html($label) . '</li>';
        }
        echo '</ul>';
    } else {
        echo '<p class="pbv-rd__note">' . esc_html($row['sequence_note']) . '</p>';
    }
    $chips = array();
    if ($kind === 'stack') {
        $chips[] = 'Stack';
    } elseif ($kind === 'molecule') {
        $chips[] = 'Small molecule';
    } elseif ($kind === 'cyclic') {
        $chips[] = 'Cyclic';
    } else {
        $chips[] = 'Linear';
    }
    if ($tokens) {
        $chips[] = count($tokens) . ' residues';
    }
    echo '<ul class="pbv-rd__chips">';
    foreach ($chips as $chip) {
        echo '<li>' . esc_html($chip) . '</li>';
    }
    echo '</ul>';
    echo '</div>';
}

/**
 * @param array<int,string> $items
 */
function pbv_research_render_list($items) {
    echo '<ul class="pbv-rd__list">';
    foreach ($items as $item) {
        echo '<li>' . esc_html($item) . '</li>';
    }
    echo '</ul>';
}

/**
 * Card-stack overview for one compound.
 *
 * @param string $slug Catalog slug.
 */
function pbv_render_research_compound($slug) {
    $catalog = pbv_research_catalog();
    if (!isset($catalog[$slug])) {
        status_header(404);
        echo '<div class="pbv-rd"><div class="pbv-rd__inner">';
        echo '<article class="pbv-rd__card"><h1 class="pbv-rd__title">Research page not found</h1>';
        echo '<p><a class="pbv-rd__back" href="' . esc_url(pbv_research_url()) . '">← Back to research</a></p></article>';
        echo '</div></div>';
        return;
    }

    $row = $catalog[$slug];
    $library = function_exists('pbv_product_research_library') ? pbv_product_research_library() : array();
    $studies = isset($library[$slug]['studies']) && is_array($library[$slug]['studies']) ? array_slice($library[$slug]['studies'], 0, 5) : array();
    $contact = home_url('/contact/');
    $shop = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/');
    if (!$shop) {
        $shop = home_url('/shop/');
    }

    echo '<div class="pbv-rd">';
    echo '<div class="pbv-rd__inner">';

    echo '<article class="pbv-rd__card pbv-rd__hero">';
    echo '<p><a class="pbv-rd__back" href="' . esc_url(pbv_research_url()) . '">← Back to research</a></p>';
    echo '<p class="pbv-rd__kicker">' . esc_html($row['kicker']) . '</p>';
    echo '<h1 class="pbv-rd__title">' . esc_html($row['title']) . '</h1>';
    echo '<p class="pbv-rd__sub">' . esc_html($row['subtitle']) . '</p>';
    pbv_research_render_ruler($row);
    echo '</article>';

    echo '<article class="pbv-rd__card">';
    echo '<h2>Scientific Overview</h2>';
    echo '<p>' . esc_html($row['overview']) . '</p>';
    echo '</article>';

    echo '<article class="pbv-rd__card">';
    echo '<h2>Mechanism focus</h2>';
    echo '<p>' . esc_html($row['mechanism']) . '</p>';
    echo '</article>';

    echo '<article class="pbv-rd__card">';
    echo '<h2>Research Use Cases</h2>';
    pbv_research_render_list($row['uses']);
    echo '</article>';

    echo '<article class="pbv-rd__card">';
    echo '<h2>Use-Case Study Notations</h2>';
    pbv_research_render_list($row['notations']);
    echo '</article>';

    echo '<article class="pbv-rd__card">';
    echo '<h2>Selected Studies</h2>';
    echo '<ol class="pbv-rd__studies">';
    $n = 1;
    foreach ($studies as $study) {
        $title = isset($study['title']) ? $study['title'] : '';
        $url = isset($study['url']) ? $study['url'] : '';
        $source = isset($study['source']) ? $study['source'] : '';
        if ($title === '' || $url === '') {
            continue;
        }
        echo '<li><a href="' . esc_url($url) . '" target="_blank" rel="noopener noreferrer">' . esc_html(sprintf('%02d  %s', $n, $title)) . '</a>';
        if ($source !== '') {
            echo '<span>' . esc_html($source) . '</span>';
        }
        echo '</li>';
        $n++;
    }
    echo '</ol></article>';

    echo '<article class="pbv-rd__card">';
    echo '<h2>Related compounds</h2>';
    echo '<p class="pbv-rd__related">';
    $links = array();
    foreach ($row['related'] as $label) {
        $related_slug = pbv_research_slug_for_label($label);
        if ($related_slug !== '') {
            $links[] = '<a href="' . esc_url(pbv_research_url($related_slug)) . '">' . esc_html($label) . '</a>';
        } else {
            $links[] = esc_html($label);
        }
    }
    echo implode(' <span aria-hidden="true">·</span> ', $links); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo '</p></article>';

    echo '<article class="pbv-rd__card pbv-rd__disclaimer">';
    echo '<p>Research Use Only. This page is educational and intended for laboratory research context. Products are not for human consumption and are not intended to diagnose, treat, cure, or prevent any disease.</p>';
    echo '</article>';

    echo '<p class="pbv-rd__actions">';
    echo '<a class="pbv-rd__btn pbv-rd__btn--solid" href="' . esc_url($contact) . '">Request pricing</a>';
    echo '<a class="pbv-rd__btn" href="' . esc_url(add_query_arg(array('s' => $row['title'], 'post_type' => 'product'), home_url('/'))) . '">View products</a>';
    echo '<a class="pbv-rd__btn" href="' . esc_url($shop) . '">All products</a>';
    echo '</p>';

    echo '</div></div>';
}

/**
 * Pen photo when the compound is sold as a pen. Vial photo when it is not.
 *
 * @param string $slug  Catalog slug.
 * @param string $title Compound title.
 * @return array{src:string,alt:string}
 */
function pbv_research_product_photo($slug, $title) {
    $vial_only = array('aod-9604' => true);
    $format = isset($vial_only[$slug]) ? 'vial' : 'pen';
    $relative = 'assets/images/research-products/' . $slug . '.png';
    $path = function_exists('pbv_asset_path') ? pbv_asset_path($relative) : '';
    if (!$path || !file_exists($path)) {
        return array('src' => '', 'alt' => '');
    }
    $src = pbv_asset_uri($relative);
    $ver = defined('PBV_THEME_VERSION') ? PBV_THEME_VERSION : '';
    $ver = $ver . '-' . (string) filemtime($path);
    $src .= '?ver=' . rawurlencode($ver);
    return array(
        'src' => $src,
        'alt' => $title . ' ' . $format,
    );
}

/**
 * Index of every compound, in the same card system.
 */
function pbv_render_research_index() {
    $catalog = pbv_research_catalog();
    uasort($catalog, function ($a, $b) {
        return strcasecmp($a['title'], $b['title']);
    });

    echo '<div class="pbv-rd">';
    echo '<div class="pbv-rd__inner">';
    echo '<article class="pbv-rd__card pbv-rd__hero">';
    echo '<p class="pbv-rd__kicker">Research library</p>';
    echo '<h1 class="pbv-rd__title">Compound overviews</h1>';
    echo '<p class="pbv-rd__sub">Scientific context for every compound in the catalog. Laboratory research use only.</p>';
    echo '</article>';
    echo '<div class="pbv-rd__grid">';
    foreach ($catalog as $slug => $row) {
        $photo = pbv_research_product_photo($slug, $row['title']);
        echo '<a class="pbv-rd__card pbv-rd__pick" href="' . esc_url(pbv_research_url($slug)) . '">';
        if ($photo['src'] !== '') {
            echo '<img class="pbv-rd__photo" src="' . esc_url($photo['src']) . '" alt="' . esc_attr($photo['alt']) . '" width="640" height="800" decoding="async" />';
        }
        echo '<p class="pbv-rd__kicker">' . esc_html($row['kicker']) . '</p>';
        echo '<h2>' . esc_html($row['title']) . '</h2>';
        echo '<p>' . esc_html($row['subtitle']) . '</p>';
        echo '<span class="pbv-rd__more">Read overview</span>';
        echo '</a>';
    }
    echo '</div></div></div>';
}

/**
 * Register /research/{compound}/ without touching the stored menu.
 */
function pbv_register_research_rewrites() {
    add_rewrite_rule('^research/([a-z0-9-]+)/?$', 'index.php?pbv_research=$matches[1]', 'top');
}
add_action('init', 'pbv_register_research_rewrites');

/**
 * @param array<int,string> $vars Query vars.
 * @return array<int,string>
 */
function pbv_research_query_vars($vars) {
    $vars[] = 'pbv_research';
    return $vars;
}
add_filter('query_vars', 'pbv_research_query_vars');

/**
 * Flush once per theme version so the new research routes resolve.
 */
function pbv_research_flush_rewrites() {
    if (get_option('pbv_research_rewrite') === PBV_THEME_VERSION) {
        return;
    }
    pbv_register_research_rewrites();
    flush_rewrite_rules(false);
    update_option('pbv_research_rewrite', PBV_THEME_VERSION);
}
add_action('init', 'pbv_research_flush_rewrites', 20);

/**
 * @param bool     $preempt Whether to short-circuit 404 handling.
 * @param WP_Query $query   Query.
 * @return bool
 */
function pbv_research_prevent_404($preempt, $query) {
    if ($query->is_main_query() && get_query_var('pbv_research')) {
        return true;
    }
    return $preempt;
}
add_filter('pre_handle_404', 'pbv_research_prevent_404', 10, 2);

/**
 * Render a compound overview inside the normal header and footer.
 */
function pbv_research_template_redirect() {
    $slug = get_query_var('pbv_research');
    if (!$slug) {
        return;
    }
    global $wp_query;
    $wp_query->is_404 = false;
    status_header(200);
    get_header();
    echo '<main class="site-main">';
    pbv_render_research_compound($slug);
    echo '</main>';
    get_footer();
    exit;
}
add_action('template_redirect', 'pbv_research_template_redirect');

/**
 * Replace the Research page body with the compound index.
 *
 * @param string $content Page content.
 * @return string
 */
function pbv_research_index_content($content) {
    if (!is_page('research') || !in_the_loop() || !is_main_query()) {
        return $content;
    }
    ob_start();
    pbv_render_research_index();
    return (string) ob_get_clean();
}
add_filter('the_content', 'pbv_research_index_content', 20);

/**
 * @param array<string,string> $parts Title parts.
 * @return array<string,string>
 */
function pbv_research_document_title($parts) {
    $slug = get_query_var('pbv_research');
    if (!$slug) {
        return $parts;
    }
    $catalog = pbv_research_catalog();
    if (isset($catalog[$slug]['title'])) {
        $parts['title'] = $catalog[$slug]['title'] . ' — Research overview';
    }
    return $parts;
}
add_filter('document_title_parts', 'pbv_research_document_title');

/**
 * Load the card-stack stylesheet on research views.
 */
function pbv_research_assets() {
    $load = (bool) get_query_var('pbv_research');
    if (!$load && function_exists('is_page') && is_page('research')) {
        $load = true;
    }
    if (!$load) {
        return;
    }
    wp_enqueue_style(
        'pbv-research-d',
        get_template_directory_uri() . '/assets/css/research-template-d.css',
        array('pbv-theme'),
        PBV_THEME_VERSION
    );
}
add_action('wp_enqueue_scripts', 'pbv_research_assets', 20);
