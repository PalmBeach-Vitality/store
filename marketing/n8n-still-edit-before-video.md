# Still edit before Grok Imagine video 1.5

**Goal:** After Grok creates the still, **choose** edit vs skip, then send the final still into **`grok-imagine-video-1.5`** → sheets.

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  
**Still edit API:** `POST https://api.x.ai/v1/images/edits` · `grok-imagine-image-2.0`  
**Video API:** `POST https://api.x.ai/v1/videos/generations` · `grok-imagine-video-1.5`  
**Auth:** same xAI Header Auth as `grok_imagine_reel_still` / `grok_video_start`

---

## Wire (daily Vid_gen)

```text
pick_creation
  → grok_imagine_reel_still
  → choose_still_path              ← flip Fixed: edit | skip
  → switch_still_path
       edit → flag_still_edit → prep_still_edit → grok_imagine_edit_still → save_still_url
       skip → save_still_url
  → prep_grok_video_start → grok_video_start → wait → poll → save_video_url
  → sheets_update_creation
```

**Like the still** → `still_path` = `skip`  
**Want a tweak** → `still_path` = `edit` + change `CODE_STILL_EDIT_PROMPT` in `flag_still_edit`

---

## Node A — `choose_still_path`

**Type:** Edit Fields (Set)  
**Before → this → After:** `grok_imagine_reel_still` → **choose_still_path** → `switch_still_path`  
Include Other Input Fields: **ON**

| Name | Mode | Value |
|---|---|---|
| `still_path` | **Fixed** | `edit` or `skip` (you flip this each run) |
| `still_url` | Expression | `={{ $('grok_imagine_reel_still').first().json.data[0].url }}` |
| `creation_id` | Expression | `={{ $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | Expression | `={{ $('pick_creation').first().json.video_motion_prompt }}` |
| `model_video` | Expression | `={{ $('pick_creation').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | Expression | `={{ $('pick_creation').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | Expression | `={{ $('pick_creation').first().json.resolution \|\| '1080p' }}` |
| `aspect_ratio` | Expression | `={{ $('pick_creation').first().json.aspect_ratio \|\| '9:16' }}` |
| `model_still` | Expression | `={{ $('pick_creation').first().json.model_still \|\| 'grok-imagine-image-2.0' }}` |

No `still_edit_prompt` field needed — edit text lives in `flag_still_edit` Code.

---

## Node B — `switch_still_path`

**Type:** Switch  
**Before → this → After:** `choose_still_path` → **switch_still_path** → edit branch *or* skip branch  

| Setting | Value |
|---|---|
| Mode | **Rules** |
| Output | **Extra Output** (fallback) optional — or only 2 outputs |
| Value 1 | `={{ $json.still_path }}` |

**Outputs (rename in the Switch UI):**

| Output name | Rule | Wire to |
|---|---|---|
| `edit` | equals (string) `edit` | `flag_still_edit` |
| `skip` | equals (string) `skip` | `save_still_url` |

Use **string** compare (`edit` / `skip`), not boolean. Fallback → `save_still_url` if you add one.

---

## Node C — `flag_still_edit` (edit branch only)

**Type:** Code · Run Once for All Items  
**Before → this → After:** `switch_still_path` (edit) → **flag_still_edit** → `prep_still_edit`

Paste: `marketing/n8n-code-flag-still-edit.js`

Edit **`CODE_STILL_EDIT_PROMPT`** at the top when you took the **edit** path.

**Check:** `still_edit_prompt` non-empty + https `still_url`.

---

## Node D — `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `flag_still_edit` → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js`

**Check:** `still_edit_body_json` + `source_still_url` (https).

---

## Node E — `grok_imagine_edit_still`

**Type:** HTTP Request  

| Setting | Value |
|---|---|
| Method | **`POST`** |
| URL | **`https://api.x.ai/v1/images/edits`** |
| Authentication | Header Auth → same xAI credential as still gen |
| Send Body | **ON** |
| Body Content Type | **JSON** |
| JSON (fx **ON**) | `={{ $json.still_edit_body_json }}` |

**Check:** `$json.data[0].url` is a **new** image.

---

## Node F — `save_still_url`

**Type:** Edit Fields  
Wire **both** Switch outputs here (edit path after `grok_imagine_edit_still`, skip path from Switch).

**Before → this → After:** edit HTTP *or* Switch `skip` → **save_still_url** → `prep_grok_video_start`

Include Other Input Fields: **ON**

| Name | Value (fx ON) |
|---|---|
| `still_url` | `={{ $json.data[0].url \|\| $json.still_url \|\| $json.source_still_url }}` |
| `creation_id` | `={{ $json.creation_id \|\| $('pick_creation').first().json.creation_id \|\| $('choose_still_path').first().json.creation_id }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt \|\| $('choose_still_path').first().json.video_motion_prompt \|\| $('pick_creation').first().json.video_motion_prompt }}` |
| `model_video` | `={{ $json.model_video \|\| $('choose_still_path').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | `={{ $json.duration_seconds \|\| $('choose_still_path').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | `={{ $json.resolution \|\| $('choose_still_path').first().json.resolution \|\| '1080p' }}` |

---

## Finish → video → sheets

```text
save_still_url
  → prep_grok_video_start          ← paste n8n-code-prep-grok-video-start.js
  → grok_video_start               ← Body: ={{ $json.grok_video_body_json }}
  → wait_video                     ← ~200s
  → grok_video_poll                ← GET /v1/videos/{{ request_id }}
  → save_video_url
  → sheets_update_creation         ← match creation_id; times_used + 1
```

Full node settings: `n8n-build-grok-imagine-video-nodes.md` (nodes 3b–7).

### `sheets_update_creation`

| Setting | Value |
|---|---|
| Operation | Update |
| Sheet | `9-lab-item-creations-500` |
| Column to Match On | `creation_id` |
| Value to Match | `={{ $('pick_creation').first().json.creation_id }}` |
| `times_used` | `={{ Number($('pick_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |

---

## Prompt examples (edit path only)

| Intent | Put in `CODE_STILL_EDIT_PROMPT` |
|---|---|
| Remove | `Remove the scale under the vial. Keep lighting, camera, and label identical.` |
| One hero | `Keep exactly one sealed vial. Remove any duplicate products. Keep the rest identical.` |

---

## Related

- Flag: `n8n-code-flag-still-edit.js`  
- Prep edit: `n8n-code-prep-still-edit.js`  
- Prep video: `n8n-code-prep-grok-video-start.js`  
- Video + sheets: `n8n-build-grok-imagine-video-nodes.md`
