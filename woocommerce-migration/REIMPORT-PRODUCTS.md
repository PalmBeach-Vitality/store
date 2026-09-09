# Re-import products (fixed CSV)

Your Shopify file created blank products because WooCommerce does not understand Shopify’s CSV format.

Use this converted file instead:

**`woocommerce-migration/data/products-from-shopify-woocommerce.csv`**

- **50 products** total  
- **30 published** (Shopify status = active)  
- **20 drafts** (Shopify suspended/archived — still imported, not visible in shop until you publish)  
- Prices + image URLs included  

## Steps in WordPress

### 1. Delete the blank/broken products
1. **Products → All Products**
2. Select all → Bulk actions → **Move to Trash** → Apply  
3. Trash → **Empty Trash**

### 2. Download the fixed CSV
From GitHub PR/branch file:  
`woocommerce-migration/data/products-from-shopify-woocommerce.csv`

### 3. Import
1. **Products → Import**
2. Upload `products-from-shopify-woocommerce.csv`
3. Check **Update existing products** only if re-running; first clean import: leave unchecked
4. Map columns if asked (Name, SKU, Regular price, Description, Images, Categories, Published should auto-map)
5. **Run the importer**

### 4. Verify
1. **Products → All Products** — should show names + prices (not blank)
2. Open **Shop** page / `/shop/`
3. Click one product — image + Add to cart should work  
   (Images load from Shopify CDN URLs; later you can re-host in Media Library if desired)

### 5. Drafts
Suspended Shopify items appear as **Draft**. To sell them: open product → set status **Published**.
