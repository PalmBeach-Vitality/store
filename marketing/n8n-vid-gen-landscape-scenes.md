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
  → fal_kling_generate               fal Kling 3.0 Pro I2V, 1080p, no audio
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
| `model_video` | video `model` — read by `fal_kling_generate` as `={{ $json.model_video }}`. Currently `fal-ai/kling-video/v3/pro/image-to-video` on all 601 rows. **Never pin a slug on the node.** |
| `aspect_ratio` | still / edit / video |
| `still_resolution` | still `resolution` |
| `resolution` | nothing at the API — fal Kling Pro **is** the 1080p tier and has no `resolution` field. `prep_grok_video_start` still requires the cell; `ffprobe` is the only proof. |
| `duration_seconds` | video `duration` |
| `still_n` | still `n` |
| `audio` | nothing — see **Audio** below |
| `wait_seconds` | nothing — `fal_kling_generate` polls to completion itself (`maxWaitTime` 600s). `prep_grok_video_start` still requires the cell, so do not blank the column. |
| `camera_move` | required on the row (must be present) |

Missing cell → Code throws. No `||` fallbacks in HTTP/Set.

### Audio

**Audio is off. Always. All three vid-gen workflows** (this one, `Vid_gen_lab_scenes`, `peptide_pen_vid_gen`). Salvatore's standing rule, and the one value these nodes are allowed to hardcode.

`prep_grok_video_start` sends `audio: false` and prefixes the sheet `video_motion_prompt` with the same silent lock lab and pen use:

```text
Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio.
```

The API flag on its own has let Grok score a clip, which is why the lock is in the prompt too. The sheet's `audio` column is **not read** — `pull_sheet_row` still requires it to be non-blank, so leave `FALSE` in it, but nothing downstream consumes it. Do not re-wire audio to the sheet.

Sheet `video_motion_prompt` starts with CAMERA LOCK (vial planted, camera travels, cap seated, no turntable). Unique camera recipes follow, including orbits as **camera** paths. Do not append that lock in `prep_grok_video_start`. Pens are a different workflow and stay out of this lock.

---

## Nodes

### `pull_sheet_row`

**Before → this → After:** `filter_creations_active` → **pull_sheet_row** → `grok_imagine_reel_still`  
Reads `choose_compound.compound_name` and picks the least-used Active row for that compound. Execute Once **OFF**.

Matching is a **two-way substring** test, so a short name silently swallows a longer one. Three compounds are only reachable by their handle, and one of them is a trap:

| Type this | You get | Note |
|---|---|---|
| `Tesa-Ipa` | Tesamorelin/Ipamorelin blend | **Typing `Tesamorelin/Ipamorelin` gets you solo Tesamorelin**, because the typed string contains `Tesamorelin` |
| `Ipamorelin-Solo` | Ipamorelin on its own | Typing `Ipamorelin` is ambiguous with `CJC/Ipamorelin` |
| `CJC-1295` | CJC on its own | Typing `CJC` is ambiguous with `CJC/Ipamorelin` |
| `TA-1` | Thymosin Alpha-1 | Typing `Thymosin Alpha-1` matches nothing and throws |

The other 19 compounds match on their own name: `AOD-9604`, `BPC-157`, `CJC/Ipamorelin`, `Cagrilintide`, `GHK-Cu`, `GLOW`, `KLOW`, `KPV`, `MOTS-C`, `Melanotan 2`, `NAD+`, `PT-141`, `SS-31`, `Selank`, `Semax`, `Sermorelin`, `TB-500`, `Tesamorelin`, `Wolverine`. Typing `Wolverine` still selects those rows; the vial **print** on `video_prompt` is `BPC-157/TB-500` (Grok Imagine word-blocks Marvel "Wolverine"). Typing `Melanotan 2` selects the Melanotan 2 rows.

When several rows share a compound the least-used one wins (`times_used`, then `last_used_at`, then `rank`).

### `grok_imagine_reel_still`

**Before → this → After:** `pull_sheet_row` → **grok_imagine_reel_still** → `save_still_url`

| Parameter | fx | Value |
|---|---|---|
| Method | — | `POST` |
| URL | **OFF** | `https://api.x.ai/v1/images/generations` |
| JSON | **ON** | `={{ JSON.stringify({ model: $json.model_still, prompt: $json.video_prompt, n: Number($json.still_n), aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}` |

### `still_edit_instructions` / `download_still` / `prep_still_edit`

Off the live path, and **fluid** — `still_edit_instructions` is a scratch pad Salvatore types over per run. `still_edit_prompt` is not a sheet field and nothing writes it back. Whatever is in it is not a lock: do not audit it, do not report it as a defect, do not carry it forward. It is currently blank; type an edit there only when you actually want one.  
`download_still` fetches the still as a file because xAI `/v1/images/edits` 404s on `imgen.x.ai` URLs.  
Execute Once **OFF**.

