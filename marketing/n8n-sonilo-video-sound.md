# Sonilo video-to-sound (music + SFX)

One call scores the joined ~80s MOTS-C reel: synced sound effects plus a dynamic music bed. No ElevenLabs. No Mirelo-only SFX. No Kling 20s cap. No Creatomate mux.

```text
joined MP4 (Sheet 18 join_url or audio_source_url)
  → Sonilo video-to-video-sound
  → muxed MP4 with music + SFX (audio_video_url)
```

Subjects stay the film catalog. Every creative field comes from the sheet.

---

## Why Sonilo

| Tool | What it returns | Fit |
|---|---|---|
| **Sonilo `video-to-sound`** | One mixed track: music + synced SFX | **Use this** |
| Sonilo `video-to-video-sound` | Same mix, already muxed into the picture | **Default for the trilogy** |
| Mirelo `mirelo-ai/sfx-v1/video-to-audio` | SFX only | Skip |
| ElevenLabs video-to-music | Music only | Skip |
| Kling video-to-audio | Music + SFX, **20s cap** | Too short |
| Fal Sonilo v1.1 | Music **or** SFX as separate models | Not one call |
| Segmind `sonilo-video-to-audio` | Same model, `sound_type=music_and_sfx` | Same job, different host |

Runtime host is **`https://api.sonilo.com/v1`**. Docs on platform.sonilo.com are read-only. Max source length is **180s** — the ~80s trilogy fits.

Auth: `Authorization: Bearer sk_…`. n8n credential **Custom Auth (templated)** named `Sonilo`:

```json
{ "headers": { "Authorization": "Bearer {{api_key}}" } }
```

