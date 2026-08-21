<?php
/**
 * Storefront email list: persist popup subscribers, sync MailPoet, monthly Lab Notes.
 *
 * @package PalmBeachVitality
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Option key: associative array keyed by lowercase email. */
define('PBV_EMAIL_SUBSCRIBERS_OPTION', 'pbv_email_subscribers');

/** MailPoet list shown in MailPoet → Subscribers. */
define('PBV_MAILPOET_LIST_NAME', 'Palm Beach Vitality');

/**
 * @return array<string, array<string, mixed>>
 */
function pbv_get_email_subscribers() {
    $rows = get_option(PBV_EMAIL_SUBSCRIBERS_OPTION, array());
    return is_array($rows) ? $rows : array();
}

/**
 * Whether MailPoet’s public API is loaded.
 *
 * @return bool
 */
function pbv_mailpoet_api_available() {
    return class_exists('\MailPoet\API\API', false);
}

/**
 * @return \MailPoet\API\MP\v1\API|null
 */
function pbv_mailpoet_api() {
    if (!pbv_should_touch_mailpoet() || !pbv_mailpoet_api_available()) {
        return null;
    }
    try {
        return \MailPoet\API\API::MP('v1');
    } catch (\Exception $e) {
        return null;
    }
}

/**
 * MailPoet list id for storefront signups (created if the API allows it).
 *
 * @return int 0 if MailPoet is unavailable or has no usable list.
 */
function pbv_mailpoet_list_id() {
    $api = pbv_mailpoet_api();
    if (!$api) {
        return 0;
    }

    $saved = (int) get_option('pbv_mailpoet_list_id', 0);
    try {
        $lists = $api->getLists();
    } catch (\Exception $e) {
        return 0;
    }

    if (!is_array($lists)) {
        return 0;
    }

    foreach ($lists as $list) {
        $id = isset($list['id']) ? (int) $list['id'] : 0;
        $name = isset($list['name']) ? (string) $list['name'] : '';
        if ($saved && $id === $saved) {
            return $id;
        }
        if ($id && strcasecmp($name, PBV_MAILPOET_LIST_NAME) === 0) {
            update_option('pbv_mailpoet_list_id', $id, false);
            return $id;
        }
    }

    if (method_exists($api, 'addList')) {
        try {
            $created = $api->addList(
                array(
                    'name'        => PBV_MAILPOET_LIST_NAME,
                    'description' => 'Homepage subscribe popup — Palm Beach Vitality storefront.',
                )
            );
            $id = isset($created['id']) ? (int) $created['id'] : 0;
            if ($id) {
                update_option('pbv_mailpoet_list_id', $id, false);
                return $id;
            }
        } catch (\Exception $e) {
            // Fall through to a default list.
        }
    }

    foreach ($lists as $list) {
        $id = isset($list['id']) ? (int) $list['id'] : 0;
        $name = isset($list['name']) ? (string) $list['name'] : '';
        $type = isset($list['type']) ? (string) $list['type'] : '';
        if (!$id) {
            continue;
        }
        if (strcasecmp($name, 'WordPress Users') === 0 || strcasecmp($type, 'wp_users') === 0) {
            continue;
        }
        if (strcasecmp($name, 'Newsletter mailing list') === 0 || $type === 'default') {
            update_option('pbv_mailpoet_list_id', $id, false);
            return $id;
        }
    }

    foreach ($lists as $list) {
        $id = isset($list['id']) ? (int) $list['id'] : 0;
        $name = isset($list['name']) ? (string) $list['name'] : '';
        if ($id && strcasecmp($name, 'WordPress Users') !== 0) {
            update_option('pbv_mailpoet_list_id', $id, false);
            return $id;
        }
    }

    return 0;
}

/**
 * Turn off MailPoet sign-up confirmation.
 *
 * Popup signups are Subscribed as soon as they enter an email. The storefront
 * still sends the branded intro (WELCOME20). No Confirm-link email.
 */
function pbv_mailpoet_disable_signup_confirmation() {
    if (!pbv_should_touch_mailpoet() || !class_exists('\MailPoet\Settings\SettingsController', false)) {
        return;
    }
    try {
        $settings = \MailPoet\Settings\SettingsController::getInstance();
        if (method_exists($settings, 'isSettingEnabled') && !$settings->isSettingEnabled('signup_confirmation.enabled')) {
            return;
        }
        $value = method_exists($settings, 'get') ? $settings->get('signup_confirmation.enabled') : true;
        if ($value === false || $value === 0 || $value === '0' || $value === '') {
            return;
        }
        $settings->set('signup_confirmation.enabled', false);
    } catch (\Throwable $e) {
        return;
    }
}

/**
 * @deprecated Use pbv_mailpoet_disable_signup_confirmation().
 */
function pbv_mailpoet_enable_signup_confirmation() {
    pbv_mailpoet_disable_signup_confirmation();
}

