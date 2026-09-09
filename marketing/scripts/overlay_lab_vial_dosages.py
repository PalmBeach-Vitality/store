#!/usr/bin/env python3
"""Apply catalog vial mg / mg/ml locks onto Sheet 9 prompt fields.

Mirrors marketing/n8n-code-overlay-lab-vial-dosages.js
Safe to re-run. Does not touch times_used / last_used_at / URLs.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LABELS = json.loads((ROOT / "compound-vial-labels.json").read_text(encoding="utf-8"))
VIAL = LABELS["labels"]
NO_VIAL_SKU = set(LABELS["no_vial_sku"])
CSV_PATH = ROOT / "sheets" / "9-lab-item-creations-500.csv"
TEXT_KEYS = (
    "lab_item",
    "video_prompt",
    "material_detail",
    "scene_brief",
    "still_edit_prompt",
)

GENERICS = (
    "a solid dark maroon dosage bar with white mg strength, black mg/ml concentration text",
    "a solid dark maroon horizontal bar with white dosage strength; black concentration line (mg/ml) under the bar",
    "a solid dark maroon horizontal bar with white dosage strength, black concentration line (mg/ml) under the bar",
)

EXACT_START = "a solid dark maroon dosage bar with white text exactly "


def spec_for(name: str) -> dict | None:
    n = (name or "").strip()
    if n in VIAL:
        return VIAL[n]
    lower = n.lower()
    for k, v in VIAL.items():
        if k.lower() == lower:
            return v
    return None


def swap_all(t: str, old: str, new: str) -> str:
    if not old or old == new:
        return t
    return t.replace(old, new)


def dose_phrase(spec: dict) -> str:
    return (
        "a solid dark maroon dosage bar with white text exactly '"
        + spec["mg"]
        + "', black concentration line exactly '"
        + spec["conc"]
        + "'"
    )


def footer_phrase(spec: dict) -> str:
    return spec["vol"] + " Sterile Multi-Use Vial"


def apply_catalog_dose(t: str, spec: dict) -> str:
    phrase = dose_phrase(spec)
    for g in GENERICS:
        t = swap_all(t, g, phrase)
    exact_start = "a solid dark maroon dosage bar with white text exactly "
    conc_mark = "black concentration line exactly '"
    start = 0
    while True:
        idx = t.find(exact_start, start)
        if idx == -1:
            break
        cut = t.find(conc_mark, idx)
        if cut == -1:
            break
        q_open = cut + len(conc_mark) - 1
        q_close = t.find("'", q_open + 1)
        if q_close == -1:
            break
        t = t[:idx] + phrase + t[q_close + 1 :]
        start = idx + len(phrase)
    footer = footer_phrase(spec)
    for old in (
        "10ml Sterile Multi-Use Vial",
        "10mL Sterile Multi-Use Vial",
        "5ml Sterile Multi-Use Vial",
        "5mL Sterile Multi-Use Vial",
    ):
        t = swap_all(t, old, footer)
    return t


def apply_no_invented(t: str) -> str:
    no_dose = (
        "a solid dark maroon dosage bar with NO mg number and NO mg/ml concentration "
        "(name + DNA + 10ml footer only — do not invent 2 mg/ml or 10mg)"
    )
    for g in GENERICS:
        t = swap_all(t, g, no_dose)
    return t


def strip_dose_lock(t: str) -> str:
    marker = "VIAL DOSE LOCK:"
    i = t.find(marker)
    if i == -1:
        return t.strip()
    lock_end = "Do not restyle the scene."
    j = t.find(lock_end, i)
    if j != -1:
        return (t[:i] + t[j + len(lock_end) :]).strip()
    return t[:i].strip()


def still_edit_lock(spec: dict, name: str) -> str:
    return (
        "VIAL DOSE LOCK: On the "
        + name
        + " vial label the maroon bar reads exactly '"
        + spec["mg"]
        + "' and the concentration line reads exactly '"
        + spec["conc"]
        + "'. Footer exactly '"
        + footer_phrase(spec)
        + "'. If the still shows 2 mg/ml or any other concentration, change it to "
        + spec["conc"]
        + ". Do not restyle the scene."
    )


def still_edit_lock_pen_only(name: str) -> str:
    return (
        "VIAL DOSE LOCK: "
        + name
        + " has no 10 mL liquid SKU in the catalog. Do not invent a mg strength "
        + "or mg/ml concentration on the maroon bar. Name + DNA helix + 10ml footer only. "
        + "Do not restyle the scene."
    )


def patch_row(row: dict) -> bool:
    name = (row.get("compound_name") or "").strip()
    if not name:
        return False
    spec = spec_for(name)
    no_sku = name in NO_VIAL_SKU
    if not spec and not no_sku:
        return False
    changed = False
    for key in TEXT_KEYS:
        old = row.get(key) or ""
        if not str(old).strip():
            continue
        neu = str(old)
        if spec:
            neu = apply_catalog_dose(neu, spec)
        else:
            neu = apply_no_invented(neu)
        if key == "still_edit_prompt":
            neu = strip_dose_lock(neu)
            lock = still_edit_lock(spec, name) if spec else still_edit_lock_pen_only(name)
            neu = lock + " " + neu
        if neu != old:
            row[key] = neu
            changed = True
    return changed


def main() -> None:
    import sys

    dry = "--dry-run" in sys.argv
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fields = list(rows[0].keys()) if rows else []
    n = 0
    by_name: dict[str, int] = {}
    for r in rows:
        if patch_row(r):
            n += 1
            name = (r.get("compound_name") or "").strip()
            by_name[name] = by_name.get(name, 0) + 1
    if not dry:
        with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
            w.writeheader()
            w.writerows(rows)
    print(f"{CSV_PATH.name}: {'dry-run' if dry else 'patched'} {n} / {len(rows)} rows")
    for name in sorted(by_name):
        print(f"  {by_name[name]:3} {name}")


if __name__ == "__main__":
    main()
