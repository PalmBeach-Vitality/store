# Prompt sheet rulebook — stop API blocks

**Owner:** Salvatore  
**For agents:** `.cursor/skills/prompt-moderation-hygiene/SKILL.md`  
**Swap table:** `.cursor/skills/prompt-moderation-hygiene/references/lexicon.md`

This is how we write `still_prompt`, `still_edit_prompt`, `video_motion_prompt`, and `video_prompt` so Flux, Kling, Grok, Seedance, Veo, and Runway generate the **same legitimate picture** without content-moderation rejects.

It is **not** a jailbreak guide. We do not generate gore, weapons-on-people, NSFW, minors, deepfakes, or crime how-to. We do not use leetspeak, homoglyphs, or “say it in another language” tricks to sneak those through. Community posts that teach that are discarded here.

## Cost note (Flux stills)

OpenRouter **Flux 2 Max** · 9:16 · ~1152×2048 · one FILM-009 reference image billed **$0.19 per still** on FILM-020 takes (usage.cost). Three takes ≈ **$0.57**. A moderation reject is not billed for the image, but it still wastes a run.

## What we actually call

| Job | Model | API |
|---|---|---|
| Film stills (max quality) | `black-forest-labs/flux.2-max` | OpenRouter `POST https://openrouter.ai/api/v1/images` |
| Daily / lab / pen / molecule stills | `grok-imagine-image-2.0` | xAI `POST https://api.x.ai/v1/images/generations` |
| Grok still edit | `grok-imagine-image-2.0` | xAI `POST https://api.x.ai/v1/images/edits` |
| Grok I2V / extend | `grok-imagine-video-1.5` / `grok-imagine-video` | xAI `POST https://api.x.ai/v1/videos/generations` (+ `/extensions`) |
| Film I2V | `kwaivgi/kling-v3.0-pro` | OpenRouter `POST https://openrouter.ai/api/v1/videos` |
| Product I2V | Seedance 2.0 / 2.5 | fal `queue.fal.run/bytedance/seedance-…` or OpenRouter |
| Veo 3.1 — no people | `google/veo-3.1` | OpenRouter `POST https://openrouter.ai/api/v1/videos` |
| Veo 3.1 — human / face / body / hands | `fal-ai/veo3.1/image-to-video` | fal `POST https://fal.run/fal-ai/veo3.1/image-to-video` |
| Alt I2V | Runway | film sheet `workflow_url_runway` |
| Audio | Sonilo | film sheet `audio_endpoint` |

Sheets stay the source of prompts. If a field is missing, fail — do not invent a fallback prompt in the node.

## Veo 3.1 host split (hard)

Same model name on the tin. Two hosts. Two safety stacks. **Do not mix them.**

| Scene | Host | Sheet `model_video` | Sheet `video_start_url` |
|---|---|---|---|
| No people in the **still** or the motion | OpenRouter | `google/veo-3.1` | `https://openrouter.ai/api/v1/videos` |
| Any person — face, body, hands, hair, suit-on-a-person, wrist-on-a-person, pilot | fal | `fal-ai/veo3.1/image-to-video` | `https://fal.run/fal-ai/veo3.1/image-to-video` |

`video_provider` stays `veo` on both. Duration stays 4 / 6 / 8. Output stays **1080 × 1920**.

Judge the **still**, not the wording. A beach portrait is fal even if `video_motion_prompt` never says `woman`. An empty cockpit, vial, pen, molecule, or ship with no person is OpenRouter.

This is routing, not a filter dodge. Do not send a human still to OpenRouter Veo because fal is “the backup.” Do not send a no-people still to fal because OpenRouter filtered a word. Rewrite the sheet cell first.

**Lived:** OpenRouter `google/veo-3.1` empty-completed two iols66 beach-pilot jobs (`Video generation completed with no output (content may have been filtered)`). The same face already completed on fal `fal-ai/veo3.1/image-to-video` (FILM-001 / 002 / 003, 2026-09-02).

## Lived incident — FILM-020 Flux

Execution **2052** · workflow `gen_film020_flux_2k` · OpenRouter Flux 2 Max:

> Black Forest Labs blocked this request through content moderation.

The prompt described a **side-profile spacecraft descending through atmosphere** toward the FILM-014 beach planet — a catalog film still, no people, hull intact. BFL still blocked it because the **words** included:

- `beach-crash` / `Not the crash` / `Not ground impact`
- `interceptor`
- `wreck`
- `punches through`
- `plasma sheath` / `roaring fire trail` / `scoring`

Rewriting to `spacecraft`, `high-speed atmospheric descent`, `warm atmospheric glow`, `hull intact`, and **deleting every “not the crash” clause** produced a 200 and a real **1152×2048** PNG.

