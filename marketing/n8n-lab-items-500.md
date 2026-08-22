# 100 wellness scene settings (Grok still + video)

**Rule:** Image + video generation uses **100 unique health & wellness lifestyle scene settings** — beaches, homes, trails, kitchens, gardens — **not laboratory sets**.

Sheet tab name stays **`9-lab-item-creations-500`** so existing n8n nodes keep working. Row count is **100**.

## Files

| File | Role |
|---|---|
| `sheets/health_wellness_scene_settings_100.csv` | Source list of 100 scene settings (input only) |
| `sheets/9-lab-item-creations-500.csv` | **Only production file updated** — 100 wellness creations. **No `mod_*` text** — Creatomate overlays come from Sheet 10. |

Do not sync this rebuild into `8-lab-items-*`, `9-*-250`, or JSON mirrors unless asked.

## Import (Sheets)

1. **Replace** tab **`9-lab-item-creations-500`** with `9-lab-item-creations-500.csv` (do not append)
2. Optional: import `health_wellness_scene_settings_100.csv` as a reference tab
3. Point `get_reel_creations` at tab **`9-lab-item-creations-500`**
4. Set **Return All** / limit ≥ 100
5. Filter `status = Active`
6. Paste updated **`pick_creation`** from `n8n-code-pick-creation.js`
7. `pick_creation` picks **least-used**, and **never repeats the same `scene_setting` two days in a row** when alternatives exist
8. Also diversifies against recent `environment_bucket` / shot family / camera move
9. After Grok succeeds, `sheets_update_creation` bumps `times_used` + `last_used_at`

Creation ids are `PBVita-Scene-001` … `PBVita-Scene-100` (`SCN-001` …).  
**`rank` is the daily rotation order** — environment buckets are interleaved so adjacent ranks never share the same `scene_setting` or bucket.

## Key columns

| Column | Purpose |
|---|---|
| `scene_setting` | Exact lifestyle setting from the 100-list |
| `environment_bucket` | Coarse bucket for stagger (`beach_coast`, `kitchen_cafe`, …) |
| `lab_item` | Full Grok scene paragraph (lifestyle, not lab) |
| `video_prompt` / `video_motion_prompt` | Still + I2V prompts matching that setting |

## Rebuild

```bash
python3 marketing/scripts/rebuild_wellness_scenes_100.py
```

## Creative rules

- Lifestyle environments only — no cleanrooms, HPLC stacks, or sterile benches as the main set
- Empty of people / hands / faces; no needles, injection, or clinical procedure theater
- Optional quiet research vial/pen presence with exact `compound_name` once only
- **NO DOUBLES** of props/text; vial closure = aluminum crimp + rubber septum when a vial appears
- Legal disclaimers belong in Buffer captions only — never burned into stills/video
