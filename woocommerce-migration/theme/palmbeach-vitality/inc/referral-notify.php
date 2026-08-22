<?php
/**
 * Email the sales receipt to a rep when a referral coupon is used at checkout.
 *
 * Default trigger: coupon AS-1010. Set the rep address under
 * Appearance → Customize → Palm Beach Vitality → Referral rep email.
 *
 * Uses the WooCommerce “New order” email (same sales receipt staff already get).
 * That email must stay enabled under WooCommerce → Settings → Emails.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Default referral coupon code (matches the seeded AS-1010 promo).
 *
 * @return string
 */
function pbv_referral_coupon_code_default() {
    return defined('PBV_STACK_COUPON_CODE') ? PBV_STACK_COUPON_CODE : 'AS-1010';
}

/**
 * Referral coupon that should notify the rep.
 *
 * @return string
 */
function pbv_referral_coupon_code() {
    $code = trim((string) get_theme_mod('pbv_referral_coupon_code', pbv_referral_coupon_code_default()));
    if ($code === '') {
        $code = pbv_referral_coupon_code_default();
    }
    return function_exists('wc_format_coupon_code') ? wc_format_coupon_code($code) : strtolower($code);
}

/**
 * Rep email that receives the sales receipt for the referral coupon.
 *
 * @return string
 */
function pbv_referral_rep_email() {
    $email = sanitize_email((string) get_theme_mod('pbv_referral_rep_email', ''));
    return is_email($email) ? $email : '';
}

/**
 * Coupon code → rep email map (extend via filter for more reps later).
 *
 * @return array<string, string> Lowercase coupon code => email.
 */
function pbv_referral_coupon_recipients() {
    $map   = array();
    $code  = strtolower(pbv_referral_coupon_code());
    $email = pbv_referral_rep_email();
    if ($code !== '' && $email !== '') {
        $map[$code] = $email;
    }

    /**
     * Filter referral coupon → rep email map.
     *
     * @param array<string, string> $map Lowercase coupon => email.
     */
    $map = apply_filters('pbv_referral_coupon_recipients', $map);

    $clean = array();
    foreach ((array) $map as $coupon => $address) {
        $coupon  = strtolower(trim((string) $coupon));
        $address = sanitize_email((string) $address);
        if ($coupon !== '' && is_email($address)) {
            $clean[$coupon] = $address;
        }
    }

    return $clean;
}

/**
 * Customizer: referral coupon + rep email.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function pbv_referral_notify_customize_register($wp_customize) {
    if (!$wp_customize->get_section('pbv_storefront')) {
        $wp_customize->add_section('pbv_storefront', array(
            'title'    => __('Palm Beach Vitality', 'palmbeach-vitality'),
            'priority' => 35,
        ));
    }

    $wp_customize->add_setting('pbv_referral_coupon_code', array(
        'default'           => pbv_referral_coupon_code_default(),
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_referral_coupon_code', array(
        'label'       => __('Referral coupon code', 'palmbeach-vitality'),
        'description' => __('When this code is used at checkout, the sales receipt is emailed to the rep. Default: AS-1010.', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'text',
    ));

    $wp_customize->add_setting('pbv_referral_rep_email', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_email',
    ));
    $wp_customize->add_control('pbv_referral_rep_email', array(
        'label'       => __('Referral rep email', 'palmbeach-vitality'),
        'description' => __('Receives the WooCommerce New Order / sales receipt only when the referral coupon is used. Leave blank to disable.', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'email',
    ));
}
add_action('customize_register', 'pbv_referral_notify_customize_register', 28);

/**
 * Rep emails that should get this order’s sales receipt.
 *
 * @param WC_Order $order Order.
 * @return string[]
 */
function pbv_referral_reps_for_order($order) {
    if (!is_a($order, 'WC_Order')) {
        return array();
    }

    $map = pbv_referral_coupon_recipients();
    if (!$map) {
        return array();
    }

    $reps = array();
    foreach ($order->get_coupon_codes() as $code) {
        $key = strtolower((string) $code);
        if (isset($map[$key])) {
            $reps[strtolower($map[$key])] = $map[$key];
        }
    }

    return array_values($reps);
}

/**
 * Add the referral rep to the New Order email only when their coupon was used.
 *
 * Other orders are unchanged — the rep does not get every sale.
 *
 * @param string $recipient Comma-separated recipients.
 * @param mixed  $order     Order object.
 * @return string
 */
function pbv_referral_merge_new_order_recipient($recipient, $order = null) {
    if (!is_a($order, 'WC_Order')) {
        return $recipient;
    }

    $reps = pbv_referral_reps_for_order($order);
    if (!$reps) {
        return $recipient;
    }

    $existing = array();
    foreach (explode(',', (string) $recipient) as $email) {
        $email = sanitize_email(trim($email));
        if ($email && is_email($email)) {
            $existing[strtolower($email)] = $email;
        }
    }

    foreach ($reps as $email) {
        $existing[strtolower($email)] = $email;
    }

    return implode(', ', array_values($existing));
}
add_filter('woocommerce_email_recipient_new_order', 'pbv_referral_merge_new_order_recipient', 40, 2);

/**
 * Order note when a referral coupon was used (audit trail).
 *
 * @param int $order_id Order ID.
 */
function pbv_referral_order_note($order_id) {
    $order = function_exists('wc_get_order') ? wc_get_order((int) $order_id) : null;
    if (!$order) {
        return;
    }
    $reps = pbv_referral_reps_for_order($order);
    if (!$reps) {
        return;
    }
    if ($order->get_meta('_pbv_referral_rep_noted') === 'yes') {
        return;
    }
    $order->update_meta_data('_pbv_referral_rep_noted', 'yes');
    $order->add_order_note(
        sprintf(
            /* translators: 1: coupon code, 2: email list */
            __('Referral coupon %1$s — New Order receipt also sent to %2$s.', 'palmbeach-vitality'),
            pbv_referral_coupon_code(),
            implode(', ', $reps)
        )
    );
    $order->save();
}
add_action('woocommerce_checkout_order_processed', 'pbv_referral_order_note', 45, 1);
