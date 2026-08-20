# Overlay: GHK-Cu reference vial onto landscape `vial_10ml` + `set_environment` rows

One-shot. Do **not** Publish. Execute once, then archive.

**First overlay (archived):** https://stockjohnson.app.n8n.cloud/workflow/DgllPY7GowXkKPVo  
Manual execution `1489` wrote **329** `vial_10ml` rows only — **missed `set_environment`**.

**Second overlay (live until archived):** https://stockjohnson.app.n8n.cloud/workflow/MeKW5oSpuN6f7Btt  
`overlay_landscape_vial_look2` — patches `vial_10ml` **and** `set_environment`. Skips `pen_3ml`.  
Exec `1491` **failed**: sheet name `Semax` vs catalog key `SEMAX` (9 `set_environment` rows), so **zero rows were written**.

**Target sheet:** `500_Peptide_Wellness_Reel_Scenes.csv` gid `444650679`  
**Daily reader:** `Vid_gen_landscape_scenes -500-peptide-wellness-scenes` (`Kc2HqqjSyiKs87qy`) — sheets-only, unpublished.

## Why Salvatore still saw the wrong vial

1. Daily still prompt is `$json.video_prompt`. Overlay `1489` swapped `VIAL SPEC` / `hero_style` but left the **opening motion intent** as `pure white ceramic-capped vial`, `glowing amber wellness vial`, or `frosted glass bottle`. Grok follows that first noun.
2. Vid-gen exec `1490` picked **`LI-098` / PT-141 `set_environment`**. Those 374 rows were never overlaid, so Grok invented a crimp-only / bottle prop.
3. Overlay `1491` threw before `sheets_update_vial_look` ran.

HARD OUTPUT LOCK now sits at the **front** of `video_prompt`. Generic bottle/vial nouns are replaced with the catalog vial. `Semax` aliases to `SEMAX` (10mg / 1mg/ml). GHK-Cu 50mg / 5mg/ml is **only** written onto GHK-Cu rows.

**Pen rows stay pens.** `category=pen_3ml` is skipped. Pen-only compounds (`5-Amino-1MQ`, `DSIP`, `KPV`, `Tesamorelin/Ipamorelin`) are skipped even on `set_environment` — no vial SKU, do not invent milligrams.

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

Existing JPEGs do not change. Re-Execute landscape vid-gen from **`get_reel_creations`** (not a pinned `pick_creation` from run `1490`). Do **not** Publish. Caption stays a separate workflow.
