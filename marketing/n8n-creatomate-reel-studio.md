# PBVita — Reel Studio (Creatomate + n8n)

**Owner:** Salvatore (designer)  
**Workflow name in n8n:** `PBVita — Reel Studio`  
**Purpose:** Generate FDA-compliant **9:16 reel MP4s** via Creatomate from the same compound + Grok science pipeline. Separate from Buffer and from Figma Content Studio.

> We will go **one node at a time**. After each node: Execute → confirm output → stop and tell me before the next node.

---

## KEEP / DUPLICATE / NEW / DELETE — read this first

You asked: *“KEEP means we don’t need to duplicate, correct?”*

**No.** Here is the exact meaning:

| Word | What you do |
|---|---|
| **DUPLICATE workflow** | One-time: copy an existing workflow so Buffer / Figma Studio stay untouched |
| **KEEP** | In that copy, **leave this node** — do **not** delete it. You still “have” it because of the duplicate |
| **TWEAK** | KEEP the node, then change 1–2 settings / fields |
| **NEW** | Add a fresh node that did not exist before |
| **DELETE / STRIP** | Remove this node from the copy (Buffer, Figma export, etc.) |

**So:**
1. **Duplicate** Figma Content Studio (or copy the Sheets→Grok→IF segment) **once**.
2. **KEEP** Manual → Sheets → Filter → Limit → Prep → Grok → Parse → IF.
3. **DELETE** Figma / Imagine / Buffer / Sheets Figma-queue nodes from the copy.
4. **NEW** Creatomate render + wait + status + Sheets reel queue.

You are **not** rebuilding Grok from scratch. You are **not** skipping the duplicate step either.

---

## Preferred start method

### Option A (recommended)
1. Open workflow **`PBVita — Figma Content Studio`**
2. Top-right **⋯ → Duplicate**
3. Rename duplicate to **`PBVita — Reel Studio`**
4. Save
5. Follow **DELETE** list below, then we add Creatomate nodes one by one

### Option B (if Figma Studio not built yet)
1. Open the **Buffer daily** workflow
2. **⋯ → Duplicate** → rename `PBVita — Reel Studio`
3. **DELETE** every Buffer / Figma_export / social node
4. KEEP Sheets → Filter → Limit → Grok → Parse → IF

**Never edit the live Buffer workflow in place.**

---

## End-to-end chain (target)

```text
Manual_Trigger
  → Sheets_Read_Compounds
  → Filter_Active
  → Limit_1
  → Prep_Compound
  → Build_Grok_Body   (optional; KEEP if you already use it)
  → Grok
  → Parse_Grok
  → IF_Compliance
       false → Log_Flags
       true  → Map_Creatomate_Mods     ← NEW
            → Creatomate_Render        ← NEW
            → Wait_Render              ← NEW
            → Creatomate_Status        ← NEW
            → Switch_Status            ← NEW
                 succeeded → Save_Reel_URL → Sheets_Append_Reel
                 processing → back to Wait_Render
                 failed → Log_Render_Fail
```

---

## FDA hard rules (unchanged)

- Laboratory / in-vitro research only  
- Not for human use  
- Chemical names only (no KLOW / Wolverine / GLOW)  
- Mandatory disclaimer on captions + on-screen end card  
- No disease / structure-function / wellness claims  
- `compliance_ok !== true` → **do not** call Creatomate  

---

## Phase 0 — Outside n8n (do once before nodes)

