# Sheets reference (PB Vitality)

| File | Tab name |
|---|---|
| `1-compounds-all-daily.csv` | `1-compounds-all-daily` (live daily queue — pens+vials) |
| `1-compounds-pens.csv` | `1-compounds-pens` |
| `1-compounds-vials.csv` | `1-compounds-vials` |
| `4-reel-queue.csv` | optional separate reel log |

## Live daily tab columns (Creatomate writeback)
Use on `1-compounds-all-daily`:

- `video_url` — Creatomate MP4 URL
- `creatomate_render_id`
- `creatomate_snapshot_url`
- `last_reel_at`

Existing Grok video columns (live Buffer workflow): `reel_still_url`, `reel_video_url`, `buffer_ig_reel_id`, `buffer_fb_reel_id`.
