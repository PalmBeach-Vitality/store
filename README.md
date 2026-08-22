# Palm Beach Vitality .COM

B2b Brand (wholesale)

## Brand
**Palm Beach Vitality** — Precision. Purity. Palm Beach Made.

Premium American-made peptides for researchers, clinics, and B2B brands.

## Menu Options (matches request)
- **Products** — Full catalog with filters (Growth Factors, Metabolic, Cognitive, Hormonal, Immune, Stacks)
- **About** — Company story, manufacturing standards, timeline, principles
- **Research** — Research library with guides
- **Protocols** — Interactive dosage / reconstitution calculator for catalog peptides
- **FAQ** — Comprehensive frequently asked questions
- **Wholesale** — B2B program benefits + application form
- **Contact** — Contact form + dedicated Get Pricing section
- **Get Pricing** — Prominent CTA button throughout (links to contact#pricing)

## Design Inspiration from ecwlw.com
- Clean, clinical, trustworthy aesthetic
- Hero with "Precision. Purity. [Brand] Made."
- Featured compounds cards (BPC-157, Semaglutide, Semax, etc.)
- Why Us stats (99%+ purity, USA made, COA, B2B)
- Research library teaser
- Wholesale partner section
- Mailing list signup
- Strong research-use-only disclaimers
- Trust badges and professional B2B focus

## Color Palette
- Deep Navy (`#0A1628`) for authority & trust
- Teal accents (`#0D9488` / `#2DD4BF`) for purity & science
- Soft sand/cream backgrounds for warmth (Palm Beach vibe)
- Gold accents sparingly for premium feel
- Clean white cards

## Purpose
1. **Static brand / content reference** for Palm Beach Peptides (HTML pages in this repo).
2. **Shopify → WooCommerce migration kit** in [`woocommerce-migration/`](woocommerce-migration/PLAN.md) — plan, checklist, product CSV, redirects, and a WordPress theme.
3. **Emergency failover** — GitHub Pages standby if the commerce host is down (domain normally should point at WooCommerce after cutover, not this repo).

### Shopify → WooCommerce (primary path)
Start here: **[`woocommerce-migration/PLAN.md`](woocommerce-migration/PLAN.md)** and **[`woocommerce-migration/CHECKLIST.md`](woocommerce-migration/CHECKLIST.md)**.

This static repo cannot run WooCommerce. You need WordPress hosting. The kit provides:
- WooCommerce product import CSV (`woocommerce-migration/data/products-woocommerce.csv`) — **merge Shopify prices before import**
- Starter redirects (`woocommerce-migration/data/redirects.csv`)
- Theme: `woocommerce-migration/theme/palmbeach-peptides/`

### Go-live (static failover only)
If you need this GitHub Pages backup while commerce is down:
1. Enable Pages: repo Settings → Pages → Source "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save.
2. Repoint DNS at your registrar to GitHub Pages:
   - Apex `palmbeach-vitality.store` → A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` → CNAME `palmbeach-vitality.github.io`
3. Confirm custom domain `www.palmbeach-vitality.store` verifies and "Enforce HTTPS" is enabled.

### Preview without touching the domain
Temporarily delete the `CNAME` file, enable Pages, browse `https://palmbeach-vitality.github.io/store/`.

## How to View (locally)
Simply open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge), or serve the folder: `python3 -m http.server 8000` then browse `http://localhost:8000/`.

All pages are fully linked and mobile-responsive. No build step required (uses Tailwind CDN).

## Tech
- Pure HTML + Tailwind CSS (via CDN)
- Inter + Playfair Display fonts
- Vanilla JS for mobile menu, product filters, and the protocol calculator
- Fully static — ready for Netlify, Vercel, GitHub Pages, or any host

## Customization Notes
- Replace placeholder forms with real backend (Formspree, Netlify Forms, etc.)
- Add real product images / COA PDFs later
- Update contact email / phone when ready
- Expand research library articles as content is written

Built for Salvatore / Palm Beach Peptides project.
