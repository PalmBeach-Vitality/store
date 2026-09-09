<?php
/**
 * Google Sign-In for customers (Google Identity Services + ID token verify).
 *
 * Client ID may be public (browser). Client Secret must never be committed —
 * store it only in Appearance → Customize → Palm Beach Storefront if needed later.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Google OAuth Client ID (browser-visible).
 *
 * @return string
 */
function pbv_google_client_id() {
    $from_env = getenv('PBV_GOOGLE_OAUTH_CLIENT_ID');
    if (is_string($from_env) && $from_env !== '') {
        return trim($from_env);
    }
    $from_mod = (string) get_theme_mod('pbv_google_client_id', '');
    if ($from_mod !== '') {
        return trim($from_mod);
    }
    // Public OAuth web client ID for palmbeach-vitality.store (not a secret).
    return '908145574436-dagv43v6uf45lcq5kum0ltarqmhvl7pd.apps.googleusercontent.com';
}

/**
 * Whether Google Sign-In UI should load on this request.
 *
 * @return bool
 */
function pbv_google_signin_should_load() {
    if (is_user_logged_in()) {
        return false;
    }
    if (!pbv_google_client_id()) {
        return false;
    }
    if (function_exists('is_account_page') && is_account_page()) {
        return true;
    }
    if (function_exists('is_checkout') && is_checkout() && !is_wc_endpoint_url('order-received')) {
        return true;
    }
    return false;
}

/**
 * Customizer fields for Google Sign-In.
 *
 * @param WP_Customize_Manager $wp_customize Customizer.
 */
function pbv_google_signin_customize($wp_customize) {
    $wp_customize->add_setting('pbv_google_client_id', array(
        'default'           => pbv_google_client_id(),
        'sanitize_callback' => 'sanitize_text_field',
    ));
    $wp_customize->add_control('pbv_google_client_id', array(
        'label'       => __('Google Sign-In Client ID', 'palmbeach-vitality'),
        'description' => __('OAuth 2.0 Web Client ID from Google Cloud Console. Shown in the browser — not a secret.', 'palmbeach-vitality'),
        'section'     => 'pbv_storefront',
        'type'        => 'text',
    ));
}
add_action('customize_register', 'pbv_google_signin_customize', 20);

/**
 * Enqueue Google Identity Services on account / checkout login surfaces.
 */
function pbv_google_signin_assets() {
    if (!pbv_google_signin_should_load()) {
        return;
    }

    wp_enqueue_script(
        'pbv-google-gsi',
        'https://accounts.google.com/gsi/client',
        array(),
        null,
        true
    );

    // Ensure theme.js loads after GIS and receives config.
    wp_enqueue_script('pbv-theme');
    $wp_scripts = wp_scripts();
    if ($wp_scripts instanceof WP_Scripts && isset($wp_scripts->registered['pbv-theme'])) {
        $wp_scripts->registered['pbv-theme']->deps[] = 'pbv-google-gsi';
    }

    wp_localize_script('pbv-theme', 'pbvGoogleSignIn', array(
        'clientId' => pbv_google_client_id(),
        'ajaxUrl'  => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('pbv_google_signin'),
        'redirect' => function_exists('wc_get_page_permalink')
            ? wc_get_page_permalink('myaccount')
            : home_url('/'),
    ));
}
add_action('wp_enqueue_scripts', 'pbv_google_signin_assets', 30);

/**
 * Markup for the Google button mount point.
 */
function pbv_google_signin_button_markup() {
    if (!pbv_google_signin_should_load()) {
        return;
    }
    static $printed = false;
    if ($printed) {
        return;
    }
    $printed = true;
    echo '<div class="pbv-google-signin" data-pbv-google-signin>';
    echo '<p class="pbv-google-signin__label">' . esc_html__('Or continue with Google', 'palmbeach-vitality') . '</p>';
    echo '<div class="pbv-google-signin__btn" data-pbv-google-btn></div>';
    echo '<p class="pbv-google-signin__status" data-pbv-google-status hidden></p>';
    echo '</div>';
}
add_action('woocommerce_login_form_start', 'pbv_google_signin_button_markup', 5);
add_action('woocommerce_register_form_start', 'pbv_google_signin_button_markup', 5);
add_action('woocommerce_before_checkout_login_form', 'pbv_google_signin_button_markup', 5);

/**
 * Verify a Google ID token via Google's tokeninfo endpoint.
 *
 * @param string $id_token Raw JWT from GIS.
 * @return array|WP_Error Payload on success.
 */
