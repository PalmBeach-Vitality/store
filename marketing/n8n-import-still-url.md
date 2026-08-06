# Import still from Sheet queue (sheets-only)

Paste image URLs into Google Sheet tab **`12-import-still-queue`**, not into Fixed n8n fields.

CSV: `marketing/sheets/12-import-still-queue.csv`

---

## Wire

```text
Manual_Trigger_Import
  → get_import_still_rows       (Sheets: 12-import-still-queue)
  → filter_import_active        (status = Active)
  → limit_import_1
  → import_still_from_sheet     (Set — map sheet columns)
  → map_sheet_fields
  → still_edit_instructions
  → if_still_edit → … → save_edited_still_url
  → prep_grok_video_start → grok_video_start → …
```

Skips `grok_imagine_reel_still` (still already on the sheet).

Full field map: `n8n-sheets-only-vid-gen.md`
