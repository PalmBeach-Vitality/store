# Your SEO tasks (after uploading the new theme)

Upload the latest theme zip first, then work through this list.

## 1) Upload theme
Replace the theme with the latest `palmbeach-vitality-theme.zip` from the PR branch.

Confirm in page source or `style.css` header that version is **2.10.20+**.

## 2) Google Search Console
1. Sitemap already submitted — leave it.
2. **URL Inspection** → Request indexing for canonical URLs only (`/product/.../`, never `/products/...`):
   - Home, Shop (if not already done)
   - `/product-category/peptides/`
   - `/product-category/peptide-pens/`
   - `/product-category/weight-loss/`
   - `/product-category/weight-loss-pens/`
   - Top 10–15 products
3. Over the next week, ignore optional `review` / `aggregateRating` warnings (no reviews until FDA).

## 3) Replace About page placeholder (WP Admin)
Pages → About → replace the default “This is an example of a page…” content with:

---

Palm Beach Vitality supplies research-use peptides and peptide pens for laboratory and scientific research.

We focus on documented quality: third-party testing, Certificates of Analysis (COAs), and careful cold-pack fulfillment so research materials arrive with integrity intact.

All products are intended strictly for research purposes only. They are not for human or veterinary use and are not sold as drugs, supplements, or cosmetics.

For wholesale inquiries, visit our Wholesale page or contact our team.

---

Then Update. (Optional: set a featured image later — not required for SEO.)

## 3) About page SEO fields (Jetpack / page SEO box)
If About still shows a Shop title in Google preview, open **Pages → About** and set:

- **SEO title:** `About Palm Beach Vitality | Research Peptides`
- **SEO description:** `Palm Beach Vitality supplies research-use peptides and peptide pens with COAs, third-party testing, and cold-pack shipping. Lab use only.`

Or clear those fields — theme v2.10.21+ supplies correct About meta automatically.

## 4) Marketing / ads / social
Use only:
- `https://palmbeach-vitality.store/product/{slug}/`
- category URLs under `/product-category/.../`

Do **not** use old Shopify `/products/` or `/collections/` links.

## 5) Ops note (not SEO, but trust)
Checkout shipping still needs to calculate correctly ($35 cold-pack). That’s a WooCommerce shipping setting — separate from this theme SEO zip.

## Done when
- Theme version shows 2.10.20+
- About no longer has WordPress placeholder copy
- Key categories + top products requested for indexing
- External links all use `/product/` canonicals
