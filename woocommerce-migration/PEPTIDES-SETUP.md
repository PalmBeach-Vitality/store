# Peptides — finish the 16 missing vials + new header

## A. Theme (lab header)
Upload **v2.5.2**:  
https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/palmbeach-vitality-theme.zip

Peptides page header is now the lab image with centered readable white/cyan text.

## B. Import the 16 missing vials

Your first import only updated 6 existing products. These 16 still need to be **created**.

1. Download:  
   https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/data/products-peptides-vials-NEW.csv
2. **Products → Import → Upload**
3. **Do NOT check** “Update existing products”
4. Continue → map columns → Run

Expected result: **16 products imported** (not skipped).

### Checklist if anything is still skipped
- Update existing must be **off**
- Category **Peptides** exists (Products → Categories)
- After import: Products → filter by category Peptides → should show ~22
- Settings → Permalinks → Save Changes once

### The 16 new vials
BPC-157 10mg, Cargrilinitide, CJC, CJC Ipamorelin, GHK-cu, GLOW, KLOW, MOTS-C, PT-141, Selank, Semax, Sermorelin, SS-31, TB-500, Tesamorelin, Wolverine
