# Workflow B — Creatomate Package (separate)

**Name in n8n:** `PBVita — Creatomate Package`  
**Goal:** You paste a **public direct `.mp4`** into a Sheet → Creatomate builds the **60s muted** loop with Intro + Facts.

Grok daily stays in Workflow A. Creatomate no longer fights `vidgen.x.ai`.

**No music** — render is muted; you add music manually later (saves credits / file size).

---

## Sheet tab (once)

1. Import `marketing/sheets/11-creatomate-render-queue.csv`
2. Rename tab exactly: **`11-creatomate-render-queue`**
3. Each run: paste your public MP4 into `public_video_url` on a `Ready` row  
   - Use **catbox / R2 / B2** direct `.mp4`  
   - Optional: fill `compound_name` (e.g. `BPC-157`) and `creation_id`

---

## Node chain

```text
Manual Trigger
  → get_creatomate_queue          (Sheets Get Many, tab 11-creatomate-render-queue, Return All)
  → pick_queue_row                (Code — n8n-code-pick-creatomate-queue.js)
  → get_reel_text                 (Sheets Get Many, tab 10-creatomate-text-1000, Return All)
  → pick_text                     (Code — existing n8n-code-pick-text.js)
  → sheets_update_text            (bump text times_used — right after pick_text)
  → map_creatomate_from_queue     (Code — n8n-code-map-creatomate-from-queue.js)
  → creatomate_render
  → wait_creatomate               (90–180s)
  → creatomate_status
  → save_creatomate_url
  → sheets_update_queue           (mark Done + write creatomate_url)
```

---

## `creatomate_render` body

Element name is **`main_video`**. Mute audio.

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

In the Creatomate editor: delete / mute any **music** or soundtrack layers so they never render.

---

## `sheets_update_queue`

| Setting | Value |
|---|---|
| Document | By ID (same workbook as the queue tab) |
| Sheet | `11-creatomate-render-queue` |
| Column to Match On | `queue_id` |
| Value to Match | `={{ $('pick_queue_row').first().json.queue_id }}` |
| `status` | `Done` |
| `creatomate_render_id` | `={{ $json.id }}` |
| `creatomate_url` | `={{ $json.url }}` |
| `creatomate_snapshot_url` | `={{ $json.snapshot_url }}` |
| `times_used` | `={{ Number($('pick_queue_row').first().json.times_used \|\| 0) + 1 }}` |
| `last_used_at` | `={{ $now.toISO() }}` |

---

## Daily habit

1. Run **Workflow A** (Grok) → get `video_url`  
2. Upload that MP4 to **catbox** (or R2) → copy `https://files.catbox.moe/….mp4`  
3. Paste into Sheet `11-creatomate-render-queue` → `public_video_url`, status `Ready`  
4. Optional: set `compound_name`  
5. Run **Workflow B** → wait until `succeeded` → muted 60s package  

---

## Template checklist

- Dynamic video element named **`main_video`**
- `main_video` source marked dynamic  
- **No music track** in the template (or muted)  
- Text: `Intro-Text`, `Fact-1-text` … `Fact-5-text`  
