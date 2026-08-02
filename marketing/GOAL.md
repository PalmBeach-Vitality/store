# Palm Beach Vitality — Reel Studio GOAL

**Owner:** Salvatore  

## The main goal (current)

Produce a **45–60 second** Instagram-ready reel **every day** that is:

1. **Visually unique** — Grok Imagine (still `2k` + video) from the **500 lab-item** variables  
2. **Text on reel** — Creatomate burns **daily-unique** research copy (`mod_intro` + `mod_fact_1`…`5` from the **1000-row** text library; not static Parse bullets) onto that unique footage  
3. **Highest quality** — `grok-imagine-image-quality` + `2k`; video `grok-imagine-video-1.5` / extension at max allowed resolution  
4. **FDA-safe** — laboratory research catalog only; no people/hands/injection/lifestyle/wellness/nicknames  

If the reel is only Creatomate’s default template bed with new text, **the goal is not met.**  
If the reel is unique Grok footage with **no** text package, it’s incomplete for this goal.

## Architecture (Grok + Creatomate)

```text
pick_creation (500 lab items — least-used + unique camera_move)
  → grok_imagine_reel_still          (unique 9:16 still from video_prompt, 2k)
  → grok_video_start                 (unique motion from video_motion_prompt — never hardcoded orbit)
  → grok_video_extend_1              (+10s → ~25s; source must be ≤15s)
  → map_creatomate_mods              (Intro + Fact text from Parse_Grok)
  → creatomate_render                (45–60s timeline; Grok URL as video source + text)
  → save + sheets
```

**Grok hard limit:** extend input ≤ **15s**. After one extend (~25s), further extends fail.  
**45–60s** = Creatomate template timeline (loop/fit the Grok bed) + text — not extend_2/3/4.

| Engine | Job |
|---|---|
| **Sheets / PBVita-Lab-*** | Which unique lab subject today |
| **Grok Imagine + video (+ 1 extend)** | Unique moving footage (~15–25s) |
| **Creatomate** | 45–60s package + on-screen text |

## Smoothness

- One generate + **one** extend = longest smooth unique Grok clip (~25s).  
- Creatomate uses that single clip as the bed across 45–60s (loop/fit on the video element) + text overlays.

## Subjects + quality (non-negotiable)

- Lab items only: `sheets/9-lab-item-creations-500.csv` (`n8n-lab-items-500.md`)  
- Still: `grok-imagine-image-quality`, `resolution: "2k"`, `9:16`  
- No abstract orbs / surreal CGI  

## What counts as done

- One run → one **45–60s** MP4  
- Footage unique to that day’s `creation_id` / lab item  
- Text overlays present (Intro + Facts)  
- Sheets updated (`video_url`, creation `times_used`)  

## Distribution (next week)

- Run this workflow **once per day**
- Post final reel via **Buffer** to Facebook, Instagram, TikTok, and Twitter/X
- Do not wire Buffer until the daily Grok + Creatomate MP4 is reliable

## Out of scope until the 45–60s reel works

- Buffer auto-posting (scheduled for following week once render path is stable)  


## Canonical how-tos

- Unique Grok path: `n8n-unique-reel-video.md` / `n8n-build-grok-imagine-video-nodes.md`  
- Lab items: `n8n-lab-items-500.md`  
- Creatomate text: `n8n-creatomate-5-facts-mods.md`  
- Combined 45–60s plan: `n8n-45s-reel-grok-creatomate.md`
