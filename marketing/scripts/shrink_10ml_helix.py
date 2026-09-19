#!/usr/bin/env python3
"""Shrink the 10ml vial DNA helix. Second pass after apply_measured_10ml_vial_spec.

Salvatore, 2026-09-17: the helix is still too big on the LI-016 smoke still
(https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d02e9799-86c1-9d6c-bbcc-ab268408d466-7390bd8c.png).
Yesterday's SMALL / one-fifth / quarter-of-name lock is on every 10ml row.
Grok still drew a large emblem because "quarter as wide as the compound name"
scales with a long print like BPC-157/TB-500, and FORBIDDEN "wider than one
quarter of the label" licenses a logo bigger than the catalog mark.

This pass pins helix width to one tenth of the label, independent of name
length, and forbids anything wider than one eighth. 5ml Cagrilintide skipped.

    python3 marketing/scripts/shrink_10ml_helix.py            # dry run
    python3 marketing/scripts/shrink_10ml_helix.py --write
"""

from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
LAB_MIRROR = SHEETS / "9-lab-item-creations-500.csv"
WELLNESS_MIRROR = SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv"

TEN_ML = "This is the 10ml multi-dose vial"
FIVE_ML = "This is the 5ml multi-dose vial"
VIDEO_FIELD = "video_prompt"
STILL_FIELDS = [
    "lab_item",
    "material_detail",
    "hero_style",
    "still_edit_prompt",
]

STILL_HELIX_OLD = (
    "Label: white face with a SMALL dark red double-helix DNA emblem centred at "
    "the top (one fifth of the label width, 1.7 times as tall as it is wide, a "
    "compact mark above the compound name; FORBIDDEN: oversized helix, helix as "
    "wide as the compound name, helix filling the top of the label),"
)
STILL_HELIX_NEW = (
    "Label: white face with a TINY dark red double-helix DNA emblem centred at "
    "the top (only one tenth of the label width, 1.7 times as tall as it is wide, "
    "a stamp-size mark above the compound name; FORBIDDEN: oversized helix, helix "
    "wider than one eighth of the label, helix as wide as the compound name, "
    "helix filling the top of the label),"
)

VIDEO_HELIX_OLD = (
    "a single SMALL red DNA double-helix mark centred above the compound "
    "name, only 1.7 times as tall as it is wide, and only one fifth of the "
    "label's width — a compact mark roughly a quarter as wide as the "
    "compound name beneath it, never larger. FORBIDDEN: oversized helix, "
    "helix wider than one quarter of the label, helix as tall as the "
    "compound name."
)
VIDEO_HELIX_NEW = (
    "a single TINY red DNA double-helix mark centred above the compound "
    "name, only 1.7 times as tall as it is wide, and only one tenth of the "
    "label's width — a stamp-size mark no wider than two letters of the "
    "compound name, never larger. FORBIDDEN: oversized helix, helix wider "
    "than one eighth of the label, helix as wide as the compound name, "
    "helix as tall as the compound name, helix filling the top of the label."
)

LABEL_EMBLEM_OLD = (
    "Label: white face with a single brick red #A63334 double-helix DNA emblem "
    "centred at the top,"
)
LABEL_EMBLEM_NEW = (
    "Label: white face with a TINY brick red #A63334 double-helix DNA emblem "
    "centred at the top, only one tenth of the label width,"
)

STALE_10ML = [
    "SMALL red DNA double-helix",
    "SMALL dark red double-helix",
    "one fifth of the label",
    "one fifth of the label's width",
    "quarter as wide as the compound name",
    "helix wider than one quarter of the label",
    "a single brick red #A63334 double-helix DNA emblem centred at the top,",
]


def is_10ml(row: dict[str, str]) -> bool:
    vp = row.get(VIDEO_FIELD) or ""
    if FIVE_ML in vp:
        return False
    return TEN_ML in vp


def replace_once(text: str, old: str, new: str, cid: str, field: str) -> str:
    if old not in text:
        raise SystemExit(f"{cid}: {field} missing {old[:70]!r}")
    return text.replace(old, new, 1)


def apply_lab_row(row: dict[str, str], hits: Counter[str]) -> dict[str, str]:
    out = dict(row)
    cid = str(row.get("creation_id") or "")
    for field in STILL_FIELDS:
        out[field] = replace_once(
            out.get(field) or "", STILL_HELIX_OLD, STILL_HELIX_NEW, cid, field
        )
        hits[f"still:{field}"] += 1
    vp = out.get(VIDEO_FIELD) or ""
    vp = replace_once(vp, VIDEO_HELIX_OLD, VIDEO_HELIX_NEW, cid, VIDEO_FIELD)
    hits["video:helix"] += 1
    vp = replace_once(vp, LABEL_EMBLEM_OLD, LABEL_EMBLEM_NEW, cid, f"{VIDEO_FIELD}:label")
    hits["video:label-emblem"] += 1
    out[VIDEO_FIELD] = vp
    return out


