# Palm Beach Vitality (Store)

A fully static, multi-page website (HTML + Tailwind CSS via CDN + a little vanilla JS) for the `www.palmbeach-vitality.store` domain. Intended to live in its own repository and deploy via GitHub Pages (see `CNAME`).

## Marketing / n8n (Reel Studio)

**Main goal:** daily **45–60s** reel = **Grok** unique lab-item footage (+ smooth extend) + **Creatomate** text overlays. Subjects = 500 lab items only. Canonical: `marketing/GOAL.md` + `marketing/n8n-45s-reel-grok-creatomate.md`.

## Cursor Cloud specific instructions

- This is a **pure static site**. There is no build step, no package manager, no `package.json`, and no dependencies to install. Tailwind is loaded from a CDN at runtime.
- There are **no lint, test, or build commands**. Do not look for them.
- Pages live in per-route folders as `index.html` (e.g. `products/index.html`, `contact/index.html`) plus article pages under `research/`.
- To run it in development, serve this directory over HTTP (relative links behave best over HTTP):
  - `python3 -m http.server 8000` from this directory, then browse `http://localhost:8000/`.
- Interactive behavior is plain vanilla JS embedded in each page: the mobile menu toggle, the product category filter on `products/index.html` (filter buttons use `data-filter` matched against each card's `data-category`), and the dosage protocol calculator on `protocols/index.html` (peptide selection, reconstitution math, copy/print summary).
- Editing any `.html` file takes effect on a simple browser refresh — there is no hot-reload/watch process.
- **CSV updates:** Whenever you create, update, or regenerate any `.csv` file, always include a clickable GitHub link to each changed file in your reply to the user (after commit/push). Use the blob URL for the current branch, e.g. `https://github.com/PalmBeach-Vitality/store/blob/<branch>/<path-to-file.csv>`.
- **n8n node instructions:** Whenever you give parameters for an n8n node to add or edit, always show the wire position first as `Before → **This node** → After` (use `end` / `unwired` when needed). Do this every time, not only on the first node in a sequence.
- **Sheets-only inputs (n8n):** Every creative / generation input must come from Google Sheets (via Get Rows / `pick_creation` / other sheet nodes) — prompts, camera moves, motion briefs, edit instructions, model names, duration, resolution, aspect ratio, compound names, captions, etc. Do **not** hardcode those values into Set/Code/HTTP nodes. Nodes may only: (1) map sheet fields with expressions, (2) call APIs, (3) write results back to sheets. If a field is missing, fail clearly — do not invent a fallback prompt. Runtime URLs from API responses (`still_url`, `video_url`) are allowed as outputs of prior nodes.
