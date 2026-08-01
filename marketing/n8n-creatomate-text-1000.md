# 1000 unique Creatomate text sets (daily-changing facts)

Each reel’s on-screen copy must change. Library size: **1000** unique sets.

## Files

| File | Role |
|---|---|
| `sheets/10-creatomate-text-1000.csv` | **Canonical** — 1000 rows |
| `n8n-code-pick-text.js` | Code: pick least-used Active text set |
| `pbvita-1000-creatomate-text.json` | JSON dump |

Each of `mod_intro`, `mod_fact_1` … `mod_fact_5` is **unique across all 1000 rows**.  
IDs: `PBVita-Text-0001` … `PBVita-Text-1000`.

## n8n insert

```text
… → save_extend_1_url (Grok ~25s)
  → get_reel_text              (Sheets read tab 10-creatomate-text-1000, Return All)
  → filter_text_active         (status = Active)  [optional if pick filters]
  → pick_text                  (Code from n8n-code-pick-text.js)
  → map_creatomate_mods        (merge Grok URL + picked text)
  → creatomate_render
```

`pick_text` is independent from `pick_creation` (lab video) so text rotates across 1000 even if video library is 500.

## Import

1. Import `10-creatomate-text-1000.csv` → tab **`10-creatomate-text-1000`**
2. Return All / limit ≥ 1000
3. After each successful reel, Sheets **Update** that `text_id`: `times_used + 1`, `last_used_at = now`

## `map_creatomate_mods`

| Name | Value |
|---|---|
| `grok_video_url` | `={{ $('save_extend_1_url').first().json.video_url \|\| $('save_extend_1_url').first().json.video.url }}` |
| `mod_intro` | `={{ $('pick_text').first().json.mod_intro }}` |
| `mod_fact_1` | `={{ $('pick_text').first().json.mod_fact_1 }}` |
| `mod_fact_2` | `={{ $('pick_text').first().json.mod_fact_2 }}` |
| `mod_fact_3` | `={{ $('pick_text').first().json.mod_fact_3 }}` |
| `mod_fact_4` | `={{ $('pick_text').first().json.mod_fact_4 }}` |
| `mod_fact_5` | `={{ $('pick_text').first().json.mod_fact_5 }}` |
| `mod_disclaimer` | `={{ $('pick_text').first().json.mod_disclaimer }}` |
| `text_id` | `={{ $('pick_text').first().json.text_id }}` |
| `template_id` | your 60s template UUID (trimmed) |

Remove `mod_bullet_*`. Do not use static Parse_Grok bullets for these five facts.
