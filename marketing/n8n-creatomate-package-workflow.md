# Workflow B — Creatomate Package (separate)

**Name in n8n:** `PBVita — Creatomate Package`  

**What you do each run:** upload the Grok MP4 to **[catbox.moe](https://catbox.moe)**, then paste the **catbox** `.mp4` URL into one Set node.  
**Do not paste `vidgen.x.ai` — Creatomate cannot fetch Grok URLs.**  
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
  → video_url_input              ← ONLY daily edit: paste NEW catbox .mp4 URL
  → get_reel_text → …
```

Remove any wires to Grok / `pick_creation` / `save_video_url` / `Parse_Grok`.

---

## Full chain

```text
Manual Trigger
  → video_url_input              (Edit Fields — paste NEW catbox .mp4 URL)
  → get_reel_text                (Sheets Get Many · 10-creatomate-text-1000 · Return All)
  → pick_text                    (Code — n8n-code-pick-text.js)
  → sheets_update_text           (bump text times_used / last_used_at)  ← KEEP
  → map_creatomate_from_url      (Code — n8n-code-map-creatomate-from-url.js)
  → creatomate_render
  → wait_creatomate
  → creatomate_status
  → save_creatomate_url
  → sheets_append_reel           (Append → tab 4-reel-queue)
  → buffer_ig_reel → buffer_fb_reel → buffer_tiktok
  → Buffer_post_* / Buffer_*_story → sheets_update_buffer
  (no X / Twitter)
```

**Sheets that still update**
| Sheet / node | Purpose |
|---|---|
| `10-creatomate-text-1000` via `sheets_update_text` | rotate text rows (`times_used`, `last_used_at`) |
| `4-reel-queue` via `sheets_append_reel` | log finished Creatomate package URL + product/facts |

**Buffer:** copy nodes from the other workflow; remap video → `save_creatomate_url.video_url`. Details: `n8n-buffer-from-creatomate.md`.

Workflow A still owns `sheets_update_creation` on the lab library. Do not remove that from A.

---

## Node: `video_url_input`

Type: **Edit Fields** · name exactly **`video_url_input`**

| Field | Each run |
|---|---|
| `public_video_url` | **Catbox** direct `.mp4` (e.g. `https://files.catbox.moe/….mp4`) → **`Video-8QW`**. Not vidgen. |
| `product_name` | **Required.** Exact sheet name (e.g. `BPC-157`, `NAD+`, `Semaglutide`) — pulls Facts 1–3 for that product |
| `still_url` | Optional. Public still (catbox image) → **`end_hold`** (15–30s freeze). Not imgen.x.ai. |
| `creation_id` | Optional tracking |

**Daily habit:** Workflow A → download Grok MP4 → upload [catbox.moe](https://catbox.moe) → paste catbox URL here → Execute.

Then Execute workflow.

`pick_text` filters `10-creatomate-text-1000` to matching `product_name`, then picks the least-used row.  
**Intro-Text** = `product_name`. Facts 1–3 = plain-English ad lines. Facts 4–5 = disclaimer/CTA.

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

Template: **`c5d54774-b029-4786-af04-d5af345dc7f2`**  
Grok clip → **`Video-8QW`**. Hold still → **`end_hold`**. No `main_video` / `video_loop_source` on this template.

```js
={{
{
  template_id: $json.template_id,
  render_scale: 1,
  modifications: {
    'Video-8QW': $json.public_video_url,
    'Video-8QW.muted': true,
    'Video-8QW.volume': '0%',
    'Video-8QW.loop': false,
    // MUST be a public image URL — never the string "end_hold"
    'end_hold': $json.end_hold_url,
    'Intro-Text.text': $json.mod_intro,
    'Fact-1-text.text': $json.mod_fact_1,
    'Fact-2-text.text': $json.mod_fact_2,
    'Fact-3-text.text': $json.mod_fact_3,
    'Fact-4-text.text': $json.mod_fact_4,
    'Fact-5-text.text': $json.mod_fact_5,
    'end-text-link.text': $json.end_text_link
  }
}
}}
```

If `end_hold_url` is empty, either omit `'end_hold'` or leave the template’s default still. Prefer pasting Grok **`still_url`** (or last-frame URL) on `video_url_input`.

### `normalize_creatomate` (optional Edit Fields — before save)

Use if `creatomate_status` sometimes returns an array. Mode: **Manual Mapping**.

| Name | Value |
|---|---|
| `id` | `={{ $json.id \|\| $json[0].id }}` |
| `status` | `={{ $json.status \|\| $json[0].status }}` |
| `url` | `={{ $json.url \|\| $json[0].url }}` |
| `snapshot_url` | `={{ $json.snapshot_url \|\| $json[0].snapshot_url }}` |

Only continue to save when `status` is `succeeded`.

### `save_creatomate_url` (Edit Fields — start fresh)

**Type:** Edit Fields (Set)  
**Name:** exactly `save_creatomate_url`  
**Mode:** Manual Mapping  
**Include Other Input Fields:** OFF  

Wire: `creatomate_status` → (`normalize_creatomate` →) `save_creatomate_url`

| Name | Value |
|---|---|
| `video_url` | `={{ $json.url }}` |
| `creatomate_render_id` | `={{ $json.id }}` |
| `creatomate_snapshot_url` | `={{ $json.snapshot_url }}` |
| `status` | `={{ $json.status }}` |
| `public_video_url` | `={{ $('video_url_input').item.json.public_video_url }}` |
| `product_name` | `={{ $('video_url_input').item.json.product_name }}` |
| `mod_intro` | `={{ $('map_creatomate_from_url').item.json.mod_intro }}` |
| `mod_fact_1` | `={{ $('map_creatomate_from_url').item.json.mod_fact_1 }}` |
| `mod_fact_2` | `={{ $('map_creatomate_from_url').item.json.mod_fact_2 }}` |
| `mod_fact_3` | `={{ $('map_creatomate_from_url').item.json.mod_fact_3 }}` |
| `mod_fact_4` | `={{ $('map_creatomate_from_url').item.json.mod_fact_4 }}` |
| `mod_fact_5` | `={{ $('map_creatomate_from_url').item.json.mod_fact_5 }}` |
| `text_id` | `={{ $('pick_text').item.json.text_id }}` |
| `template_id` | `={{ $('map_creatomate_from_url').item.json.template_id }}` |
| `created_at` | `={{ $now.toISO() }}` |
| `used_in_buffer` | `no` |

**Do not** reference `Parse_Grok`, `save_video_url`, `map_creatomate_mods`, or `pick_creation` — those nodes are not in Workflow B.

**Check:** `video_url` opens the finished Creatomate MP4; `product_name` matches what you typed; `status` is `succeeded`.

### `sheets_append_reel` (Google Sheets Append)

**After:** `save_creatomate_url`  
**Type:** Google Sheets → **Append Row in Sheet**  
**Name:** exactly `sheets_append_reel`

| Setting | Value |
|---|---|
| Credential | same Google Sheets account as `get_reel_text` |
| Document | By ID (same workbook) |
| Sheet | `4-reel-queue` |
| Mapping Column Mode | Map Each Column Manually |
| Data Mode / Mapping | map columns below |

**Import once:** `marketing/sheets/4-reel-queue.csv` → tab name exactly **`4-reel-queue`** (header row only is fine).

| Sheet column | Value |
|---|---|
| `product_name` | `={{ $('video_url_input').item.json.product_name }}` |
| `text_id` | `={{ $('pick_text').item.json.text_id }}` |
| `mod_intro` | `={{ $('map_creatomate_from_url').item.json.mod_intro }}` |
| `mod_fact_1` | `={{ $('map_creatomate_from_url').item.json.mod_fact_1 }}` |
| `mod_fact_2` | `={{ $('map_creatomate_from_url').item.json.mod_fact_2 }}` |
| `mod_fact_3` | `={{ $('map_creatomate_from_url').item.json.mod_fact_3 }}` |
| `mod_fact_4` | `={{ $('map_creatomate_from_url').item.json.mod_fact_4 }}` |
| `mod_fact_5` | `={{ $('map_creatomate_from_url').item.json.mod_fact_5 }}` |
| `public_video_url` | `={{ $('video_url_input').item.json.public_video_url }}` |
| `video_url` | `={{ $('save_creatomate_url').item.json.video_url }}` |
| `creatomate_snapshot_url` | `={{ $('save_creatomate_url').item.json.creatomate_snapshot_url }}` |
| `template_id` | `={{ $('map_creatomate_from_url').item.json.template_id }}` |
| `creatomate_render_id` | `={{ $('save_creatomate_url').item.json.creatomate_render_id }}` |
| `ig_caption_draft` | `={{ $('video_url_input').item.json.product_name + ' — For laboratory research use only. Not for human use or consumption. www.palmbeach-vitality.store' }}` |
| `compliance_ok` | `yes` |
| `created_at` | `={{ $('save_creatomate_url').item.json.created_at \|\| $now.toISO() }}` |
| `used_in_buffer` | `no` |

**Important:** use **`mod_intro`** (not `mod_into`).  
`public_video_url` and `mod_intro` must come from `video_url_input` / `map_creatomate_from_url` — they are often missing on `$json` after `save_creatomate_url`.

**Check:** after a successful run, a new row appears in `4-reel-queue` with the Creatomate MP4 URL.

---

## Daily habit

1. Run **Workflow A** → get new Grok `video_url` (`vidgen.x.ai`)  
2. **Download** that MP4 → **upload to catbox.moe**  
3. Paste the **catbox** URL into **`video_url_input.public_video_url`**  
4. Run **Workflow B** → text Sheet updates → muted Creatomate package (`Video-8QW` = catbox)  

---

## Template

- **ID:** `c5d54774-b029-4786-af04-d5af345dc7f2`
- Dynamic video **`Video-8QW`** — Grok clip (once, loop off, muted)
- Dynamic image **`end_hold`** — still for 15–30s hold (paste `still_url` on `video_url_input`)
- Text: `Intro-Text`, `Fact-1-text` … `Fact-5-text`, `end-text-link`
- Also in template (usually leave defaults): `end-text-bg`, `Image-WVC`

### Hold last frame 15–30s (do not loop)

Grok clips are **15s**. If the template is longer and **`Video-8QW`** has **Loop = On**, the clip restarts — that is the bad loop.

Creatomate does **not** auto-freeze the last frame when the element is longer than the source. Turn loop off, then cover 15–30s with **`end_hold`**.

**In the Creatomate template editor:**

1. Select **`Video-8QW`**
2. Set **Loop → Off** (also send `'Video-8QW.loop': false` in `creatomate_render`)
3. Set **`Video-8QW` duration → Media** (or fixed **15**), so it only plays the real clip once
4. Keep full-bleed **`end_hold`** under the text overlays
5. Timeline for **`end_hold`**: **Time ≈ 15**, **Duration** fills to end (~15→30)
6. Source for **`end_hold`**:
   - Best: Grok **still** / last frame — paste as `still_url` on `video_url_input`
   - Or: leave template default still for testing
7. No fade-out on the video (fade darkens via black background). Optional: fade **in** on `end_hold` only, on a track **above** the video
8. Save the template, then re-run Workflow B

Do **not** rely on Loop to stretch a 15s file to 30s.
