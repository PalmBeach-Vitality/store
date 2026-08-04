# Fix `Save_render_URL` — IG/FB image workflow

**Workflow:** live spotlight / Buffer daily (IG feed + FB feed + stories)  
**Node:** Edit Fields · name exactly **`Save_render_URL`**  
**Wire:** after all three Imagine nodes, before Buffer image posts / `grok_video_start`

```text
GROK_Imagine              (1:1 feed)
  → Grok_imagine_story    (9:16 story)
  → grok_imagine_reel_still (9:16 photoreal still for video)
  → Save_render_URL       ← fix fields here
  → Buffer_post_IG / Buffer_post_FB / stories
  → (optional) grok_video_start …
```

---

## What’s broken

After `grok_imagine_reel_still` was inserted **before** `Save_render_URL`, bare `$json.data[0].url` points at the **reel still**, not the feed or story graphic.

| Bad field | Why it’s wrong |
|---|---|
| `story_image_url` = `$json.data[0].url` | Gets reel still (wrong for Stories) |
| `spotlight_image_url` / `feed_image_url` = `$json.data[0].url` | Same — feed posts get reel still |
| Stale `figma_image_url` | HCTI/Figma era — Buffer expects `spotlight_image_url` / `feed_image_url` |
| Wrong node casing | n8n `$('…')` is case-sensitive — use exact canvas names below |

---

## Correct fields (paste these)

Type: **Edit Fields** · Include Other Input Fields: **OFF** (cleaner) or ON if you need upstream keys.

| Name | Value (fx ON) |
|---|---|
| `spotlight_image_url` | `={{ $('GROK_Imagine').item.json.data[0].url }}` |
| `feed_image_url` | `={{ $('GROK_Imagine').item.json.data[0].url }}` |
| `story_image_url` | `={{ $('Grok_imagine_story').item.json.data[0].url }}` |
| `reel_still_url` | `={{ $('grok_imagine_reel_still').item.json.data[0].url }}` |
| `ig_caption_draft` | `={{ String($('Parse_Grok').item.json.ig_caption_draft \|\| '').replaceAll('\\n', '\n') }}` |
| `fb_caption_draft` | `={{ String($('Parse_Grok').item.json.fb_caption_draft \|\| '').replaceAll('\\n', '\n') }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name \|\| $('Parse_Grok').item.json.display_name }}` |

**Never** use bare `$json.data[0].url` for feed or story once reel still is in the chain.

`feed_image_url` aliases `spotlight_image_url` for Sheets writeback (`1-compounds-all-daily` columns).

---

## Downstream Buffer (image posts)

| Node | Image URL field | Caption |
|---|---|---|
| `Buffer_post_IG` | `$('Save_render_URL').item.json.spotlight_image_url` | `ig_caption_draft` |
| `Buffer_post_FB` | `$('Save_render_URL').item.json.spotlight_image_url` | `fb_caption_draft` |
| `Buffer_IG_story` | `$('Save_render_URL').item.json.story_image_url` | `ig_caption_draft` + `metadata.instagram.type: 'story'` |
| `Buffer_FB_story` | `$('Save_render_URL').item.json.story_image_url` | `fb_caption_draft` + `metadata.facebook.type: 'story'` |

Channel IDs:

| Channel | channelId |
|---|---|
| Instagram | `6a668d534b2d03035f478536` |
| Facebook | `6a668d6b4b2d03035f478575` |

---

## Video path (if present)

`grok_video_start` / prep must use:

```text
still / image url = $('Save_render_URL').item.json.reel_still_url
```

Not `spotlight_image_url` (1:1 feed) and not `$json.data[0].url` from the wrong node.

---

## Smoke test

1. Execute through `Save_render_URL`
2. Open output — all three URLs must be different https links:
   - feed / spotlight → square brand graphic  
   - story → 9:16 brand graphic  
   - reel_still → photoreal lab still  
3. Captions show real line breaks (not literal `\n`)
4. Run `Buffer_post_IG` — preview uses **spotlight** image, not the reel still

Reply **`save_render ok`** with the three URLs when green.

---

## Related

- Stories bodies: pep `n8n-buffer-stories.md` (same channel IDs)
- Live canvas names: `n8n-creatomate-reel-studio.md`
- Sheet columns: `sheets/1-compounds-all-daily.csv` (`feed_image_url`, `story_image_url`, `reel_still_url`)
