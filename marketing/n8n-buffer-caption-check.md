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
| `fb_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `tiktok_caption_draft` | `={{ $('map_creatomate_from_url').first().json.buffer_caption }}` |
| `product_name` | `={{ $('map_creatomate_from_url').first().json.product_name }}` |
| `status` | `={{ $('creatomate_status').first().json.status }}` ← fx **ON** |

`ig` / `fb` / `tiktok` draft fields are the **same** caption (one sales pitch for all channels).

Also:
1. Re-paste **`map_creatomate_from_url`** from repo (builds `buffer_caption`)
2. Re-paste **`pick_text`** (sheet product is **`CJC`**; strips `· set 05`)
3. Delete duplicate `template_id` rows on the Set node

---

## 4) Verify in the execution (not only Buffer UI)

| Node | Check |
|---|---|
| `save_creatomate_url` | `buffer_caption` = full pitch (you already have this) |
| `buffer_ig_reel` | Open **JSON** / request → `variables.input.text` must be that long string |
| Buffer queue | post caption matches |

### Caption on save, but empty in Buffer (your case)

`save_creatomate_url` having `buffer_caption` does **nothing** until each Buffer HTTP body uses it.

1. Open **`buffer_ig_reel`** → Body → find `text:`
2. Replace with:

```js
text:
  $('save_creatomate_url').first().json.buffer_caption ||
  $('map_creatomate_from_url').first().json.buffer_caption,
```

3. Same line in **`buffer_fb_reel`** and **`buffer_tiktok`**
4. Re-execute **only** `buffer_ig_reel`
5. In that execution, expand the **outgoing request** (or pin Data) and confirm:

```json
"text": "Looking for CJC? Palm Beach Vitality..."
```

If request `text` is missing/short → body not updated.  
If request `text` is full but Buffer UI shows none → open the **new** queue item (not an older post).
