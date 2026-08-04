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

## Sheets writeback — `Update row in sheet`

**After:** Buffer posts succeed  

### Target tab (image workflow)

**Columns on `3-image-scenes-150` (only these):**  
`scene_id`, `scene_category`, `scene_name`, `lab_environment`, `camera`, `lighting`, `product_hero`, `product_form_detail`, `compound_id`, `compound_name`, `canonical_url`, `scene_brief`, `caption_lock`, `status`, `rotation_order`, `last_used_date`

| Setting | Value |
|---|---|
| Document | PB Vitality spreadsheet that **contains** the tab |
| Sheet | **`3-image-scenes-150`** |
| Operation | Update Row |
| Mapping Column Mode | Map Each Column Manually |
| Column to match on | `scene_id` |

### Values to Update — only these two

| Field | fx | Value |
|---|---|---|
| `scene_id` (match) | ON | `={{ $('Limit').item.json.scene_id \|\| $('Get row(s) in sheet').item.json.scene_id }}` |
| `last_used_date` | ON | `={{ $now.toISODate() }}` |

**Leave every other column blank** — do not write `scene_category`, `scene_name`, `lab_environment`, Buffer ids, image URLs, captions, etc. into this tab.

Buffer post ids / image URLs / captions live on `Save_render_URL` + Buffer nodes (and optionally a separate compounds writeback), **not** on `3-image-scenes-150`.

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
