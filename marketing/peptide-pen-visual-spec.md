# Peptide pen — measured visual spec

Measured from the live catalog photos on **www.palmbeach-vitality.store**,
`/product-category/peptide-pens/`. Thirteen pens sampled: BPC-157, GHK-Cu, KLOW,
KPV, MOTS-C, NAD+, PT-141, Selank, Semax, SS-31, TA-1, Tesamorelin 10mg,
Wolverine. Every photo is 1008 × 1792.

This is the **peptide** pen only. The weight-loss pens
(`/product-category/weight-loss-pens/`) are a different accent colour and are
out of scope here.

### Scope, verified

Salvatore asked for the peptide pens and not the weight-loss pens, so this is
checked rather than assumed:

- The measured sample is thirteen pens off `/product-category/peptide-pens/`.
  The blue metabolic pen photos that sit in `woocommerce-migration/data/` were
  **not** sampled.
- The weight-loss pen category is Semaglutide, Tirzepatide and Retatrutride
  only (17 SKUs, `woocommerce-migration/data/products-4-categories.csv`).
- None of those three, and no `GLP-1` or weight-loss wording, appears anywhere
  in the 168 × 8 values this spec rewrites on the pen tab.

Re-runnable as `marketing/scripts/apply_measured_pen_spec.py`; the standing
result is in `/opt/cursor/artifacts/peptide-pen-scope-and-lock-audit.log`.

## Why this file exists

Salvatore, 2026-09-16, on the first fal Kling Pro pen clip: *"the red bottom part
of the pen should not be wider then the rest of the pen."* The sheet lock asked
for a *"small flat circular plunger tip at the bottom of the dial in crimson
red"* and never said how wide it may be, so the model was free to flare it into
a base. Measuring the real product fixes both the width and the colour.

## Geometry

| Fact | Value |
|---|---|
| Length : barrel diameter | **8.3 : 1** (measured 7.6–8.8, 13 pens) |
| Barrel diameter | **one constant width, cap to dial** |
| Cap (incl. flat top) | top **36%** of total length |
| Pocket clip | runs down the top **27%** of total length |
| Upper steel collar | **6%** of length, **flush** with barrel |
| Label barrel | **44%** of length |
| Lower steel collar | **4%** of length, **flush** |
| White ridged dose dial | **6%** of length, **flush** |
| Bottom push button | last **4%** of length, **0.92 × barrel diameter** |

The only diameter change on the whole pen is the bottom button, and it steps
**in**. Nothing on the pen is ever wider than the barrel.

Button width measured 0.916–0.933 of barrel diameter across all thirteen pens —
never 1.0, never above it.

## Parts, top to bottom

1. **Cap** — white gloss, flat top, integrated white pocket clip moulded into the
   cap wall. Same diameter as the barrel. Always on; the needle is never shown.
2. **Upper collar** — brushed steel ring, flush, carrying **two small
   rounded-square dose windows** side by side.
3. **Label barrel** — white gloss. Artwork order: steel-blue DNA
   double-helix icon on top, then the compound name in bold condensed deep brick
   red set **along the barrel axis** (rotated, reads bottom-to-top), with one
   graphite line beside it reading the dose and `3ml` (e.g. `500mg 3ml`).
4. **Lower collar** — brushed steel ring, flush.
5. **Dose dial** — **white**, vertical flutes, flush.
6. **Push button** — short knurled **orange** cylinder with gear-tooth ridges
   around the rim, 0.92 × barrel diameter.

## Colours

| Part | Measured (median) | Range across pens | Sheet currently says |
|---|---|---|---|
| Compound name | **#B13A3B** brick red | #9E292B – #E43130 | `crimson red #DC143C` |
| DNA helix | **#8FA7C1** steel blue | #528CB8 – #AAB8CB | `crimson red #DC143C`, plus "No blue accents" |
| Bottom button | **#BE4718** orange | #BA4210 – #C74E1E | `crimson red`, plus "FORBIDDEN: orange anywhere" |
| Dose line text | **#19191A** graphite | — | not specified |
| Barrel, cap, dial | white gloss | — | `matte white` |
| Two collars | brushed steel | — | `NOT brushed-silver metal` |

