# peptide_molecule_vid_gen

**New workflow** — chemical-breakdown molecule videos.  
**Not** the lab-vial daily path. **Not** Creatomate. **No Switch / IF.**

**Sheet:** `13-chem-breakdown-54` (same columns as Sheet 9)  
**Name the workflow exactly:** `peptide_molecule_vid_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/EcGTbpZ9VG3C69pq  
**Workbook:** https://docs.google.com/spreadsheets/d/1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0 — tab `13-chem-breakdown-54`.

**Vibe (mandatory):** dark cinematic 3D **medical animation of a cellular chemical reaction** — living cells + amino acids forming peptide bonds at microscopic scale. Not a sunlit studio. Not a glass pedestal. Not the pen workflow. **No logo. No text. No sound** (add those after vid gen). Clip is muted (`audio: false`).

Sister workflow (pens, separate import): `peptide_pen_vid_gen` → Sheet `14-pen-creations-150`. Do not mix sheets.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → get_chem_creations
  → filter_chem_active
  → pick_molecule_creation
  → sheets_update_chem
  → grok_imagine_molecule_still
  → save_still_url
  → prep_molecule_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_video_url
```

---

## After import

Imported into n8n Cloud (unpublished). Google Sheets account + XAI Grok header auth are attached.

1. Tab is `13-chem-breakdown-54`. Do not point this workflow at `9-lab-item-creations-500`.
2. Test with **Execute workflow** (manual). Do not Publish until one row looks right.

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger  

---

## Node 2 — `get_chem_creations`

**Type:** Google Sheets · Get Row(s)  
**Before → this → After:** `manual_trigger` → **get_chem_creations** → `filter_chem_active`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Get Row(s) |
| Document | — | **By ID** (your workbook) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Return All | — | **ON** |

---

## Node 3 — `filter_chem_active`

**Type:** Filter  
**Before → this → After:** `get_chem_creations` → **filter_chem_active** → `pick_molecule_creation`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $json.status }}` |
| Operator | — | is equal to |
| Value 2 | **OFF** | `Active` |

---

## Node 4 — `pick_molecule_creation`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `filter_chem_active` → **pick_molecule_creation** → `sheets_update_chem`

Paste: `marketing/n8n-code-pick-molecule-creation.js`

Rotates **compound_name** (never the last **5** used compounds). Sheet rows are staggered so any 5 consecutive ranks are 5 different products.

**Settings → Execute Once:** **OFF**. If this is ON, n8n only passes CHEM-001 into the Code node and every run repeats row 1.

Picks the next **unused** row by `rank` (`CHEM-001` then `CHEM-002` …). A row is used if `times_used > 0` or `last_used_at` is set.

**Check:** `lab_item_id` (should advance), `input_row_count` = 54, `model_still` = `grok-imagine-image-2.0`

---

## Node 5 — `grok_imagine_molecule_still`

**Type:** HTTP Request  
**Before → this → After:** `sheets_update_chem` → **grok_imagine_molecule_still** → `save_still_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| Authentication | — | Header Auth → same xAI as vial stills |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | see below |

```text
={{ JSON.stringify({ model: $('pick_molecule_creation').first().json.model_still, prompt: $('pick_molecule_creation').first().json.video_prompt, n: 1, aspect_ratio: $('pick_molecule_creation').first().json.aspect_ratio || '9:16', resolution: $('pick_molecule_creation').first().json.still_resolution || '2k' }) }}
```

**Check:** `$json.data[0].url` — one molecule, no vial.

---

## Node 6 — `save_still_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_imagine_molecule_still` → **save_still_url** → `prep_molecule_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_molecule_creation').first().json.compound_name }}` |
| `video_motion_prompt` | **ON** | `={{ $('pick_molecule_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $('pick_molecule_creation').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | **ON** | `={{ $('pick_molecule_creation').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | **ON** | `={{ $('pick_molecule_creation').first().json.resolution \|\| '1080p' }}` |

---

## Node 7 — `prep_molecule_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **prep_molecule_video_start** → `grok_video_start`

Paste: `marketing/n8n-code-prep-molecule-video-start.js`

**Check:** `still_url` https + `grok_video_body_json`

---

## Node 8 — `grok_video_start`

**Type:** HTTP Request  
**Before → this → After:** `prep_molecule_video_start` → **grok_video_start** → `wait_video`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/videos/generations` |
| Authentication | — | same xAI Header Auth |
| Send Body | — | **ON** |
| Body Content Type | — | **Raw** |
| Content Type | **OFF** | `application/json` |
| Body | **ON** | `={{ $json.grok_video_body_json }}` |

**Check:** `request_id`. Clip is **muted** (`audio: false` + silent motion). Add sound later.

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
**Before → this → After:** `grok_video_poll` → **save_video_url** → (end)  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | **ON** | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_molecule_creation').first().json.compound_name }}` |
| `created_at` | **ON** | `={{ $now.toISO() }}` |

---

## Node 12 — `sheets_update_chem`

**Type:** Google Sheets → Update  
**Before → this → After:** `pick_molecule_creation` → **sheets_update_chem** → `grok_imagine_molecule_still`

Marks the row used **before** the still so a still-only Execute still advances to CHEM-002 next time.

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | **By ID** (same as `get_chem_creations`) |
| Sheet | **OFF** | `13-chem-breakdown-54` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('pick_molecule_creation').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('pick_molecule_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |

---

## Importable JSON

`marketing/workflows/peptide_molecule_vid_gen.json`  
n8n: **Import from File** → name stays `peptide_molecule_vid_gen` → attach credentials → set Sheet document ID.

---

## Related

- Sheet: `marketing/sheets/13-chem-breakdown-54.csv`
- Pick: `marketing/n8n-code-pick-molecule-creation.js`
- Prep video: `marketing/n8n-code-prep-molecule-video-start.js`
