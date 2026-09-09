# Vid_gen_landscape_scenes (sheets-only)

**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/Kc2HqqjSyiKs87qy  
**Sheet:** `500_Peptide_Wellness_Reel_Scenes` on https://docs.google.com/spreadsheets/d/1S6UQmD4ZFW3oL4vx8BKmhWAZrt7KMGwsBS7jW3S9HPo  
**Rule:** no hardcoding unless Salvatore explicitly asks. Every Grok parameter is a sheet column.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
Schedule Trigger
  → get_reel_creations
  → filter_creations_active
  → pick_creation
  → grok_imagine_reel_still
  → flag_still_edit
  → prep_still_edit
  → grok_imagine_edit_still
  → save_still_url
  → prep_grok_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_video_url
  → sheets_update_creation
```

Caption / IF / Switch leftovers stay on the canvas **disabled**. Do not Publish. Test with Execute.

---

## Sheet columns used as Grok params

| Column | Goes to |
|---|---|
| `video_prompt` | still `prompt` |
| `still_edit_prompt` | image edit `prompt` |
| `video_motion_prompt` | video `prompt` |
| `model_still` | still + edit `model` |
| `model_video` | video `model` |
| `aspect_ratio` | still / edit / video |
| `still_resolution` | still `resolution` |
| `resolution` | video `resolution` |
| `duration_seconds` | video `duration` |
| `still_n` | still `n` |
| `audio` | video `audio` (`TRUE`/`FALSE`) |
| `wait_seconds` | `wait_video` amount |
| `camera_move` | required on the row (must be present) |

Missing cell → Code throws. No `||` fallbacks in HTTP/Set.

---

## Nodes

### `pick_creation`

**Before → this → After:** `filter_creations_active` → **pick_creation** → `grok_imagine_reel_still`  
Paste: `marketing/n8n-code-pick-landscape-creation.js`  
Execute Once **OFF**.

### `grok_imagine_reel_still`

**Before → this → After:** `pick_creation` → **grok_imagine_reel_still** → `flag_still_edit`

| Parameter | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| JSON | **ON** | `={{ JSON.stringify({ model: $json.model_still, prompt: $json.video_prompt, n: Number($json.still_n), aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}` |

### `flag_still_edit` / `prep_still_edit`

Paste `marketing/n8n-code-flag-landscape-still-edit.js` and `marketing/n8n-code-prep-landscape-still-edit.js`.  
Execute Once **OFF**.

### `grok_imagine_edit_still`

**Before → this → After:** `prep_still_edit` → **grok_imagine_edit_still** → `save_still_url`  
JSON **ON** `={{ $json.still_edit_body_json }}`

### `prep_grok_video_start`

**Before → this → After:** `save_still_url` → **prep_grok_video_start** → `grok_video_start`  
Paste: `marketing/n8n-code-prep-landscape-video-start.js`

### `wait_video`

**Before → this → After:** `grok_video_start` → **wait_video** → `grok_video_poll`  
Amount **ON** `={{ Number($('pick_creation').first().json.wait_seconds) }}`

### `save_video_url`

`video_model` / `video_seconds` / `aspect_ratio` from `pick_creation` / `prep_grok_video_start` — not Fixed literals.

---

## One-shot sheet overlay

`overlay_landscape_sheet_params` writes `still_edit_prompt`, `wait_seconds`, `audio`, `still_n` onto existing rows (does not touch `times_used`). Archive after one successful Execute.
