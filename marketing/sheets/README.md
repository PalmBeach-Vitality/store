# Sheets reference (PB Vitality)

| File | Tab name |
|---|---|
| `3-image-scenes-150.csv` | `3-image-scenes-150` (IG/FB image scenes — writeback = `last_used_date` only) |
| `3-figma-content-queue.csv` | `3-figma-content-queue` (Figma Content Studio queue) |
| `4-reel-queue.csv` | `4-reel-queue` (finished Creatomate packages — WF B `sheets_append_reel`) |
| `5-reel-scenes.csv` | `5-reel-scenes` (630 Creatomate/Grok visual scene briefs) |
| `6-quality-variables.csv` | `6-quality-variables` (Grok Imagine quality tokens) |
| `7-unique-reel-creations-500.csv` | `7-unique-reel-creations-500` (legacy abstract scenes — **do not use for Imagine**) |
| `health_wellness_scene_settings_100.csv` | Source list of **100** lifestyle scene settings (input only) |
| `8-lab-items-500.csv` | `8-lab-items-500` (legacy subject list — not auto-synced from wellness rebuild) |
| `9-lab-item-creations-500.csv` | `9-lab-item-creations-500` (**production** Grok still/video — 500 rows; includes `still_edit_prompt`, models, motion; no Creatomate `mod_*`) |
| `12-import-still-queue.csv` | `12-import-still-queue` (import path — public `still_url` + motion/edit/models from sheet) |
| `10-creatomate-text-1000.csv` | `10-creatomate-text-1000` (Creatomate overlays: `product_name` + `mod_intro`/`mod_fact_*`) |
| `11-creatomate-render-queue.csv` | optional queue (legacy); WF B prefers Set node `video_url_input` — see `n8n-creatomate-package-workflow.md` |
| `10-creatomate-text-500.csv` | first 500 rows only (legacy; use 1000) |
| `8-lab-items-250.csv` / `9-lab-item-creations-250.csv` | Legacy compat copies (not updated by wellness rebuild) |

## Image scenes (`3-image-scenes-150`)

Columns: `scene_id`, `scene_category`, `scene_name`, `lab_environment`, `camera`, `lighting`, `product_hero`, `product_form_detail`, `compound_id`, `compound_name`, `canonical_url`, `scene_brief`, `caption_lock`, `status`, `rotation_order`, `last_used_date`.

Writeback after Buffer: **`last_used_date` only** (match on `scene_id`). Captions come from Grok → `Parse_Grok` → `Save_render_URL`, not this sheet.

## Reel Studio / Creatomate

- Grok still/video library: tab **`9-lab-item-creations-500`** (sheets-only inputs — see `n8n-sheets-only-vid-gen.md`)
- Optional still edit text: column **`still_edit_prompt`** (blank = skip edit)
- Import stills: tab **`12-import-still-queue`** (do not paste URLs into Fixed n8n fields)
- Creatomate text: tab **`10-creatomate-text-1000`**
- Finished packages log: tab **`4-reel-queue`**
