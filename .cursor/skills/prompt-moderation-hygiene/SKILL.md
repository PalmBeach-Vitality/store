---
name: prompt-moderation-hygiene
description: Rewrite still_prompt, still_edit_prompt, video_motion_prompt, and video_prompt so Flux, Kling, Grok, Seedance, Veo, and Runway stop false-positive blocking legitimate Palm Beach Vitality catalog and film stills. Use when an API returns content moderation, content_policy_violation, BFL blocked, sensitive content, or respect_moderation false; when overlaying FILM or lab-item sheet prompts; when a scene involves descent, atmosphere, speed, glow, labs, vials, or pens; or when Salvatore asks to avoid blocked wording.
---

# Prompt moderation hygiene

This skill is **false-positive avoidance** for this studio's legal catalog and film work. It is **not** a jailbreak guide.

Do **not** generate prohibited content. Do **not** recommend leetspeak, homoglyphs, zero-width characters, language-switching, or `safety_tolerance` hikes to sneak disallowed scenes. If the picture they want is actually gore, weapons used on people, NSFW, minors, real-person deepfakes, or crime how-to, **stop**.

Canonical human copy: `marketing/prompt-moderation-rulebook.md`. Swap table: `references/lexicon.md`.

## When to load this

- Overlaying or editing `still_prompt` / `still_edit_prompt` / `video_motion_prompt` / `video_prompt` / `bridge_prompt` / `sfx_prompt`
- Any gen node returns `content moderation`, `content_policy_violation`, `respect_moderation: false`, empty `data[]`, or Kling `task_status: failed` with a policy message
- FILM rows whose sheet `category` contains crash / wreck / impact (those IDs stay on the sheet — they must **not** appear in the prompt)

## Hard laws

1. **Describe the frame you want.** Do not name the thing you are trying to avoid. `"Not the crash"` still contains `crash`. Keyword filters do not honor negation.
2. **Rewrite the Google Sheet cell.** Nodes stay sheets-only. Never bake a fallback prompt into an HTTP/Code node.
3. **Do not retry the same blocked string.** Log the token, swap it, write the new cell, then run. Repeat retries of a blocked prompt are how Kling/Seedance accounts get noisy.
4. **I2V prompts are motion-only.** The still already holds identity. `video_motion_prompt` should be camera path + speed + what stays. Restating a spicy still-prompt in I2V is how Kling blocks a clip that Grok already drew.
5. **Sheet IDs are not prompt copy.** `key_a3_crash`, `interceptor`, `FILM-015 beach-crash ship` belong in comments, not in `still_prompt`.

## Studio APIs (scan these)

| Job | Model | Endpoint | Filter personality |
|---|---|---|---|
| Film / max stills | `black-forest-labs/flux.2-max` | OpenRouter `POST /api/v1/images` | BFL + Hive. Strict on crash, wreck, fire, interceptor, weapons, gore. **This is what blocked FILM-020.** |
| Daily / lab stills | `grok-imagine-image-2.0` | xAI `POST /api/v1/images/generations` | Looser on sci-fi action than Flux. Can **succeed HTTP** and return empty `data` / `respect_moderation: false`. |
| Grok I2V | `grok-imagine-video-1.5` | xAI `POST /api/v1/videos/generations` | Same family. xAI's own docs even use `"water crash down"` — Grok is not Flux. |
| Film I2V | `kwaivgi/kling-v3.0-pro` | OpenRouter `POST /api/v1/videos` | Strict. Weapons, crash, explosion, fighter, political, NSFW. Scans **prompt and input still**. |
| Product I2V | Seedance 2.0/2.5 | fal / OpenRouter | Semantic + English keyword lists. Identity-safe. Blocks graphic harm; also twitchy on `weapon`, `shoot`, `explode`. |
| Physics I2V | Veo 3.1 | OpenRouter / Google | Violence, celebrities, children, brands. Generic "couldn't be submitted". |
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

## Blocked-run procedure

1. Read the **exact** prompt that was sent (execution body, not the overlay comment).
2. Highlight every lexicon hit, including words inside `"Not the …"`.
3. Rewrite `still_prompt` and `still_edit_prompt` on the sheet via overlay. Same picture, safer words.
4. If I2V failed, rewrite `video_motion_prompt` to camera + motion only. Do not re-describe damage.
5. Re-run **once**. If it still blocks, shorten: drop adjectives, drop negatives, keep identity lock + one action.
6. Still blocked after a clean rewrite → tell Salvatore. Do not invent a different scene. Do not switch models just to dodge a filter unless he asks.

## Lab / pen / molecule extras

Already banned in this studio and also filter-bait: people, hands, faces, **needles**, syringes, injection, on-pen milligram dosage, wellness claims, kids.

Prefer `clear research solution` over `blood` / `serum` as gore. Prefer `glittering` / `iridescent` over `crystalline` if a run gets twitchy. Never put `drug manufacturing`, `steroid`, or `controlled substance` in a visual prompt.

Photography: do not say `shoot`. Say `capture`, `frame`, `film still`.

## Quality still wins

Hygiene is wording, not a license to drop 2K / 9:16 / identity lock. A prompt that passes moderation at 720p is still a failed still.