That is the whole method: **same picture, different dictionary.**

## Laws for every sheet cell

1. **Say what is in the frame.** Never name the disaster you are avoiding. Filters match tokens. `"Not the crash"` is still `crash`.
2. **Do not retry a blocked string.** Swap, write the cell, run once.
3. **I2V is camera + motion only.** Kling and Seedance re-scan the motion prompt *and* the still. Restating “crash / fire / interceptor” in `video_motion_prompt` can block a clip whose still already exists.
4. **Internal IDs stay off-camera.** `key_a3_crash` is a row category. It is not prompt copy. Call the ship `the FILM-009 spacecraft`.
5. **Photography ≠ firearms.** Write `capture` / `frame` / `film still`, not `shoot`.

## What the public sources actually say

Pulled 2026-09-07. Used for **false-positive** patterns only.

| Source | What we keep |
|---|---|
| [BFL FLUX.2 model card](https://github.com/black-forest-labs/flux2/blob/main/model_cards/FLUX.2-dev.md) | API filters prompts **and** images. Hive + in-house. Gore/CSAM cannot be “talked around.” Other categories over-refuse. |
| [BFL `safety_tolerance`](https://docs.bfl.ai/api-reference/models/generate-or-edit-an-image-with-flux2-%5Bflex%5D) | 0 = strict, 5 = least strict, default **2**. We **rewrite prompts**. We do not crank this to force a blocked scene. |
| [OpenRouter errors](https://openrouter.ai/docs/api/reference/errors-and-debugging) | `content_policy_violation` / `refusal` = 400. Read the message; don’t hammer retry. |
| [xAI Imagine](https://docs.x.ai/docs/guides/image-generation) | Images/videos are policy-reviewed. Grok can return empty `data` / `respect_moderation: false` on a 200. |
| [Vercel ai#19168](https://github.com/vercel/ai/issues/19168) | Grok image moderation is often **silent** (empty payload), not a loud 400 like Flux. |
| [Kling policy roundups](https://anycap.ai/page/en-US/ai/kling-ai-nsfw-policy-developers) / [goenhance Kling censorship](https://www.goenhance.ai/blog/kling-ai-censorship) | Scans prompt + frames. Weapons, crash/explosion language, politics, NSFW. No adult toggle. Repeat abuse → failed tasks / account noise. |
| [Seedance 2.0 filter notes](https://blog.picassoia.com/seedance-2-0-content-filter-what-gets-blocked-and-why) | Semantic, not only keywords. Graphic harm blocked; cinematic action often OK if you don’t describe injury. |
| [Google Veo RAI](https://cloud.google.com/vertex-ai/generative-ai/docs/video/responsible-ai-and-usage-guidelines) | Categories: child, celebrity, sexual, violence, toxic. Generic “couldn’t be submitted.” |
| [Chase Jarvis / Veo sensitive-content](https://chasejarvis.com/blog/how-to-fix-veo-3s-sensitive-content-warning/) | Auto-“enhance prompt” injects bait adjectives. We never send an LLM-rewritten prompt that we didn’t put on the sheet. `shoot` → `capture`. |
| Kling/Seedance Reddit-style writeups | Same complaints: false positives on `battle`, `sweat`, `wet`, `fighter`, inconsistent retries. **Fix = calmer wording, not obfuscation.** |

We **did not** adopt blog tables that map `blood → crimson liquid` or `shoot → muzzle flash`. That is how-to for prohibited scenes. If Salvatore wants injury, we don’t generate it here.

## Sheet overlay checklist

Before any still/video gen overlay, scan these columns and run the lexicon:

`still_prompt` · `still_edit_prompt` · `video_prompt` · `video_motion_prompt` · `bridge_prompt` · `sfx_prompt`

Pass when:

- No crash / wreck / interceptor / fire-trail / explosion / weapon / needle tokens
- No “Not the X” where X is a banned token
- Film identity is locked with **safe** nouns (spacecraft, FILM-009 hull, twin cyan engines)
- I2V motion is ≤ a short camera brief
- 9:16 and the real resolution field still come from the sheet

## If it still blocks

1. Shorten. One subject, one camera, one environment. Drop the negative list except `No people, no text, no logos`.
2. Confirm the **reference image** is clean (Kling/Flux scan it too). A wreck still as `picked_url` can block even a calm prompt.
3. Tell Salvatore which token remains. Do not switch APIs just to dodge a filter unless he says so. Veo host is already chosen by the split above — do not flip OpenRouter ↔ fal on a blocked **word**. Fix the cell.

Quality rule still stands: a prompt that “works” at 720p is not a win.
