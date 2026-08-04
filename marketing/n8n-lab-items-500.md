# 500 cinematic research scenes (Grok still + video)

**Rule:** Image + video generation uses **500 unique full-paragraph scenes** spanning laboratories, peptide science, R&D, and the health & wellness industry — not single boring product cutouts.

## Files

| File | Role |
|---|---|
| `sheets/8-lab-items-500.csv` | Master list synced from creations |
| `sheets/9-lab-item-creations-500.csv` | 500 ready creations. **No `mod_*` text** — Creatomate overlays come from Sheet 10. Each `lab_item` is a full scene paragraph; still/motion prompts match. |
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

Creation ids stay `PBVita-Lab-*` / `LAB-*` (stable). **`rank` is the daily rotation order** — scene categories are interleaved so adjacent ranks differ.

**Phase C:** all **500** `camera_move` values are unique (24 shot families, 41 angles, 24 directions).

Rebuild **full scene library** (paragraphs + prompts + cameras):

```bash
python3 marketing/scripts/rebuild_scene_library_500.py
python3 marketing/scripts/audit_camera_diversity.py
```

Rebuild cameras only (keeps current `lab_item` paragraphs):

```bash
python3 marketing/scripts/apply_unique_camera_recipes.py
python3 marketing/scripts/audit_camera_diversity.py
```

**Realism / creative rules baked into the CSVs + prompts**
- Environment-forward scenes: labs, peptide synthesis, cleanrooms, cryo, biotech campuses, longevity suites, wellness innovation, formulation, sports science, Palm Beach showrooms, etc.
- Each `lab_item` is a **full paragraph** (~800–1200 chars) for Grok Imagine
- `video_prompt` and `video_motion_prompt` embed that same scene
- Empty of people / hands / faces; no needles, injection, or clinical procedure theater
- **NO DOUBLES:** never tile/repeat text, amino sequences, wall graphics, or clone props in still or video
- **Never** bake `creation motif`, `LAB-###`, or `000/500` into prompts
- **Labels:** when present, use real catalog `compound_name` **once only** + research-only line
- FDA-safe: laboratory research use only — no treatment/cure claims
- Category rank order never repeats adjacent categories

Enrich/legacy single-item describer (`enrich_lab_item_descriptions.py`) is superseded by `rebuild_scene_library_500.py`.

## Quality

- Still: `grok-imagine-image-quality` + `resolution: 2k` + `9:16`
- Video: `grok-imagine-video-1.5` + **`duration: 15`** + **`resolution: 1080p`** + `9:16` (never `8`s / never `720p`)

## Rebuild

```bash
python3 marketing/scripts/build_lab_items_500.py
```
