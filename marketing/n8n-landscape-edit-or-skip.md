# Landscape factory: edit or skip (same as lab)

**Workflow:** `Vid_gen_landscape_scenes -500-peptide-wellness-scenes`  
https://stockjohnson.app.n8n.cloud/workflow/Kc2HqqjSyiKs87qy

Same setup as lab `Vid_gen_lab_scenes -9-lab-items-creations-500`: **one factory, two wire-swap paths. No Switch. No IF.**

Paste the **existing** still on `still_url_input`. Do **not** generate a new Grok still. `grok_imagine_reel_still` stays disabled.

Do not Publish. Do not Execute unless you say yes.

---

## Edit vs skip

One wire out of `save_still_url`.

**Edit** (default):

`save_still_url` → `still_edit_instructions`

Type the edit on `still_edit_instructions` (`still_edit_prompt`). Leave `skip_still_edit` on the canvas, **unwired**.

**Skip:**

Disconnect `save_still_url` from `still_edit_instructions`. Wire `save_still_url` → `skip_still_edit` → `prep_grok_video_start`.

Do not leave both wires on (two videos).

---

## Default wire (edit)

```text
Schedule Trigger → still_url_input → get_reel_creations → filter_creations_active → pick_creation
pick_creation → save_still_url → still_edit_instructions → download_still → prep_still_edit
prep_still_edit → grok_imagine_edit_still → save_edited_still_url → prep_grok_video_start
prep_grok_video_start → grok_video_start → wait_video → grok_video_poll → save_video_url → sheets_update_creation
```

`skip_still_edit` stays unwired.

`download_still` stays on the edit path: xAI `/v1/images/edits` cannot fetch `imgen.x.ai` (400 `invalid_image`). That GET is **your** still as a file, not a new Imagine.

---

## Skip wire

```text
pick_creation → save_still_url → skip_still_edit → prep_grok_video_start → grok_video_start → …
```

`still_edit_instructions` / `download_still` / `prep_still_edit` / `grok_imagine_edit_still` / `save_edited_still_url` stay on the canvas, unwired from `save_still_url`.

---

## Nodes

### `still_url_input`

**Type:** Edit Fields (Set)  
**Before → this → After:** `Schedule Trigger` → **still_url_input** → `get_reel_creations`

| Name | Value |
|---|---|
| `still_url` | existing https still (no new Grok image) |
| `creation_id` | Active row on `500_Peptide_Wellness_Reel_Scenes` |
| `still_edit_prompt` | optional copy; the typed edit lives on `still_edit_instructions` |

If `creation_id` is set, `pick_creation` uses that Active row. Empty `creation_id` = normal least-used rotation.

### `pick_creation`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `filter_creations_active` → **pick_creation** → `save_still_url`

Paste: `marketing/n8n-code-pick-landscape-creation.js`

### `save_still_url`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `pick_creation` → **save_still_url** → `still_edit_instructions` (edit) or `skip_still_edit` (skip)

Paste: `marketing/n8n-code-save-still-url-landscape.js`

Reads the still from `still_url_input`. Does not call Imagine.

### `skip_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `save_still_url` → **skip_still_edit** → `prep_grok_video_start`  
Leave **unwired** for an edit run.

Paste: `marketing/n8n-code-skip-still-edit.js`

### `still_edit_instructions`

**Type:** Edit Fields  
**Before → this → After:** `save_still_url` → **still_edit_instructions** → `download_still`

Overwrite `still_edit_prompt`. Same as lab / pen. Not the sheet. Not `prep_still_edit`.

### `download_still`

**Type:** HTTP Request  
**Before → this → After:** `still_edit_instructions` → **download_still** → `prep_still_edit`

GET `={{ $json.still_url }}` as **file**.

### `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `download_still` → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js`

Sends a `data:image/...;base64,` URL. Never an `imgen.x.ai` URL.

---

## Do not

- Generate a new Grok still (`grok_imagine_reel_still` stays disabled)
- Leave both edit and skip wires on
- Publish
- Copy lab’s current dual-wire from `grok_imagine_reel_still` (that would run two paths)
