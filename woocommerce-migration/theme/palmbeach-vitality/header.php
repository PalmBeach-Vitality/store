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
  <div class="pbv-announce">USA Manufactured · Research Grade · COA With Every Order</div>

  <header class="site-header">
    <div class="pbv-container site-header__inner">
      <a class="site-brand" href="<?php echo esc_url(home_url('/')); ?>">
        <?php if (has_custom_logo()) : ?>
          <?php the_custom_logo(); ?>
        <?php else : ?>
          <span class="site-brand__mark" aria-hidden="true">PB</span>
          <span class="site-brand__text">
            <span class="site-brand__name">Palm Beach</span>
            <span class="site-brand__tag">Vitality</span>
          </span>
        <?php endif; ?>
      </a>

      <nav class="primary-nav" aria-label="<?php esc_attr_e('Primary', 'palmbeach-vitality'); ?>">
        <?php
        wp_nav_menu(array(
            'theme_location' => 'primary',
            'container'      => false,
            'fallback_cb'    => 'pbv_fallback_menu',
            'depth'          => 1,
        ));
        ?>
      </nav>

      <div class="header-actions">
        <?php if (function_exists('WC')) : ?>
          <?php pbv_cart_link(); ?>
        <?php endif; ?>
        <a class="btn" href="<?php echo esc_url(home_url('/shop/')); ?>">Shop</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu-toggle>
          <span class="screen-reader-text"><?php esc_html_e('Menu', 'palmbeach-vitality'); ?></span>
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>

    <nav id="mobile-nav" class="mobile-nav" data-mobile-nav hidden>
      <?php
      wp_nav_menu(array(
          'theme_location' => 'primary',
          'container'      => false,
          'fallback_cb'    => 'pbv_fallback_menu',
          'depth'          => 1,
      ));
      ?>
    </nav>
  </header>
