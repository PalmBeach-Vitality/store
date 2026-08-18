# n8n — welcome discount email (WELCOME20)

Workflow name: **`Vitality.store_email_webhook`**

Importable JSON: [`n8n/Vitality.store_email_webhook.json`](./n8n/Vitality.store_email_webhook.json)

The Palm Beach theme POSTs JSON to your n8n webhook when someone enters their email in the homepage popup.

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

## Import + activate

1. n8n → **Workflows → Import from File** → choose `Vitality.store_email_webhook.json`
2. Open node **Email WELCOME20** → select your Gmail (or swap to SMTP) credential
3. **Activate** the workflow
4. Open **Welcome discount webhook** → copy the **Production** URL  
   (path ends with `/webhook/vitality-store-email-webhook`)
5. On WordPress: Appearance → Customize → **Palm Beach Storefront** → paste into **n8n webhook — welcome discount email** → Publish

## Flow (in the JSON)

1. **Webhook** `POST` path `vitality-store-email-webhook`
2. **Code** — normalize email / coupon / HTML body
3. **Gmail** — send WELCOME20 to the shopper (Reply-To sales@)
4. **Respond to Webhook** — `{ ok: true, email, coupon_code }`

If the Customizer webhook field is empty, WordPress emails `WELCOME20` itself as a fallback.

## Checkout

Coupon **WELCOME20** is created automatically by the theme (20%, new clients / first order only).