### `grok_imagine_edit_still`

**Before → this → After:** `prep_still_edit` → **grok_imagine_edit_still** → `save_edited_still_url`  
JSON **ON** `={{ $json.still_edit_body_json }}`

### `prep_grok_video_start`

**Before → this → After:** `skip_still_edit` → **prep_grok_video_start** → `fal_kling_generate`
Paste: `marketing/n8n-code-landscape-prep-grok-video-start.js`
Forces `audio: false` and the silent lock. Everything else is sheet-owned.

### `fal_kling_generate`

**Before → this → After:** `prep_grok_video_start` → **fal_kling_generate** → `assert_video_ok`

fal.ai node, Model / Generate. Same config as lab and pen:

| Setting | fx | Value |
|---|---|---|
| Model | **ON** | `={{ $json.model_video }}` (mode: By ID) |
| Parameter `prompt` | **ON** | `={{ $json.video_motion_prompt }}` |
| Parameter `start_image_url` | **ON** | `={{ $json.still_url }}` |
| Parameter `duration` | **ON** | `={{ String($json.duration_seconds) }}` |
| Parameter `generate_audio` | **ON** | `={{ false }}` |
| Wait For Completion | — | **ON** (poll 5s, max 600s) |
| Credential | — | `fal.ai account` |

`generate_audio` has to be `={{ false }}`, not the text `false` — fal reads the literal string
`"false"` as truthy. Pro has no `resolution` field and I2V takes `aspect_ratio` from the start image,
so `ffprobe` for 1080 × 1920 rather than trusting the row.

The old `grok_video_start` / `wait_video` / `grok_video_poll` chain stays on the canvas **disabled**.

### `assert_video_ok`

**Before → this → After:** `fal_kling_generate` → **assert_video_ok** → `save_video_url`

A failed or empty render still arrives here as an item with no video URL — and without this guard
`save_video_url` wrote an empty `video_url` while `sheets_update_creation` still incremented
`times_used`, so the row rotated out with nothing to show. Now it throws. Same node as pen's
`assert_video_ok`. If it reports a timeout, raise `maxWaitTime` on `fal_kling_generate` (sheet
`wait_seconds` no longer drives the video wait).

### `save_video_url`

`video_model` / `video_seconds` / `aspect_ratio` from `pull_sheet_row` / `prep_grok_video_start` — not Fixed literals.

Several assignment names in this Set node are written `=video_url`, `=creation_id` and so on. Cosmetic: n8n strips the leading `=` when resolving the field name. Left as-is.

---

## Pre-flight before a run

Checked 2026-09-15 against the live `pull_sheet_row` contract — all clean:

- 601 rows, all `Active`, no duplicate `creation_id`.
- Every field `pull_sheet_row` throws on is populated on every row: `video_prompt`, `video_motion_prompt`, `camera_move`, `model_still`, `model_video`, `still_resolution`, `duration_seconds`, `resolution`, `aspect_ratio`, `wait_seconds`, `still_n`, `audio`.
- `wait_seconds` 200, `still_n` 1, `duration_seconds` 15 — all positive numerics, so none of the three numeric guards trip.
- `aspect_ratio` is `9:16` on all 601, which is what `prep_grok_video_start` requires. `resolution` `1080p` means 1080 × 1920 — but it is a label, not a guarantee. `ffprobe` the clip.
- `audio` is `FALSE` on all 601. Nothing reads it — see **Audio** above — but the column has to be non-blank or `pull_sheet_row` refuses to run.
- 23 compounds, no collisions between the sheet's own names.

Re-run with `python3 marketing/scripts/audit_wellness_sheet.py`.

---

## 10ml vial shape — same lock as Sheet 9

Salvatore, 2026-09-17: apply the BPC-157 10mg catalog vial to this tab the same way as `Vid_gen_lab_scenes`. **577 10ml rows.** The 24 Cagrilintide rows that still say `This is the 5ml multi-dose vial` are untouched.

Numbers live on `material_detail`, `hero_style`, and `video_prompt` (helix size is on `video_prompt` only; `still_edit_prompt` on this tab is the short label lock and is not part of this pass):

- H = **2.36 ×** body width
- straight body = **1.56 ×** body width
- helix = **small**, one fifth of the label, 1.7× as tall as it is wide

FORBIDDEN: tall / slim / test-tube / ampoule, height over 2.4× body width, oversized helix.

Spec + apply script: `lab-vial-10ml-visual-spec.md`, `scripts/apply_measured_10ml_vial_spec.py --sheet wellness`.

---

## One-shot sheet overlay

`overlay_landscape_sheet_params` writes `still_edit_prompt`, `wait_seconds`, `audio`, `still_n` onto existing rows (does not touch `times_used`). Archive after one successful Execute.
