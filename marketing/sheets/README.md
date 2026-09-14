# Sheets reference (PB Vitality)

| File | Tab name |
|---|---|
| `3-image-scenes-150.csv` | `3-image-scenes-150` (IG/FB Buffer image scenes — `aspect_ratio` **3:4** feed posts, not 9:16; writeback = `last_used_date` only) |
| `latest-models.csv` | Still lock — Grok Imagine Image 2.0 everywhere except `18-motsc-film-stills` (Flux.2 Max trial) |
| `3-image-scenes-150.csv` | `3-image-scenes-150` (IG/FB image scenes — writeback = `last_used_date` only) |
| `3-figma-content-queue.csv` | `3-figma-content-queue` (Figma Content Studio queue) |
| `4-reel-queue.csv` | `4-reel-queue` (finished Creatomate packages — WF B `sheets_append_reel`) |
| `5-reel-scenes.csv` | `5-reel-scenes` (630 Creatomate/Grok visual scene briefs) |
| `6-quality-variables.csv` | `6-quality-variables` (Grok Imagine quality tokens) |
| `7-unique-reel-creations-500.csv` | `7-unique-reel-creations-500` (legacy abstract scenes — **do not use for Imagine**) |
| `health_wellness_scene_settings_100.csv` | Source list of **100** lifestyle scene settings (input only) |
| `8-lab-items-500.csv` | `8-lab-items-500` (legacy subject list — not auto-synced from wellness rebuild) |
| `9-lab-item-creations-500.csv` | `9-lab-item-creations-500` (**production** Grok still/video — 500 rows; includes `still_edit_prompt`, models, motion; no Creatomate `mod_*`) |
| `13-chem-breakdown-54.csv` | `13-chem-breakdown-54` (**new** chemical-breakdown molecule vids — same columns as Sheet 9; 27 compounds × 2 ranks = 54 rows; `shot_family` / `camera_move` / `surface` / `lighting` / `color_grade` each have **6** staggered values; do not mix with vial Sheet 9) |
| `15-caption-science-27.csv` | `15-caption-science-27` (**new** IG caption science briefs — 27 compounds; input for `peptide_caption_gen`) |
| `16-ig-captions.csv` | `16-ig-captions` (**new** caption archive — header + appended vial/pen captions after verify) |
| `14-pen-creations-150.csv` | `14-pen-creations-150` (**pens-only** catalog vids — Sheet 9 columns; **168 rows / 30 compounds**; **exactly 1 pen / 1 compound**; white clip-cap ON, white ridged dial, **crimson red on every row**, `3ml Pen` badge, no dose on the label; do not mix with Sheet 9 mixed lab rows or Sheet 13 molecules) |
| `17-seedance-25-t2v.csv` | `17-seedance-25-t2v` (**palmbeach-rx.com** Seedance 2.5 hyperrealistic T2V — 27 compounds; prompt / model / duration / resolution / aspect / audio / bitrate / wait on the sheet; native max 30s. Separate vitality.store T2V sheet is deferred.) |
| `21-sonilo-audio.csv` | Sonilo music+SFX columns for the joined MOTS-C reel (`sound_type=music_and_sfx`). Live write is `overlay_film_sonilo` onto Sheet 18. |
| `20-film-001-004-020-beach-entry.csv` | Snapshot of Sheet 18 overlay for FILM-001 / 004 (FILM-014 beach) + FILM-020 (space → atmospheric burn-up). Live write is `overlay_film_beach_entry`. |
| `19-film-join-25.csv` | Join-queue columns for the 25 MOTS-C film clips (also overlaid onto `18-motsc-film-stills`). VACE stitch + optional FLF2V seams — see `n8n-vace-clip-join.md` |
| `18-motsc-film-stills.csv` | `18-motsc-film-stills` (MOTS-C film stills + I2V stack — `video_provider` / `model_video` per beat: Seedance 2.5, Kling 3.0, Veo 3.1; Runway Gen-4.5 optional; finished cut **60–90s**) |
| `12-import-still-queue.csv` | `12-import-still-queue` (import path — same creative columns as Sheet 9 + `still_url` + `import_id`) |
| `10-creatomate-text-1000.csv` | `10-creatomate-text-1000` (Creatomate overlays: `product_name` + `mod_intro`/`mod_fact_*`) |
| `11-creatomate-render-queue.csv` | optional queue (legacy); WF B prefers Set node `video_url_input` — see `n8n-creatomate-package-workflow.md` |
| `10-creatomate-text-500.csv` | first 500 rows only (legacy; use 1000) |
| `8-lab-items-250.csv` / `9-lab-item-creations-250.csv` | Legacy compat copies (not updated by wellness rebuild) |
| `500_Peptide_Wellness_Reel_Scenes.csv` | Live landscape / lab-scene library (`500_Peptide_Wellness_Reel_Scenes`) — vial + pen rows; dosages from `compound-vial-labels.json` |

## Image scenes (`3-image-scenes-150`)

Columns: `scene_id`, `scene_category`, `scene_name`, `lab_environment`, `camera`, `lighting`, `product_hero`, `product_form_detail`, `compound_id`, `compound_name`, `canonical_url`, `scene_brief`, `caption_lock`, `status`, `rotation_order`, `last_used_date`, `aspect_ratio` (**3:4** — Buffer Instagram feed posts reject 9:16).
Columns: `scene_id`, `scene_category`, `scene_name`, `lab_environment`, `camera`, `lighting`, `product_hero`, `product_form_detail`, `compound_id`, `compound_name`, `canonical_url`, `scene_brief`, `caption_lock`, `status`, `rotation_order`, `last_used_date`. Pen overlay may add `still_prompt`, `model_still`, `aspect_ratio` (`9:16`), `still_resolution`, `still_n` on **`pen_3ml_scene` only**. Do **not** rewrite `vial_10ml_scene` or `lab_scene` prompts.

Writeback after Buffer: **`last_used_date` only** (match on `scene_id`). Captions come from Grok → `Parse_Grok` → `Save_render_URL`, not this sheet.

## Reel Studio / Creatomate

- Grok still/video library: tab **`9-lab-item-creations-500`** (sheets-only inputs — see `n8n-sheets-only-vid-gen.md`)
- Still edit text is **not** a sheet writeback. Type it as Fixed on n8n `still_edit_instructions`. Column **`still_edit_prompt`** on Sheet 9/14 may still exist; vid-gen does not read or write it.
- Grok still/video library: tab **`9-lab-item-creations-500`** (sheets-only inputs — see `n8n-sheets-only-vid-gen.md`). Daily wire + edit-before-video: `n8n-vid-gen-lab-scenes.md`.
- Optional still edit text: column **`still_edit_prompt`** (blank = skip edit)
- **`compound_name` is a selector, not label text.** `grok_imagine_reel_still` sends only `video_prompt`, so the name printed on the vial is whatever that prompt says; `compound_name` just picks the row. `pull_sheet_row` matches it with a two-way substring test on the normalized string, so a name that sits inside another active name is unreachable — `Ipamorelin` can never be addressed while `CJC/Ipamorelin` is Active. Where that happens, put a collision-free handle in `compound_name` and keep the real name in `video_prompt`. Check with `scripts/simulate_choose_compound.py` before adding a compound.
- **A new row's `video_prompt` must name its compound and carry the hard locks.** It is the only field the still node sends, so anything it omits never reaches the render — a prompt that says "compound name in large bold dark maroon" and nothing else returns an unlabeled vial. All 535 rows now carry `LABEL REQUIREMENT`, `VIAL STATE RULE`, `SINGLE HERO PRODUCT RULE`, `PRODUCT COUNT MUST EQUAL 1` and `NO DOUBLES ANYWHERE`; verify with `scripts/verify_rows_against_workflow.py` before adding rows.
- **Write to this tab with `cellFormat: RAW`.** Under the Sheets default (`USER_ENTERED`) the string `9:16` is coerced into a time value, which is why `prep_grok_video_start` carries a decimal-to-`h:mm` fallback for `aspect_ratio`.

Sheet 9 history: the tab went 500 -> 535 rows on 2026-09-14 (7 vial compounds x 5 rows), and the 70 lockless rows were repaired in the same pass. Both were applied by a throwaway workflow that was archived afterwards; no existing workflow was modified. `9-lab-item-creations-501-535-new.csv` and `9-lab-item-creations-unlabeled-70-fix.csv` are the audit record of what changed. The builders that produced them refuse to run again while the mirror holds 535 rows.

A second pass the same day fixed four prompt defects, audit record `9-lab-item-creations-cleanup.csv`, script `scripts/cleanup_sheet9_prompts.py`: six rows described the hero as another compound's research display; that same phrase called the hero yellow-green while the row's own `VIAL STATE RULE` locked a different fill; twelve non-GLOW rows carried GLOW's blue liquid and three GLOW rows were colourless; and `scene_brief` held a stale copy of the prompt head on every row, 252 of them naming a foreign compound. `scene_brief` is now re-derived from each row's own `FULL SCENE BRIEF` section. The blue flip-off cap is a separate lock from the blue fill and was not touched.

