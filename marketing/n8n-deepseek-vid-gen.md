# DeepSeek prompt enhancer — Workflow A (Grok vid gen)

**Goal:** Before Grok still/video, DeepSeek rewrites `video_prompt` into a sharper cinematic research still prompt while keeping all PBVita rules (crimped vials, no doubles, FDA-only).

**Workflow:** `PBVita — Grok Daily` / Reel Studio vid gen  

---

## Wire

```text
pick_creation
  → deepseek_enhance_prompt      ← NEW (HTTP)
  → parse_deepseek_prompt        ← NEW (Code)
  → grok_imagine_reel_still
  → save_still_url
  → prep_grok_video_start
  → grok_video_start → …
```

---

## 1) Credential

n8n → Credentials → **Header Auth** (or Bearer):

| Field | Value |
|---|---|
| Name | `DeepSeek API` |
| Header / Auth | `Authorization` |
| Value | `Bearer YOUR_DEEPSEEK_API_KEY` |

Get key: [platform.deepseek.com](https://platform.deepseek.com)

---

## 2) Node — `deepseek_enhance_prompt`

**Type:** HTTP Request  
**After:** `pick_creation`  
**Before:** `parse_deepseek_prompt`

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.deepseek.com/chat/completions` |
| Authentication | Header Auth → `DeepSeek API` |
| Send Headers | OFF if Auth already sets Authorization; else Content-Type `application/json` |
| Send Body | ON |
| Body Content Type | **Raw** |
| Content-Type | `application/json` |
| Body (expression ON) | see below |

### Body (Raw + fx)

```js
={{
JSON.stringify({
  model: 'deepseek-v4-flash',
  thinking: { type: 'disabled' },
  temperature: 0.7,
  max_tokens: 2200,
  messages: [
    {
      role: 'system',
      content:
        'You rewrite Grok Imagine still prompts for Palm Beach Vitality research-catalog reels. ' +
        'Output ONLY valid JSON with keys video_prompt (string) and video_motion_prompt (string). No markdown. ' +
        'Rules you MUST keep: ' +
        '(1) Photoreal vertical 9:16 cinematic laboratory / peptide R&D / wellness industry scene — not a boring SKU cutout. ' +
        '(2) VIAL CLOSURE: every vial is a pharmaceutical injection vial with aluminum crimped seal over rubber septum — NO twist tops, NO screw caps. ' +
        '(3) NO DOUBLES: never tile/clone props or text; labels once only. ' +
        '(4) No people, hands, faces, needles, syringes, injection theater, watermarks, burn-in, scene titles, hex IDs. ' +
        '(5) For laboratory research use only. Not for human use or consumption. ' +
        '(6) Keep any compound label exact if present in the input. ' +
        '(7) video_prompt = rich still brief (environment-forward, photoreal materials). ' +
        '(8) video_motion_prompt = SHORT camera-only motion (under 500 chars): slow push/tilt/pedestal then hold — no orbit, no new objects. ' +
        'Make the still prompt more vivid and specific, but never break these rules.'
    },
    {
      role: 'user',
      content:
        'Rewrite this creation for Grok Imagine.\n\n' +
        'creation_id: ' + String($json.creation_id || '') + '\n' +
        'compound_name: ' + String($json.compound_name || '') + '\n' +
        'lab_item:\n' + String($json.lab_item || '') + '\n\n' +
        'camera_move: ' + String($json.camera_move || '') + '\n' +
        'shot_family: ' + String($json.shot_family || '') + '\n' +
        'camera_angle: ' + String($json.camera_angle || '') + '\n' +
        'camera_direction: ' + String($json.camera_direction || '') + '\n\n' +
        'CURRENT video_prompt:\n' + String($json.video_prompt || '') + '\n\n' +
        'CURRENT video_motion_prompt:\n' + String($json.video_motion_prompt || '') + '\n\n' +
        'Return JSON only: {"video_prompt":"...","video_motion_prompt":"..."}'
    }
  ]
})
}}
```

**Check:** response has `choices[0].message.content` with JSON containing `video_prompt`.

---

## 3) Node — `parse_deepseek_prompt`

**Type:** Code  
**Mode:** Run Once for All Items  
**After:** `deepseek_enhance_prompt`  
**Before:** `grok_imagine_reel_still`

Paste: `marketing/n8n-code-parse-deepseek-prompt.js`

**Check:** output includes:

| Field | Expect |
|---|---|
| `video_prompt` | enhanced still prompt (includes VIAL CLOSURE RULE) |
| `video_motion_prompt` | short camera line |
| `deepseek_ok` | `true` |
| `prompt_source` | `deepseek` |

If `deepseek_ok` is `false`, it fell back to Sheet prompts — open `deepseek_error`.

---

## 4) Downstream

`grok_imagine_reel_still` body stays:

```js
prompt: $json.video_prompt
```

(`$json` is now from `parse_deepseek_prompt`, not raw pick.)

`save_still_url` should pull motion from parse/pick:

```text
video_prompt = {{ $('parse_deepseek_prompt').first().json.video_prompt }}
video_motion_prompt = {{ $('parse_deepseek_prompt').first().json.video_motion_prompt }}
```

`prep_grok_video_start` still shortens motion if needed.

---

## Models

| Model | Use |
|---|---|
| `deepseek-v4-flash` | default (fast, cheap) + `thinking: { type: 'disabled' }` |
| `deepseek-v4-pro` | optional higher quality rewrite |

Do **not** use retired `deepseek-chat` / `deepseek-reasoner` names.

---

## Smoke test

1. Run through `parse_deepseek_prompt`  
2. Confirm `deepseek_ok: true` and prompt mentions **crimped** / **rubber septum**  
3. Run Grok still — open image  
4. Then video as usual  
