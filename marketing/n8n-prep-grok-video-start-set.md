# `prep_grok_video_start` (Edit Fields) — sheets only

```text
save_edited_still_url → **prep_grok_video_start** → grok_video_start
```

No hardcoded motion / model / duration. All from Sheet via `map_sheet_fields` / `pick_creation`.

| Setting | Value |
|---|---|
| Type | **Edit Fields** |
| Name | `prep_grok_video_start` |
| Include Other Input Fields | **ON** |

| Name | fx | Value |
|---|---|---|
| `still_url` | ON | `={{ $json.still_url }}` |
| `grok_video_body_json` | ON | below |

```text
={{ JSON.stringify({ model: $json.model_video || $('map_sheet_fields').item.json.model_video, prompt: $json.video_motion_prompt || $('map_sheet_fields').item.json.video_motion_prompt, image: { url: $json.still_url }, duration: Number($json.duration_seconds || $('map_sheet_fields').item.json.duration_seconds), resolution: $json.resolution || $('map_sheet_fields').item.json.resolution }) }}
```

**Check:** `prompt` inside JSON matches today’s Sheet `video_motion_prompt` (unique camera), not a fixed push-in.

Then `grok_video_start` JSON (fx ON): `={{ $json.grok_video_body_json }}`

Full wire: `n8n-sheets-only-vid-gen.md`
