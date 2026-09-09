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
| Physics I2V | Veo 3.1 | OpenRouter / Google |
| Alt I2V | Runway | film sheet `workflow_url_runway` |
| Audio | Sonilo | film sheet `audio_endpoint` |

Sheets stay the source of prompts. If a field is missing, fail — do not invent a fallback prompt in the node.

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

## Lived incident — FILM-001 / 002 / 004 Veo (human face)

Workflow `film_i2v_veo`, executions 1737, 1743, 2013, 2084, 2089 (Sep 2–7). Five runs, five blocks, three different calm prompts, two gateways (fal and OpenRouter). Cheapest one was `Camera holds. Soft coastal wind in the hair and suit. Twin moons stay. Photoreal. Silent.`

fal reported `422 content_policy_violation` at `loc: body.prompt`. OpenRouter reported `failed — Video generation completed with no output (content may have been filtered)`. Neither was about the words. Google Veo scores the **input image** for photoreal person likeness (Google's *Celebrity* category, support codes `15236754` / `29310472`, allowlist-gated per Google Cloud project). Every blocked still was a head-and-shoulders, camera-facing portrait of the astronaut. Every Veo pass in the same week (wrist device, spent vial, cockpit, core, the FILM-019 eyes-down shot) had no prominent face. The one face portrait that did pass was the soft original JPEG; the sharper 2K upscales all failed.

Rule that came out of it: **face-forward human rows never go to Veo.** `video_provider = kling` for those. Veo keeps the product / physics shots it already passes. If a human row must stay on Veo, the start frame is reframed — waist-up, three-quarter, eyes on the wrist — and eye contact happens in the last beat of the motion prompt, never in the still. Full rules, tables, and the FILM-001 rewrite: `.cursor/skills/prompt-moderation-hygiene/references/human-subjects.md`. Every run, blocked or passed, is logged in `references/incidents.md`.

## Laws for every sheet cell

1. **Say what is in the frame.** Never name the disaster you are avoiding. Filters match tokens. `"Not the crash"` is still `crash`.
2. **Do not retry a blocked string.** Swap, write the cell, run once.
3. **I2V is camera + motion only.** Kling and Seedance re-scan the motion prompt *and* the still. Restating “crash / fire / interceptor” in `video_motion_prompt` can block a clip whose still already exists.
4. **Internal IDs stay off-camera.** `key_a3_crash` is a row category. It is not prompt copy. Call the ship `the FILM-009 spacecraft`.
5. **Photography ≠ firearms.** Write `capture` / `frame` / `film still`, not `shoot`.
6. **Diagnose word block vs image block before touching anything.** A calm camera brief that still rejects is an image block. Rewriting words for an image block is a wasted run every time.
7. **Human rows: provider first, framing second, words third.** Face-forward → Kling. Face small and turned → Veo allowed. Duration must be legal for the provider (Veo `4/6/8`, Kling `3–15`).
8. **Pre-flight gate before every I2V run.** Look at the still, check provider + duration, scan the lexicon, check `incidents.md` for a repeat. Then run once.

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
| [Google Veo RAI](https://cloud.google.com/vertex-ai/generative-ai/docs/video/responsible-ai-and-usage-guidelines) | Categories: child, celebrity, sexual, violence, toxic. Generic “couldn’t be submitted.” *Celebrity* (`15236754` / `29310472`) = “photorealistic representation of a prominent person **or** project not on the allowlist.” Filters run on **input images**, not only prompts. |
| [Google AI forum — false Celebrity on synthetic avatars](https://discuss.ai.google.dev/t/request-allowlist-access-for-veo-3-1-vertex-ai-project-gen-lang-client-06575772/170917/1), [authorized adult portraits](https://discuss.ai.google.dev/t/veo-3-1-fast-false-celebrity-filter-on-authorized-adult-portraits-production-allowlist-review/180778), [original character avatars](https://discuss.ai.google.dev/t/request-for-allowlist/137263) | Same false positive on 100% AI-generated adult faces used as I2V start frames. Only remedy is a per-project allowlist through a Google Cloud account team — not reachable via fal or OpenRouter. |
| [fal Veo 3.1 I2V](https://fal.ai/models/fal-ai/veo3.1/image-to-video/api) | “Safety filters are applied to both input images and generated content.” `safety_tolerance` 1–6 (default 4), `auto_fix` off by default. Durations `4s/6s/8s`. We do not raise tolerance to push a face through; we route the row. |
| [fal Kling 3.0 Pro I2V](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video) | 1080p, 3–15 s, aspect from start image. No realistic-person likeness gate on synthetic adults. Face lane for FILM identity rows. |
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
3. Tell Salvatore which token remains. Do not switch APIs just to dodge a filter unless he says so.

Quality rule still stands: a prompt that “works” at 720p is not a win.
