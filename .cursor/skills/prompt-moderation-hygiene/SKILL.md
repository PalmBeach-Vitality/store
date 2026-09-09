---
name: prompt-moderation-hygiene
description: Rewrite still_prompt, still_edit_prompt, video_motion_prompt, and video_prompt so Flux, Kling, Grok, Seedance, Veo, and Runway stop false-positive blocking legitimate Palm Beach Vitality catalog and film stills. Use when an API returns content moderation, content_policy_violation, BFL blocked, sensitive content, no_media_generated, "content may have been filtered", or respect_moderation false; BEFORE executing any I2V workflow on a FILM row that contains a person (astronaut, face, hands, body); when overlaying FILM or lab-item sheet prompts; when a scene involves descent, atmosphere, speed, glow, labs, vials, or pens; or when Salvatore asks to avoid blocked wording.
---

# Prompt moderation hygiene

This skill is **false-positive avoidance** for this studio's legal catalog and film work. It is **not** a jailbreak guide.

Do **not** generate prohibited content. Do **not** recommend leetspeak, homoglyphs, zero-width characters, language-switching, or `safety_tolerance` hikes to sneak disallowed scenes. If the picture they want is actually gore, weapons used on people, NSFW, minors, real-person deepfakes, or crime how-to, **stop**.

Canonical human copy: `marketing/prompt-moderation-rulebook.md`. Swap table: `references/lexicon.md`. Human-subject rules: `references/human-subjects.md`. Every block ever seen, with the fix that passed: `references/incidents.md`.

## Mandatory for humans — no exceptions

If the frame contains a person (astronaut, face, hands, wrist, body, model, presenter), this skill is not optional. It applies to **writing** a `still_prompt` / `still_edit_prompt` / `video_motion_prompt`, to **overlaying** one onto a sheet, and to **executing** any still or video workflow on that row. Quick test, re-run, single row, "the prompt is already fine" — none of those skip it. Run the pre-flight gate below, say in the reply that it ran and what it decided, then run once, then log the result in `references/incidents.md`. A human gen that ran without the gate is a mistake even if it passed. This is written into `AGENTS.md` as a workspace rule.

## When to load this

- **Before writing, overlaying, or executing anything for a row with a person in the still.** Run the pre-flight gate first. No gate, no run.
- Overlaying or editing `still_prompt` / `still_edit_prompt` / `video_motion_prompt` / `video_prompt` / `bridge_prompt` / `sfx_prompt`
- Any gen node returns `content moderation`, `content_policy_violation`, `no_media_generated`, `respect_moderation: false`, empty `data[]`, OpenRouter `failed` + `content may have been filtered`, or Kling `task_status: failed` with a policy message
- FILM rows whose sheet `category` contains crash / wreck / impact (those IDs stay on the sheet — they must **not** appear in the prompt)

## The two kinds of block (diagnose first, then fix)

| Kind | What the API scanned | How it shows up | Fix |
|---|---|---|---|
| **Word block** | The prompt string | Flux `BFL blocked`, Kling policy message, Seedance keyword reject | Lexicon swap. Same picture, different dictionary. |
| **Image block** | The input still (`image_url` / `start_image_url`) | Veo via fal: 422 `content_policy_violation` with `loc: ["body","prompt"]` (the label is generic — **it is not the prompt**); Veo via OpenRouter: `failed` + `Video generation completed with no output (content may have been filtered)`; fal `no_media_generated` after a long wait (output-side filter) | Change the **start frame** or the **provider**. No wording change fixes an image block. |

Tell them apart in ten seconds: if the prompt is a calm camera brief (`Camera holds. Soft wind in hair. Silent.`) and it still 422s, it is an image block. Every FILM identity block in `references/incidents.md` was an image block on a face-forward portrait. Rewriting the prompt five times cost five runs and fixed nothing.

## Hard laws

1. **Describe the frame you want.** Do not name the thing you are trying to avoid. `"Not the crash"` still contains `crash`. Keyword filters do not honor negation.
2. **Rewrite the Google Sheet cell.** Nodes stay sheets-only. Never bake a fallback prompt into an HTTP/Code node.
3. **Do not retry the same blocked string.** Log the token, swap it, write the new cell, then run. Repeat retries of a blocked prompt are how Kling/Seedance accounts get noisy.
4. **I2V prompts are motion-only.** The still already holds identity. `video_motion_prompt` should be camera path + speed + what stays. Restating a spicy still-prompt in I2V is how Kling blocks a clip that Grok already drew.
5. **Sheet IDs are not prompt copy.** `key_a3_crash`, `interceptor`, `FILM-015 beach-crash ship` belong in comments, not in `still_prompt`.
6. **Face-forward humans never go to Veo.** Google's realistic-person filter (support codes `15236754` / `29310472`) fires on the input image, is allowlist-gated on Google's side, and cannot be reached through fal or OpenRouter. A person row goes to Veo only if the face is under ~10% of the frame and not looking at the lens. Otherwise `video_provider = kling`. Full rules in `references/human-subjects.md`.
7. **Duration must be legal for the provider.** Veo 3.1 accepts `4s` / `6s` / `8s` only. Kling 3.0 accepts 3–15. A 5-second brief on a Veo row is a wasted execution before moderation even runs.
8. **Every block gets logged.** After any moderation reject, append a row to `references/incidents.md` (provider, exact prompt, still, error, what changed, result). This file is how the skill learns. A block that is not logged will be repeated.

## Studio APIs (scan these)

