# MOTS-C film I2V — `custom_vid_gen 1.5 -18-motsc-film-stills`

Unpublished. Do **not** Publish. Do **not** mix Creatomate. Do **not** regenerate locked keepers.

n8n: [`custom_vid_gen 1.5 -18-motsc-film-stills`](https://stockjohnson.app.n8n.cloud/workflow/qZ7qU8LVwVXAXyaL) `qZ7qU8LVwVXAXyaL`

Live sheet: [18-motsc-film-stills](https://docs.google.com/spreadsheets/d/1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU/edit#gid=1628285227)

**Model:** Grok Imagine Video **1.5** (I2V from `picked_url`). Seedance 2.5 stays on its own workflow. Empty sheet cells throw.

```text
manual_trigger
  → get_film_stills
  → pick_film_still
  → prep_film_video_start
  → grok_video_start
  → wait_video
  → grok_video_poll
  → save_film_video_url
  → sheets_update_still
```

**Before → this → After:** `manual_trigger` → **get_film_stills** → `pick_film_still`

**Before → this → After:** `get_film_stills` → **pick_film_still** → `prep_film_video_start`

**Before → this → After:** `pick_film_still` → **prep_film_video_start** → `grok_video_start`

**Before → this → After:** `prep_film_video_start` → **grok_video_start** → `wait_video`

**Before → this → After:** `grok_video_start` → **wait_video** → `grok_video_poll`

**Before → this → After:** `wait_video` → **grok_video_poll** → `save_film_video_url`

**Before → this → After:** `grok_video_poll` → **save_film_video_url** → `sheets_update_still`

**Before → this → After:** `save_film_video_url` → **sheets_update_still** → `end`

One Execute = next Active row with `picked_url` and empty `video_url` (rank order). Writes `video_url` + `video_request_id`. Does not rewrite `picked_url` / `take_urls` / `still_prompt`.

Sheet fields the pick requires: `video_motion_prompt`, `model_video`, `duration_seconds`, `video_resolution`, `audio`, `wait_seconds`.

Code: `marketing/n8n-code-pick-film-clip.js`, `marketing/n8n-code-prep-film-video-start.js`, `marketing/n8n-code-save-film-video-url.js`.
