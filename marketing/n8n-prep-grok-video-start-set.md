# `prep_grok_video_start` as Edit Fields (no Code)

Same job as the Code node, but using **Edit Fields** + a JSON string — the pattern that already worked for `still_edit_body_json`.

**Important:** do **not** hardcode `gentle push-in`. Use Sheet 9’s unique `video_motion_prompt` / `camera_move` from `pick_creation` so each day has a different shot.

```text
save_edited_still_url → **prep_grok_video_start** → grok_video_start
```

---

## Why videos felt the same

The easy Set expression used one fixed prompt:

`Slow cinematic camera: gentle push-in...`

That ignored the **500 unique** `camera_move` / `video_motion_prompt` values on `9-lab-item-creations-500`.

---

## Node — `prep_grok_video_start`

| Setting | Value |
|---|---|
| Type | **Edit Fields** (Set) |
| Name | `prep_grok_video_start` |
| Include Other Input Fields | **ON** |

| Name | fx | Value |
|---|---|---|
| `still_url` | **ON** | `={{ $json.still_url }}` |
| `video_motion_prompt` | **ON** | paste expression A below |
| `grok_video_body_json` | **ON** | paste expression B below |

### A) `video_motion_prompt` (fx ON)

```text
={{
  String(
    $json.video_motion_prompt
    || $('pick_creation').item?.json?.video_motion_prompt
    || $('save_still_url').item?.json?.video_motion_prompt
    || (
      'Slow cinematic camera: ' +
      String($('pick_creation').item?.json?.camera_move || 'gentle push-in') +
      '. Keep the exact same scene, materials, and lighting from the still. No orbit. No new objects. No people, hands, faces, needles, watermarks, or burn-in.'
    )
  ).slice(0, 700)
}}
```

### B) `grok_video_body_json` (fx ON)

```text
={{ JSON.stringify({ model: 'grok-imagine-video-1.5', prompt: $json.video_motion_prompt, image: { url: $json.still_url }, duration: 15, resolution: '1080p' }) }}
```

> In n8n Set nodes, field **B** may read the **incoming** `$json`, not field A you just set. If `prompt` comes out empty/wrong, use this single-field version instead (delete field A, only keep `still_url` + body):

```text
={{ JSON.stringify({ model: 'grok-imagine-video-1.5', prompt: String($json.video_motion_prompt || $('pick_creation').item?.json?.video_motion_prompt || $('pick_creation').item?.json?.camera_move && ('Slow cinematic camera: ' + $('pick_creation').item.json.camera_move + '. Keep the exact same scene, materials, and lighting from the still. No orbit. No new objects. No people, hands, faces, needles, watermarks, or burn-in.') || 'Slow cinematic camera: gentle push-in. Keep the exact same scene, materials, and lighting from the still. No orbit. No new objects. No people, hands, faces, needles, watermarks, or burn-in.').slice(0, 700), image: { url: $json.still_url }, duration: 15, resolution: '1080p' }) }}
```

**Cleaner single expression (recommended):**

```text
={{ (() => { const pick = $('pick_creation').item?.json || {}; const motion = String($json.video_motion_prompt || pick.video_motion_prompt || (pick.camera_move ? ('Slow cinematic camera: ' + pick.camera_move + '. Keep the exact same scene, materials, and lighting from the still. No orbit. No new objects. No people, hands, faces, needles, watermarks, or burn-in.') : 'Slow cinematic camera: gentle push-in. Keep the exact same scene, materials, and lighting from the still. No orbit. No new objects. No people, hands, faces, needles, watermarks, or burn-in.')).slice(0, 700); return JSON.stringify({ model: 'grok-imagine-video-1.5', prompt: motion, image: { url: $json.still_url }, duration: 15, resolution: '1080p' }); })() }}
```

**Check:** open `grok_video_body_json` — `prompt` should mention today’s shot (e.g. `pull_back`, `vertical_rise`, `locked tripod`), **not** always `gentle push-in`.

---

## Import URL path note

`Manual_Trigger_Import` skips `pick_creation`, so there is **no sheet camera** unless you paste one. For import runs, either:

1. Leave the fallback push-in, or  
2. Add a Fixed `video_motion_prompt` on `import_still_url` / `still_edit_instructions` each run.

Daily sheet path uses unique cameras automatically via `pick_creation`.

---

## Next — `grok_video_start`

```text
prep_grok_video_start → **grok_video_start** → wait_video
```

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/videos/generations` |
| Auth | same xAI credential |
| Send Body | **ON** |
| Body Content Type | **JSON** |
| JSON (fx **ON**) | `={{ $json.grok_video_body_json }}` |
