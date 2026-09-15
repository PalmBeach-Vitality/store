# Vid_gen_landscape_scenes (sheets-only)

**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/Kc2HqqjSyiKs87qy  
**Sheet:** `500_Peptide_Wellness_Reel_Scenes` on https://docs.google.com/spreadsheets/d/1S6UQmD4ZFW3oL4vx8BKmhWAZrt7KMGwsBS7jW3S9HPo  
**Rule:** no hardcoding unless Salvatore explicitly asks. Every Grok parameter is a sheet column.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
Schedule Trigger
  → choose_compound
  → get_reel_creations
  → filter_creations_active
  → pull_sheet_row
  → grok_imagine_reel_still
  → save_still_url
  → skip_still_edit
  → prep_grok_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → assert_video_ok
  → save_video_url
  → sheets_update_creation
```

The still-edit desk (`still_edit_instructions` → `download_still` → `prep_still_edit` → `grok_imagine_edit_still` → `save_edited_still_url`) sits off the live path with no input, same as lab and pen. To use it, move the wire off `save_still_url` → `skip_still_edit` and type the edit on `still_edit_instructions`. Never leave both wires on.

Caption / IF / Switch leftovers stay on the canvas **disabled**. Do not Publish. Test with Execute.

---

## Sheet columns used as Grok params

| Column | Goes to |
|---|---|
| `video_prompt` | still `prompt` |
| `still_edit_prompt` | image edit `prompt` |
| `video_motion_prompt` | video `prompt` |
| `model_still` | still + edit `model` |
| `model_video` | video `model` |
| `aspect_ratio` | still / edit / video |
| `still_resolution` | still `resolution` |
| `resolution` | video `resolution` |
| `duration_seconds` | video `duration` |
| `still_n` | still `n` |
| `audio` | nothing — see **Audio** below |
| `wait_seconds` | `wait_video` amount |
| `camera_move` | required on the row (must be present) |

Missing cell → Code throws. No `||` fallbacks in HTTP/Set.

### Audio

**Audio is off. Always. All three vid-gen workflows** (this one, `Vid_gen_lab_scenes`, `peptide_pen_vid_gen`). Salvatore's standing rule, and the one value these nodes are allowed to hardcode.

`prep_grok_video_start` sends `audio: false` and prefixes the sheet `video_motion_prompt` with the same silent lock lab and pen use:

```text
Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio.
```

The API flag on its own has let Grok score a clip, which is why the lock is in the prompt too. The sheet's `audio` column is **not read** — `pull_sheet_row` still requires it to be non-blank, so leave `FALSE` in it, but nothing downstream consumes it. Do not re-wire audio to the sheet.

---

## Nodes

### `pull_sheet_row`

**Before → this → After:** `filter_creations_active` → **pull_sheet_row** → `grok_imagine_reel_still`  
Reads `choose_compound.compound_name` and picks the least-used Active row for that compound. Matching is two-way substring, so blend names need selector handles (`Ipamorelin-Solo`, `Tesa-Ipa`) — see `marketing/sheets/README.md`.  
Execute Once **OFF**.

### `grok_imagine_reel_still`

**Before → this → After:** `pull_sheet_row` → **grok_imagine_reel_still** → `save_still_url`

| Parameter | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| JSON | **ON** | `={{ JSON.stringify({ model: $json.model_still, prompt: $json.video_prompt, n: Number($json.still_n), aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}` |

### `still_edit_instructions` / `download_still` / `prep_still_edit`

Off the live path. `still_edit_prompt` is typed Fixed on `still_edit_instructions` — it is not a sheet field and nothing writes it back. It is deliberately **blank**: a stale one-off (`remove the small blue tap from the blue cap`) used to live there and ran on every execution, so it was cleared. Leave it blank so an accidental rewire throws instead of applying somebody's old edit.  
`download_still` fetches the still as a file because xAI `/v1/images/edits` 404s on `imgen.x.ai` URLs.  
Execute Once **OFF**.

### `grok_imagine_edit_still`

**Before → this → After:** `prep_still_edit` → **grok_imagine_edit_still** → `save_edited_still_url`  
JSON **ON** `={{ $json.still_edit_body_json }}`

### `prep_grok_video_start`

**Before → this → After:** `skip_still_edit` → **prep_grok_video_start** → `grok_video_start`  
Paste: `marketing/n8n-code-landscape-prep-grok-video-start.js`  
Forces `audio: false` and the silent lock. Everything else is sheet-owned.

### `wait_video`

**Before → this → After:** `grok_video_start` → **wait_video** → `grok_video_poll`  
Amount **ON** `={{ Number($('pull_sheet_row').first().json.wait_seconds) }}`

### `assert_video_ok`

**Before → this → After:** `grok_video_poll` → **assert_video_ok** → `save_video_url`

`grok_video_poll` fires once after `wait_video`. If the render failed, or is still queued, the poll comes back with no video URL — and without this guard `save_video_url` wrote an empty `video_url` while `sheets_update_creation` still incremented `times_used`, so the row rotated out with nothing to show. Now it throws. If the message says queued or processing, raise `wait_seconds` on the row. Same node as pen's `assert_video_ok`.

### `save_video_url`

`video_model` / `video_seconds` / `aspect_ratio` from `pull_sheet_row` / `prep_grok_video_start` — not Fixed literals.

Several assignment names in this Set node are written `=video_url`, `=creation_id` and so on. Cosmetic: n8n strips the leading `=` when resolving the field name. Left as-is.

---

## One-shot sheet overlay

`overlay_landscape_sheet_params` writes `still_edit_prompt`, `wait_seconds`, `audio`, `still_n` onto existing rows (does not touch `times_used`). Archive after one successful Execute.
