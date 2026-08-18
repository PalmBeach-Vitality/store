# Camera diversity audit + plan (Grok video)

**Owner:** Salvatore  
**Goal:** Every new `grok_imagine_video` / `grok_video_start` call gets a **distinct camera angle, direction, and movement** — not the same orbit/push recipe.

---

## Double-check results (current library)

Audited `sheets/9-lab-item-creations-500.csv` + `n8n-code-pick-creation.js` + `n8n-build-grok-imagine-video-nodes.md`.

| Check | Result | Verdict |
|---|---|---|
| `video_motion_prompt` unique strings | **500 / 500** | Pass (text unique) |
| `video_prompt` unique | **500 / 500** | Pass |
| Adjacent ranks same `shot_family` | **0** | Pass |
| Hardcoded orbit sentence in pick/map | None | Pass |
| `grok_video_start` docs use `video_motion_prompt` | Yes (`prompt: …video_motion_prompt`, 15s, 1080p) | Pass if n8n matches docs |
| Unique `shot_family` values | **24** (was 16) | **Phase C done** |
| Unique `camera_move` recipes | **500 / 500** (was 16) | **Phase C done** |
| Unique `camera_angle` | **41** | **Phase C done** |
| Unique `camera_direction` | **24** | **Phase C done** |
| Adjacent ranks same `shot_family` | **0** | Pass |
| Word `orbit` in motion prompts | 3 hits — all from **lab item names** (orbitrap / orbital shaker), not camera instructions | OK |
| Phrase “around the subject” | In all 500 as **“never travel around the subject”** (anti-orbit guard) | OK |
| `pick_creation` diversification | Skips only **last 1** category + shot_family + camera_move | Partial |

### What this means

- Prompts are **string-unique**, but ~31 rows share the **same CAMERA recipe** (e.g. every `push_in` has identical move text).
- Grok mostly keys off the `CAMERA:` / `SHOT FAMILY:` clause → **motion can look repeated** even when subjects differ.
- Least-used rotation + “skip last family” helps day-to-day, but does **not** guarantee a new angle every time across a week of runs.

**Verdict:** Not yet “completely unique cameras per video.” Subject uniqueness is strong; **camera-language uniqueness is only 16-way.**

---

## Target definition

For each new video, the motion prompt must differ from recent runs in **all three**:

1. **Angle** — eye-level / low / high / top-down / 3⁄4-left / 3⁄4-right / profile  
2. **Direction** — in / out / up / down / left→right / right→left / tilt-up / tilt-down / static  
3. **Movement type** — push, pull, pedestal, crane, lateral track, locked hold, macro drift, etc.

Also: no orbital/circular path language (except product names like “orbitrap”).

---

## Plan (phased)

### Phase A — Confirm n8n wiring (today, no CSV change)

1. Open `grok_video_start` body → confirm:
   ```js
   prompt: $('pick_creation').first().json.video_motion_prompt
   // NOT a hardcoded sentence
   duration: 15
   resolution: '1080p'
   ```
2. Run 3 creations back-to-back; log `shot_family` + first 120 chars of `video_motion_prompt`.
3. Confirm `sheets_update_creation` bumps `times_used` (pick diversification depends on it).

### Phase B — Stronger pick rotation (quick code fix)

Update `pick_creation` to:

- Load last **8** used rows (by `last_used_at`), not just 1  
- Penalize / skip if `shot_family` is in that recent set  
- Penalize same `camera_move` and same `framing`  
- Still prefer lowest `times_used`

Result: consecutive days won’t reuse the same 16-recipe too soon.

### Phase C — Expand camera library (DONE)

Applied via:
- `marketing/scripts/camera_recipes.py` (723 unique recipes available; 24 families)
- `marketing/scripts/apply_unique_camera_recipes.py`

Results in Sheet 9:
- **500 unique `camera_move`**
- New columns: `camera_angle`, `camera_direction`
- Motion prompts include `CAMERA ANGLE` + `CAMERA DIRECTION` + unique `CAMERA:`
- Adjacent ranks never share `shot_family`

**n8n action:** replace-import `9-lab-item-creations-500.csv` + paste updated `n8n-code-pick-creation.js`.

### Phase D — Guardrails + verify script

Add `marketing/scripts/audit_camera_diversity.py` that fails if:

- unique `camera_move` < threshold  
- any motion prompt contains camera orbit/spin/circle/360  
- adjacent ranks share `shot_family`  
- duplicate full `video_motion_prompt`

Run after every rebuild.

### Phase E — Extends (if used)

`n8n-build-grok-imagine-video-nodes.md` still has a generic extend prompt (“slow cinematic camera motion”).  
If you use video extends: pass a **continuation of the same shot_family** (`Continue with the same CAMERA: …`) — never a new generic orbit line.

---

## Recommended order of work

1. **Phase A** — verify n8n prompt binding (5 min)  
2. **Phase B** — pick last-8 family skip (code)  
3. **Phase C** — rebuild CSV with per-row camera variants  
4. **Phase D** — audit script  
5. **Phase E** — only if extends are in the live chain  

---

## Success criteria

- [ ] `grok_video_start` preview shows distinct `CAMERA:` text each run  
- [ ] ≥ **200** unique `camera_move` values in Sheet 9 (stretch: 500)  
- [ ] Last 8 runs never repeat the same `shot_family`  
- [ ] Side-by-side MP4s show visibly different moves (push vs rise vs lateral vs static vs top-down)  
- [ ] No camera orbit/spin language in prompts  

---

## What is already good (keep)

- 500 unique subjects + unique still/motion prompt strings  
- Anti-orbit path language (“never travel around the subject”)  
- Rank interleave: no adjacent same `shot_family` in sheet order  
- Docs require `video_motion_prompt` @ 15s / 1080p  
