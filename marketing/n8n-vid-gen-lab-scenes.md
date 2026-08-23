# Vid_gen_lab_scenes — edit before video

**Live unpublished:** https://stockjohnson.app.n8n.cloud/workflow/C4BkmmISpTMmgnAg  
**Sheet:** `9-lab-item-creations-500`  
**No Switch / IF on the daily path.** Leftover import / Buffer / Creatomate nodes stay on the canvas but are **disabled**.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
When clicking ‘Execute workflow’
  → get_reel_creations
  → filter_creations_active          status = Active
  → pick_creation                    least-used Sheet 9 row
  → grok_imagine_reel_still          first still
  → save_still_url                   raw still URL
  → still_edit_instructions          edit desk
  → prep_still_edit
  → grok_imagine_edit_still          apply the edit
  → save_edited_still_url            edited still URL
  → prep_grok_video_start
  → grok_video_start
  → wait_video                       200s
  → grok_video_poll
  → save_video_url
  → sheets_update_creation           times_used + last_used_at
```

**Default:** `save_still_url` is wired to `still_edit_instructions`.  
**Skip:** disconnect that wire, connect `save_still_url` → `skip_still_edit`.  
Do not leave **both** wires on. That sends two videos.

---

## Edit the still — `still_edit_instructions`

This is the only node you type in. Leave the default wire: `save_still_url` → `still_edit_instructions`.

Put the edit on Sheet 9 `still_edit_prompt`, **or** open `still_edit_instructions` → `still_edit_prompt` → **fx OFF** → paste. Then Execute.

---

## Skip the edit — swap one wire

1. Disconnect `save_still_url` from `still_edit_instructions`.
2. Wire `save_still_url` → `skip_still_edit`.
3. Execute. Video uses the raw still.

To edit again: disconnect `skip_still_edit`, wire `save_still_url` back to `still_edit_instructions`.

---

## How to edit before vid gen

### A — Edit on the sheet, then one Execute (usual)

1. Open Sheet **`9-lab-item-creations-500`**.
2. Find the row you want, **or** leave several `Active` and let `pick_creation` take the least-used.
3. Edit these columns, then wait for Sheets to save:
   - **`video_prompt`** — what the first still should look like
   - **`still_edit_prompt`** — what to change on that still (one hero, no extras, no scale, etc.)
   - **`video_motion_prompt`** — camera move for the video (this is what Grok video uses)
4. Confirm `status` is **`Active`**.
5. In n8n open **Vid_gen_lab_scenes -9-lab-items-creations-500**.
6. Click **Execute workflow**. Do **not** Publish.
7. After it finishes: `grok_imagine_reel_still` = raw still, `grok_imagine_edit_still` = edited still, `save_video_url` = clip.

To force one row: set every other row to something other than `Active`, or raise their `times_used`.

### B — Look at the still first, then change the edit, then send video

Use this when you want to see the raw still before you commit the edit / video.

1. Run **A** through still only: open `prep_grok_video_start` → turn the node **off** (disabled) → **Execute workflow**.
2. Open **`grok_imagine_reel_still`** → output → open the image URL. That is the raw still.
3. Decide the edit.
   - **Keep it for next time:** paste the text into Sheet 9 column `still_edit_prompt` on that `creation_id`.
   - **This run only:** open **`still_edit_instructions`** → field **`still_edit_prompt`** → turn **fx OFF** → paste your edit.
4. Turn **`prep_grok_video_start` back on**.
5. Click **`still_edit_instructions`** → **Execute step** (play on that node), then execute each node after it through `sheets_update_creation`.  
   That reuses the still you already have. Do **not** click Execute workflow from the top unless you want a new still.

`prep_still_edit` uses **`still_edit_instructions` first**, then the sheet. So a fx-OFF paste on that node wins for this run.

### Do not edit

- `model_still` / `model_video` / `duration_seconds` / `resolution` / `aspect_ratio` — those stay on the sheet. Empty cells throw.
- Do not type a prompt into `grok_imagine_reel_still` or `grok_video_start`. Those nodes only read `$json`.
- Do not re-enable the leftover import / Buffer / Creatomate / IF nodes.

---

## Node notes

| Node | What you touch |
|---|---|
| `still_edit_instructions` | **This is the edit desk.** `still_url` fx **ON** from the raw still. `still_edit_prompt` fx **ON** from the sheet unless you turn it **OFF** for a one-run paste. |
| `prep_still_edit` | Builds the xAI edit body. Paste: `n8n-code-prep-still-edit.js`. |
| `save_edited_still_url` | Writes the edited `https` URL. Include Other Fields **ON**. |
| `sheets_update_creation` | Match `creation_id`. Writes `times_used` + `last_used_at` only. |

---

## Related

- Older still-edit wire: `n8n-still-edit-before-video.md`  
- Sheets-only rule: `n8n-sheets-only-vid-gen.md`  
- Pick: `n8n-code-pick-creation.js` (do not rewrite unless asked)
