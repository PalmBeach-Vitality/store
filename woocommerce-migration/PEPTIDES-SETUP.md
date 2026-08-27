# Peptides — missing products are likely Private

**Missing images on Peptides?** Import  
`data/products-peptides-images-UPDATE.csv`  
(see `PEPTIDES-IMAGES.md`).

Your Products screen shows:

- **Published (30)** — visible on the store
- **Private (20)** — hidden from customers / category pages
- **All (50)**

## Should all 50 be published?

**Publish every product you want customers to see and buy.**

- Keep **Private** only for incomplete, duplicate, or not-for-sale items
- For the **Peptides** menu page to show all 22 vials, those vials must be **Published** (not Private)

## Fix the missing Peptides vials (most likely)

1. **Products → All products**
2. Click **Private (20)**
3. Select the peptide vials (BPC-157 10mg, Cargrilinitide, CJC, GLOW, etc.)
4. Bulk actions → **Edit** → Status → **Published** → Update  
   (or open each → set to Published → Update)

Then reopen **Peptides** — they should appear under the header.

## Also upload theme v2.5.3

Fixes the duplicated menu (one clean Primary menu):  
https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/palmbeach-vitality-theme.zip

Visit the homepage once after upload so the menu rebuild runs.
