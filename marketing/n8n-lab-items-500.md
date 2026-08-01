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

1. Import `9-lab-item-creations-500.csv` → tab **`9-lab-item-creations-500`**
2. Optional reference: `8-lab-items-500.csv` → `8-lab-items-500`
3. Point `get_reel_creations` at tab **`9-lab-item-creations-500`**
4. Set **Return All** / limit ≥ 500
5. Filter `status = Active`
6. `pick_creation` picks least-used → `video_prompt`

Creation ids: `PBVita-Lab-001` … `PBVita-Lab-500`.

## Quality

- Still: `grok-imagine-image-quality` + `resolution: 2k` + `9:16`
- Video: `grok-imagine-video-1.5` + max resolution (`1080p` when allowed)

## Rebuild

```bash
python3 marketing/scripts/build_lab_items_500.py
```