/**
 * Avoid MailPoet’s own REST/admin bootstrap (blank/spinner admin pages).
 *
 * @return bool
 */
function pbv_should_touch_mailpoet() {
    if (defined('REST_REQUEST') && REST_REQUEST) {
        return false;
    }
    $page = isset($_GET['page']) ? (string) $_GET['page'] : '';
    if ($page !== '' && strpos($page, 'mailpoet') === 0) {
        return false;
    }
    $uri = isset($_SERVER['REQUEST_URI']) ? strtolower((string) wp_unslash($_SERVER['REQUEST_URI'])) : '';
    if ($uri !== '' && (strpos($uri, '/wp-json/mailpoet') !== false || strpos($uri, 'page=mailpoet') !== false)) {
        return false;
    }
    return true;
}

/**
 * Options for MailPoet addSubscriber / subscribeToLists.
 *
 * No confirmation email. MailPoet welcome emails stay off (the storefront
 * already sends the branded intro with WELCOME20).
 *
 * @return array<string, bool>
 */
function pbv_mailpoet_subscriber_options() {
    return pbv_mailpoet_silent_options();
}

/**
 * MailPoet From that WordPress.com can actually send.
 *
 * sales@palmbeach-vitality.com is DMARC-quarantined on WP.com (not in that SPF).
 * wordpress@palmbeach-vitality.store is the same From the intro fallback uses.
 */
function pbv_mailpoet_align_sender() {
    if (!pbv_should_touch_mailpoet() || !class_exists('\MailPoet\Settings\SettingsController', false)) {
        return;
    }
    if (get_option('pbv_mailpoet_sender_set')) {
        return;
    }
    $from = function_exists('pbv_authenticated_from_address') ? pbv_authenticated_from_address() : '';
    if ($from === '') {
        return;
    }
    try {
        $settings = \MailPoet\Settings\SettingsController::getInstance();
        $settings->set(
            'sender',
            array(
                'name'    => 'Palm Beach Vitality',
                'address' => $from,
            )
        );
        $settings->set(
            'reply_to',
            array(
                'name'    => 'Palm Beach Vitality',
                'address' => 'sales@palmbeach-vitality.com',
            )
        );
        update_option('pbv_mailpoet_sender_set', 1, false);
    } catch (\Throwable $e) {
        return;
    }
}
add_action('init', 'pbv_mailpoet_align_sender', 20);
add_action('init', 'pbv_mailpoet_disable_signup_confirmation', 21);

/**
 * HMAC for the storefront list-confirm link.
 *
 * @param string $email Email.
 * @return string
 */
function pbv_list_confirm_token($email) {
    return hash_hmac('sha256', strtolower(sanitize_email($email)), wp_salt('nonce'));
}

/**
 * Public confirm URL (Lab Notes opt-in).
 *
 * @param string $email Email.
 * @return string
 */
function pbv_list_confirm_url($email) {
    $email = strtolower(sanitize_email($email));
    return add_query_arg(
        array(
            'pbv_confirm' => pbv_list_confirm_token($email),
            'email'       => $email,
        ),
        home_url('/')
    );
}

/**
 * MailPoet options that do not try to send MailPoet’s own confirmation mail.
 *
 * @return array<string, bool>
 */
function pbv_mailpoet_silent_options() {
    return array(
        'send_confirmation_email'      => false,
        'schedule_welcome_email'       => false,
        'skip_subscriber_notification' => true,
    );
}

/**
 * Add to MailPoet without triggering MailPoet’s confirmation mailer.
 *
 * @param string $email Email.
 * @param int[]  $lists List ids.
 * @return bool
 */
function pbv_mailpoet_add_silent($email, array $lists) {
    $api = pbv_mailpoet_api();
    if (!$api) {
        return false;
    }
    $opts = pbv_mailpoet_silent_options();
    try {
        $api->addSubscriber(array('email' => $email), $lists, $opts);
        return true;
    } catch (\Exception $e) {
        $code = (int) $e->getCode();
        $msg  = $e->getMessage();
        if ($code === 12 || stripos($msg, 'already exists') !== false) {
            if ($lists && method_exists($api, 'subscribeToLists')) {
                try {
                    $api->subscribeToLists($email, $lists, $opts);
                } catch (\Exception $e2) {
                    return true;
                }
            }
            return true;
        }
        return false;
    }
}

/**
 * MailPoet table name if it exists (wp_mailpoet_subscribers, etc.).
 *
 * @param string $suffix Table suffix after mailpoet_.
 * @return string
 */
function pbv_mailpoet_table($suffix) {
    global $wpdb;
    $name = $wpdb->prefix . 'mailpoet_' . preg_replace('/[^a-z_]/', '', strtolower((string) $suffix));
    if ($name === $wpdb->prefix . 'mailpoet_') {
        return '';
    }
    $found = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($name)));
    return is_string($found) && $found === $name ? $name : '';
}

