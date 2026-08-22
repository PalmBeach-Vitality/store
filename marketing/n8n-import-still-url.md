# Import path — same fields as daily vid gen (Sheet 9 shape)

Import pulls **the same creative columns** as `get_reel_creations` / Sheet **`9-lab-item-creations-500`**, plus:

| Extra column | Why |
|---|---|
| `still_url` | Public image already exists (skip Grok still) |
| `import_id` | Writeback key on Sheet 12 |

CSV: `marketing/sheets/12-import-still-queue.csv`  
Tab: **`12-import-still-queue`**

---

## Wire

```text
Manual Trigger
  → get_import_still_rows     (copy of get_reel_creations → Sheet 12)
  → filter Active → Limit 1
  → import_still_url          (Edit Fields — map same fields as daily)
  → save_still_url
  → still_edit_instructions → … → grok_video_start → …
  → sheets_update_import
```

Daily stays:

```text
get_reel_creations → … → pick_creation → grok_imagine_reel_still → save_still_url → …
```

---

## Sheets Get (copy of `get_reel_creations`)

```text
Manual Trigger → **get_import_still_rows** → import_still_url
```

| Setting | Value |
|---|---|
| Type | Google Sheets → Get Row(s) *(duplicate `get_reel_creations`)* |
| Name | `get_import_still_rows` (or your Sheets node name) |
| Document | same workbook |
| Sheet | **`12-import-still-queue`** |
| Return All | **ON** |

---

## `import_still_url` (Edit Fields — same payload as daily)

```text
get_import_still_rows → **import_still_url** → save_still_url
```

Include Other Input Fields: **ON** · all fx **ON**

Map **every** field the daily path uses after `pick_creation` / `save_still_url`:

| Name | Value |
|---|---|
| `still_url` | `={{ $json.still_url }}` |
| `import_id` | `={{ $json.import_id }}` |
| `creation_id` | `={{ $json.creation_id }}` |
| `rank` | `={{ $json.rank }}` |
| `lab_item_id` | `={{ $json.lab_item_id }}` |
| `category` | `={{ $json.category }}` |
| `lab_item` | `={{ $json.lab_item }}` |
| `material_detail` | `={{ $json.material_detail }}` |
| `compound_name` | `={{ $json.compound_name }}` |
| `shot_family` | `={{ $json.shot_family }}` |
| `camera_angle` | `={{ $json.camera_angle }}` |
| `camera_direction` | `={{ $json.camera_direction }}` |
| `framing` | `={{ $json.framing }}` |
| `scene_brief` | `={{ $json.scene_brief }}` |
| `quality_var_count` | `={{ $json.quality_var_count }}` |
| `quality_suffix` | `={{ $json.quality_suffix }}` |
| `aspect_ratio` | `={{ $json.aspect_ratio }}` |
| `duration_seconds` | `={{ Number($json.duration_seconds) }}` |
| `resolution` | `={{ $json.resolution }}` |
| `model_still` | `={{ $json.model_still }}` |
| `model_video` | `={{ $json.model_video }}` |
| `still_resolution` | `={{ $json.still_resolution }}` |
| `video_prompt` | `={{ $json.video_prompt }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt }}` |
| `still_edit_prompt` | `={{ $json.still_edit_prompt \|\| '' }}` |
| `status` | `={{ $json.status }}` |
| `times_used` | `={{ Number($json.times_used \|\| 0) }}` |
| `last_used_at` | `={{ $json.last_used_at \|\| '' }}` |
| `surface` | `={{ $json.surface }}` |
| `lighting` | `={{ $json.lighting }}` |
| `camera_move` | `={{ $json.camera_move }}` |
| `color_grade` | `={{ $json.color_grade }}` |
| `hero_style` | `={{ $json.hero_style }}` |
| `source` | `={{ 'import_sheet' }}` |

From here, **`save_still_url` / `still_edit_instructions` / `prep_grok_video_start`** should read `$json.<field>` the same way as the daily path (motion, model_video, duration, resolution, still_edit_prompt, cameras).

Import skips `grok_imagine_reel_still` — `still_url` is already on the sheet.

---

## `save_still_url` (shared merge)

```text
import_still_url → **save_still_url** → still_edit_instructions
grok_imagine_reel_still → **save_still_url** → still_edit_instructions
```

For import inbound, keep sheet fields (Include Other Input Fields **ON**) and set:

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url \|\| $json.data?.[0]?.url }}` |

That supports both import (`still_url`) and daily (Grok `data[0].url`).

---

## Writeback

| Path | Node | Sheet | Match |
|---|---|---|---|
| Daily | `sheets_update_creation` | `9-lab-item-creations-500` | `creation_id` |
| Import | `sheets_update_import` | `12-import-still-queue` | `import_id` |

```text
save_video_url → sheets_update_import → end
```

| Column | Value |
|---|---|
| Match `import_id` | `={{ $('import_still_url').item.json.import_id \|\| $('save_still_url').item.json.import_id }}` |
| `times_used` | `={{ Number($('import_still_url').item.json.times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |
