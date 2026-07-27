# Palm Beach Peptides Website

A modern, professional multi-page website designed to closely match the structure, tone, and features of [East Coast Peptides (ecwlw.com)](https://ecwlw.com/).

## Brand
**Palm Beach Peptides** — Precision. Purity. Palm Beach Made.

Premium American-made peptides for researchers, clinics, and B2B brands.

## Menu Options (matches request)
- **Products** — Full catalog with filters (Growth Factors, Metabolic, Cognitive, Hormonal, Immune, Stacks)
- **About** — Company story, manufacturing standards, timeline, principles
- **Research** — Research library with guides
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

## Purpose: Backup / failover site
This repository is a **standby copy** of the site for `www.palmbeach-vitality.store`, kept in case the primary store (Shopify) becomes unavailable. It is intentionally **not published live** — the domain still points to Shopify. The `CNAME` file already contains `www.palmbeach-vitality.store` so that going live later is only a DNS change.

### Go-live (failover) runbook
If you need to switch this domain over to this GitHub Pages backup:
1. Enable Pages: repo Settings → Pages → Source "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save.
2. Repoint DNS at your registrar from Shopify to GitHub Pages:
   - Apex `palmbeach-vitality.store` → A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` → CNAME `palmbeach-vitality.github.io`
3. In Settings → Pages, confirm the custom domain `www.palmbeach-vitality.store` verifies and "Enforce HTTPS" is enabled (may take a few minutes).

### Preview without touching the domain
To preview the backup on GitHub's own URL without any DNS change, temporarily delete the `CNAME` file, enable Pages (step 1 above), and browse `https://palmbeach-vitality.github.io/store/`.

## How to View (locally)
Simply open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge), or serve the folder: `python3 -m http.server 8000` then browse `http://localhost:8000/`.

All pages are fully linked and mobile-responsive. No build step required (uses Tailwind CDN).

## Tech
- Pure HTML + Tailwind CSS (via CDN)
- Inter + Playfair Display fonts
- Vanilla JS for mobile menu + product filters
- Fully static — ready for Netlify, Vercel, GitHub Pages, or any host

## Customization Notes
- Replace placeholder forms with real backend (Formspree, Netlify Forms, etc.)
- Add real product images / COA PDFs later
- Update contact email / phone when ready
- Expand research library articles as content is written

Built for Salvatore / Palm Beach Peptides project.
