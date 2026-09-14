#!/usr/bin/env python3
"""Make every peptide pen ask for one single red.

Salvatore: all peptide pens use the same exact red.

The prompts did not. Within one prompt the model was told three different
reds for the same parts. The PEN VISUAL LOCK head asked for a
"crimson/dark-red" name and a "dark red" DNA helix, then the LABEL clause a
few sentences later asked for a "crimson red" helix and a "crimson red"
name. The helix in particular was given two different colours in the same
breath, which is how you get a red that drifts shot to shot.

Every other red in the pen-facing prompts was already "crimson red", so this
normalises the two stragglers onto the term already in use rather than
introducing a new one. The only other red word left is "burgundy vial
branding", which sits inside a FORBIDDEN clause and must stay.

Scope is the two fields that reach an API — video_prompt, which
grok_imagine_pen_still sends, and still_edit_prompt. video_motion_prompt
carries no colour words at all.

    python3 marketing/scripts/unify_pen_red.py           # dry run
    python3 marketing/scripts/unify_pen_red.py --write
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
MIRROR = SHEETS / "14-pen-creations-150.csv"

RED = "crimson red"

REPLACEMENTS = [
    (
        "RED ACCENTS only (peptide): crimson/dark-red compound name",
        f"RED ACCENTS only (peptide): {RED} compound name",
    ),
    (
        "Logo = dark red double-helix DNA icon only",
        f"Logo = {RED} double-helix DNA icon only",
    ),
]

FIELDS = ["video_prompt", "still_edit_prompt"]

RED_WORD = re.compile(
    r"\b(?:dark[ -]red|crimson[/-]dark-red|crimson red|crimson|maroon|burgundy|"
    r"scarlet|ruby|vermilion)\b",
    re.I,
)


TAIL = re.compile(r"\s?LABEL: only ")


def stray_red(text: str) -> list[str]:
    """Red words that are neither the house red nor the FORBIDDEN burgundy."""
    # Most prompts are cut off mid-sentence and given a "LABEL: only ..."
    # tail. A red word chopped in half at that seam is a length problem, not
    # a colour one, so ignore anything inside the cut.
    tail = TAIL.search(text)
    cut = tail.start() if tail else len(text)

    out = []
    for match in RED_WORD.finditer(text):
        phrase = match.group(0).lower()
        if phrase == RED:
            continue
        if phrase == "burgundy" and text[match.end() :].startswith(" vial branding"):
            continue
        if match.end() >= cut - 20:
            continue
        out.append(phrase)
    return out


def main() -> int:
    write = "--write" in sys.argv

    with MIRROR.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]

    print(f"{len(rows)} rows\n")

    touched: list[str] = []
    counts: Counter[str] = Counter()
    for row in rows:
        changed = False
        for field in FIELDS:
            value = row[field]
            for old, new in REPLACEMENTS:
                if old in value:
                    counts[f"{field}: {old[:46]}"] += value.count(old)
                    value = value.replace(old, new)
                    changed = True
            row[field] = value
        if changed:
            touched.append(row["creation_id"])

    for label, n in sorted(counts.items()):
        print(f"  {n:4d}  {label}...")
    print(f"\nrows rewritten: {len(touched)}")

    # --- QA -----------------------------------------------------------------
    failures: list[str] = []

    def check(label: str, ok: bool, detail: object = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label} — {detail}")
        if not ok:
            failures.append(label)

    print("\nQA")
    check("every row rewritten", len(touched) == len(rows), len(touched))

    stray: Counter[str] = Counter()
    for row in rows:
        for field in FIELDS:
            stray.update(stray_red(row[field]))
    for phrase, n in stray.most_common():
        print(f"        {n} x {phrase!r}")
    check("only one red word survives", not stray, f"{len(stray)} variants")

    # Surfaced by the colour scan: some prompts are cut off mid-word before a
    # trailing "LABEL: only ..." tail. Length problem, reported not fixed.
    cut = [r for r in rows if re.search(r"[a-z,] LABEL: only ", r["video_prompt"])]
    lengths = sorted(len(r["video_prompt"]) for r in rows)
    print(
        f"        NOTE  {len(cut)}/{len(rows)} video_prompt values are cut off mid-sentence "
        f"before their LABEL tail (length {lengths[0]}-{lengths[-1]})"
    )

    reds = sum(row[field].count(RED) for row in rows for field in FIELDS)
    print(f"        {RED!r} appears {reds} times across {len(rows)} rows")
    every = [r["creation_id"] for r in rows if RED not in r["video_prompt"]]
    check("every video_prompt names the red", not every, f"{len(every)} rows")

    forbidden = [r["creation_id"] for r in rows if "burgundy vial branding" not in r["video_prompt"]]
    check("the FORBIDDEN burgundy clause survives", not forbidden, f"{len(forbidden)} rows")

    blue = [
        r["creation_id"]
        for r in rows
        if "cobalt" in r["video_prompt"].lower() or "BLUE ACCENTS" in r["video_prompt"]
    ]
    check("still no blue accent language", not blue, f"{len(blue)} rows")

    for field, want in (("aspect_ratio", "9:16"), ("duration_seconds", "15"), ("resolution", "1080p")):
        off = sorted({str(r[field]) for r in rows if str(r[field]).strip() != want})
        check(f"{field} untouched at {want}", not off, off or "clean")

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1
    print("\nAll checks passed.")

    if not write:
        print("\nDry run. Re-run with --write to emit the payload and update the mirror.")
        return 0

    with MIRROR.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nwrote {MIRROR.relative_to(ROOT.parent)} ({len(rows)} rows)")

    payload = SHEETS / "14-pen-creations-red-fix.json"
    payload.write_text(
        json.dumps(
            {
                "count": len(rows),
                "rows": [
                    {
                        "creation_id": r["creation_id"],
                        "video_prompt": r["video_prompt"],
                        "still_edit_prompt": r["still_edit_prompt"],
                    }
                    for r in rows
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {payload.relative_to(ROOT.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
