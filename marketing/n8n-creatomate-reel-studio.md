# PBVita — Reel Studio (Creatomate + n8n)

**Owner:** Salvatore  
**New workflow name:** `PBVita — Reel Studio`  
**Source to duplicate:** your **live spotlight / video workflow** (the canvas you screenshotted) — **not** a separate “Buffer daily” workflow.

> Go **one node at a time**. Execute → confirm → reply before the next.

---

## KEEP / DUPLICATE (quick)

| Word | Meaning |
|---|---|
| **Duplicate** | One-time copy of the **whole** live workflow |
| **KEEP** | In the copy, leave that node (do not delete). You already have it from the duplicate |
| **DELETE** | Remove from the **copy only** — live workflow stays untouched |
| **NEW** | Add in the copy |

**KEEP ≠ “don’t duplicate.”** Duplicate once → KEEP the front half → DELETE Buffer/Grok-video tail → NEW Creatomate nodes.

---

## Your live canvas (exact names)

```text
Schedule Trigger ──┐
Manual Execute ────┴─→ Get row(s) in sheet
  → filter_active
  → Sort
  → Limit
  → Prep_day_variant
  → Edit Fields1
  → GROK_API
  → Parse_Grok
  → Wait
  → GROK_Imagine
  → Grok_imagine_story
  → grok_imagine_reel_still
  → Save_render_URL
  → grok_video_start
  → wait_video
  → grok_video_poll
  → if_video_ready
       false → wait_video (loop)
       true  → save_video_url
            → buffer_ig_reel
            → buffer_fb_reel
            → Buffer_post_IG
            → Buffer_post_FB
            → Buffer_IG_story
            → Buffer_FB_story
            → Update row in sheet
```

**Do not rename nodes on the live workflow.** Creatomate work happens only on the duplicate.

---

## What Creatomate Reel Studio is

| Live workflow (keep running) | Reel Studio duplicate |
|---|---|
| Grok Imagine stills + `grok_video_*` + Buffer posts | Optional **template** MP4 path via Creatomate |
| Posts IG/FB reels + feed + stories | Writes to Sheets `4-reel-queue` first — **no Buffer** until you approve |

Same FDA rules. Same `Parse_Grok` science fields.

---

## Phase 0 — Outside n8n (once)

1. Creatomate account + API key → n8n Header Auth `Creatomate PBVita` (`Authorization: Bearer …`)
2. Template **9:16** with dynamic: `Headline`, `Subhead`, `Bullet-1`, `Bullet-2`, `Bullet-3`, `CTA`, `Disclaimer` (+ optional `Hook`)
3. Copy `template_id` + API Integration cURL
4. Sheets tab **`4-reel-queue`** from `marketing/sheets/4-reel-queue.csv`

---

## Phase 1 — Duplicate + strip

1. Open the live workflow (screenshot canvas)
2. **⋯ → Duplicate**
3. Rename copy → **`PBVita — Reel Studio`**
4. Save

### DELETE from the copy only

| Delete |
|---|
| `Wait` (the one before Imagine) |
| `GROK_Imagine` |
| `Grok_imagine_story` |
| `grok_imagine_reel_still` |
| `Save_render_URL` |
| `grok_video_start` |
| `wait_video` |
| `grok_video_poll` |
| `if_video_ready` |
| `save_video_url` |
| `buffer_ig_reel` |
| `buffer_fb_reel` |
| `Buffer_post_IG` |
| `Buffer_post_FB` |
| `Buffer_IG_story` |
| `Buffer_FB_story` |
| `Update row in sheet` |

### KEEP in the copy

| Keep |
|---|
| `When clicking 'Execute workflow'` (use this for smoke tests) |
| `Schedule Trigger` (disable for now, or leave disconnected) |
| `Get row(s) in sheet` |
| `filter_active` |
| `Sort` |
| `Limit` |
| `Prep_day_variant` |
| `Edit Fields1` |
| `GROK_API` |
| `Parse_Grok` |

After strip, canvas should look like:

```text
Manual Execute → Get row(s) in sheet → filter_active → Sort → Limit
  → Prep_day_variant → Edit Fields1 → GROK_API → Parse_Grok
  → (empty — we add Creatomate next)
```

**Stop. Reply: “Phase 1 done”.**

---

## Target chain (after Creatomate nodes)

