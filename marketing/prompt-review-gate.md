# Prompt review gate (HARD RULE)

**Owner:** Salvatore  

Before **any** still, video, or edit is generated, Salvatore sees the exact prompt (or edit text) and says to run it.

No exceptions. Not small tweaks. Not retries. Not FILM one-offs. Not n=1 tests.

## Agent must

1. Draft the exact still_prompt / still_edit_prompt / video_motion_prompt (plus model, 9:16, resolution, n, source URL).
2. Write that full text in the Cursor window as normal readable text — **no copy/paste code boxes**.
3. **Before every video run:** send the n8n workflow name + ID, the API (host + path) and model slug, the still URL if I2V, duration / resolution / aspect, and the exact motion prompt. Wait for **approve** or **deny**. Do not overlay-and-execute in the same turn as the ask.
4. Wait for **one of exactly two sentences**. Nothing else starts a workflow.
5. Then overlay the sheet and run gen.

## The only two sentences that authorize a start

- **you may run the workflow**
- **you can start the workflow**

Everything else is a denial, including `run`, `run it`, `ok`, `go`, `approved`, `send it`, `do it`,
`its fine`, `looks good`, and any present-tense report like `running peptide_pen_vid_gen smoke test`
(that is Salvatore saying what **he** is doing). Approving the prompt text is not approving the run —
the prompt OK and the start are two separate permissions.

## Stop at the still

Salvatore checks the image before any video spend:

1. Agent drives a partial run to `save_still_url` only. No video.
2. He looks at the still.
3. He pins it.
4. Only then does the run continue to the video node.

Never run the full chain in one shot. Never start a second run while he has one open. And re-read
`choose_compound` on the canvas before claiming which row will render — he changes it between runs,
and the motion prompt changes with it.

A new note like “keep 4 but change the planet” is a **new** prompt. Show it. Wait again.

If an API blocks and the prompt is rewritten, show the rewrite before the next run.

Skill: `.cursor/skills/prompt-review-gate/SKILL.md`