The `-250` files (`9-lab-item-creations-250.csv`, `../pbvita-250-lab-item-creations.json`) are **not** a second mirror of this tab. They are an older generation of the same `creation_id`s and differ on ~440 rows. `scripts/mirror_live_sheet9.py` used to overwrite them and no longer does. Decide whether to keep or delete them; until then, leave them alone.
- **Vial state (CRITICAL):** upright only; exactly one vial; pre-filled before still (never filling in video); clear liquid except **GLOW** = bright blue. Script: `scripts/enforce_vial_state_rules.py`
- **Single hero product (CRITICAL):** exactly **one vial OR one pen** per creation image — never both, never multiples. Script: `scripts/enforce_single_vial_or_pen.py`
- Vial look (Sheet 9 / 8 / 12 / `500_Peptide_Wellness_Reel_Scenes`): clear glass + **blue flip-cap** + silver crimp + white label with maroon DNA logo / compound name / maroon dosage bar / `10ml Sterile Multi-Use Vial` — see `scripts/enforce_pbvita_vial_packaging.py`
- **Vial dosages (CRITICAL):** maroon bar + black mg/ml must match `marketing/compound-vial-labels.json` (price list + Salvatore confirms). Sermorelin is **20mg / 2 mg/ml**, never 5mg. Script: `scripts/lock_vial_dosages.py`
- Vial look (Sheet 9 / 8 / 12): clear glass + **blue flip-cap** + silver crimp + white label with maroon DNA logo / compound name / maroon dosage bar with **catalog mg + mg/ml per compound** / volume footer — see `scripts/overlay_lab_vial_dosages.py` and `compound-vial-labels.json`
- Import stills: tab **`12-import-still-queue`** (do not paste URLs into Fixed n8n fields)
- Chemical-breakdown molecule vids: tab **`13-chem-breakdown-54`** (Sheet 9 columns; dark microscopic **cellular chemical reaction** — living cells + amino acids; no logo, no text, no sound; not a vial, not a pen). `shot_family`, `camera_move`, `surface`, `lighting`, `color_grade` each have **6** staggered values so consecutive ranks never match.
- Pens-only catalog vids: tab **`14-pen-creations-150`**, workflow `peptide_pen_vid_gen` (`eLM4xCpHflgqJGfB`). Sheet 9 **columns**, pen **input** from `3-image-scenes-150`. **168 rows, 30 compounds.** Exactly one white matte longer-barrel insulin-style 3ml pen, white clip-cap ON, white ridged dial, crimson red DNA helix (no hands) + compound name + `3ml Pen` badge. No orange, no vial, no production row, no second pen, and **no milligram dose** — the prompt forbids it, so pen rows need no dose research even though pen doses differ from vial doses. Type **GLOW**, **KLOW**, or **Wolverine** on `choose_compound` the same as any other SKU.
- Landscape vial + pen vids: live tab **`500_Peptide_Wellness_Reel_Scenes.csv`** (not in this repo). Same type-in: **GLOW**, **KLOW**, **Wolverine**. Chemical blend strings on that sheet map to those nicknames. Do not dump the 750-row sheet into git.
- **Every pen on Sheet 14 is crimson red — the same exact red, worded identically.** Salvatore took Semaglutide, Tirzepatide and Retatrutide off the tab on 2026-09-14, so there is no cobalt-blue SKU left and no metabolic exception in the prompt. The house red is **`crimson red #DC143C`** — the phrase and the number together, on every red in `video_prompt` and `still_edit_prompt`, all 3,626 of them. `dark red`, `crimson/dark-red` and every other variant are gone, because a prompt that names two reds for the same part renders a red that drifts between shots, and a prompt where only half the reds carry a number reads the same way. `#DC143C` is the standard named colour `crimson`, chosen as the closest number to the phrase already approved; no other colour number appears on the tab. The one red word that stays unnumbered is `burgundy vial branding`, which lives inside a FORBIDDEN clause. Enforce with `scripts/unify_pen_red.py` then `scripts/pin_pen_red_and_spec.py`.
- **Sheet 14 carries no vial spec.** `lab_item`, `material_detail` and `hero_style` used to open with a 716-character `VIAL VISUAL LOCK` on all 168 rows, as did 19 `scene_brief` values — glass vial, blue flip-off cap, 10ml multi-use, maroon dose bar. Each now opens with the row's own `PEN VISUAL LOCK`. None of those columns reaches an API, but a pen tab should not describe a vial. The workflow's canvas sticky note still describes the old red/blue split and still names Semaglutide as a `choose_compound` example — stale, and not edited because node edits need Salvatore's OK.
- **Sheet 14 selectors follow Sheet 9.** `pull_sheet_row` matches `compound_name` with a two-way substring test, so `CJC-1295`, `Tesa-Ipa` and `Ipamorelin-Solo` hold the selector while the pen still prints `CJC`, `Tesamorelin/Ipamorelin` and `Ipamorelin`. Check with `scripts/audit_pen_sheet.py` before adding a compound.
- IG captions (vial + pen): tab **`15-caption-science-27`** in, **`16-ig-captions`** out — research language only, no “human use” / “benefits of using”
- Creatomate text: tab **`10-creatomate-text-1000`**
- Finished packages log: tab **`4-reel-queue`**
- Creatomate / Buffer packages: **no music** (muted only)
