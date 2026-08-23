# seedance_25_vid_gen

**New workflow** — hyperrealistic **text-to-video** from a Google Sheet.  
**Not** Grok stills. **Not** Creatomate. **Not** vial / pen / molecule daily paths. **No Switch / IF.**

DeepSeek has no official video API. This is ByteDance **Seedance 2.5** on fal (`bytedance/seedance-2.5/text-to-video`), already planned in `GOAL.md`.

**Sheet:** `17-seedance-25-t2v`  
**Name the workflow exactly:** `seedance_25_vid_gen`  
**Live unpublished:** https://stockjohnson.app.n8n.cloud/workflow/ItjZGciut9XK3jHH  
**Workbook:** the `17-seedance-25-t2v` spreadsheet (document ID is wired in n8n; not stored in this repo). Tab gid `1300090740`.

**Nothing hardcoded in nodes.** Prompt, model, duration, resolution, aspect, audio, bitrate, and wait all come from the sheet. Empty cells throw. Filter `status=Active` is allowed. Runtime `video_url` / `request_id` come from fal.

**Duration:** Seedance 2.5 on fal is native **4–30 seconds**. Sheet rows ship `duration_seconds=30` (the native max). **60s is not available** on this endpoint — change the sheet only when a model that actually does 60 is listed.

**Audio:** sheet `audio` (`false` / `true`). Default rows are `false` so soundtrack can be added later. Flip the cell if you want Seedance native sound.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → get_seedance_scenes
  → filter_seedance_active
  → pick_seedance_scene
  → fal_seedance_generate
  → save_video_url
  → sheets_update_seedance
```

---

## After import

Unpublished. Google Sheets account + fal.ai account are attached.

1. Do **not** point this at Sheet 9 / 13 / 14.
2. Edit prompts on the sheet. Re-Execute to pick the least-used Active row.
3. Do **not** Publish until one row looks right.
4. One 30s 720p clip is expensive — do not batch-fire.

Pick-only smoke (fal disabled) exec `1525`: sheet read + filter + pick `SD25-001` succeeded (`model_video` / `30` / `720p` / `9:16` / `audio=false` all from the sheet). Fal was re-enabled after. Overlay exec `1523` wrote the 27 rows, then archived.

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger

---

## Node 2 — `get_seedance_scenes`

**Type:** Google Sheets · Get Row(s)  
**Before → this → After:** `manual_trigger` → **get_seedance_scenes** → `filter_seedance_active`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Get Row(s) |
| Document | — | **By ID** (17-seedance-25-t2v workbook) |
| Sheet | **OFF** | tab gid `1300090740` (rename the tab to `17-seedance-25-t2v` in Google Sheets if you want the display name to match) |
| Return All | — | **ON** |

---

## Node 3 — `filter_seedance_active`

**Type:** Filter  
**Before → this → After:** `get_seedance_scenes` → **filter_seedance_active** → `pick_seedance_scene`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $json.status }}` |
| Operator | — | is equal to |
| Value 2 | **OFF** | `Active` |

---

## Node 4 — `pick_seedance_scene`

**Type:** Code · Run Once for All Items · Execute Once **OFF**  
**Before → this → After:** `filter_seedance_active` → **pick_seedance_scene** → `fal_seedance_generate`

Paste: `marketing/n8n-code-pick-seedance-25.js`

Least-used Active row. Empty `video_prompt` / `model_video` / `duration_seconds` / `resolution` / `aspect_ratio` / `audio` / `bitrate_mode` / `wait_seconds` throw.

**Check:** `model_video` = sheet value, `duration_seconds` is a number, `video_prompt_len` present.

---

## Node 5 — `fal_seedance_generate`

**Type:** fal.ai · Resource `model` · Operation `generate`  
**Before → this → After:** `pick_seedance_scene` → **fal_seedance_generate** → `save_video_url`  
**Credential:** fal.ai account

| Setting | fx | Value |
|---|---|---|
| Model | **ON** | `={{ $json.model_video }}` (mode **id**) |
| Parameter `prompt` | **ON** | `={{ $json.video_prompt }}` |
| Parameter `resolution` | **ON** | `={{ $json.resolution }}` |
| Parameter `duration` | **ON** | `={{ String($json.duration_seconds) }}` |
| Parameter `aspect_ratio` | **ON** | `={{ $json.aspect_ratio }}` |
| Parameter `generate_audio` | **ON** | `={{ $json.generate_audio }}` |
| Parameter `bitrate_mode` | **ON** | `={{ $json.bitrate_mode }}` |
| Wait for completion | **OFF** | `true` |
| Poll interval | **OFF** | `5` |
| Max wait | **ON** | `={{ Number($json.wait_seconds) }}` |

**Check:** response has an `https://` video URL.

---

## Node 6 — `save_video_url`

**Type:** Code · Run Once for All Items · Execute Once **OFF**  
**Before → this → After:** `fal_seedance_generate` → **save_video_url** → `sheets_update_seedance`

Paste: `marketing/n8n-code-save-seedance-25-url.js`

**Check:** `video_url` https + `creation_id` + `times_used` incremented.

---

## Node 7 — `sheets_update_seedance`

**Type:** Google Sheets → Update  
**Before → this → After:** `save_video_url` → **sheets_update_seedance** → (end)

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | **By ID** (same workbook) |
| Sheet | **OFF** | same tab gid `1300090740` |
| Mapping | — | auto-map input |
| Column to Match On | **OFF** | `creation_id` |

Writes `creation_id`, `times_used`, `last_used_at`, `video_url`, `request_id` only.

---

## Sheet columns

| Column | Role |
|---|---|
| `creation_id` | Match key (`SD25-001` …) |
| `video_prompt` | Full hyperrealistic T2V prompt |
| `model_video` | fal model id, e.g. `bytedance/seedance-2.5/text-to-video` |
| `duration_seconds` | `4`–`30` (API max 30) |
| `resolution` | `480p` / `720p` / `1080p` |
| `aspect_ratio` | `9:16` / `16:9` / … |
| `audio` | `false` or `true` → fal `generate_audio` |
| `bitrate_mode` | `standard` or `high` |
| `wait_seconds` | fal max wait |
| `status` | `Active` to be pickable |

CSV: https://github.com/PalmBeach-Vitality/store/blob/cursor/seedance-25-sheets-vid-4c4b/marketing/sheets/17-seedance-25-t2v.csv

---

## Related

- Older I2V Seedance notes (Grok still → 15s): `n8n-seedance-vid-gen.md`  
- Sheets-only rule: `n8n-sheets-only-vid-gen.md`  
- Pick: `n8n-code-pick-seedance-25.js`  
- Save URL: `n8n-code-save-seedance-25-url.js`  
- Builder: `scripts/build_seedance_25_t2v.py`  
- Overlay (one-shot, archived after exec `1523`): `n8n-code-overlay-seedance-25-sheet.js` — 27 Active rows are on the live workbook (`SD25-001` … `SD25-027`).  
