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
6. `pick_creation` picks **least-used** (same as compounds sheet): lowest `times_used` → oldest `last_used_at` → lowest `rank`
7. It also skips the **same category** and **same camera_move** as the most recently used row
8. After each successful reel, `sheets_update_creation` must bump that row’s `times_used` + `last_used_at` or the next run repeats the same scene
9. `grok_video_start` must use **`video_motion_prompt`** from the picked row — never a hardcoded “orbit around” sentence

Creation ids stay `PBVita-Lab-*` / `LAB-*` (stable). **`rank` is the daily rotation order** — categories are interleaved so **no two adjacent ranks share a category** (no vial→vial in the sheet order).

Each row has a unique **`video_motion_prompt`** (push-in, rise, lateral slide, tilt-up, pull-back, etc.) so vidgen motion changes every run.

Rebuild / re-interleave / realism pass:

```bash
python3 marketing/scripts/fix_lab_libraries.py
```

**Realism rules baked into the CSVs + prompts**
- Exactly **one** primary subject (no dual-chamber, twin packs, pairs, stacks of products)
- No extra vials/pens in non-vial categories (empty tray/box instead)
- No injection/needle context; filter cartridges and pumps only when needed
- Every `video_prompt` includes `SINGLE SUBJECT ONLY` + FDA-safe avoid list
- Category rank order never repeats adjacent categories

## Quality

- Still: `grok-imagine-image-quality` + `resolution: 2k` + `9:16`
- Video: `grok-imagine-video-1.5` + **`resolution: 1080p`** + `9:16` (never `720p`)

## Rebuild

```bash
python3 marketing/scripts/build_lab_items_500.py
```
