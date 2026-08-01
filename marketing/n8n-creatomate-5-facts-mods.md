# Creatomate — 5 Facts Story text mods (fix same MP4)

**Symptom:** Every run returns a video that looks like the old/default template.  
**Cause:** `modifications` are empty (`Intro-Text.text` / `Fact-*.text` = `""`). Creatomate still renders, but with no new copy.

**Template:** `5 Facts Story`  
**template_id:** `06cd4ffd-906c-45ed-bf33-e8d2bed4312b`

---

## 1) `map_creatomate_mods` (Edit Fields)

Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `mod_Intro` | `={{ $json.figma_headline \|\| $json.compound_name \|\| $json.display_name }}` |
| `mod_Fact_1` | `={{ $json.figma_subhead \|\| $json.subhead \|\| $json.short_tagline }}` |
| `mod_Fact_2` | `={{ $json.figma_bullet_1 \|\| $json.bullet_1 }}` |
| `mod_Fact_3` | `={{ $json.figma_bullet_2 \|\| $json.bullet_2 }}` |
| `mod_Fact_4` | `={{ $json.figma_bullet_3 \|\| $json.bullet_3 }}` |
| `mod_Fact_5` | `={{ $json.figma_cta \|\| $json.cta \|\| 'View laboratory listing' }}` |
| `template_id` | `={{ $json.template_id \|\| $('Prep_day_variant').first().json.template_id }}` |

Execute this node. All six `mod_*` must be filled before you render.

If a field is empty, open `Parse_Grok` / `pick_creation` output and swap in the real key (e.g. only `bullet_1` exists, not `figma_bullet_1`).

---

## 2) `creatomate_render` body (HTTP POST)

URL: `https://api.creatomate.com/v2/renders`  
Body (expression):

```text
={{ JSON.stringify({
  template_id: $json.template_id,
  render_scale: 1,
  modifications: {
    'Intro-Text.text': $json.mod_Intro,
    'Fact-1.text': $json.mod_Fact_1,
    'Fact-2.text': $json.mod_Fact_2,
    'Fact-3.text': $json.mod_Fact_3,
    'Fact-4.text': $json.mod_Fact_4,
    'Fact-5.text': $json.mod_Fact_5
  }
}) }}
```

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
