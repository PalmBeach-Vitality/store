# Overlay: Sheet 13 video model → Kling

One-shot write onto `13-chem-breakdown-54`. Archive after Execute. Do **not** Publish.

**Daily reader:** `peptide_molecule_vid_gen` (`EcGTbpZ9VG3C69pq`) — unpublished.  
**Code:** `marketing/n8n-code-overlay-molecule-kling.js`

Salvatore: molecule **video** is official Kling image-to-video. Grok still stays.

## What it changes

| Column | New value |
|---|---|
| `model_video` | `kling-v3` |

Does **not** touch `times_used`, URLs, prompts, duration, or `model_still`.

`kling-v3` is the official I2V model that can hold the sheet’s existing `duration_seconds` = 15. Older Kling I2V models only accept 5 or 10.

## Wire

```text
Manual Trigger
  → get_chem_creations           Google Sheets read, all rows
  → overlay_molecule_kling       Code, Run Once for All Items, Execute Once OFF
  → sheets_update_model_video    Google Sheets update, match creation_id
```

## After overlay

Existing stills do not change. Re-Execute `peptide_molecule_vid_gen` from `get_chem_creations` after the two n8n Variables are set. Do **not** Publish. Do **not** fire a paid Kling clip until you want one.
