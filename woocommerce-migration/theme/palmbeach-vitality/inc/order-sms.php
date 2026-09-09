<?php
/**
 * New-order text alerts via carrier email-to-SMS (no Twilio).
 *
 * Appearance → Customize → Palm Beach Storefront → your cell + carrier.
 * The store emails the carrier gateway; that becomes a normal text.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Supported US carrier SMS email gateways.
 *
 * @return array<string, array{label:string, domain:string}>
 */
function pbv_sms_carriers() {
    return array(
        'att'         => array(
            'label'  => 'AT&T',
            'domain' => 'txt.att.net',
        ),
        'tmobile'     => array(
            'label'  => 'T-Mobile',
            'domain' => 'tmomail.net',
        ),
        'verizon'     => array(
            'label'  => 'Verizon',
            'domain' => 'vtext.com',
        ),
        'uscellular'  => array(
            'label'  => 'U.S. Cellular',
            'domain' => 'email.uscc.net',
        ),
        'googlefi'    => array(
            'label'  => 'Google Fi',
            'domain' => 'msg.fi.google.com',
        ),
        'boost'       => array(
            'label'  => 'Boost Mobile',
            'domain' => 'sms.myboostmobile.com',
        ),
        'cricket'     => array(
            'label'  => 'Cricket',
            'domain' => 'mms.cricketwireless.net',
        ),
        'metropcs'    => array(
            'label'  => 'Metro by T-Mobile',
            'domain' => 'mymetropcs.com',
        ),
    );
}

/**
 * Digits-only US phone (10 digits), or empty if invalid.
 *
 * @param string $raw Raw phone input.
 * @return string
 */
function pbv_sms_normalize_phone($raw) {
    $digits = preg_replace('/\D/', '', (string) $raw);
    if (!is_string($digits) || $digits === '') {
        return '';
    }
    if (strlen($digits) === 11 && $digits[0] === '1') {
        $digits = substr($digits, 1);
    }
    if (strlen($digits) !== 10) {
        return '';
    }
    return $digits;
}

/**
 * Staff notify phone from Customizer.
 *
 * @return string 10-digit US number or empty.
 */
function pbv_sms_notify_phone() {
    return pbv_sms_normalize_phone(get_theme_mod('pbv_sms_notify_phone', ''));
}

/**
 * Selected carrier key.
 *
 * @return string
 */
function pbv_sms_notify_carrier() {
    $key = sanitize_key((string) get_theme_mod('pbv_sms_notify_carrier', ''));
    $all = pbv_sms_carriers();
    return isset($all[$key]) ? $key : '';
}

/**
 * Email address for the carrier SMS gateway.
 *
 * @return string
 */
function pbv_sms_gateway_address() {
    $phone   = pbv_sms_notify_phone();
    $carrier = pbv_sms_notify_carrier();
    if ($phone === '' || $carrier === '') {
        return '';
    }
    $all = pbv_sms_carriers();
    return $phone . '@' . $all[$carrier]['domain'];
}

/**
 * Whether text alerts are configured.
 *
 * @return bool
 */
function pbv_sms_is_configured() {
    return pbv_sms_gateway_address() !== '';
}

/**
 * Customizer: cell + carrier only.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function pbv_sms_customize_register($wp_customize) {
    $wp_customize->add_setting('pbv_sms_notify_phone', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_sms_notify_phone', array(
        'label'       => __('Order text alerts — your cell', 'palmbeach-vitality'),
        'description' => __('US number. You’ll get a text when someone places an order (via your carrier’s email-to-text).', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'text',
    ));

    $choices = array('' => __('— Select carrier —', 'palmbeach-vitality'));
    foreach (pbv_sms_carriers() as $key => $info) {
        $choices[$key] = $info['label'];
    }

    $wp_customize->add_setting('pbv_sms_notify_carrier', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_key',
    ));
    $wp_customize->add_control('pbv_sms_notify_carrier', array(
        'label'   => __('Your cell carrier', 'palmbeach-vitality'),
        'section' => 'pbv_storefront',
        'type'    => 'select',
        'choices' => $choices,
    ));
}
add_action('customize_register', 'pbv_sms_customize_register', 25);

/**
 * Short message body for a new order.
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

    // Keep under typical SMS length.
    $body = sprintf(
        'PBV order #%1$s — %2$s — %3$s%4$s — %5$s',
        $order->get_order_number(),
        $total,
        $item_text,
        $more,
        $name
    );

    return substr($body, 0, 140);
}

/**
 * Text staff phone about a new order (once per order).
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

    $to   = pbv_sms_gateway_address();
    $body = pbv_sms_order_message($order);
    if ($to === '' || $body === '') {
        return;
    }

    // Empty subject helps some carriers deliver as a plain text.
    $sent = wp_mail($to, '', $body, array('Content-Type: text/plain; charset=UTF-8'));
    if ($sent) {
        $order->update_meta_data('_pbv_sms_new_order_sent', 'yes');
        $order->save();
    }
}
add_action('woocommerce_checkout_order_processed', 'pbv_sms_notify_new_order', 30, 1);
add_action('woocommerce_new_order', 'pbv_sms_notify_new_order', 30, 1);
