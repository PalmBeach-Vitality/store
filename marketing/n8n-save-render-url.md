# Fix `Save_render_URL` — IG/FB image workflow

**Workflow:** live spotlight / Buffer daily (IG feed + FB feed + stories)  
**Node:** Edit Fields · name exactly **`Save_render_URL`**  
**Scenes sheet:** `3-image-scenes-150` (Get rows + Update `last_used_date` only)

```text
Get row(s) → … → Parse_Grok
  → GROK_Imagine                 (1:1 feed)
  → Grok_imagine_story           (9:16 story)
  → grok_imagine_reel_still      (9:16 photoreal — only if video path exists)
  → Save_render_URL
  → Buffer_post_IG / Buffer_post_FB / stories
  → Update row in sheet          (3-image-scenes-150 → last_used_date)
```

---

## What’s broken

| Bad pattern | Why |
|---|---|
| Feed/story = `$json.data[0].url` after reel still was inserted | `$json` is the **reel still** → wrong image on IG/FB feed & stories |
| `reel_still_url` = `$('grok_imagine_reel_still')…` | Fails if that node name differs / isn’t paired — shows as a **bad field** |
| Keeping `reel_still_url` on a pure image run with **no** reel-still node | Expression errors and can break the whole Set node |

**Rule:**  
- Feed + story → **named** Imagine nodes  
- Reel still → **`$json`** (Save is wired directly after that node)  
- No reel-still node → **delete** the `reel_still_url` field  

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
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id \|\| $('Limit').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name \|\| $('Limit').item.json.compound_name }}` |

**`reel_still_url` must be `$json…`**, not `$('grok_imagine_reel_still')…`.

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
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id \|\| $('Limit').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name \|\| $('Limit').item.json.compound_name }}` |

**Delete** `reel_still_url` and `still_url` from this node on image-only.

---

## Captions

Generated each run by **Grok → `Parse_Grok`** (`ig_caption_draft` / `fb_caption_draft`), then copied into `Save_render_URL` for Buffer.  
Not stored on `3-image-scenes-150` (that sheet only has `caption_lock` as a constraint).

---

## Sheets writeback — `Update row in sheet`

**After:** Buffer posts succeed  

**Columns on `3-image-scenes-150`:**  
`scene_id`, `scene_category`, `scene_name`, `lab_environment`, `camera`, `lighting`, `product_hero`, `product_form_detail`, `compound_id`, `compound_name`, `canonical_url`, `scene_brief`, `caption_lock`, `status`, `rotation_order`, `last_used_date`

| Setting | Value |
|---|---|
| Sheet | **`3-image-scenes-150`** |
| Operation | Update Row |
| Mapping Column Mode | Map Each Column Manually |
| Column to match on | `scene_id` |

| Field | fx | Value |
|---|---|---|
| `scene_id` (match) | ON | `={{ $('Limit').item.json.scene_id \|\| $('Get row(s) in sheet').item.json.scene_id }}` |
| `last_used_date` | ON | `={{ $now.toISODate() }}` |

**Leave every other column blank.**

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

---

## Smoke test

1. Execute `Save_render_URL` — no red / “bad field” expressions  
2. `spotlight_image_url` ≠ `story_image_url`  
3. Buffer IG feed uses **spotlight**, not reel still  
4. Update row writes `last_used_date` on `3-image-scenes-150` only  

Reply **`save_render ok`** when green.
