# Overlay: single hero spotlight on landscape 500

One-shot write onto `500_Peptide_Wellness_Reel_Scenes`. Archive after Execute. Do **not** Publish.

**Daily reader:** `Vid_gen_landscape_scenes -500-peptide-wellness-scenes` (`Kc2HqqjSyiKs87qy`) — sheets-only, unpublished.  
**Code:** `marketing/n8n-code-overlay-landscape-single-hero.js`

Salvatore: this workflow is **one hero spotlight** — exactly **one pen** or exactly **one vial**. Never a production row. Never a pair.

## What it changes

| Category | Count | Change |
|---|---|---|
| `pen_3ml` | 47 | Production-row / lineup language → exactly ONE catalog pen |
| `vial_10ml` + `set_environment` | 703 | Kill leftover “two vials” / “three vials” beats; COUNT=1 spotlight lock |

Pen **colors** and the GHK-Cu **catalog vial look** stay as written. Daily `pick_creation` is not rewritten.

Update **only:** `material_detail`, `hero_style`, `scene_brief`, `video_prompt`, `video_motion_prompt`, `surface`, `still_edit_prompt`.  
Do **not** touch `times_used` / URLs.

## Wire

```text
Manual Trigger
  → get_reel_creations              Google Sheets read, all rows
  → overlay_landscape_single_hero   Code, Run Once for All Items, Execute Once OFF
  → sheets_update_single_hero       Google Sheets update, match creation_id
```

## After overlay

Existing stills do not change by themselves. Re-Execute landscape vid-gen from `get_reel_creations`. Do **not** Publish.
