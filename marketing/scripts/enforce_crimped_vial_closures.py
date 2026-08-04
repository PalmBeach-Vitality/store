#!/usr/bin/env python3
"""Enforce crimped aluminum + rubber septum injection vials on Sheet 9 creations.

- Every vial = pharma injection vial with aluminum crimp over rubber septum
- NO twist tops, screw caps, or twist-off closures
Patches lab_item + video_prompt (+ JSON export). Safe to re-run.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV_PATHS = [
    SHEETS / "9-lab-item-creations-500.csv",
    SHEETS / "9-lab-item-creations-250.csv",
]
JSON_PATH = ROOT / "pbvita-500-lab-item-creations.json"

VIAL_RULE = (
    "VIAL CLOSURE RULE (MANDATORY): Every vial must be a pharmaceutical injection vial with an "
    "aluminum crimped seal over a rubber septum stopper. Show the crimped metal collar and rubber "
    "center clearly when a vial is visible. NO twist-off caps, NO screw-top vials, NO child-resistant "
    "twist lids, NO plastic twist closures — crimped metal + rubber only."
)

# Phrase replacements (case-insensitive, preserve surrounding text)
REPLACEMENTS = [
    (
        r"\bsingle gold-capped vial\b",
        "single aluminum-crimped rubber-septum injection vial",
    ),
    (
        r"\bgold-capped vial\b",
        "aluminum-crimped rubber-septum injection vial",
    ),
    (
        r"\bsingle sealed research vial\b",
        "single crimped-seal rubber-septum injection research vial",
    ),
    (
        r"\bsealed research vials\b",
        "crimped-seal rubber-septum injection research vials",
    ),
    (
        r"\bsealed research vial\b",
        "crimped-seal rubber-septum injection research vial",
    ),
    (
        r"\bclear vial hero\b",
        "clear crimped-seal rubber-septum injection vial hero",
    ),
    (
        r"\bmulti-vial storyboard\b",
        "multi-vial storyboard of crimped-seal rubber-septum injection vials",
    ),
    (
        r"\bpeptide vials?\b",
        "crimped-seal rubber-septum peptide injection vial",
    ),
]


def apply_replacements(text: str) -> str:
    out = text or ""
    for pat, repl in REPLACEMENTS:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    return out


def ensure_rule(text: str) -> str:
    t = apply_replacements(text or "")
    if "VIAL CLOSURE RULE" in t:
        return t
    # Insert before final compliance / quality if present; else append
    markers = [
        "For laboratory research use only.",
        "Quality: ultra detailed",
        "ABSOLUTE RULE — NO DOUBLES",
    ]
    for marker in markers:
        idx = t.find(marker)
        if idx != -1:
            return t[:idx].rstrip() + " " + VIAL_RULE + " " + t[idx:]
    return (t.rstrip() + " " + VIAL_RULE).strip()


def patch_row(row: dict) -> bool:
    changed = False
    for key in ("lab_item", "video_prompt", "material_detail", "scene_brief"):
        if key not in row or row[key] is None:
            continue
        old = str(row[key])
        # Always enforce rule on lab_item + video_prompt; replacements on all text fields
        if key in ("lab_item", "video_prompt"):
            new = ensure_rule(old)
        else:
            new = apply_replacements(old)
        if new != old:
            row[key] = new
            changed = True
    return changed


def patch_csv(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fields = list(rows[0].keys()) if rows else []
    n = 0
    for r in rows:
        if patch_row(r):
            n += 1
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    return n


def patch_json(path: Path) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data if isinstance(data, list) else data.get("creations") or data.get("items") or []
    n = 0
    for r in items:
        if isinstance(r, dict) and patch_row(r):
            n += 1
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return n


def main() -> None:
    for p in CSV_PATHS:
        n = patch_csv(p)
        print(f"{p.name}: patched {n} rows")
    n = patch_json(JSON_PATH)
    print(f"{JSON_PATH.name}: patched {n} items")


if __name__ == "__main__":
    main()
