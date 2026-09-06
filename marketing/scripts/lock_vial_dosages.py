#!/usr/bin/env python3
"""Lock catalog vial mg / mg/ml onto video-gen sheet prompts.

Reference: marketing/compound-vial-labels.json
(Palm Beach - Vitality price list + Salvatore confirmations).

Replaces generic “white mg strength” language AND leftover foreign
doses from earlier compound rotations (e.g. Sermorelin rows still
carrying GHK-Cu 50mg / 5 mg/ml).
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "compound-vial-labels.json"
SHEETS = ROOT / "sheets"

TEXT_FIELDS = (
    "lab_item",
    "material_detail",
    "scene_brief",
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "still_prompt",
    "product_hero",
    "product_form_detail",
    "hero_style",
)

FOOTER = "10ml Sterile Multi-Use Vial"
GENERIC_BAR = (
    r"a solid dark maroon (?:horizontal )?(?:dosage )?bar with white "
    r"(?:mg strength|dosage strength);?\s*black concentration line "
    r"\(mg/ml\)(?: under the bar)?"
)
GENERIC_BAR_SHORT = (
    r"a solid dark maroon dosage bar with white mg strength, "
    r"black mg/ml concentration text"
)
GENERIC_BAR_PACKAGING = (
    r"a solid dark maroon horizontal bar with white dosage strength"
)


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text())


def norm_name(name: str) -> str:
    s = (name or "").strip()
    s = re.sub(r"\s+", " ", s)
    s = s.replace("–", "/").replace("—", "/")
    return s


def resolve_key(name: str, catalog: dict) -> str | None:
    raw = norm_name(name)
    if not raw:
        return None
    aliases = catalog.get("aliases") or {}
    if raw in aliases:
        return aliases[raw]
    if raw in catalog["labels"]:
        return raw
    lower = {k.lower(): k for k in catalog["labels"]}
    if raw.lower() in lower:
        return lower[raw.lower()]
    for alias, target in aliases.items():
        if alias.lower() == raw.lower():
            return target
    compact = re.sub(r"[^a-z0-9+]+", "", raw.lower())
    for k in catalog["labels"]:
        if re.sub(r"[^a-z0-9+]+", "", k.lower()) == compact:
            return k
    return None


def pick_sku(name: str, blob: str, catalog: dict) -> dict | None:
    key = resolve_key(name, catalog)
    if key is None:
        return None
    primary = dict(catalog["labels"][key])
    primary["_key"] = key
    alts = (catalog.get("alt_skus") or {}).get(key) or []
    if key == "BPC-157":
        twenty = len(re.findall(r"exactly '20mg'", blob, flags=re.I))
        ten = len(re.findall(r"exactly '10mg'", blob, flags=re.I))
        if twenty > ten:
            sku = dict(alts[0])
            sku["_key"] = key
            return sku
    return primary


def dose_lock(name: str, mg: str, conc: str) -> str:
    return (
        f"VIAL DOSE LOCK: On the {name} vial label print exactly '{name}' once; "
        f"the maroon bar reads exactly '{mg}' and the concentration line reads "
        f"exactly '{conc}'. Footer exactly '{FOOTER}'. If any other name, mg, "
        f"or mg/ml appears, change it to these exact values."
    )


def strip_foreign_locks(text: str, name: str, mg: str, conc: str) -> str:
    s = text
    exact_bar = (
        f"a solid dark maroon dosage bar with white text exactly '{mg}', "
        f"black concentration line exactly '{conc}'"
    )
    s = re.sub(
        r"a solid dark maroon dosage bar with white text exactly '[^']*',\s*"
        r"black concentration line exactly '[^']*'",
        exact_bar,
        s,
        flags=re.I,
    )
    s = re.sub(
        r"maroon bar white '[^']*', black '[^']*'",
        f"maroon bar white '{mg}', black '{conc}'",
        s,
        flags=re.I,
    )
    s = re.sub(GENERIC_BAR, exact_bar, s, flags=re.I)
    s = re.sub(GENERIC_BAR_SHORT, exact_bar, s, flags=re.I)
    s = re.sub(
        GENERIC_BAR_PACKAGING,
        f"a solid dark maroon dosage bar with white text exactly '{mg}'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"black concentration line \(mg/ml\) under the bar",
        f"black concentration line exactly '{conc}' under the bar",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"dosage bar with white text exactly '[^']*'",
        f"dosage bar with white text exactly '{mg}'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"concentration line exactly '[^']*'",
        f"concentration line exactly '{conc}'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"white text exactly '(?:\d+(?:/\d+){0,3}\s*mg(?:\s*/\s*\d+\s*mg)*)'",
        f"white text exactly '{mg}'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"Print exactly '[^']+' and '[^']+'\s*[—-]\s*do not copy another com[^\n.]*",
        f"Print exactly '{mg}' and '{conc}' — do not copy another compound's dose",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"dark maroon bar with white '[^']+'",
        f"dark maroon bar with white '{mg}'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"Maroon bar white '[^']+'\. Black '[^']+'\.",
        f"Maroon bar white '{mg}'. Black '{conc}'.",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"maroon bar white '[^']+', black '[^']+'",
        f"maroon bar white '{mg}', black '{conc}'",
        s,
        flags=re.I,
    )
    s = re.sub(r"\b5ml Sterile Multi-Use Vial\b", FOOTER, s, flags=re.I)
    s = re.sub(
        r"Black '(?:\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?){0,3}\s*mg\s*/\s*ml)'",
        f"Black '{conc}'",
        s,
        flags=re.I,
    )
    # Leftover GHK-Cu still-edit instruction pasted onto other compounds.
    s = re.sub(
        r"If the still shows 10mg/ml on GHK-Cu, change it to 5mg/ml\.\s*",
        "",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"If the still shows [^.]{0,80}mg/ml on (?!" + re.escape(name) + r")[^.]{0,40}, change it to [^.]+\.\s*",
        "",
        s,
        flags=re.I,
    )
    lock = dose_lock(name, mg, conc)
    if re.search(r"VIAL DOSE LOCK:", s, flags=re.I):
        s = re.sub(
            r"VIAL DOSE LOCK:[\s\S]*?(?=\s*(?:CRITICAL COUNT FIX|HARD OUTPUT LOCK \(FINAL|$))",
            lock + " ",
            s,
            count=1,
            flags=re.I,
        )
    elif "CRITICAL COUNT FIX" in s:
        s = lock + " " + s
    elif len(s) < 2500:
        s = (s + " " + lock).strip()
    return s


def lock_text(text: str, name: str, mg: str, conc: str) -> str:
    if not text:
        return text
    return strip_foreign_locks(text, name, mg, conc)


def is_pen_row(row: dict) -> bool:
    cat = f"{row.get('category') or ''} {row.get('lab_item_id') or ''} {row.get('scene_category') or ''}".lower()
    if "pen" in cat and "vial" not in cat:
        return True
    blob = " ".join(str(row.get(k) or "") for k in ("lab_item", "material_detail", "product_hero"))
    return bool(re.search(r"\b3ml pen\b|\binsulin-style\b", blob, flags=re.I)) and not re.search(
        r"clear glass.*vial|injection vial", blob, flags=re.I
    )


def strip_pen_mg(text: str, name: str) -> str:
    if not text:
        return text
    s = text
    s = re.sub(
        r"a solid dark maroon dosage bar with white text exactly '[^']*',\s*"
        r"black concentration line exactly '[^']*'",
        "a solid crimson red rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(r"VIAL DOSE LOCK:[\s\S]*?(?=\s*(?:CRITICAL COUNT FIX|$))", "", s, flags=re.I)
    s = re.sub(
        r"If the still shows 10mg/ml on GHK-Cu, change it to 5mg/ml\.\s*",
        "",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"Print exactly '[^']+' and '[^']+'\s*[—-]\s*do not copy another com[^\n.]*",
        f"Print exactly '{name}' and '3ml Pen' only — no milligram dosage on the pen label",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"Maroon bar white '[^']+'\. Black '[^']+'\.",
        "Pen badge white '3ml Pen'. No milligram dosage.",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"Solid crimson red rectangle badge with white text exactly '[^']*'",
        "Solid crimson red rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"crimson red rectangle badge with white text exactly '[^']*'",
        "crimson red rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"Solid \w+(?: \w+)? rectangle badge with white text exactly '[^']*'",
        "Solid rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"white \d+mg badge on a \w+(?: \w+)? rectangle",
        "white '3ml Pen' badge on a rectangle",
        s,
        flags=re.I,
    )
    s = re.sub(
        GENERIC_BAR,
        "a solid crimson red rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(
        GENERIC_BAR_SHORT,
        "a solid crimson red rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(
        GENERIC_BAR_PACKAGING,
        "a solid crimson red rectangle badge with white text exactly '3ml Pen'",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"black concentration line \(mg/ml\) under the bar",
        "no milligram dosage on the pen label",
        s,
        flags=re.I,
    )
    return s


def process_row(row: dict, catalog: dict) -> tuple[dict, dict | None]:
    name = (row.get("compound_name") or "").strip()
    if not name:
        return row, None
    blob = "\n".join(str(row.get(k) or "") for k in TEXT_FIELDS)
    if name in (catalog.get("no_vial_sku") or []) or is_pen_row(row):
        changed = False
        for f in TEXT_FIELDS:
            if f not in row:
                continue
            new = strip_pen_mg(row[f], name)
            if new != row[f]:
                row[f] = new
                changed = True
        return row, {"name": name, "pen": True, "changed": changed}
    sku = pick_sku(name, blob, catalog)
    if sku is None:
        return row, {"name": name, "unknown": True}
    changed = False
    for f in TEXT_FIELDS:
        if f not in row:
            continue
        new = lock_text(row[f], name, sku["mg"], sku["conc"])
        if new != (row[f] or ""):
            row[f] = new
            changed = True
    return row, {
        "name": name,
        "mg": sku["mg"],
        "conc": sku["conc"],
        "changed": changed,
    }


def process_csv(path: Path, catalog: dict) -> dict:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames or []
        rows = list(reader)
    stats: Counter = Counter()
    out_rows = []
    for row in rows:
        row, info = process_row(row, catalog)
        out_rows.append(row)
        if info is None:
            stats["blank_name"] += 1
        elif info.get("unknown"):
            stats["unknown"] += 1
        elif info.get("pen"):
            stats["pen"] += 1
            stats["pen_changed"] += int(bool(info.get("changed")))
        else:
            stats["vial"] += 1
            stats["vial_changed"] += int(bool(info.get("changed")))
            stats[f"sku:{info['name']}|{info['mg']}|{info['conc']}"] += 1
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(out_rows)
    return {"path": str(path), "rows": len(out_rows), **stats}


def main() -> None:
    catalog = load_catalog()
    targets = [
        SHEETS / "9-lab-item-creations-500.csv",
        SHEETS / "9-lab-item-creations-250.csv",
        SHEETS / "8-lab-items-500.csv",
        SHEETS / "8-lab-items-250.csv",
        SHEETS / "12-import-still-queue.csv",
        SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv",
    ]
    for path in targets:
        if not path.exists():
            print("skip missing", path.name)
            continue
        print(json.dumps(process_csv(path, catalog), indent=2))


if __name__ == "__main__":
    main()
