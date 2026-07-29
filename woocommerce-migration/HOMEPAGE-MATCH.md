# Homepage match (Shopify screenshots)

The theme homepage is laid out like your Shopify store:

1. White announcement bar (FDA notice — editable)
2. Logo (bundled) + menu: Most Popular · Peptides · Peptide Pens · Weight Loss · Weight Loss Pens · Wholesale · Contact Us · Telehealth
3. Search / Account / Cart icons
4. Lab/beach hero with centered brand copy overlay (bundled image + exact homepage text)
5. **Most Popular** product grid (middle section)
6. FAQ accordion
7. Minimal footer: © Palm Beach Vitality · Terms and Policies

> Note: Shopify `.liquid` section files cannot run on WordPress. We rebuilt the same homepage structure in the PHP theme.

## Bundled brand assets (v2.2)

Included in the theme zip — **no Customizer upload required** for a working homepage:

| Asset | Path in theme | Source |
| --- | --- | --- |
| Hero | `assets/images/hero.jpg` | Lab + Palm Beach view (vials, pens, PRECISION. PURITY. PERFORMANCE) |
| Logo mark | `assets/images/logo.jpg` | Cropped from your Shopify logo (`image_2.jpg`) |
| Full logo banner | `assets/images/logo-full.jpg` | Original Shopify logo artwork |

### Optional overrides

- **Hero:** Appearance → Customize → Header Image
- **Logo:** Appearance → Customize → Site Identity → Logo

## Edit announcement text

**Appearance → Customize → Palm Beach Storefront → Announcement bar text**

## Re-upload theme

https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/shopify-to-woocommerce-c0c9/woocommerce-migration/palmbeach-vitality-theme.zip

Appearance → Themes → Upload → **Replace current with uploaded**

## Menu (recommended)

Appearance → Menus → Primary:

- Most Popular → `/shop/` (or a Most Popular category)
- Peptides
- Peptide Pens
- Weight Loss
- Weight Loss Pens
- Wholesale
- Contact Us
- Telehealth
