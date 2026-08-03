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
Each run: paste the **NEW** Grok/vidgen URL into Set node `video_url_input`. Sheets keep updating.

```text
Manual Trigger
  → video_url_input            (paste NEW vidgen URL)
  → get_reel_text → pick_text → sheets_update_text
  → map_creatomate_from_url
  → creatomate_render (main_video + muted)
  → wait → status → save_creatomate_url
  → sheets_append_reel         (keep if you have it)
```

See `n8n-creatomate-package-workflow.md`.

**No music in renders** — mute `main_video`; add soundtrack manually later.

## Shot diversity

Each creation has `shot_family` (`static_lock`, `push_in`, `top_down`, `macro_detail`, …).  
Stills + motion prompts follow that family. Pick skips same family as last used.

## Subjects

- Premium equipment / vials / powders / sterile labs — no boxes/trays  
- Labels (when present) = real compounds  
- Still `2k` · Video `15s` `1080p`  

## Canonical docs

- Grok: `n8n-build-grok-imagine-video-nodes.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate package (WF B): `n8n-creatomate-package-workflow.md`  
- Sheets writeback: `n8n-sheets-update-creation.md`  
