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
  → fal_kling_generate               fal Kling 3.0 Standard I2V, 15s, no audio
  → save_video_url
  → sheets_update_creation           times_used + last_used_at
```

**Default:** `save_still_url` is wired to `still_edit_instructions`.  
**Skip:** disconnect that wire, connect `save_still_url` → `skip_still_edit`.  
Do not leave **both** wires on. That sends two videos.

**Vid gen API (quality/cost check):** fal.ai `fal-ai/kling-video/v3/standard/image-to-video`. 15s. `generate_audio: false`. Grok still + still-edit hops are unchanged. Old `grok_video_start` / `wait_video` / `grok_video_poll` stay on the canvas **disabled**.

**Mute — audio is off. Always. All three vid-gen workflows** (this one, `Vid_gen_landscape_scenes`, `peptide_pen_vid_gen`). Salvatore's standing rule, and the one value these nodes are allowed to hardcode.

`prep_grok_video_start` sets `audio: false` / `generate_audio: false` and prefixes the sheet `video_motion_prompt` with the silent lock:

```text
Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio.
```

`fal_kling_generate` pins its own `generate_audio` to `={{ false }}` rather than reading the upstream field, so the mute does not break if prep stops emitting it. Note the expression form: the literal string `false` would be read as truthy. Do not wire audio to a sheet column. Camera and vial motion stay on the sheet — do not rewrite `pull_sheet_row`.

---

## Edit the still — `still_edit_instructions`

This is the only node you type in. It currently sits **off the live path** — `save_still_url` goes to `skip_still_edit` — so it does not run.

Put the edit on Sheet 9 `still_edit_prompt`, **or** open `still_edit_instructions` → `still_edit_prompt` → **fx OFF** → paste. Then Execute.

**Read the field before you rewire it.** It still holds a stale one-off from the pre-artwork passes:

```text
make the vial centered in the image. just move it over on the table but make sure its not at the edge of the table. change 50 mg/ml to: 50mg, change 20mg/ml to: 5mg/ml
```

Harmless while the node has no input, but the vial spec now handles centring, scale, and the exact dose / concentration strings in `video_prompt`, so re-running that text would fight the sheet and cost an extra paid edit call. Clear it or replace it before wiring the edit path back on. The landscape workflow's copy has already been blanked for this reason.

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
   - **`video_motion_prompt`** — camera move for the video (this is what fal Kling uses)
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
- Do not type a prompt into `grok_imagine_reel_still` or `fal_kling_generate`. Those nodes only read `$json`.
- Do not re-enable the leftover import / Buffer / Creatomate / IF nodes.

---

## Node notes

| Node | What you touch |
|---|---|
| `still_edit_instructions` | **This is the edit desk.** `still_url` fx **ON** from the raw still. `still_edit_prompt` fx **ON** from the sheet unless you turn it **OFF** for a one-run paste. |
| `prep_still_edit` | Builds the xAI edit body. Paste: `n8n-code-prep-still-edit.js`. |
| `save_edited_still_url` | Writes the edited `https` URL. Include Other Fields **ON**. |
| `prep_grok_video_start` | Maps sheet motion + still URL for fal. Paste: `n8n-code-prep-grok-video-start.js`. Mutes the clip (`generate_audio: false` + silent lock). |
| `fal_kling_generate` | fal.ai Kling 3.0 Standard I2V. 15s. No audio. Credential: `fal.ai account`. |
| `sheets_update_creation` | Match `creation_id`. Writes `times_used` + `last_used_at` only. |

---

## Label legibility — where the vial size lives

`grok_imagine_reel_still` sends nothing but `video_prompt`, uncapped and unwrapped. So the size of the vial, the words on the label, and the ban on extra lettering all have to be in that one sheet cell, and on 2026-09-14 none of them were: a Cagrilintide still came back with an illegible label because no row said how big the hero should be and the label spec ordered a dose bar it never filled in. All 535 rows now carry a `HERO SCALE (MANDATORY)` clause at 40-45% of frame width plus exact dose / concentration / volume strings. Salvatore asked to start at that figure and adjust from there; the target is roughly half the frame. Details and the repair script: `sheets/README.md` and `scripts/fix_vial_label_legibility.py`.

**The still-edit branch is off the live path.** Salvatore runs the skip side, so the Fixed text sitting in `still_edit_instructions` — an old one-off that says *"change 50 mg/ml to: 50mg, change 20mg/ml to: 5mg/ml"* — never reaches a still and does not fight the hero-scale lock. Leave it alone. It only matters if someone wires the edit branch back in, and then it needs retyping first.

On the live canvas `save_still_url` currently has **no** outgoing connection, so neither branch is attached to it. A top-to-bottom Execute halts there with a still and no clip; reaching `fal_kling_generate` means attaching `skip_still_edit` or running the tail nodes with Execute step.

---

## Related

- Older still-edit wire: `n8n-still-edit-before-video.md`  
- Sheets-only rule: `n8n-sheets-only-vid-gen.md`  
- Pick: `n8n-code-pick-creation.js` (do not rewrite unless asked)
