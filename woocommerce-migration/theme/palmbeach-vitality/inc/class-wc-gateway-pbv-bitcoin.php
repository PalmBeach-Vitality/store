<?php
/**
 * Bitcoin ($BTC) payment gateway for Palm Beach Vitality checkout.
 *
 * Manual/instructions gateway so $BTC appears immediately as a payment option.
 * For automated Lightning + on-chain checkout, install Coinsnap (recommended).
 *
 * @package PalmBeachVitality
 */

defined('ABSPATH') || exit;

/**
 * WC_Gateway_PBV_Bitcoin class.
 */
class WC_Gateway_PBV_Bitcoin extends WC_Payment_Gateway {

    /**
     * Extra instructions shown on the thank-you page and in emails.
     *
     * @var string
     */
    public $instructions = '';

    /**
     * BTC receiving address from gateway settings.
     *
     * @var string
     */
    public $btc_address = '';

    /**
     * Register WooCommerce hooks only once (WC instantiates this class often).
     *
     * @var bool
     */
    private static $hooks_registered = false;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->id                 = 'pbv_bitcoin';
        $this->icon               = '';
        $this->has_fields         = true;
        $this->method_title       = __('Bitcoin ($BTC)', 'palmbeach-vitality');
        $this->method_description = __(
            'Accept Bitcoin ($BTC). Customers select Bitcoin at checkout and receive payment instructions. For the easiest automated Lightning + on-chain checkout, install the Coinsnap for WooCommerce plugin (see woocommerce-migration/BTC-PAYMENT.md).',
            'palmbeach-vitality'
        );
        $this->supports           = array('products');

        $this->init_form_fields();
        $this->init_settings();

        $this->title        = $this->get_option('title', __('Bitcoin ($BTC)', 'palmbeach-vitality'));
        $this->description  = '';
        $this->instructions = (string) $this->get_option('instructions', '');
        $this->btc_address  = (string) $this->get_option('btc_address', '');
        $this->enabled      = $this->get_option('enabled', 'yes');

