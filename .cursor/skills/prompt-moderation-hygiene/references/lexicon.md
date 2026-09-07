# Prompt lexicon — legitimate swaps only

Use these when writing sheet cells for this studio. Left column = tokens that have blocked **or** are documented false-positive bait. Right column = the picture we actually want.

Do **not** add entries that describe gore, weapons-on-people, NSFW, or crime. If the desired picture is those things, stop.

## Film / spacecraft (FILM-020 class)

| Do not put in the prompt | Put this instead |
|---|---|
| crash, crashed, crashing | high-speed atmospheric descent; orbital approach |
| impact, ground impact, collide, collision | nose pointed toward the coast below; does not touch the ground |
| wreck, wreckage, debris, destroyed | hull stays intact and clean |
| interceptor, fighter, warship, bomber | spacecraft; dart ship; FILM-009 reference still |
| military, tactical, weapon, missile, gun | omit |
| punch through, slam, smash | travels through; moves through |
| fire trail, roaring fire, burning, flames, on fire | warm orange-white atmospheric glow; long luminous trail |
| plasma sheath, incandescent streaks, scoring | bow wave of light; light atmospheric glow only |
| explosion, explode, blast, bomb | omit (we do not want a blast) |
| battle, war, combat, attack | omit |
| "Not the crash" / "Not ground impact" | delete the whole clause. Negation still flags the word. |
| beach-crash ship / key_a3_crash | exact same spacecraft as the FILM-009 reference |

## Motion / camera (I2V)

| Do not put in the prompt | Put this instead |
|---|---|
| crash down (Flux/Kling) | descend; move toward; water pours (Grok is looser; still prefer descend on Kling) |
| shoot (camera) | capture; frame; hold; dolly; pan |
| destroy, rip apart, tear | hold identity; hull panels stay |
| violent, aggressive camera | fast locked side profile; rapid push-in |

Keep I2V short: camera path, speed, what must not change. The still already has the scene.

## Lab catalog (vials, pens, molecules)

| Do not put in the prompt | Put this instead |
|---|---|
| needle, syringe, injection, inject, jab | omit (studio rule + filter bait) |
| drug manufacturing, narcotic, steroid | research catalog still; laboratory glass |
| blood, gore, wound | clear research solution; pale liquid in glass |
| milligram / mg on a **pen** label | no dosage on pens |
| child, kid, baby, teen | no people at all |
| celebrity / politician names | omit |
| shoot the product | capture the product; catalog still |

## Words that look scientific but twitch some filters

| Risky | Safer if a run already blocked |
|---|---|
| crystalline | glittering; iridescent; faceted |
| crystal | glass; mineral sparkle |
| serum (gore-adjacent) | research solution |
| plasma (weapon-adjacent on film rows) | atmospheric glow; ionized light |

`crystalline palms` is fine on Grok. Flux FILM-020 passed after other words were removed; do not add `crystal*` back onto a row that just unblocked.

## Negatives — allowed vs bait

Safe studio negatives (keep): `No people, no hands, no vial, no text, no logos, no watermarks` on **film** rows that are not vial heroes. On vial rows, do not say `no vial`.

Unsafe negatives (delete): `no crash`, `no blood`, `no weapons`, `no explosion`, `not a wreck`, `never on fire`. Those are keyword hits.

## Per-API tightness (same picture, different risk)

| Token | Flux 2 Max | Kling 3.0 Pro | Grok Imagine | Seedance | Veo |
|---|---|---|---|---|---|
| crash | hard block (FILM-020) | high | often OK | medium | high |
| interceptor / fighter | hard | high | medium | high | high |
| fire / burning | high | high | medium | medium | high |
| explosion | hard | hard | high | high | hard |
| weapon | hard | hard | high | hard | hard |
| people / celebrity | skip (studio) | skip | skip | skip | **host split** — person in the still → fal Veo; no people → OpenRouter Veo |
| needle | skip (studio) | skip | skip | skip | skip |

When in doubt, write the Flux/Kling column. That prompt will also pass Grok.

## Veo 3.1 host (not a word swap)

OpenRouter `google/veo-3.1` = non-human scenes only. fal `fal-ai/veo3.1/image-to-video` = any still with a person. Full rule: `marketing/prompt-moderation-rulebook.md` § Veo 3.1 host split.
