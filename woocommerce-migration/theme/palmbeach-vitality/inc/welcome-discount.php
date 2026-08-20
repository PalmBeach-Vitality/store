<?php
/**
 * Store coupons: WELCOME20 (new-client 20%) + AS-1010 (10%, stackable).
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/** New-client welcome code. */
define('PBV_WELCOME_COUPON_CODE', 'WELCOME20');

/** Percent off for new clients. */
define('PBV_WELCOME_COUPON_PERCENT', 20);

/** Stackable promo code. */
define('PBV_STACK_COUPON_CODE', 'AS-1010');

/** Percent off for the stackable promo. */
define('PBV_STACK_COUPON_PERCENT', 10);

/** Production n8n webhook for the branded intro email. */
define('PBV_N8N_WELCOME_WEBHOOK_DEFAULT', 'https://stockjohnson.app.n8n.cloud/webhook/vitality-store-email-webhook');

/**
 * Create or sync a percent coupon.
 *
 * @param string $code        Coupon code.
 * @param float  $percent     Discount percent.
 * @param string $description Admin description.
 * @param array  $args {
 *     @type bool $individual_use      Whether coupon is exclusive.
 *     @type int  $usage_limit_per_user Per-customer usage limit (0 = unlimited).
 * }
 * @return int|false Coupon ID or false.
 */
function pbv_ensure_percent_coupon($code, $percent, $description, $args = array()) {
    if (!class_exists('WC_Coupon') || !function_exists('wc_get_coupon_id_by_code')) {
        return false;
    }

    $code = wc_format_coupon_code($code);
    if ($code === '') {
        return false;
    }

    $defaults = array(
        'individual_use'       => false,
        'usage_limit_per_user' => 0,
    );
    $args = wp_parse_args($args, $defaults);

    $existing_id = wc_get_coupon_id_by_code($code);
    $coupon      = $existing_id ? new WC_Coupon($existing_id) : new WC_Coupon();

    $coupon->set_code($code);
    $coupon->set_description($description);
    $coupon->set_discount_type('percent');
    $coupon->set_amount((float) $percent);
    $coupon->set_individual_use((bool) $args['individual_use']);
    $coupon->set_usage_limit_per_user((int) $args['usage_limit_per_user']);
    $coupon->set_free_shipping(false);
    $coupon->set_exclude_sale_items(false);
    $coupon->save();

    return (int) $coupon->get_id();
}

/**
 * Ensure WELCOME20 exists (new clients, 1× per customer, stackable with AS-1010).
 *
 * @return int|false
 */
function pbv_ensure_welcome_coupon() {
    return pbv_ensure_percent_coupon(
        PBV_WELCOME_COUPON_CODE,
        (float) PBV_WELCOME_COUPON_PERCENT,
        __('New-client welcome discount — 20% off first order (1 use per client; stacks with AS-1010).', 'palmbeach-vitality'),
        array(
            'individual_use'       => false,
            'usage_limit_per_user' => 1,
        )
    );
}

/**
 * Ensure AS-1010 exists (10%, stackable with WELCOME20).
 *
 * @return int|false
 */
function pbv_ensure_stack_coupon() {
    return pbv_ensure_percent_coupon(
        PBV_STACK_COUPON_CODE,
        (float) PBV_STACK_COUPON_PERCENT,
        __('Promo AS-1010 — 10% off (stacks with WELCOME20).', 'palmbeach-vitality'),
        array(
            'individual_use'       => false,
            'usage_limit_per_user' => 0,
        )
    );
}

/**
 * Seed / sync store coupons.
 *
 * Wrapped so a coupon-seed failure cannot white-screen wp-admin or the storefront.
 */
function pbv_seed_welcome_coupon_once() {
    if (!function_exists('WC')) {
        return;
    }

    try {
        update_option('woocommerce_enable_coupons', 'yes');

        $version = '1.1.0'; // 1.1.0: AS-1010 + allow stacking (WELCOME20 individual_use off).
        if (get_option('pbv_welcome_coupon_version') === $version) {
            pbv_ensure_welcome_coupon();
            pbv_ensure_stack_coupon();
            return;
        }

        pbv_ensure_welcome_coupon();
        pbv_ensure_stack_coupon();
        update_option('pbv_welcome_coupon_version', $version);
    } catch (Throwable $e) {
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('Palm Beach Vitality coupon seed failed: ' . $e->getMessage());
        }
    }
}
add_action('woocommerce_init', 'pbv_seed_welcome_coupon_once', 40);

/**
 * WELCOME20: new customers only (first order) + already limited to 1 use per user.
 *
 * @param bool         $valid     Whether coupon is valid.
 * @param WC_Coupon    $coupon    Coupon.
 * @param WC_Discounts $discounts Discounts helper (unused).
 * @return bool
 */
