# Reel Studio — pick scenes / 500 creations (n8n)

**Workflow:** `PBVita — Reel Studio`  
**Library:** Sheets tab `7-unique-reel-creations-500` (from `marketing/sheets/7-unique-reel-creations-500.csv`)

Each run picks **1** least-used Active creation (unique scene + 12 quality vars + full `video_prompt`), merges it with your compliant compound from `Parse_Grok`, then continues to Creatomate / Imagine.

---

## Target insert

```text
… → Parse_Grok → if_compliance
       false → stop
       true  → get_reel_creations          ← NEW
            → filter_creations_active     ← NEW
            → pick_creation               ← NEW (Code)
            → map_creatomate_mods         ← existing
            → creatomate_render → …
            → save_creatomate_url
            → sheets_update_reel          ← compound row
            → sheets_update_creation      ← NEW (creation times_used)
```

---

## Phase 0 — Import Sheets tab (once)

1. Open your Google Spreadsheet (same as `1-compounds-all-daily`)
2. **File → Import → Upload** `marketing/sheets/7-unique-reel-creations-500.csv`
3. Import location: **Insert new sheet**
4. Rename tab exactly: **`7-unique-reel-creations-500`**
5. Confirm header includes: `creation_id`, `scene_brief`, `quality_suffix`, `video_prompt`, `status`, `times_used`, `last_used_at`
6. Share with the same Google account used in n8n

Reply **`sheet 7 ok`** when done — then we add Node 1.
