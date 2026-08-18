# n8n — welcome discount email (WELCOME20)

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

## Suggested n8n workflow

1. **Webhook** node — Method `POST`, path e.g. `pbv-welcome-discount`. Copy the Production URL.
2. **Email Send** (Gmail / SMTP / ImprovMX / whatever you use)  
   - To: `{{$json.email}}`  
   - Subject: `Your {{$json.discount_percent}}% welcome code — Palm Beach Vitality`  
   - Body: include `{{$json.coupon_code}}` and link to `https://palmbeach-vitality.store/checkout/` (or shop).
3. Optional: **IF** `optin` is true → add contact to your list.
4. Respond **200** quickly so the storefront popup succeeds.

## Wire it to WordPress

1. Upload theme **v2.10.29+**.
2. Appearance → Customize → **Palm Beach Storefront** → paste the n8n Production webhook URL into **n8n webhook — welcome discount email**.
3. Publish.

If the webhook field is empty, WordPress emails `WELCOME20` to the customer itself (sales@ as From).

## Checkout

Coupon **WELCOME20** is created automatically (20%, new clients / first order only). Shoppers enter it in the normal WooCommerce coupon box at checkout.
