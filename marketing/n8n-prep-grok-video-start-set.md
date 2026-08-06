# `prep_grok_video_start` as Edit Fields (no Code)

Same job as the Code node, but using **Edit Fields** + a JSON string — the pattern that already worked for `still_edit_body_json`.

```text
save_edited_still_url → **prep_grok_video_start** → grok_video_start
```

---

## Node — `prep_grok_video_start`

| Setting | Value |
|---|---|
| Type | **Edit Fields** (Set) |
| Name | `prep_grok_video_start` |
| Include Other Input Fields | **ON** |

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.still_url }}` |
| `grok_video_body_json` | **ON** | paste expression below |

**`grok_video_body_json` expression (fx ON):**

```text
={{ JSON.stringify({ model: 'grok-imagine-video-1.5', prompt: 'Slow cinematic camera: gentle push-in. Keep the exact same scene, materials, and lighting from the still. No orbit. No new objects. No people, hands, faces, needles, watermarks, or burn-in.', image: { url: $json.still_url }, duration: 15, resolution: '1080p' }) }}
```

**Check:** output has `still_url` (https) and `grok_video_body_json` starting with `{`.

---

## Next — `grok_video_start`

```text
prep_grok_video_start → **grok_video_start** → wait_video
```

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Auth | same xAI credential |
| Send Body | **ON** |
| Body Content Type | **JSON** |
| JSON (fx **ON**) | `={{ $json.grok_video_body_json }}` |

Same pattern as edit: prep builds `*_body_json` → HTTP node sends `$json.*_body_json`.
