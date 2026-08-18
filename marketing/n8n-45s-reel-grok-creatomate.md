# 45–60s reel = Grok unique footage + Creatomate text

## Goal
Daily **45–60 second** reel: unique lab-item video (Grok) + text info (Creatomate).

## Smooth vs jumpy

| Method | Result |
|---|---|
| **Grok `/v1/videos/extensions`** from last frame | **Smooth** continuous clip (same scene continues) |
| Stitching different Grok clips / different lab items | **Jumpy** scene changes |
| Creatomate template bed only | Smooth but **not unique** |

**Use extension** (same subject, continue motion) to grow 15s → ~45–60s, then hand **one** MP4 to Creatomate.

### Grok length limit (hard)

xAI reject: **`Input video must not exceed 15 seconds`** for `/videos/extensions`.

So you **cannot** chain extend on a 25s file.

| Step | In | Out | Next extend OK? |
|---|---|---|---|
| Generate | still | **15s** | yes |
| Extend 1 | 15s | **~25s** (15+10) | **no** |

**Max smooth continuous Grok clip ≈ 25s** (one generate + one extend).

### How we still hit 45–60s

Creatomate owns the **45–60s timeline** + text. Grok supplies the **unique** bed (15s or 25s):

- Template length 45–60s  
- Dynamic video source = Grok `video_url` (loop / fit / hold per template)  
- Text mods = Intro + Facts across the timeline  

Do **not** plan extend_2 / extend_3 on a 25s source — the API will fail.

## Pipeline

```text
pick_creation
  → grok_imagine_reel_still          (2k, lab video_prompt)
  → save_still_url
  → grok_video_start                 (15s, 1080p, 9:16)
  → wait / poll until done
  → grok_video_extend_1              (POST extensions, +10s)
  → wait / poll
  → grok_video_extend_2              (+10s)
  → wait / poll
  → grok_video_extend_3              (+10s)  → ~45s
  → (optional extend_4 for ~55–60s)
  → map_creatomate_mods              (mod_intro, mod_fact_1…5 from Parse)
  → creatomate_render                (source = extended Grok URL + text mods)
  → wait / status / save
  → sheets_update_reel + sheets_update_creation
```

## Creatomate role

- Template timeline **45–60s** (or stretch source to fit)
- Modifications:
  - **Video/image source** = extended Grok `video_url` (exact element name from your template — inspect in Creatomate)
  - **Text** = `Intro-Text.text`, `Fact-1.text` … `Fact-5.text` (lowercase n8n fields `mod_intro`, `mod_fact_*`)
- Creatomate must **not** be the only visual; if source mod is empty you get the old default reel look

### “Wrong” Creatomate URL (Backblaze)

Output like:

`https://f002.backblazeb2.com/file/creatomate-c8xg3hsxdu/<id>.mp4`

is **normal** — that’s Creatomate’s CDN host. It is **not** a Grok `vidgen.x.ai` URL.

What feels “wrong” is the **content**: if you never pass the Grok MP4 into a dynamic video element, Creatomate re-renders the **built-in template footage** (old reel look) every time.

| URL host | Meaning |
|---|---|
| `vidgen.x.ai` / `imgen.x.ai` | Grok unique still/video |
| `f002.backblazeb2.com/.../creatomate-...` | Creatomate final package (should *contain* your Grok footage if sourced correctly) |

**Fix:** In Creatomate editor → open template → find the main **Video** layer → mark **source** as dynamic → note the element name (e.g. `Video`, `Background-Video`).

`5 Facts Story` may only expose text keys (`Intro-Text`, `Fact-*`). If there is **no** dynamic video element, create/duplicate a template that has one, timeline 45–60s.

Example render body (Raw JSON), after Grok URL exists:

```text
={{ JSON.stringify({
  template_id: $json.template_id,
  render_scale: 1,
  modifications: {
    'Background-Video': $('save_video_url').first().json.video_url,
    'Intro-Text.text': $json.mod_intro,
    'Fact-1.text': $json.mod_fact_1,
    'Fact-2.text': $json.mod_fact_2,
    'Fact-3.text': $json.mod_fact_3,
    'Fact-4.text': $json.mod_fact_4,
    'Fact-5.text': $json.mod_fact_5
  }
}) }}
```

Replace `Background-Video` with **your** dynamic element name from Creatomate → Use Template → API Integration.

**Check:** status `modifications` must include `video_loop_source.source` with a **public direct MP4 URL**.

### Creatomate cannot fetch `vidgen.x.ai` (common failure)

If `grok_video_url` is `https://vidgen.x.ai/...`, Creatomate often **cannot download it** and silently keeps the **template bed** (text updates, footage does not).

**Fix for today:**
1. Download the Grok MP4 from the vidgen URL
2. Upload to Google Drive → share Anyone with the link
3. Use: `https://drive.google.com/uc?export=download&id=FILE_ID`  
   (not `/view?usp=sharing`)
4. Put that URL in `map_creatomate_mods` as `FORCE_PUBLIC_VIDEO`, or on `save_video_url.public_video_url`
5. Re-run map → creatomate_render

Element name for this template: **`video_loop_source.source`**

## Extension request shape (n8n Raw JSON)

Endpoint (confirm in xAI docs if renamed): `POST https://api.x.ai/v1/videos/extensions`

```text
={{ JSON.stringify({
  model: 'grok-imagine-video',
  prompt: 'Continue the same laboratory research catalog scene with slow cinematic camera motion, same product, photoreal, keep subject sharp, no people, no hands, no needles. For laboratory research use only.',
  video: { url: $json.video.url || $json.url },
  duration: 10
}) }}
```

Use the same Raw `application/json` body pattern that worked for `grok_video_start`.  
Poll with the returned `request_id` like video generate.

> Note: some docs say extension uses model `grok-imagine-video` (not `1.5`). If `1.5` errors on extend, switch model for **extend nodes only**.

## Order of work (adjusted)

1. **Grok 15s** working ✓ → `save_video_url` with `video_url`  
2. **Extend** 2–4× for ~45–60s smooth (same scene) → one final Grok URL  
3. **Creatomate template check** — dynamic **video source** element required (not text-only `5 Facts Story` unless you add a video layer)  
4. Wire `creatomate_render` **after** extended Grok URL; pass video source + text mods  
5. Final Backblaze URL should play **your** lab footage + facts text  

Do **not** run Creatomate in parallel off only text mods — that reproduces the old reel.

## PBVita’s job in this

**PBVita / Sheets / `PBVita-Lab-*`** = pick today’s unique lab variables.  
**Grok** = make the unique moving picture.  
**Creatomate** = package length + text on top.
