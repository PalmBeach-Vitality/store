# Fix missing prices (clean re-import)

Your products imported without prices, so Add to cart was hidden. Do a clean re-import of the priced CSV.

## 1. Delete current products
1. **Products → All Products**
2. Select all → Bulk actions → **Move to Trash** → Apply
3. Click **Trash** → **Empty Trash**
4. Confirm the list is empty

## 2. Download this file
**[products-priced-woocommerce.csv](/opt/cursor/artifacts/products-priced-woocommerce.csv)**

(Also in the repo: `woocommerce-migration/data/products-priced-woocommerce.csv`)

## 3. Import
1. **Products → Import**
2. Choose `products-priced-woocommerce.csv`
3. Leave **Update existing products** unchecked (catalog should be empty)
4. Continue to mapping — confirm these match:

| CSV column | Map to |
|---|---|
| Type | Type |
| SKU | SKU |
| Name | Name |
| Published | Published |
| Regular price | **Regular price** ← must map |
| Description | Description |
| Images | Images |
| Categories | Categories |

5. **Run the importer**
6. Expect ~50 products

## 4. Verify
1. Products list should show prices in the admin
2. Open any product on the site → price + **Add to cart**
3. Add to cart → Cart page shows the item

If prices are still blank after import, the **Regular price** column did not map — re-run import and set that mapping manually.
