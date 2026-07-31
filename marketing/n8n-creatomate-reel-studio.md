# PBVita — Reel Studio (Creatomate + n8n)

**Owner:** Salvatore (designer)  
**Workflow name in n8n:** `PBVita — Reel Studio`  
**Purpose:** FDA-compliant **9:16 reel MP4s** via Creatomate. Separate from the live Buffer daily workflow.

> Go **one node at a time**. After each: Execute → confirm → reply before the next.

---

## KEEP / DUPLICATE / NEW / DELETE

| Word | Meaning |
|---|---|
| **Duplicate** | One-time copy of your **live Buffer daily** workflow |
| **KEEP** | In the copy, **leave this node** (do not delete). You already have it from the duplicate |
| **TWEAK** | KEEP + change a setting |
| **NEW** | Add a fresh node |
| **DELETE / STRIP** | Remove from the copy only |

**KEEP ≠ skip duplicating.** Duplicate once → KEEP the Grok front half → DELETE image/Buffer tail → NEW Creatomate nodes.

---

## Your current live nodes (source of truth)

Duplicate **this** chain (Buffer daily), not any Figma-named workflow:

```text
Schedule (daily)
  → Sheets read queue
  → Filter Active
  → Pick_week_compound      (if present)
  → Prep_day_variant
  → Limit                   (if present; Max Items = 1)
  → Grok                    (HTTP / Build body — whatever you use)
  → Parse_Grok
  → IF compliance_ok
       → Build_spotlight_html
       → Render_spotlight
       → Save_render_url
       → Create a post      (Buffer)
       → Sheets writeback   (if present)
```

Disabled leftovers you may still see on canvas (do **not** re-enable in Reel Studio):  
`Wait`, `Figma_export`, `Resolve_Image`, `Save_figma_image` — **DELETE** them from the Reel copy.

### Field names (no `figma_`)

Use Parse_Grok fields as you have them now:

| Use in Reel Studio | Typical Parse_Grok key |
|---|---|
| Headline | `headline` |
| Subhead | `subhead` |
| Bullets | `bullet_1`, `bullet_2`, `bullet_3` |
| CTA | `cta` |
| Captions | `ig_caption_draft`, `fb_caption_draft` |
| Hook / VO | `reel_hook` or `tiktok_hook`; `vo_script` or `tiktok_script_draft` |
| Gate | `compliance_ok`, `compliance_flags` |

> If your Parse_Grok still shows old keys when you Execute, tell me the exact keys from the output panel — we map to those. Do **not** rename live Buffer Parse until Reel Studio is stable.

---

## Phase 0 — Outside n8n (once)

