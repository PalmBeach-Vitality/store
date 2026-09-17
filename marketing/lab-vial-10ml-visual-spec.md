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
| Blue flip-off cap width | 0.94 × W |
| Brushed-silver crimp collar width | 0.92 × W |
| Glass neck width | 0.66 × W |
| DNA helix width | **one tenth of the label** (never more than one eighth) |
| DNA helix height | 1.7 × helix width |
| Helix | tiny stamp-size mark above the name — not a large logo, not scaled to the compound name |

FORBIDDEN on 10ml rows: tall vial, slim vial, test-tube, ampoule, height greater than 2.4 × body width, oversized helix, helix wider than one eighth of the label, helix as wide as the compound name, helix filling the top of the label.

Apply helix shrink (after the 10ml geometry lock):

```bash
python3 marketing/scripts/shrink_10ml_helix.py           # dry run
python3 marketing/scripts/shrink_10ml_helix.py --write
```

Live write, 2026-09-17: unpublished n8n `apply_10ml_vial_spec` (`GqVY0SvZ1iSAFqdC`) wrote 506 lab rows and 577 wellness rows. 5ml Cagrilintide untouched. Archive after. Do not publish. Do not run vid-gen from this workflow.

Live write, 2026-09-17 (helix still too big on LI-016 smoke): unpublished n8n `shrink_10ml_helix` wrote 506 lab + 577 wellness rows. SMALL / one-fifth / quarter-of-name → TINY / one-tenth / forbid wider than one eighth. 5ml Cagrilintide untouched. Archive after. Do not publish. Do not run vid-gen from this workflow.

Live write, 2026-09-17 (Wolverine print name): unpublished n8n `apply_wolverine_print_name` (`74OyZ0RWA6d9KdIr`) exec **2252** printed `BPC-157/TB-500` on 29 lab + 32 wellness + 5 pen rows. `compound_name` / `choose_compound` stay **Wolverine**. Read-back `verify_wolverine_print_name` (`LnKj6WPzoVFrknxg`) exec **2253**: PBVita-Lab-207 still handle Wolverine, `reading exactly 'BPC-157/TB-500'`. Do not publish. Do not run vid-gen from these workflows.

Live write, 2026-09-17 (Melanotan 2 fold-in from held PR #76): unpublished n8n `apply_melanotan2_rename` (`n85xPWY4xY3LdfhY`) exec **2254** set selector + print to **Melanotan 2** on PBVita-Lab-511–515 and 24 wellness rows. Read-back `verify_melanotan2_rename` (`Rz6i6fav0a06V2XR`) exec **2255**. 10ml lock (`2.36 times the width`) and Wolverine print stay. Do not publish. Do not run vid-gen from these workflows.
