# Still edit before Grok Imagine video 1.5

**Goal:** After Grok creates the still, optionally **edit the image** (add or remove parts) with a text instruction, then send the **edited** still into **`grok-imagine-video-1.5`**.

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  
**Still edit API:** `POST https://api.x.ai/v1/images/edits` · `grok-imagine-image-quality`  
**Video API:** `POST https://api.x.ai/v1/videos/generations` · `grok-imagine-video-1.5`  
**Auth:** same xAI Header Auth as `grok_imagine_reel_still` / `grok_video_start`

---

## Wire

```text
pick_creation
  → grok_imagine_reel_still
  → save_still_url
  → still_edit_instructions      ← NEW (you type add/remove)
  → if_still_edit                ← NEW (skip when blank)
       true  → prep_still_edit → grok_imagine_edit_still → save_edited_still_url
       false → save_edited_still_url                     (original still_url)
  → prep_grok_video_start        ← uses edited still when present
  → grok_video_start             ← grok-imagine-video-1.5
  → wait_video → grok_video_poll → save_video_url → …
```

Leave `still_edit_prompt` **empty** → original still goes to video (no edit call).

---

## Node A — `still_edit_instructions`

**Type:** Edit Fields (Set)  
**After:** `save_still_url`  
Include Other Input Fields: **ON**

| Name | Mode | Value |
|---|---|---|
| `still_url` | Expression | `={{ $json.still_url \|\| $json.data[0].url }}` |
| `still_edit_prompt` | **Fixed** (change each run) | see examples below |
| `creation_id` | Expression | `={{ $json.creation_id \|\| $('pick_creation').first().json.creation_id }}` |

### Prompt examples

| Intent | Example |
|---|---|
| Remove | `Remove the second vial on the left. Keep everything else identical — same lighting, camera, and product label.` |
| Add | `Add one small crimped-seal research vial on the right edge of the surface. Keep the rest of the scene identical.` |
| Both | `Remove the hanging plant on the left. Add a single sealed research pen on the table near the hero product. Keep 9:16, no people, no needles.` |

Always say **what must stay the same** so Grok doesn’t restyle the whole frame.

---

## Node B — `if_still_edit`

**Type:** IF  

Condition: `{{ String($json.still_edit_prompt || '').trim() }}` **is not empty**

- **true** → Nodes C → D → E  
- **false** → Node E (passthrough original)

---

## Node C — `prep_still_edit`

**Type:** Code · Run Once for All Items  

Paste: `marketing/n8n-code-prep-still-edit.js`

**Check:** `still_edit_body_json` + `source_still_url` (https).

---

## Node D — `grok_imagine_edit_still`

**Type:** HTTP Request  

| Setting | Value |
|---|---|
| Method | **`POST`** |
| URL | **`https://api.x.ai/v1/images/edits`** (must be plural `images` + `/edits`) |
| Authentication | Header Auth → same xAI credential as still gen |
| Send Body | **ON** |
| Body Content Type | **JSON** |
| JSON (fx **ON**) | `={{ $json.still_edit_body_json }}` |

**Confirmed working:** Body = JSON, expression `={{ $json.still_edit_body_json }}` from the previous `prep_still_edit` item.

Do **not** use GET. Do **not** use `/v1/images/generations` for edits.

If you still get 404, smoke-test with this fixed JSON body (fx OFF) using xAI’s sample image:

```json
{
  "model": "grok-imagine-image-quality",
  "prompt": "Render this as a pencil sketch with detailed shading",
  "image": {
    "url": "https://docs.x.ai/assets/api-examples/images/style-realistic.png"
  }
}
```

- Sample works → your imported image URL is private/expired/not reachable by xAI  
- Sample also 404 → URL/method/auth on the node is still wrong  

**Check:** `$json.data[0].url` is a **new** image. Open it — your add/remove should show.

---

## Node E — `save_edited_still_url`

**Type:** Edit Fields  
Wire **both** IF branches here.

Include Other Input Fields: **ON**

| Name | Value (fx ON) |
|---|---|
| `still_url` | `={{ $json.data?.[0]?.url \|\| $json.still_url \|\| $('save_still_url').first().json.still_url }}` |
| `original_still_url` | `={{ $('save_still_url').first().json.still_url }}` |
| `still_edit_prompt` | `={{ $('still_edit_instructions').first().json.still_edit_prompt \|\| '' }}` |
| `still_was_edited` | `={{ Boolean($json.data?.[0]?.url) }}` |
| `creation_id` | `={{ $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | `={{ $('save_still_url').first().json.video_motion_prompt \|\| $('pick_creation').first().json.video_motion_prompt }}` |

---

## Point Grok video 1.5 at the edited still

```text
save_edited_still_url → prep_grok_video_start → grok_video_start
```

`prep_grok_video_start` resolves `still_url` from `save_edited_still_url` first (see `n8n-code-prep-grok-video-start.js`).

`grok_video_start` body (unchanged model):

```text
={{ $('prep_grok_video_start').first().json.grok_video_body_json }}
```

Or:

```text
={{ JSON.stringify({ model: 'grok-imagine-video-1.5', prompt: $('prep_grok_video_start').first().json.video_motion_prompt, image: { url: $('prep_grok_video_start').first().json.still_url }, duration: 15, resolution: '1080p' }) }}
```

Do **not** point `image.url` at `save_still_url` once this edit path exists — use prep’s `still_url` (edited or original).

---

## Smoke test

1. Run through `save_still_url` — note original URL  
2. Set `still_edit_prompt` = `Remove any duplicate props. Keep the hero product and lighting unchanged.`  
3. `grok_imagine_edit_still` returns a different URL  
4. `prep_grok_video_start.still_url` = edited URL  
5. `grok_video_start` (`grok-imagine-video-1.5`) animates the edited frame  

Reply **`still edit ok`** + original URL + edited URL when green.

---

## Related

- Video nodes: `n8n-build-grok-imagine-video-nodes.md`  
- Prep edit: `n8n-code-prep-still-edit.js`  
- Prep video: `n8n-code-prep-grok-video-start.js`
