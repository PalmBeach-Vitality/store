# Import / sheet-pull path (separate from daily)

**Separate branch** — does **not** go through `pick_creation` or `grok_imagine_reel_still`.

```text
Manual_Trigger_Import
  → import_still_url          (Sheets Get: 12-import-still-queue)
  → map_sheet_fields          (Set — map sheet columns)
  → save_still_url            (Set — still_url from sheet)
  → still_edit_instructions   (joins daily path here)
  → if_still_edit → … → prep_grok_video_start → grok_video_start
```

Daily path stays untouched:

```text
pick_creation → grok_imagine_reel_still → save_still_url → still_edit_instructions → …
```

Both paths meet at **`still_edit_instructions`** (or both can land on the same `save_still_url` node name only if you use two differently named saves — prefer **one shared** `save_still_url` with two inbound wires, or name import save `save_still_url` and wire both branches into `still_edit_instructions`).

**Recommended:** import uses its own `save_still_url` only on this branch, then into `still_edit_instructions`. Daily keeps its own `save_still_url` after Grok still. Both connect **into** `still_edit_instructions`.

---

## Sheet tab

Import: **`12-import-still-queue`**  
CSV: `marketing/sheets/12-import-still-queue.csv`

Put `still_url`, `still_edit_prompt`, `video_motion_prompt`, `model_*`, `duration_seconds`, `resolution`, etc. on the **sheet**.

---

## Node 1 — `Manual_Trigger_Import`

```text
(start) → **Manual_Trigger_Import** → import_still_url
```

| Type | Manual Trigger |
| Name | `Manual_Trigger_Import` |

---

## Node 2 — `import_still_url` (sheet pull)

```text
Manual_Trigger_Import → **import_still_url** → map_sheet_fields
```

| Setting | Value |
|---|---|
| Type | **Google Sheets** → Get Row(s) |
| Name | `import_still_url` |
| Document | your PB Vitality workbook |
| Sheet | **`12-import-still-queue`** |
| Return All | **ON** |

Then add (same branch):

- **Filter** `filter_import_active`: `status` equals `Active`
- **Limit** `limit_import_1`: Max Items `1`

Wire: `import_still_url → filter_import_active → limit_import_1 → map_sheet_fields`

(If you want the Get node itself named `import_still_url` and filter/limit after it, that’s fine.)

---

## Node 3 — `map_sheet_fields`

```text
limit_import_1 → **map_sheet_fields** → save_still_url
```

| Setting | Value |
|---|---|
| Type | **Edit Fields** |
| Name | `map_sheet_fields` |
| Include Other Input Fields | **ON** |

All fx **ON**:

| Name | Value |
|---|---|
| `still_url` | `={{ $json.still_url }}` |
| `creation_id` | `={{ $json.creation_id }}` |
| `still_edit_prompt` | `={{ $json.still_edit_prompt \|\| '' }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt }}` |
| `model_still` | `={{ $json.model_still }}` |
| `model_video` | `={{ $json.model_video }}` |
| `duration_seconds` | `={{ Number($json.duration_seconds) }}` |
| `resolution` | `={{ $json.resolution }}` |
| `aspect_ratio` | `={{ $json.aspect_ratio }}` |
| `camera_move` | `={{ $json.camera_move \|\| '' }}` |
| `shot_family` | `={{ $json.shot_family \|\| '' }}` |
| `source` | `={{ 'import_sheet' }}` |

**Check:** `still_url` is public `https://`.

---

## Node 4 — `save_still_url` (import branch)

```text
map_sheet_fields → **save_still_url** → still_edit_instructions
```

> If daily path already has a node named `save_still_url`, either:
> - reuse it (second inbound wire from `map_sheet_fields`), or  
> - name this one `save_import_still_url` and point `still_edit_instructions` at `$json.still_url` from whichever ran.

| Setting | Value |
|---|---|
| Type | **Edit Fields** |
| Include Other Input Fields | **ON** |

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url }}` |
| `creation_id` | ON | `={{ $json.creation_id }}` |
| `still_edit_prompt` | ON | `={{ $json.still_edit_prompt \|\| '' }}` |
| `video_motion_prompt` | ON | `={{ $json.video_motion_prompt }}` |
| `model_still` | ON | `={{ $json.model_still }}` |
| `model_video` | ON | `={{ $json.model_video }}` |
| `duration_seconds` | ON | `={{ $json.duration_seconds }}` |
| `resolution` | ON | `={{ $json.resolution }}` |
| `aspect_ratio` | ON | `={{ $json.aspect_ratio }}` |
| `camera_move` | ON | `={{ $json.camera_move }}` |

Then continue into existing:

```text
save_still_url → still_edit_instructions → if_still_edit → …
```

---

## Do not

- Wire `map_sheet_fields` into the daily `pick_creation → grok_imagine_reel_still` path  
- Paste Fixed creative text / URLs into n8n — edit the **sheet** instead  
