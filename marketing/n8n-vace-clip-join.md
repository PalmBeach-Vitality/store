# 25-clip join: VACE + OpenRouter bridges

WildCut is the *look* you want on story beats. It is **not** an API — [wildcut.ai](https://wildcut.ai) is an upload site (2–5 min per pair, no REST). n8n cannot call it.

**VACE Video Joiner** (WaveSpeed) is the join API. **OpenRouter first+last frame** is the WildCut-style cinematic bridge, using the OpenRouter video key you already have.

```text
25 muted clips (Sheet 18 video_url)
  → optional FLF2V bridges on seams marked flf2v
  → VACE batches of 2–4 clips
  → one joined MP4 (join_url)
  → later: ElevenLabs music/SFX + Creatomate mux
```

Subjects stay lab / film catalog only. No hardcoded prompts — `bridge_prompt`, `music_prompt`, and `sfx_prompt` come from the sheet.

---

## Why not WildCut in n8n

| | WildCut.ai | OpenRouter FLF2V | WaveSpeed VACE |
|---|---|---|---|
| What it does | Bridge from last frame → next first frame | Same (first_frame + last_frame) | AI transition join, 2–4 clips / call |
| REST API | No | Yes (`POST /api/v1/videos`) | Yes |
| 25 clips | 24 manual uploads | 24 jobs, then stitch | 8 batched calls |
| Cost (ballpark) | per-pair web pricing | Kling/Veo video rates | **$0.20 per join** → 24 seams ≈ **$4.80** |

Use **VACE for every seam** so the 25 clips become one file. Set `seam_mode=flf2v` and fill `bridge_prompt` on crash / handoff / warp (or any beat where a generated camera move matters). Those bridges drop into the VACE list as extra clips (`clip + bridge + clip`).

---

## API 1 — WaveSpeed VACE

Docs: [wavespeed.ai/docs/docs-api/wavespeed-ai/vace-video-joiner](https://wavespeed.ai/docs/docs-api/wavespeed-ai/vace-video-joiner)

```text
POST https://api.wavespeed.ai/api/v3/wavespeed-ai/vace-video-joiner
  { "videos": ["https://…/a.mp4", "https://…/b.mp4"] }   // 2–4 public URLs

GET  https://api.wavespeed.ai/api/v3/predictions/{id}/result
  → data.status = completed
  → data.outputs[0] = joined mp4
```

Auth: Bearer key. n8n credential **Custom Auth (templated)** named `WaveSpeed`:

```json
{ "headers": { "Authorization": "Bearer {{api_key}}" } }
```

Paste the WaveSpeed key as `api_key` (no `Bearer ` prefix). Get a key at [wavespeed.ai](https://wavespeed.ai). Attach it on `vace_start` and `vace_poll`.

25 clips batch as:

1. Join clips 1–4  
2. Join that result + clips 5–7  
3. Result + 8–10  
4. Result + 11–13  
5. Result + 14–16  
6. Result + 17–19  
7. Result + 20–22  
8. Result + 23–25  

URLs must be publicly fetchable (catbox / OpenRouter unsigned URL). Same aspect (9:16) on every clip.

---

## API 2 — OpenRouter FLF2V (WildCut-quality seams)

Same video API as I2V. Last frame of clip A = first_frame of the bridge. First frame of clip B = last_frame.

```json
{
  "model": "<sheet bridge_model>",
  "prompt": "<sheet bridge_prompt>",
  "duration": 5,
  "resolution": "720p",
  "aspect_ratio": "9:16",
  "generate_audio": false,
  "frame_images": [
    { "type": "image_url", "image_url": { "url": "<last frame of outgoing clip>" }, "frame_type": "first_frame" },
    { "type": "image_url", "image_url": { "url": "<first frame of incoming clip>" }, "frame_type": "last_frame" }
  ]
}
```

Frame stills: Creatomate snapshot (already used on molecule hop extend) — outgoing at `duration - 0.1`, incoming at `0.1`. Helper: `n8n-code-prep-flf2v-bridge.js`.

Default `bridge_model` on the overlay is `kwaivgi/kling-v3.0-pro` (720p). Use `google/veo-3.1` if you want 1080p bridges (4 / 6 / 8s only).

---

## API 3 — music / SFX (after the join)

OpenRouter audio is **speech + transcription only**. It does not generate beds.

Use the **ElevenLabs** credential already in n8n (`59AV301kmHyfitUo`):

| Job | Endpoint | Sheet field |
|---|---|---|
| Bed music | `POST https://api.elevenlabs.io/v1/music` (`music_length_ms` 3s–10 min) | `music_prompt` |
| One-shot SFX | `POST https://api.elevenlabs.io/v1/sound-generation` | `sfx_prompt` |

Then mux with Creatomate: stitched video on track 1, audio element on another track (`volume`, `audio_fade_in`, `audio_fade_out`). Do not invent prompts — leave those cells empty until you write them. The join workflow does **not** call ElevenLabs yet.

---

## Sheet columns (overlay onto `18-motsc-film-stills`)

Canonical CSV: `marketing/sheets/19-film-join-25.csv` (same columns; import if you want a standalone tab).

| Column | Who writes it | Notes |
|---|---|---|
| `reel_id` | overlay | `MOTSC-FILM-01` |
| `clip_order` | overlay | 1–25 from `FILM-00N` |
| `seam_mode` | overlay / you | `vace` or `flf2v` (the seam *after* this clip) |
| `bridge_prompt` | you | Required when `seam_mode=flf2v` |
| `bridge_model` | overlay | OpenRouter slug |
| `bridge_duration` | overlay | seconds |
| `bridge_resolution` | overlay | `720p` for Kling |
| `join_wait_seconds` | overlay | poll wait per VACE batch |
| `music_prompt` | you | later ElevenLabs |
| `sfx_prompt` | you | later ElevenLabs |
| `join_url` | `film_vace_join` | final mp4 |
| `join_status` | `film_vace_join` | `joined` |

`video_url` stays the per-clip OpenRouter output. Join will not run until all 25 are `https://…`.

---

## Workflows

### `overlay_film_join_25` (unpublished)

https://stockjohnson.app.n8n.cloud/workflow/aHEDxqT4wrHIvqW8

`get_film_stills` → **overlay_film_join_25** → `sheets_update_join`

Writes the columns above. Does not touch `picked_url` / `video_url`. Ran once (exec **2002**).

### `film_vace_join` (unpublished)

https://stockjohnson.app.n8n.cloud/workflow/HQMiaknqC6ng0wtT

```text
manual_trigger
  → get_film_stills
  → pick_join_reel
  → prep_vace_join
  → vace_start
  → wait_vace
  → vace_poll
  → parse_vace_join
  → if_more_batches
       true  → prep_vace_join   (loop)
       false → save_join_url → sheets_update_join
```

One Execute = one reel (all 25 clips). Attach the WaveSpeed credential first. Do not Publish until a dry run succeeds.

---

## Node wires

### overlay — `overlay_film_join_25`

**Before → this → After:** `get_film_stills` → **overlay_film_join_25** → `sheets_update_join`

### overlay — `sheets_update_join`

**Before → this → After:** `overlay_film_join_25` → **sheets_update_join** → (end)

Match `still_id`. Extra columns insert.

### join — `pick_join_reel`

**Before → this → After:** `get_film_stills` → **pick_join_reel** → `prep_vace_join`

### join — `prep_vace_join`

**Before → this → After:** `pick_join_reel` *or* `if_more_batches` (true) → **prep_vace_join** → `vace_start`

### join — `vace_start`

**Before → this → After:** `prep_vace_join` → **vace_start** → `wait_vace`

| Field | Value |
|---|---|
| Method | POST |
| URL | `https://api.wavespeed.ai/api/v3/wavespeed-ai/vace-video-joiner` |
| Auth | generic → templated `WaveSpeed` |
| Body | JSON `={{ JSON.parse($json.vace_body_json) }}` |

### join — `wait_vace`

**Before → this → After:** `vace_start` → **wait_vace** → `vace_poll`

`amount` = `={{ Number($('prep_vace_join').first().json.join_wait_seconds) }}` seconds.

### join — `vace_poll`

**Before → this → After:** `wait_vace` → **vace_poll** → `parse_vace_join`

GET `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id || $json.id }}/result`  
Same WaveSpeed credential.

### join — `parse_vace_join`

**Before → this → After:** `vace_poll` → **parse_vace_join** → `if_more_batches`

### join — `if_more_batches`

**Before → this → After:** `parse_vace_join` → **if_more_batches** → `prep_vace_join` (true) / `save_join_url` (false)

### join — `save_join_url`

**Before → this → After:** `if_more_batches` (false) → **save_join_url** → `sheets_update_join`

### join — `sheets_update_join`

**Before → this → After:** `save_join_url` → **sheets_update_join** → (end)

Match `still_id`. Writes `join_url`, `join_status`.

---

## Helpers

- `n8n-code-overlay-film-join-25.js`
- `n8n-code-pick-join-reel.js`
- `n8n-code-prep-vace-join.js`
- `n8n-code-parse-vace-join.js`
- `n8n-code-save-join-url.js`
- `n8n-code-prep-flf2v-bridge.js` (FLF2V body only — wire after frame snapshots)
