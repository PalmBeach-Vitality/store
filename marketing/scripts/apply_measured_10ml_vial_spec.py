#!/usr/bin/env python3
"""Lock every 10ml lab-vial row to Salvatore's BPC-157 catalog photo.

Salvatore, 2026-09-17, on the lab-creations stills: the vials are too tall
and too narrow, and the helix is too big. He sent the BPC-157 10mg catalog
photo and said use that exact vial size, for ALL 10ml vials only.

Measured from that photo (cap top to base / glass body width):

    total height : body width     2.36
    straight body : body width    1.56
    blue cap : body width         0.94
    crimp collar : body width     0.92
    glass neck : body width       0.66
    cap+collar+neck+shoulder      34% of height
    straight body                 66% of height
    helix width                   1/4 of the label, 1/4 of the compound name
    helix height                  1.7 x helix width

The 29 Cagrilintide rows that still say ``This is the 5ml multi-dose vial``
are left untouched.

    python3 marketing/scripts/apply_measured_10ml_vial_spec.py           # dry run
    python3 marketing/scripts/apply_measured_10ml_vial_spec.py --write
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
MIRROR = SHEETS / "9-lab-item-creations-500.csv"
PAYLOAD = SHEETS / "9-lab-item-creations-10ml-vial-spec.json"

STILL_FIELDS = [
    "lab_item",
    "material_detail",
    "hero_style",
    "still_edit_prompt",
]
VIDEO_FIELD = "video_prompt"

TEN_ML = "This is the 10ml multi-dose vial"
FIVE_ML = "This is the 5ml multi-dose vial"

STILL_OLD = (
    "Same vial shape and size every time: standard ~10ml multi-use vial "
    "proportions, cylindrical clear glass, brushed-silver aluminum crimp, "
    "plain bright blue plastic flip-off cap ONLY (smooth round flip-off — "
    "FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces). "
    "Label: white face with dark red double-helix DNA icon at top,"
)

STILL_NEW = (
    "Same vial shape and size every time — lock to the 10ml catalog vial: a short "
    "wide bottle whose full height from the top of the cap to the base is 2.36 "
    "times the width of the glass body; the straight cylindrical body is only "
    "1.56 times as tall as it is wide. FORBIDDEN: tall vial, slim vial, test-tube, "
    "ampoule, any height greater than 2.4 times body width. Cylindrical clear glass, "
    "brushed-silver aluminum crimp 92 percent of body width, plain bright blue "
    "plastic flip-off cap ONLY 94 percent of body width (smooth round flip-off — "
    "FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces). "
    "Label: white face with a SMALL dark red double-helix DNA emblem centred at "
    "the top (one fifth of the label width, 1.7 times as tall as it is wide, a "
    "compact mark above the compound name; FORBIDDEN: oversized helix, helix as "
    "wide as the compound name, helix filling the top of the label),"
)

VIDEO_PHRASES: list[tuple[str, str]] = [
    (
        "whose full height from the top of the cap down to the base is about "
        "2.3 times the width of the glass body.",
        "whose full height from the top of the cap down to the base is 2.36 "
        "times the width of the glass body — a short wide 10ml bottle, never a "
        "tall slim vial.",
    ),
    (
        "a plain smooth disc about 95% of the body width",
        "a plain smooth disc about 94% of the body width",
    ),
    (
        "below it a tall straight-sided brushed-silver aluminium crimp collar "
        "about 88% of the body width",
        "below it a straight-sided brushed-silver aluminium crimp collar about "
        "92% of the body width",
    ),
    (
        "Cap, collar, neck and shoulder together fill roughly the top 40% of "
        "the vial's height, the straight body the lower 55%.",
        "Cap, collar, neck and shoulder together fill roughly the top 34% of "
        "the vial's height, the straight body the lower 66%.",
    ),
    (
        "This is the 10ml multi-dose vial: the straight cylindrical body is "
        "stout, only about 1.2 times as tall as it is wide.",
        "This is the 10ml multi-dose vial: the straight cylindrical body is "
        "stout, only 1.56 times as tall as it is wide. FORBIDDEN: tall vial, "
        "slim vial, test-tube, ampoule, height greater than 2.4 times body width.",
    ),
    (
        "a single red DNA double-helix mark centred above the compound name, "
        "taller than it is wide at a height-to-width ratio of about 7:4, and "
        "about one fifth of the label's width — roughly a quarter as wide as "
        "the compound name beneath it.",
        "a single SMALL red DNA double-helix mark centred above the compound "
        "name, only 1.7 times as tall as it is wide, and only one fifth of the "
        "label's width — a compact mark roughly a quarter as wide as the "
        "compound name beneath it, never larger. FORBIDDEN: oversized helix, "
        "helix wider than one quarter of the label, helix as tall as the "
        "compound name.",
    ),
    (
        "It is drawn as two broad flat tapering ribbons",
        "It is drawn as two flat tapering ribbons",
    ),
]

STALE_10ML = [
    "standard ~10ml multi-use vial proportions",
    "2.3 times the width of the glass body",
    "only about 1.2 times as tall as it is wide",
    "top 40% of the vial's height",
    "the straight body the lower 55%",
    "about 88% of the body width",
    "about 95% of the body width",
    "a tall straight-sided brushed-silver",
    "dark red double-helix DNA icon at top",
    "height-to-width ratio of about 7:4",
    "two broad flat tapering ribbons",
]


def is_10ml(row: dict[str, str]) -> bool:
    vp = row.get(VIDEO_FIELD) or ""
    if FIVE_ML in vp:
        return False
    return TEN_ML in vp


def apply_row(row: dict[str, str], hits: Counter[str]) -> dict[str, str]:
    out = dict(row)
    for field in STILL_FIELDS:
        text = out.get(field) or ""
        if STILL_OLD not in text:
            raise SystemExit(f"{row.get('creation_id')}: {field} missing still lock phrase")
        out[field] = text.replace(STILL_OLD, STILL_NEW, 1)
        hits[f"still:{field}"] += 1
    vp = out.get(VIDEO_FIELD) or ""
    for old, new in VIDEO_PHRASES:
        if old not in vp:
            raise SystemExit(f"{row.get('creation_id')}: video_prompt missing {old[:60]!r}")
        vp = vp.replace(old, new, 1)
        hits[f"video:{old[:40]}"] += 1
    out[VIDEO_FIELD] = vp
    return out


def qa(rows: list[dict[str, str]], original: list[dict[str, str]]) -> None:
    ten = [r for r in rows if is_10ml(r)]
    five = [r for r in rows if FIVE_ML in (r.get(VIDEO_FIELD) or "")]
    if len(ten) != 506:
        raise SystemExit(f"expected 506 10ml rows, got {len(ten)}")
    if len(five) != 29:
        raise SystemExit(f"expected 29 5ml rows, got {len(five)}")

    orig_by_id = {r["creation_id"]: r for r in original}

    for r in five:
        old = orig_by_id[r["creation_id"]]
        for f in STILL_FIELDS + [VIDEO_FIELD]:
            if r.get(f) != old.get(f):
                raise SystemExit(f"5ml row {r['creation_id']} {f} was modified")

    for r in ten:
        blob = " ".join(r.get(f) or "" for f in STILL_FIELDS + [VIDEO_FIELD])
        for stale in STALE_10ML:
            if stale in blob:
                raise SystemExit(f"{r['creation_id']}: stale {stale!r} still present")
        for needle in (
            "2.36 times the width",
            "1.56 times as tall",
            "SMALL dark red double-helix",
            "one fifth of the label width",
        ):
            still = " ".join(r.get(f) or "" for f in STILL_FIELDS)
            if needle == "2.36 times the width" and needle not in still:
                raise SystemExit(f"{r['creation_id']}: still fields missing {needle!r}")
            if needle == "SMALL dark red double-helix" and needle not in still:
                raise SystemExit(f"{r['creation_id']}: still fields missing small helix")
        vp = r.get(VIDEO_FIELD) or ""
        for needle in (
            "2.36 times the width of the glass body",
            "only 1.56 times as tall as it is wide",
            "SMALL red DNA double-helix",
            "top 34% of the vial's height",
            "about 92% of the body width",
            "about 94% of the body width",
        ):
            if needle not in vp:
                raise SystemExit(f"{r['creation_id']}: video_prompt missing {needle!r}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    with MIRROR.open(newline="") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        original = list(reader)

    hits: Counter[str] = Counter()
    out_rows: list[dict[str, str]] = []
    changed = 0
    skipped = 0
    for row in original:
        if not is_10ml(row):
            out_rows.append(row)
            skipped += 1
            continue
        out_rows.append(apply_row(row, hits))
        changed += 1

    qa(out_rows, original)

    print(f"10ml rows rewritten: {changed}")
    print(f"rows left untouched (5ml + any other): {skipped}")
    for k, n in sorted(hits.items()):
        print(f"  {n:4d}  {k}")

    if not args.write:
        print("dry run only — pass --write to save")
        return 0

    with MIRROR.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(out_rows)

    payload = []
    for row in out_rows:
        if not is_10ml(row):
            continue
        item = {"creation_id": row["creation_id"], VIDEO_FIELD: row[VIDEO_FIELD]}
        for f in STILL_FIELDS:
            item[f] = row[f]
        payload.append(item)
    PAYLOAD.write_text(json.dumps(payload, indent=1) + "\n")
    print(f"wrote {MIRROR}")
    print(f"wrote {PAYLOAD} ({len(payload)} 10ml rows)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        sys.exit(0)
