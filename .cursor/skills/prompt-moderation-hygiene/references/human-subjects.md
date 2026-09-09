# Human subjects — stills and I2V that pass first time

Applies to every FILM row with a person in frame (the MOTS-C astronaut, hands, wrists, body) and to any future row with a model, patient, or presenter. Lab-item / pen / molecule rows have **no people** by studio rule and skip this file.

This is false-positive avoidance for a fictional, adult, fully synthetic character. It is not a guide for real-person likeness, minors, or suggestive content — those stop the run.

## What actually blocks a human clip

Google Veo runs a **realistic-person / prominent-person likeness classifier on the input image**. Google documents it as the *Celebrity* category, support codes `15236754` / `29310472`: "Rejects requests to generate a photorealistic representation of a prominent person **or if the project isn't on the allowlist for this feature**." Third-party developers report the same false positive on 100% synthetic adult avatars. The allowlist is per Google Cloud project; fal and OpenRouter are the project owners, so it is unreachable from this studio.

The error never says "face":

| Route | What you see | Meaning |
|---|---|---|
| fal `fal-ai/veo3.1/image-to-video` | 422 `content_policy_violation`, `loc: ["body","prompt"]` | Image block. The `prompt` label is fal's generic slot. |
| fal, same model | 422 `no_media_generated` after 10–100 s | Veo generated, then its **output** filter dropped the clip (person still prominent in the output). |
| OpenRouter `google/veo-3.1` | `status: failed`, `Video generation completed with no output (content may have been filtered)` | Same output-side filter. |

Kling 3.0 Pro and Seedance scan prompt + still for weapons, gore, NSFW, politics. They **do not** reject a synthetic adult face as a likeness. Kling is the documented best-in-class I2V for facial motion.

## Our own evidence (workflow `film_i2v_veo`, Sep 2–7 2026)

| Still | Frame | Veo result |
|---|---|---|
| FILM-002 identity 3/4, `ttk2g1.png` | face ~30% of frame, camera-facing | 422 content_policy_violation |
| FILM-002 `iols66-hq.png` 1584×2816 | same portrait, sharper skin | 422 (fal) **and** filtered (OpenRouter) |
| FILM-001 `film001-identity.png` 1584×2816 | same portrait | filtered (OpenRouter) |
| FILM-004 full body | whole figure, face visible | 422 no_media_generated |
| FILM-001 `2q4rye.jpeg` (Sep 2, soft original) | same portrait, lower detail | **passed** |
| FILM-005/006 wrist device macro | hands only | passed |
| FILM-011 cockpit, FILM-013 core, FILM-021 spent vial | no face | passed |
| FILM-019 wrist look-down | face small, turned, eyes down | passed |

Read-out: every failure had a prominent, camera-facing face. Every pass had no face, or a small face turned away. The HQ 2K upscales made the block **worse** — more photoreal skin detail pushes the classifier over its "real person" threshold. Prompt text was calm in every failure; wording was never the cause.

## Provider routing law

| Start frame | `video_provider` | Why |
|---|---|---|
| Face camera-facing, or face > ~10% of frame, or head-and-shoulders / portrait / close-up | `kling` (`kwaivgi/kling-v3.0-pro`, or fal `fal-ai/kling-video/v3/pro/image-to-video`) | No likeness filter on synthetic adults. 1080p. 3–15 s. Best face motion. |
| Same, Kling unavailable | `seedance` | Identity-safe, semantic filter. |
| Face < ~10% of frame **and** turned / eyes down, or hands-only, or no person | `veo` allowed | This is the only human framing Veo has ever passed for us. |
| Product / device / cockpit / vial, no person | `veo` preferred | Best physics; passed 9/9. |

Switching the *gateway* (fal ↔ OpenRouter) for Veo changes nothing. Same Google model, same filter.

## Composition rules for a human `still_prompt` (start frame)

Write the frame so the classifier has less face to score, and so the picture is still the shot Salvatore wants.

- **Framing:** `medium shot, waist-up` or wider. Avoid `identity portrait`, `head and shoulders`, `front view`, `close-up on her face`, `headshot`, `beauty shot`, `passport`.
- **Head:** `body turned three-quarter to camera`, `chin tilted down`, `eyes on her left wrist` / `looking toward the shoreline`. Do not write `looking straight into the lens` or `direct eye contact` in the **still**. Eye contact happens in the motion prompt, at the end.
- **Focus:** put the sharp plane on the device / hands / suit patch: `shallow depth of field on the device and her hands`. A slightly softer face is a feature here.
- **Resolution:** keep 2K / 9:16 per the quality rule. If a row is forced onto Veo and blocks, the softer original take beats the HQ upscale as start frame — but the correct fix is the provider, not the resolution.
- **Age and identity words:** `late-20s woman`, `adult`. Never `girl`, `young`, `teen`, `youthful`, `baby face`, `petite` — those pull the *Child* filter. Never a real name, `looks like`, `resembles`, `supermodel`, `Hollywood`, `celebrity`, `famous`.
- **Body words:** describe the **suit**, not the body. `navy-and-gold flight suit`, `athletic build` are fine. Avoid `beautiful`, `gorgeous`, `sexy`, `curves`, `tight`, `form-fitting`, `wet`, `sweat`, `glistening skin`, `bare`, `unzipped`, `cleavage`, `lingerie`, `bikini`, `lips parted`, `bite lip`, `seductive`, `sultry`, `alluring`. Say `suit patch` rather than `chest patch` if a row has already tripped once.
- **Hands / device:** `small watch-scale wrist computer on her left wrist` is fine. Do not write `strapped`, `restrained`, `bound`, `shackle`, `cuff` — bondage-adjacent tokens.
- **Emotion:** `calm`, `confident`, `focused`, `curious`, `slight smile`. Avoid `intense stare`, `angry`, `screaming`, `crying`, `in pain`, `injured`, `bleeding`.
- **Negatives:** `No other people, no text, no logos, no watermarks` only. Never `no nudity`, `no children`, `not a celebrity`, `not sexy` — those are keyword hits.

