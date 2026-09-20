# 10ml lab vial — visual lock

Source: Salvatore's BPC-157 10mg catalog photo, 2026-09-17.
Scope: **every 10ml row** on Sheet `9-lab-item-creations-500` (506 rows) and `500_Peptide_Wellness_Reel_Scenes` (577 rows). The Cagrilintide rows that still say `This is the 5ml multi-dose vial` are not in this lock (29 lab, 24 wellness).

W = width of the straight glass body.
H = top of the blue cap down to the glass base.

| Part | Lock |
| --- | --- |
| Total height | **2.36 × W** |
| Straight body height | **1.56 × W** (66% of H) |
| Cap + collar + neck + shoulder | 34% of H |
| Blue cap width | 0.94 × W — **simple uniform** one-piece disc, **no tabs** |
| Brushed-silver crimp collar width | 0.92 × W |
| Glass neck width | 0.66 × W |
| DNA helix width | **one tenth of the label** (never more than one eighth) |
| DNA helix height | 1.7 × helix width |
| Helix | tiny stamp-size mark above the name — not a large logo, not scaled to the compound name |

FORBIDDEN on 10ml rows: tall vial, slim vial, test-tube, ampoule, height greater than 2.4 × body width, oversized helix, helix wider than one eighth of the label, helix as wide as the compound name, helix filling the top of the label, **cap tabs**, wings, pull-tabs, tear-tabs, side flaps.

Apply helix shrink (after the 10ml geometry lock):

```bash
python3 marketing/scripts/shrink_10ml_helix.py           # dry run
python3 marketing/scripts/shrink_10ml_helix.py --write
```

Apply simple uniform cap (no tabs; after helix):

```bash
python3 marketing/scripts/lock_simple_blue_cap.py           # dry run
python3 marketing/scripts/lock_simple_blue_cap.py --write
```

Live write, 2026-09-17: unpublished n8n `apply_10ml_vial_spec` (`GqVY0SvZ1iSAFqdC`) wrote 506 lab rows and 577 wellness rows. 5ml Cagrilintide untouched. **Archived 2026-09-17.** Do not publish. Do not run vid-gen from this workflow.

Live write, 2026-09-17 (helix still too big on first LI-016 smoke): unpublished n8n `shrink_10ml_helix` (`Ay6VWEJJQfDNdhCP`) exec **2258** wrote 506 lab + 577 wellness 10ml rows. SMALL / one-fifth / quarter-of-name → TINY / one-tenth / forbid wider than one eighth. 5ml Cagrilintide untouched. Read-back `verify_shrink_10ml_helix` (`ZKqmaffVUEeUJEZR`) exec **2259**: PBVita-Lab-207 and LI-016 have TINY / one tenth, leftover SMALL and one-fifth = false. **Archived 2026-09-17.** Do not publish. Do not run vid-gen from these workflows.

Live smoke, 2026-09-17: landscape `Vid_gen_landscape_scenes -500-peptide-wellness-scenes` (`Kc2HqqjSyiKs87qy`) exec **2260** stopped at `grok_imagine_reel_still`. `choose_compound` `wolverine-vial` → LI-016, print `BPC-157/TB-500`, TINY / one-tenth helix on `video_prompt`. Salvatore accepted still `https://imgen.x.ai/xai-imgen/xai-tmp-imgen-1e6c9ce0-b34f-9b25-b514-d5894eb02da3-c1c3d8db.png`. Helix lock stays. `save_still_url` was not in that run.

I2V of that still (exec **2261**, clip `https://v3b.fal.media/files/b/0aaacccc/utS7Qisl3hW--2a2h1H8O_output.mp4`) moved the vial. CAP LOCK only froze the cap. Camera lock below replaces it. Do not re-run I2V until he sends an authorizing sentence.

## Camera lock — vial planted, camera travels

Salvatore, 2026-09-17: the camera is supposed to move, not the vial. Apply to **both** lab (`C4BkmmISpTMmgnAg`) and landscape (`Kc2HqqjSyiKs87qy`). All 535 lab + 601 wellness `video_motion_prompt` rows, including 5ml. Pens out of scope. Unique `Slow cinematic camera:` recipes stay (wellness orbits stay camera orbits; turntable is forbidden). Do not hardcode this in `prep_grok_video_start`.

```text
CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable.
```

```bash
python3 marketing/scripts/lock_camera_not_vial.py           # dry run
python3 marketing/scripts/lock_camera_not_vial.py --write
```

Live write, 2026-09-17 (camera moved the vial on exec 2261): unpublished n8n `lock_camera_not_vial` (`IuPO3E9eOz5ebFAY`) exec **2262** wrote `video_motion_prompt` only on 535 lab + 601 wellness rows, including 5ml. CAP LOCK → CAMERA LOCK. Unique camera recipes kept. Pens untouched. TINY helix on `video_prompt` not written. Read-back `verify_lock_camera_not_vial` (`DBoj9PvFC6YDaHPa`) exec **2263**: lab 535/535 CAMERA LOCK leftover 0 unique 535; wellness 601/601 leftover 0 unique 601; LI-016 and PBVita-Lab-207 start with planted-vial CAMERA LOCK. **Archived 2026-09-17.** Do not publish. Do not run vid-gen from these workflows. Do not re-run I2V until Salvatore sends an authorizing sentence. The accepted still remains `https://imgen.x.ai/xai-imgen/xai-tmp-imgen-1e6c9ce0-b34f-9b25-b514-d5894eb02da3-c1c3d8db.png`.

Live write, 2026-09-18 (landscape still still showed cap tabs): unpublished n8n `lock_simple_blue_cap` (`XT7rcU0iyCU9vWPn`) exec **2270** replaced flip-off cap wording with a simple uniform one-piece blue disc on 535 lab + 601 wellness still/video prompt fields, including 5ml. Tabs forbidden. CAMERA LOCK and TINY helix not written. Read-back `verify_lock_simple_blue_cap` (`cqUy5f8AWqeePD4v`) exec **2271**: lab 535/535 simple uniform leftover flip-off 0; wellness 601/601 leftover 0. **Archived 2026-09-18.** Do not publish. Do not run vid-gen from these workflows.

Live write, 2026-09-17 (Wolverine print name): unpublished n8n `apply_wolverine_print_name` (`74OyZ0RWA6d9KdIr`) exec **2252** printed `BPC-157/TB-500` on 29 lab + 32 wellness + 5 pen rows. `compound_name` / `choose_compound` stay **Wolverine**. Read-back `verify_wolverine_print_name` (`LnKj6WPzoVFrknxg`) exec **2253**: PBVita-Lab-207 still handle Wolverine, `reading exactly 'BPC-157/TB-500'`. **Archived 2026-09-17.** Do not publish. Do not run vid-gen from these workflows.

Live write, 2026-09-17 (Melanotan 2 fold-in from held PR #76): unpublished n8n `apply_melanotan2_rename` (`n85xPWY4xY3LdfhY`) exec **2254** set selector + print to **Melanotan 2** on PBVita-Lab-511–515 and 24 wellness rows. Read-back `verify_melanotan2_rename` (`Rz6i6fav0a06V2XR`) exec **2255**. 10ml lock (`2.36 times the width`) and Wolverine print stay. **Archived 2026-09-17.** Do not publish. Do not run vid-gen from these workflows.
