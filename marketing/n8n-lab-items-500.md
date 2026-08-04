# 500 lab-item variables (ONLY subjects for image/video)

**Rule:** Image + video generation may use **only** these **500** real laboratory items as subject variables.  
No abstract orbs, surreal glass, CGI spheres, or non-lab fantasy props.

## Files

| File | Role |
|---|---|
| `sheets/8-lab-items-500.csv` | Master list of 500 lab items |
| `sheets/9-lab-item-creations-500.csv` | 500 ready creations (`video_prompt` locked to one lab item each) |
| `pbvita-500-lab-items.json` | Same items as JSON |
| `pbvita-500-lab-item-creations.json` | Same creations as JSON |

Compat copies (same 500 rows): `8-lab-items-250.csv`, `9-lab-item-creations-250.csv` (filenames kept so old links don’t break — **content is 500**).

## Import (Sheets)

1. **Replace** tab **`9-lab-item-creations-500`** with `9-lab-item-creations-500.csv` (do not append)
2. Optional reference: `8-lab-items-500.csv` → `8-lab-items-500`
3. Point `get_reel_creations` at tab **`9-lab-item-creations-500`**
4. Set **Return All** / limit ≥ 500
5. Filter `status = Active`
6. `pick_creation` picks **least-used**: lowest `times_used` → oldest `last_used_at` → lowest `rank`
7. Skips last **8** categories / shot families / camera moves / angles / directions
8. Each row has unique `shot_family` + `camera_angle` + `camera_direction` + `camera_move` + `video_motion_prompt`
9. After Grok succeeds, `sheets_update_creation` bumps `times_used` + `last_used_at`
10. `grok_video_start` must use **`video_motion_prompt`** — never a hardcoded orbit sentence

Creation ids stay `PBVita-Lab-*` / `LAB-*` (stable). **`rank` is the daily rotation order** — categories are interleaved so **no two adjacent ranks share a category** (no vial→vial in the sheet order).

**Phase C:** all **500** `camera_move` values are unique (24 shot families, 41 angles, 24 directions).

Rebuild cameras only:

```bash
python3 marketing/scripts/apply_unique_camera_recipes.py
python3 marketing/scripts/audit_camera_diversity.py
```

Full library rebuild / re-interleave / realism pass:

```bash
python3 marketing/scripts/rebuild_lab_libraries.py
python3 marketing/scripts/apply_unique_camera_recipes.py
```

**Realism rules baked into the CSVs + prompts**
- Exactly **one** primary subject (no dual-chamber, twin packs, pairs, stacks of products)
- **No cardboard boxes, cartons, mailers, or trays as the hero** — prefer premium equipment, vials, powders, sterile lab environments, microscopes
- **Never** bake `creation motif`, `LAB-###`, or `000/500` into prompts (Grok prints that text onto products)
- **Labels:** any vial / pen / powder / bottle that shows a label must use a real catalog `compound_name` (BPC-157, NAD+, Semaglutide, … from `1-compounds-all-daily`). See `compound-labels.json`. Equipment without a product label stays unlabeled.
- No injection/needle context; filter cartridges and pumps only when needed
- Every `video_prompt` includes `SINGLE SUBJECT ONLY` + FDA-safe avoid list
- Category rank order never repeats adjacent categories

## Quality

- Still: `grok-imagine-image-quality` + `resolution: 2k` + `9:16`
- Video: `grok-imagine-video-1.5` + **`duration: 15`** + **`resolution: 1080p`** + `9:16` (never `8`s / never `720p`)

## Rebuild

```bash
python3 marketing/scripts/build_lab_items_500.py
```
