# Workflow B — Creatomate Package (separate)

**Name in n8n:** `PBVita — Creatomate Package`  

**What you do each run:** paste the **NEW** Grok/vidgen `.mp4` URL into one Set node.  
**Everything else stays the same** — text library pick, Sheets writebacks, Creatomate mods, mute render.

---

## Build (copy from combined workflow)

Select + copy this chain from the old workflow:

```text
get_reel_text
  → pick_text
  → sheets_update_text
  → map_creatomate_*
  → creatomate_render
  → wait_creatomate
  → creatomate_status
  → if_creatomate_ready          (if you have it)
  → save_creatomate_url
  → sheets_append_reel           (if you have it — keep it)
```

Paste into a **new** workflow. Add in front:

```text
Manual Trigger
  → video_url_input              ← ONLY daily edit: paste NEW vidgen URL
  → get_reel_text → …
```

Remove any wires to Grok / `pick_creation` / `save_video_url` / `Parse_Grok`.

---

## Full chain

```text
Manual Trigger
  → video_url_input              (Edit Fields — paste NEW URL)
  → get_reel_text                (Sheets Get Many · 10-creatomate-text-1000 · Return All)
  → pick_text                    (Code — n8n-code-pick-text.js)
  → sheets_update_text           (bump text times_used / last_used_at)  ← KEEP
  → map_creatomate_from_url      (Code — n8n-code-map-creatomate-from-url.js)
  → creatomate_render
  → wait_creatomate
  → creatomate_status
  → save_creatomate_url
  → sheets_append_reel           (optional log — KEEP if you already have it)
```

**Sheets that still update**
| Sheet / node | Purpose |
|---|---|
| `10-creatomate-text-1000` via `sheets_update_text` | rotate text rows (`times_used`, `last_used_at`) |
| reels log via `sheets_append_reel` | store final Creatomate URL (if present) |

Workflow A still owns `sheets_update_creation` on the lab library. Do not remove that from A.

---

## Node: `video_url_input`

Type: **Edit Fields** · name exactly **`video_url_input`**

| Field | Each run |
|---|---|
| `public_video_url` | Paste the **new** `https://vidgen.x.ai/...` (or whatever Grok returned) |
| `compound_name` | Optional Intro override (e.g. `BPC-157`) |
| `creation_id` | Optional tracking |

Then Execute workflow.

---

## Map Code

Rename copied map node → **`map_creatomate_from_url`**  
Paste: `marketing/n8n-code-map-creatomate-from-url.js`  
Mode: **Run Once for All Items**

Reads `$('video_url_input')` + `$('pick_text')` only.

---

## Fix expressions after copy

| Old | New |
|---|---|
| `$('save_video_url')` / `$('Parse_Grok')` for video | `$('video_url_input').item.json.public_video_url` |
| `$('map_creatomate_mods')` | `$('map_creatomate_from_url')` |

### `creatomate_render` body

```js
={{
{
  template_id: $json.template_id,
  render_scale: 1,
  modifications: {
    'main_video': $json.public_video_url,
    'main_video.muted': true,
    'main_video.volume': '0%',
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

### `save_creatomate_url`

| Name | Value |
|---|---|
| `video_url` | `={{ $json.url }}` |
| `creatomate_render_id` | `={{ $json.id }}` |
| `creatomate_snapshot_url` | `={{ $json.snapshot_url }}` |
| `public_video_url` | `={{ $('video_url_input').item.json.public_video_url }}` |
| `compound_name` | `={{ $('map_creatomate_from_url').item.json.mod_intro }}` |
| `template_id` | `={{ $('map_creatomate_from_url').item.json.template_id }}` |
| `text_id` | `={{ $('pick_text').item.json.text_id }}` |
| `created_at` | `={{ $now.toISO() }}` |

Keep your existing `sheets_append_reel` / text update column mappings — only swap node name refs if they pointed at Grok nodes.

---

## Daily habit

1. Run **Workflow A** → get new Grok `video_url`  
2. Copy that URL  
3. Paste into **`video_url_input.public_video_url`**  
4. Run **Workflow B** → text Sheet updates → muted Creatomate package  

---

## Template

- Dynamic element **`main_video`**
- No music track (or muted)
- Text: `Intro-Text`, `Fact-1-text` … `Fact-5-text`
