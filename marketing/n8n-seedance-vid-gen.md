# Seedance video — Workflow A (replace Grok video)

**Goal:** Animate today’s Grok still with **ByteDance Seedance** (newest = **2.5**), then hand the MP4 to Creatomate / Buffer as usual.

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  

**Keep:** Grok still (`grok_imagine_reel_still`) for unique 9:16 lab frames.  
**Replace:** `prep_grok_video_start` → `grok_video_start` → poll with the Seedance nodes below.

---

## Status (as of 2026-08-23)

| Model | Product | Public API |
|---|---|---|
| **Seedance 2.5** | Live | Live on **fal.ai** (`bytedance/seedance-2.5/text-to-video`, I2V, reference-to-video). Native duration **4–30s**. |
| **Seedance 2.0** | Live | Live on **fal.ai** + BytePlus ModelArk |

Standalone hyperrealistic T2V (sheets-only, no Grok still): **`seedance_25_vid_gen`** — see `n8n-seedance-25-vid-gen.md`. This file remains the older I2V-from-Grok-still wire.

---

## Wire

```text
pick_creation
  → grok_imagine_reel_still
  → save_still_url
  → prep_seedance_video_start     ← NEW (Code)
  → seedance_video_start          ← NEW (HTTP)  replaces grok_video_start
  → wait_seedance                 ← NEW (Wait)  ~180–300s
  → seedance_video_status         ← NEW (HTTP)
  → seedance_video_result         ← NEW (HTTP)  fal only — fetch output
  → save_video_url
  → sheets_update_creation
```

Mute Seedance audio (`generate_audio: false`) — soundtrack is added manually after Creatomate.

---

## Route A (recommended) — fal.ai Seedance I2V

Easiest for n8n. Live today as **2.0**; swap path to **2.5** when fal lists it.

### Credential

n8n → Credentials → **Header Auth**:

| Field | Value |
|---|---|
| Name | `Fal API` |
| Header Name | `Authorization` |
| Value | `Key YOUR_FAL_KEY` |

Get key: [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)  
**Note:** fal uses `Key …`, not `Bearer …`.

### 1) `prep_seedance_video_start`

**Type:** Code · Run Once for All Items  
**After:** `save_still_url`  
**Before:** `seedance_video_start`

Paste: `marketing/n8n-code-prep-seedance-video-start.js`

**Check:** output has `still_url` (https), short `video_motion_prompt`, and `seedance_fal_body_json`.

### 2) `seedance_video_start`

**Type:** HTTP Request  
**After:** `prep_seedance_video_start`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://queue.fal.run/bytedance/seedance-2.0/image-to-video` |
| Authentication | Header Auth → `Fal API` |
| Send Body | ON · **Raw** · `application/json` |
| Body (fx ON) | `={{ $('prep_seedance_video_start').first().json.seedance_fal_body_json }}` |

**When Seedance 2.5 lands on fal**, change URL only to:

```text
https://queue.fal.run/bytedance/seedance-2.5/image-to-video
```

(confirm exact path in fal playground — may be `seedance-2.5` or similar.)

**Check:** response has `request_id` and `status_url` / `response_url`.

### 3) `wait_seedance`

**Type:** Wait · **180** seconds (15s @ 1080p; bump to **300** if still queued).

### 4) `seedance_video_status`

**Type:** HTTP Request

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://queue.fal.run/bytedance/seedance-2.0/image-to-video/requests/' + $('seedance_video_start').first().json.request_id + '/status' }}` |
| Authentication | `Fal API` |
| Send Body | OFF |

**Check:** `status` = `COMPLETED`. If `IN_QUEUE` / `IN_PROGRESS`, wait longer and re-run this node (or loop).

### 5) `seedance_video_result`

**Type:** HTTP Request · only after status is `COMPLETED`

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://queue.fal.run/bytedance/seedance-2.0/image-to-video/requests/' + $('seedance_video_start').first().json.request_id }}` |
| Authentication | `Fal API` |

**Check:** `$json.video.url` is an `https://` MP4.

### 6) `save_video_url`

| Name | Value |
|---|---|
| `video_url` | `={{ $json.video.url }}` |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `still_url` | `={{ $('save_still_url').first().json.still_url }}` |
| `seedance_request_id` | `={{ $('seedance_video_start').first().json.request_id }}` |
| `video_provider` | `seedance` |

Then catbox upload → Creatomate package as before (never feed fal/xAI expiring URLs straight into Creatomate if they 403 — catbox first).

---

## Route B — BytePlus ModelArk (official Seedance 2.5 host)

Use when your BytePlus console shows **Seedance 2.5** activated (expected ~**Aug 7, 2026**). Same async task pattern as Seedance 2.0.

### Credential

| Field | Value |
|---|---|
| Name | `BytePlus Ark` |
| Header Name | `Authorization` |
| Value | `Bearer YOUR_ARK_API_KEY` |

Base: `https://ark.ap-southeast.bytepluses.com/api/v3`

### Model IDs

| When | Model |
|---|---|
| Live today (2.0) | `dreamina-seedance-2-0-260128` |
| 2.5 (after console lists it) | Use the **exact ID from your ModelArk catalog** (do not invent a `dreamina-seedance-2-5-…` string from blogs) |

### Start body (Raw + fx)

`prep_seedance_video_start` also outputs `seedance_ark_body_json`.

```text
POST {{base}}/contents/generations/tasks
Body: ={{ $('prep_seedance_video_start').first().json.seedance_ark_body_json }}
```

### Poll

```text
GET {{base}}/contents/generations/tasks/{{ $json.id }}
```

**Succeeded:** read `content.video_url` (or nested video URL in the task payload). Copy to catbox quickly — delivery URLs expire.

---

## Defaults for PBVita reels

| Param | Value | Why |
|---|---|---|
| Aspect | `9:16` | IG reel |
| Duration | `15` | Matches current Creatomate / Grok slot (2.5 can go to **30** later) |
| Resolution | `1080p` | Creatomate package quality |
| `generate_audio` | `false` | Mute — music added manually |
| First frame | Grok `still_url` | Unique lab scene per day |

---

## Smoke test

1. Run through `prep_seedance_video_start` — still URL https, motion &lt; 700 chars  
2. `seedance_video_start` → `request_id`  
3. After wait → status `COMPLETED` → `video.url` plays (muted lab motion, no people/needles)  
4. Upload MP4 to **catbox** → paste into Creatomate WF B  

Reply **`seedance ok`** + MP4 URL when green.

---

## Related

- Still + old Grok video nodes: `n8n-build-grok-imagine-video-nodes.md`  
- Prep code: `n8n-code-prep-seedance-video-start.js`  
- Creatomate package: `n8n-creatomate-package-workflow.md`  
