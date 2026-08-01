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
  prompt: 'Slow cinematic camera motion around this Palm Beach Vitality laboratory research catalog product, photoreal, keep the subject sharp and unchanged, no people, no hands, no needles. For laboratory research use only. Not for human use or consumption.',
  image: { url: $json.still_url },
  duration: 8,
  aspect_ratio: '9:16',
  resolution: '720p'
}) }}
```

In the node’s request preview, body must show `"prompt": "Slow cinematic..."` — not `{ "": "" }`.

**Check:** response includes `request_id` (async job id). Status is not a finished URL yet.

Reply **`node 3 ok`** + `request_id`.

---

## Node 4 — `wait_video`

**Type:** Wait  
**After:** `grok_video_start` **or** false from `if_video_ready`  
**Before:** `grok_video_poll`  

Duration: **60** seconds (tune later).  
**Must be enabled** (not deactivated).

Reply **`node 4 ok`**.

---

## Node 5 — `grok_video_poll`

**Type:** HTTP Request  
**After:** `wait_video`  
**Before:** `if_video_ready`

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://api.x.ai/v1/videos/' + ($('grok_video_start').first().json.request_id) }}` |
| Authentication | same xAI Header Auth |
| Send Body | OFF |

Preview URL must start with `https://` (no leading `=`).

**Check:** JSON has `status` (`pending` / `done` / `failed`, naming may vary — use whatever you see).

Reply **`node 5 ok`** + the `status` value you see.

---

## Node 6 — `if_video_ready`

**Type:** IF  
**After:** `grok_video_poll`

**String condition:**
- Value 1: `={{ $json.status }}`
- is equal to
- Value 2: `done`

(If your API returns `succeeded` instead, use that exact string.)

| Branch | Wire to |
|---|---|
| true | `save_video_url` |
| false | `wait_video` (loop) |

Reply **`node 6 ok`** when true fires once.

---

## Node 7 — `save_video_url`

**Type:** Edit Fields  
**After:** `if_video_ready` true  
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `video_url` | `={{ $json.video.url \|\| $json.url }}` |
| `grok_video_request_id` | `={{ $json.request_id \|\| $('grok_video_start').first().json.request_id }}` |
| `still_url` | `={{ $('save_still_url').first().json.still_url }}` |
| `creation_id` | `={{ $('save_still_url').first().json.creation_id }}` |
| `compound_id` | `={{ $('save_still_url').first().json.compound_id }}` |
| `created_at` | `={{ $now.toISO() }}` |

**Check:** open `video_url` — unique scene video for this creation.

Reply **`node 7 ok`**.

---

## Node 8 — Sheets (after video works)

Reuse your working update nodes:

- `sheets_update_reel` → compounds `video_url` match `compound_id`
- `sheets_update_creation` → `times_used` + `last_used_at` match `creation_id`

---

## Step 2 — Extend to ~45–60s (smooth)

After `save_video_url` has a ~15s `video_url`, add **3 extend blocks** (optional 4th).

Each block:
```text
grok_video_extend_N → wait_extend_N → grok_video_poll_extend_N → if_extend_N_ready
  true  → next extend or save_extended_url
  false → wait_extend_N
```

### `grok_video_extend_1` (HTTP Request)

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/extensions` |
| Auth | same xAI Header Auth |
| Send Body | ON |
| Body Content Type | **Raw** |
| Content Type | `application/json` |

Body (fx ON — one line, same style as video start):

```text
{{ JSON.stringify({model:'grok-imagine-video',prompt:'Continue the same Palm Beach Vitality laboratory research catalog scene with slow cinematic camera motion, same product, photoreal, keep subject sharp and unchanged, no people, no hands, no needles. For laboratory research use only. Not for human use or consumption.',video:{url:$json.video_url},duration:10}) }}
```

**Check:** `request_id` returned.

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
