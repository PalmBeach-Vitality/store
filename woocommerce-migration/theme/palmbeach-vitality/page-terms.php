<?php
/**
 * Terms and Conditions page template (slug: terms).
 *
 * @package PalmBeachVitality
 */

get_header();

$title = __('Terms and Conditions', 'palmbeach-vitality');
$content_html = pbv_default_terms_html();

if (have_posts()) {
    while (have_posts()) {
        the_post();
        $title = get_the_title() ?: $title;
        $body = trim(get_the_content());
        if ($body) {
            ob_start();
            the_content();
            $content_html = ob_get_clean();
        }
    }
}
?>
<header class="pbv-page-header">
  <div class="pbv-container">
    <h1><?php echo esc_html($title); ?></h1>
  </div>
</header>
<main id="primary" class="site-main pbv-section">
  <div class="pbv-container entry-content pbv-legal">
    <?php echo $content_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
  </div>
</main>
<?php
get_footer();
