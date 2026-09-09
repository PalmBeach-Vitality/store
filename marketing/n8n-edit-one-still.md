# `edit_one_still` — paste URL, paste edit prompt, generate

Unpublished utility: [edit_one_still](https://stockjohnson.app.n8n.cloud/workflow/AP4VUchmUDV9TW8q) `AP4VUchmUDV9TW8q`

Do **not** Publish. Click Execute, fill the form, Generate edit.

Form fields:

| Field | What |
|---|---|
| `source_url` | https still to edit |
| `still_edit_prompt` | what to change |
| `still_id` | Sheet 18 row to append onto (example `FILM-013`) |
| `n` | how many edited takes (1–10) |

`model_still` and `aspect_ratio` come from that Sheet 18 row. Empty form/sheet fields throw. Appends edited URLs onto `take_urls` and writes `still_edit_prompt`. Does **not** write `times_used` / `picked_url`.

```text
edit_form → get_film_stills → prep_manual_edit → grok_imagine_edit_still → collect_edited_takes → sheets_update_still
```

## Node 1 — `edit_form`

**Before → this → After:** `unwired` → **edit_form** → `get_film_stills`

Form Trigger. `source_url`, `still_edit_prompt`, `still_id`, `n`.

## Node 2 — `get_film_stills`

**Before → this → After:** `edit_form` → **get_film_stills** → `prep_manual_edit`

Same Sheet 18 Get as the film factory. Execute Once = ON.

## Node 3 — `prep_manual_edit`

**Before → this → After:** `get_film_stills` → **prep_manual_edit** → `grok_imagine_edit_still`

Code: `marketing/n8n-code-prep-manual-edit.js`. Builds Grok `/v1/images/edits` JSON. Fans out `n` items.

## Node 4 — `grok_imagine_edit_still`

**Before → this → After:** `prep_manual_edit` → **grok_imagine_edit_still** → `collect_edited_takes`

| Parameter | fx | Value |
|---|---|---|
| Method | OFF | POST |
| URL | OFF | `https://api.x.ai/v1/images/edits` |
| Auth | OFF | Header Auth **XAI Grok** `z1BIQ5TSRwkwn4UG` |
| Content type | OFF | raw / `application/json` |
| JSON | ON | `={{ $json.still_edit_body_json }}` |
| Timeout | OFF | 180000 |

## Node 5 — `collect_edited_takes`

**Before → this → After:** `grok_imagine_edit_still` → **collect_edited_takes** → `sheets_update_still`

Code: `marketing/n8n-code-collect-manual-edit.js`.

## Node 6 — `sheets_update_still`

**Before → this → After:** `collect_edited_takes` → **sheets_update_still** → `end`

Match `still_id`. Write `take_urls` + `still_edit_prompt` only.

First run: FILM-013 `vial_low_core` edited from FILM-012 `vial_full_core` still `...-bba19fe4.png` so the core stays identical.
