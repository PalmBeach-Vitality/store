# Landscape pen color overlay

One-shot sheet write for `500_Peptide_Wellness_Reel_Scenes` **`pen_3ml`** rows only. Archive the n8n workflow after it runs.

Code: `marketing/n8n-code-overlay-landscape-pen-colors.js`  
n8n: `overlay_landscape_pen_colors` (unpublished, archive after execute)

## Look (shape unchanged)

The elongated 3mL research pen shape stays. Only barrel/cap/clip color and on-pen ink change:

| Family | Body | On-pen text |
|---|---|---|
| Peptide | matte white | red |
| Metabolic | matte white | blue |

Do **not** recolor scene blacks (void, lake, water).  
Do **not** mix this into Sheet 14 / `peptide_pen_vid_gen` (that catalog keeps its own insulin-style white + orange look).

Metabolic names (exact `compound_name` match): `5-Amino-1MQ`, `AOD-9604`, `Cagrilinitide`, `MOTS-C`, `NAD+`, `Retatrutide`, `Semaglutide`, `SS-31`, `Tesamorelin`, `Tesamorelin/Ipamorelin`, `Tirzepatide`. Everything else on `pen_3ml` is peptide / red.

## Wire

```text
Manual Trigger
  → get_reel_creations          Google Sheets read, all rows
  → overlay_pen_colors          Code, Run Once for All Items, Execute Once OFF
  → sheets_update_pen_colors    Google Sheets update, match creation_id
```

Code returns only the 47 `pen_3ml` rows. It does not emit `times_used` / `last_used_at` / URLs.

Daily landscape vid-gen stays sheets-only. Color lives on the row (`scene_brief`, `video_prompt`, `video_motion_prompt`, `surface`, `hero_style`, `material_detail`, plus `PEN COLOR LOCK` on `still_edit_prompt`). Do not hardcode paint into `pick_creation` or the still HTTP body.

## After overlay

The existing black-pen JPEG will not change by itself. Pin/re-Execute landscape from `pick_creation` (or still + edit) so Grok regenerates. Do not Publish.
