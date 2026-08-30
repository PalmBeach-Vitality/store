# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

## The main goal

Daily **45–60s** Instagram-ready reel:

1. **Unique Grok footage** — still `2k` + video `15s @ 1080p` from lab-item shot recipes  
2. **Creatomate package** — 60s loop + Intro/Facts (muted — music added manually)  
3. **FDA-safe** lab catalog only — disclaimers in **captions only**, never burned into video/prompts/overlays  

## Workflows

### A — `PBVita — Grok Daily`

```text
pick_creation (least-used + new shot_family)
  → grok still (video_prompt, 2k, 9:16)
  → prep_seedance_video_start → seedance_video_start (I2V, 15s, 1080p, muted)
  → wait → poll → save_video_url
  → sheets_update_creation
```

**Video model:** ByteDance **Seedance** (newest = **2.5**; ship on **2.0 via fal** until 2.5 API is in your catalog). See `n8n-seedance-vid-gen.md`.

### B — `PBVita — Creatomate Package` (separate)

Copy `get_reel_text` → `save_creatomate_url` (+ any `sheets_append_reel`) into a new workflow.  
Each run: upload Grok MP4 to **catbox.moe**, paste the **catbox** URL + `product_name` into `video_url_input` (never `vidgen.x.ai`).  
`pick_text` pulls Facts 1–3 for that product from Sheet 10. Sheets keep updating.

```text
Manual Trigger
  → video_url_input            (NEW catbox .mp4 URL + product_name)
  → get_reel_text → pick_text → sheets_update_text
  → map_creatomate_from_url
  → creatomate_render (main_video + muted)
  → wait → status → save_creatomate_url
  → sheets_append_reel
  → Buffer nodes (copy from other WF; video = Creatomate URL)
```

See `n8n-creatomate-package-workflow.md` + `n8n-buffer-from-creatomate.md`.

**No music in renders** — mute `main_video`; add soundtrack manually later.  
**Template:** `c5d54774-b029-4786-af04-d5af345dc7f2` (`main_video` + `end_hold`).

### C — `peptide_molecule_vid_gen` (separate)

Chemical-breakdown **3D molecule** reels. Sheet **`13-chem-breakdown-54`**. Not vials. Linear — no Switch/IF.

```text
get_chem_creations → pick_molecule_creation
  → grok_imagine_molecule_still → save_still_url
  → prep_molecule_video_start → grok_video_start
  → wait → poll → save_video_url → sheets_update_chem
```

See `n8n-peptide-molecule-vid-gen.md`. Import JSON: `marketing/workflows/peptide_molecule_vid_gen.json`.

### D — `peptide_pen_vid_gen` (separate)

Pens-only catalog reels. **Columns** from Sheet **`9-lab-item-creations-500`**. **Pen params** from **`3-image-scenes-150`** (`product_hero`, `product_form_detail`, `lab_environment`, `camera`, `lighting`). Output tab **`14-pen-creations-150`**. One capped pre-filled research pen. Not vials. Not molecules. Linear — no Switch/IF.

```text
get_pen_creations → pick_pen_creation
  → grok_imagine_pen_still → save_still_url
  → prep_pen_video_start → grok_video_start
  → wait → poll → save_video_url → sheets_update_pen
```

See `n8n-peptide-pen-vid-gen.md`. Import JSON: `marketing/workflows/peptide_pen_vid_gen.json`.

### E — `peptide_caption_gen` (separate)

IG captions for **vial** and **pen** (2 each). Manual compound name → Sheet 15 science brief → FDA verify → email. Not Creatomate. Not vid gen. Linear — no Switch/IF.

```text
enter_compound → get_caption_science → match_compound
  → build_captions → verify_fda_captions
  → prep_caption_email → gmail_send_captions → sheets_append_captions
```

See `n8n-peptide-caption-gen.md`. Import JSON: `marketing/workflows/peptide_caption_gen.json`.

### G — MOTS-C film I2V stack (Sheet 18)

Locked film keepers → **per-beat** I2V. Four unpublished linear workflows. No Switch. No Creatomate. CapCut stays manual.

| Workflow | Model | Beats |
|---|---|---|
| `film_i2v_seedance` | Seedance 2.5 (fal) | flyover, walk, handoff, vial-into-engine |
| `film_i2v_kling` | Kling 3.0 Pro (existing fal.ai account) | crash, liftoff + warp |
| `film_i2v_veo` | Veo 3.1 (fal) | cockpit / face / product close-ups |
| `film_i2v_runway` | Runway Gen-4.5 | identity-lock backup — key later |

```text
get_film_stills → pick_film_still → fal_i2v_generate
  → save_film_video_url → sheets_update_still
```

See `n8n-motsc-film-i2v-stack.md`. Old Grok 1.5 factory stays unpublished and unused.

### F — `sheet_format_as_tables` (one-shot)

Converts marketing Google Sheets into Tables (table menu + header dropdowns) via Apps Script `marketing/scripts/sheets_convert_to_tables.gs`. Does not change cell data. See `n8n-sheet-format-as-tables.md`.

## Shot diversity

Each creation has unique `shot_family` + `camera_angle` + `camera_direction` + `camera_move` (500 unique moves).  
Stills + `video_motion_prompt` carry those fields. Pick skips last 8 families/cameras.  
See `n8n-camera-diversity-plan.md`.

## Subjects

- **Full cinematic scenes** (not single boring SKUs): labs, peptide R&D, sterile suites, longevity/wellness industry worlds  
- Each `lab_item` is a **full paragraph**; `video_prompt` + `video_motion_prompt` embed that scene  
- Labels (when present) = real compounds  
- Still `2k` · Video `15s` `1080p`  
- Rebuild scenes: `python3 marketing/scripts/rebuild_scene_library_500.py`  

## Canonical docs

- Molecule vids: `n8n-peptide-molecule-vid-gen.md`  
- Pen vids: `n8n-peptide-pen-vid-gen.md`  
- Grok still: `n8n-build-grok-imagine-video-nodes.md`  
- Seedance video: `n8n-seedance-vid-gen.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate package (WF B): `n8n-creatomate-package-workflow.md`  
- Sheets writeback: `n8n-sheets-update-creation.md`  
