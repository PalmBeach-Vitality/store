# 45–60s reel = Grok unique footage + Creatomate text

## Goal
Daily **45–60 second** reel: unique lab-item video (Grok) + text info (Creatomate).

## Smooth vs jumpy

| Method | Result |
|---|---|
| **Grok `/v1/videos/extensions`** from last frame | **Smooth** continuous clip (same scene continues) |
| Stitching different Grok clips / different lab items | **Jumpy** scene changes |
| Creatomate template bed only | Smooth but **not unique** |

**Use extension** (same subject, continue motion) to grow 15s → ~45–60s, then hand **one** MP4 to Creatomate.

Rough length math (approx):
- Generate **15s** → extend **+10s** → extend **+10s** → extend **+10s** ≈ **45s**
- One more extend ≈ **55–60s**

(Extension `duration` is the **added** segment only; confirm model/endpoint accepts your source URL.)

## Pipeline

```text
pick_creation
  → grok_imagine_reel_still          (2k, lab video_prompt)
  → save_still_url
  → grok_video_start                 (15s, 1080p, 9:16)
  → wait / poll until done
  → grok_video_extend_1              (POST extensions, +10s)
  → wait / poll
  → grok_video_extend_2              (+10s)
  → wait / poll
  → grok_video_extend_3              (+10s)  → ~45s
  → (optional extend_4 for ~55–60s)
  → map_creatomate_mods              (mod_intro, mod_fact_1…5 from Parse)
  → creatomate_render                (source = extended Grok URL + text mods)
  → wait / status / save
  → sheets_update_reel + sheets_update_creation
```

## Creatomate role

- Template timeline **45–60s** (or stretch source to fit)
- Modifications:
  - **Video/image source** = extended Grok `video_url` (exact element name from your template — inspect in Creatomate)
  - **Text** = `Intro-Text.text`, `Fact-1.text` … `Fact-5.text` (lowercase n8n fields `mod_intro`, `mod_fact_*`)
- Creatomate must **not** be the only visual; if source mod is empty you get the old default reel look

## Extension request shape (n8n Raw JSON)

Endpoint (confirm in xAI docs if renamed): `POST https://api.x.ai/v1/videos/extensions`

```text
={{ JSON.stringify({
  model: 'grok-imagine-video',
  prompt: 'Continue the same laboratory research catalog scene with slow cinematic camera motion, same product, photoreal, keep subject sharp, no people, no hands, no needles. For laboratory research use only.',
  video: { url: $json.video.url || $json.url },
  duration: 10
}) }}
```

Use the same Raw `application/json` body pattern that worked for `grok_video_start`.  
Poll with the returned `request_id` like video generate.

> Note: some docs say extension uses model `grok-imagine-video` (not `1.5`). If `1.5` errors on extend, switch model for **extend nodes only**.

## Order of work

1. Finish Grok generate at **15s** + save URL (you’re here)  
2. Add extend loop to ~45–60s (smooth)  
3. Reconnect Creatomate with **Grok URL as media source** + text mods  
4. Verify final MP4 is unique footage + readable facts  

## PBVita’s job in this

**PBVita / Sheets / `PBVita-Lab-*`** = pick today’s unique lab variables.  
**Grok** = make the unique moving picture.  
**Creatomate** = package length + text on top.
