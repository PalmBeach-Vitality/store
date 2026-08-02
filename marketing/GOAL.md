# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

## The main goal (current)

Produce a **45–60 second** Instagram-ready reel **every day** that is:

1. **Visually unique** — Grok Imagine (still `2k` + video) from the **500 lab-item** variables  
2. **Text on reel** — Creatomate burns **daily-unique** research copy onto that unique footage  
3. **Highest quality** — still: `grok-imagine-image-quality` + `2k`; video: `grok-imagine-video-1.5` at **`15s` / `1080p`**  
4. **FDA-safe** — laboratory research catalog only; no people/hands/injection/lifestyle/wellness/nicknames  

If the reel is only Creatomate’s default template bed with new text, **the goal is not met.**

## Architecture — two workflows (do not combine for now)

Creatomate often **cannot fetch** `vidgen.x.ai` URLs. Keep packaging separate so the daily Grok run always succeeds.

### Workflow A — `PBVita — Grok Daily` (run every day)

```text
get_reel_creations → filter Active → pick_creation
  → grok_imagine_reel_still          (2k, video_prompt)
  → save_still_url
  → grok_video_start                 (15s, 1080p, video_motion_prompt)
  → wait_video → grok_video_poll → save_video_url
  → sheets_update_creation           (times_used + last_used_at)  ← REQUIRED
```

**Done when:** unique 15s MP4 exists + lab Sheet row bumped so tomorrow’s pick differs.

### Workflow B — `PBVita — Creatomate Package` (separate)

```text
input: public MP4 URL (not vidgen) + pick_text / compound_name
  → map_creatomate_mods
  → creatomate_render (video_loop_source.source + Intro + Facts)
  → wait → save_creatomate_url → sheets_update_text (optional)
```

Wire Buffer only after B reliably packages A’s footage.

| Engine | Job |
|---|---|
| **Sheets / PBVita-Lab-*** | Which unique lab subject today |
| **Grok** | Unique 15s @ 1080p |
| **Creatomate (separate WF)** | 45–60s loop + text |

## Subjects + quality (non-negotiable)

- Lab items: `sheets/9-lab-item-creations-500.csv`  
- Premium equipment / vials / powders / sterile labs — **no boxes/trays**  
- Labels (when present) = real compounds (BPC-157, NAD+, …)  
- No motif / LAB-### / 000/500 on-product text  

## What counts as done (Workflow A)

- Unique still + 15s video for that `creation_id`  
- `sheets_update_creation` wrote `times_used` + `last_used_at`  
- Next run picks a **different** creation  

## Distribution (next week)

- Buffer → Facebook, Instagram, TikTok, X — after Creatomate package is reliable  

## Canonical how-tos

- Grok nodes: `n8n-build-grok-imagine-video-nodes.md`  
- Sheets writeback: `n8n-sheets-update-creation.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate (WF B): `n8n-creatomate-5-facts-mods.md` / `n8n-45s-reel-grok-creatomate.md`  
