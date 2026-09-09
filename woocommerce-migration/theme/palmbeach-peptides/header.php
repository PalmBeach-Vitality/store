<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="site-wrap">
  <div class="pb-topbar">
    <div class="pb-container pb-topbar__inner">
      <strong>USA Manufactured · 99.9% Purity · COA on Every Order</strong>
      <div class="pb-topbar__links">
        <a href="<?php echo esc_url(home_url('/wholesale/')); ?>">Wholesale Accounts</a>
        &nbsp;·&nbsp;
        <a href="<?php echo esc_url(home_url('/contact/')); ?>">Support</a>
      </div>
    </div>
  </div>

  <header class="site-header">
    <div class="pb-container site-header__inner">
      <a class="site-brand" href="<?php echo esc_url(home_url('/')); ?>">
        <?php if (has_custom_logo()) : ?>
          <?php the_custom_logo(); ?>
        <?php else : ?>
          <span class="site-brand__mark" aria-hidden="true">PB</span>
          <span>
            <div class="site-brand__name">Palm Beach</div>
            <div class="site-brand__tag">Peptides</div>
          </span>
        <?php endif; ?>
      </a>

      <nav class="primary-nav" aria-label="<?php esc_attr_e('Primary', 'palmbeach-peptides'); ?>">
        <?php
        wp_nav_menu(array(
            'theme_location' => 'primary',
            'container'      => false,
            'fallback_cb'    => 'pbp_fallback_menu',
            'depth'          => 1,
        ));
        ?>
      </nav>

      <div class="header-actions">
        <?php if (function_exists('WC')) : ?>
          <?php pbp_cart_link(); ?>
        <?php endif; ?>
        <a class="btn btn-primary" href="<?php echo esc_url(home_url('/contact/#pricing')); ?>">Get Pricing</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu-toggle>
          <span class="screen-reader-text"><?php esc_html_e('Menu', 'palmbeach-peptides'); ?></span>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>

    <nav id="mobile-nav" class="mobile-nav" data-mobile-nav hidden>
      <?php
      wp_nav_menu(array(
          'theme_location' => 'primary',
          'container'      => false,
          'fallback_cb'    => 'pbp_fallback_menu',
          'depth'          => 1,
      ));
      ?>
    </nav>
  </header>
