# Prompt review gate (HARD RULE)

**Owner:** Salvatore  

Before **any** still, video, or edit is generated, Salvatore sees the exact prompt (or edit text) and says to run it.

No exceptions. Not small tweaks. Not retries. Not FILM one-offs. Not n=1 tests.

## Agent must

1. Draft the exact still_prompt / still_edit_prompt / video_motion_prompt (plus model, 9:16, resolution, n, source URL).
2. Write that full text in the Cursor window as normal readable text — **no copy/paste code boxes**.
3. **Before every video run:** also name the API (host + path) and the model slug. Wait for confirm.
4. Wait for an explicit OK (`run`, `ok`, `go`, `approved`, `send it`, `do it`).
5. Then overlay the sheet and run gen.

A new note like “keep 4 but change the planet” is a **new** prompt. Show it. Wait again.

If an API blocks and the prompt is rewritten, show the rewrite before the next run.

Skill: `.cursor/skills/prompt-review-gate/SKILL.md`
