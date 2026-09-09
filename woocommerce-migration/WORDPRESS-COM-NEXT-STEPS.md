# Next steps — WordPress.com site ready

**Your site:** [salvatorejohnson1984-eqvrh.wordpress.com](https://salvatorejohnson1984-eqvrh.wordpress.com)  
**Dashboard:** [wordpress.com/home/salvatorejohnson1984-eqvrh.wordpress.com](https://wordpress.com/home/salvatorejohnson1984-eqvrh.wordpress.com)

Site status as of this guide: **Coming Soon** is on, title is Palm Beach Vitality, **no Shop yet**. Do the steps below in order. Stay on Coming Soon until checkout is tested.

---

## Step 0 — Confirm your plan (5 minutes)

WooCommerce needs a **paid** WordPress.com plan.

1. Open your site dashboard → **Upgrades** / **Plans** (or Hosting → Plans).
2. Confirm you are on at least **Personal** (plugins). Prefer **Business** or **Commerce** for a real store.
3. If you are still on Free: upgrade first. **Commerce** auto-installs WooCommerce + store extras; **Business/Personal/Premium** can install WooCommerce manually.

Do not continue until WooCommerce can be installed.

---

## Step 1 — Open classic WP Admin (easier for store setup)

1. From the site home, open **WP Admin**  
   Direct link pattern:  
   `https://salvatorejohnson1984-eqvrh.wordpress.com/wp-admin/`
2. Keep this tab open for the rest of the steps.

---

## Step 2 — Install / open WooCommerce

### If you have Commerce plan
WooCommerce should already be there → go to **WooCommerce → Home**.

### If you have Personal / Premium / Business
1. **Plugins → Add Plugin**
2. Search **WooCommerce** (by Automattic)
3. **Install** → **Activate**
4. Run the setup wizard:
   - Country: United States
   - Currency: **USD**
   - Industry: Health / Beauty or Other (research products)
   - Product types: **Physical products**
5. Let it create **Shop, Cart, Checkout, My Account** pages.

---

## Step 3 — Permalinks

1. **Settings → Permalinks**
2. Select **Post name**
3. Save

---

## Step 4 — Upload the Palm Beach theme

Theme zip is in this repo:

`woocommerce-migration/palmbeach-peptides-theme.zip`

1. Download that zip from GitHub (PR branch or after merge).
2. WP Admin → **Appearance → Themes → Add New / Install**
3. **Upload Theme** → choose `palmbeach-peptides-theme.zip`
4. **Activate**

If upload is blocked, your plan does not allow custom themes yet — upgrade to a plan that supports theme upload, or temporarily use a WooCommerce-ready theme from WordPress.com and apply navy/teal colors later.

---

## Step 5 — Menus + homepage

1. **Pages → Add New** → title `Home` → Publish (leave body empty; theme `front-page.php` draws the hero).
2. **Settings → Reading** → “A static page” → Homepage = **Home** → Save.
3. **Appearance → Menus**:
   - Create menu **Primary**
   - Add links: Products (`/shop/`), About, Research, FAQ, Wholesale, Contact  
     (create those pages as empty drafts now if needed)
   - Assign to **Primary Menu** location → Save.

---

## Step 6 — Export from Shopify (same day as import)

Follow [`SHOPIFY-EXPORT.md`](SHOPIFY-EXPORT.md). Minimum:

1. Shopify Admin → **Products → Export → All products → CSV**
2. **Customers → Export**
3. Download logos / COAs from **Content → Files**
4. Screenshot shipping, taxes, payments settings

Save in a folder like `shopify-export-YYYY-MM-DD/`.

---

## Step 7 — Import products into WooCommerce

**Preferred:** Import the **Shopify product CSV** (has real prices, SKUs, images).

1. WP Admin → **Products → Import**
2. Upload Shopify CSV
3. Map columns (name, SKU, price, images, etc.)
4. Run importer
5. Open several products → confirm variations / prices / images

**Fallback (scaffold only):**  
Use `data/products-woocommerce.csv` from this kit **after** you paste Regular prices from Shopify into every variation row. Blank prices will publish $0 / empty products — do not import blank prices to a live catalog.

Categories to verify: Growth Factors, Metabolic, Cognitive, Hormonal, Immune, Stacks.

---

## Step 8 — Payments (gate before launch)

1. **WooCommerce → Settings → Payments** (or **Payments** in sidebar)
2. Enable **WooPayments** or your approved gateway
3. Complete KYC / business verification
4. Place a **test order**

**Warning:** Research peptide catalogs are frequently declined by card processors. If WooPayments/Stripe rejects the business type, pause and secure an approved merchant account before DNS cutover. Do not point `palmbeach-vitality.store` at this site until a real paid test succeeds.

---

## Step 9 — Shipping + tax

1. **WooCommerce → Settings → Shipping** → recreate zones/rates from your Shopify screenshots
2. **WooCommerce → Settings → Tax** → match Shopify (or enable automated tax if offered)
3. **WooCommerce → Settings → Emails** → send a test; confirm mail arrives (WP.com handles mail on their platform)

---

## Step 10 — Content pages

Create/publish using copy from this repo’s HTML (see [`theme/CONTENT-PAGES.md`](theme/CONTENT-PAGES.md)):

| Page | Source |
|------|--------|
| About | `about/index.html` |
| Research | `research/index.html` + articles |
| FAQ | `faq/index.html` |
| Wholesale | `wholesale/index.html` |
| Contact | `contact/index.html` (add a form block; include `#pricing`) |
| Privacy / Terms / Refund / Research-use | new legal pages |

---

## Step 11 — Redirects plugin (before domain move)

1. **Plugins → Add** → install **Redirection**
2. Import `data/redirects.csv` (map source → target)
3. After Shopify redirect export, add any extra paths

---

## Step 12 — QA while still on Coming Soon

Work through [`CHECKLIST.md`](CHECKLIST.md) sections B–E.

Must pass:

- [ ] Shop lists products with correct prices
- [ ] Add to cart → checkout → paid test order
- [ ] Order email received
- [ ] Mobile checkout works
- [ ] Disclaimer visible on products

---

## Step 13 — Attach custom domain (only after QA)

1. WordPress.com → **Upgrades → Domains** (or Hosting → Domains)
2. Add `palmbeach-vitality.store` / `www`
3. At your registrar, change DNS from Shopify to the WordPress.com records they show
4. Turn off **Coming Soon** / launch store
5. Keep Shopify alive briefly as rollback

Full cutover detail remains in [`PLAN.md`](PLAN.md) Phase 8.

---

## Do this next (today)

1. Confirm paid plan (Step 0)
2. Install WooCommerce (Step 2)
3. Upload `palmbeach-peptides-theme.zip` (Step 4)
4. Export Shopify products CSV (Step 6)

When those four are done, reply with “WooCommerce installed + theme up” (or any error screenshot text) and we continue with the import mapping.
