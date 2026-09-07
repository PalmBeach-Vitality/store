---
name: prompt-review-gate
description: HARD RULE. Before every still, video, or edit generation, send Salvatore the exact prompt or edit text and wait for his OK. Use whenever planning or about to run Flux, Grok, Kling, Seedance, Veo, Runway, Sonilo, n8n overlay+gen, still_prompt, still_edit_prompt, video_motion_prompt, I2V, image edits, or retries after a bad take. No exceptions.
---

# Prompt review gate (HARD RULE)

Salvatore reviews **every** still, video, and edit prompt **before** it runs. No exceptions. Not even "small" moon moves, retries, n=1 tests, or FILM-020-style one-offs.

## Stop

Do **not** call n8n `execute_workflow` on any still-gen, video-gen, I2V, extend, or image-edit workflow until Salvatore has seen the exact text and said to run it.

Do **not** fire OpenRouter / xAI / fal / Kling / Veo / Runway / Sonilo generation APIs directly either.

Writing overlay *code* is fine. Executing overlay+gen is not, until he approves the prompt.

## What to send him

Paste the **exact** sheet cells that will be sent, verbatim:

- `still_prompt` (stills)
- `still_edit_prompt` (edits)
- `video_motion_prompt` / `video_prompt` (I2V)
- model, resolution, aspect, n, duration, source still URL

One message. Full text. Do not summarize and then run.

## What counts as approval

He must clearly say to run it: `run`, `ok`, `go`, `approved`, `send it`, `do it`, or the same meaning.

A new note (`keep 4 but change the planet`) is a **new** prompt. Draft it. Send it. Wait again. Do not run.

## After approval

Then overlay the sheet (sheets-only) and run gen. If the API blocks and you rewrite, **stop and send the rewrite** before the next run.
