# MOTS-C film stills — wrist lock + FILM-001 still edit

The first identity stills (FILM-001, n=3) put a giant Pip-Boy gauntlet where her left hand should be. The meter must sit **exactly on her wrist**, watch-scale, with her **left hand, palm, fingers, and thumb still visible**.

Do **not** Publish. Test with Execute. Sheets-only: edit prompt comes from Sheet 18 `still_edit_prompt`.

Live sheet: [18-motsc-film-stills](https://docs.google.com/spreadsheets/d/1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU/edit#gid=1628285227)

Factory (unchanged, unpublished): `custom_vid_gen 1.5 -18-motsc-film-stills` `qZ7qU8LVwVXAXyaL`

---

## Overlay (one-shot, then archive)

`overlay_wrist_lock_sheet18`

```text
manual_trigger → get_film_stills → overlay_wrist_lock → sheets_update_wrist_lock
```

Locks `still_prompt` on FILM-001/002/003/004/005/006/019/021. Writes `still_edit_prompt`. Writes FILM-001 `take_urls` from exec 1588 if empty. Does not write `times_used`.

## Node 1 — `get_film_stills`

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_wrist_lock`

Same Document / tab as the factory.

## Node 2 — `overlay_wrist_lock`

**Before → this → After:** `get_film_stills` → **overlay_wrist_lock** → `sheets_update_wrist_lock`

Code: `marketing/n8n-code-overlay-wrist-lock.js`. Mode: Run Once for All Items.

## Node 3 — `sheets_update_wrist_lock`

**Before → this → After:** `overlay_wrist_lock` → **sheets_update_wrist_lock** → `end`

Match `still_id`. Map `still_prompt`, `still_edit_prompt`, `take_urls` from `$json`. Extra fields → insert new column.

---

## FILM-001 still edit (unpublished)

Live: [`edit_film001_wrist_stills`](https://stockjohnson.app.n8n.cloud/workflow/AYlmzLYoUnGrV3pW) `AYlmzLYoUnGrV3pW`

Do **not** archive this workflow. Do **not** Publish. Test with Execute.

FILM-001 keeper (`picked_url`, n8n exec 1592): `https://imgen.x.ai/xai-imgen/xai-tmp-imgen-17707263-9730-9dde-934b-32637210c022-df6984b8.jpeg`

---

## FILM-003 identity_side lock (one-shot, then archive)

Exec 1596 put the device on the bicep / across the chest, added extra limbs, and made a round watch. `still_prompt` + `still_edit_prompt` on FILM-003 now lock: true **left** profile, left arm hanging at her side, device on the **left wrist joint**, **square** housing/screen, exactly two arms / two hands.

```text
manual_trigger → get_film_stills → overlay_film003_lock → sheets_update_film003
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film003_lock`

**Before → this → After:** `get_film_stills` → **overlay_film003_lock** → `sheets_update_film003`

Code: `marketing/n8n-code-overlay-film003-lock.js`. Does not write `times_used` / `last_used_at` / `take_urls`.

**Before → this → After:** `overlay_film003_lock` → **sheets_update_film003** → `end`

Match `still_id`. Map `still_prompt` and `still_edit_prompt` only.

To regenerate FILM-003, set `times_used` back to 0 and Execute the factory. Do not Publish.

---

## FILM-004 square left-wrist device lock (one-shot, then archive)

FILM-004 keeper (`picked_url`): `https://imgen.x.ai/xai-imgen/xai-tmp-imgen-a634dcd1-992e-9e5e-b1d6-16bab41767f8-637a386c.png`

Close-ups must match that rectangular blocky gunmetal box. **NO ROUND SHAPES.** Device is **ALWAYS on her left hand / left wrist**.

Locks `still_prompt` + `still_edit_prompt` on FILM-001/002/003/004/005/006/019/021. Does not write `times_used` / `last_used_at` / `take_urls` / `picked_url`.

Executed as unpublished overlay `NP1hgiSAz9GyuAVs` (n8n exec **1601**), then archived. Factory `qZ7qU8LVwVXAXyaL` unchanged. Next unused still after FILM-004 is **FILM-005**.

```text
manual_trigger → get_film_stills → overlay_film004_device_lock → sheets_update_device_lock
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film004_device_lock`

Same Document / tab as the factory.

**Before → this → After:** `get_film_stills` → **overlay_film004_device_lock** → `sheets_update_device_lock`

Code: `marketing/n8n-code-overlay-film004-device-lock.js`. Mode: Run Once for All Items.

**Before → this → After:** `overlay_film004_device_lock` → **sheets_update_device_lock** → `end`

Match `still_id`. Map `still_prompt` and `still_edit_prompt` only.

---

## FILM-010 sleek large ship (one-shot, then archive)

FILM-010 was a tiny white shuttle with hands / vials / wrist devices. The old closer (“except the vial label and the wrist-device screen”) invited those props.

Lock: **much larger** dark gunmetal arrowhead interceptor (tiny cockpit vs hull, cyan-blue strips, twin circular engines). **NO other objects.** Same hull on FILM-009 / 015 / 020 / 025 so the film stays one ship.

```text
manual_trigger → get_film_stills → overlay_film010_ship → sheets_update_ship
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film010_ship`

**Before → this → After:** `get_film_stills` → **overlay_film010_ship** → `sheets_update_ship`

Code: `marketing/n8n-code-overlay-film010-ship.js`. Does not write `times_used` / `take_urls` / `picked_url`.

**Before → this → After:** `overlay_film010_ship` → **sheets_update_ship** → `end`

Match `still_id`. Map `still_prompt` (and `still_edit_prompt` on FILM-009/010). Executed unpublished overlay `9wSQqyOVEoIDEyBR` (n8n exec **1607**), then archived. Factory `qZ7qU8LVwVXAXyaL` unchanged.

`edit_film001_wrist_stills`

```text
manual_trigger → get_film_stills → split_film001_edits → grok_imagine_edit_still → collect_edited_takes → sheets_update_still
```

One Execute = Grok `/v1/images/edits` on every FILM-001 take URL, then appends edited URLs onto `take_urls`.

## Node 1 — `get_film_stills`

**Before → this → After:** `manual_trigger` → **get_film_stills** → `split_film001_edits`

## Node 2 — `split_film001_edits`

**Before → this → After:** `get_film_stills` → **split_film001_edits** → `grok_imagine_edit_still`

Code: `marketing/n8n-code-split-film001-edits.js`. Empty `still_edit_prompt` throws.

## Node 3 — `grok_imagine_edit_still`

**Before → this → After:** `split_film001_edits` → **grok_imagine_edit_still** → `collect_edited_takes`

| Parameter | fx | Value |
|---|---|---|
| Method | OFF | POST |
| URL | OFF | `https://api.x.ai/v1/images/edits` |
| Auth | OFF | Header Auth **XAI Grok** `z1BIQ5TSRwkwn4UG` |
| Content type | OFF | raw / `application/json` |
| JSON | ON | `={{ $json.still_edit_body_json }}` |
| Timeout | OFF | 180000 |

## Node 4 — `collect_edited_takes`

**Before → this → After:** `grok_imagine_edit_still` → **collect_edited_takes** → `sheets_update_still`

Code: `marketing/n8n-code-collect-edited-takes.js`

## Node 5 — `sheets_update_still`

**Before → this → After:** `collect_edited_takes` → **sheets_update_still** → `end`

Match `still_id`. Write `take_urls` only. Do not touch `times_used`.

---

## FILM-014 alien-galaxy coast (one-shot, then archive)

FILM-014 looked too much like Earth and the shared “except the vial label / wrist-device screen” closer invited people and vials.

Lock: **alien-galaxy** luxury coast — iridescent lilac-gold sand, glass-veined bioluminescent trees that are **not** Earth palms, twin huge moons. **NO people, NO vials.** Same coast language on FILM-015 / 016 / 020 / 021 / 025.

```text
manual_trigger → get_film_stills → overlay_film014_planet → sheets_update_planet
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film014_planet`

**Before → this → After:** `get_film_stills` → **overlay_film014_planet** → `sheets_update_planet`

Code: `marketing/n8n-code-overlay-film014-planet.js`. FILM-014 also clears `take_urls` and sets `times_used` to 0 so the factory re-picks it. Does not write `picked_url`.

**Before → this → After:** `overlay_film014_planet` → **sheets_update_planet** → `end`

Match `still_id`. Map `still_prompt` (plus `still_edit_prompt` / `take_urls` / `times_used` on FILM-014).

Executed unpublished overlay `MC17nMDEWfA3VMUJ` (n8n exec **1615**), then archived. Factory `qZ7qU8LVwVXAXyaL` regenerated FILM-014 as exec **1616**. Do not publish.

---

## FILM-018 / FILM-019 match FILM-013 core (one-shot, then archive)

Factory exec **1626** generated FILM-018 (`key_a1_vial_dimming`) with a crystal socket / hose nest. That is not the FILM-013 circular brushed-metal well.

Lock 018 + 019 to the FILM-013 core: concentric charcoal rings, hex bolts, gold conduits as radial metal veins. **No crystal ring, no hose nest, no radar HUD hero.** FILM-018 also clears `take_urls` and sets `times_used` to 0 so the factory re-picks it.

```text
manual_trigger → get_film_stills → overlay_film018_013_core → sheets_update_core
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film018_013_core`

**Before → this → After:** `get_film_stills` → **overlay_film018_013_core** → `sheets_update_core`

Code: `marketing/n8n-code-overlay-film018-013-core.js`. Does not write `picked_url` / `last_used_at`.

**Before → this → After:** `overlay_film018_013_core` → **sheets_update_core** → `end`

Match `still_id`. Map `still_prompt`, `still_edit_prompt`, `take_urls`, `times_used`.

Executed unpublished overlay `7SDKI94KEmH0Khkk` (n8n exec **1627**), then archived. Factory exec **1628** regenerated FILM-018 on the metal core. Do not publish.

---

## FILM-018 reseat vial in core (edit, do not regenerate)

Exec **1628** metal-core takes are keepers for the well, but the vial hovers or sits on the rim. Fix that on `edit_one_still` — do not reset `times_used`.

```text
manual_trigger → get_film_stills → overlay_film018_vial_seat → sheets_update_seat
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film018_vial_seat`

**Before → this → After:** `get_film_stills` → **overlay_film018_vial_seat** → `sheets_update_seat`

Code: `marketing/n8n-code-overlay-film018-vial-seat.js`. Writes `still_prompt` + `still_edit_prompt` only.

**Before → this → After:** `overlay_film018_vial_seat` → **sheets_update_seat** → `end`

Match `still_id`. Map `still_prompt` and `still_edit_prompt`.

Paste a keeper URL into unpublished `edit_one_still` `AP4VUchmUDV9TW8q` with Sheet 18 `still_edit_prompt`. Do not publish.

Executed unpublished overlay `PvmZPKO21uqbFTNW` (n8n exec **1629**), then archived. Do not publish.

---

## FILM-019 look at the device (edit keeper)

Factory exec **1630** FILM-019 keeper `...-4d9f0046.png`: she glances aside and the square device faces the camera. She should be **reading** it; the screen faces **her**, not out.

```text
manual_trigger → get_film_stills → overlay_film019_look_device → sheets_update_look
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `overlay_film019_look_device`

**Before → this → After:** `get_film_stills` → **overlay_film019_look_device** → `sheets_update_look`

Code: `marketing/n8n-code-overlay-film019-look-device.js`. Writes `still_prompt`, `still_edit_prompt`, `picked_url`. Does not write `times_used` / `take_urls`.

**Before → this → After:** `overlay_film019_look_device` → **sheets_update_look** → `end`

Match `still_id`. Map `still_prompt`, `still_edit_prompt`, `picked_url`.

Then unpublished `edit_one_still` `AP4VUchmUDV9TW8q` on that keeper.

**Before → this → After:** `unwired` → **edit_form** → `get_film_stills`

`still_id` = `FILM-019`. `source_url` = the keeper. `still_edit_prompt` from the sheet. Do not publish.

Executed unpublished overlay `LXLuq3CRPzgzkmCZ` (n8n exec **1631**), then archived. `edit_one_still` exec **1632** (n=3) barely rotated the device. Exec **1633** (n=4, stronger watch-reading pose) from the same keeper.

Working keeper is now `...-13d57662.jpeg`. Overlay `otHmKSnCMyUtEe5a` exec **1636** wrote `picked_url` + rotate-text prompt, then archived. `edit_one_still` exec **1635** (n=4) from that keeper. Grok still renders MOTS-C LOW camera-upright. Do not publish.
