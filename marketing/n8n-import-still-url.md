# Import still URL → enter before `still_edit_instructions`

**Goal:** Paste any public image URL and join the Grok video path **before** `still_edit_instructions` (skip scene pick + still generation).

**Workflow:** same canvas as Reel Studio / Grok Daily (or a tiny caller workflow)

---

## Wire

### Normal daily path
```text
pick_creation → grok_imagine_reel_still → save_still_url
  → still_edit_instructions → if_still_edit → … → prep_grok_video_start → grok_video_start
```

### Import URL path (new)
```text
Manual_Trigger_Import → import_still_url → still_edit_instructions → … (same from here)
```

Both paths land on **`still_edit_instructions`**. Do not run both triggers in one execution.

---

## Node 1 — `Manual_Trigger_Import`

```text
(start) → **Manual_Trigger_Import** → import_still_url
```

| Setting | Value |
|---|---|
| Type | **Manual Trigger** |
| Name | `Manual_Trigger_Import` |

Use this when you want to feed a custom image URL (not the daily sheet/Grok still).

---

## Node 2 — `import_still_url`

```text
Manual_Trigger_Import → **import_still_url** → still_edit_instructions
```

| Setting | Value |
|---|---|
| Type | **Edit Fields** (Set) |
| Name | `import_still_url` |
| Include Other Input Fields | **OFF** (or ON if you add more later) |

| Name | Mode | fx | Value |
|---|---|---|---|
| `still_url` | Fixed | **OFF** | paste your `https://…` image URL here each run |
| `creation_id` | Fixed | **OFF** | optional tag, e.g. `IMPORT-001` |
| `source` | Fixed | **OFF** | `import_url` |

**Check:** `still_url` is a public `https://` link that opens in a browser.

---

## Join into existing path

```text
import_still_url → **still_edit_instructions**
save_still_url   → **still_edit_instructions**   (existing daily wire — keep it)
```

In n8n: drag a second connection into `still_edit_instructions` from `import_still_url`.  
`still_edit_instructions` already maps:

```text
still_url = {{ $json.still_url || $json.data[0].url }}
```

So import and daily still both work.

Then continue as already built:

```text
still_edit_instructions → if_still_edit → … → save_edited_still_url → prep_grok_video_start → grok_video_start
```

---

## Optional: true sub-workflow (separate canvas)

If you want a dedicated small workflow:

**Workflow A — `PBVita — Import Still URL`**
```text
Manual Trigger → import_still_url → Execute Workflow (call main)
```

**Workflow B — main vid gen**
Add trigger: **When Executed by Another Workflow**  
Wire that trigger → `still_edit_instructions` (same as import join).

For most cases, the **same-canvas Manual_Trigger_Import** above is enough — no Execute Workflow needed.

---

## Smoke test

1. Paste a known good image URL into `import_still_url.still_url`
2. Run from `Manual_Trigger_Import` only
3. Confirm `still_edit_instructions` sees that URL
4. Edit (or leave blank) → video uses that frame

Reply **`import ok`** when green.
