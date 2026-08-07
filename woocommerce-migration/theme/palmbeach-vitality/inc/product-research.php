<?php
/**
 * Per-compound research study links + amino diagram assets.
 * Displayed below Add to cart on matching product pages only.
 *
 * @package PalmBeach_Vitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Research library keyed by compound slug.
 *
 * @return array<string,array{label:string,amino:string,studies:array<int,array{title:string,url:string,source:string}>}>
 */
function pbv_product_research_library() {
    return array(
        'bpc-157' => array(
            'label'  => 'BPC-157',
            'amino'  => 'assets/images/amino/bpc-157.svg',
            'studies' => array(
                array(
                    'title'  => 'Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating muscle healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/30915550/',
                    'source' => 'PubMed · Cell and Tissue Research',
                ),
                array(
                    'title'  => 'Stable Gastric Pentadecapeptide BPC 157 and Wound Healing',
                    'url'    => 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8275860/',
                    'source' => 'PMC · Frontiers in Pharmacology',
                ),
                array(
                    'title'  => 'Emerging Use of BPC-157 in Orthopaedic Sports Medicine: A Systematic Review',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/40756949/',
                    'source' => 'PubMed · HSS Journal',
                ),
                array(
                    'title'  => 'BPC 157 and Standard Angiogenic Growth Factors — Gastrointestinal Tract Healing Lessons from Tendon, Ligament, Muscle and Bone Healing',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/29998800/',
                    'source' => 'PubMed · Current Pharmaceutical Design',
                ),
                array(
                    'title'  => 'Multifunctionality and Possible Medical Application of the BPC 157 Peptide — Literature and Patent Review',
                    'url'    => 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11859134/',
                    'source' => 'PMC · Pharmaceuticals (Basel)',
                ),
                array(
                    'title'  => 'Gastric pentadecapeptide BPC 157 accelerates healing of transected rat Achilles tendon and in vitro tendon outgrowth',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/14554208/',
                    'source' => 'PubMed · Journal of Orthopaedic Research',
                ),
                array(
                    'title'  => 'The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth, cell survival, and AKT activation',
                    'url'    => 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
                    'source' => 'PubMed · Journal of Applied Physiology',
                ),
            ),
        ),
    );
}

/**
 * Resolve research compound key for the current product.
 *
 * @param WC_Product|null $product Product object.
 * @return string Compound key or empty.
 */
function pbv_product_research_key($product) {
    if (!$product instanceof WC_Product) {
        return '';
    }

    $slug = strtolower((string) $product->get_slug());
    $name = strtolower((string) $product->get_name());
    $hay  = $slug . ' ' . $name;

    // Pure BPC-157 SKUs first (vials / pens named BPC-157).
    if (strpos($hay, 'bpc-157') !== false || preg_match('/\bbpc[\s-]?157\b/', $hay)) {
        // Defer blended stacks (Wolverine / GLOW / KLOW) to their own keys later.
        if (preg_match('/\b(wolverine|glow|klow)\b/', $hay)) {
            return '';
        }
        return 'bpc-157';
    }

    return '';
}

/**
 * Render research studies + amino diagram below Add to cart.
 *
 * @param WC_Product|null $product Product object.
 */
function pbv_render_product_research_section($product = null) {
    if (!$product instanceof WC_Product) {
        global $product;
    }
    if (!$product instanceof WC_Product) {
        return;
    }

    $key = pbv_product_research_key($product);
    if ($key === '') {
        return;
    }

    $library = pbv_product_research_library();
    if (empty($library[$key]['studies']) || !is_array($library[$key]['studies'])) {
        return;
    }

    $entry   = $library[$key];
    $label   = isset($entry['label']) ? $entry['label'] : $key;
    $studies = $entry['studies'];
    $amino   = isset($entry['amino']) ? $entry['amino'] : '';
    $amino_uri = ($amino && file_exists(pbv_asset_path($amino))) ? pbv_asset_uri($amino) : '';

    echo '<section class="pbv-product-research" aria-label="' . esc_attr(sprintf(__('%s research studies', 'palmbeach-vitality'), $label)) . '">';
    echo '<h2 class="pbv-product-research__title">' . esc_html(sprintf(__('%s Research Studies', 'palmbeach-vitality'), $label)) . '</h2>';
    echo '<p class="pbv-product-research__intro">' . esc_html__('Selected English-language peer-reviewed references for laboratory research context. Links open publisher or PubMed/PMC records.', 'palmbeach-vitality') . '</p>';
    echo '<ol class="pbv-product-research__list">';

    foreach ($studies as $study) {
        $title  = isset($study['title']) ? $study['title'] : '';
        $url    = isset($study['url']) ? $study['url'] : '';
        $source = isset($study['source']) ? $study['source'] : '';
        if ($title === '' || $url === '') {
            continue;
        }
        echo '<li class="pbv-product-research__item">';
        echo '<a class="pbv-product-research__link" href="' . esc_url($url) . '" target="_blank" rel="noopener noreferrer">' . esc_html($title) . '</a>';
        if ($source !== '') {
            echo '<span class="pbv-product-research__source">' . esc_html($source) . '</span>';
        }
        echo '</li>';
    }

    echo '</ol>';

    if ($amino_uri) {
        echo '<figure class="pbv-product-research__amino">';
        echo '<img src="' . esc_url($amino_uri) . '" alt="' . esc_attr(sprintf(__('%s amino acid chain', 'palmbeach-vitality'), $label)) . '" width="720" height="232" loading="lazy" decoding="async" />';
        echo '<figcaption>' . esc_html(sprintf(__('%s — amino acid chain (N→C)', 'palmbeach-vitality'), $label)) . '</figcaption>';
        echo '</figure>';
    }

    echo '</section>';
}
