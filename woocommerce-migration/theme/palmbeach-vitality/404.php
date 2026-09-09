<?php
/**
 * 404 — missing pages/products (do not fall through to blog "Updates").
 *
 * @package PalmBeachVitality
 */

get_header();
?>
<header class="pbv-page-header">
  <div class="pbv-container">
    <h1><?php esc_html_e('Page not found', 'palmbeach-vitality'); ?></h1>
  </div>
</header>
<main id="primary" class="site-main">
  <div class="entry-content" style="max-width:36rem;margin:0 auto;padding:2rem 1.25rem 3rem;text-align:center">
    <p><?php esc_html_e('Sorry — that page does not exist. It may have moved after our store upgrade.', 'palmbeach-vitality'); ?></p>
    <p style="margin-top:1.5rem">
      <a class="button" href="<?php echo esc_url(home_url('/shop/')); ?>"><?php esc_html_e('Browse products', 'palmbeach-vitality'); ?></a>
      &nbsp;
      <a href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('Back to home', 'palmbeach-vitality'); ?></a>
    </p>
  </div>
</main>
<?php
get_footer();
