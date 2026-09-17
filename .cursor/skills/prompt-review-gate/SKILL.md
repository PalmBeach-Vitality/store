---
name: prompt-review-gate
description: HARD RULE. Before every still, video, or edit generation, send Salvatore the exact prompt or edit text and wait for his OK. Before every video run, send the n8n workflow name + ID, API + model, still URL if I2V, duration/resolution/aspect, and exact motion prompt, then wait. Only two sentences authorize a start - "you may run the workflow" or "you can start the workflow" - everything else is a denial. Use whenever planning or about to run Flux, Grok, Kling, Seedance, Veo, Runway, Sonilo, n8n overlay+gen, still_prompt, still_edit_prompt, video_motion_prompt, I2V, image edits, or retries after a bad take. No exceptions.
---

# Prompt review gate (HARD RULE)

Salvatore reviews **every** still, video, and edit prompt **before** it runs. No exceptions. Not even "small" moon moves, retries, n=1 tests, or FILM-020-style one-offs.

## Stop

Do **not** call n8n `execute_workflow` / `test_workflow` on any still-gen, video-gen, I2V, extend, or image-edit workflow until Salvatore has seen the exact text **and** said one of the two sentences in "What counts as approval" below.

Do **not** fire OpenRouter / xAI / fal / Kling / Veo / Runway / Sonilo generation APIs directly either.

Writing overlay *code* is fine. Executing overlay+gen is not, until he approves the prompt.

## What to send him

Write the **exact** sheet cells in the Cursor window as normal readable text. Do **not** put prompts in copy/paste code boxes.

- still_prompt (stills)
- still_edit_prompt (edits)
- video_motion_prompt / video_prompt (I2V)
- model, resolution, aspect, n, duration, source still URL

**Before every video run (HARD):** in that same message send all of this, then wait for **approve** or **deny**:

1. n8n **workflow name + workflow ID** (and the generate node)
2. **API** (host + path) and **model slug**
3. **still URL** if I2V
4. duration / resolution / aspect / audio
5. the exact `video_motion_prompt` as it will be written on the sheet

Do not overlay the sheet and do not `execute_workflow` in the same turn as the ask. One message. Full text. Do not summarize and then run.

## What counts as approval — two sentences, exactly

Salvatore authorizes a start with **one of these two sentences and nothing else**:

- **you may run the workflow**
- **you can start the workflow**

If neither sentence is present, you are **not** authorized. Do not start the workflow. Do not fire a
generation API. Ask for one of the two sentences instead.

**Everything else is false.** This list is not exhaustive and does not need to be — treat every phrasing
that is not one of the two sentences above as a denial:

- `run`, `run it`, `ok`, `okay`, `go`, `go ahead`, `approved`, `send it`, `do it`, `yes`, `sure`, `fine`, `its fine`
- `running peptide_pen_vid_gen smoke test` and anything else in the present tense. He is **reporting what he is doing**, not handing you the keys.
- `let's test it`, `smoke test it`, `try it`, `looks good`, a thumbs-up, silence
- Approving the **prompt text** is not approving the **run**. The gate above gets you a prompt OK; you still need one of the two sentences to execute.
- `deny`, `no`, `stop`, or a rewrite note (`keep 4 but change the planet`). A rewrite is a **new** prompt. Draft it. Send it. Wait again.

Why it is this strict: on 2026-09-16 "running peptide_pen_vid_gen smoke test" was read as a go, and a
full end-to-end pen run was fired while Salvatore already had his own partial run open. It also used the
`choose_compound` value he had just changed in the editor, so the row that would have rendered was not
the row whose prompt he had approved.

## His run process — stop at the still

Salvatore drives these runs in two halves. He looks at the image before any video money is spent:

1. Partial run to `save_still_url` only (n8n: right-click the node → Execute step, or set it as the destination). No video.
2. **He** looks at the still.
3. **He** pins the still on `grok_imagine_pen_still` / `save_still_url`.
4. Only then does the run continue to `prep_* → fal_kling_generate`.

So the default agent move is: drive to `save_still_url`, hand the still over, stop. Never run the whole
chain in one shot. And check `choose_compound` on the canvas before you claim which row will render — he
edits it between runs, and the row (and therefore the motion prompt) changes with it.

If a run is already in flight or he has a partial run open, do not start a second one. Duplicate runs
double the spend and bump `times_used` on a row that never shipped a clip.

## After approval

Then overlay the sheet (sheets-only) and run gen. If the API blocks and you rewrite, **stop and send the rewrite** before the next run.
