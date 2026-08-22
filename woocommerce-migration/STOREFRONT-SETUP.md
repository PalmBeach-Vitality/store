# Storefront setup — menus, categories, terms

## After uploading theme v2.4.0

1. **Appearance → Themes → Upload** the zip → **Replace current**
2. Visit the homepage once (theme seeds pages + Primary menu automatically)
3. Hard-refresh

### What the theme creates automatically
- Pages: `/terms/`, `/wholesale/`, `/contact/`, `/telehealth/`, `/faq/`
- Product categories: Peptides, Peptide Pens, Weight Loss, Weight Loss Pens
- **Primary** menu assigned with working links:
  - Most Popular → Shop
  - Peptides / Peptide Pens / Weight Loss / Weight Loss Pens → category archives
  - Wholesale / Contact Us / Telehealth → pages
- Footer **Terms and Conditions** → `/terms/`
- Homepage no longer shows a product grid (hero + FAQ only)

## Put products into each menu category

Menu category links only show products after categories are assigned.

1. Download:  
   https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/data/products-update-categories.csv
2. **Products → Import**
3. Upload CSV
4. Check **Update existing products**
5. Map:
   - SKU → SKU
   - Categories → Categories
   - Regular price → Regular price
   - Name → Name (optional)
6. Run importer

Expected counts:
- Peptide Pens ~20
- Weight Loss Pens ~17
- Weight Loss ~7
- Peptides ~6

Then click each menu item — you should see that category’s products.

## If a category link 404s

**Settings → Permalinks → Save** (Post name), then re-visit.

Or create categories manually under **Products → Categories** with slugs:
- `peptides`
- `peptide-pens`
- `weight-loss`
- `weight-loss-pens`