### 0A) Creatomate
1. [creatomate.com](https://creatomate.com) — trial OK  
2. API key → n8n Header Auth credential `Creatomate PBVita`  
   - Header name: `Authorization`  
   - Value: `Bearer YOUR_KEY`

### 0B) Template 9:16
Dynamic element names (match exactly in HTTP mods):

| Dynamic name | Maps from |
|---|---|
| `Headline` | `headline` |
| `Subhead` | `subhead` |
| `Bullet-1` | `bullet_1` |
| `Bullet-2` | `bullet_2` |
| `Bullet-3` | `bullet_3` |
| `CTA` | `cta` |
| `Disclaimer` | fixed research-use line |
| `Hook` | `reel_hook` / `tiktok_hook` (optional) |

Copy **template_id** + API Integration **cURL**.

### 0C) Sheets tab `4-reel-queue`
Import `marketing/sheets/4-reel-queue.csv` (headers only).

---

## Phase 1 — Duplicate + strip

1. Open your **live Buffer daily** workflow  
2. **⋯ → Duplicate**  
3. Rename → **`PBVita — Reel Studio`**  
4. Save  

### DELETE from the Reel copy only

| Delete | Why |
|---|---|
| `Build_spotlight_html` | Still-image path |
| `Render_spotlight` | HCTI still render |
| `Save_render_url` | Still URL for Buffer |
| `Create a post` | Buffer — keep live workflow only |
| Sheets writeback that updates Buffer/spotlight post counts | Don’t touch daily rotation from Reel runs |
| `Figma_export`, `Resolve_Image`, `Save_figma_image`, old `Wait` | Dead Figma path |

### KEEP in the Reel copy

| Keep |
|---|
| Trigger (`Schedule` → change to **Manual Trigger** for smoke tests, or leave Schedule disabled) |
| Sheets read (`1-compounds-pens`) |
| `Filter Active` |
| `Pick_week_compound` (if you use it) |
| `Prep_day_variant` |
| `Limit` (must be 1) |
| `Grok` (+ Build body node if you have one) |
| `Parse_Grok` |
| `IF` / compliance gate |
| False-path stop/log if you have one |

**Stop. Reply: “Phase 1 done”** before Node tweaks.

---

## Target chain after strip

```text
Manual_Trigger          (or Schedule — prefer Manual for first tests)
  → Sheets_Read
  → Filter Active
  → Pick_week_compound  (KEEP if present)
  → Prep_day_variant    (TWEAK: add template_id)
  → Limit
  → Grok
  → Parse_Grok
  → IF compliance_ok
       false → (stop / log)
       true  → Map_Creatomate_Mods      ← NEW
            → Creatomate_Render         ← NEW
            → Wait_Render               ← NEW
            → Creatomate_Status         ← NEW
            → Switch_Status             ← NEW
                 succeeded → Save_Reel_URL → Sheets_Append_Reel
                 processing → Wait_Render
                 failed → Log_Render_Fail
```

---

## Phase 2 — KEEP nodes one by one

### Node 1 — Trigger
**Action:** KEEP (+ optional rename to Manual for tests)  
**After:** —  
**Before:** Sheets read  
**Check:** Workflow title = `PBVita — Reel Studio`. Live Buffer workflow still has its own Schedule.

### Node 2 — Sheets read
**Action:** KEEP  
**After:** Trigger  
**Before:** `Filter Active`  
**Check:** Sheet `1-compounds-pens`; rows return.

### Node 3 — `Filter Active`
**Action:** KEEP  
**After:** Sheets read  
**Before:** `Pick_week_compound` or `Limit`  
**Check:** `status` = `Active`.

### Node 4 — `Pick_week_compound` (if present)
**Action:** KEEP  
**After:** `Filter Active`  
**Before:** `Prep_day_variant`  
**Check:** One week’s compound logic still works (or bypass with a compound_id filter for smoke).

### Node 5 — `Prep_day_variant`
**Action:** KEEP + TWEAK  
**After:** Pick / Filter  
**Before:** `Limit` or `Grok`  
**Include Other Input Fields:** ON  

Add:

| Name | Value |
|---|---|
| `template_id` | your Creatomate template UUID |
| `output_format` | `reel_9x16` |

Keep existing `daily_angle` / `daily_image_brief` if already set. Optional reel angle:

| Name | Value |
|---|---|
| `daily_angle` | `Reel / short-form catalog identity` (or leave weekday map) |

**Check:** 1 item path still has `compound_name` + new `template_id`.

### Node 6 — `Limit`
**Action:** KEEP  
**After:** `Prep_day_variant` (or Filter)  
**Before:** `Grok`  
**Check:** Max Items = **1**.

### Node 7 — `Grok` (+ body builder if any)
**Action:** KEEP  
**After:** `Limit` / Prep  
**Before:** `Parse_Grok`  
**TWEAK (user prompt add-on only):**

```text
This run is PBVita Reel Studio (Creatomate). Prioritize on-screen creative brief
(headline, subhead, 3 bullets, CTA), a short reel hook, and 12-20s science-only VO.
IG/FB captions still need the mandatory disclaimer. Not for Buffer.
```

**Check:** Same xAI credential as live Buffer; JSON content returns.

### Node 8 — `Parse_Grok`
**Action:** KEEP  
**After:** `Grok`  
**Before:** IF compliance  
**Check:** Output shows `headline`, `subhead`, `bullet_1/2/3`, `cta`, `ig_caption_draft`, `compliance_ok` (your real keys). No nicknames. Disclaimer on captions.

### Node 9 — IF `compliance_ok`
**Action:** KEEP  
**After:** `Parse_Grok`  
**Before (true):** `Map_Creatomate_Mods`  
**Before (false):** stop/log  
**Check:** True only when compliant.

**Stop after Node 9.** Next = NEW Creatomate nodes.

---

## Phase 3 — NEW Creatomate nodes

### Node 10 — `Map_Creatomate_Mods`
**Action:** NEW  
**After:** IF true  
**Before:** `Creatomate_Render`  
Type: **Edit Fields** · Include Other Input Fields: **ON**

| Name | Value |
|---|---|
| `mod_Headline` | `={{ $json.headline \|\| $json.compound_name }}` |
| `mod_Subhead` | `={{ $json.subhead }}` |
| `mod_Bullet_1` | `={{ $json.bullet_1 }}` |
| `mod_Bullet_2` | `={{ $json.bullet_2 }}` |
| `mod_Bullet_3` | `={{ $json.bullet_3 }}` |
| `mod_CTA` | `={{ $json.cta \|\| 'View laboratory listing' }}` |
| `mod_Disclaimer` | `For laboratory research use only. Not for human use or consumption.` |
| `mod_Hook` | `={{ $json.reel_hook \|\| $json.tiktok_hook \|\| $json.headline }}` |
| `template_id` | `={{ $json.template_id \|\| $('Prep_day_variant').item.json.template_id }}` |

**Check:** mods filled; chemical names only.

---

### Node 11 — `Creatomate_Render`
**Action:** NEW  
**After:** `Map_Creatomate_Mods`  
**Before:** `Wait_Render`  
Type: **HTTP Request**

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.creatomate.com/v2/renders` |
| Auth | Header Auth → `Creatomate PBVita` |
| Body | JSON |

Import Creatomate **cURL**, then set modifications from mods:

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
    'Disclaimer': $json.mod_Disclaimer,
    'Hook': $json.mod_Hook
  }
}) }}
```

**Check:** `status` ≈ `planned`; note `id`.

---

### Node 12 — `Wait_Render`
**Action:** NEW  
**After:** `Creatomate_Render` or processing loop  
**Before:** `Creatomate_Status`  
Type: **Wait** · start **70s** (tune from Creatomate API Log).

---

### Node 13 — `Creatomate_Status`
**Action:** NEW  
**After:** `Wait_Render`  
**Before:** `Switch_Status`  
Type: **HTTP Request** · GET  

```text
={{ 'https://api.creatomate.com/v1/renders/' + $('Creatomate_Render').item.json.id }}
```

(If POST returned an array, use `$('Creatomate_Render').item.json[0].id`.)

Same Creatomate auth.

---

### Node 14 — `Switch_Status`
**Action:** NEW  
**After:** `Creatomate_Status`  

| Output | Rule |
|---|---|
| `succeeded` | `status` equals `succeeded` |
| `failed` | `status` equals `failed` |
| `processing` | matches `(planned\|transcribing\|waiting\|rendering)` |

- processing → `Wait_Render`  
- failed → `Log_Render_Fail`  
- succeeded → `Save_Reel_URL`

---

### Node 15 — `Log_Render_Fail`
**Action:** NEW  
**After:** Switch failed  
Fields: `stopped=creatomate_failed`, error message from response.

---

### Node 16 — `Save_Reel_URL`
**Action:** NEW  
**After:** Switch succeeded  
**Before:** `Sheets_Append_Reel`  

| Name | Value |
|---|---|
| `video_url` | `={{ $json.url }}` |
| `creatomate_render_id` | `={{ $json.id }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name }}` |
| `reel_hook` | `={{ $('Map_Creatomate_Mods').item.json.mod_Hook }}` |
| `headline` | `={{ $('Parse_Grok').item.json.headline }}` |
| `subhead` | `={{ $('Parse_Grok').item.json.subhead }}` |
| `bullet_1` | `={{ $('Parse_Grok').item.json.bullet_1 }}` |
| `bullet_2` | `={{ $('Parse_Grok').item.json.bullet_2 }}` |
| `bullet_3` | `={{ $('Parse_Grok').item.json.bullet_3 }}` |
| `cta` | `={{ $('Parse_Grok').item.json.cta }}` |
| `ig_caption_draft` | `={{ $('Parse_Grok').item.json.ig_caption_draft }}` |
| `template_id` | `={{ $('Map_Creatomate_Mods').item.json.template_id }}` |
| `compliance_ok` | `={{ $('Parse_Grok').item.json.compliance_ok }}` |
| `compliance_flags` | `={{ $('Parse_Grok').item.json.compliance_flags }}` |
| `created_at` | `={{ $now.toISO() }}` |
| `used_in_buffer` | `no` |

**Check:** Open `video_url` — MP4 OK, chemical name, disclaimer on-screen.

---

### Node 17 — `Sheets_Append_Reel`
**Action:** NEW  
**After:** `Save_Reel_URL`  
Google Sheets **Append** → tab **`4-reel-queue`** · map columns above.

---

## Cheat sheet

| # | Node | Action | After | Before |
|---|---|---|---|---|
| 1 | Trigger | KEEP | — | Sheets |
| 2 | Sheets read | KEEP | Trigger | Filter Active |
| 3 | Filter Active | KEEP | Sheets | Pick / Limit |
| 4 | Pick_week_compound | KEEP | Filter | Prep_day_variant |
| 5 | Prep_day_variant | KEEP+TWEAK | Pick/Filter | Limit |
| 6 | Limit | KEEP | Prep | Grok |
| 7 | Grok | KEEP | Limit | Parse_Grok |
| 8 | Parse_Grok | KEEP | Grok | IF |
| 9 | IF compliance_ok | KEEP | Parse_Grok | Map / stop |
| 10 | Map_Creatomate_Mods | NEW | IF true | Creatomate_Render |
| 11 | Creatomate_Render | NEW | Map | Wait_Render |
| 12 | Wait_Render | NEW | Render/loop | Creatomate_Status |
| 13 | Creatomate_Status | NEW | Wait | Switch_Status |
| 14 | Switch_Status | NEW | Status | Save / Wait / Fail |
| 15 | Log_Render_Fail | NEW | failed | end |
| 16 | Save_Reel_URL | NEW | succeeded | Sheets_Append_Reel |
| 17 | Sheets_Append_Reel | NEW | Save_Reel_URL | end |

---

## Smoke checklist

- [ ] Live Buffer daily untouched (still has `Create a post` + `Render_spotlight`)  
- [ ] Reel Studio is a **duplicate**  
- [ ] No `Build_spotlight_html` / `Render_spotlight` / `Create a post` in Reel Studio  
- [ ] No `figma_*` node names in Reel Studio  
- [ ] Limit = 1 → Grok → compliance still works  
- [ ] Creatomate MP4 on-brand; row in `4-reel-queue`  

---

## How we proceed

1. **Phase 1** — duplicate Buffer daily → strip image/Buffer nodes  
2. Reply **“Phase 1 done”** and paste your **exact KEEP node names** from the canvas (in order) if any differ  
3. We confirm Node 1 → Node 9, then add Creatomate nodes one at a time
