# peptide_caption_gen

**New workflow** — IG captions for **vial** and **pen** (same compound, different copy).  
**Not** vid gen. **Not** Creatomate overlays. **No Switch / IF.**

**Sheet in:** `15-caption-science-27` (science briefs, 27 compounds)  
**Sheet out:** `16-ig-captions` (archive after email)  
**Name the workflow exactly:** `peptide_caption_gen`  
**Live (unpublished):** https://stockjohnson.app.n8n.cloud/workflow/4To3g8t7No4XegMj

Type the compound in `enter_compound`, Execute. You get **2 vial + 2 pen** captions, FDA-checked, emailed to you.

**Format (same shape as your BPC-157 example):**
1. Two science sentences (research / cellular / pathways — no human-use claims)
2. Catalog CTA + `www.palmbeach-vitality.store`
3. Exactly **5 hashtags** — first hashtag is always the compound name (`#BPC157`)

Vial 1 is the short approved CTA. Pen captions stay in the same science family with different verbs and a 3ml pen line.

**fx:** **ON** = Expression · **OFF** = Fixed

---

## Wire (linear)

```text
manual_trigger
  → enter_compound
  → get_caption_science
  → match_compound
  → build_captions
  → verify_fda_captions
  → prep_caption_email
  → gmail_send_captions
  → sheets_append_captions
```

`match_compound` **Execute Once = OFF**. If ON, it only sees the first sheet row.

---

## After import

Tabs `15-caption-science-27` (27 rows) and `16-ig-captions` are already on the chem workbook. Gmail + Sheets creds are attached.

1. Open `enter_compound` → set `COMPOUND = 'BPC-157'` → Execute.
2. Check your inbox for 2 vial + 2 pen captions.

**SMS:** no Twilio credential on this n8n instance. Email only for now (`salvatorejohnson1984@gmail.com`, cc `sales@palmbeach-vitality.com`).

---

## Node 1 — `manual_trigger`

**Type:** Manual Trigger  

---

## Node 2 — `enter_compound`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `manual_trigger` → **enter_compound** → `get_caption_science`

Paste: `marketing/n8n-code-enter-compound.js`

| Parameter | fx | Value |
|---|---|---|
| Mode | — | Run Once for All Items |
| Execute Once | — | **OFF** |
| `COMPOUND` in code | **OFF** | catalog name, e.g. `BPC-157` |

**Check:** `compound_name_input`

---

## Node 3 — `get_caption_science`

**Type:** Google Sheets · Get Row(s)  
**Before → this → After:** `enter_compound` → **get_caption_science** → `match_compound`

| Setting | fx | Value |
|---|---|---|
| Operation | — | Get Row(s) |
| Document | — | **By ID** (chem workbook, same as Sheet 13) |
| Sheet | **OFF** | `15-caption-science-27` |
| Return All | — | **ON** |
| Execute Once | — | **ON** (one Get, not once per letter) |

---

## Node 4 — `match_compound`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `get_caption_science` → **match_compound** → `build_captions`

Paste: `marketing/n8n-code-match-compound.js`

Typo-tolerant match against `compound_name` + `aliases`. Unknown name → throw with closest matches.

**Settings → Execute Once:** **OFF**  
**Check:** `compound_name`, `input_row_count` = 27, `match_distance` 0 or 1

---

## Node 5 — `build_captions`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `match_compound` → **build_captions** → `verify_fda_captions`

Paste: `marketing/n8n-code-build-captions.js`

**Check:** `vial_caption_1`, `vial_caption_2`, `pen_caption_1`, `pen_caption_2`

Vial 1 uses the short approved CTA (`Explore research-grade NAME at URL`). Vial 2 names the **10ml research vial** listing. Pen copy stays in the same science family with different verbs and a **3ml pen** CTA.

---

## Node 6 — `verify_fda_captions`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `build_captions` → **verify_fda_captions** → `prep_caption_email`

Paste: `marketing/n8n-code-verify-fda-captions.js`

Stops the run (no IF) if any caption has:

- human use / benefits of using / you will / treat / cure / inject / dose / patient / supplement / …
- missing store URL
- not exactly 5 hashtags
- first hashtag ≠ compound
- vial copy that reads as a pen (or the reverse)
- vial 1 and pen 1 identical (or vial 2 / pen 2)

**Check:** `verify_status` = `accepted`

---

## Node 7 — `prep_caption_email`

**Type:** Code · Run Once for All Items  
**Before → this → After:** `verify_fda_captions` → **prep_caption_email** → `gmail_send_captions`

Paste: `marketing/n8n-code-prep-caption-email.js`

**Check:** `email_body` has four labeled blocks

---

## Node 8 — `gmail_send_captions`

**Type:** Gmail · Send  
**Before → this → After:** `prep_caption_email` → **gmail_send_captions** → `sheets_append_captions`

| Setting | fx | Value |
|---|---|---|
| Resource | — | Message |
| Operation | — | Send |
| To | **ON** | `={{ $json.email_to }}` |
| CC | **ON** | `={{ $json.email_cc }}` |
| Subject | **ON** | `={{ $json.email_subject }}` |
| Email Type | — | Text |
| Message | **ON** | `={{ $json.email_body }}` |
| Append n8n attribution | — | **OFF** |

---

## Node 9 — `sheets_append_captions`

**Type:** Google Sheets · Append  
**Before → this → After:** `gmail_send_captions` → **sheets_append_captions** → (end)

| Setting | fx | Value |
|---|---|---|
| Operation | — | Append |
| Document | — | same chem workbook |
| Sheet | **OFF** | `16-ig-captions` |
| Mapping | — | defineBelow from `prep_caption_email` |

Email already went out if this node fails (missing tab).

---

## Importable JSON

`marketing/workflows/peptide_caption_gen.json`

---

## Related

- Science sheet: `marketing/sheets/15-caption-science-27.csv`
- Archive header: `marketing/sheets/16-ig-captions.csv`
- Builder: `marketing/scripts/build_caption_science_27.py`
