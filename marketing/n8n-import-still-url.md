# Import / sheet-pull path (separate from daily)

**Separate branch** — does **not** go through `pick_creation` or `grok_imagine_reel_still`.

```text
Manual_Trigger_Import
  → import_still_url                 (Sheets Get: 12-import-still-queue)
  → filter_import_active → limit_import_1
  → save_still_url                   (maps sheet still_url + fields for writeback)
  → map_sheet_fields                 (optional normalize; or fold into save_still_url)
  → still_edit_instructions          (joins daily path here)
  → if_still_edit → … → prep_grok_video_start → grok_video_start → …
  → sheets_update_import             (writeback times_used / last_used_at on Sheet 12)
```

Minimal wire you described:

```text
import_still_url → save_still_url → map_sheet_fields → still_edit_instructions → …
```

Daily path stays:

```text
pick_creation → grok_imagine_reel_still → save_still_url → still_edit_instructions → …
```

> If both paths use the **same** node name `save_still_url`, give import its own name **`save_import_still_url`** OR use one shared Set with two inbound wires. Expressions below use `$json` from the previous node so either works.

---

## Sheet tab

**`12-import-still-queue`**  
CSV: `marketing/sheets/12-import-still-queue.csv`

---

## `import_still_url` (sheet pull)

```text
Manual_Trigger_Import → **import_still_url** → save_still_url
```

| Setting | Value |
|---|---|
| Type | Google Sheets → **Get Row(s)** |
| Name | `import_still_url` |
| Sheet | **`12-import-still-queue`** |
| Return All | **ON** |

Then Filter `status = Active` + Limit `1` before `save_still_url` if needed.

---

## `save_still_url` (after import — for writeback)

```text
import_still_url (or limit_import_1) → **save_still_url** → map_sheet_fields
```

**Important:** on import, `still_url` comes from the **sheet column**, not `$json.data[0].url` (that’s Grok still only).

| Setting | Value |
|---|---|
| Type | **Edit Fields** |
| Include Other Input Fields | **ON** |

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url }}` |
| `creation_id` | ON | `={{ $json.creation_id \|\| $json.import_id }}` |
| `import_id` | ON | `={{ $json.import_id \|\| $json.creation_id }}` |
| `still_edit_prompt` | ON | `={{ $json.still_edit_prompt \|\| '' }}` |
| `video_motion_prompt` | ON | `={{ $json.video_motion_prompt }}` |
| `model_still` | ON | `={{ $json.model_still }}` |
| `model_video` | ON | `={{ $json.model_video }}` |
| `duration_seconds` | ON | `={{ Number($json.duration_seconds) }}` |
| `resolution` | ON | `={{ $json.resolution }}` |
| `aspect_ratio` | ON | `={{ $json.aspect_ratio }}` |
| `camera_move` | ON | `={{ $json.camera_move \|\| '' }}` |
| `times_used` | ON | `={{ Number($json.times_used \|\| 0) }}` |
| `source` | ON | `={{ 'import_sheet' }}` |

**Check:** `still_url` is public https; `import_id` / `creation_id` present for writeback match.

---

## `map_sheet_fields`

```text
save_still_url → **map_sheet_fields** → still_edit_instructions
```

Pass-through / normalize (all fx ON). Include Other Input Fields **ON**.

| Name | Value |
|---|---|
| `still_url` | `={{ $json.still_url }}` |
| `creation_id` | `={{ $json.creation_id }}` |
| `import_id` | `={{ $json.import_id \|\| $json.creation_id }}` |
| `still_edit_prompt` | `={{ $json.still_edit_prompt \|\| '' }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt }}` |
| `model_video` | `={{ $json.model_video }}` |
| `model_still` | `={{ $json.model_still }}` |
| `duration_seconds` | `={{ Number($json.duration_seconds) }}` |
| `resolution` | `={{ $json.resolution }}` |
| `aspect_ratio` | `={{ $json.aspect_ratio }}` |
| `times_used` | `={{ Number($json.times_used \|\| 0) }}` |

---

## `sheets_update_import` (writeback)

```text
save_video_url (or end of import success path) → **sheets_update_import** → end
```

| Setting | Value |
|---|---|
| Type | Google Sheets → **Update Row** |
| Name | `sheets_update_import` |
| Sheet | **`12-import-still-queue`** |
| Column to Match On | `import_id` (or `creation_id` if that’s your key) |
| Value to Match | `={{ $('save_still_url').item.json.import_id \|\| $('save_still_url').item.json.creation_id \|\| $('map_sheet_fields').item.json.import_id }}` |

| Column | Value (fx ON) |
|---|---|
| `times_used` | `={{ Number($('save_still_url').item.json.times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |

Leave other columns blank so they are not overwritten.

Only run this node on the **import** branch (not daily Sheet 9 writeback). Daily still uses `sheets_update_creation` on `9-lab-item-creations-500`.

---

## Daily vs import writeback

| Path | Update sheet | Match key | Node |
|---|---|---|---|
| Daily | `9-lab-item-creations-500` | `creation_id` | `sheets_update_creation` |
| Import | `12-import-still-queue` | `import_id` | `sheets_update_import` |
