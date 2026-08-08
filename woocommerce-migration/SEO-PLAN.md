# SEO Plan — palmbeach-vitality.store

**#1 GOAL:** SEO optimization → indexation + ranking for the WooCommerce storefront.

**Domain:** `https://palmbeach-vitality.store` (apex canonical; `www` 301s here)  
**Theme work:** `woocommerce-migration/theme/palmbeach-vitality/` → ship zip → WP upload  
**Do not use** old Shopify `/products/`, `/collections/`, `/cdn/shop/` URLs in marketing.

---

## Tools available (this environment)

| Tool | Available? | Use |
|---|---|---|
| Google Search Console MCP | **No** | User exports CSVs / runs Request indexing |
| Google Analytics MCP | **No** | — |
| Ahrefs / Semrush / Moz | **No** | — |
| Live HTTP crawl (curl) | **Yes** | robots, sitemap, titles, meta, schema, status codes |
| Theme / PHP SEO (`inc/seo.php`) | **Yes** | robots, redirects, schema, meta, sitemap filters |
| GSC CSV uploads from user | **Yes** | Issue triage |
| Cursor Cloud agent scrape | **Yes** | Coordinate with other store agents |
| Gmail MCP | Yes (not SEO-specific) | — |

---

## Other store agents (scraped 2026-08-08)

| Agent | Status | SEO relevance |
|---|---|---|
| **vitality.store SEO** (this) `cursor/shopify-to-woocommerce-c0c9` PR #1 | RUNNING | Technical SEO + product research content |
| **Woocommerce checkout process** `…-updates-3232` PR #4 | IDLE | Theme v2.10.8–2.10.15 checkout/BTC/hero/research — **overlap risk on same theme files**; avoid fighting hero/announcement without sync |
| **Browse live WooCommerce checkout** | IDLE | No code. Found **shipping missing at checkout** (ops issue, not SEO) |
| **Video Generation** PR #2/#3 | IDLE | Marketing/n8n only — **no on-site SEO**; do not merge “DO NOT MERGE” PR into site SEO work |
| Screenshot / usage-banner helpers | IDLE | No SEO impact |

**Note:** Agent list is scoped to the **store** repo. The `.com` / `pep` agent is out of scope here.

**Critical deploy lag:** Live `style.css` still reports **Theme Version 2.10.6**. SEO fixes from v2.10.17/2.10.18 are **not live** until the theme zip is uploaded.

---

## Baseline audit (live, pre-upload)

- Homepage: H1 OK; **no meta description**; **no canonical**
- `/shop/`: **no meta description**; **no canonical**
- Categories: thin/auto meta; often **no canonical**
- Products: canonical OK; meta description still **“Research-use peptide vial…”** junk
- `/about/`: meta description is **WordPress placeholder** copy (bad)
- robots.txt: basic Woo rules only (junk blockers from v2.10.18 not live yet)
- Sitemap includes transactional pages until v2.10.18 filters are live

---

## Phased plan

### Phase A — Ship what we already built (user action)
1. Upload latest theme zip (**≥ 2.10.18**, then newer as we ship).
2. GSC: resubmit `sitemap.xml`.
3. GSC: Request indexing for home, shop, 4 categories, top products.
4. Validate prior GSC rows (404s / redirects / crawled-not-indexed) after recrawl.

### Phase B — Technical SEO (theme; no visual redesign) ← shipped through v2.10.20
1. Meta descriptions for home, shop, categories, products (not RUO short-line).
2. Self-canonical tags on home/shop/archives when missing.
3. Keep junk blocked (API, feeds, Shopify CDN) + policy/collection 301s.
4. Merchant schema: shippingDetails, validFrom, return policy (no review/aggregateRating).
5. Sitemap hygiene (exclude cart/checkout/account/hello-world).
6. Stronger document titles for home/shop/category/product.
7. Organization + WebSite JSON-LD + basic Open Graph tags.

User-facing checklist after upload: `SEO-YOUR-TASKS.md`.

### Phase C — On-page discoverability (no layout redesign)
1. Unique title patterns for products/categories (tab titles only; not redesign).
2. Ensure internal links use canonical `/product/.../` only.
3. Flag thin/placeholder pages (e.g. About) for **user-approved** copy updates.

### Phase D — Authority / ranking (needs user + off-site)
1. Keep Buffer/Creatomate CTAs pointing at canonical .store URLs (video agent).
2. GSC performance queries → target landing pages.
3. No Shopify URL campaigns.

### Out of scope without authorization
- Cart / checkout / contact / menu UI
- Images, banners, visible marketing copy, warning labels
- Payment/shipping Woo admin settings (checkout agent / site admin)

---

## Success metrics
- Indexed pages rise; junk exclusions stay excluded
- Merchant listing schema warnings drop
- Money URLs (home, shop, categories, products) return 200 + canonical + useful meta
- Impressions/clicks for brand + product-name queries trend up in GSC (user-shared)
