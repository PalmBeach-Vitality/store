# Moderation incident log

Append one row per generation that was **blocked** or that **passed after a block**. Newest at the bottom. This is the skill's memory: before executing a row, search here for the same still URL, the same `still_id`, or the same provider + framing. If it blocked before and nothing changed, do not run it.

Columns: date · workflow / execution · provider + model · row · start frame · exact prompt sent · error · kind (word / image / validation) · what changed · result.

## Stills

| Date | Exec | Provider | Row | Frame | Prompt sent (abridged) | Error | Kind | What changed | Result |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-07 | `gen_film020_flux_2k` 2052 | OpenRouter `black-forest-labs/flux.2-max` | FILM-020 | spacecraft side profile, no people | `… beach-crash ship … Not the crash … interceptor … wreck … punches through … plasma sheath … roaring fire trail …` | `Black Forest Labs blocked this request through content moderation.` | word | `spacecraft`, `high-speed atmospheric descent`, `warm orange-white atmospheric glow`, `hull stays intact`; deleted every `Not the …` clause | passed, 1152×2048 PNG |

## I2V

| Date | Exec | Provider | Row | Frame | Prompt sent | Error | Kind | What changed | Result |
|---|---|---|---|---|---|---|---|---|---|
| 2026-09-02 | `film_i2v_veo` 1734 | fal `fal-ai/veo3.1/image-to-video` 1080p 8s | FILM-001 `2q4rye.jpeg` | head-and-shoulders portrait, soft original JPEG | `Slow cinematic push-in on her face. Hair drifts. Amber wrist-screen holds steady. Silent. Lock this exact portrait.` | — | — | — | **passed** (only face-forward Veo pass on record) |
| 2026-09-02 | `film_i2v_veo` 1737 | fal Veo 3.1 1080p 8s | FILM-002 `ttk2g1.png` | identity 3/4, face ~30% of frame | `Slow orbit from three-quarter toward her left cheek. Ponytail shifts. Device stays on the left wrist. Silent.` | 422 `content_policy_violation` `loc: body.prompt` | image | — | blocked |
| 2026-09-02 | `film_i2v_veo` 1743 | fal Veo 3.1 1080p 8s | FILM-004 `8uc3v8.png` | full body, face visible | `Slow full-body pull-back, boots to hair. Suit fabric breathes. Left-wrist square device stays locked. Silent.` | 422 `no_media_generated` | image (output-side) | — | blocked |
| 2026-09-02 | `film_i2v_veo` 1747 | fal Veo 3.1 1080p 8s | FILM-005 wrist device macro | hands + device only | `Macro push on the square gunmetal box on TOP of the left wrist …` | — | — | — | passed |
| 2026-09-02 | `film_i2v_veo` 1761 | fal Veo 3.1 1080p 8s | FILM-011 cockpit | no person | `Slow cockpit push through the canopy …` | timeout at 240 s (not moderation) | validation | raise `wait_seconds` | — |
| 2026-09-02 | `film_i2v_veo` 1766 | fal Veo 3.1 1080p 8s | FILM-021 spent vial | hand + vial | `Macro on the spent vial in hand. Last drop moves. Label locked. Silent.` | — | — | — | passed |
| 2026-09-05 | `film_i2v_veo` 2013 | OpenRouter `google/veo-3.1` 1080p 8s | FILM-001 `film001-identity.png` 1584×2816 | head-and-shoulders portrait, HQ upscale | `Late-20s blonde astronaut on the alien coast. Soft wind in hair and navy-gold flight suit … Camera holds. Silent.` | `failed` — `Video generation completed with no output (content may have been filtered)` | image | — | blocked |
| 2026-09-07 | `film_i2v_veo` 2084 | OpenRouter `google/veo-3.1` 1080p 4s | FILM-002 `iols66-hq.png` 1584×2816 | same portrait, HQ | `Locked 9:16 on this exact still. Same woman, same pose, same scene. No new action. Soft natural life only. Silent.` | `failed` — `content may have been filtered` | image | — | blocked |
| 2026-09-07 | `film_i2v_veo` 2089 | fal Veo 3.1 1080p 4s | FILM-002 `iols66-hq.png` | same portrait, HQ | `Camera holds. Soft coastal wind in the hair and suit. Twin moons stay. Photoreal. Silent.` | 422 `content_policy_violation` `loc: body.prompt` | image | — | blocked. Third calm prompt on the same still. Confirms image block. |
| 2026-09-09 | — | — | FILM-001 | — | rewritten still prompt (waist-up, 3/4, eyes on wrist) + 5 s Kling motion prompt, see `human-subjects.md` | — | — | provider → `kling`, framing → waist-up / eyes down, duration → 5 | **pending** — log the result here |