def apply_wellness_row(row: dict[str, str], hits: Counter[str]) -> dict[str, str]:
    out = dict(row)
    cid = str(row.get("creation_id") or "")
    vp = out.get(VIDEO_FIELD) or ""
    vp = replace_once(vp, VIDEO_HELIX_OLD, VIDEO_HELIX_NEW, cid, VIDEO_FIELD)
    hits["video:helix"] += 1
    vp = replace_once(vp, LABEL_EMBLEM_OLD, LABEL_EMBLEM_NEW, cid, f"{VIDEO_FIELD}:label")
    hits["video:label-emblem"] += 1
    out[VIDEO_FIELD] = vp
    return out


def qa_lab(rows: list[dict[str, str]], original: list[dict[str, str]]) -> None:
    ten = [r for r in rows if is_10ml(r)]
    five = [r for r in rows if FIVE_ML in (r.get(VIDEO_FIELD) or "")]
    if len(ten) != 506:
        raise SystemExit(f"expected 506 lab 10ml rows, got {len(ten)}")
    if len(five) != 29:
        raise SystemExit(f"expected 29 lab 5ml rows, got {len(five)}")
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
        still = " ".join(r.get(f) or "" for f in STILL_FIELDS)
        if "TINY dark red double-helix" not in still:
            raise SystemExit(f"{r['creation_id']}: still fields missing TINY helix")
        if "only one tenth of the label width" not in still:
            raise SystemExit(f"{r['creation_id']}: still fields missing one tenth")
        vp = r.get(VIDEO_FIELD) or ""
        if "TINY red DNA double-helix" not in vp:
            raise SystemExit(f"{r['creation_id']}: video_prompt missing TINY helix")
        if "TINY brick red #A63334 double-helix" not in vp:
            raise SystemExit(f"{r['creation_id']}: video_prompt missing TINY label emblem")
        if "only one tenth of the label's width" not in vp:
            raise SystemExit(f"{r['creation_id']}: video_prompt missing one tenth helix")


def qa_wellness(rows: list[dict[str, str]], original: list[dict[str, str]]) -> None:
    ten = [r for r in rows if is_10ml(r)]
    five = [r for r in rows if FIVE_ML in (r.get(VIDEO_FIELD) or "")]
    if len(ten) != 577:
        raise SystemExit(f"expected 577 wellness 10ml rows, got {len(ten)}")
    if len(five) != 24:
        raise SystemExit(f"expected 24 wellness 5ml rows, got {len(five)}")
    orig_by_id = {r["creation_id"]: r for r in original}
    fields = ["material_detail", "hero_style", "video_prompt", "still_edit_prompt"]
    for r in five:
        old = orig_by_id[r["creation_id"]]
        for f in fields:
            if r.get(f) != old.get(f):
                raise SystemExit(f"5ml row {r['creation_id']} {f} was modified")
    for r in ten:
        for f in ("material_detail", "hero_style", "still_edit_prompt"):
            if r.get(f) != orig_by_id[r["creation_id"]].get(f):
                raise SystemExit(f"{r['creation_id']}: {f} was modified")
        vp = r.get(VIDEO_FIELD) or ""
        for stale in STALE_10ML:
            if stale in vp:
                raise SystemExit(f"{r['creation_id']}: stale {stale!r} still present")
        if "TINY red DNA double-helix" not in vp:
            raise SystemExit(f"{r['creation_id']}: video_prompt missing TINY helix")
        if "TINY brick red #A63334 double-helix" not in vp:
            raise SystemExit(f"{r['creation_id']}: video_prompt missing TINY label emblem")


def run_sheet(name: str, write: bool) -> None:
    if name == "lab":
        path, apply, check = LAB_MIRROR, apply_lab_row, qa_lab
    elif name == "wellness":
        path, apply, check = WELLNESS_MIRROR, apply_wellness_row, qa_wellness
    else:
        raise SystemExit(f"unknown sheet {name}")

    with path.open(newline="") as fh:
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
        out_rows.append(apply(row, hits))
        changed += 1

    check(out_rows, original)
    print(f"{name}: 10ml rows rewritten: {changed}")
    print(f"{name}: rows left untouched: {skipped}")
    for k, n in sorted(hits.items()):
        print(f"  {n:4d}  {k}")

    if not write:
        print(f"{name}: dry run only — pass --write to save")
        return

    with path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(out_rows)
    print(f"wrote {path}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--sheet", choices=["lab", "wellness", "all"], default="all")
    args = ap.parse_args()
    targets = ["lab", "wellness"] if args.sheet == "all" else [args.sheet]
    for name in targets:
        run_sheet(name, args.write)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        sys.exit(0)
