#!/usr/bin/env python3
"""Rebuild 10-creatomate-text-1000 with product_name + plain-English ad facts 1–3.

Keeps mod_fact_4, mod_fact_5, mod_disclaimer unchanged.
mod_intro in sheet is unused for on-screen Intro (map uses product_name).
mod_fact_1/2/3 = short ad-style lines, FDA research-only (no treatment claims).
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_IN = ROOT / "sheets" / "10-creatomate-text-1000.csv"
CSV_OUT = CSV_IN
JSON_OUT = ROOT / "pbvita-1000-creatomate-text.json"
LABELS = json.loads((ROOT / "compound-labels.json").read_text())["labels"]

# Plain English, advertisement tone — still research-only / FDA-safe.
# No cure/treat/dose-for-humans language.
FACT_BANKS: dict[str, list[tuple[str, str, str]]] = {
    "5-Amino-1MQ": [
        (
            "A clean research compound for metabolism-focused lab work",
            "Made for teams studying how cells handle energy",
            "Premium research material — lab use only",
        ),
        (
            "Built for serious metabolic research catalogs",
            "Simple, focused compound for energy-pathway studies",
            "Trusted listing for controlled laboratory projects",
        ),
        (
            "Sharp research option for NAD+-related lab studies",
            "Clear documentation. Research-grade quality.",
            "Add it to your next research order list",
        ),
    ],
    "AOD-9604": [
        (
            "A research peptide made for metabolism lab projects",
            "Popular pick for fat-pathway research models",
            "Clean, catalog-ready research material",
        ),
        (
            "Lab-focused fragment for metabolic research teams",
            "Built for clear, controlled study setups",
            "Research use only — not for clinical use",
        ),
        (
            "Premium research listing for GH-fragment studies",
            "Straightforward material for serious lab work",
            "Order-ready for your research inventory",
        ),
    ],
    "BPC-157": [
        (
            "One of the most requested research peptides in the catalog",
            "Made for labs studying recovery and tissue pathways",
            "Clean research-grade material, ready for your bench",
        ),
        (
            "A standout peptide for regenerative research models",
            "Simple to document. Built for serious lab work.",
            "Research only — not for human use",
        ),
        (
            "Premium BPC-157 for controlled laboratory studies",
            "Clear labeling. Reliable research quality.",
            "Add this to your next lab order",
        ),
    ],
    "BPC-157/TB-500": [
        (
            "Two research favorites, listed together for lab convenience",
            "Built for teams studying recovery pathways side by side",
            "A clean dual listing for serious research catalogs",
        ),
        (
            "Paired research peptides in one easy catalog entry",
            "Made for labs that want both compounds on hand",
            "Research-grade quality — lab use only",
        ),
        (
            "Dual-peptide research set for advanced lab projects",
            "Clear docs. Straightforward research ordering.",
            "Stock both in one research-ready listing",
        ),
    ],
    "Cagrilinitide": [
        (
            "A modern research peptide for metabolic lab studies",
            "Made for teams exploring appetite-pathway models",
            "Premium research material with clear catalog docs",
        ),
        (
            "Clean amylin-analogue option for research inventories",
            "Built for controlled laboratory study setups",
            "Research use only — not for clinical use",
        ),
        (
            "Sharp listing for next-gen metabolic research",
            "Simple, focused, research-ready packaging",
            "Order it for your lab catalog today",
        ),
    ],
    "CJC (no DAC)": [
        (
            "A research classic for growth-hormone pathway studies",
            "Made for labs that want a clean GHRH-style compound",
            "Clear labeling. Research-grade quality.",
        ),
        (
            "Trusted research peptide for endocrine lab work",
            "Straightforward material for controlled studies",
            "Lab use only — not for human use",
        ),
        (
            "Premium CJC listing for serious research teams",
            "Built for clean documentation and easy ordering",
            "Add it to your research inventory",
        ),
    ],
    "CJC (no DAC)/Ipamorelin": [
        (
            "A popular research pair for GH-pathway lab work",
            "Two complementary compounds in one catalog listing",
            "Clean dual set for serious laboratory teams",
        ),
        (
            "Research duo made for growth-hormone study models",
            "Easy to order. Clear research documentation.",
            "Research-grade quality — lab use only",
        ),
        (
            "Paired secretagogues for advanced research catalogs",
            "Built for labs that want both on the shelf",
            "Stock this dual listing for your next project",
        ),
    ],
    "DSIP": [
        (
            "A research peptide for sleep and nervous-system lab models",
            "Made for teams studying calm and recovery pathways",
            "Clean research material with clear catalog notes",
        ),
        (
            "Simple, focused compound for neuro research labs",
            "Built for controlled study setups and clean docs",
            "Research use only — not for clinical use",
        ),
        (
            "Premium DSIP listing for laboratory inventories",
            "Straightforward research quality you can trust",
            "Add it to your next research order",
        ),
    ],
    "GHK-Cu": [
        (
            "A copper peptide favorite for skin and tissue research",
            "Made for labs studying repair and renewal pathways",
            "Clean, research-ready catalog material",
        ),
        (
            "Premium research peptide for matrix and skin lab work",
            "Clear labeling. Reliable research quality.",
            "Lab use only — not for human use",
        ),
        (
            "Popular GHK-Cu listing for serious research teams",
            "Built for clean documentation and easy ordering",
            "Stock it for your next lab project",
        ),
    ],
    "GLOW": [
        (
            "A research blend built for multi-pathway lab work",
            "One listing. Multiple research-ready components.",
            "Clean catalog option for busy laboratory teams",
        ),
        (
            "Convenient research set for advanced lab catalogs",
            "Made for teams that want a complete research kit feel",
            "Research-grade quality — lab use only",
        ),
        (
            "Premium GLOW blend for controlled laboratory projects",
            "Straightforward ordering. Clear research docs.",
            "Add this blend to your research inventory",
        ),
    ],
    "KLOW": [
        (
            "A research blend made for multi-compound lab setups",
            "Convenient listing for teams that need more than one tool",
            "Clean, catalog-ready research material",
        ),
        (
            "Practical research set for busy laboratory inventories",
            "Built for clear docs and controlled study use",
            "Research use only — not for clinical use",
        ),
        (
            "Premium KLOW blend for serious research catalogs",
            "Simple to order. Easy to document.",
            "Stock it for your next lab project",
        ),
    ],
    "KPV": [
        (
            "A short research peptide for inflammation-pathway lab work",
            "Made for teams studying gut and barrier models",
            "Clean research-grade material, ready to catalog",
        ),
        (
            "Focused research option with clear laboratory documentation",
            "Built for controlled studies — not clinical use",
            "Premium quality for serious research teams",
        ),
        (
            "Popular KPV listing for research inventories",
            "Simple. Clean. Research-ready.",
            "Add it to your next lab order",
        ),
    ],
    "Melanotan 2": [
        (
            "A research peptide for melanocortin pathway lab studies",
            "Made for teams exploring pigment and receptor models",
            "Clean catalog material for controlled research",
        ),
        (
            "Focused research compound with clear lab documentation",
            "Built for serious study setups — research only",
            "Premium listing for laboratory inventories",
        ),
        (
            "Research-ready Melanotan 2 for your catalog",
            "Straightforward quality. Clear research labeling.",
            "Order it for your next lab project",
        ),
    ],
    "MOTS-C": [
        (
            "A mitochondrial research peptide for energy lab studies",
            "Made for teams exploring cellular energy pathways",
            "Clean, modern research material for your catalog",
        ),
        (
            "Premium research option for metabolism-focused labs",
            "Clear docs. Research-grade quality.",
            "Lab use only — not for human use",
        ),
        (
            "Sharp MOTS-C listing for serious research teams",
            "Built for controlled laboratory projects",
            "Add it to your research order list",
        ),
    ],
    "NAD+": [
        (
            "Essential research material for cellular energy studies",
            "A catalog staple for labs working on metabolism",
            "Clean, research-ready NAD+ for your inventory",
        ),
        (
            "Premium cofactor listing for serious laboratory work",
            "Clear labeling. Trusted research quality.",
            "Research use only — not for clinical use",
        ),
        (
            "Must-have NAD+ for research catalogs",
            "Simple to document. Easy to reorder.",
            "Stock it for your next lab project",
        ),
    ],
    "PT-141": [
        (
            "A research peptide for melanocortin receptor lab work",
            "Made for teams studying central pathway models",
            "Clean research material with clear catalog docs",
        ),
        (
            "Focused research compound for controlled study setups",
            "Built for laboratory documentation — not clinical use",
            "Premium quality for serious research teams",
        ),
        (
            "Research-ready PT-141 for your catalog",
            "Straightforward ordering. Clear research labels.",
            "Add it to your next lab order",
        ),
    ],
    "Retatrutide": [
        (
            "A next-gen research peptide for metabolic lab studies",
            "Made for teams exploring multi-pathway models",
            "Premium research listing with clear documentation",
        ),
        (
            "Modern research compound for advanced lab catalogs",
            "Clean quality. Built for controlled study use.",
            "Research only — not for human use",
        ),
        (
            "Sharp Retatrutide option for serious research teams",
            "Straightforward to order and document",
            "Stock it for your next research project",
        ),
    ],
    "Selank": [
        (
            "A research peptide for calm and focus pathway studies",
            "Made for labs exploring stress-related models",
            "Clean research material for your catalog",
        ),
        (
            "Focused neuro research option with clear lab docs",
            "Built for controlled studies — research only",
            "Premium listing for laboratory inventories",
        ),
        (
            "Research-ready Selank for serious lab teams",
            "Simple quality. Clear research labeling.",
            "Add it to your next research order",
        ),
    ],
    "Semaglutide": [
        (
            "A leading research peptide for metabolic lab studies",
            "Made for teams working on incretin pathway models",
            "Clean, premium research material for your catalog",
        ),
        (
            "High-demand research listing for serious lab inventories",
            "Clear docs. Research-grade quality.",
            "Lab use only — not for clinical use",
        ),
        (
            "Research-ready Semaglutide for controlled study setups",
            "Straightforward ordering for laboratory teams",
            "Stock it for your next research project",
        ),
    ],
    "SEMAX": [
        (
            "A research peptide for focus and cognitive lab models",
            "Made for teams studying brain pathway research",
            "Clean catalog material for controlled studies",
        ),
        (
            "Focused neuro research option with clear documentation",
            "Built for laboratory use — not clinical use",
            "Premium quality for serious research teams",
        ),
        (
            "Research-ready SEMAX for your inventory",
            "Simple to order. Easy to document.",
            "Add it to your next lab catalog order",
        ),
    ],
    "Sermorelin": [
        (
            "A research classic for growth-hormone pathway studies",
            "Made for labs that want clean endocrine research material",
            "Clear labeling. Trusted research quality.",
        ),
        (
            "Premium Sermorelin listing for laboratory inventories",
            "Built for controlled study setups",
            "Research use only — not for human use",
        ),
        (
            "Research-ready Sermorelin for serious lab teams",
            "Straightforward docs and easy reordering",
            "Stock it for your next research project",
        ),
    ],
    "SS-31": [
        (
            "A research peptide for mitochondrial energy lab studies",
            "Made for teams exploring cellular powerhouse pathways",
            "Clean, modern research material for your catalog",
        ),
        (
            "Premium bioenergetics option for serious research labs",
            "Clear docs. Research-grade quality.",
            "Lab use only — not for clinical use",
        ),
        (
            "Research-ready SS-31 for advanced lab catalogs",
            "Built for controlled laboratory projects",
            "Add it to your next research order",
        ),
    ],
    "TA-1": [
        (
            "A research peptide for immune-pathway lab studies",
            "Made for teams exploring immune system models",
            "Clean research material with clear catalog notes",
        ),
        (
            "Focused immunology research option for lab inventories",
            "Built for controlled studies — research only",
            "Premium quality for serious research teams",
        ),
        (
            "Research-ready TA-1 for your catalog",
            "Simple ordering. Clear research labeling.",
            "Stock it for your next lab project",
        ),
    ],
    "TB-500": [
        (
            "A research favorite for recovery-pathway lab studies",
            "Made for teams studying movement and repair models",
            "Clean research-grade material, ready to catalog",
        ),
        (
            "Premium TB-500 listing for serious laboratory work",
            "Clear docs. Built for controlled study use.",
            "Research only — not for human use",
        ),
        (
            "Research-ready TB-500 for your inventory",
            "Straightforward quality for busy lab teams",
            "Add it to your next research order",
        ),
    ],
    "Tesamorelin": [
        (
            "A research peptide for growth-hormone pathway studies",
            "Made for labs exploring metabolic and GH models",
            "Clean, premium research material for your catalog",
        ),
        (
            "Trusted Tesamorelin listing for laboratory inventories",
            "Clear labeling. Research-grade quality.",
            "Lab use only — not for clinical use",
        ),
        (
            "Research-ready Tesamorelin for serious lab teams",
            "Simple to order and document",
            "Stock it for your next research project",
        ),
    ],
    "Tesamorelin/Ipamorelin": [
        (
            "A powerful research pair for GH-pathway lab work",
            "Two complementary compounds in one easy listing",
            "Clean dual set for serious laboratory catalogs",
        ),
        (
            "Popular research duo — ready for your lab inventory",
            "Built for teams that want both compounds on hand",
            "Research-grade quality — lab use only",
        ),
        (
            "Paired research peptides for advanced study setups",
            "Clear docs. Straightforward dual ordering.",
            "Stock this combo for your next lab project",
        ),
    ],
    "Tirzepatide": [
        (
            "A leading dual-pathway research peptide for metabolic labs",
            "Made for teams studying modern incretin models",
            "Premium research listing with clear documentation",
        ),
        (
            "High-demand research compound for serious lab catalogs",
            "Clean quality. Built for controlled study use.",
            "Research only — not for human use",
        ),
        (
            "Research-ready Tirzepatide for your inventory",
            "Straightforward ordering for laboratory teams",
            "Add it to your next research project list",
        ),
    ],
}


def expand_bank(product: str, need: int) -> list[tuple[str, str, str]]:
    base = FACT_BANKS[product]
    out: list[tuple[str, str, str]] = []
    i = 0
    while len(out) < need:
        a, b, c = base[i % len(base)]
        n = len(out) + 1
        if n <= len(base):
            out.append((a, b, c))
        else:
            # Rotate wording lightly so later rows stay unique but plain
            out.append(
                (
                    a,
                    f"{b} — research card {n:02d}",
                    f"{c} · set {n:02d}",
                )
            )
        i += 1
    return out


def main() -> None:
    with CSV_IN.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    n = len(rows)
    assert n == 1000, f"expected 1000 rows, got {n}"

    per = n // len(LABELS)
    rem = n % len(LABELS)
    assignment: list[str] = []
    for i, label in enumerate(LABELS):
        count = per + (1 if i < rem else 0)
        assignment.extend([label] * count)
    assert len(assignment) == n

    counts = {p: assignment.count(p) for p in LABELS}
    banks = {p: expand_bank(p, counts[p]) for p in LABELS}
    cursors = {p: 0 for p in LABELS}

    out_rows = []
    for row, product in zip(rows, assignment):
        idx = cursors[product]
        f1, f2, f3 = banks[product][idx]
        cursors[product] = idx + 1
        # Keep existing product_name if already set and matches assignment order,
        # but always write the assigned product for a clean rebuild.
        out_rows.append(
            {
                "text_id": row["text_id"],
                "rank": row["rank"],
                "product_name": product,
                "mod_intro": product,  # sheet backup; map uses video_url_input.product_name
                "mod_fact_1": f1,
                "mod_fact_2": f2,
                "mod_fact_3": f3,
                "mod_fact_4": row["mod_fact_4"],
                "mod_fact_5": row["mod_fact_5"],
                "mod_disclaimer": row["mod_disclaimer"],
                "status": row["status"],
                "times_used": row.get("times_used", "0") or "0",
                "last_used_at": row.get("last_used_at", ""),
            }
        )

    fieldnames = [
        "text_id",
        "rank",
        "product_name",
        "mod_intro",
        "mod_fact_1",
        "mod_fact_2",
        "mod_fact_3",
        "mod_fact_4",
        "mod_fact_5",
        "mod_disclaimer",
        "status",
        "times_used",
        "last_used_at",
    ]
    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(out_rows)

    JSON_OUT.write_text(json.dumps(out_rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out_rows)} rows → {CSV_OUT}")
    sample = next(r for r in out_rows if r["product_name"] == "Tesamorelin/Ipamorelin")
    print("Sample Tesamorelin/Ipamorelin:", sample["mod_intro"], "|", sample["mod_fact_1"])


if __name__ == "__main__":
    main()