function pbv_google_verify_id_token($id_token) {
    $client_id = pbv_google_client_id();
    if (!$client_id) {
        return new WP_Error('pbv_google_missing_client', __('Google Sign-In is not configured.', 'palmbeach-vitality'));
    }

    $response = wp_remote_get(
        'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($id_token),
        array('timeout' => 20)
    );

    if (is_wp_error($response)) {
        return $response;
    }

    $code = (int) wp_remote_retrieve_response_code($response);
    $body = json_decode((string) wp_remote_retrieve_body($response), true);
    if ($code !== 200 || !is_array($body)) {
        return new WP_Error('pbv_google_invalid_token', __('Google could not verify this sign-in. Please try again.', 'palmbeach-vitality'));
    }

    $aud = isset($body['aud']) ? (string) $body['aud'] : '';
    if (!hash_equals($client_id, $aud)) {
        return new WP_Error('pbv_google_aud_mismatch', __('Google sign-in client mismatch.', 'palmbeach-vitality'));
    }

    $iss = isset($body['iss']) ? (string) $body['iss'] : '';
    if ($iss !== 'accounts.google.com' && $iss !== 'https://accounts.google.com') {
        return new WP_Error('pbv_google_iss', __('Invalid Google token issuer.', 'palmbeach-vitality'));
    }

    $email = isset($body['email']) ? sanitize_email($body['email']) : '';
    if (!$email || !is_email($email)) {
        return new WP_Error('pbv_google_email', __('Google did not return a valid email address.', 'palmbeach-vitality'));
    }

    $verified = isset($body['email_verified']) ? $body['email_verified'] : false;
    if (!($verified === true || $verified === 'true' || $verified === '1' || $verified === 1)) {
        return new WP_Error('pbv_google_unverified', __('Please verify your Google email, then try again.', 'palmbeach-vitality'));
    }

    return $body;
}

/**
 * Find or create a WooCommerce customer from a verified Google profile.
 *
 * @param array $payload Google token payload.
 * @return int|WP_Error User ID.
 */
function pbv_google_find_or_create_customer(array $payload) {
    $email = sanitize_email($payload['email']);
    $user  = get_user_by('email', $email);
    if ($user instanceof WP_User) {
        return (int) $user->ID;
    }

    $given  = isset($payload['given_name']) ? sanitize_text_field($payload['given_name']) : '';
    $family = isset($payload['family_name']) ? sanitize_text_field($payload['family_name']) : '';
    $name   = isset($payload['name']) ? sanitize_text_field($payload['name']) : '';

    $base = sanitize_user(current(explode('@', $email, 2)), true);
    if ($base === '') {
        $base = 'customer';
    }
    $username = $base;
    $i = 1;
    while (username_exists($username)) {
        $username = $base . $i;
        $i++;
    }

    if (function_exists('wc_create_new_customer')) {
        $user_id = wc_create_new_customer($email, $username, wp_generate_password(24, true, true));
    } else {
        $user_id = wp_create_user($username, wp_generate_password(24, true, true), $email);
    }

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $user_id = (int) $user_id;
    $update  = array('ID' => $user_id);
    if ($given !== '') {
        $update['first_name'] = $given;
    }
    if ($family !== '') {
        $update['last_name'] = $family;
    }
    if ($name !== '') {
        $update['display_name'] = $name;
    }
    wp_update_user($update);

    $user = new WP_User($user_id);
    $user->set_role('customer');

    update_user_meta($user_id, 'pbv_google_sub', isset($payload['sub']) ? sanitize_text_field($payload['sub']) : '');

    return $user_id;
}

/**
 * AJAX: complete Google Sign-In.
 */
function pbv_ajax_google_signin() {
    $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
    if (!wp_verify_nonce($nonce, 'pbv_google_signin')) {
        wp_send_json_error(array('message' => __('Security check failed. Please refresh and try again.', 'palmbeach-vitality')), 403);
    }

    $id_token = isset($_POST['credential']) ? trim((string) wp_unslash($_POST['credential'])) : '';
    if ($id_token === '') {
        wp_send_json_error(array('message' => __('Missing Google credential.', 'palmbeach-vitality')), 400);
    }

    $payload = pbv_google_verify_id_token($id_token);
    if (is_wp_error($payload)) {
        wp_send_json_error(array('message' => $payload->get_error_message()), 400);
    }

    $user_id = pbv_google_find_or_create_customer($payload);
    if (is_wp_error($user_id)) {
        wp_send_json_error(array('message' => $user_id->get_error_message()), 400);
    }

    wp_set_current_user($user_id);
    wp_set_auth_cookie($user_id, true);
    if (function_exists('wc_set_customer_auth_cookie')) {
        wc_set_customer_auth_cookie($user_id);
    }

    $redirect = isset($_POST['redirect']) ? esc_url_raw(wp_unslash($_POST['redirect'])) : '';
    if (!$redirect) {
        $redirect = function_exists('wc_get_page_permalink')
            ? wc_get_page_permalink('myaccount')
            : home_url('/');
    }

    wp_send_json_success(array(
        'message'  => __('Signed in with Google.', 'palmbeach-vitality'),
        'redirect' => $redirect,
    ));
}
add_action('wp_ajax_nopriv_pbv_google_signin', 'pbv_ajax_google_signin');
add_action('wp_ajax_pbv_google_signin', 'pbv_ajax_google_signin');
