#!/usr/bin/env python3
"""Specify the DNA emblem on Sheet 9 so it stops rendering as beadwork.

The second Cagrilintide still (2026-09-14) got the text, size and position
right and the helix wrong. The reason was the same as the empty dose bar: all
535 rows spent nine words on it -- "dark red double-helix DNA icon at top" --
with no geometry at all. Nothing in the sheet said ``continuous``, ``strand``,
``rung``, ``turns`` or ``emblem``, so the model invented the rest and produced
beaded strands, two mirrored almond halves butted together, fringe-like rungs
hanging off one strand, and a smear where the halves met.

Three edits, approved by Salvatore:

1. A ``HELIX EMBLEM (MANDATORY)`` block giving the emblem continuous strands,
   a fixed number of crossings, perpendicular even rungs, and an explicit
   forbidden list covering every defect in that render.
2. The 70 rows that name the icon twice called it ``dark red`` once and
   ``dark maroon`` once. One element, one colour word.
3. The maroon dose bar ran to the label's right edge and was clipped, so it is
   now inset with even margin.

Usage:
    python3 marketing/scripts/fix_vial_helix_emblem.py --dry-run
    python3 marketing/scripts/fix_vial_helix_emblem.py --write
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
OUT_JSON = REPO / "marketing/sheets/9-lab-item-creations-helix-fix.json"

OLD_ICON = "white face with dark red double-helix DNA icon at top,"
NEW_ICON = "white face with a single dark red double-helix DNA emblem centred at the top,"

OLD_LOGO = "dark maroon DNA double-helix logo"
NEW_LOGO = "dark red DNA double-helix logo"

# The label spec sentence closes on this; the emblem block goes straight after.
SPEC_TAIL = "in crisp sharp type that is fully legible at full resolution."

BAR_INSET = (
    " The maroon dose bar is inset from both label edges with even white margin "
    "on the left and the right, never bleeding off the edge of the label."
)

HELIX = (
    " HELIX EMBLEM (MANDATORY): the DNA emblem is drawn as two smooth continuous solid "
    "curved strands of even stroke weight that twist around one horizontal axis and cross "
    "each other exactly four times, joined by short straight rungs of equal length and "
    "equal weight running perpendicular between the two strands at even spacing. The "
    "emblem is one unbroken piece of artwork about half the label width, centred above the "
    "compound name. FORBIDDEN in the emblem: beads, dots, dashes, broken or segmented "
    "strands, two mirrored halves butted together, an hourglass or bowtie shape, "
    "fringe-like rungs hanging from one strand only, rungs of uneven length, and any stray "
    "mark, blob, or smear."
)


def rewrite(prompt: str, creation_id: str) -> str:
    if OLD_ICON not in prompt:
        raise SystemExit(f"{creation_id}: label icon phrase not found")
    out = prompt.replace(OLD_ICON, NEW_ICON)
    out = out.replace(OLD_LOGO, NEW_LOGO)

    if out.count(SPEC_TAIL) != 1:
        raise SystemExit(f"{creation_id}: expected one label spec close, found {out.count(SPEC_TAIL)}")
    out = out.replace(SPEC_TAIL, SPEC_TAIL + BAR_INSET + HELIX, 1)
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

    logo_rows = sum(1 for r in rows if OLD_LOGO in r["video_prompt"])
    for r in rows:
        if "HELIX EMBLEM (MANDATORY)" in r["video_prompt"]:
            raise SystemExit("the sheet already carries the emblem spec — restore the mirror from git first")
        r["video_prompt"] = rewrite(r["video_prompt"], r["creation_id"])

    fails = []
    for r in rows:
        p = r["video_prompt"]
        if p.count("HELIX EMBLEM (MANDATORY)") != 1:
            fails.append(f"{r['creation_id']}: emblem block count != 1")
        if OLD_ICON in p or OLD_LOGO in p:
            fails.append(f"{r['creation_id']}: old icon wording survived")
        if "dark maroon DNA" in p:
            fails.append(f"{r['creation_id']}: second colour word for the emblem survived")
        if p.count("inset from both label edges") != 1:
            fails.append(f"{r['creation_id']}: bar inset count != 1")
        # The earlier legibility pass must still be intact.
        for guard in ("HERO SCALE (MANDATORY)", "LABEL REQUIREMENT: the label prints exactly"):
            if guard not in p:
                fails.append(f"{r['creation_id']}: lost {guard}")

    lens = [len(r["video_prompt"]) for r in rows]
    print(f"rows: {len(rows)}   rows naming the logo twice: {logo_rows}")
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
