# PBVita — Figma Content Studio (n8n)

**Owner:** Salvatore (designer)  
**Workflow name in n8n:** `PBVita — Figma Content Studio`  
**Purpose:** Generate FDA-compliant creative content for **Figma design handoff** → Google Sheets queue (+ optional Grok Imagine image URL).

> This is a **SEPARATE** workflow from the Buffer daily spotlight.  
> Do **not** edit, disable, or reconnect nodes in the existing Buffer workflow.

---

## What this does / does not do

| Does | Does not |
|---|---|
| Read 1 compound from Sheets | Post to Buffer / social |
| Call xAI Grok (science/research-only) | Auto-edit Figma text layers via REST |
| Parse creative brief + captions | Claim Figma Enterprise Variables unless you confirm them |
| Gate on `compliance_ok` | Mix into the Buffer chain |
| Append a row to `3-figma-content-queue` | Replace `spotlight-card.html` (reuse it as art reference) |
| Optionally generate an image URL via Grok Imagine | |

**Figma handoff truth:** Figma’s public REST API exports frames as images. It does **not** reliably rewrite text layers unless you have **Enterprise Variables** or a **plugin**. This workflow = **content queue handoff**. You paste fields into Figma (or use Variables/plugin later if confirmed).

---

## End-to-end chain

```text
Manual Trigger (or Schedule)
  → Sheets_Read_Compounds
  → Filter_Active
  → Limit_1
  → Prep_Compound
  → Grok                    (reuse science system prompt)
  → Parse_Grok
  → IF_Compliance
       true  → Sheets_Save_Queue
            → (optional) Grok_Imagine
            → (optional) Save_Image_URL → Sheets_Update_Image
       false → Log_Flags (stop)
```

---

## Reuse these existing docs (do not rewrite Buffer)

| File | Use here |
|---|---|
| `marketing/n8n-system-prompt-fixed.txt` | Grok **system** prompt (paste as-is) |
| `marketing/n8n-user-prompt-figma-studio.txt` | Grok **user** prompt (Figma handoff variant) |
| `marketing/n8n-user-prompt-daily-variant.txt` | Optional alternate if you want day-angle rotation |
| `marketing/n8n-parse-figma-studio-fields.md` | Parse field map |
| `marketing/n8n-code-parse-figma-studio.js` | Parse Code node (recommended) |
| `marketing/n8n-grok-imagine-visual-prompt.md` | Optional image body (navy hex-grid) |
| `marketing/spotlight-card.html` | Visual reference for Figma / Imagine |
| `marketing/n8n-finish-grok-node.md` | Same Grok HTTP raw-body pattern |

---

## FDA hard rules (every run)

- Laboratory / **in-vitro research only**
- **Not for human use**
- **Chemical names only** — never KLOW / Wolverine / GLOW nicknames
- Mandatory disclaimer on IG + FB captions:
  `For laboratory research use only. Not for human use or consumption. Not a drug, dietary supplement, or cosmetic. Not evaluated by the FDA.`
- No disease / structure-function / wellness claims
- If `compliance_ok` is false → **do not** write a “good” queue row for design use (log flags only)

---

## 0) One-time Sheets setup

