# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

## The main goal

Daily **45–60s** Instagram-ready reel:

1. **Unique Grok footage** — still `2k` + video `15s @ 1080p` from lab-item shot recipes  
2. **Creatomate package** — 60s loop + Intro/Facts (muted — music added manually)  
3. **FDA-safe** lab catalog only  

## Two workflows

### A — `PBVita — Grok Daily`

```text
pick_creation (least-used + new shot_family)
  → grok still (video_prompt) → grok_video_start (video_motion_prompt, 15s, 1080p)
  → wait 200s → poll → save_video_url
  → sheets_update_creation
```

### B — `PBVita — Creatomate Package` (separate)

Copy `get_reel_text` → `save_creatomate_url` (+ any `sheets_append_reel`) into a new workflow.  
Each run: paste the **NEW** Grok/vidgen URL + `product_name` into `video_url_input`.  
`pick_text` pulls Facts 1–3 for that product from Sheet 10. Sheets keep updating.

```text
Manual Trigger
  → video_url_input            (NEW vidgen URL + product_name)
  → get_reel_text → pick_text → sheets_update_text
  → map_creatomate_from_url
  → creatomate_render (main_video + muted)
  → wait → status → save_creatomate_url
  → sheets_append_reel
  → Buffer nodes (copy from other WF; video = Creatomate URL)
```

See `n8n-creatomate-package-workflow.md` + `n8n-buffer-from-creatomate.md`.

**No music in renders** — mute `main_video`; add soundtrack manually later.

## Shot diversity

Each creation has unique `shot_family` + `camera_angle` + `camera_direction` + `camera_move` (500 unique moves).  
Stills + `video_motion_prompt` carry those fields. Pick skips last 8 families/cameras.  
See `n8n-camera-diversity-plan.md`.

## Subjects

- Premium equipment / vials / powders / sterile labs — no boxes/trays  
- Labels (when present) = real compounds  
- Still `2k` · Video `15s` `1080p`  

## Canonical docs

- Grok: `n8n-build-grok-imagine-video-nodes.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate package (WF B): `n8n-creatomate-package-workflow.md`  
- Sheets writeback: `n8n-sheets-update-creation.md`  
