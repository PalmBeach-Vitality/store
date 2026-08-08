# Palm Beach Vitality (Store)

A fully static, multi-page website (HTML + Tailwind CSS via CDN + a little vanilla JS) for the `www.palmbeach-vitality.store` domain, plus a **Shopify → WooCommerce migration kit** under `woocommerce-migration/`.

## #1 GOAL: SEO OPTIMIZATION

**Primary mission for this agent:** get `palmbeach-vitality.store` ranking — indexation health, technical SEO, product/category discoverability, schema, sitemaps, crawl budget, and on-page SEO that does **not** require redesigning the site.

### SEO operating rules
- Prefer **canonical WooCommerce URLs only** (`/product/.../`, `/shop/`, `/product-category/.../`). Do **not** market or depend on old Shopify `/products/`, `/collections/`, `/cdn/shop/` URLs.
- Do **not** change images, banners, visible marketing copy, or visual layout unless the user explicitly asks.
- Cart, checkout, contact, and menu changes require **explicit authorization** first.
- Do **not** touch warning-label images.
- Theme SEO work lives in `woocommerce-migration/theme/palmbeach-vitality/` (especially `inc/seo.php`). Ship via theme zip + WP upload.
- There is **no Google Search Console / Analytics / Ahrefs / Semrush MCP** in this environment. Use live HTTP checks, sitemap/robots inspection, theme code, and user-exported GSC CSVs. Ask the user to run GSC “Request indexing” / Validate when needed.
- Plan file: `woocommerce-migration/SEO-PLAN.md`.

## Cursor Cloud specific instructions

### Scope (do not cross)
- **This agent / this repo is ONLY for `www.palmbeach-vitality.store`** (`PalmBeach-Vitality/store`), including the WooCommerce theme under `woocommerce-migration/`.
- **Do NOT edit, push to, or deploy `www.palmbeach-vitality.com`.** That site lives in a separate repo (`PalmBeach-Vitality/pep`) and is handled by a different agent.
- If a request is clearly for vitality.com / the `pep` repo, refuse and tell the user to use the .com agent instead. Do not apply .com product-landing or marketing-page work here by mistake.

- The public site files are **pure static HTML**. There is no build step, no package manager, no `package.json`, and no dependencies to install for those pages. Tailwind is loaded from a CDN at runtime.
- There are **no lint, test, or build commands**. Do not look for them.
- Pages live in per-route folders as `index.html` (e.g. `products/index.html`, `contact/index.html`) plus article pages under `research/`.
- To preview the static site: `python3 -m http.server 8000` from this directory, then browse `http://localhost:8000/`.
- Interactive behavior is plain vanilla JS embedded in each page: the mobile menu toggle and the product category filter on `products/index.html` (filter buttons use `data-filter` matched against each card's `data-category`).
- Editing any `.html` file takes effect on a simple browser refresh — there is no hot-reload/watch process.
- **WooCommerce cannot run in this repo** (no PHP/MySQL). Migration artifacts live in `woocommerce-migration/` (plan, CSV, redirects, WordPress theme). Regenerate the product CSV with `python3 woocommerce-migration/scripts/build-woocommerce-csv.py`.
