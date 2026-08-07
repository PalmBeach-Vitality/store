# PBVita — Idea → Image → Video (Grok, with review gate)

**Owner:** Salvatore
**Workflow name:** `PBVita — Idea to Video`
**Goal:** Type one **idea** → Grok makes a **9:16 still** → you **review** it → approve to continue, or send an **adjustment prompt** to redo the still → once approved, Grok animates it into a **1080p, 15s (9:16)** MP4.
**Auth:** same xAI **Header Auth** credential as `GROK_API` (`Authorization: Bearer …`).

> Standalone simple version. No lab-item library, no Creatomate, no extends.
> One video generate call = **15s** (Grok's single-generation max), so no extend needed.

All new n8n field names are **lowercase** (house rule). xAI API keys stay exactly as xAI defines them.

---

## Output spec (locked)

| Setting | Value | Notes |
|---|---|---|
| Aspect ratio | `9:16` | vertical, both still and video |
| Still resolution | `2k` | `grok-imagine-image-quality` (never the fast model) |
| Video resolution | `1080p` | xAI string is `'1080p'`, not `1080` |
| Video duration | `15` | seconds; single generate, no extend |
| Video model | `grok-imagine-video-1.5` | image→video (uses the approved still) |

---

## The flow (with the review loop)

```text
idea_form (Form Trigger — field: idea)
  → build_prompt        (Edit Fields — image_prompt @ 9:16, video params)
  → image_gen           (HTTP POST /v1/images/generations — 2k, 9:16)   ◄─────┐
  → save_still_url      (Edit Fields — still_url + carry prompt/idea)          │
  → review_image        (Form — shows the still; asks Approve / Change)        │
  → if_change           (IF decision = "Change")                              │
       true  → adjust_prompt (Edit Fields — merge your 2nd prompt) ────────────┘  (loop: regen still)
       false → grok_video_start   (HTTP POST /v1/videos/generations — image→video, 1080p/15s/9:16)
             → wait_video         (Wait 60s)
             → grok_video_poll    (HTTP GET status)
             → if_video_ready     (IF status = done/succeeded)
                  false → wait_video   (loop)
                  true  → save_video_url
```

**Two loops:** the **image review loop** (`adjust_prompt` → back into `image_gen`) repeats until you approve; the **video poll loop** (`if_video_ready` false → `wait_video`) repeats until the MP4 is ready.

---

## Node 1 — `idea_form` (Form Trigger)

**Type:** n8n Form Trigger (hosted URL where you type the idea and submit).

| Field label | Field name | Required |
|---|---|---|
| `Idea` | `idea` | yes |

The Form Trigger is what makes Node 5's review page possible — the still is shown and answered inside the same hosted form session.

---

## Node 2 — `build_prompt` (Edit Fields)

**After:** `idea_form`
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `image_prompt` | `={{ $json.idea }}, vertical 9:16 composition, cinematic, photoreal, high detail, 8k, professional color grade` |
| `still_aspect_ratio` | `9:16` |
| `still_resolution` | `2k` |
| `video_resolution` | `1080p` |
| `video_duration` | `15` |
| `video_aspect_ratio` | `9:16` |
| `motion_prompt` | `Slow cinematic camera motion around this scene, keep the subject sharp and unchanged, photoreal, no fade out, no dissolve` |

**Optional brand-safety line** (append to `image_prompt` and `motion_prompt` if these are PBVita clips): `, no people, no hands, no needles, laboratory research aesthetic. For laboratory research use only.`

---

## Node 3 — `image_gen` (HTTP Request)  ← the still, and the loop target

**After:** `build_prompt` **and** (loop) `adjust_prompt`
**Before:** `save_still_url`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/images/generations` |
| Authentication | Header Auth → same xAI credential as `GROK_API` |
| Send Body | **ON** · Raw · `application/json` |

**Body (fx / Expression):**

```text
={{ JSON.stringify({
  model: 'grok-imagine-image-quality',
  prompt: $json.image_prompt,
  n: 1,
  aspect_ratio: $json.still_aspect_ratio,
  resolution: $json.still_resolution
}) }}
```

**Why it reads `$json.image_prompt`:** on the first pass that field comes from `build_prompt`; on a revision it comes from `adjust_prompt`. Same field name = one node handles both passes, so `adjust_prompt` can wire straight back here to regenerate.

**Check:** response has an image URL (usually `$json.data[0].url`).

---

## Node 4 — `save_still_url` (Edit Fields)

**After:** `image_gen`
**Before:** `review_image`
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `still_url` | `={{ $json.data[0].url }}` |
| `image_prompt` | `={{ $json.image_prompt }}` |
| `idea` | `={{ $('idea_form').first().json.idea }}` |

Carrying `image_prompt` forward lets `adjust_prompt` build the next version on top of the current prompt.

---

## Node 5 — `review_image` (Form)  ← human gate, pauses the run

**Type:** n8n **Form** node (a follow-up page in the same form session; execution pauses here until you submit).
**After:** `save_still_url`
**Before:** `if_change`

**Form title:** `Review image`

| Element type | Config |
|---|---|
| **HTML** | `<img src="{{ $json.still_url }}" style="max-width:100%;border-radius:8px"/>` (renders the still to look at) |
| **Dropdown** — field `decision` | options: `Approve`, `Change` (required) |
| **Textarea** — field `adjust_prompt_text` | label: "What to change (only if Change)"; optional |

On submit you get `$json.decision` and `$json.adjust_prompt_text`.

---

## Node 6 — `if_change` (IF)

**After:** `review_image`

**Condition:**
- Value 1: `={{ $json.decision }}`
- is equal to
- Value 2: `Change`

| Branch | Wire to |
|---|---|
| true (needs change) | `adjust_prompt` |
| false (Approve / no change) | `grok_video_start` |

---

## Node 7 — `adjust_prompt` (Edit Fields)  ← the "2nd prompt", then loop

**After:** `if_change` → true
**Before:** `image_gen` (wire back into Node 3 — this is the revision loop)
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `image_prompt` | `={{ $('save_still_url').first().json.image_prompt }}, {{ $json.adjust_prompt_text }}` |

This appends your requested change onto the current image prompt and sends it back through `image_gen` → `save_still_url` → `review_image`. Repeat until you pick **Approve**.

**Prefer a full rewrite over appending?** Set `image_prompt` = `={{ $json.adjust_prompt_text }}` instead, so the textarea becomes the entire new prompt.

---

## Node 8 — `grok_video_start` (HTTP Request)  ← image→video, only after Approve

**After:** `if_change` → false
**Before:** `wait_video`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Authentication | same xAI Header Auth |
| Send Body | **ON** · Raw · `application/json` |

**Critical:** delete any empty Body Parameter rows first (an empty name/value sends `{ "": "" }` and the call fails).

**Body (fx / Expression):**

```text
={{ JSON.stringify({
  model: 'grok-imagine-video-1.5',
  prompt: $('build_prompt').first().json.motion_prompt,
  image: { url: $('save_still_url').first().json.still_url },
  duration: $('build_prompt').first().json.video_duration,
  aspect_ratio: $('build_prompt').first().json.video_aspect_ratio,
  resolution: $('build_prompt').first().json.video_resolution
}) }}
```

Because we animate the **approved still**, this is image→video (the reliable path). The `image.url` is the still you signed off on.

**Check:** request preview shows the real motion `"prompt"` + `"image":{"url":"https://…"}` (not `{ "": "" }`), and the response returns a `request_id`.

---

## Node 9 — `wait_video` (Wait)

**After:** `grok_video_start` **or** `if_video_ready` → false
**Before:** `grok_video_poll`

Duration: **60** seconds. Must be **enabled**.

---

## Node 10 — `grok_video_poll` (HTTP Request)

**After:** `wait_video`
**Before:** `if_video_ready`

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://api.x.ai/v1/videos/' + $('grok_video_start').first().json.request_id }}` |
| Authentication | same xAI Header Auth |
| Send Body | **OFF** |

Preview URL must start with `https://` (no leading `=`). Response has a `status` field.

---

## Node 11 — `if_video_ready` (IF)

**After:** `grok_video_poll`

- Value 1: `={{ $json.status }}` · is equal to · Value 2: `done` *(use `succeeded` if that's what your poll returns)*

| Branch | Wire to |
|---|---|
| true | `save_video_url` |
| false | `wait_video` (loop) |

*(Optional: add a `failed` → stop branch so a failed job doesn't loop forever.)*

---

## Node 12 — `save_video_url` (Edit Fields)

**After:** `if_video_ready` → true
Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `video_url` | `={{ $json.video.url \|\| $json.url }}` |
| `still_url` | `={{ $('save_still_url').first().json.still_url }}` |
| `grok_video_request_id` | `={{ $('grok_video_start').first().json.request_id }}` |
| `idea` | `={{ $('idea_form').first().json.idea }}` |
| `created_at` | `={{ $now.toISO() }}` |

**Check:** open `video_url` — your 1080p ~15s 9:16 clip, animated from the still you approved.

---

## Optional add-ons (after `save_video_url`)

| Want | Add |
|---|---|
| Download the MP4 into n8n | **HTTP Request** GET `={{ $json.video_url }}`, Response = File |
| Keep a log | **Google Sheets → Append** (`idea`, `still_url`, `video_url`, `created_at`) |
| Show the link on the form | **Form** completion page / **Respond to Form** with `video_url` |

---

## Smoke test (do in this order)

1. Execute up to `image_gen` → confirm an image URL comes back (proves auth + still body).
2. Full run to the review page: type an idea → the form should **display the still** and offer **Approve / Change**.
3. Pick **Change**, type an adjustment → confirm a **new** still appears on the review page (revision loop works).
4. Pick **Approve** → let the video poll loop run → open `video_url`.
5. Confirm the file is **9:16**, **1080p**, **~15s**.

---

## Notes / gotchas (from the reel build)

- **15s is the ceiling for one generate.** You want exactly 15s, so a single call is perfect — no extend node.
- **`resolution` strings:** still `'2k'`, video `'1080p'` (not the numbers).
- **Loop wiring:** `adjust_prompt` connects **back into** `image_gen`; `image_gen` therefore has two inputs (from `build_prompt` and from `adjust_prompt`). n8n handles multiple connections into one node — both set `image_prompt`, so the node behaves the same either way.
- **`review_image` needs the Form Trigger.** The pause/review page only works because the run started from `idea_form` (Form Trigger).
- **Endpoint names:** if xAI renamed `/v1/images/generations`, `/v1/videos/generations`, or the poll path, copy exact URLs from your working `GROK_API` / reel nodes — don't invent new ones.
