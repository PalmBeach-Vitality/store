# PBVita Figma Content Studio — docs transfer

**Do not merge this PR into `store` main for site deploy.**

This cloud agent was bound to **PalmBeach-Vitality/store** and cannot push to **PalmBeach-Vitality/pep** (GitHub 403). The canonical home for these files is pep `marketing/`.

## Apply onto pep (recommended)

On your machine (or a cloud agent started on **pep**):

```bash
cd /path/to/pep
git fetch origin
git checkout cursor/grok-spotlight-prompt-7786   # or main after PR #3 merges
git checkout -b cursor/figma-content-studio-4c4b
git am path/to/pep-figma-content-studio.patch
# or manually copy the files listed below into marketing/
git push -u origin cursor/figma-content-studio-4c4b
```

## Files to place in pep `marketing/`

| File | Role |
|---|---|
| `n8n-figma-content-studio.md` | Click-by-click n8n guide (After X / Before Y) |
| `n8n-parse-figma-studio-fields.md` | Parse field map |
| `n8n-code-parse-figma-studio.js` | Parse Code node |
| `n8n-user-prompt-figma-studio.txt` | Grok user prompt (Figma handoff) |
| `sheets/3-figma-content-queue.csv` | Sheets tab headers |
| `pep-figma-content-studio.patch` | Full pep commit (includes sheets README + figma-setup cross-link) |

## Salvatore — start here in n8n

Open **`n8n-figma-content-studio.md`** and build workflow **`PBVita — Figma Content Studio`**.  
Reuse prompts already on pep PR #3 (`n8n-system-prompt-fixed.txt`, Imagine visual prompt, `spotlight-card.html`).  
Leave the Buffer daily workflow untouched.
