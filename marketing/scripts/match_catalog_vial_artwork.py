#!/usr/bin/env python3
"""Match Sheet 9's vial to the Palm Beach Vitality catalog artwork.

Salvatore sent the BPC-157 product photo and said the vial should be that exact
shape, with that exact helix. Measured off that image (1008x1792), relative to
the 576px glass body width:

    blue cap      95% of body width     10% of vial height
    silver crimp  88%                   11%
    glass neck    66%                   11%
    shoulder      flares to 100%        11%
    straight body 100%                  53%
    heel + base   --                     4%

Full height cap-top to base is 2.3x the body width, and the straight body alone
is only 1.2x as tall as it is wide. The sheet had none of this: all 535 rows
said "standard ~10ml multi-use vial proportions" -- including the 29 rows that
print a 5ml footer -- with no neck, shoulder or proportion language anywhere, so
the model rendered one default slim body at 2.5:1 for every volume.

The emblem measures 120 x 210px, so 7:4 taller than wide and about a fifth of
the label width -- not the half the earlier pass asked for. It is also two
broad gradient ribbons with short staggered dash rungs, while the live spec
asked for thin even strands and explicitly forbade dashes and uneven rungs.
That spec was pushing the model away from the brand mark.

Label ink sampled from the artwork: dose bar #A63334, compound name #9A2E2D,
helix ribbon #A43F3A -- one brick red, pinned as "brick red #A63334" the way
Sheet 14 pins "crimson red #DC143C". The printed strings on the real label are
also uppercase MG, mg/mL with no space, and Multi-Dose rather than Multi-Use.

Usage:
    python3 marketing/scripts/match_catalog_vial_artwork.py --dry-run
    python3 marketing/scripts/match_catalog_vial_artwork.py --write
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SHEET = REPO / "marketing/sheets/9-lab-item-creations-500.csv"
OUT_JSON = REPO / "marketing/sheets/9-lab-item-creations-artwork-fix.json"

RED = "brick red #A63334"

OLD_HARDWARE = (
    "Same vial shape and size every time: standard ~10ml multi-use vial proportions, "
    "cylindrical clear glass, brushed-silver aluminum crimp, plain bright blue plastic "
    "flip-off cap ONLY (smooth round flip-off — FORBIDDEN: tabs, wings, pull-tabs, "
    "tear-tabs, side flaps, hanging pieces)."
)

VIAL_SHAPE = (
    "VIAL SHAPE (MANDATORY — the Palm Beach Vitality catalog vial, identical every frame): "
    "a straight-sided cylindrical clear glass vial whose full height from the top of the cap "
    "down to the base is about 2.3 times the width of the glass body. From the top down: a "
    "flat royal-blue plastic flip-off cap, a plain smooth disc about 95% of the body width "
    "with a softly bevelled rim and a flat top, never domed; below it a tall straight-sided "
    "brushed-silver aluminium crimp collar about 88% of the body width, roughly as tall as "
    "the cap, with a small step at its lower edge; below that a short narrow glass neck about "
    "66% of the body width with a visible glass lip tucked up under the collar; then a smooth "
    "rounded shoulder flaring out to full body width; then the straight cylindrical body, the "
    "widest part, which carries the label; and a rounded heel over a thick clear glass base. "
    "Cap, collar, neck and shoulder together fill roughly the top 40% of the vial's height, "
    "the straight body the lower 55%. FORBIDDEN on the cap: tabs, wings, pull-tabs, tear-tabs, "
    "side flaps, hanging pieces."
)

WIDTH_10ML = (
    " This is the 10ml multi-dose vial: the straight cylindrical body is stout, only about "
    "1.2 times as tall as it is wide."
)
WIDTH_5ML = (
    " This is the 5ml multi-dose vial: the straight cylindrical body is visibly narrower than "
    "the 10ml vial, about 1.6 times as tall as it is wide."
)

LABEL_PLACEMENT = (
    " LABEL PLACEMENT: the white wrap-around label covers the straight cylindrical body only. "
    "Clear glass stays visible between the shoulder and the top of the label, and a thin band "
    "of clear glass shows below the label above the base. Printed content is inset about a "
    "tenth of the body width from each side edge."
)

EMBLEM = (
    " HELIX EMBLEM (MANDATORY — the Palm Beach Vitality logo, identical every frame): a single "
    "red DNA double-helix mark centred above the compound name, taller than it is wide at a "
    "height-to-width ratio of about 7:4, and about one fifth of the label's width — roughly a "
    "quarter as wide as the compound name beneath it. It is drawn as two broad flat tapering "
    "ribbons, like twisted paper streamers, spiralling around one vertical axis and crossing "
    "each other about three times from top to bottom. Each ribbon carries a smooth gradient "
    "from pale pink-white where it turns edge-on to deep brick red across its broad face, so "
    "the mark reads as a three-dimensional twist catching light. In each of the two open gaps "
    "between the ribbons sits a stepped group of three short horizontal rungs — flat solid "
    "dark red bars, staggered diagonally, of unequal length, floating clear of both ribbon "
    "edges. One emblem only. FORBIDDEN: thin uniform outlines with no gradient, strands made "
    "of separate beads or dots, two mirrored halves butted together, an hourglass or bowtie "
    "shape, rungs that span the full width like evenly spaced ladder steps, and any stray "
    "mark, blob or smear."
)

OLD_EMBLEM_RE = re.compile(r"\s*HELIX EMBLEM \(MANDATORY\):.*?mark, blob, or smear\.", re.S)
SPEC_TAIL = "in crisp sharp type that is fully legible at full resolution."

# Label ink. Every one of these named the same colour a different way.
COLOUR_SWAPS = [
    ("dark maroon", RED),
    ("dark red double-helix DNA emblem", f"{RED} double-helix DNA emblem"),
    ("dark red DNA double-helix logo", f"{RED} DNA double-helix logo"),
    ("dark red DNA helix icon", f"{RED} DNA helix icon"),
    ("maroon dose bar", f"{RED} dose bar"),
    ("maroon dosage bar", f"{RED} dosage bar"),
]

FOOTER_RE = re.compile(r"'(\d+)ml Sterile Multi-Use Vial'")

# Replaced as quoted literals, not by pattern: the inserted prose contains
# apostrophes ("the vial's height"), which desynchronises any generic
# single-quote pairing. A quoted literal is unambiguous -- '10mg' cannot match
# inside '10mg/10mg', because the character after 10mg there is a slash.
DOSES = ["10mg", "20mg", "25mg", "30mg", "50mg", "1000mg",
         "10mg/10mg", "12mg/3mg", "10/10/50mg", "10/10/10/50mg"]
CONCS = ["1 mg/ml", "2 mg/ml", "3 mg/ml", "5 mg/ml", "100 mg/ml",
         "1mg/1mg/ml", "1mg/1mg/5mg/ml", "1mg/1mg/1mg/10mg/ml"]
FOOTERS = ["10ml Sterile Multi-Use Vial", "5ml Sterile Multi-Use Vial"]


def brand_typography(prompt: str) -> str:
    """Rewrite the printed label strings into the catalog's own typography."""
    for d in DOSES:
        prompt = prompt.replace(f"'{d}'", "'" + d.replace("mg", "MG") + "'")
    for c in CONCS:
        prompt = prompt.replace(f"'{c}'", "'" + c.replace(" mg/ml", "mg/ml").replace("mg/ml", "mg/mL") + "'")
    for f in FOOTERS:
        prompt = prompt.replace(f"'{f}'", "'" + f.replace("ml ", "mL ").replace("Multi-Use", "Multi-Dose") + "'")
    return prompt


