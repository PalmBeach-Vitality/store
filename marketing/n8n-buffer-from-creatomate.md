# Buffer after Creatomate (Workflow B)

**Goal:** Wire Buffer after the Creatomate package is ready, and post the **finished** MP4 (not the Grok/catbox source).

**Channels:** Instagram, Facebook, TikTok only — **no X / Twitter**.

---

## Where to attach

```text
… → save_creatomate_url
  → sheets_append_reel
  → buffer_ig_reel
  → buffer_fb_reel
  → buffer_tiktok
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
| 4 | `Buffer_post_IG` | IG feed post (if used) |
| 5 | `Buffer_post_FB` | FB feed post (if used) |
| 6 | `Buffer_IG_story` | IG story |
| 7 | `Buffer_FB_story` | FB story |
| 8 | `sheets_update_buffer` | Mark `used_in_buffer = yes` + Buffer IDs |

---

## What to copy

From the **other / live** workflow, select + copy:

- `buffer_ig_reel`
- `buffer_fb_reel`
- `buffer_tiktok`
- `Buffer_post_IG` / `Buffer_post_FB` (if used)
- `Buffer_IG_story` / `Buffer_FB_story` (optional)

Paste into **`PBVita — Creatomate Package`**.  
Keep the same Buffer credentials / channel IDs. Do **not** add `buffer_x`.

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
3. **Channel** = correct `channelId` for that platform
4. **Mode** = Add to Queue (safer) or Share Now (if you already do that)
5. Instagram scheduling type = whatever already works on the other WF (Automatic vs Notification)

If a node expects binary upload: keep your existing pattern, but the source URL for download must be `save_creatomate_url.video_url`.

### Fix: `Invalid ChannelId` / `PASTE_YOUR_EXISTING_IG_CHANNEL_ID`

That string is a **placeholder**, not a real Buffer channel. Replace it in every Buffer body.

**Get real IDs:** POST to `https://api.buffer.com` with your Bearer token → list orgs → list channels → match `service`.

| Node | `channelId` |
|---|---|
| `buffer_ig_reel` / `Buffer_IG_story` | `6a668d534b2d03035f478536` |
| `buffer_fb_reel` / `Buffer_FB_story` | your Facebook id (`service: facebook`) |
| `buffer_tiktok` | `6a642435bac606503d410801` |

**Palm Beach Vitality — known IDs**

| Channel | `channelId` |
|---|---|
| Instagram | `6a668d534b2d03035f478536` |
| TikTok | `6a642435bac606503d410801` |
| Facebook | entered in n8n (`service: facebook`) |

```js
// buffer_ig_reel / Buffer_IG_story
channelId: '6a668d534b2d03035f478536'

// buffer_tiktok
channelId: '6a642435bac606503d410801'
```

IG / FB / TikTok each need their own id. **No X / Twitter.**

---

## After Buffer succeeds — `sheets_update_buffer`

**Node:** `sheets_update_buffer`  
**Type:** Google Sheets → Update Row  
**Sheet:** `4-reel-queue`

After Buffer HTTP nodes, **`$json` is the Buffer response** — not Creatomate.  
Always pull match + IDs from **named nodes** with `$('…').first().json`.

| Setting | Value |
|---|---|
| Column to Match On | `creatomate_render_id` |
| Value to Match | `={{ $('save_creatomate_url').first().json.creatomate_render_id }}` |
| `used_in_buffer` | `yes` |
| `buffer_ig_reel_id` | `={{ $('buffer_ig_reel').first().json.data.createPost.post.id }}` |
| `buffer_fb_reel_id` | `={{ $('buffer_fb_reel').first().json.data.createPost.post.id }}` |
| `buffer_tiktok_id` | `={{ $('buffer_tiktok').first().json.data.createPost.post.id }}` |

**Do not use** `$json.creatomate_render_id` here — it is usually `null` → warning *“The value of column to match is null or undefined”* and no row updates.

### If Buffer ID columns stay `""`

1. Open `buffer_ig_reel` output in the same execution  
2. Confirm you see `data.createPost.post.id` (success)  
3. If you see `MutationError` / `errors` instead — Buffer never created a post; fix that node first  
4. If the path differs (e.g. array wrapper), adjust the expression to match the real JSON tree  

If `4-reel-queue` doesn’t have Buffer ID columns yet, add:

`buffer_ig_reel_id`, `buffer_fb_reel_id`, `buffer_tiktok_id`

(No `buffer_x_id`.)

---

## Smoke test

1. Run Workflow B through Creatomate → confirm `save_creatomate_url.video_url` opens  
2. Execute Buffer nodes (or full run)  
3. Check Buffer queue for IG / FB / TikTok with the **packaged** video + caption  
4. Confirm Sheet `used_in_buffer` flips to `yes` if you added the update node  

---

## Troubleshooting: only Facebook in queue / no captions

### A) Check each Buffer node output (same execution)

Open **`buffer_ig_reel`**, **`buffer_fb_reel`**, **`buffer_tiktok`** one by one.

| Response | Meaning |
|---|---|
| `data.createPost.post.id` | Success — look in that channel’s **Queue** (and **Drafts**) |
| `MutationError` / `errors[].message` | Failed — that platform never queued |
| Node red / skipped | Fix channelId, auth, or wire order |

FB can succeed while IG/TikTok fail silently if **Continue On Fail** is ON.

### B) Caption empty on Buffer posts

Every Buffer body needs a non-empty **`text`** field. Do **not** use `$json.ig_caption_draft` after Buffer/Sheets (often missing).

Use this on **all three** Buffer nodes:

```text
={{ $('video_url_input').first().json.product_name + ' — For laboratory research use only. Not for human use or consumption.\n\nwww.palmbeach-vitality.store' }}
```

### C) Instagram Reel body (common miss)

IG often needs reel metadata + video asset. Example variables shape:

```js
{
  text: $('video_url_input').first().json.product_name + ' — For laboratory research use only. Not for human use or consumption.\n\nwww.palmbeach-vitality.store',
  channelId: '6a668d534b2d03035f478536',
  schedulingType: 'automatic',
  mode: 'addToQueue',
  assets: [{
    video: {
      url: $('save_creatomate_url').first().json.video_url,
      metadata: { thumbnailOffset: 1000 }
    }
  }],
  metadata: {
    instagram: {
      type: 'reel',
      shouldShareToFeed: true
    }
  }
}
```

Stories use `type: 'story'` on the story nodes — different from reels.

### D) TikTok body

```js
{
  text: /* same caption as above */,
  channelId: '6a642435bac606503d410801',
  schedulingType: 'automatic',
  mode: 'addToQueue',
  assets: [{
    video: {
      url: $('save_creatomate_url').first().json.video_url,
      metadata: { thumbnailOffset: 1000 }
    }
  }]
}
```

Video URL must be **Creatomate** (`save_creatomate_url.video_url`), not catbox/Grok.

### E) On-video Creatomate captions missing

If the **MP4** has no Intro/Facts:

1. Open render `modifications` — `Intro-Text.text` / `Fact-*-text.text` must be non-empty  
2. In the template, confirm those text layers are **visible** on the timeline for the full length (not duration 0 / off-canvas / under a cover)  
3. `product_name` must match Sheet 10 exactly enough for `pick_text` (e.g. `CJC` vs `CJC (no DAC)/Ipamorelin`)

---

## Do not

- Point Buffer at `vidgen.x.ai` or raw Grok URLs  
- Post without the research-only disclaimer in the caption  
- Add X / Twitter nodes  
- Edit Buffer credentials on the **other** live workflow while testing — copy nodes, don’t break the source WF  
