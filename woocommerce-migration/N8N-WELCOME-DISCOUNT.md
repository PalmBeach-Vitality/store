# n8n — intro email (subscribe popup)

Workflow name: **`Vitality.store_email_webhook`**

| | |
|---|---|
| n8n workflow | `Vitality.store_email_webhook` (id `zzB1jno5x9QW1UCr`) |
| Status | **Active** |
| Production webhook | `https://stockjohnson.app.n8n.cloud/webhook/vitality-store-email-webhook` |
| Importable JSON | [`n8n/Vitality.store_email_webhook.json`](./n8n/Vitality.store_email_webhook.json) |

Homepage popup: **Subscribe for updates and discounts** → branded intro email (store logo, inner-circle layout).

`WELCOME20` stays a valid WooCommerce coupon (new clients, 1 use, stacks with `AS-1010`). It is **not** in the storefront banner. The intro email lists it as a subscriber bullet with **WELCOME20** in bold.

Popup signups are also stored in **WP Admin → Email list** and synced to **MailPoet** when that plugin is active. See [`MAILPOET-MONTHLY.md`](./MAILPOET-MONTHLY.md).

## Normalize lead (n8n)

Subscribe webhook → **Normalize lead** → Email intro

Map `coupon_code` and `coupon_percent` from the WordPress webhook body. If either is missing, the Code node fails — do not hardcode a fallback code.

## Webhook payload

```json
{
  "email": "customer@example.com",
  "optin": true,
  "site": "https://palmbeach-vitality.store/",
  "shop_url": "https://palmbeach-vitality.store/shop/",
  "logo_url": "https://palmbeach-vitality.store/wp-content/themes/palmbeach-vitality/assets/images/logo-full.jpg",
  "bg_url": "https://palmbeach-vitality.store/wp-content/themes/palmbeach-vitality/assets/images/email-intro-bg.jpg",
  "coupon_code": "WELCOME20",
  "coupon_percent": 20,
  "source": "homepage_subscribe_popup",
  "email_type": "intro",
  "submitted_at": "2026-08-19T00:00:00+00:00"
}
```

## WordPress Customizer

Appearance → Customize → **n8n webhook — welcome discount email**:

```
https://stockjohnson.app.n8n.cloud/webhook/vitality-store-email-webhook
```