def rewrite(prompt: str, creation_id: str) -> str:
    m = FOOTER_RE.search(prompt)
    if not m:
        raise SystemExit(f"{creation_id}: cannot read the footer volume")
    width = WIDTH_5ML if m.group(1) == "5" else WIDTH_10ML

    if OLD_HARDWARE not in prompt:
        raise SystemExit(f"{creation_id}: hardware clause not found")

    out = brand_typography(prompt)

    for old, new in COLOUR_SWAPS:
        out = out.replace(old, new)
    if re.search(r"\bmaroon\b", out) or re.search(r"\bdark red\b", out):
        leftover = re.findall(r".{0,40}(?:\bmaroon\b|\bdark red\b).{0,40}", out)
        raise SystemExit(f"{creation_id}: colour word survived -> {leftover[:2]}")

    out = out.replace(OLD_HARDWARE, VIAL_SHAPE + width, 1)

    out, n = OLD_EMBLEM_RE.subn("", out, count=1)
    if n != 1:
        raise SystemExit(f"{creation_id}: old emblem block not found")
    if out.count(SPEC_TAIL) != 1:
        raise SystemExit(f"{creation_id}: expected one label spec close")
    out = out.replace(SPEC_TAIL, SPEC_TAIL + LABEL_PLACEMENT + EMBLEM, 1)

    return re.sub(r"[ \t]+", " ", out).strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.write or args.dry_run):
        ap.error("pass --dry-run or --write")

    with SHEET.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        rows = [dict(r) for r in reader]

    for r in rows:
        if "VIAL SHAPE (MANDATORY" in r["video_prompt"]:
            raise SystemExit("the sheet already carries the artwork match — restore the mirror from git first")
        r["video_prompt"] = rewrite(r["video_prompt"], r["creation_id"])

    fails, vols = [], {}
    for r in rows:
        p = r["video_prompt"]
        for once in ("VIAL SHAPE (MANDATORY", "LABEL PLACEMENT:", "HELIX EMBLEM (MANDATORY",
                     "HERO SCALE (MANDATORY)", "LABEL REQUIREMENT: the label prints exactly"):
            if p.count(once) != 1:
                fails.append(f"{r['creation_id']}: {once!r} count {p.count(once)}")
        if "multi-dose vial: the straight cylindrical body" not in p:
            fails.append(f"{r['creation_id']}: no per-volume width clause")
        if "~10ml multi-use vial proportions" in p:
            fails.append(f"{r['creation_id']}: old proportion text survived")
        if "Multi-Use Vial" in p or re.search(r"'\d+ml Sterile", p):
            fails.append(f"{r['creation_id']}: old footer typography survived")
        if re.search(r"'[\d/]+mg'", p) or re.search(r"' ?\d[\d/ ]*mg/ml'", p):
            fails.append(f"{r['creation_id']}: old dose/conc typography survived")
        if "ribbons, like twisted paper streamers" not in p:
            fails.append(f"{r['creation_id']}: emblem ribbon wording missing")
        f = re.search(r"footer reading exactly '([^']+)'", p)
        if f:
            vols[f.group(1)] = vols.get(f.group(1), 0) + 1

    lens = [len(r["video_prompt"]) for r in rows]
    print(f"rows: {len(rows)}")
    print(f"footers: {vols}")
    print(f"prompt length: {min(lens)}-{max(lens)} chars")
    print(f"QA: {'PASS' if not fails else f'{len(fails)} FAIL'}")
    for f in fails[:20]:
        print("   ", f)
    if fails:
        return 1

    if args.write:
        with SHEET.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)
        OUT_JSON.write_text(
            json.dumps(
                [{"creation_id": r["creation_id"], "video_prompt": r["video_prompt"]} for r in rows],
                indent=1,
            )
            + "\n"
        )
        print(f"\nwrote {SHEET.name}, {OUT_JSON.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
