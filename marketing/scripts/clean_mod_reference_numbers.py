#!/usr/bin/env python3
"""Strip reference-number junk from mod_intro–mod_fact_5 on Sheet 10 (Creatomate text).

Sheet 9 (lab creations) no longer carries mod_* — overlays come from Sheet 10 only.

Removes patterns like:
  (206/500)
  · ref 206 / · motif 206 / · card 206 / · line 206 / · CTA 206
  — research card 04
  · set 04
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

MOD_FIELDS = (
    "mod_intro",
    "mod_fact_1",
    "mod_fact_2",
    "mod_fact_3",
    "mod_fact_4",
    "mod_fact_5",
)

# Rank counters at end: (206/500)
RE_RANK = re.compile(r"\s*\(\s*\d+\s*/\s*\d+\s*\)\s*$")
# Middle-dot / bullet / pipe suffixes: · ref 206
RE_DOT_LABEL = re.compile(
    r"\s*[·•⋅∙.\u00b7]\s*(ref|motif|card|line|cta)\s*\d+\s*$",
    re.I,
)
# Dash / emdash suffixes: — motif 206 | - card 12
RE_DASH_LABEL = re.compile(
    r"\s*[-–—|]\s*(ref|motif|card|line|cta)\s*\d+\s*$",
    re.I,
)
# Bare trailing label: CTA 206
RE_BARE_LABEL = re.compile(
    r"\s+(ref|motif|card|line|cta)\s*\d+\s*$",
    re.I,
)
# Sheet 10 uniqueness pads from expand_bank
RE_RESEARCH_CARD = re.compile(r"\s*[—–-]?\s*research card\s*\d+\s*$", re.I)
RE_SET = re.compile(r"\s*[·•⋅∙.\u00b7]?\s*set\s*\d+\s*$", re.I)


def clean_mod_text(text: str) -> str:
    """Apply one highest-priority strip per loop so 'research card N' wins over bare 'card N'."""
    t = str(text or "").strip()
    rules = (
        RE_RESEARCH_CARD,
        RE_SET,
        RE_RANK,
        RE_DOT_LABEL,
        RE_DASH_LABEL,
        RE_BARE_LABEL,
    )
    while True:
        progressed = False
        for rule in rules:
            nxt = rule.sub("", t).strip()
            if nxt != t:
                t = nxt
                progressed = True
                break
        if not progressed:
            # Orphan left by a prior bad clean: trailing "— research"
            nxt = re.sub(r"\s*[—–-]\s*research\s*$", "", t, flags=re.I).strip()
            if nxt != t:
                t = nxt
                continue
            break
    return t


def clean_csv(path: Path) -> int:
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    if not rows:
        print(f"Skip empty {path.name}")
        return 0
    present = [k for k in MOD_FIELDS if k in rows[0]]
    if not present:
        print(f"{path.name}: no mod_* columns (OK — Sheet 9 should not have them)")
        return 0
    changed = 0
    for r in rows:
        for k in present:
            before = r.get(k, "") or ""
            after = clean_mod_text(before)
            if after != before:
                r[k] = after
                changed += 1
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"{path.name}: cleaned {changed} cells across {len(rows)} rows")
    return changed


def _iter_row_lists(data):
    if isinstance(data, list):
        yield data
    elif isinstance(data, dict):
        for key in ("creations", "items", "rows"):
            if isinstance(data.get(key), list):
                yield data[key]


def clean_json(path: Path) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    total = 0
    for rows in _iter_row_lists(data):
        total += len(rows)
        for r in rows:
            if not isinstance(r, dict):
                continue
            for k in MOD_FIELDS:
                if k not in r:
                    continue
                before = r.get(k, "") or ""
                after = clean_mod_text(str(before))
                if after != before:
                    r[k] = after
                    changed += 1
    if total == 0 and not isinstance(data, (list, dict)):
        return 0
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"{path.name}: cleaned {changed} cells across {total} rows")
    return changed


def audit(path: Path) -> int:
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    if not rows or not any(k in rows[0] for k in MOD_FIELDS):
        print(f"AUDIT {path.name}: no mod_* columns")
        return 0
    hits = 0
    for r in rows:
        for k in MOD_FIELDS:
            if k not in r:
                continue
            v = r.get(k, "") or ""
            if v != clean_mod_text(v):
                hits += 1
    print(f"AUDIT {path.name}: remaining dirty cells = {hits}")
    return hits


def main() -> None:
    csvs = [
        SHEETS / "10-creatomate-text-1000.csv",
        SHEETS / "10-creatomate-text-500.csv",
    ]
    jsons = [
        ROOT / "pbvita-1000-creatomate-text.json",
        ROOT / "pbvita-500-creatomate-text.json",
    ]
    for p in csvs:
        if p.exists():
            clean_csv(p)
    for p in jsons:
        clean_json(p)

    # Keep 500-text mirror in sync with first 500 of cleaned 1000
    src = SHEETS / "10-creatomate-text-1000.csv"
    dst = SHEETS / "10-creatomate-text-500.csv"
    if src.exists() and dst.exists():
        rows = list(csv.DictReader(src.open(encoding="utf-8")))
        with dst.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows[:500])
        print(f"Synced {dst.name} from first 500 of 1000")

    remaining = 0
    for p in csvs:
        if p.exists():
            remaining += audit(p)
    if remaining:
        raise SystemExit(f"Still dirty: {remaining} cells")
    print("PASS: mod_intro–mod_fact_5 have no reference numbers")


if __name__ == "__main__":
    main()