        $this->register_hooks();
    }

    /**
     * Attach thank-you / email / settings hooks a single time per request.
     */
    private function register_hooks() {
        if (self::$hooks_registered) {
            return;
        }
        self::$hooks_registered = true;

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('woocommerce_thankyou_' . $this->id, array($this, 'thankyou_page'));
        add_action('woocommerce_email_before_order_table', array($this, 'email_instructions'), 10, 3);
        add_filter('woocommerce_gateway_description', array($this, 'filter_checkout_description'), 10, 2);
    }

    /**
     * Live BTC/USD spot from Coinbase, then Kraken. Cached 20s. No invented rate.
     *
     * @return array{usd_per_btc:float,source:string,fetched_at:int}|WP_Error
     */
    public static function fetch_spot_usd() {
        $cached = get_transient('pbv_btc_usd_spot');
        if (is_array($cached) && isset($cached['usd_per_btc']) && (float) $cached['usd_per_btc'] > 0) {
            return $cached;
        }

        $sources = array(
            'Coinbase' => 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
            'Kraken'   => 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
            'Binance'  => 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        );

        $errors = array();
        foreach ($sources as $source => $url) {
            $response = wp_remote_get(
                $url,
                array(
                    'timeout' => 8,
                    'headers' => array('Accept' => 'application/json'),
                )
            );
            if (is_wp_error($response)) {
                $errors[] = $source . ': ' . $response->get_error_message();
                continue;
            }
            $code = (int) wp_remote_retrieve_response_code($response);
            $body = (string) wp_remote_retrieve_body($response);
            if ($code < 200 || $code >= 300 || $body === '') {
                $errors[] = $source . ': HTTP ' . $code;
                continue;
            }
            $usd = self::parse_spot_usd($source, $body);
            if ($usd <= 0) {
                $errors[] = $source . ': could not read a USD price';
                continue;
            }
            $data = array(
                'usd_per_btc' => $usd,
                'source'      => $source,
                'fetched_at'  => time(),
            );
            set_transient('pbv_btc_usd_spot', $data, 20);
            return $data;
        }

        return new WP_Error(
            'pbv_btc_rate',
            'Live Bitcoin USD rate unavailable. ' . implode(' | ', $errors)
        );
    }

    /**
     * @param string $source Source name.
     * @param string $body   Raw JSON.
     * @return float
     */
    protected static function parse_spot_usd($source, $body) {
        $json = json_decode($body, true);
        if (!is_array($json)) {
            return 0.0;
        }
        if ($source === 'Coinbase') {
            return isset($json['data']['amount']) ? (float) $json['data']['amount'] : 0.0;
        }
        if ($source === 'Kraken') {
            if (isset($json['result']['XXBTZUSD']['c'][0])) {
                return (float) $json['result']['XXBTZUSD']['c'][0];
            }
            if (isset($json['result']['XBTUSD']['c'][0])) {
                return (float) $json['result']['XBTUSD']['c'][0];
            }
        }
        if ($source === 'Binance' && isset($json['price'])) {
            return (float) $json['price'];
        }
        return 0.0;
    }

    /**
     * Cart / order total in store currency (USD on this store).
     *
     * @param mixed $order Optional WC_Order.
     * @return float
     */
    public static function current_usd_total($order = null) {
        if (is_a($order, 'WC_Order')) {
            return (float) $order->get_total();
        }
        if (function_exists('WC') && WC()->cart) {
            return (float) WC()->cart->get_total('edit');
        }
        return 0.0;
    }

    /**
     * Live conversion box (checkout totals, Bitcoin method, thank-you).
     *
     * @param float  $usd_total USD amount to convert.
     * @param string $variant   compact|full.
     */
    public static function render_live_conversion($usd_total, $variant = 'full') {
        $usd_total = round((float) $usd_total, 2);
        $variant   = $variant === 'compact' ? 'compact' : 'full';
        $id        = 'pbv-btc-amt-' . wp_unique_id();
        $classes   = 'pbv-btc-rate pbv-btc-rate--' . $variant;

        echo '<div class="' . esc_attr($classes) . '" data-pbv-btc-rate data-usd-total="' . esc_attr((string) $usd_total) . '">';
        if ($variant === 'full') {
            echo '<p class="pbv-btc-rate__label">' . esc_html__('Live Bitcoin conversion', 'palmbeach-vitality') . '</p>';
            echo '<p class="pbv-btc-rate__usd">' . esc_html(
                sprintf(
                    /* translators: %s: formatted USD total */
                    __('Checkout total: %s', 'palmbeach-vitality'),
                    '$' . number_format($usd_total, 2)
                )
            ) . '</p>';
        }
        echo '<div class="pbv-btc-rate__btc-row">';
        echo '<div class="pbv-btc-rate__value">';
        echo '<code class="pbv-btc-rate__btc" id="' . esc_attr($id) . '" data-pbv-btc-amount>—</code>';
        echo '<span class="pbv-btc-rate__unit"> BTC</span>';
        echo '</div>';
        if ($variant === 'full') {
            echo '<button type="button" class="pbv-btc-copy__btn" data-pbv-copy="' . esc_attr($id) . '">';
            echo esc_html__('Copy amount', 'palmbeach-vitality');
            echo '</button>';
        }
        echo '</div>';
        echo '<p class="pbv-btc-rate__meta">';
        echo '<span class="pbv-btc-rate__live" data-pbv-btc-live hidden>' . esc_html__('Live', 'palmbeach-vitality') . '</span> ';
        echo '<span data-pbv-btc-spot></span>';
        echo '</p>';
        echo '<p class="pbv-btc-rate__updated" data-pbv-btc-updated></p>';
        echo '<p class="pbv-btc-rate__status" data-pbv-btc-status>' . esc_html__('Loading live rate…', 'palmbeach-vitality') . '</p>';
        echo '</div>';
    }

    /**
     * Admin settings fields.
     */
    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
                'title'   => __('Enable/Disable', 'palmbeach-vitality'),
                'type'    => 'checkbox',
                'label'   => __('Enable Bitcoin ($BTC) payments', 'palmbeach-vitality'),
                'default' => 'yes',
            ),
            'title' => array(
                'title'       => __('Title', 'palmbeach-vitality'),
                'type'        => 'text',
                'description' => __('Payment method title shown at checkout.', 'palmbeach-vitality'),
                'default'     => __('Bitcoin ($BTC)', 'palmbeach-vitality'),
                'desc_tip'    => true,
            ),
            'description' => array(
                'title'       => __('Description', 'palmbeach-vitality'),
                'type'        => 'textarea',
                'description' => __('Shown under the payment method on checkout.', 'palmbeach-vitality'),
                'default'     => __('Pay with Bitcoin (BTC). Copy the address below, send the exact checkout total, then place your order.', 'palmbeach-vitality'),
            ),
            'btc_address' => array(
                'title'       => __('BTC receiving address', 'palmbeach-vitality'),
                'type'        => 'text',
                'description' => __('Your Bitcoin wallet address. Shown at checkout, on the order confirmation, and in customer emails.', 'palmbeach-vitality'),
                'default'     => '38YWdZdVPES6SRc45E4HvdCwqfMwjH3wGw',
                'desc_tip'    => true,
            ),
            'instructions' => array(
                'title'       => __('Payment instructions', 'palmbeach-vitality'),
                'type'        => 'textarea',
                'description' => __('Extra instructions shown on the thank-you page and in order emails.', 'palmbeach-vitality'),
                'default'     => __(
                    'Send the exact order total in Bitcoin ($BTC) to the address below.' . "\n"
                    . 'Include your Order ID in the wallet memo/note if available.' . "\n"
                    . 'Your order ships after the payment confirms on the Bitcoin network.',
                    'palmbeach-vitality'
                ),
            ),
        );
    }

    /**
     * Hide the saved WooCommerce description (it still says the address arrives after checkout).
     *
     * @param string $description Gateway description.
     * @param string $gateway_id  Gateway id.
     * @return string
     */
    public function filter_checkout_description($description, $gateway_id) {
        if ($gateway_id === $this->id) {
            return '';
        }
        return $description;
    }

    /**
     * BTC address shown at checkout (settings, then the live store wallet).
     *
     * @return string
     */
    protected function receiving_address() {
        $addr = trim((string) $this->btc_address);
        if ($addr !== '') {
            return $addr;
        }
        return '38YWdZdVPES6SRc45E4HvdCwqfMwjH3wGw';
    }

    /**
     * Address row with one-click copy.
     *
     * @param string $address BTC address.
     */
    protected function render_address_copy_box($address) {
        $address = trim((string) $address);
        if ($address === '') {
            return;
        }
        $id = 'pbv-btc-addr-' . wp_unique_id();
        $qr = get_template_directory_uri() . '/assets/images/btc-qr.png';
        echo '<div class="pbv-btc-pay">';
        echo '<figure class="pbv-btc-qr" data-pbv-btc-qr data-btc-address="' . esc_attr($address) . '">';
        echo '<div class="pbv-btc-qr__code" data-pbv-btc-qr-target>';
        echo '<img class="pbv-btc-qr__img" src="' . esc_url($qr) . '" width="168" height="168" alt="' . esc_attr__('Scan to send Bitcoin', 'palmbeach-vitality') . '">';
        echo '</div>';
        echo '<figcaption class="pbv-btc-qr__caption">' . esc_html__('Scan to pay', 'palmbeach-vitality') . '</figcaption>';
        echo '</figure>';
        echo '<div class="pbv-btc-copy">';
        echo '<p class="pbv-btc-copy__label">' . esc_html__('Receiving address', 'palmbeach-vitality') . '</p>';
        echo '<div class="pbv-btc-copy__row">';
        echo '<code class="pbv-btc-copy__address" id="' . esc_attr($id) . '">' . esc_html($address) . '</code>';
        echo '<button type="button" class="pbv-btc-copy__btn" data-pbv-copy="' . esc_attr($id) . '">';
        echo esc_html__('Copy', 'palmbeach-vitality');
        echo '</button>';
        echo '</div>';
        echo '</div>';
        echo '</div>';
        $this->render_platform_links();
    }

    /**
     * Five BTC platforms customers can open to send payment.
     *
     * @return array<int, array{label:string,url:string}>
     */
    protected function payment_platforms() {
        return array(
            array(
                'label' => 'Coinbase',
                'url'   => 'https://www.coinbase.com/',
            ),
            array(
                'label' => 'Cash App',
                'url'   => 'https://cash.app/',
            ),
            array(
                'label' => 'Strike',
                'url'   => 'https://strike.me/',
            ),
            array(
                'label' => 'Kraken',
                'url'   => 'https://www.kraken.com/',
            ),
            array(
                'label' => 'Binance',
                'url'   => 'https://www.binance.com/',
            ),
        );
    }

    /**
     * Links to send Bitcoin from common platforms.
     */
    protected function render_platform_links() {
        echo '<div class="pbv-btc-platforms">';
        echo '<p class="pbv-btc-platforms__label">' . esc_html__('Send Bitcoin from:', 'palmbeach-vitality') . '</p>';
        echo '<div class="pbv-btc-platforms__list">';
        foreach ($this->payment_platforms() as $platform) {
            echo '<a class="pbv-btc-platforms__link" href="' . esc_url($platform['url']) . '" target="_blank" rel="noopener noreferrer">';
            echo esc_html($platform['label']);
            echo '</a>';
        }
        echo '</div>';
        echo '<p class="pbv-btc-platforms__hint">' . esc_html__('Scan the QR or paste the address, send the live Bitcoin amount shown, then place your order.', 'palmbeach-vitality') . '</p>';
        echo '</div>';
    }

    /**
     * Checkout fields / description.
     */
    public function payment_fields() {
        echo '<div class="pbv-btc-payment-fields">';
        echo '<ol class="pbv-btc-payment-fields__steps">';
        echo '<li>' . esc_html__('Scan the QR code or copy the Bitcoin address below.', 'palmbeach-vitality') . '</li>';
        echo '<li>' . esc_html__('Send the live Bitcoin amount shown (it updates with the USD rate).', 'palmbeach-vitality') . '</li>';
        echo '<li>' . esc_html__('Place your order. We ship after the payment confirms.', 'palmbeach-vitality') . '</li>';
        echo '</ol>';
        self::render_live_conversion(self::current_usd_total(), 'full');
        $this->render_address_copy_box($this->receiving_address());
        echo '</div>';
    }

    /**
     * Process the payment (pending until BTC confirms / staff marks paid).
     *
     * @param int $order_id Order ID.
     * @return array
     */
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return array('result' => 'failure');
        }

        $order->update_status(
            'on-hold',
            __('Awaiting Bitcoin ($BTC) payment.', 'palmbeach-vitality')
        );

        $address = $this->receiving_address();
        if ($address !== '') {
            $order->update_meta_data('_pbv_btc_address', $address);
        }
        $rate = self::fetch_spot_usd();
        if (!is_wp_error($rate)) {
            $usd = (float) $order->get_total();
            $btc = $usd / (float) $rate['usd_per_btc'];
            $order->update_meta_data('_pbv_btc_usd_rate', (string) $rate['usd_per_btc']);
            $order->update_meta_data('_pbv_btc_amount', number_format($btc, 8, '.', ''));
            $order->update_meta_data('_pbv_btc_rate_source', (string) $rate['source']);
        }
        $order->save();

        wc_reduce_stock_levels($order_id);
        if (WC()->cart) {
            WC()->cart->empty_cart();
        }

        return array(
            'result'   => 'success',
            'redirect' => $this->get_return_url($order),
        );
    }

    /**
     * Thank-you page instructions.
     *
     * @param int $order_id Order ID.
     */
    public function thankyou_page($order_id) {
        $this->output_payment_instructions($order_id);
    }

    /**
     * Email instructions.
     *
     * @param mixed $order         Order.
     * @param bool  $sent_to_admin Admin email.
     * @param bool  $plain_text    Plain text email.
     */
    public function email_instructions($order, $sent_to_admin, $plain_text = false) {
        if ($sent_to_admin || !is_a($order, 'WC_Order')) {
            return;
        }
        if ($order->get_payment_method() !== $this->id) {
            return;
        }
        if (!$order->has_status('on-hold')) {
            return;
        }
        $this->output_payment_instructions($order->get_id(), $plain_text);
    }

    /**
     * Shared instructions markup.
     *
     * @param int  $order_id   Order ID.
     * @param bool $plain_text Plain text mode.
     */
    protected function output_payment_instructions($order_id, $plain_text = false) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $address = (string) $order->get_meta('_pbv_btc_address');
        if ($address === '') {
            $address = $this->receiving_address();
        }
        $total = $order->get_formatted_order_total();
        $snap_btc  = (string) $order->get_meta('_pbv_btc_amount');
        $snap_rate = (string) $order->get_meta('_pbv_btc_usd_rate');

        if ($plain_text) {
            echo "\n" . esc_html__('Bitcoin (BTC) payment', 'palmbeach-vitality') . "\n\n";
            echo esc_html__('Send Bitcoin (BTC) to this address:', 'palmbeach-vitality') . "\n";
            echo esc_html__('Order total:', 'palmbeach-vitality') . ' ' . esc_html(wp_strip_all_tags($total)) . "\n";
            if ($snap_btc !== '' && $snap_rate !== '') {
                echo esc_html__('Bitcoin amount at checkout:', 'palmbeach-vitality') . ' ' . esc_html($snap_btc) . " BTC\n";
                echo esc_html__('Rate at checkout:', 'palmbeach-vitality') . ' 1 BTC = $' . esc_html(number_format((float) $snap_rate, 2)) . "\n";
            }
            if ($address !== '') {
                echo esc_html__('BTC address:', 'palmbeach-vitality') . ' ' . esc_html($address) . "\n";
            }
            return;
        }

        echo '<div class="pbv-btc-instructions">';
        echo '<h3>' . esc_html__('Bitcoin (BTC) payment', 'palmbeach-vitality') . '</h3>';
        echo '<p>' . esc_html__('Send the live Bitcoin amount below to this address. We ship after the payment confirms.', 'palmbeach-vitality') . '</p>';
        echo '<p><strong>' . esc_html__('Order total:', 'palmbeach-vitality') . '</strong> ' . wp_kses_post($total) . '</p>';
        if ($snap_btc !== '') {
            echo '<p><strong>' . esc_html__('Bitcoin amount at checkout:', 'palmbeach-vitality') . '</strong> ' . esc_html($snap_btc) . ' BTC</p>';
        }
        self::render_live_conversion((float) $order->get_total(), 'full');
        $this->render_address_copy_box($address);
        echo '</div>';
    }
}
