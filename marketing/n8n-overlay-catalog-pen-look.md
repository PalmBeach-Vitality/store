# Catalog pen look overlay (red peptide / blue metabolic)

One-shot sheet writes. Archive each n8n workflow after it runs. Do **not** Publish.

Code:
- `marketing/n8n-code-catalog-pen-look.js` (shared helpers)
- `marketing/n8n-code-overlay-catalog-pen-sheet14.js`
- `marketing/n8n-code-overlay-catalog-pen-image-scenes.js`
- `marketing/n8n-code-overlay-catalog-pen-landscape.js`

Daily mappers stay sheets-only:
- `peptide_pen_vid_gen` `pick_pen_creation` copies the sheet (no wrap)
- Buffer `prep_imagine_request` generates from `still_prompt` / `scene_brief`

## Look (catalog injector photo)

Match the catalog pen still. Ignore neon/synthwave backgrounds.

| Part | Exact |
|---|---|
| Barrel | Smooth **matte white** cylindrical insulin-style injector. **LONGER** full-length barrel — stretch **10–20% longer** than a stubby travel pen; keep diameter the same. Not compact, not short. |
| Cap | Matching **white matte cap ON** with integrated **white pocket clip** |
| Dial | **White** ridged gear-like dose dial (not colored) |
| Plunger tip | Small flat circular tip in the accent color |
| Logo | Accent-color **DNA double-helix icon only**, **above** the name. **No hands, no palms, no figurative hands** near/cradling the helix. |
| Name | Large bold accent sans-serif (swaps per compound) |
| Badge | Solid accent rectangle, white **`10mg`** |
| Fine print | Small dense black/dark-grey lines under the name |
| Side text | Vertical **For Research Purposes Only** (physical catalog label) |

**PEPTIDE PENS = crimson red text + logo**  
**METABOLIC PENS = cobalt blue text + logo**

Metabolic names only: `Semaglutide`, `Tirzepatide`, `Retatrutide`  
(IDs `P-SEM-001` / `P-SEMA-001`, `P-TIR-001` / `P-TIRZ-001`, `P-RET-001` / `P-RETA-001`). Everyone else is peptide / red.

**FORBIDDEN: orange** (DNA, name, badge, dial, anywhere).  
**FORBIDDEN: hands** around the DNA helix.

## Overlays

GLOW liquid in the barrel window stays bright blue. That is not the logo color.

## Overlays

```text
Manual Trigger
  → get_*                       Google Sheets read, all rows
  → overlay_*                   Code, Run Once for All Items, Execute Once OFF
  → sheets_update_*             Google Sheets update, match creation_id or scene_id
```

| Workflow | Sheet | Rows | Match |
|---|---|---|---|
| `overlay_catalog_pen_sheet14` | `14-pen-creations-150` | all 150 | `creation_id` |
| `overlay_catalog_pen_image_scenes` | `3-image-scenes-150` | `pen_3ml_scene` only | `scene_id` |
| `overlay_catalog_pen_landscape` | `500_Peptide_Wellness_Reel_Scenes` | `pen_3ml` only | `creation_id` |

Do **not** emit `times_used` / `last_used_at` / `last_used_date` / URLs.  
Do **not** restyle landscape `vial_10ml` / `set_environment` or buffer `vial_10ml_scene` / `lab_scene`.

Image-scenes overlay also writes `still_prompt`, `model_still`, `aspect_ratio` (`1:1`), `still_resolution`, `still_n` (new columns if missing). Caption path stays. Writeback stays `last_used_date` only.

## After overlay

Executed (unpublished, then archived):

| Overlay | Exec | Result |
|---|---|---|
| `overlay_catalog_pen_sheet14` `eH6cxum21dLDnfpP` | **1500** | success — all Sheet 14 rows |
| `overlay_catalog_pen_image_scenes` `IKcK9L9uUcLyAPuu` | **1501** | success — `pen_3ml_scene` only |
| `overlay_catalog_pen_landscape` `EFRhwuhx6vIccDPk` | **1502** | success — `pen_3ml` only |

Length + helix-only (this pass; archive after execute):

| Overlay | Exec | Result |
|---|---|---|
| `overlay_catalog_pen_longer_nohands_sheet14` | pending | Sheet 14 — longer barrel, DNA helix icon only |
| `overlay_catalog_pen_longer_nohands_image_scenes` | pending | `pen_3ml_scene` only |
| `overlay_catalog_pen_longer_nohands_landscape` | pending | `pen_3ml` only |

Existing stills will not change by themselves. Re-Execute the daily workflows (unpublished). Do not Publish.
