# Still edit before Grok Imagine video 1.5

**Goal:** Still → edit → video → sheets. **No Switch. No IF.**

Live workflow: `Vid_gen_lab_scenes -9-lab-items-creations-500`  
How to edit before vid gen: `n8n-vid-gen-lab-scenes.md`

**fx legend:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear — use this)

```text
pick_creation
  → grok_imagine_reel_still
  → save_still_url
  → still_edit_instructions          ← edit desk (sheet or fx-OFF paste)
  → prep_still_edit
  → grok_imagine_edit_still
  → save_edited_still_url
  → prep_grok_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_video_url
  → sheets_update_creation
```

To **skip** the edit (no IF): disconnect `save_still_url` from `still_edit_instructions` and wire `save_still_url` → `skip_still_edit`. Do not leave both wires on. See `n8n-vid-gen-lab-scenes.md`.

Delete / unwired / disabled: `choose_still_path`, `normalize_still_path`, `switch_still_path`, `if_still_edit`, `if_video_ready`, any IF for still edit.

---

## Node 1 — `still_edit_instructions`

**Type:** Edit Fields  
**Before → this → After:** `save_still_url` → **still_edit_instructions** → `prep_still_edit`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.still_url }}` |
| `still_edit_prompt` | **ON** | `={{ $json.still_edit_prompt }}` (turn **OFF** and paste to override this run) |
| `creation_id` | **ON** | `={{ $json.creation_id }}` |

---

## Node 2 — `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `still_edit_instructions` → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js`

Uses `still_edit_instructions` first, then Sheet 9 via `pick_creation`. Empty prompt throws.

**Check:** `still_edit_body_json` + `source_still_url`

---

## Node 3 — `grok_imagine_edit_still`

**Type:** HTTP Request  
**Before → this → After:** `prep_still_edit` → **grok_imagine_edit_still** → `save_edited_still_url`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/edits` |
| Authentication | — | Header Auth → same xAI as still gen |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | `={{ $json.still_edit_body_json }}` |

**Check:** `$json.data[0].url` — count products = **1**

---

## Node 4 — `save_edited_still_url`

**Type:** Edit Fields  
**Before → this → After:** `grok_imagine_edit_still` → **save_edited_still_url** → `prep_grok_video_start`  
Include Other Input Fields: **ON**

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $('grok_imagine_edit_still').first().json.data[0].url }}` |

---

## Node 5 — `prep_grok_video_start`

**Type:** Code · Run Once for All Items  
Must prefer the edited still (`grok_imagine_edit_still` / `save_edited_still_url`) over the raw `save_still_url`.

---

## Node 6 — `grok_video_start`

| Setting | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/videos/generations` |
| Auth | — | same xAI |
| Send Body | — | **ON** |
| Body Content Type | — | **JSON** |
| JSON | **ON** | `={{ $json.grok_video_body_json }}` |

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

Include Other Input Fields: **ON** if Set. Prefer edited `still_url`.

---

## Node 10 — `sheets_update_creation`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Update |
| Sheet | **OFF** | `9-lab-item-creations-500` |
| Column to Match On | **OFF** | `creation_id` |
| Value to Match | **ON** | `={{ $('save_video_url').first().json.creation_id }}` |
| `times_used` | **ON** | `={{ Number($('save_video_url').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | **ON** | `={{ $now.toISO() }}` |
