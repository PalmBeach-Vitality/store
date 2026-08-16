# Still edit before Grok Imagine video 1.5

**Goal:** After Grok creates the still, **choose** edit vs skip, then send the final still into **`grok-imagine-video-1.5`** → sheets.

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  
**Still edit API:** `POST https://api.x.ai/v1/images/edits` · `grok-imagine-image-2.0`  
**Video API:** `POST https://api.x.ai/v1/videos/generations` · `grok-imagine-video-1.5`  
**Auth:** same xAI Header Auth as `grok_imagine_reel_still` / `grok_video_start`

**fx legend:** **ON** = Expression · **OFF** = Fixed

---

## Wire (daily Vid_gen)

```text
pick_creation
  → grok_imagine_reel_still
  → choose_still_path              ← flip Fixed: edit | skip
  → normalize_still_path           ← Code: forces still_path = edit|skip
  → switch_still_path
       edit → flag_still_edit → prep_still_edit → grok_imagine_edit_still → save_still_url
       skip → save_still_url
       fallback → save_still_url   ← if Switch matches nothing
  → prep_grok_video_start → grok_video_start → wait → poll → save_video_url
  → sheets_update_creation
```

**Like the still** → `still_path` = `skip` (fx **OFF**)  
**Want a tweak** → `still_path` = `edit` (fx **OFF**) + change `CODE_STILL_EDIT_PROMPT` in `flag_still_edit`

---

## Node A — `choose_still_path`

