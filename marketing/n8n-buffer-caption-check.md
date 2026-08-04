# Buffer caption check (Workflow B)

Captions are built in **`map_creatomate_from_url`** as `buffer_caption`.  
Buffer nodes must read **that** field — not a short product + disclaimer string.

---

## 1) Re-paste map Code (required)

Node: **`map_creatomate_from_url`**  
Paste full file: `marketing/n8n-code-map-creatomate-from-url.js`

Execute → open output → you must see:

- `buffer_caption` (long text, 4+ sentences)
- ends with: `For a 10% discount code drop Peptides in the comments!`
- then 5 hashtags
- product name inside the first sentence

If `buffer_caption` is **missing**, the new Code was not pasted.

---

## 2) Fix Buffer `text` on all 3 nodes

In **`buffer_ig_reel`**, **`buffer_fb_reel`**, **`buffer_tiktok`** body, `variables.input.text` must be exactly:

```js
text: $('map_creatomate_from_url').first().json.buffer_caption,
```

**Wrong (old):**
```js
text: $('video_url_input').first().json.product_name + ' — For laboratory research…'
```

**Wrong:**
```js
text: $json.ig_caption_draft   // often empty after later nodes
```

---

## 3) `save_creatomate_url` — add these fields

Your current save node is **missing** `buffer_caption`. Add:

| Name | Value |
|---|---|
| `buffer_caption` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `ig_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `product_name` | `={{ $('map_creatomate_from_url').first().json.product_name }}` |
| `status` | `={{ $('creatomate_status').first().json.status }}` ← fx **ON** |

Also:
1. Re-paste **`map_creatomate_from_url`** from repo (builds `buffer_caption`)
2. Re-paste **`pick_text`** (aliases `CJC` → `CJC (no DAC)`, strips `· set 05`)
3. Delete duplicate `template_id` rows on the Set node

---

## 4) Verify in the execution (not only Buffer UI)

| Node | Check |
|---|---|
| `map_creatomate_from_url` | `buffer_caption` looks like full pitch |
| `buffer_ig_reel` request | `variables.input.text` = that same long string |
| Buffer queue | post caption matches |

If map has the good caption but Buffer queue does not → Buffer body `text` is still wrong.  
If map caption is short/missing → re-paste the map Code file.
