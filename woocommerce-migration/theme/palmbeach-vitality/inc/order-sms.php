<?php
/**
 * New-order SMS alerts via Twilio.
 *
 * Credentials live in Appearance → Customize → Palm Beach Storefront
 * (or environment variables). Never commit Auth Token to the repo.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Read a Twilio-related setting (theme_mod, then env).
 *
 * @param string $mod_key Theme mod key.
 * @param string $env_key Environment variable name.
 * @return string
 */
function pbv_sms_setting($mod_key, $env_key = '') {
    $from_mod = trim((string) get_theme_mod($mod_key, ''));
    if ($from_mod !== '') {
        return $from_mod;
    }
    if ($env_key !== '') {
        $from_env = getenv($env_key);
        if (is_string($from_env) && trim($from_env) !== '') {
            return trim($from_env);
        }
    }
    return '';
}

/**
 * @return string
 */
function pbv_twilio_account_sid() {
    return pbv_sms_setting('pbv_twilio_account_sid', 'PBV_TWILIO_ACCOUNT_SID');
}

/**
 * @return string
 */
function pbv_twilio_auth_token() {
    return pbv_sms_setting('pbv_twilio_auth_token', 'PBV_TWILIO_AUTH_TOKEN');
}

/**
 * Twilio “From” number in E.164 (e.g. +15551234567).
 *
 * @return string
 */
function pbv_twilio_from_number() {
    return pbv_sms_setting('pbv_twilio_from_number', 'PBV_TWILIO_FROM_NUMBER');
}

/**
 * Staff cell number(s) to notify, comma-separated E.164.
 *
 * @return string[]
 */
function pbv_sms_notify_numbers() {
    $raw = pbv_sms_setting('pbv_sms_notify_numbers', 'PBV_SMS_NOTIFY_NUMBERS');
    if ($raw === '') {
        return array();
    }
    $parts = preg_split('/[\s,;]+/', $raw) ?: array();
    $out   = array();
    foreach ($parts as $part) {
        $part = preg_replace('/[^\d+]/', '', (string) $part);
        if ($part !== '' && $part[0] !== '+') {
            // Assume US if 10 digits.
            $digits = preg_replace('/\D/', '', $part);
            if (strlen($digits) === 10) {
                $part = '+1' . $digits;
            } elseif (strlen($digits) === 11 && $digits[0] === '1') {
                $part = '+' . $digits;
            }
        }
        if ($part !== '' && preg_match('/^\+\d{10,15}$/', $part)) {
            $out[$part] = $part;
        }
    }
    return array_values($out);
}

/**
 * Whether SMS alerts are fully configured.
 *
 * @return bool
 */
function pbv_sms_is_configured() {
    return pbv_twilio_account_sid() !== ''
        && pbv_twilio_auth_token() !== ''
        && pbv_twilio_from_number() !== ''
        && !empty(pbv_sms_notify_numbers());
}

/**
 * Customizer controls for SMS alerts.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function pbv_sms_customize_register($wp_customize) {
    $wp_customize->add_setting('pbv_twilio_account_sid', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_twilio_account_sid', array(
        'label'       => __('Twilio Account SID', 'palmbeach-vitality'),
        'description' => __('From console.twilio.com — starts with AC…', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'text',
    ));

    $wp_customize->add_setting('pbv_twilio_auth_token', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_twilio_auth_token', array(
        'label'       => __('Twilio Auth Token', 'palmbeach-vitality'),
        'description' => __('Keep private. Paste from Twilio console (Auth Token).', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'password',
    ));

    $wp_customize->add_setting('pbv_twilio_from_number', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_twilio_from_number', array(
        'label'       => __('Twilio From number', 'palmbeach-vitality'),
        'description' => __('Your Twilio SMS number in E.164, e.g. +15551234567', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'text',
    ));

    $wp_customize->add_setting('pbv_sms_notify_numbers', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_sms_notify_numbers', array(
        'label'       => __('Order SMS alert phone(s)', 'palmbeach-vitality'),
        'description' => __('Your cell number(s) to text on new orders. E.164 or 10-digit US, comma-separated.', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'text',
    ));
}
add_action('customize_register', 'pbv_sms_customize_register', 25);

/**
 * Build a short SMS body for a new order.
 *
 * @param WC_Order $order Order.
 * @return string
 */