**After:** you already have `1-compounds-pens` (from PR #3 CSVs)  
**Before:** any n8n Sheets write in this new workflow

1. Open spreadsheet `PB-Vitality-Spotlights` (or your spotlight sheet).
2. **+** add a new tab.
3. Rename tab exactly: `3-figma-content-queue`
4. File → Import → Upload `marketing/sheets/3-figma-content-queue.csv`
5. Import location: **Replace current sheet** (the new empty tab).
6. Confirm header row:

| Columns |
|---|
| `compound_id` |
| `compound_name` |
| `figma_headline` |
| `figma_subhead` |
| `bullet_1` |
| `bullet_2` |
| `bullet_3` |
| `cta` |
| `ig_caption_draft` |
| `fb_caption_draft` |
| `compliance_ok` |
| `compliance_flags` |
| `image_url` |
| `created_at` |
| `used_in_figma` |

7. Share the sheet with the same Google account already connected in n8n.

`used_in_figma`: leave `no` until you paste that row into a Figma frame; then mark `yes` manually.

---

## 1) Create a brand-new workflow

1. In n8n: **Workflows → Add workflow**
2. Name: `PBVita — Figma Content Studio`
3. Save.
4. Do **not** duplicate the Buffer workflow (avoids accidental Buffer nodes). Build clean.

---

## 2) Manual Trigger

**After:** (start of canvas)  
**Before:** `Sheets_Read_Compounds`

1. Click **+** on the empty canvas (or Add first step).
2. Search **Manual Trigger** → add.
3. Name: `Manual_Trigger`
4. Leave defaults.

### Optional later: Schedule
When daily queueing is wanted:
- Add **Schedule Trigger** instead of (or in parallel with) Manual
- Days Between Triggers = `1`
- Keep **Limit_1** so you never batch the whole catalog by accident

---

## 3) Sheets_Read_Compounds

**After:** `Manual_Trigger`  
**Before:** `Filter_Active`

1. Click **+** on the right of Manual_Trigger.
2. Search **Google Sheets** → **Get Row(s)** / **Get Many**.
3. Name: `Sheets_Read_Compounds`
4. Credential: same Google account as Buffer workflow.
5. Document: `PB-Vitality-Spotlights`
6. Sheet: `1-compounds-pens`
7. Return all matching rows (no filter in this node if your Sheets node is finicky — filter next).

Execute once: you should see many compound rows. That is OK — Limit comes next.

---

## 4) Filter_Active

**After:** `Sheets_Read_Compounds`  
**Before:** `Limit_1`

1. Add **Filter**
2. Name: `Filter_Active`
3. Condition: `status` → equals → `Active`

---

## 5) Limit_1

**After:** `Filter_Active`  
**Before:** `Prep_Compound`

1. Add **Limit**
2. Name: `Limit_1`
3. Max Items: `1`

> Critical: without Limit, Grok runs once per Active row.

For smoke test: optionally add a second Filter before Limit: `compound_id` equals `P-BPC-001` (or your BPC-157 row id).

---

## 6) Prep_Compound

**After:** `Limit_1`  
**Before:** `Grok`

1. Add **Edit Fields** (Set)
2. Name: `Prep_Compound`
3. Include Other Input Fields: **ON**
4. Add (optional but useful):

| Name | Mode | Value |
|---|---|---|
| `daily_angle` | Fixed | `Identity / catalog listing` |
| `daily_image_brief` | Fixed | `Hero compound name dominant; premium navy hex-grid brand card` |
| `figma_template_type` | Expression | `={{ $json.figma_template_type || 'Hero Spotlight' }}` |

Execute: confirm 1 item with `compound_name`, `canonical_url`, etc.

---

## 7) Grok (xAI chat)

**After:** `Prep_Compound`  
**Before:** `Parse_Grok`

Reuse the **proven** Grok pattern from the Buffer workflow (`n8n-finish-grok-node.md`).

1. Add **HTTP Request**
2. Name: `Grok`
3. Settings:

| Setting | Value |
|---|---|
| Method | `POST` |
| URL | `https://api.x.ai/v1/chat/completions` |
| Authentication | Header Auth → `Authorization: Bearer <xAI key>` (same credential as Buffer workflow) |
| Send Headers | ON → `Content-Type` = `application/json` |
| Send Body | ON |
| Body Content Type | **Raw** / JSON |
| Specify Body | Using JSON / Raw |

### Body (fx ON) — recommended expression form

Use system prompt from `marketing/n8n-system-prompt-fixed.txt` and user prompt from `marketing/n8n-user-prompt-figma-studio.txt`.

Simplest reliable approach (matches Buffer):

1. Add a **Code** node named `Build_Grok_Body` **After** `Prep_Compound` **Before** `Grok`
2. Paste the Build Grok Body code from `marketing/n8n-finish-grok-node.md`
3. In that code’s `userContent`, replace the short user string with the Figma studio intent, **or** keep the science user string and append:

```text
This run is Figma Content Studio handoff. Prioritize creative_brief (headline, subhead, 3 bullets, CTA). Captions still require mandatory disclaimer. Not for Buffer.
```

4. Grok HTTP Raw body (fx):

```text
={{ $json.grok_request_body_string }}
```

### Alternate: JSON body with expressions
If you already use Edit Fields raw JSON in the Buffer workflow, copy that Grok node settings into this workflow and only swap the user prompt to `n8n-user-prompt-figma-studio.txt`.

Execute `Grok` → success JSON with `choices[0].message.content` as a JSON string.

---

## 8) Parse_Grok

**After:** `Grok`  
**Before:** `IF_Compliance`

1. Add **Code**
2. Name: `Parse_Grok`
3. Mode: Run Once for Each Item
4. Paste: `marketing/n8n-code-parse-figma-studio.js`

(Or use Edit Fields map in `marketing/n8n-parse-figma-studio-fields.md`.)

Execute and confirm flat fields:
- `figma_headline`, `figma_subhead`, `bullet_1/2/3`, `cta`
- `ig_caption_draft` / `fb_caption_draft` end with disclaimer
- `compliance_ok` true/false
- `used_in_figma` = `no`
- `image_url` empty

---

## 9) IF_Compliance

**After:** `Parse_Grok`  
**Before (true):** `Sheets_Save_Queue`  
**Before (false):** `Log_Flags`

1. Add **IF**
2. Name: `IF_Compliance`
3. Condition: `{{ $json.compliance_ok }}` **is true** (Boolean)

### True branch → continue to Sheets
### False branch → Log_Flags

---

## 10) Log_Flags (false path)

**After:** `IF_Compliance` (false)  
**Before:** (end)

1. Add **Edit Fields** or **No Operation**
2. Name: `Log_Flags`
3. Include fields so you can see them in Executions:

| Name | Value |
|---|---|
| `stopped` | `compliance_failed` |
| `compliance_flags` | `={{ $json.compliance_flags }}` |
| `compound_id` | `={{ $json.compound_id }}` |

Optional later: append failed rows to a `3-figma-content-queue` row with `compliance_ok=false` for audit — or a separate `3-figma-content-rejects` tab. Start with stop/log only.

---

## 11) Sheets_Save_Queue (true path)

**After:** `IF_Compliance` (true)  
**Before:** `Grok_Imagine` (optional) **or** end

1. Add **Google Sheets** → **Append Row** / **Append or Update Row**
2. Name: `Sheets_Save_Queue`
3. Document: same spreadsheet
4. Sheet: `3-figma-content-queue`
5. Mapping:

| Column | Value |
|---|---|
| `compound_id` | `={{ $json.compound_id }}` |
| `compound_name` | `={{ $json.compound_name }}` |
| `figma_headline` | `={{ $json.figma_headline }}` |
| `figma_subhead` | `={{ $json.figma_subhead }}` |
| `bullet_1` | `={{ $json.bullet_1 }}` |
| `bullet_2` | `={{ $json.bullet_2 }}` |
| `bullet_3` | `={{ $json.bullet_3 }}` |
| `cta` | `={{ $json.cta }}` |
| `ig_caption_draft` | `={{ $json.ig_caption_draft }}` |
| `fb_caption_draft` | `={{ $json.fb_caption_draft }}` |
| `compliance_ok` | `={{ $json.compliance_ok }}` |
| `compliance_flags` | `={{ $json.compliance_flags }}` |
| `image_url` | `={{ $json.image_url }}` |
| `created_at` | `={{ $json.created_at }}` |
| `used_in_figma` | `={{ $json.used_in_figma }}` |

Execute → confirm a new row appears in `3-figma-content-queue`.

---

## 12) Optional — Grok_Imagine

**After:** `Sheets_Save_Queue`  
**Before:** `Save_Image_URL`

Skip this entire section until text queue works.

1. Add **HTTP Request**
2. Name: `Grok_Imagine`
3. **Copy settings from the working `Grok_Imagine` node in the Buffer workflow** (same URL, auth, model `grok-imagine-image-2.0`). Do not invent a new endpoint.
4. Body (fx ON): paste the expression from `marketing/n8n-grok-imagine-visual-prompt.md`

> Field names in that prompt use `figma_bullet_1` etc. After Parse_Grok in this workflow the fields are `bullet_1` / `bullet_2` / `bullet_3` / `cta`. Either:
> - adjust the Imagine prompt to `$json.bullet_1` … `$json.cta`, **or**
> - add an Edit Fields shim that copies `bullet_1` → `figma_bullet_1` before Imagine.

### Shim (if needed)

**After:** `Sheets_Save_Queue`  
**Before:** `Grok_Imagine`

Name: `Map_Imagine_Fields`  
Include Other Input Fields: ON

| Name | Value |
|---|---|
| `figma_bullet_1` | `={{ $json.bullet_1 }}` |
| `figma_bullet_2` | `={{ $json.bullet_2 }}` |
| `figma_bullet_3` | `={{ $json.bullet_3 }}` |
| `figma_cta` | `={{ $json.cta }}` |

Execute Imagine → open returned image URL. Look for navy + hex grid + chemical name (see `spotlight-card.html`).

---

## 13) Optional — Save_Image_URL + Sheets_Update_Image

**After:** `Grok_Imagine`  
**Before:** end

### Save_Image_URL
1. Add **Edit Fields**
2. Name: `Save_Image_URL`
3. Include Other Input Fields: ON

| Name | Value |
|---|---|
| `image_url` | `={{ $json.data[0].url \|\| $json.url \|\| $json.data?.[0]?.url }}` |
| `compound_id` | `={{ $('Parse_Grok').item.json.compound_id }}` |
| `created_at` | `={{ $('Parse_Grok').item.json.created_at }}` |

> Adjust `data[0].url` to match the exact Imagine response shape you already see in the Buffer workflow.

### Sheets_Update_Image
**After:** `Save_Image_URL`  
**Before:** end

1. Add **Google Sheets** → **Update Row**
2. Name: `Sheets_Update_Image`
3. Sheet: `3-figma-content-queue`
4. Match on: `compound_id` + `created_at` (or update the row just appended — if Append returns a row number, use that)
5. Set column `image_url` = `={{ $json.image_url }}`

If Update-by-match is awkward on day one: skip Update and instead map `image_url` **before** `Sheets_Save_Queue` by moving Imagine **before** the Append (still after compliance IF). Preferred final order when Imagine is stable:

```text
IF true → Grok_Imagine → Save_Image_URL → Sheets_Save_Queue (includes image_url)
```

That avoids a second Sheets write.

---

## Designer handoff (Figma)

1. Open `3-figma-content-queue` in Sheets.
2. Pick the newest row where `compliance_ok` = TRUE and `used_in_figma` = `no`.
3. In Figma (Hero Spotlight frame — see `marketing/figma-beginner-walkthrough.md`):
   - Paste `figma_headline` → headline layer
   - Paste `figma_subhead` → subhead
   - Paste `bullet_1/2/3` → bullets
   - Paste `cta` → CTA
   - Keep research-use disclaimer on-canvas
4. Optional: place `image_url` as a reference fill / moodboard only (or regenerate in Figma from `spotlight-card.html` look).
5. Set `used_in_figma` = `yes` in Sheets.

**Do not expect** n8n → Figma REST to rewrite text layers unless Enterprise Variables or a plugin is confirmed.

---

## Smoke test checklist (Salvatore)

- [ ] New workflow named `PBVita — Figma Content Studio` (Buffer workflow untouched)
- [ ] Tab `3-figma-content-queue` exists with correct headers
- [ ] Manual Trigger → Limit 1 → one compound only
- [ ] Grok returns JSON creative_brief
- [ ] Parse shows chemical names only (no nicknames)
- [ ] Captions end with mandatory disclaimer
- [ ] `compliance_ok=false` stops before queue write
- [ ] `compliance_ok=true` appends one Sheets row
- [ ] Optional Imagine URL saved (if enabled)
- [ ] You can paste headline/bullets into Figma manually

---

## Node order cheat sheet (After / Before)

| Node | After | Before |
|---|---|---|
| `Manual_Trigger` | — | `Sheets_Read_Compounds` |
| `Sheets_Read_Compounds` | `Manual_Trigger` | `Filter_Active` |
| `Filter_Active` | `Sheets_Read_Compounds` | `Limit_1` |
| `Limit_1` | `Filter_Active` | `Prep_Compound` |
| `Prep_Compound` | `Limit_1` | `Build_Grok_Body` or `Grok` |
| `Build_Grok_Body` (optional) | `Prep_Compound` | `Grok` |
| `Grok` | `Prep_Compound` / `Build_Grok_Body` | `Parse_Grok` |
| `Parse_Grok` | `Grok` | `IF_Compliance` |
| `IF_Compliance` | `Parse_Grok` | true:`Sheets_Save_Queue` / false:`Log_Flags` |
| `Log_Flags` | `IF_Compliance` false | end |
| `Sheets_Save_Queue` | `IF_Compliance` true | `Grok_Imagine` or end |
| `Map_Imagine_Fields` (opt) | `Sheets_Save_Queue` | `Grok_Imagine` |
| `Grok_Imagine` (opt) | `Map_Imagine_Fields` / queue | `Save_Image_URL` |
| `Save_Image_URL` (opt) | `Grok_Imagine` | `Sheets_Update_Image` |
| `Sheets_Update_Image` (opt) | `Save_Image_URL` | end |

---

## Related

- Buffer daily path: `marketing/n8n-save-render-url.md`, `marketing/n8n-buffer-finish.md`
- Visual system: `marketing/spotlight-card.html`, `marketing/n8n-grok-imagine-visual-prompt.md`
- Figma frame build: `marketing/figma-beginner-walkthrough.md`
