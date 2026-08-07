# Workflow B — Creatomate Package (separate)

**Name in n8n:** `PBVita — Creatomate Package`  

**What you do each run:** upload the Grok MP4 to **[catbox.moe](https://catbox.moe)**, then paste the **catbox** `.mp4` URL into one Set node.  
**Do not paste `vidgen.x.ai` — Creatomate cannot fetch Grok URLs.**  
**Everything else stays the same** — text library pick, Sheets writebacks, Creatomate mods.  
**Video clip stays muted;** optional **`bg_music`** Audio element bakes soundtrack into the package before Buffer (see `n8n-creatomate-music.md`).

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
| `input_video_url` | **Preferred.** Catbox direct `.mp4` (e.g. `https://files.catbox.moe/….mp4`) → element **`main_video`**. Alias: `public_video_url`. Not vidgen / fal temp. |
| `public_video_url` | Same as `input_video_url` (older name — either works) |
| `product_name` | **Required.** Exact sheet name (e.g. `BPC-157`, `NAD+`, `Semaglutide`) — pulls Facts 1–3 for that product |
| `still_url` | Optional. Public still (catbox image) → **`end_hold`** (15–30s freeze). Not imgen.x.ai. |
| `music_url` | Optional. Public audio (catbox `.mp3`) → Creatomate Audio element **`bg_music`**. See `n8n-creatomate-music.md`. |
| `music_volume` | Optional. Default `35%`. |
| `creation_id` | Optional tracking |

**Daily habit:** Workflow A → download MP4 → upload [catbox.moe](https://catbox.moe) → paste into **`input_video_url`** → Execute.

Then Execute workflow.

`pick_text` filters `10-creatomate-text-1000` to matching `product_name`, then picks the least-used row.  
**Intro-Text** = `product_name`. Facts 1–5 = pitch/CTA only — **no** research-use disclaimers on screen. Legal disclaimer goes in **Buffer captions only**.

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
| `$('save_video_url')` / `$('Parse_Grok')` for video | `$('video_url_input').item.json.input_video_url` (or `public_video_url`) |
| `$('map_creatomate_mods')` | `$('map_creatomate_from_url')` |

### `creatomate_render` body

Template: **`c5d54774-b029-4786-af04-d5af345dc7f2`**  
Clip → **`main_video`**. Hold still → **`end_hold`**. Do **not** use `Video-8QW` / `video_loop_source` / `input_video_url` as the modification key.

**Critical:** the Creatomate property is the **element name** `main_video`, not `input_video_url`.  
`input_video_url` lives on `video_url_input` / map output — the render body must map it onto `main_video`.

```js
={{
(() => {
  const video =
    $json.input_video_url ||
    $json.public_video_url ||
    $json.catbox_video_url ||
    $json.grok_video_url ||
    '';
  if (!/^https?:\/\//i.test(String(video))) {
    throw new Error(
      'creatomate_render: no video URL. Set video_url_input.input_video_url (catbox .mp4) and re-run map_creatomate_from_url. Got: ' +
        JSON.stringify(video).slice(0, 120)
    );
  }
  const mods = {
    'main_video': video,
    'main_video.source': video,
    'main_video.muted': true,
    'main_video.volume': '0%',
    'main_video.loop': false,
    'Intro-Text.text': $json.mod_intro,
    'Fact-1-text.text': $json.mod_fact_1,
    'Fact-2-text.text': $json.mod_fact_2,
    'Fact-3-text.text': $json.mod_fact_3,
    'Fact-4-text.text': $json.mod_fact_4,
    'Fact-5-text.text': $json.mod_fact_5,
    'end-text-link.text': $json.end_text_link
  };
  // MUST be a public image URL — never the string "end_hold"
  if ($json.end_hold_url) mods['end_hold'] = $json.end_hold_url;
  // Soundtrack (template Audio element must be named bg_music) — see n8n-creatomate-music.md
  if ($json.music_url) {
    mods['bg_music'] = $json.music_url;
    mods['bg_music.source'] = $json.music_url;
    mods['bg_music.volume'] = $json.music_volume || '35%';
  }
  return {
    template_id: $json.template_id || 'c5d54774-b029-4786-af04-d5af345dc7f2',
    render_scale: 1,
    modifications: mods
  };
})()
}}
```

**If the package still shows the template placeholder video:** open the HTTP request — `modifications["main_video"]` must be your catbox `https://…mp4`. If it is `undefined` / empty, the render body was reading the wrong field (use the body above).

**`end_hold` bug:** if modifications show `"end_hold": "end_hold"`, the render body used the element name instead of a URL. Fix:

1. On `video_url_input`, set **`still_url`** = catbox/public image URL (last frame or Grok still uploaded to catbox)  
2. In `creatomate_render`, use **`'end_hold': $json.end_hold_url`** — not `$json.end_hold`  
3. Re-paste `map_creatomate_from_url` from the repo (strips the literal `"end_hold"` value)  

If `end_hold_url` is empty, omit the `'end_hold'` key so Creatomate keeps the template default still.

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
| `video_url` | `={{ $('creatomate_status').first().json.url \|\| $json.url }}` |
| `creatomate_render_id` | `={{ $('creatomate_status').first().json.id \|\| $json.id }}` |
| `creatomate_snapshot_url` | `={{ $('creatomate_status').first().json.snapshot_url \|\| $json.snapshot_url }}` |
| `status` | `={{ $('creatomate_status').first().json.status \|\| $json.status }}` |
| `public_video_url` | `={{ $('video_url_input').first().json.public_video_url }}` |
| `product_name` | `={{ $('map_creatomate_from_url').first().json.product_name }}` |
| `mod_intro` | `={{ $('map_creatomate_from_url').first().json.mod_intro }}` |
| `mod_fact_1` | `={{ $('map_creatomate_from_url').first().json.mod_fact_1 }}` |
| `mod_fact_2` | `={{ $('map_creatomate_from_url').first().json.mod_fact_2 }}` |
| `mod_fact_3` | `={{ $('map_creatomate_from_url').first().json.mod_fact_3 }}` |
| `mod_fact_4` | `={{ $('map_creatomate_from_url').first().json.mod_fact_4 }}` |
| `mod_fact_5` | `={{ $('map_creatomate_from_url').first().json.mod_fact_5 }}` |
| `text_id` | `={{ $('pick_text').first().json.text_id }}` |
| `template_id` | `={{ $('map_creatomate_from_url').first().json.template_id }}` |
| `created_at` | `={{ $now.toISO() }}` |
| `used_in_buffer` | `no` |
| `buffer_caption` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `ig_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `fb_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `tiktok_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |

Same caption text for all three platforms (one pitch). Draft fields are aliases for logging / Buffer convenience.

**Required for Buffer captions:** `buffer_caption` must be on this node (or Buffer must read the map node directly).  
**status:** expression must be turned **ON** (`=` / fx) — your output showed the raw `{{ … }}` string, meaning fx was off.  
**Remove duplicate** `template_id` fields. Prefer **one** from `map_creatomate_from_url`.

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
| `ig_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
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
4. (Optional) Paste catbox **`.mp3`** into **`video_url_input.music_url`** for baked-in soundtrack  
5. Run **Workflow B** → Creatomate package (`main_video` muted + optional **`bg_music`**) → Buffer  

---

## Template

- **ID:** `c5d54774-b029-4786-af04-d5af345dc7f2`
- Dynamic video **`main_video`** — clip once, loop off, muted
- Dynamic image **`end_hold`** — still for 15–30s hold (paste `still_url` on `video_url_input`)
- Dynamic audio **`bg_music`** — optional soundtrack (paste `music_url`); see `n8n-creatomate-music.md`
- Text: `Intro-Text`, `Fact-1-text` … `Fact-5-text`, `end-text-link`
- Also in template (usually leave defaults): `end-text-bg`, `Image-WVC`

### Hold last frame 15–30s (do not loop)

Clips are **15s**. If the template is longer and **`main_video`** has **Loop = On**, the clip restarts — that is the bad loop.

Creatomate does **not** auto-freeze the last frame when the element is longer than the source. Turn loop off, then cover 15–30s with **`end_hold`**.

**In the Creatomate template editor:**

1. Select **`main_video`**
2. Set **Loop → Off** (also send `'main_video.loop': false` in `creatomate_render`)
3. Set **`main_video` duration → Media** (or fixed **15**), so it only plays the real clip once
4. Keep full-bleed **`end_hold`** under the text overlays
5. Timeline for **`end_hold`**: **Time ≈ 15**, **Duration** fills to end (~15→30)
6. Source for **`end_hold`**:
   - Best: Grok **still** / last frame — paste as `still_url` on `video_url_input`
   - Or: leave template default still for testing
7. No fade-out on the video (fade darkens via black background). Optional: fade **in** on `end_hold` only, on a track **above** the video
8. Save the template, then re-run Workflow B

Do **not** rely on Loop to stretch a 15s file to 30s.
