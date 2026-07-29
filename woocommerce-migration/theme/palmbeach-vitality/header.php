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
  <?php
  $announce = get_theme_mod(
      'pbv_announcement',
      'Notice: During the ongoing FDA compounding review, certain peptides may experience temporary supply delays. We appreciate your patience as we continue providing research-grade compounds with full documentation.'
  );
  if ($announce) :
      ?>
    <div class="pbv-announce"><?php echo esc_html($announce); ?></div>
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
        <a class="pbv-icon-link" href="<?php echo esc_url(home_url('/shop/')); ?>" aria-label="<?php esc_attr_e('Search products', 'palmbeach-vitality'); ?>"><?php echo pbv_icon_search(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
        <?php if (function_exists('wc_get_page_permalink')) : ?>
          <a class="pbv-icon-link" href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>" aria-label="<?php esc_attr_e('Account', 'palmbeach-vitality'); ?>"><?php echo pbv_icon_account(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
        <?php endif; ?>
        <?php if (function_exists('WC')) : ?>
          <?php pbv_cart_link(); ?>
        <?php endif; ?>
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
