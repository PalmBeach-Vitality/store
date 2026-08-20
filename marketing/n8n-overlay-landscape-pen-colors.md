# Landscape pen design overlay

One-shot sheet write for `500_Peptide_Wellness_Reel_Scenes` **`pen_3ml`** rows only. Archive the n8n workflow after it runs.

Code: `marketing/n8n-code-overlay-landscape-pen-colors.js`  
n8n: `overlay_landscape_pen_design` (unpublished, archive after execute)

## Look (exact injector — CRITICAL)

Match the reference still: a **glossy white insulin-style 3mL injector** (Ozempic/Wegovy silhouette). Not an elongated slim research cartridge. Not a vial.

| Part | Exact |
|---|---|
| Barrel | Smooth **glossy** white plastic |
| Cap | Rounded glossy white cap, **clip ON**, covering the tip |
| Mid | Recessed band with **two small vertical rectangular notches** |
| Dial | Glossy **white** cylindrical dose dial with raised vertical ridges |
| Clicker | Glossy **white** button — **no orange** anywhere on the pen |
| DNA | Bright-**blue** vertical double-helix at far left of the label |
| Name | Large bold sans-serif — **red** peptide / **blue** metabolic |
| Line 2 | Smaller thinner **black** type: `3ml Pen` (MOTS-C: `20mg 3ml Pen`) |

Do **not** recolor scene blacks (void, lake, water).  
Do **not** mix this into Sheet 14 / `peptide_pen_vid_gen` unless asked (that catalog still has the older orange dial/name/badge lock).

Metabolic names (exact `compound_name` match): `5-Amino-1MQ`, `AOD-9604`, `Cagrilinitide`, `MOTS-C`, `NAD+`, `Retatrutide`, `Semaglutide`, `SS-31`, `Tesamorelin`, `Tesamorelin/Ipamorelin`, `Tirzepatide`. Everything else on `pen_3ml` is peptide / red.

## Wire

```text
Manual Trigger
  → get_reel_creations          Google Sheets read, all rows
  → overlay_pen_colors          Code, Run Once for All Items, Execute Once OFF
  → sheets_update_pen_colors    Google Sheets update, match creation_id
```

Code returns only the 47 `pen_3ml` rows. It does not emit `times_used` / `last_used_at` / URLs.

Daily landscape vid-gen stays sheets-only. Design lives on the row (`scene_brief`, `video_prompt`, `video_motion_prompt`, `surface`, `hero_style`, `material_detail`, plus `PEN DESIGN LOCK` on `still_edit_prompt`). Do not hardcode the pen into `pick_creation` or the still HTTP body.

## After overlay

Existing stills will not change by themselves. Pin/re-Execute landscape from `pick_creation` (or still + edit) so Grok rebuilds the pen. Do not Publish.
