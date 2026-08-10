#!/usr/bin/env python3
"""Enforce Palm Beach Vitality catalog vial packaging on wellness/lab scene sheets.

Reference look (mandatory when a vial appears):
  - clear transparent glass multi-use injection vial
  - bright blue plastic flip-off cap over brushed-silver aluminum crimp + rubber septum
  - clean white wrap-around label
  - dark maroon DNA double-helix logo centered at top of label
  - product name in large bold dark maroon sans-serif (exact compound only, once)
  - solid dark maroon horizontal bar with white dosage strength
  - black concentration line (mg/ml) under the bar
  - small black footer: "10ml Sterile Multi-Use Vial"
  - often staged on a clear acrylic / glass pedestal

Replaces older "crimped aluminum + rubber only / no plastic caps" language.
Safe to re-run.
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
    SHEETS / "8-lab-items-500.csv",
    SHEETS / "8-lab-items-250.csv",
    SHEETS / "12-import-still-queue.csv",
    SHEETS / "3-image-scenes-150.csv",
]
JSON_PATHS = [
    ROOT / "pbvita-500-lab-item-creations.json",
]

VIAL_HERO = (
    "clear glass Palm Beach Vitality injection vial with bright blue flip-off cap, "
    "brushed-silver aluminum crimp seal over rubber septum, and a clean white wrap-around "
    "label bearing a dark maroon DNA double-helix logo, the exact compound name in large bold "
    "dark maroon type, a solid dark maroon dosage bar with white mg strength, black mg/ml "
    "concentration text, and a small black footer reading '10ml Sterile Multi-Use Vial'"
)

VIAL_RULE = (
    "VIAL PACKAGING RULE (MANDATORY): When any vial appears it must match Palm Beach Vitality "
    "catalog packaging exactly: clear transparent glass multi-use injection vial; bright blue "
    "plastic flip-off cap seated on a brushed-silver aluminum crimp seal over a rubber septum "
    "(show the blue cap + silver crimp stack clearly); clean white wrap-around label; dark maroon "
    "stylized DNA double-helix logo centered at the top of the label; product name in large bold "
    "dark maroon sans-serif — the exact compound name only, printed once; a solid dark maroon "
    "horizontal bar with white dosage strength; black concentration line (mg/ml) under the bar; "
    "small black footer text exactly '10ml Sterile Multi-Use Vial'. Prefer a single vial hero on "
    "a clear acrylic or glass pedestal. NO amber-glass hero vial, NO gold caps, NO bare crimp "
    "without the blue flip-cap, NO twist-off or screw caps, NO blank/unbranded pharmacy vial, "
    "NO second vial, NO duplicate labels. "
    "SINGLE HERO PRODUCT RULE (MANDATORY — CRITICAL): exactly ONE vial OR ONE pen per image — "
    "never both, never a row/rack/carousel/constellation of vials or pens."
)

OLD_RULE = re.compile(
    r"VIAL CLOSURE RULE \(MANDATORY\):.*?(?:crimped metal \+ rubber only\.|plastic twist closures[^.]*\.)",
    re.IGNORECASE | re.DOTALL,
)

# Longer phrases first
REPLACEMENTS: list[tuple[str, str]] = [
    (
        r"\bsingle crimped-seal rubber-septum injection research vial on a clear acrylic pedestal as the quiet hero\b",
        f"a single {VIAL_HERO} on a clear acrylic pedestal as the quiet hero",
    ),
    (
        r"\bsingle crimped-seal rubber-septum research vial catching soft rim light on a natural surface\b",
        f"a single {VIAL_HERO} catching soft rim light on a natural surface",
    ),
    (
        r"\bsingle crimped-seal rubber-septum injection research vial\b",
        f"a single {VIAL_HERO}",
    ),
    (
        r"\bsingle aluminum-crimped rubber-septum injection vial\b",
        f"a single {VIAL_HERO}",
    ),
    (
        r"\bclear crimped-seal rubber-septum injection vial hero\b",
        f"{VIAL_HERO} as the quiet hero",
    ),
    (
        r"\bcrimped-seal rubber-septum injection research vials catching rim light on a reflective black plinth\b",
        f"a single {VIAL_HERO} catching rim light on a reflective black plinth",
    ),
    (
        r"\bcrimped-seal rubber-septum injection research vials\b",
        f"a single {VIAL_HERO}",
    ),
    (
        r"\bcrimped-seal rubber-septum injection research vial\b",
        VIAL_HERO,
    ),
    (
        r"\bcrimped-seal rubber-septum peptide injection vial\b",
        VIAL_HERO,
    ),
    (
        r"\baluminum-crimped rubber-septum injection vial\b",
        VIAL_HERO,
    ),
    (
        r"\bone elegant multi-vial storyboard of crimped-seal rubber-septum injection vials\b",
        f"one elegant catalog hero: a single {VIAL_HERO}",
    ),
    (
        r"\bmulti-vial storyboard of crimped-seal rubber-septum injection vials\b",
        f"a single {VIAL_HERO}",
    ),
    (
        r"\brubber-septum injection research vial on a clear acrylic pedestal as the quiet hero\b",
        f"{VIAL_HERO} on a clear acrylic pedestal as the quiet hero",
    ),
    (
        r"\brubber-septum injection research vial\b",
        VIAL_HERO,
    ),
    (
        r"\bamber glass research vial with rubber stopper\b",
        VIAL_HERO,
    ),
    (
        r"\bamber research vial sealed septum close-up\b",
        f"close-up of {VIAL_HERO}",
    ),
]


def apply_replacements(text: str) -> str:
    out = text or ""
    for pat, repl in REPLACEMENTS:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    return out


def ensure_rule(text: str) -> str:
    t = apply_replacements(text or "")
    if OLD_RULE.search(t):
        t = OLD_RULE.sub(VIAL_RULE, t)
    if "VIAL PACKAGING RULE" in t:
        # Normalize any older packaging wording if a short/old copy slipped in
        t = re.sub(
            r"VIAL PACKAGING RULE \(MANDATORY\):.*?(?:NO second vial, NO duplicate labels\.|NO duplicate labels\.)",
            VIAL_RULE,
            t,
            count=1,
            flags=re.IGNORECASE | re.DOTALL,
        )
        return t
    if "VIAL CLOSURE RULE" in t:
        t = re.sub(
            r"VIAL CLOSURE RULE \(MANDATORY\):.*?(?:crimped metal \+ rubber only\.|plastic twist closures[^.]*\.)",
            VIAL_RULE,
            t,
            flags=re.IGNORECASE | re.DOTALL,
        )
        if "VIAL PACKAGING RULE" in t:
            return t
    markers = [
        "For laboratory research use only.",
        "Quality: ultra detailed",
        "ABSOLUTE RULE — NO DOUBLES",
        "ABSOLUTE RULE - NO DOUBLES",
    ]
    for marker in markers:
        idx = t.find(marker)
        if idx != -1:
            return t[:idx].rstrip() + " " + VIAL_RULE + " " + t[idx:]
    # Label-instruction blocks often sit near the end of wellness prompts
    label_marker = "If any vial, pen, carton panel"
    idx = t.find(label_marker)
    if idx != -1:
        return t[:idx].rstrip() + " " + VIAL_RULE + " " + t[idx:]
    return (t.rstrip() + " " + VIAL_RULE).strip()


TEXT_KEYS = (
    "lab_item",
    "video_prompt",
    "material_detail",
    "scene_brief",
    "product_hero",
    "product_form_detail",
    "still_edit_prompt",
)


def patch_row(row: dict) -> bool:
    changed = False
    for key in TEXT_KEYS:
        if key not in row or row[key] is None:
            continue
        old = str(row[key])
        if not old.strip():
            continue
        # Always enforce full rule on primary prompt fields
        if key in ("lab_item", "video_prompt", "scene_brief", "product_hero"):
            new = ensure_rule(old)
        else:
            new = apply_replacements(old)
            if "vial" in new.lower() and "VIAL PACKAGING RULE" not in new and "VIAL CLOSURE RULE" not in new:
                # material_detail often carries the focal vial — upgrade rule if vial present
                if key == "material_detail":
                    new = ensure_rule(new)
        if new != old:
            row[key] = new
            changed = True
    return changed


def patch_csv(path: Path) -> int:
    if not path.exists():
        print(f"skip missing {path.name}")
        return 0
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fields = list(rows[0].keys()) if rows else []
    n = 0
    for r in rows:
        if patch_row(r):
            n += 1
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    return n


def patch_json(path: Path) -> int:
    if not path.exists():
        print(f"skip missing {path.name}")
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
    for p in JSON_PATHS:
        n = patch_json(p)
        print(f"{p.name}: patched {n} items")


if __name__ == "__main__":
    main()
