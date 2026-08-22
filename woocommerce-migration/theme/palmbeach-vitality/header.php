<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7984692756918604"
     crossorigin="anonymous"></script>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="site-wrap">
  <?php
  $announce = get_theme_mod(
      'pbv_announcement',
      function_exists('pbv_default_announcement') ? pbv_default_announcement() : ''
  );
  if ($announce) :
      ?>
    <div class="pbv-announce"><?php echo esc_html($announce); ?></div>
  <?php endif; ?>

  <?php if (!empty($_GET['pbv_confirmed'])) : ?>
    <div class="pbv-confirm-banner" role="status"><?php esc_html_e('Thanks — your email is confirmed for Lab Notes.', 'palmbeach-vitality'); ?></div>
  <?php endif; ?>

  <?php
  $logo_card = file_exists(pbv_asset_path('assets/images/logo-full.jpg'))
      ? pbv_asset_uri('assets/images/logo-full.jpg')
      : pbv_default_logo_uri();
  if (has_custom_logo()) {
      $custom_id = get_theme_mod('custom_logo');
      $custom_url = $custom_id ? wp_get_attachment_image_url($custom_id, 'full') : '';
      if ($custom_url) {
          $logo_card = $custom_url;
      }
  }
  ?>
  <div class="pbv-logo-banner">
    <a class="pbv-logo-card" href="<?php echo esc_url(home_url('/')); ?>">
      <img
        class="pbv-logo-card__img"
        src="<?php echo esc_url($logo_card); ?>"
        alt="<?php echo esc_attr(get_bloginfo('name')); ?>"
        width="1175"
        height="500"
        decoding="async"
        fetchpriority="high"
      />
    </a>
  </div>

  <header class="site-header">
    <div class="site-header__inner">
      <div class="header-actions">
        <a class="pbv-icon-link" href="<?php echo esc_url(home_url('/shop/')); ?>" aria-label="<?php esc_attr_e('Search products', 'palmbeach-vitality'); ?>"><?php echo pbv_icon_search(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
        <?php if (function_exists('wc_get_page_permalink')) : ?>
          <a class="pbv-icon-link" href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>" aria-label="<?php esc_attr_e('Account', 'palmbeach-vitality'); ?>"><?php echo pbv_icon_account(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
        <?php endif; ?>
        <?php if (function_exists('WC')) : ?>
          <?php pbv_cart_link(); ?>
        <?php endif; ?>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav-dropdown" data-menu-toggle>
          <span class="screen-reader-text"><?php esc_html_e('Menu', 'palmbeach-vitality'); ?></span>
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>

    <nav id="primary-nav-dropdown" class="mobile-nav" aria-label="<?php esc_attr_e('Primary', 'palmbeach-vitality'); ?>" data-mobile-nav hidden>
      <?php
      wp_nav_menu(array(
          'theme_location' => 'primary',
          'container'      => false,
          'fallback_cb'    => 'pbv_fallback_menu',
          // Allow Appearance → Menus parent/child (submenu) nesting.
          'depth'          => 3,
      ));
      ?>
    </nav>
  </header>
