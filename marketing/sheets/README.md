# Sheets reference (PB Vitality)

| File | Tab name |
|---|---|
| `1-compounds-all-daily.csv` | `1-compounds-all-daily` (live daily queue — pens+vials) |
| `1-compounds-pens.csv` | `1-compounds-pens` |
| `1-compounds-vials.csv` | `1-compounds-vials` |
| `4-reel-queue.csv` | `4-reel-queue` (finished Creatomate packages — WF B `sheets_append_reel`) |

## Live daily tab columns (Creatomate writeback)
Use on `1-compounds-all-daily`:

- `video_url` — Creatomate MP4 URL
- `creatomate_render_id`
- `creatomate_snapshot_url`
- `last_reel_at`

Existing Grok video columns (live Buffer workflow): `reel_still_url`, `reel_video_url`, `buffer_ig_reel_id`, `buffer_fb_reel_id`.

| `5-reel-scenes.csv` | `5-reel-scenes` (630 Creatomate/Grok visual scene briefs) |

## Reel scenes
Import `5-reel-scenes.csv` as tab `5-reel-scenes`. n8n picks one Active scene per Reel Studio run via `scene_id` / rotation.

| `6-quality-variables.csv` | `6-quality-variables` (Grok Imagine quality tokens) |

| `7-unique-reel-creations-500.csv` | `7-unique-reel-creations-500` (legacy abstract scenes — **do not use for Imagine**) |
| `8-lab-items-500.csv` | `8-lab-items-500` (500 real lab-item subject variables) |
| `9-lab-item-creations-500.csv` | `9-lab-item-creations-500` (**production** Grok still/video — full-paragraph cinematic scenes; no Creatomate `mod_*`). **Vials:** aluminum crimp + rubber septum injection vials only — **no twist tops** (`enforce_crimped_vial_closures.py`) |
| `10-creatomate-text-1000.csv` | `10-creatomate-text-1000` (Creatomate overlays: `product_name` + `mod_intro`/`mod_fact_*`) |
| `11-creatomate-render-queue.csv` | optional queue (legacy); WF B prefers Set node `video_url_input` — see `n8n-creatomate-package-workflow.md` |
| `10-creatomate-text-500.csv` | first 500 rows only (legacy; use 1000) |
| `8-lab-items-250.csv` / `9-lab-item-creations-250.csv` | Compat copies of the **500** rows (legacy filenames) |

