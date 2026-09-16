# peptide_pen_vid_gen

**New workflow** — pens-only catalog videos.  
**Not** the lab-vial daily path. **Not** molecules. **Not** Creatomate. **No Switch / IF.**

**Sheet:** `14-pen-creations-150` (**columns from** `9-lab-item-creations-500`, not Sheet 13)  
**Name the workflow exactly:** `peptide_pen_vid_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/eLM4xCpHflgqJGfB  
**Workbook:** the `14-pen-creations-150` spreadsheet already imported (document ID is wired in n8n; not stored in this repo).

**Pen input (from `3-image-scenes-150`):** `product_hero`, `product_form_detail`, `lab_environment`, `camera`, `lighting`, `scene_category`, `scene_brief`.  
Exactly **one** white matte insulin-style **3ml** pen, **10–20% longer** full-length barrel (not stubby). Cap on (white clip). Label = **compound name + `3ml pen` only** — no milligram dosage. GLOW liquid = bright blue in the small window; everyone else clear. Stack SKUs on the sheet: **GLOW**, **KLOW**, **Wolverine** (type any of those on `choose_compound`).

**Pen hardware (mandatory):** white plastic body, white cap + pocket clip ON, small rectangular barrel window, bright orange ridged dial. Label: bright **blue** DNA helix, **orange** compound name, **orange** badge `3ml pen`. Not a glass vial. Not brushed silver. Not maroon vial branding.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → choose_compound
  → get_pen_creations
  → filter_pen_active
  → alias_stack_names
  → pull_sheet_row
  → grok_imagine_pen_still
  → save_still_url
  → prep_pen_video_start
  → fal_kling_generate               fal Kling 3.0 Pro I2V, 1080p, no audio
  → assert_video_ok
  → save_video_url
  → sheets_update_pen
```

**Vid gen API:** fal.ai Kling 3.0 **Pro** I2V at **1080p**, `generate_audio: false`. The slug lives on
Sheet 14 `model_video` (`fal-ai/kling-video/v3/pro/image-to-video`) and `fal_kling_generate` reads it
with `={{ $json.model_video }}` — **nothing is pinned on the node**. Pro has no `resolution` field and
I2V takes `aspect_ratio` from the start image, so `ffprobe` the clip for 1080 × 1920 rather than
trusting the sheet cell. `grok_video_start` / `wait_video` / `grok_video_poll` stay on the canvas
**disabled** — Nodes 8–10 below document that dead path.

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
**Before → this → After:** `get_pen_creations` → **filter_pen_active** → `alias_stack_names`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $json.status }}` |
| Operator | — | is equal to |
| Value 2 | **OFF** | `Active` |

---

## Node 4 — `alias_stack_names`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `filter_pen_active` → **alias_stack_names** → `pull_sheet_row`

Paste: `marketing/n8n-code-alias-stack-names.js`

Maps catalog nicknames **GLOW**, **KLOW**, **Wolverine** onto chemical blend strings (and the reverse). Does not invent prompts.

---

## Node 5 — `pull_sheet_row`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `alias_stack_names` → **pull_sheet_row** → `grok_imagine_pen_still`

Reads `choose_compound.compound_name`. Picks the least-used Active Sheet 14 row for that match. Passes every field as-is.

---

## Node 6 — `grok_imagine_pen_still`

**Type:** HTTP Request  
**Before → this → After:** `pull_sheet_row` → **grok_imagine_pen_still** → `save_still_url`

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
**Before → this → After:** `grok_imagine_pen_still` → **save_still_url** → `skip_still_edit` (or `still_edit_instructions`)  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $('pick_pen_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_pen_creation').first().json.compound_name }}` |
| `video_motion_prompt` | **ON** | `={{ $('pick_pen_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $('pull_sheet_row').first().json.model_video }}` |
| `duration_seconds` | **ON** | `={{ $('pull_sheet_row').first().json.duration_seconds }}` |
| `resolution` | **ON** | `={{ $('pull_sheet_row').first().json.resolution }}` |

