# Creatomate music — REMOVED

**Do not add soundtrack to vid gens.**

All Creatomate packages and Buffer uploads stay **muted**:

- `main_video.muted: true`
- `main_video.volume: '0%'`
- **No** `bg_music` / `music_url` modifications

If an Audio element named `bg_music` exists in the Creatomate template, leave it unused (or delete it in the template editor). Do not pass a music URL from n8n.

See `n8n-creatomate-package-workflow.md`.