function pbv_sms_order_message($order) {
    if (!is_a($order, 'WC_Order')) {
        return '';
    }

    $total = wp_strip_all_tags($order->get_formatted_order_total());
    $name  = trim($order->get_formatted_billing_full_name());
    if ($name === '') {
        $name = $order->get_billing_email();
    }

    $items = array();
    foreach ($order->get_items() as $item) {
        $items[] = $item->get_name() . ' ×' . $item->get_quantity();
        if (count($items) >= 3) {
            break;
        }
    }
    $item_text = $items ? implode(', ', $items) : 'items';
    $more      = count($order->get_items()) > 3 ? '…' : '';

    return sprintf(
        'PBV order #%1$s — %2$s — %3$s%4$s — %5$s',
        $order->get_order_number(),
        $total,
        $item_text,
        $more,
        $name
    );
}

/**
 * Send one SMS via Twilio REST API.
 *
 * @param string $to   E.164 destination.
 * @param string $body Message body.
 * @return true|WP_Error
 */
function pbv_twilio_send_sms($to, $body) {
    $sid   = pbv_twilio_account_sid();
    $token = pbv_twilio_auth_token();
    $from  = pbv_twilio_from_number();

    if ($sid === '' || $token === '' || $from === '' || $to === '' || $body === '') {
        return new WP_Error('pbv_sms_config', 'SMS is not fully configured.');
    }

    $url  = 'https://api.twilio.com/2010-04-01/Accounts/' . rawurlencode($sid) . '/Messages.json';
    $args = array(
        'timeout' => 20,
        'headers' => array(
            'Authorization' => 'Basic ' . base64_encode($sid . ':' . $token),
        ),
        'body'    => array(
            'To'   => $to,
            'From' => $from,
            'Body' => $body,
        ),
    );

    $response = wp_remote_post($url, $args);
    if (is_wp_error($response)) {
        return $response;
    }

    $code = (int) wp_remote_retrieve_response_code($response);
    $data = json_decode((string) wp_remote_retrieve_body($response), true);
    if ($code < 200 || $code >= 300) {
        $msg = is_array($data) && !empty($data['message']) ? $data['message'] : 'Twilio SMS failed.';
        return new WP_Error('pbv_sms_twilio', $msg, array('status' => $code));
    }

    return true;
}

/**
 * Notify staff phones about a new order (once per order).
 *
 * @param int $order_id Order ID.
 */
function pbv_sms_notify_new_order($order_id) {
    $order_id = (int) $order_id;
    if ($order_id <= 0 || !pbv_sms_is_configured() || !function_exists('wc_get_order')) {
        return;
    }

    $order = wc_get_order($order_id);
    if (!$order) {
        return;
    }

    if ($order->get_meta('_pbv_sms_new_order_sent') === 'yes') {
        return;
    }

    $body    = pbv_sms_order_message($order);
    $sent_ok = false;
    foreach (pbv_sms_notify_numbers() as $to) {
        $result = pbv_twilio_send_sms($to, $body);
        if (!is_wp_error($result)) {
            $sent_ok = true;
        } elseif (defined('WP_DEBUG') && WP_DEBUG) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('PBV SMS error (' . $to . '): ' . $result->get_error_message());
        }
    }

    if ($sent_ok) {
        $order->update_meta_data('_pbv_sms_new_order_sent', 'yes');
        $order->save();
    }
}
add_action('woocommerce_checkout_order_processed', 'pbv_sms_notify_new_order', 30, 1);
add_action('woocommerce_new_order', 'pbv_sms_notify_new_order', 30, 1);
