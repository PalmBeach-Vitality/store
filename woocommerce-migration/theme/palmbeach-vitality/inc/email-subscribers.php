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
 * Enable MailPoet sign-up confirmation (double opt-in).
 *
 * Required by the MailPoet Sending Service. New list members stay Unconfirmed
 * until they click the link in MailPoet’s confirmation email.
 */
function pbv_mailpoet_enable_signup_confirmation() {
    if (!pbv_should_touch_mailpoet()) {
        return;
    }
    if (!class_exists('\MailPoet\Settings\SettingsController', false)) {
        return;
    }
    if (get_option('pbv_mailpoet_doi_set')) {
        return;
    }
    try {
        $settings = \MailPoet\Settings\SettingsController::getInstance();
        if (method_exists($settings, 'isSettingEnabled') && $settings->isSettingEnabled('signup_confirmation.enabled')) {
            update_option('pbv_mailpoet_doi_set', 1, false);
            return;
        }
        $settings->set('signup_confirmation.enabled', true);
        update_option('pbv_mailpoet_doi_set', 1, false);
    } catch (\Throwable $e) {
        return;
    }
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
 * Confirmation email stays on. MailPoet welcome emails stay off (the storefront
 * already sends the branded intro with WELCOME20).
 *
 * @return array<string, bool>
 */
function pbv_mailpoet_subscriber_options() {
    return array(
        'send_confirmation_email'      => true,
        'schedule_welcome_email'       => false,
        'skip_subscriber_notification' => true,
    );
}

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
 * Add (or re-subscribe) an address in MailPoet as unconfirmed until they click Confirm.
 *
 * Do not pass status=subscribed — that skips double opt-in, which the MailPoet
 * Sending Service does not allow.
 *
 * @param string $email Email.
 * @param bool   $optin Marketing opt-in from the popup.
 * @return string Status token: added-pending-confirm, exists, skipped, skipped-no-optin, or error: …
 */
function pbv_mailpoet_add_subscriber($email, $optin = true) {
    $api = pbv_mailpoet_api();
    if (!$api) {
        return 'skipped';
    }
    if (!$optin) {
        return 'skipped-no-optin';
    }

    pbv_mailpoet_enable_signup_confirmation();

    $list_id = pbv_mailpoet_list_id();
    $lists   = $list_id ? array($list_id) : array();
    $options = pbv_mailpoet_subscriber_options();
    $payload = array(
        'email' => $email,
    );

    try {
        $api->addSubscriber($payload, $lists, $options);
        return 'added-pending-confirm';
    } catch (\Exception $e) {
        $msg  = $e->getMessage();
        $code = (int) $e->getCode();
        if ($code === 12 || stripos($msg, 'already exists') !== false || stripos($msg, 'This subscriber already exists') !== false) {
            if ($list_id && method_exists($api, 'subscribeToLists')) {
                try {
                    $api->subscribeToLists($email, $lists, $options);
                } catch (\Exception $e2) {
                    return 'exists';
                }
            }
            return 'exists';
        }
        if ($code === 10) {
            return 'error: confirmation email failed to send';
        }
        return 'error: ' . sanitize_text_field($msg);
    }
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
    $optin  = !empty($args['optin']);
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
        $optin = !empty($row['optin']);
        $rows[$email]['mailpoet'] = pbv_mailpoet_add_subscriber($email, $optin);
    }
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
            __('New popup signups are stored here, emailed the branded intro (including %s), and added to MailPoet as Unconfirmed until they click the confirmation link.', 'palmbeach-vitality'),
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
            echo '<span class="dashicons dashicons-yes-alt" style="color:#00a32a;"></span> '
                . esc_html__('Sign-up confirmation (double opt-in) is on. Newsletters wait until they click Confirm. Required for the MailPoet Sending Service.', 'palmbeach-vitality');
        } else {
            echo '<span class="dashicons dashicons-warning" style="color:#dba617;"></span> '
                . esc_html__('Sign-up confirmation is off. The theme will turn it on; if this still shows, open MailPoet Settings.', 'palmbeach-vitality');
        }
        echo ' <a href="' . esc_url($mailpoet_signup) . '">'
            . esc_html__('MailPoet → Settings → Sign-up Confirmation', 'palmbeach-vitality')
            . '</a></p>';
        echo '<ol>';
        echo '<li>' . esc_html__('MailPoet → Settings → confirm the sender is sales@palmbeach-vitality.com (or your domain mailbox).', 'palmbeach-vitality') . '</li>';
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