/**
 * Force MailPoet global + list status to subscribed (same as Edit → Status).
 *
 * The public API often leaves people Unconfirmed when the MailPoet Sending
 * Service is on. Direct table update is what MailPoet’s own admin edit does.
 *
 * @param string $email Email.
 * @return bool
 */
function pbv_mailpoet_force_subscribed_status($email) {
    global $wpdb;

    $email = strtolower(sanitize_email($email));
    if ($email === '') {
        return false;
    }

    $subs_table = pbv_mailpoet_table('subscribers');
    if ($subs_table === '') {
        return false;
    }

    $now = gmdate('Y-m-d H:i:s');
    $wpdb->query(
        $wpdb->prepare(
            "UPDATE `{$subs_table}` SET `status` = %s WHERE `email` = %s",
            'subscribed',
            $email
        )
    );
    $wpdb->query(
        $wpdb->prepare(
            "UPDATE `{$subs_table}` SET `confirmed_at` = %s WHERE `email` = %s",
            $now,
            $email
        )
    );

    $sub_id = (int) $wpdb->get_var(
        $wpdb->prepare("SELECT id FROM `{$subs_table}` WHERE email = %s LIMIT 1", $email)
    );
    if ($sub_id) {
        $seg_table = pbv_mailpoet_table('subscriber_segment');
        $list_id   = pbv_mailpoet_list_id();
        if ($seg_table !== '' && $list_id) {
            $seg_updated = $wpdb->update(
                $seg_table,
                array('status' => 'subscribed'),
                array(
                    'subscriber_id' => $sub_id,
                    'segment_id'    => $list_id,
                ),
                array('%s'),
                array('%d', '%d')
            );
            if ($seg_updated === 0) {
                $wpdb->insert(
                    $seg_table,
                    array(
                        'subscriber_id' => $sub_id,
                        'segment_id'    => $list_id,
                        'status'        => 'subscribed',
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    )
                );
            }
        }
    }

    $status = (string) $wpdb->get_var(
        $wpdb->prepare("SELECT status FROM `{$subs_table}` WHERE email = %s LIMIT 1", $email)
    );
    return $status === 'subscribed';
}

/**
 * Mark a MailPoet subscriber subscribed (newsletters can send).
 *
 * @param string $email Email.
 * @return bool
 */
function pbv_mailpoet_mark_subscribed($email) {
    $email = strtolower(sanitize_email($email));
    if ($email === '') {
        return false;
    }
    $api     = pbv_mailpoet_api();
    $list_id = pbv_mailpoet_list_id();
    $lists   = $list_id ? array($list_id) : array();
    $opts    = pbv_mailpoet_silent_options();

    if ($api) {
        try {
            $api->addSubscriber(
                array(
                    'email'  => $email,
                    'status' => 'subscribed',
                ),
                $lists,
                $opts
            );
        } catch (\Exception $e) {
            if (method_exists($api, 'updateSubscriber')) {
                try {
                    $api->updateSubscriber($email, array('status' => 'subscribed'));
                } catch (\Exception $e_upd) {
                    // Fall through.
                }
            }
            if ($lists && method_exists($api, 'subscribeToLists')) {
                try {
                    $api->subscribeToLists($email, $lists, $opts);
                } catch (\Exception $e2) {
                    // Continue to a forced status write.
                }
            }
        }
    }

    try {
        if (class_exists('\MailPoet\DI\ContainerWrapper') && class_exists('\MailPoet\Subscribers\SubscribersRepository') && class_exists('\MailPoet\Entities\SubscriberEntity')) {
            $repo = \MailPoet\DI\ContainerWrapper::getInstance()->get(\MailPoet\Subscribers\SubscribersRepository::class);
            $sub  = null;
            if ($repo && method_exists($repo, 'findOneByEmail')) {
                $sub = $repo->findOneByEmail($email);
            } elseif ($repo && method_exists($repo, 'findOneBy')) {
                $sub = $repo->findOneBy(array('email' => $email));
            }
            if ($sub && method_exists($sub, 'setStatus')) {
                $sub->setStatus(\MailPoet\Entities\SubscriberEntity::STATUS_SUBSCRIBED);
                if (method_exists($sub, 'setConfirmedAt')) {
                    $sub->setConfirmedAt(new \DateTime('now', new \DateTimeZone('UTC')));
                }
                if (method_exists($repo, 'persist')) {
                    $repo->persist($sub);
                }
                if (method_exists($repo, 'flush')) {
                    $repo->flush();
                }
            }
        }
    } catch (\Throwable $e) {
        // Direct table write below.
    }

    try {
        if (class_exists('\MailPoet\Models\Subscriber')) {
            $sub = \MailPoet\Models\Subscriber::findOne($email);
            if ($sub) {
                $sub->status = \MailPoet\Models\Subscriber::STATUS_SUBSCRIBED;
                $sub->save();
            }
        }
    } catch (\Throwable $e) {
        // Direct table write below.
    }

    return pbv_mailpoet_force_subscribed_status($email);
}

