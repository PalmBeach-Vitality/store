# n8n — welcome discount email (WELCOME20)

Workflow name: **`Vitality.store_email_webhook`**

| | |
|---|---|
| n8n workflow | `Vitality.store_email_webhook` (id `zzB1jno5x9QW1UCr`) |
| Status | **Active** |
| Production webhook | `https://stockjohnson.app.n8n.cloud/webhook/vitality-store-email-webhook` |
| Importable JSON | [`n8n/Vitality.store_email_webhook.json`](./n8n/Vitality.store_email_webhook.json) |

The Palm Beach theme POSTs JSON to this webhook when someone enters their email in the homepage popup.

## Webhook payload

```json
{
  "email": "customer@example.com",
  "optin": true,
  "coupon_code": "WELCOME20",
  "discount_percent": 20,
  "site": "https://palmbeach-vitality.store/",
  "source": "homepage_lead_popup",
  "submitted_at": "2026-08-18T00:00:00+00:00"
}
```

## Wire to WordPress (Customizer)

1. Upload theme **v2.10.29+** on [palmbeach-vitality.store](https://palmbeach-vitality.store)
2. Appearance → Customize → **Palm Beach Storefront**
3. Paste into **n8n webhook — welcome discount email**:

```
https://stockjohnson.app.n8n.cloud/webhook/vitality-store-email-webhook
```

4. Publish → test the homepage popup

## Flow

1. **Webhook** `POST` `/webhook/vitality-store-email-webhook`
2. **Code** — normalize email / coupon / HTML body
3. **Gmail** (`Gmail account`) — send WELCOME20 (Reply-To sales@palmbeach-vitality.com)
4. **Respond to Webhook** — `{ ok: true, email, coupon_code }`

If the Customizer webhook field is empty, WordPress emails `WELCOME20` itself as a fallback.

## Checkout

Coupon **WELCOME20** is created automatically by the theme (20%, new clients / first order only).
