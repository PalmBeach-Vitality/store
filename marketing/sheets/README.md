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
| `13-chem-breakdown-54.csv` | `13-chem-breakdown-54` (**new** chemical-breakdown molecule vids — same columns as Sheet 9; 27 compounds × 2 ranks = 54 rows; `shot_family` / `camera_move` / `surface` / `lighting` / `color_grade` each have **6** staggered values; do not mix with vial Sheet 9) |
| `15-caption-science-27.csv` | `15-caption-science-27` (**new** IG caption science briefs — 27 compounds; input for `peptide_caption_gen`) |
| `16-ig-captions.csv` | `16-ig-captions` (**new** caption archive — header + appended vial/pen captions after verify) |
| `14-pen-creations-150.csv` | `14-pen-creations-150` (**new** pens-only catalog vids — **columns copied from** `9-lab-item-creations-500`; **pen params from** `3-image-scenes-150`; 150 rows, one capped pen, no vial; do not mix with Sheet 9 mixed lab rows or Sheet 13 molecules) |
| `12-import-still-queue.csv` | `12-import-still-queue` (import path — same creative columns as Sheet 9 + `still_url` + `import_id`) |
| `10-creatomate-text-1000.csv` | `10-creatomate-text-1000` (Creatomate overlays: `product_name` + `mod_intro`/`mod_fact_*`) |
| `11-creatomate-render-queue.csv` | optional queue (legacy); WF B prefers Set node `video_url_input` — see `n8n-creatomate-package-workflow.md` |
| `10-creatomate-text-500.csv` | first 500 rows only (legacy; use 1000) |
| `8-lab-items-250.csv` / `9-lab-item-creations-250.csv` | Legacy compat copies (not updated by wellness rebuild) |
| `500_Peptide_Wellness_Reel_Scenes.csv` | Live landscape / lab-scene library (`500_Peptide_Wellness_Reel_Scenes`) — vial + pen rows; dosages from `compound-vial-labels.json` |

## Image scenes (`3-image-scenes-150`)

Columns: `scene_id`, `scene_category`, `scene_name`, `lab_environment`, `camera`, `lighting`, `product_hero`, `product_form_detail`, `compound_id`, `compound_name`, `canonical_url`, `scene_brief`, `caption_lock`, `status`, `rotation_order`, `last_used_date`.

Writeback after Buffer: **`last_used_date` only** (match on `scene_id`). Captions come from Grok → `Parse_Grok` → `Save_render_URL`, not this sheet.

## Reel Studio / Creatomate

- Grok still/video library: tab **`9-lab-item-creations-500`** (sheets-only inputs — see `n8n-sheets-only-vid-gen.md`)
- Optional still edit text: column **`still_edit_prompt`** (blank = skip edit)
- **Vial state (CRITICAL):** upright only; exactly one vial; pre-filled before still (never filling in video); clear liquid except **GLOW** = bright blue. Script: `scripts/enforce_vial_state_rules.py`
- **Single hero product (CRITICAL):** exactly **one vial OR one pen** per creation image — never both, never multiples. Script: `scripts/enforce_single_vial_or_pen.py`
- Vial look (Sheet 9 / 8 / 12 / `500_Peptide_Wellness_Reel_Scenes`): clear glass + **blue flip-cap** + silver crimp + white label with maroon DNA logo / compound name / maroon dosage bar / `10ml Sterile Multi-Use Vial` — see `scripts/enforce_pbvita_vial_packaging.py`
- **Vial dosages (CRITICAL):** maroon bar + black mg/ml must match `marketing/compound-vial-labels.json` (price list + Salvatore confirms). Sermorelin is **20mg / 2 mg/ml**, never 5mg. Script: `scripts/lock_vial_dosages.py`
- Import stills: tab **`12-import-still-queue`** (do not paste URLs into Fixed n8n fields)
- Chemical-breakdown molecule vids: tab **`13-chem-breakdown-54`** (Sheet 9 columns; dark microscopic **cellular chemical reaction** — living cells + amino acids; no logo, no text, no sound; not a vial, not a pen). `shot_family`, `camera_move`, `surface`, `lighting`, `color_grade` each have **6** staggered values so consecutive ranks never match.
- Pens-only catalog vids: tab **`14-pen-creations-150`** (Sheet 9 **columns**; pen **input** from `3-image-scenes-150`; one white insulin-style 3ml pen, blue DNA + orange compound name + orange `3ml pen` badge, no mg/ml, no vial)
- IG captions (vial + pen): tab **`15-caption-science-27`** in, **`16-ig-captions`** out — research language only, no “human use” / “benefits of using”
- Creatomate text: tab **`10-creatomate-text-1000`**
- Finished packages log: tab **`4-reel-queue`**
- Creatomate / Buffer packages: **no music** (muted only)
