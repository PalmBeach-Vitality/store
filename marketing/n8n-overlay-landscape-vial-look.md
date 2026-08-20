# Overlay: GHK-Cu reference vial onto landscape `vial_10ml` rows

One-shot. Do **not** Publish. Execute once, then archive.

**Live overlay (archive after execute):** created in n8n as `overlay_landscape_vial_look`  
**Target sheet:** `500_Peptide_Wellness_Reel_Scenes.csv` gid `444650679`  
**Daily reader:** `Vid_gen_landscape_scenes -500-peptide-wellness-scenes` (`Kc2HqqjSyiKs87qy`) — sheets-only, unpublished.

## Why

Every landscape **vial** must match the GHK-Cu catalog still: clear glass, vibrant blue flip-off cap on silver crimp, white wrap-around label, maroon DNA helix, maroon compound name, maroon bar with **white catalog mg**, black catalog **mg/ml**, footer `{vol} Sterile Multi-Use Vial`, upright on a reflective glass/acrylic shelf.

GHK-Cu catalog is **50mg / 5mg/ml**. A still that prints **10mg/ml** is wrong (50mg ÷ 10ml = 5mg/ml). Other compounds keep **their** Shopify liquid SKU — not GHK-Cu’s numbers on every bottle.

**Pen rows stay pens.** `category=pen_3ml` is skipped.

## Wire (linear)

```
Manual Trigger
  → get_reel_creations          Google Sheets  Get all rows
  → overlay_landscape_vial_look Code  Run Once for All Items  Execute Once OFF
  → sheets_update_vial_look     Google Sheets  Update  matching column creation_id
```

Paste `marketing/n8n-code-overlay-landscape-vial-look.js`.

Update **only**: `material_detail`, `hero_style`, `scene_brief`, `video_prompt`, `video_motion_prompt`, `surface`, `still_edit_prompt`.  
Do **not** touch `times_used` / URLs.

## After execute

Existing JPEGs do not change. Pin/re-Execute landscape vid-gen from `pick_creation` (or still + edit) so Grok rebuilds the vial. Do **not** Publish. Caption stays a separate workflow.
