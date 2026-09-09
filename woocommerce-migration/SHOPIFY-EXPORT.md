# Exact Shopify export steps

Do these in **Shopify Admin** before importing into WooCommerce. Save everything in a dated folder (e.g. `shopify-export-2026-07-28/`).

## Products (required)
1. Products → **Export**
2. Select **All products**
3. Choose **CSV for Excel, Numbers, or other spreadsheet programs**
4. Export → download email/link when ready
5. Keep this file as the **price / SKU / inventory / image** source of truth

## Customers
1. Customers → **Export**
2. All customers, CSV
3. After WooCommerce import, send password-reset emails (Shopify passwords do not transfer)

## Orders (optional historical)
1. Orders → **Export**
2. Export transactions / orders for your needed date range
3. Historical orders are nice-to-have; not required for selling on day one

## URL redirects
1. Online Store → Navigation → **URL redirects** (or Settings → Apps/Sales channels → URL redirects, depending on Shopify version)
2. Export or copy all rows
3. Merge into WooCommerce redirect plugin along with `data/redirects.csv`

## Files / images / COAs
1. Content → **Files** (or Settings → Files)
2. Download logos, banners, COA PDFs
3. Re-upload to WordPress Media Library

## Settings screenshots (do not skip)
Photograph or PDF these screens so you can recreate them in WooCommerce:
- Settings → Shipping
- Settings → Taxes
- Settings → Payments (note which processors — **peptide catalogs often need special approval**)
- Settings → Checkout fields
- Settings → Notifications (order confirmation templates)
- Any wholesale / B2B app configuration

## Apps inventory
Settings → Apps and sales channels → list every app and its WooCommerce replacement (SMTP, subscriptions, upsells, reviews, etc.).
