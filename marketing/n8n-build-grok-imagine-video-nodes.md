# Build Grok Imagine → video nodes (new, one at a time)

**Goal:** unique daily MP4 from `pick_creation.video_prompt`  
**Workflow:** `PBVita — Reel Studio`  
**Wire after:** `pick_creation`  
**Auth:** same xAI Header Auth as `GROK_API` (`Authorization: Bearer …`)

**Subject library:** `get_reel_creations` must read tab **`9-lab-item-creations-500`** (500 real lab items only). Do not use abstract scene tab `7` for Imagine. See `n8n-lab-items-500.md`.

All new n8n field names: **lowercase**.

```text
pick_creation
  → grok_imagine_reel_still
  → save_still_url
  → grok_video_start
  → wait_video
  → grok_video_poll
  → if_video_ready
       false → wait_video
       true  → save_video_url
            → sheets_update_reel
            → sheets_update_creation
```

Do **not** put Creatomate on this path until unique Grok MP4s work.

---

## Node 1 — `grok_imagine_reel_still`

**Type:** HTTP Request  
**After:** `pick_creation`  
**Before:** `save_still_url`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/images/generations` |
| Authentication | Header Auth → same xAI credential as `GROK_API` |
| Send Body | ON · JSON |

**Quality (required):** always highest — model `grok-imagine-image-quality` + `resolution: '2k'`. Never `grok-imagine-image` (fast) or `1k` for production.

**Body** (fx / Expression):

```text
={{ JSON.stringify({
  model: 'grok-imagine-image-quality',
  prompt: $json.video_prompt,
  n: 1,
  aspect_ratio: '9:16',
  resolution: '2k'
}) }}
```

**Check:** output has an image URL (usually `$json.data[0].url`). Open it — must match today’s scene, not the Creatomate template.

Reply **`node 1 ok`** with that image URL (or error).

---

## Node 2 — `save_still_url`

**Type:** Edit Fields  
**After:** `grok_imagine_reel_still`  
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `still_url` | `={{ $json.data[0].url }}` |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `video_prompt` | `={{ $('pick_creation').first().json.video_prompt }}` |
| `video_motion_prompt` | `={{ $('pick_creation').first().json.video_motion_prompt }}` |
| `camera_move` | `={{ $('pick_creation').first().json.camera_move }}` |
| `scene_brief` | `={{ $('pick_creation').first().json.scene_brief }}` |
| `compound_id` | `={{ $('Get row(s) in sheet').first().json.compound_id }}` |

**Check:** `still_url` is a real `https://` link (not undefined).

Reply **`node 2 ok`**.

---

## Node 3 — `grok_video_start`

**Type:** HTTP Request  
**After:** `save_still_url`  
**Before:** `wait_video`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Authentication | same xAI Header Auth |
| Send Body | ON · JSON |

**Body settings (critical — avoid empty `{ "": "" }` body):**
1. Send Body: **ON**
2. Body Content Type: **Raw**
3. Content Type: `application/json`
4. Delete any leftover Body Parameter rows (empty name/value causes `{ "": "" }`)
5. Body (fx ON):

```text
={{ JSON.stringify({
  model: 'grok-imagine-video-1.5',
  prompt: $('pick_creation').first().json.video_motion_prompt,
  image: { url: $json.still_url },
  duration: 15,
  aspect_ratio: '9:16',
  resolution: '1080p'
}) }}
```

**Duration (required):** always **`15`** seconds for `grok_video_start` (minimum for a proper Creatomate loop bed). Never `8` for production.  
**Resolution (required):** always **`1080p`** for `grok_video_start` (and extends). Never `720p` for production.

**Critical:** do **not** hardcode “slow cinematic camera motion around…”. That made every run orbit the same way.  
Each creation row has a unique `video_motion_prompt` (from `camera_move` in `9-lab-item-creations-500`).

In the node’s request preview, body must show a long unique `"prompt"` starting with `Photoreal vertical…` — not `{ "": "" }` and not a fixed orbit sentence.

**Check:** response includes `request_id` (async job id). Status is not a finished URL yet.

Reply **`node 3 ok`** + `request_id`.

---

## Node 4 — `wait_video`

**Type:** Wait  
**After:** `grok_video_start`  
**Before:** `grok_video_poll`  

Duration: **200** seconds (15s @ 1080p often needs this; no IF poll-loop required).  
**Must be enabled** (not deactivated).

```text
grok_video_start → wait_video (200s) → grok_video_poll → save_video_url → sheets_update_creation
```

---

## Node 5 — `grok_video_poll`

**Type:** HTTP Request  
**After:** `wait_video`  
**Before:** `save_video_url`

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://api.x.ai/v1/videos/' + ($('grok_video_start').first().json.request_id) }}` |
| Authentication | same xAI Header Auth |
| Send Body | OFF |

