# Buffer after Creatomate (Workflow B)

**Goal:** Copy your working Buffer nodes from the other workflow, wire them after the Creatomate package is ready, and post the **finished** MP4 (not the Grok source).

---

## Where to attach

```text
… → save_creatomate_url
  → sheets_append_reel
  → buffer_ig_reel
  → buffer_fb_reel
  → buffer_tiktok
  → buffer_x
  → Buffer_post_IG
  → Buffer_post_FB
  → Buffer_IG_story
  → Buffer_FB_story
  → sheets_update_buffer
```

---

## Full Buffer sequence (after `sheets_append_reel`)

| # | Node name | Role |
|---|---|---|
| 1 | `buffer_ig_reel` | Instagram Reel |
| 2 | `buffer_fb_reel` | Facebook Reel |
| 3 | `buffer_tiktok` | TikTok video |
| 4 | `buffer_x` | X (Twitter) video/post |
| 5 | `Buffer_post_IG` | IG feed post (if used) |
| 6 | `Buffer_post_FB` | FB feed post (if used) |
| 7 | `Buffer_IG_story` | IG story |
| 8 | `Buffer_FB_story` | FB story |
| 9 | `sheets_update_buffer` | Mark `used_in_buffer = yes` + Buffer IDs |

Copy from the other workflow when those nodes exist; otherwise duplicate an existing Buffer video node and switch the **channel** to TikTok / X.

---

## What to copy

From the **other / live** workflow, select + copy the Buffer chain:

- `buffer_ig_reel`
- `buffer_fb_reel`
- `buffer_tiktok` (or create from a Buffer video node → TikTok channel)
- `buffer_x` (or create from a Buffer video/post node → X channel)
- `Buffer_post_IG` / `Buffer_post_FB` (if used)
- `Buffer_IG_story` / `Buffer_FB_story` (optional)

Paste into **`PBVita — Creatomate Package`**.  
Keep the same Buffer credentials / channel IDs.

---

## Remap these fields (important)

Every expression that used to point at Grok / `save_video_url` / `Parse_Grok` must point at Workflow B nodes.

| Purpose | Old (other WF) | New (Workflow B) |
|---|---|---|
| Video file URL | `$('save_video_url')…` / Grok URL | `$('save_creatomate_url').item.json.video_url` |
| Thumbnail / still | Grok still URL | `$('save_creatomate_url').item.json.creatomate_snapshot_url` |
| Caption | `$('Parse_Grok')…ig_caption_draft` | `$('save_creatomate_url').item.json.ig_caption_draft` **or** build below |
| Product name | Parse compound | `$('video_url_input').item.json.product_name` |

**Use the Creatomate Backblaze URL** (`video_url`).  
Do **not** send `public_video_url` (Grok/catbox source) to Buffer.

### Caption if missing on save

Add to `save_creatomate_url` (or set on the Buffer text field):

```text
={{ $('video_url_input').item.json.product_name + ' — For laboratory research use only. Not for human use or consumption.\n\nwww.palmbeach-vitality.store' }}
```

---

## Typical Buffer node checks

For each Buffer / HTTP Buffer node:

1. **Video URL** = `={{ $('save_creatomate_url').item.json.video_url }}`
2. **Text / caption** = FDA-safe caption (product + research-only + site)
3. **Channel** = same IG (and FB) channel as the other workflow
4. **Mode** = Add to Queue (safer) or Share Now (if you already do that)
5. Instagram scheduling type = whatever already works on the other WF (Automatic vs Notification)

If a node expects binary upload: keep your existing pattern, but the source URL for download must be `save_creatomate_url.video_url`.

---

## After Buffer succeeds (optional Sheets update)

**Node:** `sheets_update_buffer`  
**Type:** Google Sheets → Update Row  
**Sheet:** `4-reel-queue`

| Setting | Value |
|---|---|
| Column to Match On | `creatomate_render_id` |
| Value to Match | `={{ $('save_creatomate_url').item.json.creatomate_render_id }}` |
| `used_in_buffer` | `yes` |
| `buffer_ig_reel_id` | from `buffer_ig_reel` response id |
| `buffer_fb_reel_id` | from `buffer_fb_reel` response id |
| `buffer_tiktok_id` | from `buffer_tiktok` response id |
| `buffer_x_id` | from `buffer_x` response id |

If `4-reel-queue` doesn’t have Buffer ID columns yet, add:

`buffer_ig_reel_id`, `buffer_fb_reel_id`, `buffer_tiktok_id`, `buffer_x_id`

---

## Smoke test

1. Run Workflow B through Creatomate → confirm `save_creatomate_url.video_url` opens  
2. Execute only the Buffer nodes (or full run)  
3. Check Buffer queue for IG Reel with the **packaged** video + caption  
4. Confirm Sheet `used_in_buffer` flips to `yes` if you added the update node  

---

## Do not

- Point Buffer at `vidgen.x.ai` or raw Grok URLs  
- Post without the research-only disclaimer in the caption  
- Edit Buffer credentials on the **other** live workflow while testing — copy nodes, don’t break the source WF  
