# Sheets-only vid gen (no hardcoded creative inputs)

**Rule:** prompts, cameras, edit text, models, duration, resolution, aspect — **all from Google Sheets**.  
Nodes only map sheet fields, call APIs, or write results back.

**Allowed non-sheet values:** runtime URLs from API responses (`still_url`, `video_url`, `request_id`).

---

## Sheet tabs

| Tab | Role |
|---|---|
| `9-lab-item-creations-500` | Daily path — still prompt, motion, cameras, models, `still_edit_prompt` |
| `12-import-still-queue` | Import path — paste public `still_url` + motion/edit/models in the **sheet**, not in n8n |

CSV files:
- `marketing/sheets/9-lab-item-creations-500.csv`
- `marketing/sheets/12-import-still-queue.csv`

---

## Daily path wire

```text
Manual / Cron
  → get_reel_creations          (Sheets: 9-lab-item-creations-500, Return All)
  → filter_creations_active     (status = Active)
  → pick_creation               (Code — paste n8n-code-pick-creation.js)
  → map_sheet_fields            (Set — copies sheet fields forward)
  → grok_imagine_reel_still     (HTTP — body from sheet fields)
  → save_still_url
  → still_edit_instructions     (Set — still_edit_prompt FROM SHEET)
  → if_still_edit
       true  → prep_still_edit → grok_imagine_edit_still → save_edited_still_url
       false → save_edited_still_url
  → prep_grok_video_start       (Set or Code — motion/model FROM SHEET)
  → grok_video_start
  → wait_video → grok_video_poll → save_video_url
  → sheets_update_creation
```

---

## Import path wire (also sheets-only)

Do **not** paste URLs into Fixed n8n fields. Put them on tab `12-import-still-queue`.

```text
Manual_Trigger_Import
  → get_import_still_rows       (Sheets: 12-import-still-queue, Return All)
  → filter_import_active        (status = Active)
  → limit_import_1              (Limit 1)
  → import_still_from_sheet     (Set — map sheet columns)
  → map_sheet_fields            (same node as daily, or duplicate)
  → still_edit_instructions → … (same from here as daily)
```

---

## New / updated nodes

### `map_sheet_fields`

```text
pick_creation (daily) OR import_still_from_sheet (import) → **map_sheet_fields** → grok_imagine_reel_still OR still_edit_instructions
```

| Setting | Value |
|---|---|
| Type | **Edit Fields** |
| Name | `map_sheet_fields` |
| Include Other Input Fields | **ON** |

All fx **ON** — map from `$json` (sheet row / pick output):

| Name | Value |
|---|---|
| `creation_id` | `={{ $json.creation_id }}` |
| `video_prompt` | `={{ $json.video_prompt }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt }}` |
| `still_edit_prompt` | `={{ $json.still_edit_prompt \|\| '' }}` |
| `model_still` | `={{ $json.model_still }}` |
| `model_video` | `={{ $json.model_video }}` |
| `duration_seconds` | `={{ Number($json.duration_seconds) }}` |
| `resolution` | `={{ $json.resolution }}` |
| `aspect_ratio` | `={{ $json.aspect_ratio }}` |
| `still_resolution` | `={{ $json.still_resolution \|\| '' }}` |
| `camera_move` | `={{ $json.camera_move \|\| '' }}` |
| `shot_family` | `={{ $json.shot_family \|\| '' }}` |
| `camera_angle` | `={{ $json.camera_angle \|\| '' }}` |
| `scene_brief` | `={{ $json.scene_brief \|\| '' }}` |
| `compound_name` | `={{ $json.compound_name \|\| '' }}` |

---

### `grok_imagine_reel_still` (daily only)

