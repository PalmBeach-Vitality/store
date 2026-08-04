# Fix `Save_render_URL` — IG/FB image workflow

**Workflow:** live spotlight / Buffer daily (IG feed + FB feed + stories)  
**Node:** Edit Fields · name exactly **`Save_render_URL`**

```text
GROK_Imagine                 (1:1 feed)
  → Grok_imagine_story       (9:16 story)
  → grok_imagine_reel_still  (9:16 photoreal — only if video path exists)
  → Save_render_URL
  → Buffer_post_IG / Buffer_post_FB / stories
```

---

## What’s broken

| Bad pattern | Why |
|---|---|
| Feed/story = `$json.data[0].url` after reel still was inserted | `$json` is the **reel still** → wrong image on IG/FB feed & stories |
| `reel_still_url` = `$('grok_imagine_reel_still')…` | Fails if that node name differs / isn’t paired — shows as a **bad field** in Edit Fields |
| Keeping `reel_still_url` on a pure image run with **no** reel-still node | Expression errors and can break the whole Set node |
| `posts_this_week` on `Save_render_URL` using `$json.posts_this_week` | After Imagine, `$json` has **no** sheet count → bad field / always `1` |

**Rule:**  
- Feed + story → **named** Imagine nodes  
- Reel still → **`$json`** (Save is wired directly after that node)  
- No reel-still node → **delete** the `reel_still_url` field  
- `posts_this_week` → **Sheets writeback only** (not Save_render_URL)

---

## A) Image + video canvas (reel still exists)

Wire: `… → grok_imagine_reel_still → Save_render_URL`

| Name | Value (fx ON) |
|---|---|
| `spotlight_image_url` | `={{ $('GROK_Imagine').item.json.data[0].url }}` |
| `feed_image_url` | `={{ $('GROK_Imagine').item.json.data[0].url }}` |
| `story_image_url` | `={{ $('Grok_imagine_story').item.json.data[0].url }}` |
| `reel_still_url` | `={{ $json.data[0].url \|\| $json.url }}` |
| `still_url` | `={{ $json.data[0].url \|\| $json.url }}` |
| `ig_caption_draft` | `={{ String($('Parse_Grok').item.json.ig_caption_draft \|\| '').replaceAll('\\n', '\n') }}` |
| `fb_caption_draft` | `={{ String($('Parse_Grok').item.json.fb_caption_draft \|\| '').replaceAll('\\n', '\n') }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name \|\| $('Parse_Grok').item.json.display_name }}` |

**`reel_still_url` must be `$json…`**, not `$('grok_imagine_reel_still')…`.  
`still_url` is the same URL (alias for `prep_grok_video_start` / Seedance).

If your reel-still node has a different name, either rename it to match the wire above, **or** keep `reel_still_url` on `$json` and don’t reference the old name.

---

## B) Image-only canvas (no reel still / no video)

Wire: `… → Grok_imagine_story → Save_render_URL → Buffer_post_IG …`

| Name | Value (fx ON) |
|---|---|
| `spotlight_image_url` | `={{ $('GROK_Imagine').item.json.data[0].url }}` |
| `feed_image_url` | `={{ $('GROK_Imagine').item.json.data[0].url }}` |
| `story_image_url` | `={{ $json.data[0].url \|\| $json.url }}` |
| `ig_caption_draft` | `={{ String($('Parse_Grok').item.json.ig_caption_draft \|\| '').replaceAll('\\n', '\n') }}` |
| `fb_caption_draft` | `={{ String($('Parse_Grok').item.json.fb_caption_draft \|\| '').replaceAll('\\n', '\n') }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name \|\| $('Parse_Grok').item.json.display_name }}` |

**Delete** `reel_still_url` and `still_url` from this node — they are the bad fields on image-only.

**Also delete from `Save_render_URL`:** `posts_this_week`, `week_start_date`, `last_spotlight_date` — those belong on **`Update row in sheet`** after Buffer succeeds.

---

## `posts_this_week` — Sheets writeback (not Save)

**Node:** `Update row in sheet` (end of IG/FB image workflow)  
**After:** Buffer posts succeed  
**Match on:** `compound_id`

| Column | Value (fx ON) |
|---|---|
| `posts_this_week` | `={{ Number($('Prep_day_variant').item.json.posts_this_week \|\| $('Limit').item.json.posts_this_week \|\| $('Get row(s) in sheet').item.json.posts_this_week \|\| 0) + 1 }}` |
| `last_spotlight_date` | `={{ $now.toISODate() }}` |
| `feed_image_url` | `={{ $('Save_render_URL').item.json.feed_image_url \|\| $('Save_render_URL').item.json.spotlight_image_url }}` |
| `story_image_url` | `={{ $('Save_render_URL').item.json.story_image_url }}` |
| `ig_caption_draft` | `={{ $('Save_render_URL').item.json.ig_caption_draft }}` |
| `fb_caption_draft` | `={{ $('Save_render_URL').item.json.fb_caption_draft }}` |

Optional Buffer ids:

| Column | Value |
|---|---|
| `buffer_ig_post_id` | `={{ $('Buffer_post_IG').item.json.data.createPost.post.id }}` |
| `buffer_fb_post_id` | `={{ $('Buffer_post_FB').item.json.data.createPost.post.id }}` |
| `buffer_tiktok_post_id` | `={{ $('Buffer_post_TikTok').item.json.data.createPost.post.id \|\| $('buffer_tiktok').item.json.data.createPost.post.id }}` |

If your TikTok node name is exact (check canvas), prefer the single match — e.g. only:

```text
={{ $('Buffer_post_TikTok').item.json.data.createPost.post.id }}
```

or only:

```text
={{ $('buffer_tiktok').item.json.data.createPost.post.id }}
```

**Do not** use `$json.posts_this_week` on writeback if `$json` is a Buffer response — that is also a bad field.

Sheet columns: `week_start_date`, `posts_this_week` on `1-compounds-all-daily` (see `n8n-weekly-sheets-rotation.md`).

---

## Downstream Buffer (image posts)

| Node | Image | Caption |
|---|---|---|
| `Buffer_post_IG` | `spotlight_image_url` | `ig_caption_draft` |
| `Buffer_post_FB` | `spotlight_image_url` | `fb_caption_draft` |
| `Buffer_IG_story` | `story_image_url` | `ig_caption_draft` + IG `type: 'story'` |
| `Buffer_FB_story` | `story_image_url` | `fb_caption_draft` + FB `type: 'story'` |

| Channel | channelId |
|---|---|
| Instagram | `6a668d534b2d03035f478536` |
| Facebook | `6a668d6b4b2d03035f478575` |

Video start (if present) uses:

```text
image / still = $('Save_render_URL').item.json.still_url
             || $('Save_render_URL').item.json.reel_still_url
```

---

## Smoke test

1. Execute `Save_render_URL` — no red / “bad field” expressions (`reel_still_url` + no `posts_this_week` here)  
2. `spotlight_image_url` ≠ `story_image_url`  
3. If video path: `reel_still_url` / `still_url` is https and looks photoreal (not the feed graphic)  
4. Buffer IG feed preview uses **spotlight**, not reel still  
5. After Buffer → writeback: `posts_this_week` increments from the sheet value (not stuck at `1` / undefined)  

Reply **`save_render ok`** when green.