Preview URL must start with `https://` (no leading `=`).

**Check:** JSON has `status` = `done` (or `succeeded`) and a video URL under `video.url` or `url`.  
If still `pending`, increase wait (e.g. 240s) and re-run — do not save yet.

---

## Node 6 — `save_video_url`

**Type:** Edit Fields  
**After:** `grok_video_poll`  
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `video_url` | `={{ $json.video.url \|\| $json.url }}` |
| `grok_video_request_id` | `={{ $json.request_id \|\| $('grok_video_start').first().json.request_id }}` |
| `still_url` | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `row_number` | `={{ $('pick_creation').first().json.row_number }}` |
| `creation_times_used` | `={{ $('pick_creation').first().json.creation_times_used }}` |
| `created_at` | `={{ $now.toISO() }}` |

**Check:** `video_url` is a real `https://vidgen...` link. If empty, poll was still pending — raise wait.

---

## Node 7 — Sheets (after `save_video_url` has a URL)

`sheets_update_creation` → lab tab `9-lab-item-creations-500`:

| Setting | Value |
|---|---|
| Operation | Update |
| Document | **By ID** (same as `get_reel_creations`) |
| Sheet | `9-lab-item-creations-500` |
| Column to Match On | **`creation_id`** (not `row_number`) |
| Value to Match | `={{ $('pick_creation').first().json.creation_id }}` |
| `times_used` | `={{ Number($('pick_creation').first().json.creation_times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |

Without this writeback, `pick_creation` always returns the same least-used row.

---

## Step 2 — Extend to ~45–60s (smooth)

After `save_video_url` has a ~15s `video_url`, add **3 extend blocks** (optional 4th).

Each block:
```text
grok_video_extend_N → wait_extend_N → grok_video_poll_extend_N → if_extend_N_ready
  true  → next extend or save_extended_url
  false → wait_extend_N
```

### `prep_extend_1` (Code) — required before extend

**After:** `save_video_url` (or `grok_video_poll` if IF is bypassed)  
Mode: **Run Once for Each Item**

```javascript
const fromSave = $('save_video_url').first()?.json || {};
const fromPoll = $('grok_video_poll').first()?.json || {};
const url =
  $json.video_url ||
  $json.video?.url ||
  fromSave.video_url ||
  fromPoll.video?.url ||
  '';

if (!url || !String(url).startsWith('http')) {
  throw new Error(
    'prep_extend_1: missing video url. save_video_url keys=' +
      Object.keys(fromSave).join(',') +
      ' poll keys=' +
      Object.keys(fromPoll).join(',')
  );
}

return [{
  json: {
    video_url: url,
    creation_id: fromSave.creation_id || $json.creation_id || '',
    compound_id: fromSave.compound_id || $json.compound_id || '',
    still_url: fromSave.still_url || $json.still_url || '',
  },
}];
```

**Check:** output `video_url` is a real `https://vidgen.x.ai/...` link before you call extend.

### `grok_video_extend_1` (HTTP Request)

**After:** `prep_extend_1`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/extensions` |
| Auth | same xAI Header Auth |
| Send Body | ON |
| Body Content Type | **Raw** |
| Content Type | `application/json` |

Body (fx ON — one line):

```text
{{ JSON.stringify({model:'grok-imagine-video',prompt:'Continue the same Palm Beach Vitality laboratory research catalog scene with slow cinematic camera motion, same product, photoreal, keep subject sharp and unchanged, no fade out, no dissolve, no people, no hands, no needles. For laboratory research use only. Not for human use or consumption.',video:{url:$json.video_url},duration:10}) }}
```

**Check:** request preview includes `"url":"https://vidgen..."` and response has `request_id`.

> Extend model is `grok-imagine-video` (not `1.5`). Duration `10` = **added** seconds (~15+10 ≈ 25s total after first extend).

### Poll / IF (reuse pattern)

- Wait: **60s**, enabled  
- Poll GET: `{{ 'https://api.x.ai/v1/videos/' + $('grok_video_extend_1').first().json.request_id }}`  
- IF: `$json.status` equals `done`  
- On true → Edit Fields `save_extend_1_url`:  
  `video_url` = `{{ $json.video.url || $json.url }}`  
  (carry `creation_id`, `compound_id`, `still_url` with `.first()`)

### Repeat

- `grok_video_extend_2` uses `$json.video_url` from `save_extend_1_url`  
- `grok_video_extend_3` from extend 2 → ~45s  
- optional extend 4 → ~55s  

Then `save_extended_url` (final) → Creatomate later.

## Disconnect Creatomate until extended URL works

Leave Creatomate disconnected until you have one ~45–60s `vidgen.x.ai` URL.
