# 500 unique Creatomate text sets (daily-changing facts)

Each daily reel’s on-screen copy must change. Do **not** reuse the same Parse_Grok bullets every run.

## Files

| File | Role |
|---|---|
| `sheets/10-creatomate-text-500.csv` | 500 unique `mod_intro` + `mod_fact_1`…`5` (+ disclaimer) |
| `sheets/9-lab-item-creations-500.csv` | Same text columns **merged** onto each lab creation |

Each of `mod_intro`, `mod_fact_1`, `mod_fact_2`, `mod_fact_3`, `mod_fact_4`, `mod_fact_5` is **unique across all 500 rows**.

## How daily change works

`pick_creation` already picks the least-used Active creation (`PBVita-Lab-001`…`500`).  
That row carries:

- `video_prompt` / lab item → Grok unique footage  
- `mod_intro` … `mod_fact_5` → Creatomate text for that same day  

When `times_used` increments, the next run gets a different creation → **different facts**.

## Import

Re-import **`9-lab-item-creations-500.csv`** (includes text columns) into tab `9-lab-item-creations-500`, **or** import `10-creatomate-text-500.csv` and join by `creation_id`.

`get_reel_creations` → Return All ≥ 500.

## `map_creatomate_mods` (lowercase) — pull from pick, not Parse

| Name | Value |
|---|---|
| `grok_video_url` | `={{ $json.video_url \|\| $json.video.url }}` |
| `mod_intro` | `={{ $('pick_creation').first().json.mod_intro }}` |
| `mod_fact_1` | `={{ $('pick_creation').first().json.mod_fact_1 }}` |
| `mod_fact_2` | `={{ $('pick_creation').first().json.mod_fact_2 }}` |
| `mod_fact_3` | `={{ $('pick_creation').first().json.mod_fact_3 }}` |
| `mod_fact_4` | `={{ $('pick_creation').first().json.mod_fact_4 }}` |
| `mod_fact_5` | `={{ $('pick_creation').first().json.mod_fact_5 }}` |
| `mod_disclaimer` | `={{ $('pick_creation').first().json.mod_disclaimer \|\| 'For laboratory research use only. Not for human use or consumption.' }}` |
| `template_id` | `={{ String($json.template_id \|\| $('Prep_day_variant').first().json.template_id).trim() }}` |

Remove old `mod_bullet_*` fields.

## FDA

All lines are research-catalog / documentation framed. No wellness, nicknames, or human-use claims.