```text
Manual Execute
  → Get row(s) in sheet
  → filter_active → Sort → Limit
  → Prep_day_variant          (TWEAK: template_id)
  → Edit Fields1
  → GROK_API
  → Parse_Grok
  → if_compliance             ← NEW (if you don’t already gate)
  → map_creatomate_mods       ← NEW
  → creatomate_render         ← NEW
  → wait_creatomate           ← NEW
  → creatomate_status         ← NEW
  → if_creatomate_ready       ← NEW
       false → wait_creatomate (loop)
       true  → save_creatomate_url → sheets_append_reel
```

New nodes = **lowercase** (same rule as your `grok_video_*` nodes).

---

## Phase 2 — Confirm KEEP nodes (one by one)

### Node 1 — `When clicking 'Execute workflow'`
**Action:** KEEP  
**Before:** `Get row(s) in sheet`  
**Check:** Workflow name is `PBVita — Reel Studio`. Live workflow still has Buffer + video nodes.

### Node 2 — `Get row(s) in sheet`
**Action:** KEEP  
**After:** Manual Execute  
**Before:** `filter_active`  
**Check:** Same spreadsheet / pens sheet as live.

### Node 3 — `filter_active`
**Action:** KEEP  
**After:** Get row(s)  
**Before:** `Sort`  
**Check:** Active rows only.

### Node 4 — `Sort`
**Action:** KEEP  
**After:** `filter_active`  
**Before:** `Limit`

### Node 5 — `Limit`
**Action:** KEEP  
**After:** `Sort`  
**Before:** `Prep_day_variant`  
**Check:** Max Items = **1**.

### Node 6 — `Prep_day_variant`
**Action:** KEEP + TWEAK  
**After:** `Limit`  
**Before:** `Edit Fields1`  

Add (Include Other Input Fields ON):

| Name | Value |
|---|---|
| `template_id` | your Creatomate template UUID |

Keep your existing `daily_video_format` / `daily_motion_brief` / stamp fields if present (harmless for Creatomate).

### Node 7 — `Edit Fields1`
**Action:** KEEP  
**After:** `Prep_day_variant`  
**Before:** `GROK_API`  
**Check:** Still builds system/user prompts like live.

### Node 8 — `GROK_API`
**Action:** KEEP  
**After:** `Edit Fields1`  
**Before:** `Parse_Grok`  
**Check:** Same xAI auth; chat completions succeed.

### Node 9 — `Parse_Grok`
**Action:** KEEP  
**After:** `GROK_API`  
**Before:** `if_compliance` / `map_creatomate_mods`  

**Check:** Note exact field names in output (you may still have `figma_headline` / `figma_subhead` from Parse — that’s OK). Paste one sample key list when we map Creatomate.

**Stop after Node 9.** Next = NEW Creatomate nodes.

---

## Phase 3 — NEW Creatomate nodes (lowercase)

### Node 10 — `if_compliance` (NEW — recommended)
**After:** `Parse_Grok`  
**Before (true):** `map_creatomate_mods`  
**Before (false):** end  

Condition: `{{ $json.compliance_ok }}` is true.  
If you already enforce compliance inside `Parse_Grok` only, you can skip — but IF is safer.

---

### Node 11 — `map_creatomate_mods` (NEW)
**After:** `if_compliance` true (or `Parse_Grok`)  
**Before:** `creatomate_render`  
Type: **Edit Fields** · Include Other Input Fields ON  

Use your real Parse keys (fallback both styles):

| Name | Value |
|---|---|
| `mod_Headline` | `={{ $json.figma_headline \|\| $json.headline \|\| $json.display_name \|\| $json.compound_name }}` |
| `mod_Subhead` | `={{ $json.figma_subhead \|\| $json.subhead }}` |
| `mod_Bullet_1` | `={{ $json.figma_bullet_1 \|\| $json.bullet_1 }}` |
| `mod_Bullet_2` | `={{ $json.figma_bullet_2 \|\| $json.bullet_2 }}` |
| `mod_Bullet_3` | `={{ $json.figma_bullet_3 \|\| $json.bullet_3 }}` |
| `mod_CTA` | `={{ $json.figma_cta \|\| $json.cta \|\| 'View laboratory listing' }}` |
| `mod_Disclaimer` | `For laboratory research use only. Not for human use or consumption.` |
| `template_id` | `={{ $('Prep_day_variant').item.json.template_id }}` |

