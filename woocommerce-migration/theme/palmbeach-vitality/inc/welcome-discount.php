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

/** Stackable promo percent. */
define('PBV_STACK_COUPON_PERCENT', 10);

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
 */
function pbv_seed_welcome_coupon_once() {
    if (!function_exists('WC')) {
        return;
    }
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
 * n8n webhook URL for welcome-code emails (Customizer or env).
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
    return '';
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
        'description' => __('Production webhook URL. Site POSTs JSON {email, coupon_code, discount_percent, optin, site, source}. Leave blank to email the code from WordPress instead.', 'palmbeach-vitality'),
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
 * Fallback: email the customer their WELCOME20 code from WordPress.
 *
 * @param string $email Customer email.
 * @return bool
 */
function pbv_mail_welcome_coupon_to_customer($email) {
    $code    = PBV_WELCOME_COUPON_CODE;
    $percent = (int) PBV_WELCOME_COUPON_PERCENT;
    $shop    = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/');
    $subject = sprintf(
        /* translators: %d: discount percent */
        __('Your %d%% welcome code — Palm Beach Vitality', 'palmbeach-vitality'),
        $percent
    );
    $body = "Welcome to Palm Beach Vitality.\n\n"
        . "Your new-client discount code is: {$code}\n"
        . "That's {$percent}% off your first order (one-time use for new clients).\n"
        . 'You can also stack promo code ' . PBV_STACK_COUPON_CODE . ' for an extra ' . (int) PBV_STACK_COUPON_PERCENT . "% off.\n\n"
        . "Apply them at checkout:\n{$shop}\n\n"
        . "Questions? Reply to this email or write sales@palmbeach-vitality.com.\n";

    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        'From: Palm Beach Vitality <sales@palmbeach-vitality.com>',
        'Reply-To: sales@palmbeach-vitality.com',
    );

    return (bool) wp_mail($email, $subject, $body, $headers);
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
                __('New clients: %1$s = %2$d%% off (first order, one use). Stack with %3$s for an extra %4$d%% off.', 'palmbeach-vitality'),
                PBV_WELCOME_COUPON_CODE,
                (int) PBV_WELCOME_COUPON_PERCENT,
                PBV_STACK_COUPON_CODE,
                (int) PBV_STACK_COUPON_PERCENT
            )
        )
        . '</p>';
}
add_action('woocommerce_before_checkout_form', 'pbv_checkout_welcome_coupon_hint', 8);
