# Overlay: Sheet 13 video model → kie Kling I2V

One-shot write onto `13-chem-breakdown-54`. Archive after Execute. Do **not** Publish.

**Overlay (archived after execute):** https://stockjohnson.app.n8n.cloud/workflow/EsvOCXDIX1ClheCS  
Manual execution **1538** succeeded (~3s). Wrote `model_video` = `kling-3.0-omni/image-to-video` onto all 54 rows. Workflow is archived.

**Daily reader:** `peptide_molecule_vid_gen` (`EcGTbpZ9VG3C69pq`) — unpublished.  
**Code:** `marketing/n8n-code-overlay-molecule-kling.js`

Salvatore: molecule **video** is kie.ai Kling image-to-video (one Bearer API key). There is **no Secret Key**. Grok still stays.

## What it changes

| Column | New value |
|---|---|
| `model_video` | `kling-3.0-omni/image-to-video` |

Does **not** touch `times_used`, URLs, prompts, duration, or `model_still`.

`kling-3.0-omni/image-to-video` is the kie I2V model that can hold the sheet’s existing `duration_seconds` = 15 and `resolution` = `1080p`.

## Wire

```text
Manual Trigger
  → get_chem_creations           Google Sheets read, all rows
  → overlay_molecule_kling       Code, Run Once for All Items, Execute Once OFF
  → sheets_update_model_video    Google Sheets update, match creation_id
```

## After overlay

Existing stills do not change. Re-Execute `peptide_molecule_vid_gen` from `get_chem_creations` after the two Kling HTTP nodes have the Bearer header. Do **not** Publish. Do **not** fire a paid Kling clip until you want one.
