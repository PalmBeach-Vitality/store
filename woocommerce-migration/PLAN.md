# Shopify → WooCommerce Migration Plan
**Palm Beach Peptides / palmbeach-vitality.store**

This folder is the migration kit for moving the live Shopify store onto WordPress + WooCommerce while preserving the Palm Beach brand built in this repo.

## Reality check (read first)

| Item | Status |
|------|--------|
| This GitHub repo | Static HTML failover site — **cannot run WooCommerce** |
| Live store today | Shopify at `www.palmbeach-vitality.store` |
| Target platform | WordPress + WooCommerce on PHP/MySQL hosting |
| Shopify admin / API access from this agent | **Not available** (store also rate-limits public JSON) |
| Prices in this kit | **Blank by design** — merge from Shopify export before import |

What this kit delivers now:
1. Full cutover plan + checklist
2. Product catalog JSON + WooCommerce import CSV (17 parents, Size × Form variations)
3. Brand-matched WordPress theme (`theme/palmbeach-peptides/`)
4. Redirect map for common Shopify URL patterns
5. Content page outline matching this static site

What you (Salvatore) must do outside this repo:
- Provision WordPress hosting
- Export data from Shopify Admin
- Configure payments, shipping, taxes, email
- Point DNS after staging QA passes

---

## Phase 0 — Decisions (do these before buying hosting)

1. **Host** — Use managed WordPress with WooCommerce support (WP Engine, Cloudways, Kinsta, SiteGround, or similar). Needs PHP 8.1+, MySQL/MariaDB, SSL, and enough storage for product images/COAs.
2. **Domain strategy** — Keep `palmbeach-vitality.store` / `www`. Staging subdomain first (`staging.palmbeach-vitality.store` or host-provided staging URL).
3. **Theme path** — Use the included `palmbeach-peptides` theme in this kit (recommended), or a lightweight WooCommerce theme + custom CSS. Do **not** try to run the current static site as the shop.
4. **Payments (critical risk)** — Peptide / research-use catalogs are often declined by Stripe/PayPal. Confirm gateway approval **before** cutover. Options typically include: authorized merchant accounts, crypto/ACH specialists, or invoice/manual payment for B2B. Do not assume Shopify’s processor ports automatically.
5. **Wholesale** — Decide: WooCommerce B2B/wholesale plugin vs. “Get Pricing” / application form (current site pattern).

---

## Phase 1 — Export everything from Shopify

In Shopify Admin, export (download CSV/ZIP and keep a dated backup folder):

| Data | Where | Notes |
|------|-------|-------|
| Products | Products → Export (all products, CSV for all languages if applicable) | Source of truth for **prices, SKUs, images, inventory** |
| Customers | Customers → Export | Emails, names, tags, accepts marketing |
| Orders | Orders → Export (all time if possible) | Historical; WooCommerce import of old orders is optional |
| Discounts | Discounts | Recreate manually or with a migration tool |
| Pages / blog | Online Store → Pages / Blog posts | Copy into WP Pages / Posts |
| Redirects | Navigation / URL redirects | Feed into WP redirect plugin |
| Theme assets | Files / theme customizer | Logos, banners, COA PDFs |
| Apps list | Settings → Apps | Note each app’s WooCommerce equivalent |

Also take screenshots of: shipping zones/rates, tax settings, checkout fields, notification email templates, and payment methods.

**Preferred automated path (optional):** Cart2Cart, LitExtension, or similar Shopify→WooCommerce migrator after staging WP is up. Still keep native Shopify CSVs as backup.

---

## Phase 2 — Stand up WordPress + WooCommerce (staging)

1. Install WordPress on staging.
2. Install and activate **WooCommerce**; run the setup wizard (currency USD, address, shipping basics).
3. Install permalinks: **Settings → Permalinks → Post name**.
4. Upload and activate theme from `woocommerce-migration/theme/palmbeach-peptides/` (zip the theme folder).
5. Create pages WooCommerce needs (Shop, Cart, Checkout, My Account) — wizard usually does this.
6. Create content pages matching this site: About, Research, FAQ, Wholesale, Contact.
7. Install essentials only:
   - Redirects (Redirection or Rank Math)
   - SMTP (so order emails deliver)
   - Backup (UpdraftPlus or host backups)
   - Security (host WAF + limited login)
   - Image optimization if needed
8. Do **not** pile on 20 plugins on day one.

---

## Phase 3 — Import catalog

### Path A (recommended for accuracy)
1. Take Shopify product CSV as master for SKU, price, inventory, image URLs.
2. Use a migrator **or** WooCommerce Product CSV Import Suite / built-in importer after mapping columns.
3. Verify each variable product (Size + Form) has correct variations and stock.

### Path B (use this kit as scaffold)
1. Open `data/products-woocommerce.csv`.
2. Merge **Regular price** (and stock/images) from Shopify export into matching SKUs / product names.
3. WooCommerce → Products → Import → upload CSV.
4. Manually attach images and COA downloads after import.

