# peptide_molecule_vid_gen

**New workflow** — chemical-breakdown molecule videos.  
**Not** the lab-vial daily path. **Not** Creatomate. **No Switch / IF.**

**Sheet:** `13-chem-breakdown-54` (same columns as Sheet 9)  
**Name the workflow exactly:** `peptide_molecule_vid_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/EcGTbpZ9VG3C69pq  
**Workbook:** https://docs.google.com/spreadsheets/d/1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0 — tab `13-chem-breakdown-54`.

**Vibe (mandatory):** dark cinematic 3D **medical animation of a cellular chemical reaction** — living cells + amino acids forming peptide bonds at microscopic scale. Not a sunlit studio. Not a glass pedestal. Not the pen workflow. **No logo. No text. No sound** (add those after vid gen). Clip is muted (`audio: false`).

Sister workflow (pens, separate import): `peptide_pen_vid_gen` → Sheet `14-pen-creations-150`. Do not mix sheets.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → get_chem_creations
  → filter_chem_active
  → pick_molecule_creation
  → grok_imagine_molecule_still
  → save_still_url
  → prep_molecule_video_start
  → openrouter_i2v_start
  → wait_i2v
  → openrouter_i2v_poll
  → prep_last_frame
  → creatomate_last_frame
  → wait_last_frame
  → creatomate_last_frame_poll
  → prep_kling_extend
  → openrouter_i2v_extend
  → wait_i2v_extend
  → openrouter_i2v_extend_poll
  → prep_creatomate_concat
  → creatomate_concat
  → wait_concat
  → creatomate_poll
  → save_video_url
  → sheets_update_chem
```

---

## After import

Imported into n8n Cloud (unpublished). Google Sheets account + XAI Grok header auth are attached.

1. Tab is `13-chem-breakdown-54`. Do not point this workflow at `9-lab-item-creations-500`.
2. Test with **Execute workflow** (manual). Do not Publish until one row looks right.

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger  

---

## Node 2 — `get_chem_creations`

**Type:** Google Sheets · Get Row(s)  
**Before → this → After:** `manual_trigger` → **get_chem_creations** → `filter_chem_active`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Get Row(s) |
| Document | — | **By ID** (your workbook) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Return All | — | **ON** |

---

## Node 3 — `filter_chem_active`

**Type:** Filter  
**Before → this → After:** `get_chem_creations` → **filter_chem_active** → `pick_molecule_creation`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $json.status }}` |
| Operator | — | is equal to |
| Value 2 | **OFF** | `Active` |

---

## Node 4 — `pick_molecule_creation`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `filter_chem_active` → **pick_molecule_creation** → `sheets_update_chem`

Paste: `marketing/n8n-code-pick-molecule-creation.js`

Rotates **compound_name** (never the last **5** used compounds). Sheet rows are staggered so any 5 consecutive ranks are 5 different products.

Each of `shot_family`, `camera_move`, `surface`, `lighting`, `color_grade` has **6** values. Consecutive ranks never reuse the same value in those columns (so day 2 cannot look like day 1). Offsets: shot `i%6`, surface `(i+1)%6`, lighting `(i+2)%6`, grade `(i+3)%6`.

- **shot_family:** `push_in`, `pull_back`, `vertical_rise`, `lateral_drift`, `macro_detail`, `static_lock`
- **camera_move:** slow push-in / slow pull-back / slow vertical rise / slow lateral drift / creeping macro push / locked tripod (each paired to its shot family)
- **surface:** cytoplasm · mitochondrial inner membrane · nuclear envelope pore · ER cisternae · vesicle docking field · living cell lipid bilayer
- **lighting:** low-key rim · volumetric caustics · cool bioluminescent fill · dark-field microscope · dramatic subsurface glow · backlit cytoplasmic bloom
- **color_grade:** violet-cyan night-lab · emerald cytosol · copper-amber organelle · cool microscopic medical · high-contrast intracellular biotech · teal-and-gold mitochondrial

**Settings → Execute Once:** **OFF**. If this is ON, n8n only passes CHEM-001 into the Code node and every run repeats row 1.

Picks the next **unused** row by `rank` (`CHEM-001` then `CHEM-002` …). A row is used if `times_used > 0` or `last_used_at` is set.

**Check:** `lab_item_id` (should advance), `input_row_count` = 54, `model_still` = `grok-imagine-image-2.0`

---

## Node 5 — `grok_imagine_molecule_still`

**Type:** HTTP Request  
**Before → this → After:** `sheets_update_chem` → **grok_imagine_molecule_still** → `save_still_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| Authentication | — | Header Auth → same xAI as vial stills |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | see below |

```text
={{ JSON.stringify({ model: $('pick_molecule_creation').first().json.model_still, prompt: $('pick_molecule_creation').first().json.video_prompt, n: 1, aspect_ratio: $('pick_molecule_creation').first().json.aspect_ratio || '9:16', resolution: $('pick_molecule_creation').first().json.still_resolution || '2k' }) }}
```

**Check:** `$json.data[0].url` — one molecule, no vial.

---

## Node 6 — `save_still_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_imagine_molecule_still` → **save_still_url** → `prep_molecule_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_molecule_creation').first().json.compound_name }}` |
| `video_motion_prompt` | **ON** | `={{ $('pick_molecule_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $('pick_molecule_creation').first().json.model_video }}` |
| `duration_seconds` | **ON** | `={{ $('pick_molecule_creation').first().json.duration_seconds }}` |
| `resolution` | **ON** | `={{ $('pick_molecule_creation').first().json.resolution }}` |

---

## Node 7 — `prep_molecule_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **prep_molecule_video_start** → `openrouter_i2v_start`

Paste: `marketing/n8n-code-prep-molecule-video-start.js`

**Check:** `still_url` https + `openrouter_body_json`. `model_video` must be `kwaivgi/kling-v3.0-pro`.

OpenRouter Kling v3 Pro is **720p only**. Sheet 13 `resolution` must be `720p`.

See `marketing/n8n-openrouter-video.md` for hop 1 → last-frame snapshot → hop 2 → Creatomate concat.

---

## Node 11 — `save_video_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_video_poll` → **save_video_url** → (end)  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | **ON** | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_molecule_creation').first().json.compound_name }}` |
| `created_at` | **ON** | `={{ $now.toISO() }}` |

---

## Node 12 — `sheets_update_chem`

**Type:** Google Sheets → Update  
**Before → this → After:** `pick_molecule_creation` → **sheets_update_chem** → `grok_imagine_molecule_still`

Marks the row used **before** the still so a still-only Execute still advances to CHEM-002 next time.

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | **By ID** (same as `get_chem_creations`) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('pick_molecule_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |

---

## Importable JSON

`marketing/workflows/peptide_molecule_vid_gen.json`  
n8n: **Import from File** → name stays `peptide_molecule_vid_gen` → attach credentials → set Sheet document ID.

---

## Related

- Sheet: `marketing/sheets/13-chem-breakdown-54.csv`
- Pick: `marketing/n8n-code-pick-molecule-creation.js`
- Prep video: `marketing/n8n-code-prep-molecule-video-start.js`
