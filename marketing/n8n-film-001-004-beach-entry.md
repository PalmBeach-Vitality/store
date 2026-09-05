# FILM-001 / 004 beach + FILM-020 atmospheric entry

Sheet 18 never remade **FILM-001** or **FILM-004** onto the FILM-014 beach. Live keepers are still gray studio. An earlier branch generated beach PNGs, then deleted them before Drive keepers arrived. Those stills never landed on the sheet.

**FILM-020** is a shoreline plunge with a thin heat-glow — not space → high-speed entry with heavy atmospheric burn-up.

This overlay writes prompts only. Still pixels come from `edit_film_beach_entry` (Grok edit of the current `picked_url`). I2V stays on the existing Veo / Kling workflows after a new keeper is picked.

```text
overlay_film_beach_entry
  → edit_film_beach_entry (Grok still-edit from sheet still_edit_prompt)
  → pick keeper → write picked_url
  → film_i2v_veo (001 / 004) and film_i2v_kling (020)
```

Subjects stay the MOTS-C film catalog. No extra people on 020. Wrist lock and ship lock stay tight.

---

## What changes

| still_id | category | Change |
|---|---|---|
| **FILM-001** | `identity_front` | Same blonde astronaut + square left-wrist computer. **Replace gray studio with the FILM-014 beach lock.** |
| **FILM-004** | `suit_full_body` | Same woman, full body, boots on iridescent lilac-gold sand. Same beach lock. |
| **FILM-020** | `key_a3_crash` | Same FILM-010 arrowhead ship. Still = mid-entry: space at top, planet limb + FILM-014 coast below, **thick plasma / bow shock / long fire trail**. Motion = space → high-speed dive → heavy burn-up. |

**Unchanged:** FILM-009 (clean space establish), FILM-014 (empty coast), FILM-015 (landed, light scoring). No 26th row.

FILM-014 beach lock (verbatim):

> Alien-galaxy luxury coast — same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.

---

## Overlay — `overlay_film_beach_entry`

Manual one-shot. Unpublished. Do not publish.

`manual_trigger` → **get_film_stills** → **overlay_film_beach_entry** → **sheets_update_beach**

Writes `still_prompt`, `still_edit_prompt`, `video_motion_prompt`, and clears `video_url` on the three rows. Leaves `picked_url`, `reel_id`, `clip_order`, `seam_mode` alone.

CSV snapshot: `marketing/sheets/20-film-001-004-020-beach-entry.csv`

### get_film_stills

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film_beach_entry`

Google Sheets **Read**. Document `1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU`, tab gid `1628285227`. Credential **Google Sheets account** (`OGHfxWtOUeZbDesw`).

### overlay_film_beach_entry

**Before → this → After:** `get_film_stills` → **overlay_film_beach_entry** → `sheets_update_beach`

Code node. `marketing/n8n-code-overlay-film-beach-entry.js`. Throws if any of the three `still_id`s is missing.

### sheets_update_beach

**Before → this → After:** `overlay_film_beach_entry` → **sheets_update_beach** → `end`

Google Sheets **Update**, match `still_id`, auto-map the four fields.

---

## Still edit — `edit_film_beach_entry`

Manual one-shot. Unpublished. Run **after** the overlay.

`manual_trigger` → **get_film_stills** → **prep_beach_edits** → **grok_imagine_edit_still** → **collect_beach_edits** → **sheets_update_still**

Sheets-only: `still_edit_prompt`, `model_still`, `aspect_ratio`, `n`, and `picked_url` come from Sheet 18. Empty prompt fails. Does not invent a fallback. Appends new URLs onto `take_urls`. Does **not** write `picked_url` — pick a keeper after you look at the takes.

### prep_beach_edits

**Before → this → After:** `get_film_stills` → **prep_beach_edits** → `grok_imagine_edit_still`

`marketing/n8n-code-prep-beach-edits.js`. Emits `n` items per still (3 / 3 / 4).

### grok_imagine_edit_still

**Before → this → After:** `prep_beach_edits` → **grok_imagine_edit_still** → `collect_beach_edits`

`POST https://api.x.ai/v1/images/edits`. Body `={{ $json.still_edit_body_json }}`. Credential **XAI Grok** (`z1BIQ5TSRwkwn4UG`). Timeout 180s.

### collect_beach_edits

**Before → this → After:** `grok_imagine_edit_still` → **collect_beach_edits** → `sheets_update_still`

`marketing/n8n-code-collect-beach-edits.js`. Groups by `still_id`.

### sheets_update_still

**Before → this → After:** `collect_beach_edits` → **sheets_update_still** → `end`

Google Sheets **Update**, match `still_id`, write `take_urls` only.

---

## After the takes

1. Open the new `take_urls` for 001 / 004 / 020.
2. Write the keeper into `picked_url`.
3. Run `film_i2v_veo` for 001 and 004 (Veo 3.1, 8s, 1080p).
4. Run `film_i2v_kling` for 020 (Kling 3.0 Pro, 10s, 720p).

I2V nodes map motion / model / duration / resolution from the sheet. Do not hardcode those values in HTTP nodes.
