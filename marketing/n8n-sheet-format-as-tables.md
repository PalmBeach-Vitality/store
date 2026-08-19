# sheet_format_as_tables

One-shot linear workflow. Turns marketing spreadsheets into **Google Tables** so each tab has:

- a **table menu** (top-left of the table)
- **dropdown menus on every header** (filter / sort)
- chip dropdowns on `status`, `compound_name`, caption `tag2–tag5`, and `verify_status`

**Not** vid gen. **Not** Creatomate. **No Switch / IF.**

**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/5SgleIocZapgI2In

Open the workflow → Execute. It walks these workbooks only (not the price list or dosing chart):

- `15-caption-science-27`
- `13-chem-breakdown-54` (all tabs, including 15/16 if they live here)
- `14-pen-creations-150` (live n8n list uses the pen workbook ID; repo copy is `PASTE_GOOGLE_SHEET_DOCUMENT_ID`)
- `3-image-scenes-150`
- `9-lab-item-creations-500`
- `4-reel-queue`
- `12-import-still-queue`
- `10-creatomate-text-1000`

## Wire

```text
manual_trigger
  → list_table_workbooks
  → http_get_meta
  → build_batchget_url
  → http_batchget_dims
  → build_table_requests
  → http_apply_tables
```

## After it runs

Open any of those files. You should see a table name chip and header arrows. Click a header arrow to filter. `status` and `compound_name` are chip dropdowns.

Data is unchanged. n8n still reads the same column names.

## Manual equivalent (one file)

Format → Convert to table → use row 1 as headers.
