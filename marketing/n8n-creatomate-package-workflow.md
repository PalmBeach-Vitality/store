# Workflow B — Creatomate Package (separate)

**Name in n8n:** `PBVita — Creatomate Package`  
**Goal:** Paste one working `.mp4` URL into a Set node → Creatomate builds the muted 60s package with Intro + Facts.

Grok stays in Workflow A. No Sheet queue. No hunting for public links mid-run.

**No music** — muted render; add soundtrack manually later.

---

## How to build (copy from existing workflow)

In the current combined workflow, **select + copy** this chain:

```text
get_reel_text
  → pick_text
  → sheets_update_text
  → map_creatomate_*          (replace Code — see below)
  → creatomate_render
  → wait_creatomate
  → creatomate_status
  → if_creatomate_ready       (optional; or fixed wait only)
  → save_creatomate_url
```

Paste into a **new** workflow. Then add the two nodes in front:

```text
Manual Trigger
  → video_url_input           ← NEW Set / Edit Fields (paste URL here each run)
  → get_reel_text             ← copied
  → …
  → save_creatomate_url
```

Delete any leftover wires to Grok / `pick_creation` / `save_video_url` / `Parse_Grok`.

---

## Node: `video_url_input` (the only thing you edit daily)

Type: **Edit Fields** (Set)  
Name must be exactly: **`video_url_input`**

| Field | Example | Notes |
|---|---|---|
| `public_video_url` | `https://files.catbox.moe/xxxx.mp4` | **Required.** Direct `.mp4` Creatomate can fetch |
| `compound_name` | `BPC-157` | Optional Intro override |
| `creation_id` | `PBVita-Lab-206` | Optional note / tracking |

Each run: paste the URL → Execute workflow.

---

## Full chain

```text
Manual Trigger
  → video_url_input
  → get_reel_text              (Sheets Get Many · tab 10-creatomate-text-1000 · Return All)
  → pick_text                  (Code — n8n-code-pick-text.js)
  → sheets_update_text         (bump times_used on text row)
  → map_creatomate_from_url    (Code — n8n-code-map-creatomate-from-url.js)
  → creatomate_render
  → wait_creatomate            (90–180s)
  → creatomate_status
  → save_creatomate_url
```

---

## Replace the map Code

On the copied `map_creatomate_*` node:

1. Rename to **`map_creatomate_from_url`**
2. Paste `marketing/n8n-code-map-creatomate-from-url.js`
3. Mode: **Run Once for All Items**

It reads `$('video_url_input')` + `$('pick_text')` only — no Grok nodes.

---

## Fix expressions after copy

Anything that still references Grok must change:

| Old (combined WF) | New (Workflow B) |
|---|---|
| `$('save_video_url')…` / `$('Parse_Grok')…` for video | `$('video_url_input').item.json.public_video_url` |
| `$('map_creatomate_mods')` | `$('map_creatomate_from_url')` |
| Intro from Parse / lab_item | comes from `compound_name` on Set, or catalog fallback in map Code |

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

Auth: same Creatomate Header Auth credential.  
POST `https://api.creatomate.com/v2/renders`

### `creatomate_status`

```text
={{ 'https://api.creatomate.com/v1/renders/' + $('creatomate_render').item.json.id }}
```

### `save_creatomate_url` (Edit Fields)

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

Optional: append to a reels log Sheet after this — not required to finish a package.

---

## Daily habit

1. Run **Workflow A** (Grok) → download / copy a hostable MP4  
2. Host once if needed (catbox / R2) so Creatomate can fetch it  
3. Paste that URL into **`video_url_input.public_video_url`**  
4. Optional: set `compound_name`  
5. Run **Workflow B** → muted 60s package at `save_creatomate_url.video_url`

---

## Template checklist

- Dynamic video element named **`main_video`** (source marked dynamic)
- **No music** track in the template
- Text: `Intro-Text`, `Fact-1-text` … `Fact-5-text`

---

## Why this works

Creatomate needs a URL **it** can download. You paste that URL into one Set node; the copied text → render chain does the rest. Workflow A never talks to Creatomate.
