# Why these stills are in git

These are not archives. Each one is **served to a video API** as an image-to-video
source over `https://raw.githubusercontent.com/PalmBeach-Vitality/store/<branch>/marketing/stills/<file>`,
and several of those URLs are sitting in live sheet cells right now — `18-motsc-film-stills`
rows FILM-023 / 024 / 025 hold them as `picked_url` and `take_urls`. Delete the file
and the URL 404s, so the I2V run fails on a source fetch rather than anything that
looks like a prompt problem.

Two files are load-bearing for a different reason: `iols66-hq.png` is the FILM-002
portrait recorded in `.cursor/skills/prompt-moderation-hygiene/references/incidents.md`
as a confirmed image-level block on Veo. Keep it so the repeat check has something to
compare against.

Before removing anything here, grep the basename across the repo **and** check the live
sheet cells. Every file currently in this directory is referenced.

## What does not get committed

- **Finished clips.** `marketing/videos/` was carrying 107 MB of rendered output — two
  4K pilot clips, a film020 reentry, a 30s molecule clip. The finished cut lives with
  the render service and in the sheet's `video_url`, not in git.
- **Rejected takes.** Seven `film020-side-reentry-*` variants and a couple of `*-take`
  files were kept after the keeper was chosen. Keep the keeper, drop the rest.
- **Vial and pen renders.** Salvatore's rule: no vial or pen media in any repo. The
  product imagery the WooCommerce theme renders is a separate thing and stays.

Deleting a file here does not shrink the repo — the blob stays in history, and the pack
is ~260 MB because of it. Reclaiming that needs a history rewrite and a force push,
which nobody has approved.
