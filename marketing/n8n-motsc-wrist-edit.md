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

## Planet establish — otherworldly Palm Beach

`planet_establish` (FILM-014) is a recognizable luxury beach that is clearly another planet: sugar-white sand, turquoise shallows, royal palms, twin moons, golden bioluminescent horizon. Not Earth Miami, not a rust-red canyon.

Crash / alien / warp rows that reused the old canyon planet lock are updated to the same coast so the film stays one world.

Overlay Code: `marketing/n8n-code-overlay-planet-beach.js`

```text
manual_trigger → get_film_stills → overlay_planet_beach → sheets_update_wrist_lock
```
