# peptide_pen_vid_gen

**New workflow** — pens-only catalog videos.  
**Not** the lab-vial daily path. **Not** molecules. **Not** Creatomate. **No Switch / IF.**

**Sheet:** `14-pen-creations-150` (**columns from** `9-lab-item-creations-500`, not Sheet 13)  
**Name the workflow exactly:** `peptide_pen_vid_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/eLM4xCpHflgqJGfB  
**Workbook:** the `14-pen-creations-150` spreadsheet already imported (document ID is wired in n8n; not stored in this repo).

**Pen input (from `3-image-scenes-150`):** `product_hero`, `product_form_detail`, `lab_environment`, `camera`, `lighting`, `scene_category`, `scene_brief`.  
Exactly **one** capped pre-filled research pen. Cap stays on. No vial.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → get_pen_creations
  → filter_pen_active
  → pick_pen_creation
  → grok_imagine_pen_still
  → save_still_url
  → prep_pen_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_video_url
  → sheets_update_pen
```

---

## After import

Imported into n8n Cloud (unpublished). Google Sheets account + XAI Grok header auth are attached.

1. Do **not** replace `3-image-scenes-150` (Buffer tab stays header-only).
2. Do not point this workflow at `9-lab-item-creations-500` (mixed lab) or `13-chem-breakdown-54` (molecules).
3. Test with **Execute workflow** (manual). Do not Publish until one row looks right.

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger  

---

## Node 2 — `get_pen_creations`

**Type:** Google Sheets · Get Row(s)  
**Before → this → After:** `manual_trigger` → **get_pen_creations** → `filter_pen_active`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Get Row(s) |
| Document | — | **By ID** (your workbook) |
| Sheet | **OFF** | `14-pen-creations-150` |
| Return All | — | **ON** |

---

## Node 3 — `filter_pen_active`

**Type:** Filter  
**Before → this → After:** `get_pen_creations` → **filter_pen_active** → `pick_pen_creation`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $json.status }}` |
| Operator | — | is equal to |
| Value 2 | **OFF** | `Active` |

---

## Node 4 — `pick_pen_creation`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `filter_pen_active` → **pick_pen_creation** → `grok_imagine_pen_still`

Paste: `marketing/n8n-code-pick-pen-creation.js`

Rotates **compound_name** (never the last **5** used compounds). Sheet rows are staggered so any 5 consecutive ranks are 5 different products.

**Check:** `compound_name`, `video_prompt_len` (~4500), `model_still` = `grok-imagine-image-2.0`

---

## Node 5 — `grok_imagine_pen_still`

**Type:** HTTP Request  
**Before → this → After:** `pick_pen_creation` → **grok_imagine_pen_still** → `save_still_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| Authentication | — | Header Auth → same xAI as vial stills |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | see below |

```text
={{ JSON.stringify({ model: $json.model_still, prompt: $json.video_prompt, n: 1, aspect_ratio: $json.aspect_ratio || '9:16', resolution: $json.still_resolution || '2k' }) }}
```

**Check:** `$json.data[0].url` — one capped pen, no vial, no second pen.

---

## Node 6 — `save_still_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_imagine_pen_still` → **save_still_url** → `prep_pen_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $('pick_pen_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_pen_creation').first().json.compound_name }}` |
| `video_motion_prompt` | **ON** | `={{ $('pick_pen_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $('pick_pen_creation').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | **ON** | `={{ $('pick_pen_creation').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | **ON** | `={{ $('pick_pen_creation').first().json.resolution \|\| '1080p' }}` |

---

## Node 7 — `prep_pen_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **prep_pen_video_start** → `grok_video_start`

Paste: `marketing/n8n-code-prep-pen-video-start.js`

**Check:** `still_url` https + `grok_video_body_json`

---

## Node 8 — `grok_video_start`

**Type:** HTTP Request  
**Before → this → After:** `prep_pen_video_start` → **grok_video_start** → `wait_video`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/videos/generations` |
| Authentication | — | same xAI Header Auth |
| Send Body | — | **ON** |
| Body Content Type | — | **Raw** |
| Content Type | **OFF** | `application/json` |
| Body | **ON** | `={{ $json.grok_video_body_json }}` |

**Check:** `request_id`

---

## Node 9 — `wait_video`

**Type:** Wait  
**Before → this → After:** `grok_video_start` → **wait_video** → `grok_video_poll`

| Setting | fx | Value |
|---|---|---|
| Resume | — | After time interval |
| Wait Amount | **OFF** | `200` |
| Wait Unit | — | Seconds |

Must be **enabled**.

---

## Node 10 — `grok_video_poll`

**Type:** HTTP Request  
**Before → this → After:** `wait_video` → **grok_video_poll** → `save_video_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `GET` |
| URL | **ON** | `={{ 'https://api.x.ai/v1/videos/' + $('grok_video_start').first().json.request_id }}` |
| Authentication | — | same xAI |
| Send Body | — | **OFF** |

**Check:** `status` done/succeeded + video URL. If pending, raise wait.

---

## Node 11 — `save_video_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_video_poll` → **save_video_url** → `sheets_update_pen`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | **ON** | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | **ON** | `={{ $('pick_pen_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_pen_creation').first().json.compound_name }}` |
| `created_at` | **ON** | `={{ $now.toISO() }}` |

---

## Node 12 — `sheets_update_pen`

**Type:** Google Sheets → Update  
**Before → this → After:** `save_video_url` → **sheets_update_pen** → (end)

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | **By ID** (same as `get_pen_creations`) |
| Sheet | **OFF** | `14-pen-creations-150` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('pick_pen_creation').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('pick_pen_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |

---

## Importable JSON

`marketing/workflows/peptide_pen_vid_gen.json`  
n8n: **Import from File** → name stays `peptide_pen_vid_gen` → attach credentials → set Sheet document ID.

---

## Related

- Sheet 9 columns (output): `marketing/sheets/14-pen-creations-150.csv`
- Pen input *field names* (do not overwrite that tab): `product_hero`, `product_form_detail`, `lab_environment`, `camera`, `lighting` from `3-image-scenes-150`
- Builder: `marketing/scripts/build_pen_creations_from_image_scenes.py`
- Pick: `marketing/n8n-code-pick-pen-creation.js`
- Prep video: `marketing/n8n-code-prep-pen-video-start.js`
- Sister workflow: `peptide_molecule_vid_gen` / Sheet 13 (do not mix)