| Job | Model | Endpoint | Filter personality |
|---|---|---|---|
| Film / max stills | `black-forest-labs/flux.2-max` | OpenRouter `POST /api/v1/images` | BFL + Hive. Strict on crash, wreck, fire, interceptor, weapons, gore. **This is what blocked FILM-020.** |
| Daily / lab stills | `grok-imagine-image-2.0` | xAI `POST /api/v1/images/generations` | Looser on sci-fi action than Flux. Can **succeed HTTP** and return empty `data` / `respect_moderation: false`. |
| Grok I2V | `grok-imagine-video-1.5` | xAI `POST /api/v1/videos/generations` | Same family. xAI's own docs even use `"water crash down"` — Grok is not Flux. |
| Film I2V | `kwaivgi/kling-v3.0-pro` | OpenRouter `POST /api/v1/videos` | Strict. Weapons, crash, explosion, fighter, political, NSFW. Scans **prompt and input still**. **Does not block synthetic adult faces** — this is the lane for FILM identity rows. |
| Product I2V | Seedance 2.0/2.5 | fal / OpenRouter | Semantic + English keyword lists. Identity-safe. Blocks graphic harm; also twitchy on `weapon`, `shoot`, `explode`. |
| Physics I2V | Veo 3.1 | fal `fal-ai/veo3.1/image-to-video` / OpenRouter `google/veo-3.1` | Violence, celebrities, children, brands, **and photoreal person likeness on the input image**. fal labels it `loc: body.prompt`; OpenRouter says `content may have been filtered`. Durations `4s/6s/8s` only. Passes device / vial / cockpit / wrist shots every time; blocked every face-forward portrait we sent. |
| Alt I2V | Runway | studio workflow URL | Moderate. Still avoid weapons/gore. |
| Audio | Sonilo | `audio_endpoint` on the film sheet | Keep `sfx_prompt` to "match the on-screen action." No crash/explosion copy. |

Flux 2 Max on OpenRouter accepts passthrough `safety_tolerance` (0–5, default 2). **Do not raise it** to push a blocked scene. Rewrite the sheet prompt instead.

## FILM-020 incident (use this pattern)

BFL message: `Black Forest Labs blocked this request through content moderation.`

Blocked string contained: `beach-crash`, `Not the crash`, `Not ground impact`, `interceptor`, `wreck`, `punches through`, `plasma sheath`, `roaring fire trail`, `scoring`.

Rewrite that **did** pass:

- `interceptor` / `beach-crash ship` → `spacecraft` / `FILM-009 reference still`
- `crash` / `impact` / `wreck` → omit. Say `high-speed atmospheric descent`, `hull stays intact and clean`
- `fire trail` / `plasma sheath` → `warm orange-white atmospheric glow`, `long luminous trail`
- `punches through` → `travels through` / `moves through`

Keep: charcoal needle-arrowhead hull, twin **cyan** engines, navy-gold dorsal stripe, FILM-014 beach planet, 9:16, 2K, no people.

## Pre-flight gate (run before every I2V execution)

Do this on the row that `pick_film_still` / `pick_creation` will select. It takes one minute and it is cheaper than one wasted run.

1. **Look at the still.** Open `picked_url` / `still_url`. Is there a person? Is the face camera-facing and larger than ~10% of the frame? If yes → `video_provider` must be `kling` (or `seedance`), never `veo`.
2. **Check the provider ↔ duration pair.** Veo: `4` / `6` / `8`. Kling: `3`–`15`. Seedance: per its sheet doc.
3. **Scan every prompt column** with `references/lexicon.md` **and** the human table in `references/human-subjects.md`. Includes words inside negations.
4. **Confirm the motion prompt is motion-only.** No re-description of her face, body, or suit fit. Camera + beats + what holds.
5. **Check `references/incidents.md`** for the same still or the same provider+category pair. If it blocked before and nothing changed, do not run it.
6. Only then execute. **One** run.
7. In the reply, report the gate in one line, e.g. `Gate: FILM-001, person in frame, face 3/4 eyes-down → kling, 5s legal, lexicon clean, no prior block on this still. Running once.`

## Blocked-run procedure

1. Read the **exact** prompt and **exact** `image_url` that were sent (execution body, not the overlay comment).
2. Decide word block vs image block (table above). A calm camera brief that 422s = image block.
3. **Word block:** highlight every lexicon hit, including words inside `"Not the …"`. Rewrite `still_prompt` / `still_edit_prompt` / `video_motion_prompt` on the sheet via overlay. Same picture, safer words.
4. **Image block:** do not touch the wording. Either (a) set `video_provider` to `kling` for that row, or (b) regenerate the still with the face smaller / turned / eyes down (`references/human-subjects.md` composition rules). Tell Salvatore which one you did.
5. Re-run **once**. If it still blocks, shorten: drop adjectives, drop negatives, keep identity lock + one action.
6. **Log it** in `references/incidents.md` — blocked and passed both.
7. Still blocked after a clean rewrite and a correct provider → tell Salvatore. Do not invent a different scene.

## Lab / pen / molecule extras

Already banned in this studio and also filter-bait: people, hands, faces, **needles**, syringes, injection, on-pen milligram dosage, wellness claims, kids.

Prefer `clear research solution` over `blood` / `serum` as gore. Prefer `glittering` / `iridescent` over `crystalline` if a run gets twitchy. Never put `drug manufacturing`, `steroid`, or `controlled substance` in a visual prompt.

Photography: do not say `shoot`. Say `capture`, `frame`, `film still`.

## Quality still wins

Hygiene is wording, not a license to drop 2K / 9:16 / identity lock. A prompt that passes moderation at 720p is still a failed still.
