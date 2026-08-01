# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

## The main goal (current)

Produce a **45–60 second** Instagram-ready reel **every day** that is:

1. **Visually unique** — Grok Imagine (still `2k` + video) from the **500 lab-item** variables  
2. **Text on reel** — Creatomate burns research copy (Intro / Facts) onto that unique footage  
3. **Highest quality** — `grok-imagine-image-quality` + `2k`; video `grok-imagine-video-1.5` / extension at max allowed resolution  
4. **FDA-safe** — laboratory research catalog only; no people/hands/injection/lifestyle/wellness/nicknames  

If the reel is only Creatomate’s default template bed with new text, **the goal is not met.**  
If the reel is unique Grok footage with **no** text package, it’s incomplete for this goal.

## Architecture (Grok + Creatomate)

```text
pick_creation (500 lab items)
  → grok_imagine_reel_still          (unique 9:16 still, 2k)
  → grok_video_start                 (~15s unique motion)
  → extend × N                       (continue from last frame → ~45–60s smooth)
  → map_creatomate_mods              (Intro + Fact text from Parse_Grok)
  → creatomate_render                (unique video as source + text overlays, 45–60s)
  → save + sheets
```

| Engine | Job |
|---|---|
| **Sheets / PBVita-Lab-*** | Which unique lab subject today |
| **Grok Imagine + video (+ extend)** | Unique moving footage, ideally one continuous scene |
| **Creatomate** | Duration/timeline + on-screen text (not the visual identity) |

## Smoothness

- **Grok video extension** continues from the **last frame** → one continuous clip (not scene-to-scene jumps).  
- **Do not** stitch unrelated Grok generations back-to-back if you want smooth.  
- Creatomate should use **one** extended Grok MP4 as the bed, then overlay text.

## Subjects + quality (non-negotiable)

- Lab items only: `sheets/9-lab-item-creations-500.csv` (`n8n-lab-items-500.md`)  
- Still: `grok-imagine-image-quality`, `resolution: "2k"`, `9:16`  
- No abstract orbs / surreal CGI  

## What counts as done

- One run → one **45–60s** MP4  
- Footage unique to that day’s `creation_id` / lab item  
- Text overlays present (Intro + Facts)  
- Sheets updated (`video_url`, creation `times_used`)  

## Out of scope until the 45–60s reel works

- Buffer auto-posting  

## Canonical how-tos

- Unique Grok path: `n8n-unique-reel-video.md` / `n8n-build-grok-imagine-video-nodes.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate text: `n8n-creatomate-5-facts-mods.md`  
- Combined 45–60s plan: `n8n-45s-reel-grok-creatomate.md`
