#!/usr/bin/env python3
"""Simulate pull_sheet_row's winner for every compound, live + the new rows.

pull_sheet_row matches a typed name against the sheet with a two-way substring
test on the normalized string, then sorts times_used asc, last_used_at, rank and
takes [0]. So a short name reaches a longer one and a longer name reaches a
shorter one. This prints the row that node would actually hand to the still.

    python3 marketing/scripts/simulate_choose_compound.py
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
LIVE = SHEETS / "9-lab-item-creations-500.csv"
NEW = SHEETS / "9-lab-item-creations-501-535-new.csv"


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


def load(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return [dict(r) for r in csv.DictReader(handle)]


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
    live, new = load(LIVE), load(NEW)
    rows = live + new

    order: list[str] = []
    for r in new:
        if r["compound_name"] not in order:
            order.append(r["compound_name"])

    print("Typed into choose_compound  ->  row pull_sheet_row hands to the still\n")
    wrong = []
    for want in order:
        w = winner(rows, want)
        got = w["compound_name"] if w else "(no match)"
        ok = got == want
        flag = "ok  " if ok else "WRONG"
        print(
            f"  {flag}  {want:24s} -> {got:24s} "
            f"{w['creation_id'] if w else '':18s} used={w['times_used'] if w else '-'}"
        )
        if not ok:
            wrong.append((want, got, w["creation_id"] if w else ""))

    if wrong:
        print(
            f"\n{len(wrong)} name(s) cannot be reached. The node's match is a two-way\n"
            "substring, so a name that is a substring of another name is never\n"
            "addressable on its own. No sheet edit fixes that — only distinct names do."
        )
        for want, got, cid in wrong:
            print(f"  typing {want!r} gives {got!r} ({cid})")
    else:
        print("\nEvery new compound is reachable by typing its own name.")

    print("\n\nRegression: compounds you run today, before vs after the append\n")
    existing = sorted({alias(r["compound_name"]) for r in live if r["compound_name"].strip()})
    broke = []
    for want in existing:
        before = winner(live, want)
        after = winner(rows, want)
        b = before["compound_name"] if before else "(none)"
        a = after["compound_name"] if after else "(none)"
        if b != a or (before or {}).get("creation_id") != (after or {}).get("creation_id"):
            broke.append((want, before, after))
            print(
                f"  CHANGED  {want:24s} {b} ({before['creation_id'] if before else '-'})"
                f"  ->  {a} ({after['creation_id'] if after else '-'})"
            )
    if not broke:
        print(f"  All {len(existing)} live compounds still resolve to the same row.")

    # Today every row is times_used=0, so rank alone decides and live (lower rank)
    # wins. That protection evaporates the first time a live row is used: the
    # node sorts times_used asc, so an unused new row then outranks it.
    print("\n\nLatent drift: same check with today's live rows marked used once\n")
    aged = [dict(r, times_used="1", last_used_at="2026-09-14T00:00:00Z") for r in live]
    drift = []
    for want in existing:
        before = winner(live, want)
        after = winner(aged + new, want)
        if (before or {}).get("compound_name") != (after or {}).get("compound_name"):
            drift.append(want)
            print(
                f"  DRIFTS   {want:24s} {before['compound_name']} "
                f"->  {after['compound_name']} ({after['creation_id']})"
            )
    if not drift:
        print("  No live compound drifts onto a new row after its first use.")

    return 1 if (wrong or broke or drift) else 0


if __name__ == "__main__":
    sys.exit(main())