No `||` fallbacks on these three. An empty sheet cell has to throw — a `|| 'grok-imagine-video-1.5'` or
`|| '1080p'` default is exactly the hardcode `.cursor/rules/no-hardcode-unless-asked.mdc` forbids, and it
is how a row can claim one model while another one renders.

---

## Node 7 — `prep_pen_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `skip_still_edit` → **prep_pen_video_start** → `fal_kling_generate`

Paste: `marketing/n8n-code-prep-pen-video-start.js`

Reads `video_motion_prompt` from `pull_sheet_row`. Does **not** truncate. Throws if the sheet motion still has vial / flip-off language (that morphs the pen into a vial).

**Check:** `still_url` https + `grok_video_body_json` starts with `PEN LOCK`

---

## Node 8 — `fal_kling_generate`

**Type:** fal.ai (`@fal-ai/n8n-nodes-fal.falAi`)
**Before → this → After:** `prep_pen_video_start` → **fal_kling_generate** → `assert_video_ok`

| Setting | fx | Value |
|---|---|---|
| Resource / Operation | — | Model / Generate |
| Model | **ON** | `={{ $json.model_video }}` (mode: By ID) |
| Parameter `prompt` | **ON** | `={{ $json.video_motion_prompt }}` |
| Parameter `start_image_url` | **ON** | `={{ $json.still_url }}` |
| Parameter `duration` | **ON** | `={{ String($json.duration_seconds) }}` |
| Parameter `generate_audio` | **ON** | `={{ false }}` |
| Wait For Completion | — | **ON** (poll 5s, max 600s) |
| Credential | — | `fal.ai account` |

`generate_audio` must be the expression `={{ false }}`, not the text `false` — fal reads the literal
string `"false"` as truthy and you get a clip with sound.

Because the node waits for the render itself, Sheet 14 `wait_seconds` no longer drives the video wait.
A timeout is `maxWaitTime` on this node.

---

## Node 9 — `assert_video_ok`

**Type:** Code · Run Once for All Items
**Before → this → After:** `fal_kling_generate` → **assert_video_ok** → `save_video_url`

Throws if the fal result has no `video.url`, or reports `failed` / `error`. Without it `save_video_url`
writes an empty `video_url` and `sheets_update_pen` still bumps `times_used`, so the row rotates out
with nothing to show for it.

---

## Disabled — the old Grok video path

Kept on the canvas for reference. Do not re-enable without asking.

### `grok_video_start`

**Type:** HTTP Request
**Before → this → After:** `unwired` → **grok_video_start** → `wait_video`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/videos/generations` |
| Authentication | — | same xAI Header Auth |
| Send Body | — | **ON** |
| Body Content Type | — | **Raw** |
| Content Type | **OFF** | `application/json` |
| Body | **ON** | `={{ $json.grok_video_body_json }}` |

**Check:** `request_id`. Clip is **muted**: `prep_pen_video_start` sends `audio: false` and prefixes the sheet `video_motion_prompt` with the silent lock (`Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio.`).

**Audio is off. Always. All three vid-gen workflows** (this one, `Vid_gen_lab_scenes`, `Vid_gen_landscape_scenes`). Salvatore's standing rule, and the one value these nodes are allowed to hardcode. Add sound in post if a reel ever needs it — never here.

---

### `wait_video`

**Type:** Wait  
**Before → this → After:** `grok_video_start` → **wait_video** → `grok_video_poll`

| Setting | fx | Value |
|---|---|---|
| Resume | — | After time interval |
| Wait Amount | **OFF** | `200` |
| Wait Unit | — | Seconds |

Must be **enabled**.

---

### `grok_video_poll`

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

## Node 10 — `save_video_url`

**Type:** Edit Fields  
**Before → this → After:** `assert_video_ok` → **save_video_url** → `sheets_update_pen`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | **ON** | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | **ON** | `={{ $('pick_pen_creation').first().json.creation_id }}` |
| `compound_name` | **ON** | `={{ $('pick_pen_creation').first().json.compound_name }}` |
| `created_at` | **ON** | `={{ $now.toISO() }}` |

---

## Node 11 — `sheets_update_pen`

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
