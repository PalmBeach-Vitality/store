# Bitcoin ($BTC) checkout — recommendation

Goal: make paying with **$BTC** as easy as possible on `palmbeach-vitality.store`.

## Recommendation: **Coinsnap for WooCommerce** (best fit)

**Use Coinsnap** as the primary Bitcoin checkout provider.

| Factor | Coinsnap |
|--------|----------|
| Ease of setup | ~10 minutes; WordPress plugin + email + Lightning address |
| Customer experience | Bitcoin **on-chain + Lightning**, QR pay from any major wallet |
| Custody | Non-custodial — funds go to **your** wallet |
| Fees | No Coinsnap processing fee for BTC/LN payouts |
| KYC | Not required for BTC/Lightning payouts |
| WooCommerce | Official plugin: [coinsnap-for-woocommerce](https://wordpress.org/plugins/coinsnap-for-woocommerce/) |
| Docs | [WooCommerce setup guide](https://coinsnap.io/shop-systems/woocommerce/) |

### Why Coinsnap over the alternatives

1. **BTCPay Server** — Best if you want full self-hosting and 0% forever, but you must run a server/node. Higher ops burden; slower to go live.
2. **BitPay / CoinGate / OpenNode** — Solid, but custodial or hybrid, KYC, and ~1% fees. More friction for a small research-supply store.
3. **Coinbase Commerce** — Brand recognition, but WooCommerce plugin maintenance/compatibility has been uneven; not the easiest path in 2026.
4. **Theme manual gateway (already added)** — Shows **Bitcoin ($BTC)** on checkout immediately and collects orders as on-hold with payment instructions. Use this until Coinsnap is connected, or keep it as a backup.

**Bottom line for “easiest for customers + easiest for you”:** install **Coinsnap**, connect a Lightning wallet, enable the payment method. Customers scan a QR and pay in seconds via Lightning (with on-chain fallback).

## What this theme already adds (v2.10.8)

Theme payment method: **Bitcoin ($BTC)** (`pbv_bitcoin`)

1. Upload/replace `palmbeach-vitality-theme.zip` (v2.10.8+)
2. WooCommerce → Settings → Payments → **Bitcoin ($BTC)** → Enable
3. Paste your **BTC receiving address** (optional until Coinsnap is live)
4. Save

Orders paid this way are set to **On hold** until you confirm the BTC payment and mark the order Processing/Completed.

## Coinsnap go-live steps (recommended)

1. Create a free account at [app.coinsnap.io](https://app.coinsnap.io/)
2. Connect a Lightning wallet / Lightning address
3. Copy **Store ID** + **API Key**
4. WP Admin → Plugins → Add New → search **Coinsnap for WooCommerce** → Install → Activate  
   (WordPress.com: use a plan that allows plugin install, or upload the plugin zip)
5. WooCommerce → Settings → Coinsnap → paste Store ID + API Key
6. WooCommerce → Settings → Payments → enable **Coinsnap**
7. Place a small test order and pay with Lightning, then one on-chain test

After Coinsnap works, you can leave the theme **Bitcoin ($BTC)** method enabled as a backup or disable it to avoid two BTC options.

## Wallet tip (customer ease)

Lightning makes checkout feel instant. Any Lightning-ready wallet works for receiving (e.g. Wallet of Satoshi, Phoenix, Muun, or a Lightning address from your exchange/wallet provider). Customers with only on-chain BTC can still pay via Coinsnap’s on-chain option.
