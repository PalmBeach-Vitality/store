# PBVita — Unique reel every run (required path)

> **NORTH STAR (Salvatore):** The **only** goal of this workflow is a **unique video every day**, using the variables provided (500 creations → `video_prompt` + scene + 12 quality vars). See `marketing/GOAL.md`.

**Goal:** A **different video** every workflow run (500 unique scenes).  
**Creatomate alone cannot do this.** It only burns text onto the same `5 Facts Story` template footage.

Your live canvas already had the right engine: **Grok Imagine still → Grok video → save URL**.  
Reel Studio deleted those nodes and replaced them with Creatomate. Put Imagine/video back **after** `pick_creation`.

---

## Correct architecture

```text
… → Parse_Grok → if_compliance (true)
  → get_reel_creations
  → filter_creations_active
  → pick_creation                 ← outputs video_prompt + creation_id
  → map_imagine_prompt            ← NEW (optional Edit Fields)
  → grok_imagine_reel_still       ← RESTORE / copy from live
  → save_still_url                ← Edit Fields
  → grok_video_start              ← RESTORE / copy from live
  → wait_video
  → grok_video_poll
  → if_video_ready
       false → wait_video
       true  → save_video_url
            → sheets_update_reel       (compound video_url)
            → sheets_update_creation   (times_used)
```

**Creatomate (optional later):** only if you want fact-card text composited onto the **unique** Grok video (template must accept a video/image source URL). Skip Creatomate until unique Grok MP4s work.

---

## Why you still saw the “original reel”

| What worked | What didn’t |
|---|---|
| Creatomate `Fact-1…4.text` changed | Same template animation every time |
| New render ids / URLs | `video_prompt` never sent to Imagine |
| End of reel still “original” copy | Missing `Intro-Text.text` + `Fact-5.text` (and any other end-card layers) |

---

## Step-by-step (do in order)

### 1) Confirm `pick_creation` outputs `video_prompt`
Execute `pick_creation`. You must see a long `video_prompt` and a `creation_id` (e.g. `PBVita-Reel-00x`).

### 2) Restore Imagine + video nodes from the **live** workflow
Copy settings from live (do not invent endpoints):

| Node | Model / role |
|---|---|
| `grok_imagine_reel_still` | `grok-imagine-image-quality` · 9:16 still |
| `grok_video_start` | `grok-imagine-video-1.5` (or whatever live uses) |
| `wait_video` / `grok_video_poll` / `if_video_ready` | same as live |
| `save_video_url` | maps final MP4 URL |

Wire them **after** `pick_creation` (not after Creatomate).

### 3) Point the still prompt at the creation
In `grok_imagine_reel_still` (or a `map_imagine_prompt` Edit Fields before it):

```text
prompt = {{ $json.video_prompt }}
```

Use the same request shape as live `GROK_Imagine` / `grok_imagine_reel_still` — only the prompt source changes.

Aspect: **9:16**.  
Do **not** use Creatomate template text as the Imagine prompt.

### 4) Animate / video
Feed the still URL into `grok_video_start` exactly like live (`grok_video_*` chain).

### 5) Save + Sheets
When video status is ready:

| Field | Value |
|---|---|
| `video_url` | final Grok MP4 URL |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `compound_id` | `={{ $('Get row(s) in sheet').first().json.compound_id }}` |

Then `sheets_update_reel` + `sheets_update_creation` (times_used + 1).

### 6) Prove uniqueness
Run twice. You must get:
- two different `creation_id`s (or same only if only one Active left)
- two different `video_prompt` scenes
- two different MP4 URLs that **look** different (not the Creatomate template bed)

---

## Leftover Creatomate end-card text (only if you keep Creatomate)

Your last successful status was **missing**:

- `Intro-Text.text`
- `Fact-5.text`

Add lowercase n8n fields `mod_intro` + `mod_fact_5` and map them in the render body.  
Inspect the template in Creatomate for **any other** text layers on the final screens (names must match exactly).

This does **not** create unique footage — it only finishes text burn-in.

---

## Decision

| Priority | Path |
|---|---|
| **Now** | Unique Grok video from `video_prompt` (this doc) |
| Later | Optional Creatomate text overlay on top of that unique video |
| Stop using as “the video” | Creatomate-only `5 Facts Story` template render |

Reply **`imagine wired`** when `grok_imagine_reel_still` runs with `$json.video_prompt` and returns a new image URL.