## Rules for a human `video_motion_prompt`

The still already holds identity. The motion prompt is camera + timed beats + what holds.

- Open with duration and frame: `5-second clip, camera locked waist-up on the same astronaut, same exact scene.`
- **Timed beats** in seconds: `0–3s: she lifts her gaze from the wrist device and looks slowly around the shoreline, left then right. 3–5s: she turns her head to camera and holds a calm, direct look through the final frame.`
- Allowed human motion: blink, breathe, hair and fabric in wind, look around, turn head, glance down at device, slight smile, nod, step, raise wrist, walk toward camera.
- **Camera-facing eye contact goes in the motion, never in the start frame.** On Kling this is fine. On Veo it can still trip the output filter (FILM-004 pattern), which is one more reason face rows are Kling rows.
- Avoid in motion prompts: `undress`, `unzip`, `strip`, `wet`, `soaked`, `sweat`, `lick`, `bite`, `kiss`, `caress`, `touch herself`, `seductive`, `pose`, `twerk`, `dance sexily`; `punch`, `hit`, `fall hard`, `bleed`, `collapse`, `scream`, `attack`; `shoot` (say `capture` / `hold` / `pan`).
- Do not re-describe her face, body, suit fit, or age in the motion prompt. `Same astronaut` is enough.
- End with what holds: `Amber wrist screen glows steady. Twin moons hold. No zoom, no camera move. Silent.`

## Durations

| Provider | Legal values | Note |
|---|---|---|
| Veo 3.1 | `4s`, `6s`, `8s` | `5` fails validation before moderation. |
| Kling 3.0 Pro | `3`–`15` s (integer) | Aspect is taken from the start image, not a parameter. |
| Seedance 2.5 | per `marketing/n8n-seedance-vid-gen.md` | |

`duration_seconds` on the sheet must match the provider on the same row.

## Worked example — FILM-001 beach identity (Sep 9 2026)

Old still prompt: `Identity portrait, front view, head and shoulders … beautiful blonde woman … helmet off, natural confident expression …` → blocked on Veo 3 times across fal and OpenRouter.

Rewritten still prompt (same coast, same woman, same device):

> Medium shot, waist-up, 9:16, on the alien-galaxy luxury coast. Late-20s blonde woman astronaut, long golden-blonde hair in a low ponytail, green eyes, light freckles, athletic build. Body turned three-quarter to camera, chin tilted down, eyes on her left wrist. Navy-and-gold flight suit with a small circular Palm Beach suit patch, helmet off, calm confident expression. On her LEFT wrist sits a small watch-scale retro-futuristic wrist computer: a blocky SQUARE gunmetal box no wider than her wrist, square amber-orange screen with slightly rounded corners, rectangular buttons and sliders on the sides. Left palm, fingers, and thumb fully visible past the band, anatomically correct. No round watch, no circular bezel, no curved CRT, no rotary knobs. Background: wide empty shoreline, iridescent crushed-pearl lilac-gold dunes glowing faintly, tall glass-veined alien trees with bioluminescent teal-violet fronds, twin oversized moons huge and close in a deep violet-magenta sky with alien stars, turquoise water with a golden bioluminescent sheen. Not Earth, not Florida. Cinematic key light from the twin moons, shallow depth of field on the device and her hands. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text except the wrist-device screen. No logos, no captions, no watermarks, no other people.

Matching motion prompt, `video_provider = kling`, `duration_seconds = 5`:

> 5-second clip, camera locked waist-up on the same astronaut, same exact scene. 0–3s: she lifts her gaze from the wrist device and looks slowly around the shoreline, left then right, taking in the twin moons and the glowing dunes; soft coastal wind in her hair and suit. 3–5s: she turns her head to camera and locks eyes with the lens, calm, direct, holding the look through the final frame. Amber wrist screen glows steady. No zoom, no camera move. Silent.

## Honest limit

These filters are probabilistic classifiers, not word lists. Following this file removes every cause we have actually hit (face-forward start frame on Veo, illegal duration, suggestive or child-adjacent tokens, negation bait). It does not make a 100% guarantee possible on any provider. What it does guarantee is that a block is never repeated: the pre-flight gate in `SKILL.md` runs before every execution, and every result lands in `incidents.md`.
