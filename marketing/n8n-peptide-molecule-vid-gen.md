# peptide_molecule_vid_gen

**Chemical-breakdown molecule videos.**  
**Not** the lab-vial daily path. **Not** Creatomate. **No Switch / IF.**

**Sheet:** `13-chem-breakdown-54`  
**Name the workflow exactly:** `peptide_molecule_vid_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/EcGTbpZ9VG3C69pq  
**Workbook:** https://docs.google.com/spreadsheets/d/1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0 — tab `13-chem-breakdown-54`.

**Vibe (mandatory):** dark cinematic 3D **medical animation of a cellular chemical reaction** — living cells + amino acids forming peptide bonds at microscopic scale. Not a sunlit studio. Not a glass pedestal. Not the pen workflow. **No logo. No text. No sound** (add those after vid gen).

**Still:** Grok Imagine Image (`model_still` on the sheet).  
**Video:** kie.ai Kling image-to-video (`model_video` on the sheet, overlay writes `kling-3.0-omni/image-to-video`). Clip is muted (`audio: false` + silent motion). Omni I2V holds the sheet’s existing 15s / 1080p, so the old Grok 15+10 extend dance is disabled.

Sister workflow (pens, separate import): `peptide_pen_vid_gen` → Sheet `14-pen-creations-150`. Do not mix sheets.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → get_chem_creations
  → filter_chem_active
  → pick_molecule_creation
  → grok_imagine_molecule_still
  → save_still_url
  → prep_molecule_video_start
  → kling_i2v_start
  → wait_video
  → kling_i2v_poll
  → save_video_url
  → sheets_update_chem
```

`enter_video_seconds` and the Grok extend nodes stay on the canvas **disabled**. Do not leave them on the live wire.

---

## After import / before Execute

1. Tab is `13-chem-breakdown-54`. Do not point this workflow at `9-lab-item-creations-500`.
2. Overlay `model_video` to `kling-3.0-omni/image-to-video` (`marketing/n8n-overlay-molecule-kling.md`). Daily `pick_molecule_creation` is not rewritten.
3. The key Salvatore entered is **one** Bearer API key. There is **no Secret Key**. Official Kling Access Key + Secret Key JWT is the wrong path for this key.
4. `kling_i2v_start` and `kling_i2v_poll` send Header `Authorization: Bearer <that one key>`. Authentication on those two nodes is **None** (the header is on the node). Do **not** attach `XAI Grok`.
5. Test with **Execute workflow** (manual). Do not Publish until one row looks right. Do not fire a paid Kling clip until you want one.

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger  
**Before → this → After:** (start) → **manual_trigger** → `get_chem_creations`

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

**Settings → Execute Once:** **ON**.

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
**Before → this → After:** `filter_chem_active` → **pick_molecule_creation** → `grok_imagine_molecule_still`

Paste: `marketing/n8n-code-pick-molecule-creation.js`

**Settings → Execute Once:** **OFF**. If this is ON, n8n only passes CHEM-001 into the Code node and every run repeats row 1.

Picks the next **unused** row by `rank`. A row is used if `times_used > 0` or `last_used_at` is set.

**Check:** `lab_item_id` (should advance), `input_row_count` = 54, `model_still` = `grok-imagine-image-2.0`, `model_video` = `kling-3.0-omni/image-to-video`

---

## Node 5 — `grok_imagine_molecule_still`

**Type:** HTTP Request  
**Before → this → After:** `pick_molecule_creation` → **grok_imagine_molecule_still** → `save_still_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| Authentication | — | Header Auth → same xAI as vial stills |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | see below |

```text
={{ JSON.stringify({ model: $('pick_molecule_creation').first().json.model_still, prompt: $('pick_molecule_creation').first().json.video_prompt, n: 1, aspect_ratio: $('pick_molecule_creation').first().json.aspect_ratio, resolution: $('pick_molecule_creation').first().json.still_resolution }) }}
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
| `model_video` | **ON** | `={{ $('pick_molecule_creation').first().json.model_video }}` |
| `duration_seconds` | **ON** | `={{ $('pick_molecule_creation').first().json.duration_seconds }}` |
| `resolution` | **ON** | `={{ $('pick_molecule_creation').first().json.resolution }}` |

---

## Node 7 — `prep_molecule_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **prep_molecule_video_start** → `kling_i2v_start`

Paste: `marketing/n8n-code-prep-molecule-video-start.js`

Builds `kling_i2v_body_json` for kie `createTask`:

- `model` = sheet `model_video`
- `input.image_urls` = `[Grok still_url]`
- `input.prompt` = silent-locked `video_motion_prompt` (omni max 3072)
- `input.duration` = sheet `duration_seconds` (integer 3–15)
- `input.resolution` = sheet `resolution` (`720p` / `1080p` / `4k`)
- `input.audio` = `false`

Throws if `model_video` is empty or still a Grok name. Does **not** mint a JWT. Does **not** need a Secret Key.

**Check:** `still_url` https + `kling_i2v_body_json`

---

## Node 8 — `kling_i2v_start`

**Type:** HTTP Request  
**Before → this → After:** `prep_molecule_video_start` → **kling_i2v_start** → `wait_video`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.kie.ai/api/v1/jobs/createTask` |
| Authentication | — | **None** — header is on the node |
| Send Headers | — | **ON** |
| Header `Authorization` | **OFF** | `Bearer <the one API key>` |
| Send Body | — | **ON** |
| Body Content Type | — | **Raw** |
| Content Type | **OFF** | `application/json` |
| Body | **ON** | `={{ $json.kling_i2v_body_json }}` |

**Check:** `data.taskId`. Clip is **muted**. Add sound later. Do **not** attach `XAI Grok`.

---

## Node 9 — `wait_video`

**Type:** Wait  
**Before → this → After:** `kling_i2v_start` → **wait_video** → `kling_i2v_poll`

| Setting | fx | Value |
|---|---|---|
| Resume | — | After time interval |
| Wait Amount | **OFF** | `200` |
| Wait Unit | — | Seconds |

Must be **enabled**.

---

## Node 10 — `kling_i2v_poll`

**Type:** HTTP Request  
**Before → this → After:** `wait_video` → **kling_i2v_poll** → `save_video_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `GET` |
| URL | **ON** | `={{ 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + $('kling_i2v_start').first().json.data.taskId }}` |
| Authentication | — | **None** — header is on the node |
| Send Headers | — | **ON** |
| Header `Authorization` | **OFF** | `Bearer <the same one API key>` |
| Send Body | — | **OFF** |

**Check:** `data.state` = `success` + `data.resultJson` has `resultUrls[0]`. If still `generating` / `waiting` / `queuing`, raise wait.

---

## Node 11 — `save_video_url`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `kling_i2v_poll` → **save_video_url** → `sheets_update_chem`

Paste: `marketing/n8n-code-save-molecule-video-url.js`

Throws if `data.state` is not `success` or `resultUrls[0]` is missing.

**Check:** `video_url` https + `request_id` = kie `taskId`

---

## Node 12 — `sheets_update_chem`

**Type:** Google Sheets → Update  
**Before → this → After:** `save_video_url` → **sheets_update_chem** → (end)

Marks the row used **after** the video so a failed Kling job does not burn the row.

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

## Related

- Sheet: `marketing/sheets/13-chem-breakdown-54.csv`
- Pick: `marketing/n8n-code-pick-molecule-creation.js`
- Prep video: `marketing/n8n-code-prep-molecule-video-start.js`
- Save video: `marketing/n8n-code-save-molecule-video-url.js`
- Overlay: `marketing/n8n-overlay-molecule-kling.md`