/**
 * Confirmation email WordPress.com can send (From wordpress@…store).
 *
 * @param string $email Email.
 * @return bool
 */
function pbv_send_list_confirm_email($email) {
    $email = strtolower(sanitize_email($email));
    if ($email === '' || !is_email($email)) {
        return false;
    }
    $url     = pbv_list_confirm_url($email);
    $subject = 'Confirm your email for Lab Notes — Palm Beach Vitality';
    $html    = '<p>Thanks for joining the Palm Beach Vitality research list.</p>'
        . '<p>Confirm this address to receive Lab Notes (research updates only). This is not for human consumption or medical advice.</p>'
        . '<p><a href="' . esc_url($url) . '">Confirm my email</a></p>'
        . '<p style="color:#6b6b6b;font-size:13px;">If you did not subscribe, ignore this message.</p>';
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        'Reply-To: sales@palmbeach-vitality.com',
    );
    $from = function_exists('pbv_authenticated_from_address') ? pbv_authenticated_from_address() : '';
    if ($from !== '') {
        $headers[] = 'From: Palm Beach Vitality <' . $from . '>';
    }
    return (bool) wp_mail($email, $subject, $html, $headers);
}

/**
 * Handle ?pbv_confirm=&email= from the storefront confirmation mail.
 */
function pbv_handle_list_confirm() {
    if (empty($_GET['pbv_confirm']) || empty($_GET['email'])) {
        return;
    }
    $email = strtolower(sanitize_email(wp_unslash((string) $_GET['email'])));
    $token = sanitize_text_field(wp_unslash((string) $_GET['pbv_confirm']));
    $expected = pbv_list_confirm_token($email);
    if ($email === '' || !is_email($email) || strlen($token) !== strlen($expected) || !hash_equals($expected, $token)) {
        wp_die(esc_html__('That confirmation link is not valid.', 'palmbeach-vitality'), '', array('response' => 400));
    }
    pbv_mailpoet_mark_subscribed($email);
    $rows = pbv_get_email_subscribers();
    if (isset($rows[$email]) && is_array($rows[$email])) {
        $rows[$email]['mailpoet']     = 'confirmed';
        $rows[$email]['last_seen_at'] = current_time('mysql');
        update_option(PBV_EMAIL_SUBSCRIBERS_OPTION, $rows, false);
    }
    wp_safe_redirect(add_query_arg('pbv_confirmed', '1', home_url('/')));
    exit;
}
add_action('template_redirect', 'pbv_handle_list_confirm', 0);

/**
 * Whether MailPoet sign-up confirmation is on.
 *
 * @return bool
 */
function pbv_mailpoet_signup_confirmation_enabled() {
    if (!pbv_should_touch_mailpoet() || !class_exists('\MailPoet\Settings\SettingsController', false)) {
        return false;
    }
    try {
        $settings = \MailPoet\Settings\SettingsController::getInstance();
        if (method_exists($settings, 'isSettingEnabled')) {
            return (bool) $settings->isSettingEnabled('signup_confirmation.enabled');
        }
        $value = $settings->get('signup_confirmation.enabled');
        return $value === true || $value === 1 || $value === '1';
    } catch (\Throwable $e) {
        return false;
    }
}

/**
 * Add (or re-subscribe) an address in MailPoet as Subscribed immediately.
 *
 * No confirmation email. The storefront already sends the branded intro.
 *
 * @param string $email Email.
 * @param bool   $optin Unused. Popup email is always a list subscribe.
 * @return string Status token: subscribed, skipped, skipped-no-optin, or error: …
 */
function pbv_mailpoet_add_subscriber($email, $optin = true) {
    $api = pbv_mailpoet_api();
    if (!$api) {
        return 'skipped';
    }
    if (!$optin) {
        $optin = true;
    }

    pbv_mailpoet_disable_signup_confirmation();
    pbv_mailpoet_align_sender();

    return pbv_mailpoet_mark_subscribed($email)
        ? 'subscribed'
        : 'error: could not subscribe';
}

/**
 * Persist a popup subscriber and sync MailPoet when the plugin is active.
 *
 * @param string $email Email.
 * @param array  $args {
 *     @type bool   $optin  Marketing checkbox.
 *     @type string $source Signup source slug.
 * }
 * @return bool
 */