function pbv_welcome_coupon_new_customers_only($valid, $coupon, $discounts = null) {
    if (!$valid || !is_a($coupon, 'WC_Coupon')) {
        return $valid;
    }
    if (strtolower($coupon->get_code()) !== strtolower(PBV_WELCOME_COUPON_CODE)) {
        return $valid;
    }

    $email = '';
    if (is_user_logged_in()) {
        $user  = wp_get_current_user();
        $email = $user && $user->user_email ? $user->user_email : '';
        $count = wc_get_customer_order_count(get_current_user_id());
        if ($count > 0) {
            throw new Exception(__('WELCOME20 is for new clients only (first order, one use).', 'palmbeach-vitality'));
        }
    }

    if ($email === '' && function_exists('WC') && WC()->customer) {
        $email = WC()->customer->get_billing_email();
    }
    if ($email === '' && function_exists('WC') && WC()->checkout()) {
        $posted = WC()->checkout()->get_value('billing_email');
        if (is_string($posted) && $posted !== '') {
            $email = sanitize_email($posted);
        }
    }

    if ($email && is_email($email) && function_exists('wc_get_orders')) {
        $orders = wc_get_orders(
            array(
                'billing_email' => $email,
                'status'        => array('wc-processing', 'wc-completed', 'wc-on-hold'),
                'limit'         => 1,
                'return'        => 'ids',
            )
        );
        if (!empty($orders)) {
            throw new Exception(__('WELCOME20 is for new clients only (first order, one use).', 'palmbeach-vitality'));
        }
    }

    return $valid;
}
add_filter('woocommerce_coupon_is_valid', 'pbv_welcome_coupon_new_customers_only', 20, 3);

/**
 * n8n webhook URL for intro emails (Customizer, env, or production default).
 *
 * @return string
 */
function pbv_n8n_welcome_webhook_url() {
    $from_mod = trim((string) get_theme_mod('pbv_n8n_welcome_webhook', ''));
    if ($from_mod !== '') {
        return esc_url_raw($from_mod);
    }
    $from_env = getenv('PBV_N8N_WELCOME_WEBHOOK');
    if (is_string($from_env) && trim($from_env) !== '') {
        return esc_url_raw(trim($from_env));
    }
    return PBV_N8N_WELCOME_WEBHOOK_DEFAULT;
}

/**
 * Customizer: n8n webhook for discount-code emails.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function pbv_welcome_discount_customize_register($wp_customize) {
    $wp_customize->add_setting('pbv_n8n_welcome_webhook', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('pbv_n8n_welcome_webhook', array(
        'label'       => __('n8n webhook — welcome discount email', 'palmbeach-vitality'),
        'description' => __('Production webhook URL. Leave blank to use the default n8n intro webhook.', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'url',
    ));
}
add_action('customize_register', 'pbv_welcome_discount_customize_register', 26);

/**
 * POST lead payload to n8n.
 *
 * @param array $payload Data for n8n.
 * @return true|WP_Error
 */
function pbv_n8n_post_welcome_lead(array $payload) {
    $url = pbv_n8n_welcome_webhook_url();
    if ($url === '') {
        return new WP_Error('pbv_n8n_missing', 'n8n webhook is not configured.');
    }

    $response = wp_remote_post(
        $url,
        array(
            'timeout' => 20,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ),
            'body'    => wp_json_encode($payload),
        )
    );

    if (is_wp_error($response)) {
        return $response;
    }

    $code = (int) wp_remote_retrieve_response_code($response);
    if ($code < 200 || $code >= 300) {
        return new WP_Error(
            'pbv_n8n_http',
            'n8n webhook returned HTTP ' . $code,
            array('status' => $code, 'body' => wp_remote_retrieve_body($response))
        );
    }

    return true;
}

/**
 * Public URL for the store logo used in intro emails.
 *
 * @return string
 */
function pbv_intro_email_logo_url() {
    if (file_exists(pbv_asset_path('assets/images/logo-full.jpg'))) {
        return pbv_asset_uri('assets/images/logo-full.jpg');
    }
    return function_exists('pbv_default_logo_uri') ? pbv_default_logo_uri() : home_url('/');
}

/**
 * Public URL for the intro-email lab/beach background.
 *
 * @return string
 */
function pbv_intro_email_bg_url() {
    if (file_exists(pbv_asset_path('assets/images/email-intro-bg.jpg'))) {
        return pbv_asset_uri('assets/images/email-intro-bg.jpg');
    }
    return '';
}

/**
 * HTML intro email — lab/beach background, charcoal + cyan (no green).
 *
 * @param string $shop_url Shop URL.
 * @param string $logo_url Logo image URL.
 * @param string $bg_url   Background image URL.
 * @return string
 */
