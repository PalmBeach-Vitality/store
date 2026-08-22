# 1000 Creatomate text sets (product-filtered facts)

Each reel’s Facts 1–3 are **plain-English ad-style lines** (still FDA research-only).  
On-screen **Intro** = `product_name` from `video_url_input` (not catalog blurbs).  
`mod_fact_4` / `mod_fact_5` stay as disclaimer + listing CTA.

## Files

| File | Role |
|---|---|
| `sheets/10-creatomate-text-1000.csv` | **Canonical** — 1000 rows + `product_name` |
| `n8n-code-pick-text.js` | Filter by `video_url_input.product_name`, pick least-used |
| `scripts/rebuild_creatomate_text_by_product.py` | Rebuild facts 1–3 by product |
| `pbvita-1000-creatomate-text.json` | JSON dump |

~37 Active rows per catalog product (27 products).  
IDs: `PBVita-Text-0001` … `PBVita-Text-1000`.

## Columns

| Column | Behavior |
|---|---|
| `product_name` | Exact catalog name (BPC-157, NAD+, Semaglutide, …) |
| `mod_intro` | Unchanged library intros |
| `mod_fact_1` … `mod_fact_3` | Science / study facts for that product |
| `mod_fact_4` | Unchanged research-use disclaimer lines |
| `mod_fact_5` | Unchanged “view listing / catalog” CTAs |

## n8n (Workflow B)

```text
video_url_input            (public_video_url + product_name)
  → get_reel_text          (Sheets · 10-creatomate-text-1000 · Return All)
  → pick_text              (filters to product_name, least-used)
  → sheets_update_text
  → map_creatomate_from_url
  → creatomate_render
```

## Import

1. Replace-import `10-creatomate-text-1000.csv` → tab **`10-creatomate-text-1000`**
2. Confirm header includes **`product_name`**
3. Paste updated `n8n-code-pick-text.js`
4. On `video_url_input`, enter `product_name` exactly as in the sheet (e.g. `BPC-157`)