function pbv_record_email_subscriber($email, $args = array()) {
    $email = sanitize_email($email);
    if ($email === '' || !is_email($email)) {
        return false;
    }
    $email  = strtolower($email);
    $optin  = true;
    $source = isset($args['source']) ? sanitize_key((string) $args['source']) : 'homepage_subscribe_popup';
    if ($source === '') {
        $source = 'homepage_subscribe_popup';
    }

    $now  = current_time('mysql');
    $rows = pbv_get_email_subscribers();
    if (isset($rows[$email]) && is_array($rows[$email])) {
        $rows[$email]['last_seen_at'] = $now;
        $rows[$email]['optin']        = $optin || !empty($rows[$email]['optin']);
        $rows[$email]['source']       = $source;
    } else {
        $rows[$email] = array(
            'email'         => $email,
            'optin'         => $optin,
            'source'        => $source,
            'subscribed_at' => $now,
            'last_seen_at'  => $now,
            'mailpoet'      => '',
        );
    }

    $rows[$email]['mailpoet'] = pbv_mailpoet_add_subscriber($email, !empty($rows[$email]['optin']));
    update_option(PBV_EMAIL_SUBSCRIBERS_OPTION, $rows, false);
    return true;
}

/**
 * Internal writing space for the monthly newsletter (not a public /blog/).
 */
function pbv_register_lab_notes() {
    register_post_type(
        'pbv_lab_note',
        array(
            'labels'              => array(
                'name'               => __('Monthly Lab Notes', 'palmbeach-vitality'),
                'singular_name'      => __('Lab Note', 'palmbeach-vitality'),
                'add_new'            => __('Add Lab Note', 'palmbeach-vitality'),
                'add_new_item'       => __('Write a lab note', 'palmbeach-vitality'),
                'edit_item'          => __('Edit lab note', 'palmbeach-vitality'),
                'new_item'           => __('New lab note', 'palmbeach-vitality'),
                'view_item'          => __('View lab note', 'palmbeach-vitality'),
                'search_items'       => __('Search lab notes', 'palmbeach-vitality'),
                'not_found'          => __('No lab notes yet.', 'palmbeach-vitality'),
                'not_found_in_trash' => __('No lab notes in trash.', 'palmbeach-vitality'),
                'menu_name'          => __('Lab Notes', 'palmbeach-vitality'),
            ),
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'menu_icon'           => 'dashicons-welcome-write-blog',
            'menu_position'       => 57,
            'supports'            => array('title', 'editor', 'excerpt', 'thumbnail'),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            'exclude_from_search' => true,
            'publicly_queryable'  => false,
            'has_archive'         => false,
            'rewrite'             => false,
        )
    );
}
add_action('init', 'pbv_register_lab_notes');

/**
 * @return string
 */
function pbv_subscribers_capability() {
    return current_user_can('manage_woocommerce') ? 'manage_woocommerce' : 'manage_options';
}

/**
 * Admin: Email list + MailPoet monthly setup.
 */
function pbv_register_subscribers_menu() {
    add_menu_page(
        __('Email subscribers', 'palmbeach-vitality'),
        __('Email list', 'palmbeach-vitality'),
        pbv_subscribers_capability(),
        'pbv-subscribers',
        'pbv_render_subscribers_page',
        'dashicons-email-alt',
        56
    );
}
add_action('admin_menu', 'pbv_register_subscribers_menu');

/**
 * CSV download for the WP-admin list (not stored in the repo).
 */
function pbv_maybe_export_subscribers_csv() {
    if (!is_admin() || !isset($_GET['page']) || $_GET['page'] !== 'pbv-subscribers') {
        return;
    }
    if (empty($_GET['pbv_export'])) {
        return;
    }
    if (!current_user_can(pbv_subscribers_capability())) {
        wp_die(esc_html__('You cannot export this list.', 'palmbeach-vitality'));
    }
    check_admin_referer('pbv_export_subscribers');

    $rows = pbv_get_email_subscribers();
    uasort(
        $rows,
        static function ($a, $b) {
            $ta = isset($a['subscribed_at']) ? (string) $a['subscribed_at'] : '';
            $tb = isset($b['subscribed_at']) ? (string) $b['subscribed_at'] : '';
            return strcmp($tb, $ta);
        }
    );

    nocache_headers();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=pbv-subscribers-' . gmdate('Y-m-d') . '.csv');

    $out = fopen('php://output', 'w');
    fputcsv($out, array('email', 'optin', 'source', 'subscribed_at', 'last_seen_at', 'mailpoet'));
    foreach ($rows as $row) {
        if (!is_array($row)) {
            continue;
        }
        fputcsv(
            $out,
            array(
                isset($row['email']) ? $row['email'] : '',
                !empty($row['optin']) ? 'yes' : 'no',
                isset($row['source']) ? $row['source'] : '',
                isset($row['subscribed_at']) ? $row['subscribed_at'] : '',
                isset($row['last_seen_at']) ? $row['last_seen_at'] : '',
                isset($row['mailpoet']) ? $row['mailpoet'] : '',
            )
        );
    }
    fclose($out);
    exit;
}
add_action('admin_init', 'pbv_maybe_export_subscribers_csv');

/**
 * Mark Unconfirmed people on the Palm Beach Vitality list as Subscribed.
 *
 * Does not touch WordPress Users / WooCommerce Customers lists.
 *
 * @param array<string, array<string, mixed>> $rows Email list rows (by reference).
 */
