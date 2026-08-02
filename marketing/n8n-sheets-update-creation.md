# `sheets_update_creation` — make rotation actually stick

**Symptom:** every run picks the same `creation_id` / scene.  
**Cause:** `times_used` / `last_used_at` never write back to the lab Sheet.

This node belongs on the **Grok workflow** (after `save_video_url` succeeds) — **not** dependent on Creatomate.

```text
… → grok_video_poll → save_video_url → sheets_update_creation
```

Creatomate stays on a **separate workflow**.

---

## Spreadsheet (By ID — do not use the dropdown name)

| Setting | Value |
|---|---|
| Document | **By ID** → lab creations workbook |
| Document ID | the Sheet that holds tab `9-lab-item-creations-500` (often confused with the text workbook — verify) |
| Sheet | **By Name** → `9-lab-item-creations-500` (exact) |

There are two different Google Docs in play:

| Doc | Tab | Purpose |
|---|---|---|
| Lab creations | `9-lab-item-creations-500` | `sheets_update_creation` |
| Creatomate text | `10-creatomate-text-1000` | `sheets_update_text` (other workflow / later) |

If `get_reel_creations` and `sheets_update_creation` point at **different** Document IDs, updates look like they “don’t work.”

---

## Node settings (Google Sheets → Update)

| Setting | Value |
|---|---|
| Operation | **Update** (not Append, not Clear) |
| Document | By ID (lab workbook) |
| Sheet | `9-lab-item-creations-500` |
| Mapping Column Mode | Map Each Column Manually |
| Column to Match On | `creation_id` |
| Value to Match On | `={{ $('pick_creation').first().json.creation_id }}` |

### Columns to set (only these two required)

| Column | Value |
|---|---|
| `times_used` | `={{ Number($('pick_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |

Do **not** remap `video_prompt` / `creation_id` / whole rows unless you intend to overwrite them.

---

## Checklist when it “doesn’t update”

1. **Execute the node alone** after a successful `save_video_url` — does n8n show success or an error?
2. Open the **same** Google Sheet Document ID that `get_reel_creations` uses.
3. Find the row for today’s `creation_id` (e.g. `PBVita-Lab-206`) — did `times_used` go from `0` → `1`?
4. Header cells must be exactly `creation_id`, `times_used`, `last_used_at` (no trailing spaces, not `Creation ID`).
5. Match value must be the **picked** id:  
   `={{ $('pick_creation').first().json.creation_id }}`  
   Not `$json.creation_id` from a later node that dropped the field.
6. Credential must have edit access to that Sheet (same Google account that owns/shared it).
7. If the node is **after** Creatomate and Creatomate errors, the update never runs — move it to right after `save_video_url`.

---

## Quick test

1. Note `pick_creation.creation_id` and current `creation_times_used` (e.g. `0`).
2. Run through `save_video_url` → `sheets_update_creation`.
3. Refresh the Sheet — that row’s `times_used` must be `+1`.
4. Run `get_reel_creations` → `pick_creation` again — should pick a **different** `creation_id`.
