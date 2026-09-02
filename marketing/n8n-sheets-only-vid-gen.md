# Sheets-only vid gen (no hardcoded creative inputs)

**Rule:** prompts, cameras, edit text, models, duration, resolution, aspect — **all from Google Sheets**.  
Nodes only map sheet fields, call APIs, or write results back.

**Allowed non-sheet values:** runtime URLs from API responses (`still_url`, `video_url`, `request_id`).

---

## Sheet tabs

| Tab | Role |
|---|---|
| `9-lab-item-creations-500` | Daily path — still prompt, motion, cameras, models, `still_edit_prompt` |
| `12-import-still-queue` | Import path — public `still_url` + motion/edit/models in the **sheet** |

---

## Daily path (original — no `map_sheet_fields`)

```text
get_reel_creations → filter Active → pick_creation
  → grok_imagine_reel_still
  → save_still_url
  → still_edit_instructions → if_still_edit → …
  → prep_grok_video_start → grok_video_start → …
```

Still body from `pick_creation` sheet fields:

```text
={{ JSON.stringify({ model: $json.model_still, prompt: $json.video_prompt, n: 1, aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}
```

---

## Import / sheet-pull path (SEPARATE)

```text
Manual_Trigger_Import
  → import_still_url              (Sheets Get: 12-import-still-queue)
  → filter_import_active → limit_import_1
  → map_sheet_fields
  → save_still_url
  → still_edit_instructions       ← joins daily here
  → if_still_edit → …
  → prep_grok_video_start → grok_video_start → …
```

**Do not** put `map_sheet_fields` on the daily Grok-still path.  
Paste guide: **`n8n-import-still-url.md`**

---

## Import nodes (quick)

### `import_still_url`

```text
Manual_Trigger_Import → **import_still_url** → filter_import_active → limit_import_1 → map_sheet_fields
```

Google Sheets Get Row(s) · Sheet **`12-import-still-queue`** · Return All **ON**

### `map_sheet_fields`

```text
limit_import_1 → **map_sheet_fields** → save_still_url
```

Edit Fields · Include Other Input Fields **ON** · all fx **ON**:

| Name | Value |
|---|---|
| `still_url` | `={{ $json.still_url }}` |
| `creation_id` | `={{ $json.creation_id }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt }}` |
| `still_edit_prompt` | `={{ $json.still_edit_prompt \|\| '' }}` |
| `model_still` | `={{ $json.model_still }}` |
| `model_video` | `={{ $json.model_video }}` |
| `duration_seconds` | `={{ Number($json.duration_seconds) }}` |
| `resolution` | `={{ $json.resolution }}` |
| `aspect_ratio` | `={{ $json.aspect_ratio }}` |
| `camera_move` | `={{ $json.camera_move \|\| '' }}` |

### `save_still_url` (import branch)

```text
map_sheet_fields → **save_still_url** → still_edit_instructions
```

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url }}` |
| `creation_id` | ON | `={{ $json.creation_id }}` |
| `video_motion_prompt` | ON | `={{ $json.video_motion_prompt }}` |
| `still_edit_prompt` | ON | `={{ $json.still_edit_prompt \|\| '' }}` |
| `model_video` | ON | `={{ $json.model_video }}` |
| `duration_seconds` | ON | `={{ $json.duration_seconds }}` |
| `resolution` | ON | `={{ $json.resolution }}` |
| `aspect_ratio` | ON | `={{ $json.aspect_ratio }}` |
| `model_still` | ON | `={{ $json.model_still }}` |
| `camera_move` | ON | `={{ $json.camera_move }}` |

Daily path keeps its own `save_still_url` after Grok (`still_url = $json.data[0].url` + pick fields). Both branches wire **into** `still_edit_instructions`.

---

## Shared from `still_edit_instructions` onward

`still_edit_prompt` / `video_motion_prompt` / models / duration / resolution must already be on the item from Sheet 9 (`pick_creation`) or Sheet 12 (`map_sheet_fields`).

- `if_still_edit` — sheet `still_edit_prompt` not empty  
- `prep_still_edit` — `n8n-code-prep-still-edit.js`  
- `download_still` — GET `$json.still_url` as a file (imgen.x.ai expires; xAI edits 404 those URLs)
- `grok_imagine_edit_still` — JSON `={{ $json.still_edit_body_json }}` (data URI, not the temp URL)  
- `save_edited_still_url` → `prep_grok_video_start` → `grok_video_start`

Prep video body (sheets only):

```text
={{ JSON.stringify({ model: $json.model_video || $('map_sheet_fields').item?.json?.model_video || $('pick_creation').item.json.model_video, prompt: $json.video_motion_prompt || $('map_sheet_fields').item?.json?.video_motion_prompt || $('pick_creation').item.json.video_motion_prompt, image: { url: $json.still_url }, duration: Number($json.duration_seconds || $('map_sheet_fields').item?.json?.duration_seconds || $('pick_creation').item.json.duration_seconds), resolution: $json.resolution || $('map_sheet_fields').item?.json?.resolution || $('pick_creation').item.json.resolution }) }}
```

---

## CSVs

- https://github.com/PalmBeach-Vitality/store/blob/cursor/creatomate-url-set-workflow-4c4b/marketing/sheets/9-lab-item-creations-500.csv  
- https://github.com/PalmBeach-Vitality/store/blob/cursor/creatomate-url-set-workflow-4c4b/marketing/sheets/12-import-still-queue.csv  