Sampled as the eroded median of the glyph fill, so these are the values as the
catalog photo renders them, which is what an image model has to reproduce.

Orange lives on the bottom button and nowhere else. Blue lives on the helix and
nowhere else.

## Stack SKUs behave differently

Three rows on the sheet are stacks, and their labels are not built like the
single-compound pens:

- **Wolverine** prints its **contents**, not its name: `BPC-157/TB-500`, dose
  line `10/10mg 3ml`.
- **KLOW** prints the stack name in a brighter red (#C21613) over a stronger
  blue helix (#528CB8), dose line `10/10/10/50mg 3ml Pen`.
- **GLOW** prints its name in **white letters with a red glow halo**, not solid
  red, dose line `10/10/50mg 3ml Pen`.

The dose line ends `3ml` on the single-compound pens and `3ml Pen` on GLOW and
KLOW, so the lock says "the dose and '3ml'" rather than pinning an exact string.

## What the sheet lock gets wrong

All counts are fields on `marketing/sheets/14-pen-creations-150.csv` (168 rows).

| Sheet text | Reality | Fields carrying it |
|---|---|---|
| `Small flat circular plunger tip at the bottom of the dial in crimson red` | knurled **orange** cylinder at 0.92 × barrel, steps in | `lab_item`, `material_detail`, `scene_brief`, `video_prompt` |
| `FORBIDDEN: orange anywhere` | orange **is** the button | `lab_item`, `video_prompt` |
| `No blue accents` | helix **is** steel blue | 5 fields + 19 `scene_brief` |
| `crimson red #DC143C` helix and name | helix is `#8FA7C1`, name is `#B13A3B` | 5 fields + 19 `scene_brief` |
| `matte white` barrel | white **gloss** | 7 fields |
| `NOT brushed-silver metal` | barrel is not metal, but **two collars are brushed steel** | `lab_item`, `video_prompt` |
| `small rectangular transparent barrel window beside the label` | no barrel window; **two rounded-square dose windows in the upper steel collar** | `lab_item`, `material_detail`, `scene_brief`, `video_prompt` |
| `Solid crimson red rectangle badge with white text exactly '3ml Pen'` | no badge; a graphite `<dose> 3ml` line | 6 fields |
| `stretch 10-20 percent longer than a stubby travel pen` | pin it: length = **8.3 × diameter** | `lab_item`, `video_prompt` |
| nothing about uniform width | **one constant diameter**, all collars and the dial flush | — |

`White ridged gear-like dose dial (NOT colored, NOT orange)` is correct as
written and stays.

## The replacement text

Six find-and-replace blocks, all approved by Salvatore on 2026-09-16.
`{COMPOUND}` is the name the row actually prints on the label, captured from the
text rather than read from `compound_name` — row 26 is keyed `Tesa-Ipa` but
prints `Tesamorelin/Ipamorelin`. Nothing is hardcoded.

Applied to the repo mirror by `marketing/scripts/apply_measured_pen_spec.py`.

### 1. PEN VISUAL LOCK — the constant prefix

Appears on `lab_item`, `material_detail`, `hero_style`, `video_prompt`,
`still_edit_prompt` (168 rows each) and 19 `scene_brief` values.

**Currently:**

> PEN VISUAL LOCK (identical every frame, ZERO EXCEPTIONS): Exactly ONE Palm Beach Vitality 3ml injection pen. Same pen size, shape, and design every time: longer full-length matte white barrel, white clip-cap ON, white ridged dose dial, accent plunger tip. RED ACCENTS only (peptide): crimson red #DC143C compound name, logo, helix, and plunger/accent bits. Logo = crimson red #DC143C double-helix DNA icon only — no hands near the helix. No blue accents. No orange. No vial. No second pen.

**Proposed:**

> PEN VISUAL LOCK (identical every frame, ZERO EXCEPTIONS): Exactly ONE Palm Beach Vitality 3ml injection pen, built to the catalog photo. ONE CONSTANT DIAMETER from cap to dial — the cap, both steel collars and the white ridged dose dial are all flush with the barrel at the same width. Nothing on this pen is ever wider than the barrel: no flare, no skirt, no foot, no cone, no pedestal, no widening base. PROPORTION: total length is 8.3x the barrel diameter. TOP TO BOTTOM: white gloss cap with a flat top and an integrated white pocket clip, cap = top 36 percent of the pen, clip running down the top 27 percent; a brushed-steel collar (6 percent of length, flush) carrying TWO small rounded-square dose windows side by side; the white gloss label barrel (44 percent); a second brushed-steel collar (4 percent, flush); the WHITE ridged dose dial with vertical flutes (6 percent, flush); and last, a short knurled ORANGE #BE4718 push button with gear-tooth ridges around its rim at 0.92x the barrel diameter — it STEPS IN, narrower than the barrel, never as wide, never wider. LABEL: steel-blue #8FA7C1 double-helix DNA icon on top — no hands near the helix; below it the compound name '{COMPOUND}' in bold condensed brick red #B13A3B, set along the barrel axis so it reads bottom-to-top; beside the name one graphite #19191A line reading the dose and '3ml'. No badge, no red rectangle. Orange appears ONLY on the bottom push button — never on the dial, the name, the helix, or the cap. Blue appears ONLY on the helix. No vial. No second pen.

### 2. HARD OUTPUT LOCK (READ FIRST)

Appears on `lab_item` and `video_prompt`, 168 rows each. Only the product
sentences change; the scene copy after `FORBIDDEN: extra pens, production row,
lineup, cluster, second pen.` is untouched.

**Currently:**

> HARD OUTPUT LOCK (READ FIRST): Copy the catalog injector still. Render exactly ONE smooth matte white cylindrical insulin-style Palm Beach Vitality research pen labeled '{COMPOUND}', as a single catalog hero. Camera closer on the one pen. Product count = 1. LONGER full-length barrel — stretch 10-20 percent longer than a stubby travel pen, adult injector, not compact, not short, keep the diameter. This is a medical injection pen, NOT a glass vial, NOT brushed-silver metal, NOT a perfume cartridge, NOT a chrome claw stand. White matte cap ON with integrated white pocket clip covering the tip — never removed, never sitting beside the pen, never showing a needle. White ridged gear-like dose dial (NOT colored, NOT orange). Small flat circular plunger tip at the bottom of the dial in crimson red. No mixed compounds. No vial. No syringe. No people. COLOR LOCK: Every pen on this sheet is a peptide pen = crimson red text + logo. No other accent colour exists on this sheet. This SKU is peptide / crimson red. FORBIDDEN: orange anywhere. FORBIDDEN: hands near the DNA helix.

**Proposed:**

> HARD OUTPUT LOCK (READ FIRST): Copy the catalog injector still. Render exactly ONE smooth white gloss cylindrical insulin-style Palm Beach Vitality research pen labeled '{COMPOUND}', as a single catalog hero. Camera closer on the one pen. Product count = 1. PROPORTION: total length is 8.3x the barrel diameter, full-length adult injector, not compact, not short. ONE CONSTANT DIAMETER cap to dial — both steel collars and the white dial are flush; nothing steps out or flares. The pen body is a medical injection pen, NOT a glass vial, NOT an all-metal body, NOT a perfume cartridge, NOT a chrome claw stand — the only metal is the two flush brushed-steel collars, one below the cap with two small rounded-square dose windows and one above the dial. White gloss cap ON with integrated white pocket clip covering the tip — never removed, never sitting beside the pen, never showing a needle. White ridged gear-like dose dial (NOT colored, NOT orange). Bottom push button: short knurled orange #BE4718 cylinder at 0.92x the barrel diameter, stepped IN — never as wide as the barrel, never wider, never a flared base. No mixed compounds. No vial. No syringe. No people. COLOR LOCK: Every pen on this sheet is a peptide pen = brick red #B13A3B compound name, steel-blue #8FA7C1 helix, orange #BE4718 bottom button. No other accent colour exists on this sheet. FORBIDDEN: orange on the dial, cap, name, or helix. FORBIDDEN: hands near the DNA helix.

### 3. FORM

Appears on `lab_item`, `material_detail`, `scene_brief`, `video_prompt`, 168 rows
each.

**Currently:**

> FORM (from 3-image-scenes-150 product_form_detail): smooth matte white cylindrical insulin-style injectable research pen with a LONGER full-length barrel — PROPORTION: barrel 10-20 percent longer than a stubby travel pen, full-length elongated adult injector, not compact, not short; stretch the white barrel, keep the diameter the same; matching white matte cap ON with integrated white pocket clip covering the tip; white ridged gear-like dose dial (NOT colored, NOT orange); small flat circular plunger tip at the bottom of the dial in the accent color; small rectangular transparent barrel window beside the label (a glimpse of liquid/mechanism only — NOT a tall glass reservoir, NOT most of the body as glass); hard specular highlights, cap on, COUNT=1; barrel window shows settled crystal-clear colorless liquid already inside at a stable level; never filling.

**Proposed:**

> FORM (from 3-image-scenes-150 product_form_detail): smooth white gloss cylindrical insulin-style injectable research pen — PROPORTION: total length 8.3x the barrel diameter, full-length adult injector, not compact, not short; ONE CONSTANT DIAMETER from cap to dial, every section flush, nothing wider than the barrel anywhere; matching white gloss cap ON with a flat top and integrated white pocket clip covering the tip, cap = top 36 percent of the pen; flush brushed-steel collar below the cap with TWO small rounded-square dose windows side by side (the only window on the pen — NOT a barrel window, NOT a glass reservoir, NOT a glass body); white ridged gear-like dose dial with vertical flutes, flush (NOT colored, NOT orange); bottom push button = short knurled orange #BE4718 cylinder at 0.92x the barrel diameter, stepped IN, narrower than the barrel, never wider, never flared; soft specular highlights on gloss white, cap on, COUNT=1.

### 4. LABEL (MANDATORY)

Appears on `lab_item`, `material_detail`, `scene_brief`, `video_prompt`, 168 rows
each.

**Currently:**

> LABEL (MANDATORY): clean white wrap-around barrel label. Logo ABOVE the name: crimson red DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. Exact compound name '{COMPOUND}' in large bold crimson red sans-serif (Helvetica/Arial). Solid crimson red rectangle badge with white text exactly '3ml Pen'. FORBIDDEN: orange DNA, orange name, orange badge, orange dial, orange anywhere, burgundy vial branding, palm tree, extra class names, poster overlays.

**Proposed:**

> LABEL (MANDATORY): clean white gloss wrap-around barrel label. Logo ABOVE the name: steel-blue #8FA7C1 DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. Exact compound name '{COMPOUND}' in large bold condensed brick red #B13A3B sans-serif (Helvetica/Arial), set along the barrel axis so it reads bottom-to-top. One graphite #19191A line beside the name reading the dose and '3ml'. No badge, no red rectangle, no white-on-red text. FORBIDDEN: orange DNA, orange name, orange dial, orange cap, red helix, blue name, burgundy vial branding, palm tree, extra class names, poster overlays.

### 5. HARD OUTPUT LOCK (FINAL CHECK)

Appears on `lab_item`, `material_detail`, `scene_brief`, `video_prompt`, 168 rows
each.

**Currently:**

> HARD OUTPUT LOCK (FINAL CHECK): This is exactly ONE freshly made pen, camera closer on the one hero. Product count = 1. No extra pens. No vials. No mixed SKUs. Cap on. Longer full-length barrel on each pen. White dial. Accent plunger tip. DNA helix with no hands. No orange.

**Proposed:**

> HARD OUTPUT LOCK (FINAL CHECK): This is exactly ONE freshly made pen, camera closer on the one hero. Product count = 1. No extra pens. No vials. No mixed SKUs. Cap on. Length 8.3x the barrel diameter. One constant diameter cap to dial, every section flush. White ridged dial. Bottom push button orange and narrower than the barrel — if the bottom is as wide as the barrel or wider, the frame is wrong. DNA helix in steel blue with no hands. Compound name in brick red.

### 6. CRITICAL PRODUCT FIX — `still_edit_prompt` only

Appears on `still_edit_prompt`, 168 rows.

**Currently:**

> CRITICAL PRODUCT FIX: Keep this exact catalog pen, then remove every extra pen until only ONE remains. White matte barrel, white clip-cap ON, white ridged dose dial (NOT orange). Logo ABOVE the name: crimson red #DC143C DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. Name '{COMPOUND}' large bold crimson red #DC143C sans-serif. Solid crimson red #DC143C rectangle badge with white '3ml Pen'. This is a peptide SKU — crimson red #DC143C text and logo on the pen.

**Proposed:**

> CRITICAL PRODUCT FIX: Keep this exact catalog pen, then remove every extra pen until only ONE remains. White gloss barrel at one constant diameter, white clip-cap ON, white ridged dose dial (NOT orange), two flush brushed-steel collars. NARROW THE BOTTOM: the bottom push button must be orange #BE4718 and 0.92x the barrel diameter — if it is as wide as the barrel or wider, or reads as a flared base, skirt, or foot, shrink it until it steps in. Logo ABOVE the name: steel-blue #8FA7C1 DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. Name '{COMPOUND}' large bold condensed brick red #B13A3B sans-serif along the barrel axis. No badge, no red rectangle.

## The dose on the label — settled

`video_prompt` and `still_edit_prompt` used to carry `No milligram dose. No
10mg.` on all 168 rows, and `still_edit_prompt` actively stripped milligram
text. The real catalog label **does** print the dose: `500mg 3ml`, `50mg 3ml`,
`10mg 3ml`.

Salvatore chose **match the catalog**, so the dose line stays and is specced as
a graphite `#19191A` line reading the dose and `3ml`, set along the barrel axis
with the name. The `No milligram dose` wording is gone from the tab.

## Four variants the six blocks did not reach

The six blocks are worded as one canonical sentence each, but the tab was built
by several earlier scripts and carries per-row variants. These four survived the
first pass and are now covered:

| Leftover | Where | Why the block missed it | Now |
|---|---|---|---|
| `barrel window shows settled crystal-clear colorless liquid already inside at a stable level; never filling` | `material_detail`, `scene_brief`, 162 rows | The block pinned a trailing `.`, but this clause ends `.` on `lab_item` and `video_prompt`, `;` on `material_detail`, and nothing at all on `scene_brief` | Terminator dropped from both sides of the pair, so all four fields match and each keeps its own punctuation |
| same clause, GLOW's `clear bright blue liquid ... (GLOW only — blue liquid)` | `material_detail`, `scene_brief`, 6 rows | Same pinned `.` | Same fix |
| `accent-color circular plunger tip in frame` | 5 rows × 4 fields | A fifth wording of the old tip, outside the FORM block | Replaced with `orange #BE4718 push button in frame, narrower than the barrel` |
| `research pen plunger-tip macro` | 25 fields | A shot name from `3-image-scenes-150 product_hero`, not product copy | Renamed `research pen push-button macro` — the part it frames is a push button |

The liquid clause was the one that mattered. It told the model there is a barrel
window with liquid in it, on the same row where the new FORM block says
`NOT a barrel window`. The real pen has no barrel window at all; its only
windows are the two dose windows in the upper steel collar. **GLOW's blue
liquid goes with it** — with no window there is nothing to see it through.

Also cleaned while in there: six `CJC/Ipamorelin` rows carried a mangled
duplicate label clause, left by an earlier script that substituted a name
containing a slash. It read
`('CJC/Ipamorelin', '3ml Pen', ... no hands)/Ipamorelin', '3ml Pen', ... vertical )`.
Pre-existing, not from this change, but it printed the `3ml Pen` badge string
this spec removes, so it is gone.

## How the rewrite is held in place

`apply_measured_pen_spec.py` asserts a `STALE` list — fourteen phrases that must
not survive anywhere on the tab. Two entries are deliberately blunter than the
block they came from, because the first pass proved one sentence per block is
not enough:

- `plunger` is scanned as a bare word. The old tip was worded five ways.
- `barrel window shows` is scanned instead of `barrel window`, because the new
  FORM block legitimately says `NOT a barrel window`.

`emit_pen_spec_code_node.py` generates the n8n Code node from the same tables
and hands it the same `STALE` list, so the live sheet is held to the mirror's
bar. Verified in node: byte-identical to the Python mirror on 168 rows × 8
fields, and a re-run rewrites 0 rows.