Paste the Sonilo key as `api_key` (no `Bearer ` prefix). Create a key at [platform.sonilo.com](https://platform.sonilo.com/dashboard/api-keys). Attach it on `sonilo_start` and `sonilo_poll`. This hop will not invent a key.

---

## API

Docs: [Video to Sound](https://platform.sonilo.com/docs/api/video-to-sound) · [Video to Video Sound](https://platform.sonilo.com/docs/api/video-to-video-sound) · [Get Task](https://platform.sonilo.com/docs/api/get-task)

```text
POST https://api.sonilo.com/v1/video-to-video-sound   (multipart)
  video_url
  music_prompt
  sfx_prompt

202 { task_id, status: processing }

GET  https://api.sonilo.com/v1/tasks/{task_id}
  status = processing | succeeded | failed
  succeeded → output_url (mp4) + music / sfx stems
```

Audio-only (no mux): `POST /v1/video-to-sound` + sheet `output_mode=audio`. Same prompts. Returns mixed audio under `output_url`.

`sound_type=music_and_sfx` is the Segmind/fal switch for the same model. Native Sonilo does not take that field — `video-to-sound` **is** music + SFX. The sheet still stores `sound_type=music_and_sfx` so the hop can refuse anything else.

---

## Sheet columns (overlay onto `18-motsc-film-stills`)

Canonical CSV: `marketing/sheets/21-sonilo-audio.csv`.

| Column | Who writes it | Notes |
|---|---|---|
| `reel_id` | overlay | `MOTSC-FILM-01` |
| `audio_host` | overlay | `sonilo` only on this hop |
| `sound_type` | overlay | `music_and_sfx` |
| `output_mode` | overlay | `muxed_video` (default) or `audio` |
| `audio_endpoint` | overlay | `https://api.sonilo.com/v1/video-to-video-sound` |
| `audio_poll_base` | overlay | `https://api.sonilo.com/v1/tasks` |
| `music_prompt` | overlay / you | e.g. cinematic sci-fi, tense then triumphant |
| `sfx_prompt` | overlay / you | e.g. match the on-screen action. |
| `sonilo_wait_seconds` | overlay | seconds between polls |
| `sonilo_max_polls` | overlay | stop after this many polls |
| `output_format` | overlay | `wav` (audio mode; ignored on mux) |
| `ducking` | overlay | `false` — generated bed only |
| `preserve_speech` | overlay | `false` |
| `keep_original_sound` | overlay | `false` |
| `audio_source_url` | you | optional public MP4 if `join_url` is empty |
| `join_url` | `film_vace_join` | preferred source video |
| `audio_url` | `film_sonilo_sound` | mixed audio (audio mode) |
| `audio_video_url` | `film_sonilo_sound` | muxed mp4 (default) |
| `music_stem_url` | `film_sonilo_sound` | music stem if Sonilo returns one |
| `sfx_stem_url` | `film_sonilo_sound` | SFX stem if Sonilo returns one |
| `audio_status` | `film_sonilo_sound` | `scored` |
| `sonilo_task_id` | `film_sonilo_sound` | async task id |

`video_url` stays the per-clip I2V output. Sonilo reads **`join_url`**, then **`audio_source_url`**. It will not score a single clip.

If a required cell is empty, the hop fails. It does not invent a prompt.

---

## Workflows

### `overlay_film_sonilo` (unpublished)

https://stockjohnson.app.n8n.cloud/workflow/G4n2WmX68Uy1EMyX

Writes the columns above. Does not touch `picked_url` / `video_url` / `join_url`. Ran once (exec **2008**).

### `film_sonilo_sound` (unpublished)

https://stockjohnson.app.n8n.cloud/workflow/AKAyvhKUFNefR02Y

```text
manual_trigger
  → get_film_stills
  → pick_sonilo_reel
  → prep_sonilo_start
  → sonilo_start
  → wait_sonilo
  → sonilo_poll
  → parse_sonilo
  → if_sonilo_ready
       true  → save_sonilo_url → sheets_update_sonilo
       false → wait_sonilo   (loop)
```

One Execute = one reel. Attach the Sonilo credential first. Need a public `join_url` (or `audio_source_url`). Do not Publish until a dry run succeeds.

---

## Node wires

### overlay — `overlay_film_sonilo`

**Before → this → After:** `get_film_stills` → **overlay_film_sonilo** → `sheets_update_sonilo`

### overlay — `sheets_update_sonilo`

**Before → this → After:** `overlay_film_sonilo` → **sheets_update_sonilo** → (end)

Match `still_id`. Extra columns insert.

### sound — `pick_sonilo_reel`

**Before → this → After:** `get_film_stills` → **pick_sonilo_reel** → `prep_sonilo_start`

Fails without `music_prompt`, `sfx_prompt`, `sound_type=music_and_sfx`, `audio_host=sonilo`, and an https `join_url` or `audio_source_url`.

### sound — `prep_sonilo_start`

**Before → this → After:** `pick_sonilo_reel` → **prep_sonilo_start** → `sonilo_start`

Maps sheet fields only.

### sound — `sonilo_start`

**Before → this → After:** `prep_sonilo_start` → **sonilo_start** → `wait_sonilo`

| Field | Value |
|---|---|
| Method | POST |
| URL | `={{ $json.audio_endpoint }}` |
| Auth | generic → templated `Sonilo` |
| Body | multipart `video_url` / `music_prompt` / `sfx_prompt` from the sheet |

### sound — `wait_sonilo`

**Before → this → After:** `sonilo_start` *or* `if_sonilo_ready` (false) → **wait_sonilo** → `sonilo_poll`

`amount` = sheet `sonilo_wait_seconds`.

### sound — `sonilo_poll`

**Before → this → After:** `wait_sonilo` → **sonilo_poll** → `parse_sonilo`

GET `={{ audio_poll_base }}/{{ task_id }}`.

### sound — `parse_sonilo`

**Before → this → After:** `sonilo_poll` → **parse_sonilo** → `if_sonilo_ready`

`succeeded` → `ready=true` + `output_url`. `processing` → `ready=false` and loop. `failed` throws.

### sound — `if_sonilo_ready`

**Before → this → After:** `parse_sonilo` → **if_sonilo_ready** → `save_sonilo_url` (true) / `wait_sonilo` (false)

### sound — `save_sonilo_url`

**Before → this → After:** `if_sonilo_ready` (true) → **save_sonilo_url** → `sheets_update_sonilo`

Writes the muxed URL onto every still in the reel.

### sound — `sheets_update_sonilo`

**Before → this → After:** `save_sonilo_url` → **sheets_update_sonilo** → (end)

---

## Run order

1. Finish I2V so all 25 clips have `video_url`.
2. Run `film_vace_join` (or paste a public joined MP4 into `audio_source_url`).
3. Run `overlay_film_sonilo` once.
4. Attach the Sonilo credential.
5. Execute `film_sonilo_sound`.
6. Play `audio_video_url`.

Helpers: `n8n-code-overlay-film-sonilo.js`, `n8n-code-pick-sonilo-reel.js`, `n8n-code-prep-sonilo-start.js`, `n8n-code-parse-sonilo.js`, `n8n-code-save-sonilo-url.js`.
