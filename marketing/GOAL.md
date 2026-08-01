# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

## The only goal

Create a **unique video every single day**, driven by the variables Salvatore provided:

**Quality (non-negotiable):** always the **highest** Grok Imagine quality available — model `grok-imagine-image-quality`, image `resolution: "2k"`, video model `grok-imagine-video-1.5` at the highest resolution the API allows for 9:16 (prefer `1080p` when supported; otherwise `720p`). Never use the fast/cheap image model for production reels.

**Subjects (non-negotiable):** image/video variables may use **only** the **250 real lab items** in `sheets/8-lab-items-250.csv` / creations `sheets/9-lab-item-creations-250.csv`. No abstract orbs, surreal glass, CGI spheres, or non-lab fantasy props. See `n8n-lab-items-250.md`.

- 500 unique creations (`7-unique-reel-creations-500`)
- each with unique `scene_id` / `scene_brief`
- 12 quality variables (`quality_suffix`)
- full FDA-framed `video_prompt`
- pick least-used Active creation per run → generate a **new** MP4

If the output is the same Creatomate template bed with only text changed, **the goal is not met.**

## What counts as done

- One workflow run → one new MP4  
- Visual scene differs when `creation_id` / `video_prompt` differs  
- `video_prompt` (from Sheets variables) is what drives generation (Grok Imagine → video)  
- Sheets tracks `times_used` / `last_used_at` on the creation  
- Compound row can store `video_url` for that day  

## Out of scope until unique daily video works

- Buffer auto-posting  
- Creatomate as the primary video engine  
- Figma text editing via API  

Creatomate text overlay is optional **after** unique Grok videos work.

## Canonical how-to

`marketing/n8n-unique-reel-video.md`
