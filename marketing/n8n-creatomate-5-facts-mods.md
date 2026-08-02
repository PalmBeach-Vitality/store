# Creatomate — 5 Facts Story text mods (fix same MP4)

**Symptom:** Every run returns a video that looks like the old/default template.  
**Cause:** `modifications` are empty (`Intro-Text.text` / `Fact-*.text` = `""`). Creatomate still renders, but with no new copy.

**Template:** `5 Facts Story`  
**template_id:** `06cd4ffd-906c-45ed-bf33-e8d2bed4312b`

---

**Convention:** all n8n field / parameter names are **lowercase** (`mod_intro`, `mod_fact_1`, …).  
Creatomate template keys stay exactly as Creatomate defines them (`Intro-Text.text`, `Fact-1.text`) — those are case-sensitive API keys.

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
    'video_loop_source.source': $json.grok_video_url,
    'Intro-Text.text': $json.mod_intro,
    'Fact-1-text.text': $json.mod_fact_1,
    'Fact-2-text.text': $json.mod_fact_2,
    'Fact-3-text.text': $json.mod_fact_3,
    'Fact-4-text.text': $json.mod_fact_4,
    'Fact-5-text.text': $json.mod_fact_5
  }
}
}}
```

**Must include `video_loop_source.source`.** If omitted, Creatomate keeps the default template footage.  
**URL must be publicly downloadable** — Drive `uc?export=download&id=…`, not `vidgen.x.ai` (Creatomate often cannot fetch vidgen).

Do **not** use keys like `Headline`, `Bullet-1`, `CTA` — this template ignores them.

---

## 3) Verify

After POST (or status GET), `modifications` must look like:

```json
{
  "Intro-Text.text": "5-Amino-1MQ",
  "Fact-1.text": "Research material listing",
  "Fact-2.text": "...",
  "Fact-3.text": "...",
  "Fact-4.text": "...",
  "Fact-5.text": "View laboratory listing"
}
```

New `id` + new `url` each successful run. Open **that** url (not an older Backblaze link from Sheets).

---

## 4) If it still looks identical

1. Confirm you opened the **new** render `url` (new id in the path).  
2. Confirm mods are non-empty in the API response.  
3. Confirm `map_creatomate_mods` sits **after** `pick_creation` and receives Parse fields.  
4. Hard-refresh the video URL (CDN cache is rare, but new id avoids it).
