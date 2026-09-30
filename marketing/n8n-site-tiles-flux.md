# `site_tiles_flux_gen -24-site-tiles-4` — 4 homepage tiles on FLUX.2 Max

Unpublished workflow: [site_tiles_flux_gen -24-site-tiles-4](https://stockjohnson.app.n8n.cloud/workflow/zw8zO2mnqTDZ2rBr) `zw8zO2mnqTDZ2rBr`

Sheet: [24-site-tiles-4](https://docs.google.com/spreadsheets/d/1AxTan_epEpQEPukFztP6MhiIpgxzAYISj1kWz-Gqw4k/edit) — repo mirror `marketing/sheets/24-site-tiles-4.csv`.

Do **not** Publish. Prompt review gate applies: Sal approves the exact `still_prompt`, then says "you may run the workflow" / "you can start the workflow".

Run: set `tile_id` in `choose_tile` (`TILE-01` … `TILE-04`), click Execute. One run = one tile × `still_takes` takes.

```text
manual_trigger → choose_tile → get_site_tiles → filter_tiles_active → pick_site_tile → flux_2_max_still → check_flux_still → flux_still_to_file → upload_tile_to_drive → collect_tile_takes → sheets_update_tile
```

## Tiles

| tile_id | Replaces (`theme/palmbeach-vitality/assets/images/`) | Overlay text |
|---|---|---|
| TILE-01 | `home-peptides.jpg` | VIALS / Peptides |
| TILE-02 | `home-peptide-pens.jpg` | PENS / Peptides |
| TILE-03 | `home-weight-loss.jpg` | VIALS / Metabolic |
| TILE-04 | `home-weight-loss-pens.jpg` | PENS / Metabolic |

## Sheet columns (nothing hardcoded — empty cell throws)

| Column | Use |
|---|---|
| `tile_id`, `status`, `rank`, `slug`, `theme_filename` | Row identity; only `status = Active` rows are used |
| `overlay_eyebrow`, `overlay_title` | Tile text (reference for post compositing) |
| `model_still` | Must start `black-forest-labs/flux.2-` (currently `flux.2-max`) |
| `aspect_ratio` | OpenRouter enum (`16:9` for site tiles) |
| `output_format` | `png` or `jpeg` |
| `still_n` | Must be `1` (Flux max per request) |
| `still_takes` | 1–4 separate requests per run |
| `still_timeout_seconds` | HTTP timeout |
| `min_width`, `min_height` | Quality floor (1792×1008 = current tile size) |
| `input_reference_urls` | Up to 8 https product photos, `\|`-separated |
| `still_prompt` | The prompt — edit freely |
| `take_urls`, `take_sizes`, `take_cost_usd`, `times_used`, `last_used_at` | Written back by the run |

## Node 1 — `manual_trigger`

**Before → this → After:** `unwired` → **manual_trigger** → `choose_tile`

## Node 2 — `choose_tile`

**Before → this → After:** `manual_trigger` → **choose_tile** → `get_site_tiles`

Set node, one field `tile_id` (string). Change it to pick the tile.

## Node 3 — `get_site_tiles`

**Before → this → After:** `choose_tile` → **get_site_tiles** → `filter_tiles_active`

Google Sheets Get Rows, sheet 24-site-tiles-4 tab `Untitled` (gid `73402774`), credential `OGHfxWtOUeZbDesw`. Execute Once = ON.

## Node 4 — `filter_tiles_active`

**Before → this → After:** `get_site_tiles` → **filter_tiles_active** → `pick_site_tile`

Filter `status` equals `Active`.

## Node 5 — `pick_site_tile`

**Before → this → After:** `filter_tiles_active` → **pick_site_tile** → `flux_2_max_still`

Code (Run Once for All Items): `marketing/n8n-code-pick-site-tile.js`. Validates the row, builds `flux_body`, fans out one item per take.

## Node 6 — `flux_2_max_still`

**Before → this → After:** `pick_site_tile` → **flux_2_max_still** → `check_flux_still`

| Parameter | fx | Value |
|---|---|---|
| Method | OFF | POST |
| URL | OFF | `https://openrouter.ai/api/v1/images` |
| Auth | OFF | Predefined **OpenRouter** `zDmHXnCHbj14yIvl` |
| Body | ON | JSON `={{ JSON.stringify($json.flux_body) }}` |
| Timeout | ON | `={{ $json.still_timeout_seconds * 1000 }}` |

## Node 7 — `check_flux_still`

**Before → this → After:** `flux_2_max_still` → **check_flux_still** → `flux_still_to_file`

Code (Run Once for Each Item): `marketing/n8n-code-check-flux-still.js`. Decodes `data[0].b64_json`, reads real pixel size from the PNG/JPEG header, sets `size_ok`, carries `usage.cost`. Throws if no image.

## Node 8 — `flux_still_to_file`

**Before → this → After:** `check_flux_still` → **flux_still_to_file** → `upload_tile_to_drive`

Convert to File → Move Base64 String to File, source `still_b64`, MIME `={{ $json.still_mime }}`.

## Node 9 — `upload_tile_to_drive`

**Before → this → After:** `flux_still_to_file` → **upload_tile_to_drive** → `collect_tile_takes`

Google Drive Upload, My Drive root, credential `r8UCuQ56DMVlpzRO`, name `={{ $('check_flux_still').item.json.take_file_name }}`, Simplify OFF.

## Node 10 — `collect_tile_takes`

**Before → this → After:** `upload_tile_to_drive` → **collect_tile_takes** → `sheets_update_tile`

Code (Run Once for All Items): `marketing/n8n-code-collect-site-tile-takes.js`. Appends Drive links + sizes (flags `(below 1792x1008)`), sums cost, bumps `times_used`.

## Node 11 — `sheets_update_tile`

**Before → this → After:** `collect_tile_takes` → **sheets_update_tile** → `end`

Google Sheets Update Row, match on `tile_id`, Cell Format RAW. Writes `take_urls`, `take_sizes`, `take_cost_usd`, `times_used`, `last_used_at`.

## Resolution caveat

OpenRouter's FLUX.2 Max API has **no size parameter** — only `aspect_ratio`. Output pixels are measured after each take. Takes below `min_width × min_height` are still saved (already paid) but marked `(below 1792x1008)` in `take_sizes`; don't ship those. Cost is ~$0.07/MP per take.

## Text overlay

Image models misspell text. Best practice: generate the scene clean, then composite `overlay_eyebrow` / `overlay_title` in post to match the current tiles exactly.
