# MOTS-C film I2V stack — four linear workflows

Unpublished. Do **not** Publish. Do **not** mix Creatomate. Do **not** Execute until Sal says yes. Do **not** regenerate 023 / 024 / 025 keepers.

Live sheet: [18-motsc-film-stills](https://docs.google.com/spreadsheets/d/1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU/edit#gid=1628285227)

One Execute = one still = one API. No Switch. Model comes from Sheet 18 `video_provider` + `model_video`.

| Workflow | n8n | API | Sheet rows |
|---|---|---|---|
| `film_i2v_seedance` | [WBNhPMWNITxgPZHK](https://stockjohnson.app.n8n.cloud/workflow/WBNhPMWNITxgPZHK) | fal Seedance 2.5 I2V | 009, 010, 012–014, 016–018, 022–024 |
| `film_i2v_kling` | [XxR5vPPtCNVB7Pxr](https://stockjohnson.app.n8n.cloud/workflow/XxR5vPPtCNVB7Pxr) | fal Kling 3.0 Pro I2V | 015, 020, 025 |
| `film_i2v_veo` | [FXSBCQUQpaFm7UF6](https://stockjohnson.app.n8n.cloud/workflow/FXSBCQUQpaFm7UF6) | fal Veo 3.1 I2V | 001–008, 011, 019, 021 |
| `film_i2v_runway` | [XLuewXSfNuVkn9aS](https://stockjohnson.app.n8n.cloud/workflow/XLuewXSfNuVkn9aS) | Runway Gen-4.5 HTTP | none yet — change `video_provider` to `runway` on a row |

Sheet rewrite overlay (already run, exec 1662): [overlay_film_i2v_stack](https://stockjohnson.app.n8n.cloud/workflow/C49rcawlZ8VImoG1) `C49rcawlZ8VImoG1`

Seedance / Kling / Veo use the existing **fal.ai account** (`fal.ai account`). Kling does **not** need a separate official Kling key. Runway nodes are wired; attach the Runway key later (no credential on those HTTP nodes yet).

## Seedance / Kling / Veo

```text
manual_trigger
  → get_film_stills
  → pick_film_still
  → fal_i2v_generate
  → save_film_video_url
  → sheets_update_still
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `pick_film_still`

**Before → this → After:** `get_film_stills` → **pick_film_still** → `fal_i2v_generate`

**Before → this → After:** `pick_film_still` → **fal_i2v_generate** → `save_film_video_url`

**Before → this → After:** `fal_i2v_generate` → **save_film_video_url** → `sheets_update_still`

**Before → this → After:** `save_film_video_url` → **sheets_update_still** → `end`

## Runway (key later)

```text
manual_trigger
  → get_film_stills
  → pick_film_still
  → prep_runway_video_start
  → runway_video_start
  → wait_video
  → runway_video_poll
  → save_film_video_url
  → sheets_update_still
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `pick_film_still`

**Before → this → After:** `get_film_stills` → **pick_film_still** → `prep_runway_video_start`

**Before → this → After:** `pick_film_still` → **prep_runway_video_start** → `runway_video_start`

**Before → this → After:** `prep_runway_video_start` → **runway_video_start** → `wait_video`

**Before → this → After:** `runway_video_start` → **wait_video** → `runway_video_poll`

**Before → this → After:** `wait_video` → **runway_video_poll** → `save_film_video_url`

**Before → this → After:** `runway_video_poll` → **save_film_video_url** → `sheets_update_still`

**Before → this → After:** `save_film_video_url` → **sheets_update_still** → `end`

Pick requires: `picked_url`, empty `video_url`, `video_motion_prompt`, `video_provider`, `model_video`, `duration_seconds`, `video_resolution`, `audio`, `wait_seconds`, `video_start_url`. Seedance also needs `bitrate_mode` + `video_aspect_ratio`. Veo / Runway need `video_aspect_ratio`.

Writes `video_url` + `video_request_id` + `last_used_at` only. Does not rewrite `picked_url` / `take_urls` / `still_prompt`.

## Finished length: 60–90s

CapCut assembly stays outside n8n. Cut the 228s raw stack to **60–90s** (aim ~75s). 45s is too short.

| | Seconds |
|---|---|
| Raw I2V (all 25 clips) | 228 |
| Finished film | **60–90** |
| Aim | **~75** |

Suggested ~75s spine (trim inside each clip; unused rows are coverage):

| Beat | Still | In-cut |
|---|---|---|
| Ship + cockpit + dying core | 010, 011, 013 | ~12s |
| Wrist low + crash | 006, 020 | ~10s |
| Planet + walk + alien | 014, 017, 022 | ~15s |
| Handoff + wrist + insert | 023, 019, 024 | ~18s |
| Core live + face + warp | 012, 001, 025 | ~16s |
| **Spine** | | **~71s** |

Pad toward 90s with 015 crash settle, 018 vial-into-engine, or 021 pretty CU. Floor at 60s by shortening 011 / 017 / 001.

Hailuo / Wan / Luma / Sora are not in these workflows.

Code: `marketing/n8n-code-pick-film-i2v.js` (+ `-kling` / `-veo` / `-runway`), `marketing/n8n-code-save-film-i2v-fal.js`, `marketing/n8n-code-prep-runway-video-start.js`, `marketing/n8n-code-save-film-i2v-runway.js`.