**Type:** Edit Fields (Set)  
**Before → this → After:** `grok_imagine_reel_still` → **choose_still_path** → `normalize_still_path`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_path` | **OFF** | `edit` or `skip` (flip each run — no spaces, lowercase) |
| `still_url` | **ON** | `={{ $('grok_imagine_reel_still').first().json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | **ON** | `={{ $('pick_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $('pick_creation').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | **ON** | `={{ $('pick_creation').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | **ON** | `={{ $('pick_creation').first().json.resolution \|\| '1080p' }}` |
| `aspect_ratio` | **ON** | `={{ $('pick_creation').first().json.aspect_ratio \|\| '9:16' }}` |
| `model_still` | **ON** | `={{ $('pick_creation').first().json.model_still \|\| 'grok-imagine-image-2.0' }}` |

**Check:** execute `choose_still_path` alone — output must show `still_path` = `edit` or `skip`.

No `still_edit_prompt` field — edit text lives in `flag_still_edit` Code.

---

## Node A2 — `normalize_still_path`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `choose_still_path` → **normalize_still_path** → `switch_still_path`

Paste: `marketing/n8n-code-normalize-still-path.js`  
(No fx.)

Forces `still_path` to exactly `edit` or `skip` (trims spaces / case).  
**Check:** output `still_path` is exactly one of those two strings.

---

## Node B — `switch_still_path`

**Type:** Switch  
**Before → this → After:** `normalize_still_path` → **switch_still_path** → edit *or* skip  

| Setting | fx | Value |
|---|---|---|
| Mode | — | **Rules** |
| Fallback Output | — | **ON** / Extra output → rename `fallback` → wire to `save_still_url` |

### Routing Rule 1 → output `edit`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $('normalize_still_path').first().json.still_path }}` |
| Operator | — | **is equal to** (string) |
| Value 2 | **OFF** | `edit` |

Wire this output → `flag_still_edit`

### Routing Rule 2 → output `skip`

| Parameter | fx | Value |
|---|---|---|
| Value 1 | **ON** | `={{ $('normalize_still_path').first().json.still_path }}` |
| Operator | — | **is equal to** (string) |
| Value 2 | **OFF** | `skip` |

Wire this output → `save_still_url`

**If Switch still shows 0 items:** open `normalize_still_path` output and confirm `still_path`. Then pin that item and re-execute Switch.
---

## Node C — `flag_still_edit` (edit branch only)

**Type:** Code · Run Once for All Items  
**Before → this → After:** `switch_still_path` (edit) → **flag_still_edit** → `prep_still_edit`

Paste: `marketing/n8n-code-flag-still-edit.js`  
(No fx — edit **`CODE_STILL_EDIT_PROMPT`** string at top of the Code.)

**Check:** `still_edit_prompt` non-empty + https `still_url`.

---

## Node D — `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `flag_still_edit` → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js`  
(No fx.)

**Check:** `still_edit_body_json` + `source_still_url` (https).

---

## Node E — `grok_imagine_edit_still`

**Type:** HTTP Request  
**Before → this → After:** `prep_still_edit` → **grok_imagine_edit_still** → `save_still_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/edits` |
| Authentication | — | Header Auth → same xAI as still gen |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | `={{ $json.still_edit_body_json }}` |

**Check:** `$json.data[0].url` is a **new** image.

---

## Node F — `save_still_url`

**Type:** Edit Fields  
Wire **both** Switch paths here (edit after HTTP; skip from Switch).

**Before → this → After:** edit HTTP *or* Switch `skip` → **save_still_url** → `prep_grok_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.data[0].url \|\| $json.still_url \|\| $json.source_still_url }}` |
| `creation_id` | **ON** | `={{ $json.creation_id \|\| $('choose_still_path').first().json.creation_id \|\| $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | **ON** | `={{ $json.video_motion_prompt \|\| $('choose_still_path').first().json.video_motion_prompt \|\| $('pick_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $json.model_video \|\| $('choose_still_path').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | **ON** | `={{ $json.duration_seconds \|\| $('choose_still_path').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | **ON** | `={{ $json.resolution \|\| $('choose_still_path').first().json.resolution \|\| '1080p' }}` |

---

## Node G — `prep_grok_video_start`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **prep_grok_video_start** → `grok_video_start`

Paste: `marketing/n8n-code-prep-grok-video-start.js`  
(No fx.)

**Check:** `still_url` https + `grok_video_body_json` present.

---

## Node H — `grok_video_start`

**Type:** HTTP Request  
**Before → this → After:** `prep_grok_video_start` → **grok_video_start** → `wait_video`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/videos/generations` |
| Authentication | — | Header Auth → same xAI |
| Send Body | — | **ON** |
| Body Content Type | — | **Raw** |
| Content Type | **OFF** | `application/json` |
| Body | **ON** | `={{ $json.grok_video_body_json }}` |

If `$json` is empty, Body fx **ON**:

```text
={{ $('prep_grok_video_start').first().json.grok_video_body_json }}
```

**Check:** output has `request_id`.

---

## Node I — `wait_video`

**Type:** Wait  
**Before → this → After:** `grok_video_start` → **wait_video** → `grok_video_poll`

| Setting | fx | Value |
|---|---|---|
| Resume | — | After time interval |
| Wait Amount | **OFF** | `200` |
| Wait Unit | — | Seconds |

Must be **enabled** (not deactivated).

---

## Node J — `grok_video_poll`

**Type:** HTTP Request  
**Before → this → After:** `wait_video` → **grok_video_poll** → `save_video_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `GET` |
| URL | **ON** | `={{ 'https://api.x.ai/v1/videos/' + $('grok_video_start').first().json.request_id }}` |
| Authentication | — | Header Auth → same xAI |
| Send Body | — | **OFF** |

**Check:** `status` = `done` / `succeeded` + video URL. If pending, raise wait and re-run.

---

## Node K — `save_video_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_video_poll` → **save_video_url** → `sheets_update_creation`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url \|\| $json.url }}` |
| `grok_video_request_id` | **ON** | `={{ $json.request_id \|\| $('grok_video_start').first().json.request_id }}` |
| `still_url` | **ON** | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | **ON** | `={{ $('pick_creation').first().json.creation_id }}` |
| `row_number` | **ON** | `={{ $('pick_creation').first().json.row_number }}` |
| `creation_times_used` | **ON** | `={{ $('pick_creation').first().json.creation_times_used }}` |
| `created_at` | **ON** | `={{ $now.toISO() }}` |

**Check:** `video_url` is https.

---

## Node L — `sheets_update_creation`

**Type:** Google Sheets → Update  
**Before → this → After:** `save_video_url` → **sheets_update_creation** → (end)

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Document | — | By ID (same as `get_reel_creations`) |
| Sheet | **OFF** | `9-lab-item-creations-500` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('pick_creation').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('pick_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |

Without this writeback, `pick_creation` keeps returning the same row.

---

## Prompt examples (edit path only)

Put in `CODE_STILL_EDIT_PROMPT` inside `flag_still_edit` (no fx):

| Intent | Text |
|---|---|
| Remove | `Remove the scale under the vial. Keep lighting, camera, and label identical.` |
| One hero | *(default in Code)* CRITICAL COUNT FIX — delete every extra vial/pen until count = 1 |

---

## Related

- Flag: `n8n-code-flag-still-edit.js`  
- Prep edit: `n8n-code-prep-still-edit.js`  
- Prep video: `n8n-code-prep-grok-video-start.js`  
- Video + sheets: `n8n-build-grok-imagine-video-nodes.md`
