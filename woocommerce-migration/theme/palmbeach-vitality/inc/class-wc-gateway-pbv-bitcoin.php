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

if (!class_exists('WC_Payment_Gateway')) {
    return;
}

/**
 * WC_Gateway_PBV_Bitcoin class.
 */
class WC_Gateway_PBV_Bitcoin extends WC_Payment_Gateway {

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

        $this->title              = $this->get_option('title', __('Bitcoin ($BTC)', 'palmbeach-vitality'));
        $this->description        = $this->get_option(
            'description',
            __('Pay with Bitcoin. After placing your order you will receive payment instructions, including our BTC address and the exact amount due.', 'palmbeach-vitality')
        );
        $this->instructions       = $this->get_option('instructions', '');
        $this->btc_address        = $this->get_option('btc_address', '');
        $this->enabled            = $this->get_option('enabled', 'yes');

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        add_action('woocommerce_thankyou_' . $this->id, array($this, 'thankyou_page'));
        add_action('woocommerce_email_before_order_table', array($this, 'email_instructions'), 10, 3);
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
                'default'     => __('Pay with Bitcoin. After placing your order you will receive payment instructions, including our BTC address and the exact amount due.', 'palmbeach-vitality'),
            ),
            'btc_address' => array(
                'title'       => __('BTC receiving address', 'palmbeach-vitality'),
                'type'        => 'text',
                'description' => __('Your Bitcoin wallet address. Shown on the order confirmation and in customer emails. Leave blank until ready — customers still see Bitcoin as a payment option with setup notice.', 'palmbeach-vitality'),
                'default'     => '',
                'desc_tip'    => true,
            ),
            'instructions' => array(
                'title'       => __('Payment instructions', 'palmbeach-vitality'),
                'type'        => 'textarea',
                'description' => __('Extra instructions shown on the thank-you page and in order emails.', 'palmbeach-vitality'),
                'default'     => __(
                    "Send the exact order total in Bitcoin ($BTC) to the address below.\nInclude your Order ID in the wallet memo/note if available.\nYour order ships after the payment confirms on the Bitcoin network.",
                    'palmbeach-vitality'
                ),
            ),
        );
    }

    /**
     * Checkout fields / description.
     */
    public function payment_fields() {
        if ($this->description) {
            echo wpautop(wp_kses_post($this->description));
        }

        echo '<div class="pbv-btc-payment-fields">';
        echo '<p class="pbv-btc-payment-fields__hint">';
        echo esc_html__(
            'You will receive the BTC amount and payment address on the next screen after you place your order.',
            'palmbeach-vitality'
        );
        echo '</p>';
        if ($this->btc_address) {
            echo '<p class="pbv-btc-payment-fields__address"><strong>';
            echo esc_html__('Receiving address:', 'palmbeach-vitality');
            echo '</strong> <code>' . esc_html($this->btc_address) . '</code></p>';
        }
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

        if ($this->btc_address) {
            $order->update_meta_data('_pbv_btc_address', $this->btc_address);
            $order->save();
        }

        wc_reduce_stock_levels($order_id);
        WC()->cart->empty_cart();

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
     * @param WC_Order $order         Order.
     * @param bool     $sent_to_admin Admin email.
     * @param bool     $plain_text    Plain text email.
     */
    public function email_instructions($order, $sent_to_admin, $plain_text = false) {
        if ($sent_to_admin || $order->get_payment_method() !== $this->id) {
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

        $address = $this->btc_address ? $this->btc_address : (string) $order->get_meta('_pbv_btc_address');
        $total   = $order->get_formatted_order_total();

        if ($plain_text) {
            echo "\n" . esc_html__('Bitcoin ($BTC) payment', 'palmbeach-vitality') . "\n\n";
            if ($this->instructions) {
                echo esc_html(wp_strip_all_tags($this->instructions)) . "\n\n";
            }
            echo esc_html__('Order total:', 'palmbeach-vitality') . ' ' . esc_html(wp_strip_all_tags($total)) . "\n";
            if ($address) {
                echo esc_html__('BTC address:', 'palmbeach-vitality') . ' ' . esc_html($address) . "\n";
            } else {
                echo esc_html__('We will email your BTC payment address shortly.', 'palmbeach-vitality') . "\n";
            }
            return;
        }

        echo '<div class="pbv-btc-instructions">';
        echo '<h3>' . esc_html__('Bitcoin ($BTC) payment', 'palmbeach-vitality') . '</h3>';
        if ($this->instructions) {
            echo wpautop(wp_kses_post($this->instructions));
        }
        echo '<p><strong>' . esc_html__('Order total:', 'palmbeach-vitality') . '</strong> ' . wp_kses_post($total) . '</p>';
        if ($address) {
            echo '<p><strong>' . esc_html__('BTC address:', 'palmbeach-vitality') . '</strong> ';
            echo '<code class="pbv-btc-instructions__address">' . esc_html($address) . '</code></p>';
        } else {
            echo '<p>' . esc_html__('We will email your BTC payment address shortly.', 'palmbeach-vitality') . '</p>';
        }
        echo '</div>';
    }
}
