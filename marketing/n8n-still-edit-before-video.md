# Still edit before Grok Imagine video 1.5

**Goal:** After Grok creates the still, optionally **edit the image** (add or remove parts) with a text instruction, then send the **edited** still into **`grok-imagine-video-1.5`**.

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  
**Still edit API:** `POST https://api.x.ai/v1/images/edits` · `grok-imagine-image-2.0`  
**Video API:** `POST https://api.x.ai/v1/videos/generations` · `grok-imagine-video-1.5`  
**Auth:** same xAI Header Auth as `grok_imagine_reel_still` / `grok_video_start`

---

## Wire (daily Vid_gen)

```text
pick_creation
  → grok_imagine_reel_still
  → still_edit_instructions
  → flag_still_edit
  → if
       true  → prep_still_edit → grok_imagine_edit_still → save_still_url
       false → save_still_url
  → prep_grok_video_start → grok_video_start → wait → poll → save_video_url
```

`save_still_url` is **after** the edit on this path — do not make `prep_still_edit` depend on it.

---

## Node A — `still_edit_instructions`

**Type:** Edit Fields (Set)  
**Before → this → After:** `grok_imagine_reel_still` → **still_edit_instructions** → `flag_still_edit`  
Include Other Input Fields: **ON**

| Name | Mode | Value |
|---|---|---|
| `still_url` | Expression | `={{ $('grok_imagine_reel_still').first().json.data[0].url }}` |
| `still_edit_prompt` | **Fixed** (optional) | Optional — Sheet 9 is blank; if Set stays empty, edit `CODE_STILL_EDIT_PROMPT` in **flag_still_edit** |
| `aspect_ratio` | Expression | `={{ $('pick_creation').first().json.aspect_ratio \|\| '9:16' }}` |
| `model_still` | Expression | `={{ $('pick_creation').first().json.model_still \|\| 'grok-imagine-image-2.0' }}` |
| `creation_id` | Expression | `={{ $('pick_creation').first().json.creation_id }}` |

### Prompt examples

| Intent | Example |
|---|---|
| Remove | `Remove the second vial on the left. Keep everything else identical — same lighting, camera, and product label.` |
| Add | `Add one small crimped-seal research vial on the right edge of the surface. Keep the rest of the scene identical.` |
| Both | `Remove the hanging plant on the left. Add a single sealed research pen on the table near the hero product. Keep 9:16, no people, no needles.` |

Always say **what must stay the same** so Grok doesn’t restyle the whole frame.

---

## Node B — `flag_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `still_edit_instructions` → **flag_still_edit** → `if`

Paste: `marketing/n8n-code-flag-still-edit.js`

Sets `still_edit_prompt` from Set → pick/sheet → **`CODE_STILL_EDIT_PROMPT`** (edit that string in the Code node — most reliable on n8n Cloud). Sets `do_still_edit` boolean when prompt text exists. Backfills `still_url` from `grok_imagine_reel_still` if blank.

**Check output:** `still_edit_prompt` non-empty + `still_edit_prompt_source` (`CODE_STILL_EDIT_PROMPT` is fine).

---

## Node C — `if`

**Type:** IF  

Condition: `{{ $json.do_still_edit }}` **equals** boolean **`true`** (not the string `"true"`).

- **true** → `prep_still_edit` → …  
- **false** → `save_still_url`

---

## Node D — `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `if` (true) → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js` (replace any older “still_url missing” snippet).

**Check:** `still_edit_body_json` + `source_still_url` (https).

---

## Node E — `grok_imagine_edit_still`

**Type:** HTTP Request  

| Setting | Value |
|---|---|
| Method | **`POST`** |
| URL | **`https://api.x.ai/v1/images/edits`** (must be plural `images` + `/edits`) |
| Authentication | Header Auth → same xAI credential as still gen |
| Send Body | **ON** |
| Body Content Type | **JSON** |
| JSON (fx **ON**) | `={{ $json.still_edit_body_json }}` |

**Confirmed working:** Body = JSON, expression `={{ $json.still_edit_body_json }}` from the previous `prep_still_edit` item.

Do **not** use GET. Do **not** use `/v1/images/generations` for edits.

