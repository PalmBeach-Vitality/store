# PBVita — Idea → Video (Grok, simple)

**Owner:** Salvatore
**Workflow name:** `PBVita — Idea to Video`
**Goal:** Type one **idea** → Grok returns one **1080p, 15s** MP4. Nothing else.
**Auth:** same xAI **Header Auth** credential as `GROK_API` (`Authorization: Bearer …`).

> This is the standalone simple version. No lab-item library, no Creatomate, no extends.
> One generate call = **15s** (Grok's single-generation max), so we never need an extend here.

All new n8n field names are **lowercase** (house rule). xAI API keys stay exactly as xAI defines them.

---

## Output spec (locked)

| Setting | Value | Notes |
|---|---|---|
| Resolution | `1080p` | xAI string is `'1080p'` (not `1080`) |
| Duration | `15` | seconds; single generate, no extend |
| Aspect ratio | `16:9` **or** `9:16` | **Decide this** — see note below |
| Model | `grok-imagine-video-1.5` | same model the reel workflow uses |

**Aspect ratio decision (only real choice to make):** "1080" is a height, so it can mean landscape `16:9` (1920×1080) or vertical `9:16` (1080×1920). Your reel studio is all `9:16`. For a generic idea-to-clip tool I default the doc to `16:9`; flip the one `aspect_ratio` value to `9:16` if these clips are for Reels/TikTok. It's a single field, changeable per run.

---

## The whole flow (7 nodes)

```text
idea_form (Form Trigger — field: idea)
  → build_prompt        (Edit Fields — wrap idea + lock 1080p/15s)
  → grok_video_start    (HTTP POST — text→video)
  → wait_video          (Wait 60s)
  → grok_video_poll     (HTTP GET status)
  → if_video_ready      (IF status = done/succeeded)
       false → wait_video   (loop)
       true  → save_video_url  (Edit Fields — final MP4 URL)
```

That's it. Optional add-ons (download / Sheet log / form response) are at the bottom.

---

## Node 1 — `idea_form` (Form Trigger)

**Type:** n8n Form Trigger (gives you a hosted URL where you type the idea and hit submit).

| Field label | Field name | Required |
|---|---|---|
| `Idea` | `idea` | yes |

**Simpler alternative:** if you'd rather not use a form, replace this with **Manual Trigger → Edit Fields** node holding a single field `idea` you edit before each run. Everything downstream is identical.

---

## Node 2 — `build_prompt` (Edit Fields)

**After:** `idea_form`
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `video_prompt` | `={{ $json.idea }}, cinematic, photoreal, smooth camera motion, high detail, 8k, professional color grade` |
| `duration` | `15` |
| `resolution` | `1080p` |
| `aspect_ratio` | `16:9` |

**Why this node:** it turns a one-line idea into a fuller prompt and pins the output spec in one place. If you want the raw idea sent verbatim, set `video_prompt` = `={{ $json.idea }}` and drop the extra styling words.

**Optional brand-safety line** (append to `video_prompt` if these are PBVita clips): `, no people, no hands, no needles, laboratory research aesthetic. For laboratory research use only.`

---

## Node 3 — `grok_video_start` (HTTP Request)

**After:** `build_prompt`
**Before:** `wait_video`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Authentication | Header Auth → same xAI credential as `GROK_API` |
| Send Body | **ON** |
| Body Content Type | **Raw** |
| Content Type | `application/json` |

**Critical:** delete any empty Body Parameter rows first (an empty name/value sends `{ "": "" }` and the call fails).

**Body (fx / Expression):**

```text
={{ JSON.stringify({
  model: 'grok-imagine-video-1.5',
  prompt: $json.video_prompt,
  duration: $json.duration,
  aspect_ratio: $json.aspect_ratio,
  resolution: $json.resolution
}) }}
```

**Check:** request preview shows your real `"prompt": "…"` (not `{ "": "" }`), and the response returns a `request_id` (async job id — not a finished URL yet).

> **Text→video vs. still-first.** This sends the idea straight to video (no image). That is the simplest path and matches "feed an idea → video." If your xAI account requires an input image for `grok-imagine-video-1.5`, insert the 2-node still step from `n8n-build-grok-imagine-video-nodes.md` (`grok_imagine_reel_still` → `save_still_url`, then add `image: { url: $json.still_url }` to the body above). Try text-only first; only add the still if the API rejects the request.

---

## Node 4 — `wait_video` (Wait)

**After:** `grok_video_start` **or** the `false` branch of `if_video_ready`
**Before:** `grok_video_poll`

Duration: **60** seconds. Must be **enabled** (not deactivated).

---

## Node 5 — `grok_video_poll` (HTTP Request)

**After:** `wait_video`
**Before:** `if_video_ready`

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://api.x.ai/v1/videos/' + $('grok_video_start').first().json.request_id }}` |
| Authentication | same xAI Header Auth |
| Send Body | **OFF** |

Preview URL must start with `https://` (no leading `=`).

**Check:** JSON has a `status` field (`pending` / `done` / `failed`, or `succeeded` — use whatever your account returns).

---

## Node 6 — `if_video_ready` (IF)

**After:** `grok_video_poll`

**String condition:**
- Value 1: `={{ $json.status }}`
- is equal to
- Value 2: `done`  *(use `succeeded` if that's what your poll returns)*

| Branch | Wire to |
|---|---|
| true | `save_video_url` |
| false | `wait_video` (loop back) |

*(Optional: add a second condition/Switch for `failed` → stop, so a failed job doesn't loop forever.)*

---

## Node 7 — `save_video_url` (Edit Fields)

**After:** `if_video_ready` → true
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `video_url` | `={{ $json.video.url \|\| $json.url }}` |
| `grok_video_request_id` | `={{ $('grok_video_start').first().json.request_id }}` |
| `idea` | `={{ $('idea_form').first().json.idea }}` |
| `created_at` | `={{ $now.toISO() }}` |

**Check:** open `video_url` — it's your 1080p ~15s clip for the idea you typed.

---

## Optional add-ons (only if you want them)

| Want | Add after `save_video_url` |
|---|---|
| Download the MP4 into n8n | **HTTP Request** GET `={{ $json.video_url }}`, Response = File |
| Keep a log | **Google Sheets → Append** (`idea`, `video_url`, `created_at`) |
| See the link on the form | reconnect the tail to the Form Trigger's completion / add a **Respond to Form** step showing `video_url` |

---

## Smoke test (do in this order)

1. Execute `grok_video_start` alone → confirm a `request_id` comes back (proves auth + body shape).
2. Let `wait_video` → `grok_video_poll` run once → note the `status` string; if it's `succeeded` not `done`, fix Node 6's Value 2.
3. Full run from the form: type an idea → wait for the loop to hit `true` → open `video_url`.
4. Confirm the file is **1080p** and **~15s**.

---

## Notes / gotchas (from the reel build)

- **15s is the ceiling for one generate.** You want exactly 15s, so a single call is perfect — no extend node needed. (Extends are only for the 45–60s reel and cap at a 15s input anyway.)
- **`resolution` is `'1080p'`**, a string — not the number `1080`.
- **Poll interval:** 60s is a safe default; drop it to 30s if 15s clips finish faster in practice.
- **Endpoint names:** if xAI has renamed `/v1/videos/generations` or the poll path, copy the exact URLs from your working `GROK_API` / reel nodes — don't invent new ones.