### 0A) Creatomate account
1. Sign up at [creatomate.com](https://creatomate.com) (trial ~50 credits).
2. Copy API key (API Integration / project settings).
3. In n8n later: Credentials → **Header Auth**  
   - Name: `Authorization`  
   - Value: `Bearer YOUR_CREATOMATE_API_KEY`  
   - Credential label: `Creatomate PBVita`

### 0B) First template (9:16)
1. Templates → **New** → size **9:16 Vertical** (1080×1920).
2. Design to match brand card: deep navy, hex/grid, teal accents, chemical name dominant (`spotlight-card.html` look).
3. Create elements and mark **dynamic** (exact names matter for n8n):

| Dynamic name | Content |
|---|---|
| `Headline` | chemical name |
| `Subhead` | biochemical class |
| `Bullet-1` | research note 1 |
| `Bullet-2` | format note |
| `Bullet-3` | research-use restriction |
| `CTA` | View laboratory listing |
| `Disclaimer` | For laboratory research use only. Not for human use or consumption. |
| `Hook` (optional) | short top line |

4. Save template → **Use Template → API Integration** → copy **template_id** and the **cURL**.
5. Paste template_id into a note; we need it for `Prep_Compound` / `Map_Creatomate_Mods`.

### 0C) Sheets tab
1. Same spreadsheet as spotlights.
2. New tab exactly: **`4-reel-queue`**
3. Import headers from `marketing/sheets/4-reel-queue.csv` (or type the header row).

| Columns |
|---|
| `compound_id` |
| `compound_name` |
| `reel_hook` |
| `figma_headline` |
| `figma_subhead` |
| `bullet_1` |
| `bullet_2` |
| `bullet_3` |
| `cta` |
| `ig_caption_draft` |
| `video_url` |
| `template_id` |
| `creatomate_render_id` |
| `compliance_ok` |
| `compliance_flags` |
| `created_at` |
| `used_in_buffer` |

---

## Phase 1 — Duplicate + strip (one sitting)

### DELETE from the Reel Studio copy

Remove or disable these if present:

- Anything named Buffer / Create a post  
- `Figma_export` / Figma HTTP / Save Figma Image  
- `Grok_Imagine` / Save_Image_URL / Sheets_Update_Image (Figma path)  
- `Sheets_Save_Queue` that writes to **`3-figma-content-queue`** (we replace with reel queue later)  
- Any Slack/email leftovers you don’t want  

### KEEP (do not delete)

- `Manual_Trigger` (or Schedule)  
- `Sheets_Read_Compounds`  
- `Filter_Active`  
- `Limit_1`  
- `Prep_Compound` (we TWEAK next)  
- `Build_Grok_Body` (if present)  
- `Grok`  
- `Parse_Grok`  
- `IF_Compliance`  
- `Log_Flags` (false branch)  

**Stop here.** Message: “Phase 1 done — duplicate + strip complete.”  
Then we go node-by-node from Phase 2.

---

## Phase 2 — Confirm KEEP nodes (one by one)

For each: open node → Execute step (or run to here) → confirm → next.

### Node 1 — `Manual_Trigger`
**Action:** KEEP  
**After:** (start)  
**Before:** `Sheets_Read_Compounds`  
**Check:** Trigger exists; workflow name is `PBVita — Reel Studio`.

### Node 2 — `Sheets_Read_Compounds`
**Action:** KEEP  
**After:** `Manual_Trigger`  
**Before:** `Filter_Active`  
**Check:** Document = spotlight spreadsheet; Sheet = `1-compounds-pens`; many rows return.

### Node 3 — `Filter_Active`
**Action:** KEEP  
**After:** `Sheets_Read_Compounds`  
**Before:** `Limit_1`  
**Check:** `status` equals `Active`.

### Node 4 — `Limit_1`
**Action:** KEEP  
**After:** `Filter_Active`  
**Before:** `Prep_Compound`  
**Check:** Max Items = `1`. Smoke tip: temporarily filter `compound_id` = your BPC-157 row.

### Node 5 — `Prep_Compound`
**Action:** KEEP + TWEAK  
**After:** `Limit_1`  
**Before:** `Build_Grok_Body` or `Grok`  
**Include Other Input Fields:** ON  

Add/update:

| Name | Value |
|---|---|
| `daily_angle` | `Reel / short-form catalog identity` (or keep day-angle expression) |
| `daily_image_brief` | `9:16 navy hex-grid reel; compound name dominant; no lifestyle` |
| `template_id` | `YOUR_CREATOMATE_TEMPLATE_ID` (fixed for v1) |
| `output_format` | `reel_9x16` |

**Check:** 1 item; `compound_name` + `template_id` present.

### Node 6 — `Build_Grok_Body` (if you use Code body builder)
**Action:** KEEP + small TWEAK  
**After:** `Prep_Compound`  
**Before:** `Grok`  

Append to user content (or swap user prompt file later):

```text
This run is PBVita Reel Studio (Creatomate). Prioritize:
- creative_brief for on-screen text (headline, subhead, 3 bullets, CTA)
- platform_copy.tiktok.hook as short reel hook (chemical name + research compound)
- platform_copy.tiktok.spoken_script as 12-20s catalog VO (science only)
- Instagram + Facebook captions still require the mandatory disclaimer
Not for Buffer yet. Not for Figma queue.
```

**Check:** `grok_request_body_string` starts with `{"model":"grok-3"`.

### Node 7 — `Grok`
**Action:** KEEP  
**After:** `Prep_Compound` / `Build_Grok_Body`  
**Before:** `Parse_Grok`  
**Check:** Same xAI credential as Buffer; raw body `={{ $json.grok_request_body_string }}`; returns `choices[0].message.content`.

### Node 8 — `Parse_Grok`
**Action:** KEEP + TWEAK (map reel helpers)  
**After:** `Grok`  
**Before:** `IF_Compliance`  

If using Code parse: KEEP existing FDA parse; ensure these fields exist (add if missing):

| Field | Source |
|---|---|
| `figma_headline` / `bullet_1/2/3` / `cta` | creative_brief (already) |
| `ig_caption_draft` / `fb_caption_draft` | platform_copy (already) |
| `compliance_ok` / `compliance_flags` | compliance_check + disclaimer checks |
| `reel_hook` | `platform_copy.tiktok.hook` (or headline fallback) |
| `vo_script` | `platform_copy.tiktok.spoken_script` |
| `template_id` | from `Prep_Compound` / prior |
| `created_at` | `$now.toISO()` |
| `used_in_buffer` | `no` |

**Check:** Chemical names only; captions end with disclaimer; `compliance_ok` boolean.

### Node 9 — `IF_Compliance`
**Action:** KEEP  
**After:** `Parse_Grok`  
**Before (true):** `Map_Creatomate_Mods`  
**Before (false):** `Log_Flags`  
**Check:** Condition `compliance_ok` is true.

### Node 10 — `Log_Flags`
**Action:** KEEP  
**After:** `IF_Compliance` false  
**Before:** end  
**Check:** Shows `compliance_flags`; does **not** call Creatomate.

**Stop after Node 10 confirmation.** Next phase = NEW Creatomate nodes.

---

## Phase 3 — NEW Creatomate nodes (one by one)

### Node 11 — `Map_Creatomate_Mods`
**Action:** NEW  
**After:** `IF_Compliance` (true)  
**Before:** `Creatomate_Render`  

Type: **Edit Fields**  
Include Other Input Fields: ON  

| Name | Value (fx) |
|---|---|
| `mod_Headline` | `={{ $json.figma_headline || $json.compound_name }}` |
| `mod_Subhead` | `={{ $json.figma_subhead }}` |
| `mod_Bullet_1` | `={{ $json.bullet_1 \|\| $json.figma_bullet_1 }}` |
| `mod_Bullet_2` | `={{ $json.bullet_2 \|\| $json.figma_bullet_2 }}` |
| `mod_Bullet_3` | `={{ $json.bullet_3 \|\| $json.figma_bullet_3 }}` |
| `mod_CTA` | `={{ $json.cta \|\| $json.figma_cta \|\| 'View laboratory listing' }}` |
| `mod_Disclaimer` | `For laboratory research use only. Not for human use or consumption.` |
| `mod_Hook` | `={{ $json.reel_hook \|\| $json.figma_headline }}` |
| `template_id` | `={{ $json.template_id }}` |

> Dynamic names must match Creatomate element names exactly (`Headline` vs `mod_Headline` is only our n8n helper — map in the HTTP body to `Headline`).

**Check:** All mod_* strings filled; no nicknames.

---

### Node 12 — `Creatomate_Render`
**Action:** NEW  
**After:** `Map_Creatomate_Mods`  
**Before:** `Wait_Render`  

Type: **HTTP Request**

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.creatomate.com/v2/renders` |
| Authentication | Header Auth → `Creatomate PBVita` |
| Send Body | ON |
| Body Content Type | JSON |

**Easiest setup:** Creatomate editor → Use Template → API Integration → **Import cURL** into this node, then switch modifications to expressions.

Example body shape (fx / JSON expression):

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

**Check:** Response `status` is `planned` (or similar); note `id` and future `url`.

---

### Node 13 — `Wait_Render`
**Action:** NEW  
**After:** `Creatomate_Render` (first time) **or** `Switch_Status` processing loop  
**Before:** `Creatomate_Status`  

Type: **Wait**  
Duration: start **70 seconds** (adjust to ~2× your template’s render time from Creatomate API Log).

**Check:** Wait completes without error.

---

### Node 14 — `Creatomate_Status`
**Action:** NEW  
**After:** `Wait_Render`  
**Before:** `Switch_Status`  

Type: **HTTP Request**

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `={{ 'https://api.creatomate.com/v1/renders/' + $('Creatomate_Render').item.json.id }}` |
| Authentication | same Creatomate Header Auth |

> If Creatomate returns an **array**, take `[0]` or use the id from the first render object. If Import cURL returned an array from POST, use `$json[0].id` consistently.

**Check:** JSON includes `status` and (when done) `url`.

---

### Node 15 — `Switch_Status`
**Action:** NEW  
**After:** `Creatomate_Status`  
**Before:** succeeded / processing / failed branches  

Type: **Switch** on `status`:

| Output | Rule |
|---|---|
| `succeeded` | equals `succeeded` |
| `failed` | equals `failed` |
| `processing` | matches regex `(planned\|transcribing\|waiting\|rendering)` |

Wiring:
- **processing** → connect back to `Wait_Render`
- **failed** → `Log_Render_Fail`
- **succeeded** → `Save_Reel_URL`

**Check:** Test run hits `succeeded` after 1–2 loops.

---

### Node 16 — `Log_Render_Fail`
**Action:** NEW  
**After:** `Switch_Status` failed  
**Before:** end  

Edit Fields: `stopped=creatomate_failed`, `error={{ $json.errorMessage || $json.error \|\| JSON.stringify($json) }}`

---

### Node 17 — `Save_Reel_URL`
**Action:** NEW  
**After:** `Switch_Status` succeeded  
**Before:** `Sheets_Append_Reel`  

Edit Fields; Include Other Input Fields ON **or** pull from Parse:

| Name | Value |
|---|---|
| `video_url` | `={{ $json.url }}` |
| `creatomate_render_id` | `={{ $json.id }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `compound_name` | `={{ $('Parse_Grok').item.json.compound_name }}` |
| `reel_hook` | `={{ $('Parse_Grok').item.json.reel_hook \|\| $('Map_Creatomate_Mods').item.json.mod_Hook }}` |
| `figma_headline` | `={{ $('Parse_Grok').item.json.figma_headline }}` |
| `figma_subhead` | `={{ $('Parse_Grok').item.json.figma_subhead }}` |
| `bullet_1` | `={{ $('Parse_Grok').item.json.bullet_1 \|\| $('Parse_Grok').item.json.figma_bullet_1 }}` |
| `bullet_2` | `={{ $('Parse_Grok').item.json.bullet_2 \|\| $('Parse_Grok').item.json.figma_bullet_2 }}` |
| `bullet_3` | `={{ $('Parse_Grok').item.json.bullet_3 \|\| $('Parse_Grok').item.json.figma_bullet_3 }}` |
| `cta` | `={{ $('Parse_Grok').item.json.cta \|\| $('Parse_Grok').item.json.figma_cta }}` |
| `ig_caption_draft` | `={{ $('Parse_Grok').item.json.ig_caption_draft }}` |
| `template_id` | `={{ $('Map_Creatomate_Mods').item.json.template_id }}` |
| `compliance_ok` | `={{ $('Parse_Grok').item.json.compliance_ok }}` |
| `compliance_flags` | `={{ $('Parse_Grok').item.json.compliance_flags }}` |
| `created_at` | `={{ $('Parse_Grok').item.json.created_at \|\| $now.toISO() }}` |
| `used_in_buffer` | `no` |

**Check:** Open `video_url` in browser — MP4 plays; chemical name correct; disclaimer visible.

---

### Node 18 — `Sheets_Append_Reel`
**Action:** NEW  
**After:** `Save_Reel_URL`  
**Before:** end  

Google Sheets → **Append** row  
Sheet: **`4-reel-queue`**  
Map all columns from `Save_Reel_URL`.

**Check:** New row appears; `video_url` filled; `used_in_buffer=no`.

---

## Node cheat sheet

| # | Node | Action | After | Before |
|---|---|---|---|---|
| 1 | Manual_Trigger | KEEP | — | Sheets_Read |
| 2 | Sheets_Read_Compounds | KEEP | Manual | Filter_Active |
| 3 | Filter_Active | KEEP | Sheets_Read | Limit_1 |
| 4 | Limit_1 | KEEP | Filter_Active | Prep_Compound |
| 5 | Prep_Compound | KEEP+TWEAK | Limit_1 | Grok / Build |
| 6 | Build_Grok_Body | KEEP+TWEAK | Prep | Grok |
| 7 | Grok | KEEP | Build/Prep | Parse_Grok |
| 8 | Parse_Grok | KEEP+TWEAK | Grok | IF_Compliance |
| 9 | IF_Compliance | KEEP | Parse | Map / Log_Flags |
| 10 | Log_Flags | KEEP | IF false | end |
| 11 | Map_Creatomate_Mods | NEW | IF true | Creatomate_Render |
| 12 | Creatomate_Render | NEW | Map | Wait_Render |
| 13 | Wait_Render | NEW | Render / loop | Creatomate_Status |
| 14 | Creatomate_Status | NEW | Wait | Switch_Status |
| 15 | Switch_Status | NEW | Status | Save / Wait / Fail |
| 16 | Log_Render_Fail | NEW | Switch failed | end |
| 17 | Save_Reel_URL | NEW | Switch succeeded | Sheets_Append_Reel |
| 18 | Sheets_Append_Reel | NEW | Save_Reel_URL | end |

---

## Smoke checklist

- [ ] Live Buffer workflow untouched  
- [ ] Reel Studio is a **duplicate**, not an edit-in-place  
- [ ] KEEP nodes still run Limit=1 → Grok → compliance  
- [ ] Creatomate template 9:16 with dynamic names matching HTTP mods  
- [ ] `compliance_ok=false` never hits Creatomate  
- [ ] Succeeded MP4 looks on-brand; chemical names only  
- [ ] Row in `4-reel-queue` with `video_url`  
- [ ] No Buffer node yet  

---

## Later (not now)

- ElevenLabs VO inside Creatomate template  
- Second template (3-bullet / FAQ reel)  
- Buffer draft using `video_url` + `ig_caption_draft` (duplicate Buffer node only then)  
- Runway B-roll as `BG-Video` modification  

---

## Related docs

- Figma queue (static): `marketing/n8n-figma-content-studio.md`  
- Science system prompt: `marketing/n8n-system-prompt-fixed.txt`  
- Grok HTTP pattern: `marketing/n8n-finish-grok-node.md`  
- Brand visual: `marketing/spotlight-card.html`  
- Official Creatomate×n8n pattern: https://creatomate.com/blog/how-to-automate-video-creation-with-n8n  

---

## How we’ll work next

**Start at Phase 1** (duplicate + strip).  
When done, reply: **“Phase 1 done”** — then we do **Node 1** confirmation and walk forward one node at a time.
