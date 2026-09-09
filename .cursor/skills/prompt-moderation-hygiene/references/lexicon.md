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

## Human subjects (FILM identity / astronaut rows)

Full rules and the provider routing law: `human-subjects.md`. Wording alone does not clear a Veo face block — the start frame or the provider must change.

| Do not put in the prompt | Put this instead |
|---|---|
| identity portrait, head and shoulders, front view, headshot, close-up on her face, beauty shot | medium shot, waist-up; body turned three-quarter to camera |
| looking straight into the lens, direct eye contact (in the **still**) | chin tilted down, eyes on her left wrist; looking toward the shoreline — put eye contact in the motion prompt's last beat |
| beautiful, gorgeous, stunning, sexy, hot, alluring, seductive, sultry | calm, confident, focused; describe hair, eyes, freckles, suit |
| tight, form-fitting, skin-tight, curves, cleavage, bare, unzipped, wet suit, soaked, sweat, glistening skin | navy-and-gold flight suit; suit fabric moves in the wind |
| chest patch (if a row has already tripped) | suit patch |
| girl, young, teen, youthful, baby face, petite, schoolgirl | late-20s woman; adult astronaut |
| looks like [name], resembles, supermodel, Hollywood, celebrity, famous, influencer | omit entirely |
| strapped, restrained, bound, cuffed, shackled (device on wrist) | sits on her left wrist; wrist band; worn on the wrist bone |
| lips parted, bite lip, lick, kiss, caress, pose, seductive glance | slight smile; glance down at the device; turns her head |
| intense stare, angry, screaming, crying, in pain, injured, bleeding, collapse | calm, direct look; focused; curious |
| undress, unzip, strip, remove the suit | omit |
| "no nudity", "no children", "not a celebrity", "not sexy" | delete — negation still matches the token |

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
| people / celebrity (lab rows) | skip (studio) | skip | skip | skip | hard |
| synthetic adult face, camera-facing, > ~10% of frame (FILM rows) | n/a (still gen) | **passes** | passes | passes | **hard — image block, 4/4 failed** |
| synthetic adult, face small / turned / eyes down | n/a | passes | passes | passes | passes (FILM-019) |
| hands / wrist / device only | n/a | passes | passes | passes | passes (9/9) |
| needle | skip (studio) | skip | skip | skip | skip |

When in doubt, write the Flux/Kling column. That prompt will also pass Grok. For a face-forward human row, the column that matters is the **provider**, not the wording — route it to Kling.
