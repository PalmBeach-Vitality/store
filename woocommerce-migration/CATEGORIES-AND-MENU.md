# Categories + menu (4 shop groups)

Split the catalog into:

1. **Peptides**
2. **Peptide Pens**
3. **Weight Loss**
4. **Weight Loss Pens**

## A. Re-import categories (do this first)

1. Download:  
   https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/data/products-update-categories.csv
2. **Products → Import**
3. Upload that CSV
4. Check **Update existing products**
5. Map **Categories** → Categories, **SKU** → SKU, **Regular price** → Regular price
6. Run importer

You should get four categories under **Products → Categories**.

## B. Upload the updated theme

1. Download:  
   https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/palmbeach-vitality-theme.zip
2. **Appearance → Themes → Add New → Upload**
3. Upload zip → when asked, **Replace current with uploaded**
4. Keep **Palm Beach Vitality** activated

Homepage now shows:
- Photo hero
- Four collection tiles (Peptides / Peptide Pens / Weight Loss / Weight Loss Pens)
- Featured products

Menu fallback also lists those four groups.

## C. Set the WordPress menu (so it sticks)

1. **Appearance → Menus**
2. Create menu **Primary**
3. Add these items (Product categories + pages):
   - Peptides
   - Peptide Pens
   - Weight Loss
   - Weight Loss Pens
   - Telehealth (`/telehealth/`)
   - Wholesale (`/wholesale/`)
   - FAQ (`/faq/`)
   - Contact (`/contact/`)
4. Check **Primary Menu** location → Save

### Create missing pages
**Pages → Add New** for any that don’t exist yet:
- FAQ
- Wholesale
- Contact
- **Telehealth** (new — create this if missing)

You can paste copy later; empty published pages are fine for now so menu links don’t 404.

## D. If a category tile 404s

Create it manually: **Products → Categories → Add** with these slugs:
- `peptides`
- `peptide-pens`
- `weight-loss`
- `weight-loss-pens`

Then re-run the category CSV update (step A).