function pbv_mailpoet_subscribe_unconfirmed_on_store_list(array &$rows) {
    $list_id = pbv_mailpoet_list_id();
    if (!$list_id) {
        return;
    }

    $now  = current_time('mysql');
    $seen = array();

    try {
        if (class_exists('\MailPoet\DI\ContainerWrapper') && class_exists('\MailPoet\Subscribers\SubscribersRepository') && class_exists('\MailPoet\Entities\SubscriberEntity')) {
            $repo = \MailPoet\DI\ContainerWrapper::getInstance()->get(\MailPoet\Subscribers\SubscribersRepository::class);
            if ($repo && method_exists($repo, 'findBy')) {
                $subs = $repo->findBy(array('status' => \MailPoet\Entities\SubscriberEntity::STATUS_UNCONFIRMED));
                if (is_array($subs) || $subs instanceof \Traversable) {
                    foreach ($subs as $sub) {
                        if (!is_object($sub) || !method_exists($sub, 'getEmail')) {
                            continue;
                        }
                        $on_list = false;
                        if (method_exists($sub, 'getSubscriberSegments')) {
                            foreach ($sub->getSubscriberSegments() as $ss) {
                                $seg = (is_object($ss) && method_exists($ss, 'getSegment')) ? $ss->getSegment() : null;
                                $sid = (is_object($seg) && method_exists($seg, 'getId')) ? (int) $seg->getId() : 0;
                                if ($sid === $list_id) {
                                    $on_list = true;
                                    break;
                                }
                            }
                        }
                        if (!$on_list) {
                            continue;
                        }
                        $email = strtolower(sanitize_email((string) $sub->getEmail()));
                        if ($email === '' || isset($seen[$email])) {
                            continue;
                        }
                        $seen[$email] = true;
                        if (pbv_mailpoet_mark_subscribed($email)) {
                            if (!isset($rows[$email]) || !is_array($rows[$email])) {
                                $rows[$email] = array(
                                    'email'         => $email,
                                    'optin'         => true,
                                    'source'        => 'mailpoet_unconfirmed',
                                    'subscribed_at' => $now,
                                    'last_seen_at'  => $now,
                                    'mailpoet'      => 'subscribed',
                                );
                            } else {
                                $rows[$email]['mailpoet']     = 'subscribed';
                                $rows[$email]['last_seen_at'] = $now;
                            }
                        }
                    }
                }
            }
        }
    } catch (\Throwable $e) {
        return;
    }
}

/**
 * Retry MailPoet sync for every stored address.
 */
function pbv_maybe_resync_mailpoet() {
    if (!is_admin() || empty($_POST['pbv_resync_mailpoet'])) {
        return;
    }
    if (!current_user_can(pbv_subscribers_capability())) {
        return;
    }
    check_admin_referer('pbv_resync_mailpoet');

    $rows = pbv_get_email_subscribers();
    foreach ($rows as $email => $row) {
        if (!is_array($row)) {
            continue;
        }
        $optin = true;
        $rows[$email]['mailpoet'] = pbv_mailpoet_add_subscriber($email, $optin);
    }
    pbv_mailpoet_subscribe_unconfirmed_on_store_list($rows);
    update_option(PBV_EMAIL_SUBSCRIBERS_OPTION, $rows, false);

    wp_safe_redirect(
        add_query_arg(
            array(
                'page'         => 'pbv-subscribers',
                'pbv_synced'   => '1',
            ),
            admin_url('admin.php')
        )
    );
    exit;
}
add_action('admin_init', 'pbv_maybe_resync_mailpoet');

/**
 * Plugin file for MailPoet if it is installed (active or not).
 *
 * @return string
 */
