#!/usr/bin/env python3
"""Audit 14-pen-creations-150 against peptide_pen_vid_gen and the price sheet.

Checks, in the order they bite:

1. pull_sheet_row contract — the eleven fields it refuses to run without,
   plus the hard constants the tab locks.
2. choose_compound reachability — pull_sheet_row matches compound_name with a
   two-way substring test on the normalised string, so a name that sits
   inside another Active name can never be selected on its own.
3. Accent colour self-consistency — the PEN VISUAL LOCK head and the COLOR
   LOCK further down the same prompt must agree on red vs blue.
4. Label spelling — the pen prints its compound_name, so a typo in the column
   is a typo on the rendered pen.
5. Catalogue coverage — which price-sheet pens have no rows, and which rows
   have no price-sheet pen.

Usage:

    python3 marketing/scripts/audit_pen_sheet.py
"""

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PENS = ROOT / "sheets" / "14-pen-creations-150.csv"
PRICES = ROOT / "sheets" / "22-price-sheet-vials-pens.csv"

REQUIRED = [
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "camera_move",
    "model_still",
    "model_video",
    "still_resolution",
    "still_n",
    "duration_seconds",
    "resolution",
    "aspect_ratio",
]
CONSTANTS = (("aspect_ratio", "9:16"), ("duration_seconds", "15"), ("resolution", "1080p"))

HEAD_BLUE = re.compile(r"BLUE ACCENTS only \(weight-loss\)")
HEAD_RED = re.compile(r"(RED|CRIMSON) ACCENTS only", re.I)
BODY_SKU = re.compile(r"This SKU is ([^.]{0,40})\.")
# prep_pen_video_start refuses motion that would morph the pen into a vial.
VIAL_LANG = re.compile(
    r"vial visual lock|flip-?off|clear glass research vial|"
    r"10ml sterile multi-use vial|uncap|pop off",
    re.I,
)

# The wholesale sheet codes the GLP agonists; the pen tab uses drug names.
PRICE_ALIASES = {"glp1s": "semaglutide", "glp2t": "tirzepatide", "glp3r": "retatrutide"}

# compound_name is a selector, not label text. Where a product's real name is
# a substring of another Active name, the column holds a collision-free handle
# and the pen still prints the real name. Audit the product, not the handle.
HANDLES = {
    "ipamorelinsolo": "Ipamorelin",
    "tesaipa": "Tesamorelin/Ipamorelin",
    "cjc1295": "CJC",
    "cjcipamorelin": "CJC-1295/Ipamorelin",
}

# Salvatore confirmed these ship as pens; the wholesale sheet just has no pen
# line for them.
PRICE_SHEET_GAPS = {"aod9604", "kpv"}

# Salvatore took the GLP agonists off this sheet on 2026-09-14: every pen here
# is a peptide pen. Their absence is the intent, not a coverage gap.
OFF_SHEET = {"semaglutide", "tirzepatide", "retatrutide"}


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(text).lower())


def canon(text: str) -> str:
    """One key per product, whichever of the three vocabularies named it."""
    key = norm(text)
    key = norm(HANDLES.get(key, key))
    return PRICE_ALIASES.get(key, key)


def main() -> int:
    with PENS.open(newline="", encoding="utf-8") as handle:
        rows = [dict(r) for r in csv.DictReader(handle)]
    with PRICES.open(newline="", encoding="utf-8") as handle:
        prices = [dict(r) for r in csv.DictReader(handle)]

    failures: list[str] = []

    def check(label: str, ok: bool, detail: object = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label} — {detail}")
        if not ok:
            failures.append(label)

    print(f"{len(rows)} rows, {len({r['compound_name'] for r in rows})} compounds\n")

    print("pull_sheet_row contract")
    for field in REQUIRED:
        blank = [r["creation_id"] for r in rows if not str(r.get(field, "")).strip()]
        check(f"{field} filled", not blank, f"{len(blank)} blank")
    for field, want in CONSTANTS:
        off = sorted({str(r[field]) for r in rows if str(r[field]).strip() != want})
        check(f"{field} == {want}", not off, off or "clean")
    dupes = [k for k, n in Counter(r["creation_id"] for r in rows).items() if n > 1]
    check("creation_id unique", not dupes, dupes or "clean")
    inactive = sorted({r["status"] for r in rows if r["status"].strip() != "Active"})
    check("every row Active", not inactive, inactive or "clean")

    print("\nprep_pen_video_start contract")
    leak = [r["creation_id"] for r in rows if VIAL_LANG.search(r["video_motion_prompt"])]
    check("no vial language in motion", not leak, f"{len(leak)} rows")

    print("\nchoose_compound reachability")
    names = sorted({r["compound_name"] for r in rows})
    collisions: dict[str, list[str]] = {}
    for name in names:
        hit = [
            other
            for other in names
            if other != name and (norm(name) in norm(other) or norm(other) in norm(name))
        ]
        if hit:
            collisions[name] = hit
    for name, hit in collisions.items():
        print(f"        typing {name!r} also matches {hit}")
    check("no compound name is a substring of another", not collisions, f"{len(collisions)} colliding")

    print("\naccent colour self-consistency")
    conflict: dict[str, int] = defaultdict(int)
    for row in rows:
        prompt = row["video_prompt"]
        head = "blue" if HEAD_BLUE.search(prompt) else ("red" if HEAD_RED.search(prompt) else "")
        sku = BODY_SKU.search(prompt)
        body = ""
        if sku:
            body = "blue" if "cobalt" in sku.group(1) else ("red" if "crimson" in sku.group(1) else "")
        if head and body and head != body:
            conflict[f"{row['compound_name']} (head {head}, body {body})"] += 1
    for label, n in sorted(conflict.items()):
        print(f"        {n} rows: {label}")
    check("head lock agrees with COLOR LOCK", not conflict, f"{sum(conflict.values())} rows")

    print("\nlabel spelling")
    price_names = {r["compound_name"] for r in prices}
    price_norm = {norm(n) for n in price_names}
    typos = []
    for name in names:
        if canon(name) in {canon(p) for p in price_names}:
            continue
        near = [p for p in price_names if norm(p)[:5] == norm(name)[:5]]
        if near:
            typos.append(f"{name!r} -> price sheet says {near}")
    for line in typos:
        print(f"        {line}")
    check("compound_name matches the price sheet", not typos, f"{len(typos)} mismatched")

    print("\ncatalogue coverage")
    sheet_canon = {canon(n) for n in names}
    pen_products = {r["compound_name"] for r in prices if r["form"].strip().lower() == "pen"}
    pen_canon = {canon(p) for p in pen_products}
    missing = sorted(
        p
        for p in pen_products
        if canon(p) not in sheet_canon and canon(p) not in OFF_SHEET
    )
    extra = sorted(
        n for n in names if canon(n) not in pen_canon and canon(n) not in PRICE_SHEET_GAPS
    )
    print(f"        price-sheet pens with no rows ({len(missing)}): {missing}")
    print(f"        rows with no price-sheet pen ({len(extra)}): {extra}")

    print()
    if failures:
        print(f"{len(failures)} check(s) failed.")
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
