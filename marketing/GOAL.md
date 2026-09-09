# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

**Still lock:** `9-lab-item-creations-500`, `13-chem-breakdown-54`, `14-pen-creations-150`, and all other stills stay `grok-imagine-image-2.0` at `2k`. **`18-motsc-film-stills` only** may use OpenRouter `black-forest-labs/flux.2-max` (trial). Never `grok-imagine-image` or `grok-imagine-image-quality`.
## #1 priority — image and video quality

Quality is the first rule on every still and every clip. Speed, cost, habit, and the last model we used come after.

- **9:16 only.** These are social clips (IG Reels / Stories / TikTok). Every still and every video is vertical. **1080p = 1080 × 1920.** Landscape 1920 × 1080 is the wrong product. Reject 16:9.
- **Measure pixels.** A sheet cell that says `2k` or `1080p` is not proof. Open the file. `ffprobe` the MP4. True 9:16 1080p is **1080 × 1920**. True 2K 9:16 is about **1440 × 2560** (or the provider’s documented 2K vertical). **720 × 1280 is 720p** — do not call it 1080p or 2K.
- **Still sharpness sets video sharpness.** Generate stills at real 2K+ even when the video target is 1080p. A 720p first frame cannot become a sharp 1080p I2V clip.
- **Lock the still before spending video credits.** Produce takes, pick a keeper, then I2V. Motion prompts describe motion only — do not re-describe the scene.
- **Native resolution on the video API.** Ask for 1080p or higher. Do not accept 720p for film / hero / catalog clips. Do not upscale a soft generate and call it done.
- **Pick the model for the shot.** Cinematic speed/camera ≠ product identity lock ≠ photoreal physics. See `marketing/vid-gen-quality-playbook.md`.
**HARD RULE — prompt review gate:** Before every still, video, or edit run, the agent sends Salvatore the exact prompt/edit text (readable in the Cursor window, no copy boxes) and waits for OK. Before every video run, also name the API and model. No exceptions. See `prompt-review-gate.md`.

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
  → prep_openrouter_i2v → openrouter_i2v_start (I2V, 15s, muted)
  → wait → poll → save_video_url
  → sheets_update_creation
```

**Video model:** OpenRouter (`kwaivgi/kling-v3.0-pro`, `bytedance/seedance-2.5`, `google/veo-3.1`). No fal.ai. See `n8n-openrouter-video.md`.
**Video model:** ByteDance **Seedance 2.5** is live on fal. Daily I2V notes: `n8n-seedance-vid-gen.md`. Standalone hyperrealistic T2V (sheets-only): `seedance_25_vid_gen` is **palmbeach-rx.com** — see `n8n-seedance-25-vid-gen.md`. A separate vitality.store T2V path is deferred.

Live lab daily (Grok still → edit → Grok video) is **`Vid_gen_lab_scenes -9-lab-items-creations-500`**. Edit the still *before* video: `n8n-vid-gen-lab-scenes.md`.

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

**Finished film: 60–90s** (aim ~75s). Not 45s. Raw stack is 228s (11×8s Veo + 14×10s Seedance/Kling) so the cut has coverage. Daily catalog reels stay 45–60s.

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

### H — `film_sonilo_sound` (after the join)

Scores the joined ~80s reel with **Sonilo** `video-to-sound` (`sound_type=music_and_sfx`). One call returns synced SFX plus a music bed, muxed into the picture. Not ElevenLabs. Not Mirelo. Not Kling’s 20s video-to-audio.

```text
get_film_stills → pick_sonilo_reel → prep_sonilo_start
  → sonilo_start → wait_sonilo → sonilo_poll → parse_sonilo
  → save_sonilo_url → sheets_update_sonilo
```

Prompts, host, and endpoint come from Sheet 18. See `n8n-sonilo-video-sound.md`.
### G — `overlay_film_beach_entry` (one-shot)

Puts **FILM-001** / **FILM-004** on the FILM-014 alien-galaxy beach (they were still gray studio) and rewrites **FILM-020** as space → high-speed atmospheric burn-up. Then `gen_film_beach_stills` generates new keepers from the sheet `still_prompt`. See `n8n-film-001-004-beach-entry.md`.
### G — `film_vace_join` (25-clip stitch)

WaveSpeed VACE joins the 25 MOTS-C film clips. WildCut-quality seams use OpenRouter first+last frame (`seam_mode=flf2v` + `bridge_prompt`). Music/SFX later via ElevenLabs + Creatomate.

```text
overlay_film_join_25 (columns)
  → film_i2v_* until all 25 have video_url
  → film_vace_join (batches of 2–4) → join_url
```

See `n8n-vace-clip-join.md`.
### G — `seedance_25_vid_gen` (palmbeach-rx.com)

Hyperrealistic **30s** Seedance 2.5 **text-to-video** for **palmbeach-rx.com**. All prompts and generate params from Sheet **`17-seedance-25-t2v`**. Not Grok. Not Creatomate. Linear — no Switch/IF. Do **not** point this at vitality.store daily sheets. A separate `palmbeach-vitality.store` Seedance T2V workflow is deferred.

```text
get_seedance_scenes → filter Active → pick_seedance_scene
  → fal_seedance_generate → save_video_url → sheets_update_seedance
```

See `n8n-seedance-25-vid-gen.md`. Native fal max is 30s (not 60).  
Live unpublished: https://stockjohnson.app.n8n.cloud/workflow/ItjZGciut9XK3jHH

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

- Quality + vid-gen API survey: `vid-gen-quality-playbook.md`  
- Molecule vids: `n8n-peptide-molecule-vid-gen.md`  
- Pen vids: `n8n-peptide-pen-vid-gen.md`  
- Grok still: `n8n-build-grok-imagine-video-nodes.md`  
- OpenRouter video (replaces fal): `n8n-openrouter-video.md`  
- Seedance 2.5 T2V (sheets-only): `n8n-seedance-25-vid-gen.md`  
- Seedance I2V notes: `n8n-seedance-vid-gen.md`  
- Seedance video: `n8n-seedance-vid-gen.md`  
- Prompt review gate: `prompt-review-gate.md`  
- Prompt blocks (Flux/Kling/Grok/Veo): `prompt-moderation-rulebook.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate package (WF B): `n8n-creatomate-package-workflow.md`  
- Sheets writeback: `n8n-sheets-update-creation.md`  
- Sonilo music + SFX: `n8n-sonilo-video-sound.md`  

- FILM-001/004 beach + FILM-020 burn-up: `n8n-film-001-004-beach-entry.md`  
- 25-clip VACE join + FLF2V bridges: `n8n-vace-clip-join.md`  
