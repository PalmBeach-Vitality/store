#!/usr/bin/env python3
"""Show which Sheet 9 row pull_sheet_row hands to the still for each compound.

Reachability is checked by verify_rows_against_workflow.py. This answers the
other question: of the rows that match, which one actually wins. The node sorts
times_used asc, then last_used_at, then rank, and takes the first — so this is
the row the next run of that compound will render.

    python3 marketing/scripts/simulate_choose_compound.py [compound]
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "sheets" / "9-lab-item-creations-500.csv"


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def alias(name: str) -> str:
    n = norm(name)
    if n in {"klow", "klowblend", "klowpeptide", "kpvbpc157tb500ghkcu"}:
        return "KLOW"
    if n in {"glow", "glowblend", "glowpeptide", "bpc157tb500ghkcu"}:
        return "GLOW"
    if n in {"wolverine", "wolverineblend", "wolverinestack", "bpc157tb500"}:
        return "Wolverine"
    return name


def row_matches(row_compound: str, want: str) -> bool:
    w, r = norm(want), norm(row_compound)
    if not w:
        return True
    if not r:
        return False
    return r == w or w in r or r in w


def winner(rows: list[dict[str, str]], want: str) -> dict[str, str] | None:
    matched = [
        r
        for r in rows
        if (r["status"] or "").strip() == "Active"
        and (r["creation_id"] or "").strip()
        and row_matches(alias(r["compound_name"]), want)
    ]
    if not matched:
        return None
    matched.sort(
        key=lambda r: (
            int(r["times_used"] or 0),
            str(r["last_used_at"] or ""),
            float(r["rank"] or 0),
        )
    )
    return matched[0]


def main() -> int:
    with SHEET.open(newline="", encoding="utf-8") as handle:
        rows = [dict(r) for r in csv.DictReader(handle)]

    wanted = sys.argv[1:] or sorted({alias(r["compound_name"]) for r in rows})

    print("Typed into choose_compound  ->  row handed to the still\n")
    bad = 0
    for want in wanted:
        w = winner(rows, want)
        if not w:
            print(f"  MISS   {want:24s} -> no Active row")
            bad += 1
            continue
        got = alias(w["compound_name"])
        ok = got == want
        bad += 0 if ok else 1
        print(
            f"  {'ok  ' if ok else 'WRONG'}  {want:24s} -> {got:24s} "
            f"{w['creation_id']:18s} used={w['times_used']}"
        )
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
