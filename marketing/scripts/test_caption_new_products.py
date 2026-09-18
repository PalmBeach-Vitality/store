#!/usr/bin/env python3
"""Local checks for Sheet 15 + match_compound after the Sep 14 catalog add.

Does not call n8n. Does not send email.

    python3 marketing/scripts/test_caption_new_products.py
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV15 = ROOT / "sheets" / "15-caption-science-27.csv"
MATCH_JS = ROOT / "n8n-code-match-compound.js"

NEW = [
    "Dihexa",
    "Epithalon",
    "Glutathione",
    "IGF-LR3",
    "Ipamorelin",
    "Kisspeptin",
]
EXPECTED = 33
BANNED = ("human use", "benefits of using", "inject", "dosage", "you will")

LIVE_SLUGS = {
    "Dihexa": ("", "dihexa-10mg-pen"),
    "Epithalon": ("", "epithalon-50mg-pen"),
    "Glutathione": ("", "glutathione-600mg-pen"),
    "IGF-LR3": ("", "igf-lr3-1mg-pen"),
    "Ipamorelin": ("ipamorelin-10mg-vial", "ipamorelin-30mg-pen"),
    "Kisspeptin": ("", "kisspeptin-10mg-pen"),
    "KPV": ("kpv-10mg-vial", "kpv-pen"),
    "CJC (no DAC)/Ipamorelin": ("cjc-ipamorelin-vial", "cjc-ipamorelin-pen"),
}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower().replace("+", "plus"))


def load_product_links(js: str) -> dict[str, dict[str, str]]:
    block = re.search(r"var PRODUCT_LINKS = \{([\s\S]*?)\n\};", js)
    if not block:
        raise SystemExit("PRODUCT_LINKS block missing")
    links: dict[str, dict[str, str]] = {}
    for m in re.finditer(
        r"'([^']+)': \{ vial: '([^']*)', pen: '([^']*)' \}", block.group(1)
    ):
        links[m.group(1)] = {"vial": m.group(2), "pen": m.group(3)}
    if not links:
        raise SystemExit("no PRODUCT_LINKS keys parsed")
    return links


def score_row(wanted: str, name: str, aliases: str) -> int:
    keys = [norm(name)] + [norm(a) for a in aliases.split(",") if a.strip()]
    best = 99
    for k in keys:
        if not k:
            continue
        if k == wanted:
            best = 0
        elif wanted in k or k in wanted:
            best = min(best, 1)
    return best


def lookup(name: str, aliases: str, links: dict) -> tuple[str, str]:
    keys = [norm(name)] + [norm(a) for a in aliases.split(",") if a.strip()]
    for k in keys:
        if k in links:
            hit = links[k]
            return hit["vial"], hit["pen"]
    return "", ""


def main() -> int:
    rows = list(csv.DictReader(CSV15.open(encoding="utf-8")))
    names = [r["compound_name"] for r in rows]
    errors: list[str] = []
    if len(rows) != EXPECTED:
        errors.append(f"csv rows {len(rows)} != {EXPECTED}")
    if len(set(names)) != EXPECTED:
        errors.append("duplicate compound_name")
    for n in NEW:
        if n not in names:
            errors.append(f"missing {n}")
    by_name = {r["compound_name"]: r for r in rows}
    for r in rows:
        blob = " ".join(
            [r["science_what"], r["science_focus"], r["science_pathways"]]
        ).lower()
        for b in BANNED:
            if b in blob:
                errors.append(f"banned '{b}' in {r['compound_name']}")

    js = MATCH_JS.read_text(encoding="utf-8")
    links = load_product_links(js)
    hyphen_keys = [k for k in links if "-" in k]
    if hyphen_keys:
        errors.append(f"hyphenated PRODUCT_LINKS keys {hyphen_keys}")

    # Solo Ipamorelin must not steal the CJC blend URLs.
    ipa = by_name["Ipamorelin"]
    blend = by_name["CJC (no DAC)/Ipamorelin"]
    wanted = norm("Ipamorelin")
    scored = sorted(
        ((score_row(wanted, r["compound_name"], r["aliases"]), r["compound_name"]) for r in rows),
        key=lambda t: (t[0], 0 if norm(t[1]) == wanted else 1),
    )
    if scored[0][1] != "Ipamorelin" or scored[0][0] != 0:
        errors.append(f"Ipamorelin match went to {scored[0]}")
    wanted_blend = norm("CJC (no DAC)/Ipamorelin")
    scored_b = sorted(
        (
            (score_row(wanted_blend, r["compound_name"], r["aliases"]), r["compound_name"])
            for r in rows
        ),
        key=lambda t: (t[0], 0 if norm(t[1]) == wanted_blend else 1),
    )
    if scored_b[0][1] != "CJC (no DAC)/Ipamorelin":
        errors.append(f"blend match went to {scored_b[0]}")

    for label, row in (("Ipamorelin", ipa), ("CJC (no DAC)/Ipamorelin", blend)):
        vial, pen = lookup(row["compound_name"], row["aliases"], links)
        expect = LIVE_SLUGS[label]
        if (vial, pen) != expect:
            errors.append(f"{label} slugs {(vial, pen)} != {expect}")

    for name, expect in LIVE_SLUGS.items():
        if name not in by_name:
            continue
        row = by_name[name]
        vial, pen = lookup(row["compound_name"], row["aliases"], links)
        if (vial, pen) != expect:
            errors.append(f"{name} slugs {(vial, pen)} != {expect}")

    if "ipamorelin" not in links:
        errors.append("missing ipamorelin PRODUCT_LINKS key")
    if links.get("ipamorelin", {}).get("vial") == "cjc-ipamorelin-vial":
        errors.append("ipamorelin still maps to the CJC blend")

    if errors:
        print("FAIL")
        for e in errors:
            print(" -", e)
        return 1
    print(f"ok: {EXPECTED} rows, 6 new products, Ipamorelin solo slugs, blend intact")
    return 0


if __name__ == "__main__":
    sys.exit(main())