---

### Node 12 — `creatomate_render` (NEW)
**After:** `map_creatomate_mods`  
**Before:** `wait_creatomate`  
Type: **HTTP Request**

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.creatomate.com/v2/renders` |
| Auth | `Creatomate PBVita` Header Auth |
| Body | JSON / fx |

```text
={{ JSON.stringify({
  template_id: $json.template_id,
  modifications: {
    'Headline': $json.mod_Headline,
    'Subhead': $json.mod_Subhead,
    'Bullet-1': $json.mod_Bullet_1,
    'Bullet-2': $json.mod_Bullet_2,
    'Bullet-3': $json.mod_Bullet_3,
    'CTA': $json.mod_CTA,
    'Disclaimer': $json.mod_Disclaimer
  }
}) }}
```

Or Import cURL from Creatomate, then swap mods to expressions.

**Check:** `id` + `status` planned.

---

### Node 13 — `wait_creatomate` (NEW)
**After:** `creatomate_render` or loop  
**Before:** `creatomate_status`  
Type: **Wait** · **70** seconds (tune later).

---

### Node 14 — `creatomate_status` (NEW)
**After:** `wait_creatomate`  
**Before:** `if_creatomate_ready`  
Type: **HTTP Request** · GET  

```text
={{ 'https://api.creatomate.com/v1/renders/' + $('creatomate_render').item.json.id }}
```

Same Creatomate auth. (If POST returned array, use `.json[0].id`.)

---

### Node 15 — `if_creatomate_ready` (NEW)
**After:** `creatomate_status`  

| Branch | Condition |
|---|---|
| true (ready) | `status` equals `succeeded` |
| false (loop) | `status` matches `(planned\|waiting\|rendering\|transcribing)` |

- false → `wait_creatomate`  
- failed → stop (optional third IF / Switch)  
- true → `save_creatomate_url`

---

### Node 16 — `save_creatomate_url` (NEW)
**After:** `if_creatomate_ready` true  
**Before:** `sheets_append_reel`  
Type: **Edit Fields**

| Name | Value |
|---|---|
| `video_url` | `={{ $json.url }}` |
| `creatomate_render_id` | `={{ $json.id }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name \|\| $('Parse_Grok').item.json.display_name }}` |
| `ig_caption_draft` | `={{ $('Parse_Grok').item.json.ig_caption_draft }}` |
| `template_id` | `={{ $('map_creatomate_mods').item.json.template_id }}` |
| `created_at` | `={{ $now.toISO() }}` |
| `used_in_buffer` | `no` |

**Check:** Open `video_url` — template MP4 looks right.

---

### Node 17 — `sheets_append_reel` (NEW)
**After:** `save_creatomate_url`  
Type: Google Sheets **Append** → tab **`4-reel-queue`**

**No Buffer nodes in this workflow yet.**

---

## Cheat sheet

| # | Node | Action |
|---|---|---|
| 1 | When clicking Execute | KEEP |
| 2 | Get row(s) in sheet | KEEP |
| 3 | filter_active | KEEP |
| 4 | Sort | KEEP |
| 5 | Limit | KEEP |
| 6 | Prep_day_variant | KEEP+TWEAK |
| 7 | Edit Fields1 | KEEP |
| 8 | GROK_API | KEEP |
| 9 | Parse_Grok | KEEP |
| 10 | if_compliance | NEW |
| 11 | map_creatomate_mods | NEW |
| 12 | creatomate_render | NEW |
| 13 | wait_creatomate | NEW |
| 14 | creatomate_status | NEW |
| 15 | if_creatomate_ready | NEW |
| 16 | save_creatomate_url | NEW |
| 17 | sheets_append_reel | NEW |

---

## Smoke checklist

- [ ] Live canvas unchanged (still has `buffer_ig_reel`, `grok_video_*`, etc.)  
- [ ] Reel Studio is a **duplicate** with Buffer/video nodes **deleted**  
- [ ] Front half through `Parse_Grok` still works (Limit=1)  
- [ ] Creatomate MP4 lands in `4-reel-queue`  

---

## Next

**Phase 1 now:** Duplicate your screenshot workflow → rename `PBVita — Reel Studio` → DELETE the strip list → reply **“Phase 1 done”**.
