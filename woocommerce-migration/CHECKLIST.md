# Shopify → WooCommerce Checklist

Print or keep open during cutover. Check items only when verified.

## A. Pre-flight
- [ ] WordPress staging provisioned (PHP 8.1+, SSL, backups on)
- [ ] WooCommerce installed + currency USD
- [ ] Permalinks = Post name
- [ ] `palmbeach-peptides` theme uploaded and activated
- [ ] Payment gateway **approved** for this catalog (do not skip)
- [ ] Shopify full export saved: products, customers, orders, redirects, files

## B. Catalog
- [ ] Shopify product CSV archived with date
- [ ] Prices / SKUs / stock merged into WooCommerce import (kit CSV has blank prices)
- [ ] Products imported; 17 parents present
- [ ] Variations (Size + Form) selectable on PDP
- [ ] Images attached
- [ ] Categories: Growth Factors, Metabolic, Cognitive, Hormonal, Immune, Stacks
- [ ] Research-use disclaimer on product pages

## C. Storefront pages
- [ ] Home
- [ ] Shop
- [ ] Cart / Checkout / My Account
- [ ] About
- [ ] Research (+ articles)
- [ ] FAQ
- [ ] Wholesale
- [ ] Contact (+ pricing CTA)
- [ ] Privacy / Terms / Refund / Research-use policy

## D. Commerce
- [ ] Shipping zones/rates match Shopify
- [ ] Tax settings verified
- [ ] SMTP sending; test order emails arrive
- [ ] Test paid order succeeds end-to-end
- [ ] Failed/cancelled payment behavior OK
- [ ] Wholesale path works (plugin or form)

## E. Customers & SEO
- [ ] Customers imported
- [ ] Password-reset flow tested
- [ ] `redirects.csv` imported; spot-check top URLs
- [ ] Extra Shopify redirects added
- [ ] XML sitemap reachable

## F. Go-live
- [ ] Final inventory/price sync from Shopify
- [ ] Shopify storefront password / paused
- [ ] DNS pointed to WooCommerce host
- [ ] Site URL + HTTPS correct
- [ ] Live test order placed
- [ ] Search Console sitemap resubmitted
- [ ] Monitor 48h (404s, payments, email)
- [ ] Shopify kept as rollback until stable, then cancel when ready

## Rollback trigger
If checkout broken or payments failing after cutover → repoint DNS to Shopify immediately; fix on staging; retry.
