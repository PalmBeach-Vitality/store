---
name: prompt-review-gate
description: HARD RULE. Before every still, video, or edit generation, send Salvatore the exact prompt or edit text and wait for his OK. Before every video run, send the n8n workflow name + ID, API + model, still URL if I2V, duration/resolution/aspect, and exact motion prompt, then wait for approve or deny. Use whenever planning or about to run Flux, Grok, Kling, Seedance, Veo, Runway, Sonilo, n8n overlay+gen, still_prompt, still_edit_prompt, video_motion_prompt, I2V, image edits, or retries after a bad take. No exceptions.
---

# Prompt review gate (HARD RULE)

Salvatore reviews **every** still, video, and edit prompt **before** it runs. No exceptions. Not even "small" moon moves, retries, n=1 tests, or FILM-020-style one-offs.

## Stop

Do **not** call n8n `execute_workflow` on any still-gen, video-gen, I2V, extend, or image-edit workflow until Salvatore has seen the exact text and said to run it.

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

## What counts as approval

He must clearly say to run it: `run`, `ok`, `go`, `approved`, `send it`, `do it`, or the same meaning.

`deny`, `no`, `stop`, or a rewrite note (`keep 4 but change the planet`) is **not** a run. A rewrite is a **new** prompt. Draft it. Send it. Wait again. Do not run.

## After approval

Then overlay the sheet (sheets-only) and run gen. If the API blocks and you rewrite, **stop and send the rewrite** before the next run.
