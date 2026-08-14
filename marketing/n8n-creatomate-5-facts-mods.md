# Creatomate — 5 Facts Story text mods (fix same MP4)

**Symptom:** Every run returns a video that looks like the old/default template.  
**Cause:** `modifications` are empty (`Intro-Text.text` / `Fact-*.text` = `""`). Creatomate still renders, but with no new copy.

**Template:** `5 Facts Story` (updated)  
**template_id:** `c5d54774-b029-4786-af04-d5af345dc7f2`  
**Video element:** `main_video` · **Hold image:** `end_hold`

---

**Convention:** all n8n field / parameter names are **lowercase** (`mod_intro`, `mod_fact_1`, …).  
Creatomate template keys stay exactly as Creatomate defines them (`Intro-Text.text`, `Fact-1-text.text`) — those are case-sensitive API keys.

## 1) `map_creatomate_mods` (Edit Fields)

Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `mod_intro` | `={{ $json.figma_headline \|\| $json.compound_name \|\| $json.display_name }}` |
| `mod_fact_1` | `={{ $json.figma_subhead \|\| $json.subhead \|\| $json.short_tagline }}` |
| `mod_fact_2` | `={{ $json.figma_bullet_1 \|\| $json.bullet_1 }}` |
| `mod_fact_3` | `={{ $json.figma_bullet_2 \|\| $json.bullet_2 }}` |
| `mod_fact_4` | `={{ $json.figma_bullet_3 \|\| $json.bullet_3 }}` |
| `mod_fact_5` | `={{ $json.figma_cta \|\| $json.cta \|\| 'View laboratory listing' }}` |
| `template_id` | `={{ $json.template_id \|\| $('Prep_day_variant').first().json.template_id }}` |

Execute this node. All six `mod_*` must be filled before you render.

If a field is empty, open `Parse_Grok` / `pick_creation` output and swap in the real key (e.g. only `bullet_1` exists, not `figma_bullet_1`).

---

## 2) `creatomate_render` body (HTTP POST)

URL: `https://api.creatomate.com/v2/renders`  
Body (expression):

```text
={{
{
  template_id: $json.template_id,
  render_scale: 1,
  modifications: {
    'main_video': $json.input_video_url || $json.public_video_url || $json.grok_video_url,
    'main_video.source': $json.input_video_url || $json.public_video_url || $json.grok_video_url,
    'main_video.muted': true,
    'main_video.volume': '0%',
    'main_video.loop': false,
    'end_hold': $json.end_hold_url || $json.still_url,
    'Intro-Text.text': $json.mod_intro,
    'Fact-1-text.text': $json.mod_fact_1,
    'Fact-2-text.text': $json.mod_fact_2,
    'Fact-3-text.text': $json.mod_fact_3,
    'Fact-4-text.text': $json.mod_fact_4,
    'Fact-5-text.text': $json.mod_fact_5,
    'end-text-link.text': $json.end_text_link || 'www.palmbeach-vitality.store'
  }
}
}}
```

**Must include `main_video`** (catbox MP4). **`end_hold`** = still for freeze (optional; template default if empty).  
**`main_video` stays muted. No music / no `bg_music`.**  
Prefer the separate package workflow: `n8n-creatomate-package-workflow.md` — each run paste a **catbox** `.mp4` URL into `video_url_input.input_video_url` (never `vidgen.x.ai`). Keep `sheets_update_text` (and `sheets_append_reel` if present).

Do **not** use keys like `Headline`, `Bullet-1`, `CTA`, `Video-8QW`, or `video_loop_source` — this template ignores them.

---

## 3) Verify

After POST (or status GET), `modifications` must look like:

```json
{
  "main_video": "https://…mp4",
  "Intro-Text.text": "5-Amino-1MQ",
  "Fact-1-text.text": "Research material listing",
  "Fact-2-text.text": "...",
  "Fact-3-text.text": "...",
  "Fact-4-text.text": "...",
  "Fact-5-text.text": "View laboratory listing",
  "end-text-link.text": "www.palmbeach-vitality.store"
}
```

New `id` + new `url` each successful run. Open **that** url (not an older Backblaze link from Sheets).

---

## 4) If it still looks identical

1. Confirm you opened the **new** render `url` (new id in the path).  
2. Confirm mods are non-empty in the API response.  
3. Confirm `map_creatomate_mods` / `map_creatomate_from_url` sits **before** render and receives real text.  
4. Hard-refresh the video URL (CDN cache is rare, but new id avoids it).
