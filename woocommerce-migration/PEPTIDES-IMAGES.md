# Fix missing Peptides product images

The newer peptide vials were imported **without an Images column**, so WooCommerce shows placeholders.

Use this update CSV (image URLs from your Shopify CDN):

**`woocommerce-migration/data/products-peptides-images-UPDATE.csv`**

Download:  
https://github.com/PalmBeach-Vitality/store/blob/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/data/products-peptides-images-UPDATE.csv

## Import steps

1. **Products → Import**
2. Upload `products-peptides-images-UPDATE.csv`
3. Check **Update existing products**
4. Map columns if asked:
   - **SKU** → SKU
   - **Name** → Name
   - **Images** → Images
5. **Run the importer**
6. Hard-refresh **Peptides** (`/product-category/peptides/`)

## Covered products (16)

| SKU | Product | Image |
|---|---|---|
| PBV-BPC-157-10MG | BPC-157 10mg Vial | vial photo |
| PBV-CARGRILINITIDE | Cargrilinitide Vial | vial photo |
| PBV-CJC-VIAL | CJC Vial | vial photo |
| PBV-CJC-IPAMORELIN-VIAL | CJC Ipamorelin Vial | vial photo |
| PBV-GHK-CU-VIAL | GHK-cu Vial | vial photo |
| PBV-GLOW-VIAL | GLOW Vial | vial photo |
| PBV-KLOW-VIAL | KLOW Vial | vial photo |
| PBV-MOTS-C-VIAL | MOTS-C Vial | vial photo |
| PBV-PT-141-VIAL | PT-141 Vial | vial photo |
| PBV-SEMAX-VIAL | Semax Vial | vial photo |
| PBV-SS-31-VIAL | SS-31 Vial | vial photo |
| PBV-TB-500-VIAL | TB-500 Vial | vial photo |
| PBV-TESAMORELIN-VIAL | Tesamorelin Vial | vial photo |
| PBV-SELANK-VIAL | Selank Vial | pen photo (no vial file found) |
| PBV-SERMORELIN-VIAL | Sermorelin Vial | pen photo (no vial file found) |
| PBV-WOLVERINE-VIAL | Wolverine Vial | pen photo (no vial file found) |

If you have dedicated **Selank / Sermorelin / Wolverine vial** photos, send them and we can swap those three.
