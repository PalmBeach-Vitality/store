# OpenRouter video (replaces fal.ai)

Fal nodes are gone. Kling, Seedance, and Veo I2V / T2V go through OpenRouter’s async video API.

**Credential (one time):** n8n → Credentials → **Custom Auth (templated)** named `OpenRouter`

Template:

```json
{ "headers": { "Authorization": "Bearer {{api_key}}" } }
```

Set `api_key` to the OpenRouter key (no `Bearer ` prefix — the template adds it).

Get a key: [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)

Attach that credential on every `openrouter_*` HTTP Request node (and on `openrouter_video_probe`).

Probe (lists video models once the key is attached): https://stockjohnson.app.n8n.cloud/workflow/56Syu5m8DIZl6RZA

---

## API (same for every model)

```text
POST https://openrouter.ai/api/v1/videos
  → { id, polling_url, status: pending }

Wait (sheet wait_seconds)

GET  https://openrouter.ai/api/v1/videos/{id}
  → status completed + unsigned_urls[0]
```

Image-to-video body (sheets-only fields):

```json
{
  "model": "<sheet model_video>",
  "prompt": "<sheet motion / prompt>",
  "duration": 15,
  "resolution": "720p",
  "aspect_ratio": "9:16",
  "generate_audio": false,
  "frame_images": [
    {
      "type": "image_url",
      "image_url": { "url": "<still https>" },
      "frame_type": "first_frame"
    }
  ]
}
```

Text-to-video omits `frame_images`.

---

## Model slugs (sheet `model_video`)

| Provider | OpenRouter slug | Duration | Resolution on OpenRouter |
|---|---|---|---|
| Kling v3 Pro | `kwaivgi/kling-v3.0-pro` | 3–15 | **720p only** |
| Seedance 2.5 | `bytedance/seedance-2.5` | 4–30 | **480p / 720p** |
| Veo 3.1 | `google/veo-3.1` | 4 / 6 / 8 | 720p / 1080p |

Kling Pro and Seedance 2.5 will **400** if the sheet still says `1080p`. Overlay writes `720p` for those rows.

---

## Workflows

| Workflow | Old Fal node | New wire |
|---|---|---|
| `peptide_molecule_vid_gen` | `fal_i2v_generate` + `fal_extract_last_frame` + `fal_i2v_extend` | OpenRouter hop 1 → Creatomate last-frame snapshot → OpenRouter hop 2 → Creatomate 30s concat |
| `film_i2v_kling` | `fal_i2v_generate` | `prep_openrouter_i2v` → start → wait → poll → save |
| `film_i2v_seedance` | `fal_i2v_generate` | same |
| `film_i2v_veo` | `fal_i2v_generate` | same |
| `seedance_25_vid_gen` | `fal_seedance_generate` | `prep_openrouter_t2v` → start → wait → poll → save |

Last-frame extract uses Creatomate (`output_format: jpg`, `snapshot_time: duration - 0.1`). No fal ffmpeg.

---

## Sheets

- **13-chem-breakdown-54:** `model_video=kwaivgi/kling-v3.0-pro`, `resolution=720p`
- **18-motsc-film-stills:** run `overlay_film_i2v_stack` (OpenRouter slugs + `https://openrouter.ai/api/v1/videos`)
- **17-seedance-25-t2v:** `model_video=bytedance/seedance-2.5`, `resolution=720p`

Do not leave `fal-ai/...` in `model_video`. Prep nodes throw if they see a fal slug.

---

## After attach

1. Paste the OpenRouter key into the `OpenRouter` Header Auth credential.
2. Execute `overlay_film_i2v_stack` so Sheet 18 matches.
3. Test `peptide_molecule_vid_gen` with **Execute workflow** (unpublished).
