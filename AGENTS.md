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
- Interactive behavior is plain vanilla JS embedded in each page: the mobile menu toggle and the product category filter on `products/index.html` (filter buttons use `data-filter` matched against each card's `data-category`).
- Editing any `.html` file takes effect on a simple browser refresh — there is no hot-reload/watch process.
- **CSV updates:** Whenever you create, update, or regenerate any `.csv` file, always include a clickable GitHub link to each changed file in your reply to the user (after commit/push). Use the blob URL for the current branch, e.g. `https://github.com/PalmBeach-Vitality/store/blob/<branch>/<path-to-file.csv>`.