```text
map_sheet_fields → **grok_imagine_reel_still** → save_still_url
```

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/images/generations` |
| Body | **JSON** |
| JSON (fx ON) | below |

```text
={{ JSON.stringify({ model: $json.model_still, prompt: $json.video_prompt, n: 1, aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}
```

---

### `save_still_url`

```text
grok_imagine_reel_still → **save_still_url** → still_edit_instructions
```

Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.data[0].url }}` |
| `creation_id` | ON | `={{ $('map_sheet_fields').item.json.creation_id }}` |
| `video_prompt` | ON | `={{ $('map_sheet_fields').item.json.video_prompt }}` |
| `video_motion_prompt` | ON | `={{ $('map_sheet_fields').item.json.video_motion_prompt }}` |
| `still_edit_prompt` | ON | `={{ $('map_sheet_fields').item.json.still_edit_prompt }}` |
| `model_still` | ON | `={{ $('map_sheet_fields').item.json.model_still }}` |
| `model_video` | ON | `={{ $('map_sheet_fields').item.json.model_video }}` |
| `duration_seconds` | ON | `={{ $('map_sheet_fields').item.json.duration_seconds }}` |
| `resolution` | ON | `={{ $('map_sheet_fields').item.json.resolution }}` |
| `aspect_ratio` | ON | `={{ $('map_sheet_fields').item.json.aspect_ratio }}` |
| `camera_move` | ON | `={{ $('map_sheet_fields').item.json.camera_move }}` |

---

### `still_edit_instructions` — **no Fixed edit text**

```text
save_still_url OR import_still_from_sheet → **still_edit_instructions** → if_still_edit
```

Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url \|\| $json.data[0].url }}` |
| `still_edit_prompt` | ON | `={{ $json.still_edit_prompt \|\| $('map_sheet_fields').item.json.still_edit_prompt \|\| '' }}` |
| `creation_id` | ON | `={{ $json.creation_id \|\| $('map_sheet_fields').item.json.creation_id }}` |
| `model_still` | ON | `={{ $json.model_still \|\| $('map_sheet_fields').item.json.model_still }}` |
| `model_video` | ON | `={{ $json.model_video \|\| $('map_sheet_fields').item.json.model_video }}` |
| `video_motion_prompt` | ON | `={{ $json.video_motion_prompt \|\| $('map_sheet_fields').item.json.video_motion_prompt }}` |
| `duration_seconds` | ON | `={{ $json.duration_seconds \|\| $('map_sheet_fields').item.json.duration_seconds }}` |
| `resolution` | ON | `={{ $json.resolution \|\| $('map_sheet_fields').item.json.resolution }}` |
| `aspect_ratio` | ON | `={{ $json.aspect_ratio \|\| $('map_sheet_fields').item.json.aspect_ratio }}` |

Put edit instructions in Sheet column **`still_edit_prompt`**. Leave blank to skip edit (`if_still_edit` false).

---

### `if_still_edit`

```text
still_edit_instructions → **if_still_edit** → true: prep_still_edit \| false: save_edited_still_url
```

Condition (fx ON): `={{ String($json.still_edit_prompt \|\| '').trim() }}` **is not empty**

---

### `prep_still_edit` / `grok_imagine_edit_still`

Paste Code: `n8n-code-prep-still-edit.js`  
HTTP body JSON (fx ON): `={{ $json.still_edit_body_json }}`  
URL: `POST https://api.x.ai/v1/images/edits`

---

### `save_edited_still_url`

```text
if_still_edit (false) + grok_imagine_edit_still → **save_edited_still_url** → prep_grok_video_start
```

Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.data?.[0]?.url \|\| $json.still_url \|\| $('still_edit_instructions').item.json.still_url }}` |
| `video_motion_prompt` | ON | `={{ $('still_edit_instructions').item.json.video_motion_prompt \|\| $('map_sheet_fields').item.json.video_motion_prompt }}` |
| `model_video` | ON | `={{ $('still_edit_instructions').item.json.model_video \|\| $('map_sheet_fields').item.json.model_video }}` |
| `duration_seconds` | ON | `={{ $('still_edit_instructions').item.json.duration_seconds \|\| $('map_sheet_fields').item.json.duration_seconds }}` |
| `resolution` | ON | `={{ $('still_edit_instructions').item.json.resolution \|\| $('map_sheet_fields').item.json.resolution }}` |
| `creation_id` | ON | `={{ $('still_edit_instructions').item.json.creation_id \|\| $('map_sheet_fields').item.json.creation_id }}` |

---

### `prep_grok_video_start` (Edit Fields — sheets only)

```text
save_edited_still_url → **prep_grok_video_start** → grok_video_start
```

Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url }}` |
| `grok_video_body_json` | ON | paste below |

```text
={{ JSON.stringify({ model: $json.model_video || $('map_sheet_fields').item.json.model_video, prompt: $json.video_motion_prompt || $('map_sheet_fields').item.json.video_motion_prompt, image: { url: $json.still_url }, duration: Number($json.duration_seconds || $('map_sheet_fields').item.json.duration_seconds), resolution: $json.resolution || $('map_sheet_fields').item.json.resolution }) }}
```

If any sheet field is empty, fix the **sheet** — do not type a fallback prompt in n8n.

Or paste Code: `n8n-code-prep-grok-video-start.js` (throws if sheet fields missing).

---

### `grok_video_start`

```text
prep_grok_video_start → **grok_video_start** → wait_video
```

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Body | **JSON** |
| JSON (fx ON) | `={{ $json.grok_video_body_json }}` |

---

## Import sheet nodes

### `get_import_still_rows`

```text
Manual_Trigger_Import → **get_import_still_rows** → filter_import_active
```

| Setting | Value |
|---|---|
| Type | Google Sheets → Get Row(s) |
| Sheet | `12-import-still-queue` |
| Return All | **ON** |

### `import_still_from_sheet`

```text
limit_import_1 → **import_still_from_sheet** → map_sheet_fields
```

Edit Fields — map every column from the sheet row (`still_url`, `still_edit_prompt`, `video_motion_prompt`, `model_still`, `model_video`, `duration_seconds`, `resolution`, `aspect_ratio`, `creation_id`, etc.) with fx ON `={{ $json.<column> }}`.

For import path, skip `grok_imagine_reel_still` — wire `map_sheet_fields` → `still_edit_instructions` (still_url already on the sheet).

---

## Sheet 9 column: `still_edit_prompt`

- Empty → `if_still_edit` false → no edit call  
- Filled → edit that text via `/v1/images/edits`  

Re-import `9-lab-item-creations-500.csv` after pull so the new column exists in Google Sheets.

---

## Checklist

- [ ] No Fixed creative strings in Set nodes  
- [ ] `grok_video_body_json` prompt changes per Sheet 9 row (not always push-in)  
- [ ] `still_edit_prompt` only from sheet  
- [ ] `model_still` / `model_video` / `duration_seconds` / `resolution` from sheet  
- [ ] Import URLs only on tab `12-import-still-queue`