function pbv_intro_email_html($shop_url, $logo_url, $bg_url = '') {
    $shop = esc_url($shop_url);
    $logo = esc_url($logo_url);
    $bg   = esc_url($bg_url !== '' ? $bg_url : pbv_intro_email_bg_url());
    $bg_attr = $bg !== '' ? ' background="' . $bg . '"' : '';
    $bg_css  = $bg !== ''
        ? 'background-color:#0a0f14;background-image:url(' . $bg . ');background-size:cover;background-position:center top;background-repeat:no-repeat;'
        : 'background-color:#0a0f14;';

    return '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome to Palm Beach Vitality</title>
</head>
<body style="margin:0;padding:0;background:#05080c;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"' . $bg_attr . ' style="' . $bg_css . 'padding:36px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="height:42px;line-height:42px;font-size:1px;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:#0c121a;border:1px solid #1e2a38;border-top:3px solid #00d4ff;border-radius:8px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.55);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#080d14;padding:0;">
                    <a href="' . $shop . '" style="display:block;">
                      <img src="' . $logo . '" alt="Palm Beach Vitality" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="background:#0a1018;padding:16px 28px;text-align:center;border-bottom:1px solid #1a2430;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.28em;color:#00d4ff;font-weight:700;">PALM BEACH VITALITY</div>
                    <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;color:#9eb6c8;">RESEARCH-DRIVEN PEPTIDES &amp; PERFORMANCE COMPOUNDS</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 34px 10px;background:#0c121a;">
                    <h1 style="margin:0 0 16px;font-family:Georgia,\'Times New Roman\',serif;font-size:30px;line-height:1.25;color:#f4f8fb;font-weight:700;">Welcome to the inner circle.</h1>
                    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#c8d6e0;">You\'re on the list. We build research-grade peptides around cutting-edge research, rigorous quality standards, and formulations that actually perform — documented, COA-backed, and intended for laboratory use only.</p>
                    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#e8f1f7;">As a subscriber you\'ll get:</p>
                    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8d6e0;"><span style="color:#00d4ff;">→</span> Weekly / monthly research notes</p>
                    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8d6e0;"><span style="color:#00d4ff;">→</span> ' . (int) PBV_WELCOME_COUPON_PERCENT . '% off your first order with code <strong style="color:#00d4ff;font-weight:700;">' . esc_html(PBV_WELCOME_COUPON_CODE) . '</strong></p>
                    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8d6e0;"><span style="color:#00d4ff;">→</span> First access to new compounds</p>
                    <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#c8d6e0;"><span style="color:#00d4ff;">→</span> A direct line to the team</p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#00d4ff;border-radius:4px;">
                          <a href="' . $shop . '" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.1em;text-decoration:none;color:#041018;font-weight:700;">EXPLORE THE CATALOG</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 34px 32px;background:#0c121a;border-top:1px solid #1a2430;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#7f93a3;">Palm Beach Vitality · Palm Beach County, Florida<br>All products are intended for research purposes only. Not for human consumption. Not evaluated by the FDA.<br>Questions? Reply to this email or write sales@palmbeach-vitality.com.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:42px;line-height:42px;font-size:1px;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';
}

/**
 * Plain-text intro email.
 *
 * @param string $shop_url Shop URL.
 * @return string
 */
function pbv_intro_email_text($shop_url) {
    return "Welcome to the inner circle.\n\n"
        . "You're on the Palm Beach Vitality list — research-driven peptides and performance compounds, built around rigorous quality standards and formulations that actually perform.\n\n"
        . "As a subscriber you'll get:\n"
        . "- Weekly / monthly research notes\n"
        . '- ' . (int) PBV_WELCOME_COUPON_PERCENT . '% off your first order with code ' . PBV_WELCOME_COUPON_CODE . "\n"
        . "- First access to new compounds\n"
        . "- A direct line to the team\n\n"
        . "Explore the catalog: {$shop_url}\n\n"
        . "All products are intended for research purposes only. Not for human consumption.\n"
        . "Questions? Reply to this email or write sales@palmbeach-vitality.com.\n";
}

/**
 * Fallback: email the subscriber an intro note from WordPress.
 *
 * @param string $email Subscriber email.
 * @return bool
 */
function pbv_mail_intro_email_to_subscriber($email) {
    $shop = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/shop/');
    $logo = pbv_intro_email_logo_url();
    $bg   = pbv_intro_email_bg_url();
    $subject = 'Welcome to the inner circle — Palm Beach Vitality';
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        'Reply-To: sales@palmbeach-vitality.com',
    );
    $from = function_exists('pbv_authenticated_from_address') ? pbv_authenticated_from_address() : '';
    if ($from !== '') {
        $headers[] = 'From: Palm Beach Vitality <' . $from . '>';
    }
    return (bool) wp_mail($email, $subject, pbv_intro_email_html($shop, $logo, $bg), $headers);
}

/**
 * Checkout note under coupon field.
 */
function pbv_checkout_welcome_coupon_hint() {
    if (!function_exists('is_checkout') || !is_checkout()) {
        return;
    }
    echo '<p class="pbv-welcome-coupon-hint">'
        . esc_html(
            sprintf(
                /* translators: 1: welcome code, 2: welcome %, 3: stack code, 4: stack % */
                __('Have a code? New-client %1$s = %2$d%% off (first order, one use) stacks with %3$s (%4$d%%).', 'palmbeach-vitality'),
                PBV_WELCOME_COUPON_CODE,
                (int) PBV_WELCOME_COUPON_PERCENT,
                PBV_STACK_COUPON_CODE,
                (int) PBV_STACK_COUPON_PERCENT
            )
        )
        . '</p>';
}
add_action('woocommerce_before_checkout_form', 'pbv_checkout_welcome_coupon_hint', 8);