function pbv_mailpoet_plugin_file() {
    if (!function_exists('get_plugins')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    foreach (get_plugins() as $file => $data) {
        if (strpos($file, 'mailpoet/') === 0) {
            return $file;
        }
    }
    return '';
}

/**
 * Admin UI: subscriber table + MailPoet monthly newsletter checklist.
 */
function pbv_render_subscribers_page() {
    if (!current_user_can(pbv_subscribers_capability())) {
        wp_die(esc_html__('You cannot view this list.', 'palmbeach-vitality'));
    }

    $rows = pbv_get_email_subscribers();
    uasort(
        $rows,
        static function ($a, $b) {
            $ta = isset($a['subscribed_at']) ? (string) $a['subscribed_at'] : '';
            $tb = isset($b['subscribed_at']) ? (string) $b['subscribed_at'] : '';
            return strcmp($tb, $ta);
        }
    );

    $mp_on      = pbv_mailpoet_api_available();
    $mp_file    = pbv_mailpoet_plugin_file();
    $mp_list_id = $mp_on ? pbv_mailpoet_list_id() : 0;
    $export_url = wp_nonce_url(
        add_query_arg(
            array(
                'page'       => 'pbv-subscribers',
                'pbv_export' => '1',
            ),
            admin_url('admin.php')
        ),
        'pbv_export_subscribers'
    );
    $mailpoet_subs = admin_url('admin.php?page=mailpoet-subscribers');
    $mailpoet_emails = admin_url('admin.php?page=mailpoet-newsletters');
    $mailpoet_signup = admin_url('admin.php?page=mailpoet-settings#/signup');
    $confirm_on = $mp_on && function_exists('pbv_mailpoet_signup_confirmation_enabled') && pbv_mailpoet_signup_confirmation_enabled();
    $plugins_url = admin_url('plugins.php');
    $lab_notes_url = admin_url('edit.php?post_type=pbv_lab_note');
    $welcome = defined('PBV_WELCOME_COUPON_CODE') ? PBV_WELCOME_COUPON_CODE : 'WELCOME20';

    echo '<div class="wrap">';
    echo '<h1>' . esc_html__('Email subscribers', 'palmbeach-vitality') . '</h1>';

    if (!empty($_GET['pbv_synced'])) {
        echo '<div class="notice notice-success is-dismissible"><p>'
            . esc_html__('MailPoet sync finished. Check the MailPoet column below.', 'palmbeach-vitality')
            . '</p></div>';
    }

    echo '<p>' . esc_html(
        sprintf(
            /* translators: %s: coupon code */
            __('New popup signups are stored here, emailed the branded intro (including %s), and added to MailPoet as Subscribed. There is no confirmation email.', 'palmbeach-vitality'),
            $welcome
        )
    ) . '</p>';

    echo '<div class="card" style="max-width:880px;padding:16px 20px 8px;margin:16px 0 24px;">';
    echo '<h2 style="margin-top:0;">' . esc_html__('Where to see the list', 'palmbeach-vitality') . '</h2>';
    echo '<ol>';
    echo '<li><strong>' . esc_html__('This page', 'palmbeach-vitality') . '</strong> — '
        . esc_html__('WP Admin → Email list. Covers everyone who subscribed after this theme version was uploaded.', 'palmbeach-vitality')
        . '</li>';
    if ($mp_on) {
        echo '<li><strong><a href="' . esc_url($mailpoet_subs) . '">'
            . esc_html__('MailPoet → Subscribers', 'palmbeach-vitality')
            . '</a></strong> — '
            . esc_html__('The list MailPoet uses to send the monthly newsletter.', 'palmbeach-vitality')
            . '</li>';
    } else {
        echo '<li><strong>' . esc_html__('MailPoet → Subscribers', 'palmbeach-vitality') . '</strong> — '
            . esc_html__('After you activate MailPoet (WordPress.com Commerce already includes it).', 'palmbeach-vitality')
            . '</li>';
    }
    echo '<li>' . esc_html__('Older signups (before this list existed) only appear in staff “New subscriber” emails, n8n executions, or Gmail Sent.', 'palmbeach-vitality') . '</li>';
    echo '</ol>';
    echo '</div>';

    echo '<div class="card" style="max-width:880px;padding:16px 20px 8px;margin:0 0 24px;">';
    echo '<h2 style="margin-top:0;">' . esc_html__('MailPoet — monthly email blog', 'palmbeach-vitality') . '</h2>';
    if ($mp_on) {
        echo '<p><span class="dashicons dashicons-yes-alt" style="color:#00a32a;"></span> '
            . esc_html__('MailPoet is active.', 'palmbeach-vitality');
        if ($mp_list_id) {
            echo ' ' . esc_html(
                sprintf(
                    /* translators: 1: list name, 2: list id */
                    __('Storefront list: “%1$s” (id %2$d).', 'palmbeach-vitality'),
                    PBV_MAILPOET_LIST_NAME,
                    $mp_list_id
                )
            );
        }
        echo '</p>';
        echo '<p>';
        if ($confirm_on) {
            echo '<span class="dashicons dashicons-warning" style="color:#dba617;"></span> '
                . esc_html__('Sign-up confirmation is still on. The theme turns it off so popup emails are Subscribed immediately. Open MailPoet Settings if this stays on after a page refresh.', 'palmbeach-vitality');
        } else {
            echo '<span class="dashicons dashicons-yes-alt" style="color:#00a32a;"></span> '
                . esc_html__('Sign-up confirmation is off. Popup emails are Subscribed as soon as they join. They still get the branded intro with the welcome code.', 'palmbeach-vitality');
        }
        echo ' <a href="' . esc_url($mailpoet_signup) . '">'
            . esc_html__('MailPoet → Settings → Sign-up Confirmation', 'palmbeach-vitality')
            . '</a></p>';
        echo '<ol>';
        echo '<li>' . esc_html__('MailPoet → Settings → sender must be wordpress@palmbeach-vitality.store (WordPress.com can sign that address). Reply-To can stay sales@palmbeach-vitality.com. The theme sets this once after upload.', 'palmbeach-vitality') . '</li>';
        echo '<li><a href="' . esc_url($mailpoet_emails) . '">'
            . esc_html__('MailPoet → Emails → New email → Newsletter', 'palmbeach-vitality')
            . '</a> — '
            . esc_html__('this is the monthly email blog. Send to the Palm Beach Vitality list.', 'palmbeach-vitality')
            . '</li>';
        echo '<li>' . esc_html__('Optional: MailPoet → Emails → Automations → create a Newsletter and schedule it for the 1st of each month.', 'palmbeach-vitality') . '</li>';
        echo '<li>' . esc_html__('Turn off MailPoet’s own Welcome Email so new subscribers only get the branded intro from the storefront popup (avoids two welcome emails).', 'palmbeach-vitality') . '</li>';
        echo '<li><a href="' . esc_url($lab_notes_url) . '">'
            . esc_html__('Lab Notes', 'palmbeach-vitality')
            . '</a> — '
            . esc_html__('private drafts for the monthly issue. Copy into the MailPoet newsletter; they are not published on a public /blog/ page.', 'palmbeach-vitality')
            . '</li>';
        echo '</ol>';
    } elseif ($mp_file) {
        echo '<p>' . esc_html__('MailPoet is installed on this WordPress.com site but not active yet.', 'palmbeach-vitality') . '</p>';
        echo '<p><a class="button button-primary" href="' . esc_url($plugins_url) . '">'
            . esc_html__('Open Plugins and activate MailPoet', 'palmbeach-vitality')
            . '</a></p>';
        echo '<ol>';
        echo '<li>' . esc_html__('Plugins → MailPoet → Activate (activate MailPoet Premium too if it is listed).', 'palmbeach-vitality') . '</li>';
        echo '<li>' . esc_html__('Run the MailPoet wizard, then return here and click Sync to MailPoet.', 'palmbeach-vitality') . '</li>';
        echo '<li>' . esc_html__('MailPoet → Emails → New email → Newsletter for the monthly email blog.', 'palmbeach-vitality') . '</li>';
        echo '</ol>';
    } else {
        echo '<p>' . esc_html__('MailPoet is not in Plugins yet. On WordPress.com Commerce it is usually preinstalled; otherwise install MailPoet from Plugins → Add Plugin.', 'palmbeach-vitality') . '</p>';
        echo '<p><a class="button button-primary" href="' . esc_url($plugins_url) . '">'
            . esc_html__('Open Plugins', 'palmbeach-vitality')
            . '</a></p>';
    }
    echo '</div>';

    echo '<div style="margin:12px 0 16px;">';
    echo '<a class="button" href="' . esc_url($export_url) . '">' . esc_html__('Download CSV', 'palmbeach-vitality') . '</a> ';
    if ($mp_on && $rows) {
        echo '<form method="post" style="display:inline;">';
        wp_nonce_field('pbv_resync_mailpoet');
        echo '<input type="hidden" name="pbv_resync_mailpoet" value="1" />';
        submit_button(__('Sync to MailPoet', 'palmbeach-vitality'), 'secondary', 'submit', false);
        echo '</form>';
    }
    echo '</div>';

    echo '<table class="widefat striped" style="max-width:960px;">';
    echo '<thead><tr>';
    echo '<th>' . esc_html__('Email', 'palmbeach-vitality') . '</th>';
    echo '<th>' . esc_html__('Opt-in', 'palmbeach-vitality') . '</th>';
    echo '<th>' . esc_html__('Source', 'palmbeach-vitality') . '</th>';
    echo '<th>' . esc_html__('Subscribed', 'palmbeach-vitality') . '</th>';
    echo '<th>' . esc_html__('MailPoet', 'palmbeach-vitality') . '</th>';
    echo '</tr></thead><tbody>';

    if (!$rows) {
        echo '<tr><td colspan="5">' . esc_html__('No storefront subscribers stored yet. New popup signups will appear here.', 'palmbeach-vitality') . '</td></tr>';
    } else {
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            echo '<tr>';
            echo '<td>' . esc_html(isset($row['email']) ? $row['email'] : '') . '</td>';
            echo '<td>' . esc_html(!empty($row['optin']) ? __('Yes', 'palmbeach-vitality') : __('No', 'palmbeach-vitality')) . '</td>';
            echo '<td>' . esc_html(isset($row['source']) ? $row['source'] : '') . '</td>';
            echo '<td>' . esc_html(isset($row['subscribed_at']) ? $row['subscribed_at'] : '') . '</td>';
            echo '<td>' . esc_html(isset($row['mailpoet']) ? $row['mailpoet'] : '') . '</td>';
            echo '</tr>';
        }
    }

    echo '</tbody></table>';
    echo '<p class="description">' . esc_html(
        sprintf(
            /* translators: %d: subscriber count */
            _n('%d subscriber stored in WordPress.', '%d subscribers stored in WordPress.', count($rows), 'palmbeach-vitality'),
            count($rows)
        )
    ) . '</p>';
    echo '</div>';
}