Catalog in this kit (from the static site):
- Growth Factors: BPC-157, TB-500, GHK-Cu
- Metabolic: Semaglutide, Tirzepatide, Retatrutide, AOD-9604
- Cognitive: Semax, Selank
- Hormonal: Ipamorelin, CJC-1295 (DAC), Tesamorelin
- Immune: KPV, NAD+
- Stacks: Wolverine, GLOW, KLOW

Regenerate CSV anytime:
```bash
python3 woocommerce-migration/scripts/build-woocommerce-csv.py
```

---

## Phase 4 — Customers, wholesale, content

1. Import customers (CSV or migrator). Force password reset emails — Shopify passwords do not transfer.
2. Recreate wholesale flow (role/pricing plugin **or** application form → manual account approval).
3. Port Research articles from `research/*.html` into WP posts/pages.
4. Port FAQ, About, Contact, Wholesale copy from this repo.
5. Add site-wide research-use-only disclaimer (footer + product templates already wired in the theme).

---

## Phase 5 — Commerce configuration

1. **Payments** — Enable only approved gateways; test in sandbox then live with a $1 product.
2. **Shipping** — Recreate zones/rates; cold-chain or special packaging notes if applicable.
3. **Tax** — Match Shopify tax regions; enable automated tax if using a tax plugin.
4. **Emails** — Configure SMTP; place test orders; check spam folders.
5. **Legal** — Privacy, Terms, Refund, Research-use policy pages; link in checkout footer.
6. **Inventory** — Confirm stock sync after import; set low-stock notifications.

---

## Phase 6 — SEO & redirects

1. Install redirect plugin; import `data/redirects.csv`.
2. After Shopify export of URL redirects, add any custom paths not in the starter map.
3. Typical Shopify patterns → WooCommerce:
   - `/products/{handle}` → `/product/{slug}/`
   - `/collections/{handle}` → `/product-category/{slug}/` or `/shop/`
   - `/pages/{handle}` → `/{slug}/`
   - `/cart` → `/cart/`
   - `/account` → `/my-account/`
4. Submit updated sitemap in Google Search Console after go-live.
5. Keep Shopify on a temporary redirect period if possible (or use Cloudflare/DNS-level redirects) so old links do not 404.

---

## Phase 7 — Staging QA (must pass before DNS)

- [ ] Homepage brand matches Palm Beach look (navy/teal/sand)
- [ ] Shop + category filters work
- [ ] Every product opens; variations selectable; Add to Cart works
- [ ] Cart → Checkout → paid test order completes
- [ ] Order email + admin notification received
- [ ] Mobile menu + mobile checkout
- [ ] Wholesale / contact forms submit
- [ ] Research + FAQ pages load
- [ ] SSL padlock; no mixed content
- [ ] Redirect sample of top Shopify URLs
- [ ] Disclaimer visible on product + footer

---

## Phase 8 — Go-live cutover

1. Put Shopify in password / maintenance mode (or disable storefront) right before DNS change.
2. Final product/price/inventory sync from Shopify → WooCommerce.
3. Point DNS:
   - `www` → WooCommerce host (CNAME or A as host instructs)
   - Apex `@` → same host A/AAAA records
4. Remove or ignore this repo’s GitHub Pages `CNAME` for live traffic (Pages becomes backup only again, or retire it).
5. Force HTTPS on WordPress; update Site URL if needed (`wp-config` or Settings → General).
6. Place one real low-value order yourself.
7. Monitor 24–48h: emails, failed payments, 404s, Search Console.
8. Keep Shopify subscription active briefly as rollback until stable.

### Rollback
If WooCommerce fails badly: repoint DNS to Shopify (previous A/CNAME values). Keep Shopify unpublished theme/password until you intentionally shut it down.

---

## What “done” looks like

- Customers buy on WooCommerce at `www.palmbeach-vitality.store`
- Catalog, pricing, and stock match pre-migration Shopify
- Brand theme live; research/content pages live
- Redirects preserve SEO equity
- Shopify no longer primary storefront

---

## Files in this kit

```
woocommerce-migration/
  PLAN.md                          ← this file
  CHECKLIST.md                     ← printable execution checklist
  WORDPRESS-COM-NEXT-STEPS.md      ← step-by-step for salvatorejohnson1984-eqvrh.wordpress.com
  SHOPIFY-EXPORT.md                ← exact Shopify Admin export clicks
  palmbeach-peptides-theme.zip     ← uploadable theme for Appearance → Themes
  data/
    products-catalog.json          ← structured catalog source
    products-woocommerce.csv       ← WooCommerce importer CSV (prices blank)
    redirects.csv                  ← starter Shopify → WC redirects
  scripts/
    build-woocommerce-csv.py       ← regenerates the CSV
  theme/
    palmbeach-peptides/            ← WordPress + WooCommerce theme (source)
```

**Active WordPress.com site:** https://salvatorejohnson1984-eqvrh.wordpress.com — follow `WORDPRESS-COM-NEXT-STEPS.md` next.