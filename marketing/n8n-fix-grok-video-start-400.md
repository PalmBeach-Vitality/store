# Fix `grok_video_start` → “Bad request - please check your parameters”

**HTTP 400 is almost never the API key.** Bad keys return **401 Unauthorized**.

## Do this in n8n (exact)

### 1) Wire order

```text
grok_imagine_reel_still
  → save_still_url
  → prep_grok_video_start      ← paste marketing/n8n-code-prep-grok-video-start.js
  → grok_video_start
  → wait_video
```

### 2) `save_still_url` must expose a real URL

| Name | Value |
|---|---|
| `still_url` | `={{ $json.data[0].url }}` |

Open the node output → `still_url` must start with `https://`. If it’s empty/undefined, video start will 400.

### 3) Replace `prep_grok_video_start` code

Paste the latest `marketing/n8n-code-prep-grok-video-start.js`.

Run that node alone. Confirm output has:
- `still_url` = `https://…`
- `_debug_prompt_len` under ~700
- `grok_video_body_json` starts with `{"model":"grok-imagine-video-1.5","prompt":"Slow cinematic…`

### 4) Rebuild `grok_video_start` HTTP node (clean)

Delete the old node if the body is messy, then create fresh:

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Authentication | **Header Auth** credential that works on the **still** node |
| Send Headers | ON → `Content-Type` = `application/json` |
| Send Body | **ON** |
| Body Content Type | **Raw** |
| Content Type | `application/json` |
| Body (expression ON) | `={{ $json.grok_video_body_json }}` |

**Critical**
- Do **not** use “JSON / Using Fields Below” with empty name/value rows (that sends `{ "": "" }` → 400).
- Do **not** wrap again in `JSON.stringify(...)` if you already use `grok_video_body_json`.
- Header Auth value should be the **raw key only** (n8n adds `Bearer `). If you stored `Bearer xai-…` in the credential, you get `Bearer Bearer …` → fix credential.

### 5) Request preview must look like this

```json
{
  "model": "grok-imagine-video-1.5",
  "prompt": "Slow cinematic camera: …",
  "image": { "url": "https://…" },
  "duration": 15,
  "resolution": "1080p"
}
```

Success response: `{ "request_id": "…" }`.

## Quick isolation test

Temporarily put this **literal** Raw body (fx OFF) with a fresh still URL from the last still run:

```json
{
  "model": "grok-imagine-video-1.5",
  "prompt": "Slow push-in camera, keep the exact scene unchanged, no people.",
  "image": { "url": "PASTE_STILL_URL_HERE" },
  "duration": 15,
  "resolution": "1080p"
}
```

- If **literal works** → your expression/`still_url` wiring is the bug.
- If **literal also 400** → open the error JSON (`error.message` / `code`). Usually invalid/expired image URL or moderation.
- If **401** → API key / Header Auth credential.

## After it works

Re-import Sheet 9 so `video_motion_prompt` stays short (camera-only). Full scene stays in `video_prompt` for the still only.
