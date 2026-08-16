# Still edit before Grok Imagine video 1.5

**Goal:** After Grok creates the still, optionally **edit the image** (add or remove parts) with a text instruction, then send the **edited** still into **`grok-imagine-video-1.5`**.

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  
**Still edit API:** `POST https://api.x.ai/v1/images/edits` · `grok-imagine-image-2.0`  
**Video API:** `POST https://api.x.ai/v1/videos/generations` · `grok-imagine-video-1.5`  
**Auth:** same xAI Header Auth as `grok_imagine_reel_still` / `grok_video_start`

---

## Wire (daily Vid_gen)

```text
pick_creation
  → grok_imagine_reel_still
  → still_edit_instructions
  → flag_still_edit
  → if
       true  → prep_still_edit → grok_imagine_edit_still → save_still_url
       false → save_still_url
  → prep_grok_video_start → grok_video_start → wait → poll → save_video_url
```

`save_still_url` is **after** the edit on this path — do not make `prep_still_edit` depend on it.

---

## Node A — `still_edit_instructions`

**Type:** Edit Fields (Set)  
**Before → this → After:** `grok_imagine_reel_still` → **still_edit_instructions** → `flag_still_edit`  
Include Other Input Fields: **ON**

| Name | Mode | Value |
|---|---|---|
| `still_url` | Expression | `={{ $('grok_imagine_reel_still').first().json.data[0].url }}` |
| `still_edit_prompt` | **Fixed** (change each run) | required — Sheet 9 column is blank; one Fixed field only (no duplicate empty) |
| `aspect_ratio` | Expression | `={{ $('pick_creation').first().json.aspect_ratio \|\| '9:16' }}` |
| `model_still` | Expression | `={{ $('pick_creation').first().json.model_still \|\| 'grok-imagine-image-2.0' }}` |
| `creation_id` | Expression | `={{ $('pick_creation').first().json.creation_id }}` |

### Prompt examples

| Intent | Example |
|---|---|
| Remove | `Remove the second vial on the left. Keep everything else identical — same lighting, camera, and product label.` |
| Add | `Add one small crimped-seal research vial on the right edge of the surface. Keep the rest of the scene identical.` |
| Both | `Remove the hanging plant on the left. Add a single sealed research pen on the table near the hero product. Keep 9:16, no people, no needles.` |

Always say **what must stay the same** so Grok doesn’t restyle the whole frame.

---

## Node B — `flag_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `still_edit_instructions` → **flag_still_edit** → `if`

Paste: `marketing/n8n-code-flag-still-edit.js`

Sets `do_still_edit: true` (boolean) and backfills `still_url` from `grok_imagine_reel_still` if blank.

---

## Node C — `if`

**Type:** IF  

Condition: `{{ $json.do_still_edit }}` **equals** boolean **`true`** (not the string `"true"`).

- **true** → `prep_still_edit` → …  
- **false** → `save_still_url`

---

## Node D — `prep_still_edit`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `if` (true) → **prep_still_edit** → `grok_imagine_edit_still`

Paste: `marketing/n8n-code-prep-still-edit.js` (replace any older “still_url missing” snippet).

**Check:** `still_edit_body_json` + `source_still_url` (https).

---

## Node E — `grok_imagine_edit_still`

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
  "model": "grok-imagine-image-2.0",
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

## Node F — `save_still_url`

**Type:** Edit Fields  
Wire **both** IF branches here.

**Before → this → After:** `grok_imagine_edit_still` *or* `if` (false) → **save_still_url** → `prep_grok_video_start`

Include Other Input Fields: **ON**

| Name | Value (fx ON) |
|---|---|
| `still_url` | `={{ $json.data[0].url \|\| $json.still_url \|\| $json.source_still_url }}` |
| `creation_id` | `={{ $json.creation_id \|\| $('pick_creation').first().json.creation_id }}` |
| `video_motion_prompt` | `={{ $json.video_motion_prompt \|\| $('pick_creation').first().json.video_motion_prompt }}` |

---

## Point Grok video 1.5 at the edited still

```text
save_still_url → prep_grok_video_start → grok_video_start
```

`prep_grok_video_start` resolves `still_url` from `save_still_url` (see `n8n-code-prep-grok-video-start.js`).

`grok_video_start` body:

```text
={{ $('prep_grok_video_start').first().json.grok_video_body_json }}
```

---

## Smoke test

1. Fix `still_url` on instructions → grok node expression above  
2. Re-paste `flag_still_edit` + `prep_still_edit` Code from repo  
3. IF true → `prep_still_edit` shows https `source_still_url`  
4. `grok_imagine_edit_still` returns a different URL  
5. `save_still_url.still_url` = edited URL → video  

Reply **`still edit ok`** + original URL + edited URL when green.

---

## Related

- Flag: `n8n-code-flag-still-edit.js`  
- Prep edit: `n8n-code-prep-still-edit.js`  
- Prep video: `n8n-code-prep-grok-video-start.js`  
- Video nodes: `n8n-build-grok-imagine-video-nodes.md`
