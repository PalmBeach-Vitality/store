# Still edit before Grok Imagine video 1.5

**Goal:** Still → sheet `still_edit_prompt` edit → video → sheets. **No Switch. No IF.**  
**Sheets-only:** do not hardcode the edit prompt in Code. Put the text on the Sheet 9 `still_edit_prompt` cell.

**fx legend:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear — use this)

```text
pick_creation
  → grok_imagine_reel_still
  → flag_still_edit                 ← copies sheet still_edit_prompt (throws if empty)
  → prep_still_edit
  → grok_imagine_edit_still
  → save_still_url
  → prep_grok_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_video_url
  → sheets_update_creation
```

Delete / unwired: `choose_still_path`, `normalize_still_path`, `switch_still_path`, any IF for still edit.

Live lab vid-gen currently skips this still-edit hop (`save_still_url` → `prep_grok_video_start`). The Code paste-sources are sheets-only so the hop can be wired later without inventing a prompt.

---

## Node 1 — `flag_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `grok_imagine_reel_still` → **flag_still_edit** → `prep_still_edit`

Paste: `marketing/n8n-code-flag-still-edit.js`

**Check:** `still_edit_prompt` from the sheet row + https `still_url`

---

## Node 2 — `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `flag_still_edit` → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js`

**Check:** `still_edit_body_json` uses sheet `still_edit_prompt` + `model_still` + `aspect_ratio` (throws if any are empty) + `source_still_url`

---

## Node 3 — `grok_imagine_edit_still`

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

**Check:** `$json.data[0].url` — count vials = **1**

---

## Node 4 — `save_still_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_imagine_edit_still` → **save_still_url** → `prep_grok_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $('grok_imagine_edit_still').first().json.data[0].url }}` |
| `creation_id` | **ON** | `={{ $json.creation_id \|\| $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | **ON** | `={{ $json.video_motion_prompt \|\| $('pick_creation').first().json.video_motion_prompt }}` |
| `model_video` | **ON** | `={{ $json.model_video \|\| $('pick_creation').first().json.model_video \|\| 'grok-imagine-video-1.5' }}` |
| `duration_seconds` | **ON** | `={{ $json.duration_seconds \|\| $('pick_creation').first().json.duration_seconds \|\| 15 }}` |
| `resolution` | **ON** | `={{ $json.resolution \|\| $('pick_creation').first().json.resolution \|\| '1080p' }}` |

---

## Node 5 — `prep_grok_video_start`

**Type:** Code · Run Once for All Items  
Paste: `marketing/n8n-code-prep-grok-video-start.js`  
(No fx.)

---

## Node 6 — `grok_video_start`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/videos/generations` |
| Auth | — | same xAI |
| Send Body | — | **ON** |
| Body Content Type | — | **Raw** |
| Content Type | **OFF** | `application/json` |
| Body | **ON** | `={{ $json.grok_video_body_json }}` |

---

## Node 7 — `wait_video`

| Setting | fx | Value |
|---|---|---|
| Wait Amount | **OFF** | `200` |
| Wait Unit | — | Seconds |

---

## Node 8 — `grok_video_poll`

| Setting | fx | Value |
|---|---|---|
| Method | — | `GET` |
| URL | **ON** | `={{ 'https://api.x.ai/v1/videos/' + $('grok_video_start').first().json.request_id }}` |
| Auth | — | same xAI |
| Send Body | — | **OFF** |

---

## Node 9 — `save_video_url`

Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `video_url` | **ON** | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | **ON** | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | **ON** | `={{ $('pick_creation').first().json.creation_id }}` |
| `created_at` | **ON** | `={{ $now.toISO() }}` |

---

## Node 10 — `sheets_update_creation`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Sheet | **OFF** | `9-lab-item-creations-500` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('pick_creation').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('pick_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |

---

## Also re-paste (single-hero harden)

- `pick_creation`: https://github.com/PalmBeach-Vitality/store/blob/cursor/creatomate-url-set-workflow-4c4b/marketing/n8n-code-pick-creation.js  
- Re-import Sheet 9: https://github.com/PalmBeach-Vitality/store/blob/cursor/creatomate-url-set-workflow-4c4b/marketing/sheets/9-lab-item-creations-500.csv