If you still get 404, smoke-test with this fixed JSON body (fx OFF) using xAI’s sample image:

```json
{
  "model": "grok-imagine-image-2.0",
  "prompt": "Render this as a pencil sketch with detailed shading",
  "image": {
    "url": "https://docs.x.ai/assets/api-examples/images/style-realistic.png"
  }
}
```

- Sample works → your imported image URL is private/expired/not reachable by xAI  
- Sample also 404 → URL/method/auth on the node is still wrong  

**Check:** `$json.data[0].url` is a **new** image. Open it — your add/remove should show.

---

## Node F — `save_still_url`

**Type:** Edit Fields  

**Before → this → After:** `grok_imagine_edit_still` → **save_still_url** → `prep_grok_video_start`

Include Other Input Fields: **ON**

| Name | Value (fx ON) |
|---|---|
| `still_url` | `={{ $json.data[0].url \|\| $json.still_url \|\| $json.source_still_url }}` |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | `={{ $('pick_creation').first().json.video_motion_prompt }}` |
| `model_video` | `={{ $('pick_creation').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | `={{ $('pick_creation').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | `={{ $('pick_creation').first().json.resolution \|\| '1080p' }}` |
| `row_number` | `={{ $('pick_creation').first().json.row_number }}` |
| `creation_times_used` | `={{ $('pick_creation').first().json.creation_times_used \|\| $('pick_creation').first().json.times_used \|\| 0 }}` |

**Check:** `still_url` = the **edited** jpeg (not the pre-edit png).

---

## Finish to sheets (after still edit ok)

```text
grok_imagine_edit_still
  → save_still_url
  → prep_grok_video_start
  → grok_video_start
  → wait_video (200s)
  → grok_video_poll
  → save_video_url
  → sheets_update_creation
```

### `prep_grok_video_start` (Code)

Paste: `marketing/n8n-code-prep-grok-video-start.js`  
**Check:** `still_url` = edited https · `model_video` = `grok-imagine-video-1.5` · `grok_video_body_json` present

### `grok_video_start` (HTTP)

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Auth | same xAI Header Auth |
| Body | Raw `application/json` · fx ON |

```text
={{ $json.grok_video_body_json }}
```

**Check:** `request_id` returned.

### `wait_video` (Wait)

**200** seconds (enabled).

### `grok_video_poll` (HTTP GET)

```text
={{ 'https://api.x.ai/v1/videos/' + $('grok_video_start').first().json.request_id }}
```

**Check:** `status` = `done` / `succeeded` + video URL.

### `save_video_url` (Edit Fields)

| Name | Value (fx ON) |
|---|---|
| `video_url` | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `row_number` | `={{ $('pick_creation').first().json.row_number }}` |
| `creation_times_used` | `={{ $('pick_creation').first().json.creation_times_used \|\| $('pick_creation').first().json.times_used \|\| 0 }}` |

### `sheets_update_creation` (Google Sheets · Update)

| Setting | Value |
|---|---|
| Document | same as `get_reel_creations` |
| Sheet | `9-lab-item-creations-500` |
| Column to Match On | `creation_id` |
| Value to Match | `={{ $('pick_creation').first().json.creation_id }}` |
| `times_used` | `={{ Number($('pick_creation').first().json.creation_times_used \|\| $('pick_creation').first().json.times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |

Optional: also write `video_url` / `still_url` if those columns exist on the tab.

Without this writeback, `pick_creation` keeps returning the same least-used row.

Reply **`sheets ok`** + `creation_id` + `video_url` when green.

---

## Smoke test (edit)

1. Re-paste `flag_still_edit` + `prep_still_edit` if needed  
2. `grok_imagine_edit_still` returns a different URL  
3. `save_still_url.still_url` = edited URL → video → sheets  

Reply **`still edit ok`** + original URL + edited URL when green.

---

## Related

- Flag: `n8n-code-flag-still-edit.js`  
- Prep edit: `n8n-code-prep-still-edit.js`  
- Prep video: `n8n-code-prep-grok-video-start.js`  
- Video nodes: `n8n-build-grok-imagine-video-nodes.md`
