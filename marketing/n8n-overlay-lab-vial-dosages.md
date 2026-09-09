# Overlay: catalog vial dosages onto Sheet 9

One-shot. Do **not** Publish. Execute once, then archive.

**Live (archived after execute):** https://stockjohnson.app.n8n.cloud/workflow/od9QOEUltjhw82bD  
Manual execution `1482` succeeded (438 rows). Workflow is archived.

## Why

Grok was inventing concentrations (Semax still showed **2 mg/ml**). Sheet 9 only said “white mg strength, black mg/ml concentration text” with **no numbers**. Catalog Semax 10 mL vial is **10mg / 1 mg/ml**.

Each `compound_name` must use **its** Shopify 10 mL (or 5 mL) liquid SKU — not a generic 10mg/1 mg/ml on every vial.

Source: Drive `products_export_1.csv` (`1oSWiIpLmh5bMvDQBXCnt-pWbFLyd9ql5`) + Semax product (`1LPm6NUEID80CegDdWm2GEWqXkedC5Kk0`). Map: `marketing/compound-vial-labels.json`.

## Wire (linear)

```
Manual Trigger
  → get_reel_creations          Google Sheets  Get all rows
  → overlay_lab_vial_dosages    Code  Run Once for All Items  Execute Once OFF
  → sheets_update_vial_dosages  Google Sheets  Update  matching column creation_id
```

Paste `marketing/n8n-code-overlay-lab-vial-dosages.js` into the Code node.

Update **only** these columns (do **not** touch `times_used` / URLs):

- `lab_item`
- `video_prompt`
- `material_detail`
- `scene_brief`
- `still_edit_prompt`

## Sheet identity (runtime, not a prompt)

- Document: `1dvY7XGwjdkQm2Sp7glAvxuSLg9RHrxJd9tXbhh74Xfc`
- Tab: `9-lab-item-creations-500` gid `136811109`
- Credential: `OGHfxWtOUeZbDesw` (Google Sheets node only)

## What the Code does

- Rows with empty `compound_name`: skip.
- Maroon bar generic phrase → `white text exactly '<mg>', black concentration line exactly '<conc>'`.
- Cagrilinitide and MOTS-C: footer `10ml` → `5ml` (catalog is 5 mL).
- Pen-only compounds (5-Amino-1MQ, DSIP, KPV, Tesamorelin/Ipamorelin): **no invented mg/ml**. Strip the generic dosage phrase; still_edit says “do not add a mg number or mg/ml line”.
- NAD+: maroon **500mg**, black **50 mg/ml** (title 500mg / 10ml).
- `still_edit_prompt` prepends `VIAL DOSE LOCK: … Do not restyle the scene.` Re-runs strip the previous lock first.

## After execute

1. Check a SEMAX row: maroon `10mg`, concentration `1 mg/ml`, no `2 mg/ml`.
2. Archive this overlay.
3. Existing Semax JPEGs do **not** change. Pin/re-Execute lab vid-gen from `pick_creation` (or still + edit) so Grok rebuilds the label. Do **not** Publish vid-gen. Caption stays a separate workflow.

## Do not

- Hardcode dosages into daily `pick_creation` / `grok_imagine_reel_still`.
- Mix landscape pen look (Sheet 14) into these lab vial rows.
- Re-run `enforce_pbvita_vial_packaging.py` and skip `overlay_lab_vial_dosages.py` afterward. Enforce now re-applies the catalog dose lock at the end of each row so it does not revert exact `'10mg'` / `'1 mg/ml'` text.
