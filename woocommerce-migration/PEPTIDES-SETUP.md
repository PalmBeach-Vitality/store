# Peptides (Vials) menu setup

## 1. Upload theme v2.5.1
https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/palmbeach-vitality-theme.zip

The **Peptides** category page now shows your “Peptide Vials Collection” header above the product grid.

## 2. Import the Peptides product list

1. Download:  
   https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/data/products-peptides-vials.csv
2. **Products → Import**
3. Upload CSV
4. Check **Update existing products**
5. Map SKU, Name, Regular price, Categories, Short description, Published
6. Run importer

This will:
- Rename/update existing vials (AOD-9604, BPC-157 20mg, Melonotan, NAD+ 500/1000, TA-1) into **Peptides**
- Create the missing vial products from your list (BPC-157 10mg, Cargrilinitide, CJC, blends, etc.)

### Price note
Existing products keep known prices. New vials use placeholder prices based on similar items — review/edit under **Products** before selling.

### Product list (22)
- BPC-157 10mg Vial
- BPC-157 20mg Vial
- AOD-9604 Vial
- Cargrilinitide Vial
- CJC Vial
- CJC/Ipamorelin Vial
- GHK-cu Vial
- GLOW Vial
- KLOW Vial
- Melonotan Vial
- MOTS-C Vial
- NAD+ 1000mg Vial
- NAD+ 500mg Vial
- PT-141 Vial
- Selank Vial
- Semax Vial
- Sermorelin Vial
- SS-31 Vial
- TA-1 Vial
- TB-500 Vial
- Tesamorelin Vial
- Wolverine Vial

## 3. Confirm menu
**Appearance → Menus** → Primary → **Peptides** should point to the Peptides product category. Theme seed usually sets this automatically.
