#!/usr/bin/env python3
"""Rebuild 10-creatomate-text-1000 with product_name + science facts 1–3.

Keeps mod_intro, mod_fact_4, mod_fact_5, mod_disclaimer unchanged.
mod_fact_1/2/3 become FDA research-only science/study lines for product_name.
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

# Research-safe fact banks per product.
# Tone: laboratory / published research / mechanism study — never treatment/consumer claims.
FACT_BANKS: dict[str, list[tuple[str, str, str]]] = {
    "5-Amino-1MQ": [
        (
            "Studied in research models of nicotinamide N-methyltransferase (NNMT) pathways",
            "Laboratory literature examines metabolic enzyme interaction profiles",
            "Used in controlled assays exploring cellular energy-related signaling",
        ),
        (
            "Investigated as a research tool for NNMT-related biochemical pathways",
            "In-vitro studies document structure–activity observations under lab conditions",
            "Catalogued for mechanistic research on methyltransferase biology",
        ),
        (
            "Appears in peer-reviewed research contexts involving metabolic enzyme studies",
            "Research protocols evaluate purity and assay reproducibility first",
            "Referenced in laboratory work on NAD+-adjacent metabolic networks",
        ),
    ],
    "AOD-9604": [
        (
            "Fragment derived from growth-hormone sequence regions studied in vitro",
            "Laboratory papers examine lipolytic pathway markers in research models",
            "Used in controlled studies of metabolic peptide fragment activity",
        ),
        (
            "Investigated in research settings for adipose-related pathway signaling",
            "Analytical labs document sequence identity and peptide integrity",
            "Positioned for mechanistic assays, not clinical application",
        ),
        (
            "Research literature explores GH-fragment biochemistry under lab protocols",
            "Studied for receptor-pathway observations in experimental systems",
            "Supplied for laboratory documentation of peptide fragment research",
        ),
    ],
    "BPC-157": [
        (
            "Pentadecapeptide studied in laboratory models of tissue-response pathways",
            "Research literature examines angiogenesis-related markers in vitro",
            "Used in controlled assays exploring gut and soft-tissue research models",
        ),
        (
            "Investigated for cytoprotective signaling observations in experimental systems",
            "Peer-reviewed research contexts document peptide stability and handling",
            "Catalogued for mechanistic studies of regenerative pathway markers",
        ),
        (
            "Appears in preclinical research on nitric-oxide and growth-factor pathways",
            "Laboratory protocols emphasize research-only documentation standards",
            "Referenced in assays studying endothelial and fibroblast model responses",
        ),
    ],
    "BPC-157/TB-500": [
        (
            "Combination researched as paired peptides in laboratory pathway studies",
            "Studies examine complementary tissue-response markers in experimental models",
            "Used when dual-peptide research documentation is required",
        ),
        (
            "Investigated together in controlled assays of cytoskeletal and repair markers",
            "Analytical labs verify both peptide identities before research use",
            "Positioned for comparative mechanism studies, research-only",
        ),
        (
            "Research protocols may evaluate synergistic pathway observations in vitro",
            "Literature frames both compounds as investigational research materials",
            "Catalogued for dual-listing laboratory documentation workflows",
        ),
    ],
    "Cagrilinitide": [
        (
            "Amylin-analogue peptide studied in metabolic research models",
            "Laboratory literature examines satiety-pathway receptor signaling in vitro",
            "Used in controlled assays of amylin-related biochemical responses",
        ),
        (
            "Investigated for long-acting amylin receptor research observations",
            "Peer-reviewed contexts document peptide engineering and assay design",
            "Referenced in laboratory work on metabolic peptide pharmacology",
        ),
        (
            "Research models explore gastric and energy-balance pathway markers",
            "Supplied for mechanistic studies under research-only labeling",
            "Analytical documentation prioritizes purity for reproducible assays",
        ),
    ],
    "CJC (no DAC)": [
        (
            "GHRH-analogue peptide studied in growth-hormone axis research models",
            "Laboratory literature examines pulsatile GH-related signaling in vitro",
            "Used in controlled assays of hypothalamic–pituitary pathway markers",
        ),
        (
            "Investigated without DAC modification for shorter-acting research profiles",
            "Research protocols document receptor binding observations in lab systems",
            "Catalogued for endocrine pathway mechanism studies, research-only",
        ),
        (
            "Appears in preclinical research on GHRH receptor pharmacology",
            "Analytical labs confirm peptide sequence before experimental use",
            "Positioned for laboratory documentation of GH-axis research materials",
        ),
    ],
    "CJC (no DAC)/Ipamorelin": [
        (
            "Paired GHRH-analogue and ghrelin-mimetic studied in GH-axis research",
            "Laboratory models examine complementary secretagogue pathway markers",
            "Used in dual-peptide assays of pituitary signaling research",
        ),
        (
            "Investigated together for synergistic GH-related observations in vitro",
            "Research literature frames both as investigational laboratory materials",
            "Catalogued when dual secretagogue documentation is required",
        ),
        (
            "Controlled studies explore receptor-selective pathway interactions",
            "Analytical verification covers both peptide identities pre-assay",
            "Supplied for mechanistic endocrine research, not clinical use",
        ),
    ],
    "DSIP": [
        (
            "Delta sleep-inducing peptide studied in sleep-regulation research models",
            "Laboratory literature examines neuromodulatory pathway markers",
            "Used in controlled assays of CNS peptide signaling research",
        ),
        (
            "Investigated for hypothalamic and sleep-architecture observations in vitro",
            "Peer-reviewed contexts document peptide handling for neuro research",
            "Referenced in laboratory work on neuropeptide mechanism studies",
        ),
        (
            "Research protocols evaluate purity for reproducible neuromodulatory assays",
            "Appears in experimental systems studying stress-related pathway markers",
            "Catalogued for research-only neurological peptide documentation",
        ),
    ],
    "GHK-Cu": [
        (
            "Copper-binding tripeptide studied in extracellular matrix research models",
            "Laboratory literature examines wound-model and collagen pathway markers",
            "Used in controlled assays of skin and tissue biochemistry research",
        ),
        (
            "Investigated for gene-expression observations in fibroblast research systems",
            "Peer-reviewed contexts document copper–peptide complex stability",
            "Referenced in laboratory work on regenerative pathway markers",
        ),
        (
            "Research models explore antioxidant and remodeling-related signaling",
            "Analytical labs confirm peptide–copper stoichiometry for assays",
            "Supplied for mechanistic cosmetic-science research, research-only labeling",
        ),
    ],
    "GLOW": [
        (
            "Multi-peptide research blend studied for complementary pathway documentation",
            "Laboratory catalogs list GLOW for controlled research inventory tracking",
            "Used when blend-level assay documentation is required",
        ),
        (
            "Investigated as a research-material set for multi-pathway lab protocols",
            "Analytical verification covers component identity before experimental use",
            "Positioned for laboratory documentation, not consumer application",
        ),
        (
            "Research workflows treat GLOW as investigational catalog material only",
            "Studies emphasize component purity and handling under lab standards",
            "Referenced in multi-peptide research receiving and QC files",
        ),
    ],
    "KLOW": [
        (
            "Research blend catalogued for laboratory multi-peptide documentation",
            "Laboratory protocols examine component pathway markers separately",
            "Used in controlled inventory and assay preparation workflows",
        ),
        (
            "Investigated as a research-only multi-compound listing for labs",
            "Analytical labs document each component identity pre-use",
            "Positioned for experimental documentation, not clinical application",
        ),
        (
            "Research catalogs frame KLOW as investigational laboratory material",
            "Handling standards follow sealed research-packaging requirements",
            "Referenced in blend-level QC and receiving checklists",
        ),
    ],
    "KPV": [
        (
            "Tripeptide fragment studied in anti-inflammatory pathway research models",
            "Laboratory literature examines melanocortin-related signaling in vitro",
            "Used in controlled assays of epithelial and immune-model markers",
        ),
        (
            "Investigated for gut and barrier-model observations in experimental systems",
            "Peer-reviewed contexts document short-peptide stability for assays",
            "Catalogued for mechanistic inflammation-pathway research, research-only",
        ),
        (
            "Appears in preclinical research on alpha-MSH fragment biochemistry",
            "Research protocols prioritize purity for reproducible cell assays",
            "Supplied for laboratory documentation of peptide fragment studies",
        ),
    ],
    "Melanotan 2": [
        (
            "Synthetic melanocortin analogue studied in pigmentation research models",
            "Laboratory literature examines MC1R/MC4R pathway signaling in vitro",
            "Used in controlled assays of melanocortin receptor pharmacology",
        ),
        (
            "Investigated for receptor-selective observations in experimental systems",
            "Peer-reviewed contexts document peptide handling for receptor assays",
            "Referenced in laboratory work on melanocortin mechanism studies",
        ),
        (
            "Research models explore appetite and pigmentation pathway markers",
            "Analytical verification confirms peptide identity before lab use",
            "Catalogued for research-only melanocortin documentation workflows",
        ),
    ],
    "MOTS-C": [
        (
            "Mitochondrial-derived peptide studied in metabolic research models",
            "Laboratory literature examines AMPK-related pathway markers in vitro",
            "Used in controlled assays of cellular energy-sensing research",
        ),
        (
            "Investigated for exercise-mimetic observations in experimental systems",
            "Peer-reviewed contexts document mtDNA-encoded peptide biochemistry",
            "Catalogued for mechanistic mitochondrial pathway studies, research-only",
        ),
        (
            "Appears in preclinical research on metabolic homeostasis markers",
            "Research protocols emphasize cold-chain handling for peptide assays",
            "Supplied for laboratory documentation of mitochondrial peptide work",
        ),
    ],
    "NAD+": [
        (
            "Essential redox cofactor studied across cellular energy research models",
            "Laboratory literature examines sirtuin and PARP pathway dependencies",
            "Used in controlled assays of NAD+-consuming enzyme activity",
        ),
        (
            "Investigated for mitochondrial and DNA-repair related observations in vitro",
            "Peer-reviewed contexts document cofactor stability in research buffers",
            "Referenced in laboratory work on metabolic and aging-biology pathways",
        ),
        (
            "Research models explore NAD+ salvage and biosynthesis pathway markers",
            "Analytical labs confirm identity and purity for reproducible assays",
            "Catalogued for research-only cofactor documentation workflows",
        ),
    ],
    "PT-141": [
        (
            "Melanocortin agonist peptide studied in receptor pharmacology research",
            "Laboratory literature examines central melanocortin pathway markers",
            "Used in controlled assays of MC3R/MC4R signaling research",
        ),
        (
            "Investigated for behavioral and receptor-response observations in models",
            "Peer-reviewed contexts document peptide design for CNS research",
            "Catalogued for mechanistic melanocortin studies, research-only",
        ),
        (
            "Appears in preclinical research on melanocortin agonist biochemistry",
            "Research protocols require research-use labeling on all documentation",
            "Supplied for laboratory receptor assay preparation workflows",
        ),
    ],
    "Retatrutide": [
        (
            "Triple agonist peptide studied in metabolic receptor research models",
            "Laboratory literature examines GLP-1/GIP/glucagon pathway signaling",
            "Used in controlled assays of multi-receptor pharmacology research",
        ),
        (
            "Investigated for energy-balance pathway observations in experimental systems",
            "Peer-reviewed contexts document engineered peptide receptor profiles",
            "Catalogued for mechanistic metabolic peptide studies, research-only",
        ),
        (
            "Research models explore multi-incretin pathway marker responses",
            "Analytical verification confirms peptide identity before assay use",
            "Positioned for laboratory documentation, not clinical application",
        ),
    ],
    "Selank": [
        (
            "Synthetic tuftsin analogue studied in anxiolytic pathway research models",
            "Laboratory literature examines GABA and immunomodulatory markers in vitro",
            "Used in controlled assays of neuropeptide signaling research",
        ),
        (
            "Investigated for cognitive and stress-pathway observations in lab systems",
            "Peer-reviewed contexts document peptide stability for CNS research",
            "Catalogued for mechanistic neuropeptide studies, research-only",
        ),
        (
            "Appears in preclinical research on regulatory peptide biochemistry",
            "Research protocols emphasize research-only handling and labeling",
            "Supplied for laboratory documentation of neuropeptide assays",
        ),
    ],
    "Semaglutide": [
        (
            "GLP-1 receptor agonist peptide studied in metabolic research models",
            "Laboratory literature examines incretin pathway signaling in vitro",
            "Used in controlled assays of GLP-1 receptor pharmacology research",
        ),
        (
            "Investigated for glucose and appetite pathway observations in experimental systems",
            "Peer-reviewed contexts document long-acting peptide engineering",
            "Catalogued for mechanistic incretin studies, research-only labeling",
        ),
        (
            "Research models explore GLP-1 related metabolic marker responses",
            "Analytical labs confirm peptide identity and purity pre-assay",
            "Positioned for laboratory documentation workflows only",
        ),
    ],
    "SEMAX": [
        (
            "Synthetic ACTH fragment analogue studied in cognitive research models",
            "Laboratory literature examines neurotrophic and BDNF-related markers",
            "Used in controlled assays of CNS peptide signaling research",
        ),
        (
            "Investigated for nootropic pathway observations in experimental systems",
            "Peer-reviewed contexts document peptide fragment pharmacology",
            "Catalogued for mechanistic neuro research, research-only",
        ),
        (
            "Appears in preclinical research on ACTH(4-10) analogue biochemistry",
            "Research protocols require sealed research packaging documentation",
            "Supplied for laboratory neuropeptide assay preparation",
        ),
    ],
    "Sermorelin": [
        (
            "GHRH(1-29) analogue studied in growth-hormone axis research models",
            "Laboratory literature examines pituitary GH-release pathway markers",
            "Used in controlled assays of GHRH receptor pharmacology",
        ),
        (
            "Investigated for endocrine axis observations in experimental systems",
            "Peer-reviewed contexts document peptide sequence and assay design",
            "Catalogued for mechanistic GH-axis studies, research-only",
        ),
        (
            "Research models explore pulsatile GH-related signaling markers",
            "Analytical verification confirms peptide identity before lab use",
            "Positioned for laboratory endocrine documentation workflows",
        ),
    ],
    "SS-31": [
        (
            "Mitochondria-targeting peptide studied in bioenergetics research models",
            "Laboratory literature examines cardiolipin and ETC pathway markers",
            "Used in controlled assays of mitochondrial membrane research",
        ),
        (
            "Investigated for oxidative-stress observations in experimental systems",
            "Peer-reviewed contexts document Szeto–Schiller peptide biochemistry",
            "Catalogued for mechanistic mitochondrial studies, research-only",
        ),
        (
            "Appears in preclinical research on mitochondrial protective pathway markers",
            "Research protocols emphasize cold storage for peptide integrity",
            "Supplied for laboratory bioenergetics documentation workflows",
        ),
    ],
    "TA-1": [
        (
            "Thymosin alpha-1 studied in immune-modulation research models",
            "Laboratory literature examines T-cell and innate pathway markers",
            "Used in controlled assays of thymic peptide signaling research",
        ),
        (
            "Investigated for immunomodulatory observations in experimental systems",
            "Peer-reviewed contexts document peptide structure and assay use",
            "Catalogued for mechanistic immune research, research-only labeling",
        ),
        (
            "Appears in preclinical research on thymic hormone fragment biochemistry",
            "Research protocols require research-use only documentation language",
            "Supplied for laboratory immunology assay preparation workflows",
        ),
    ],
    "TB-500": [
        (
            "Thymosin beta-4 fragment studied in actin and cell-migration research",
            "Laboratory literature examines cytoskeletal pathway markers in vitro",
            "Used in controlled assays of tissue-response model systems",
        ),
        (
            "Investigated for regenerative pathway observations in experimental models",
            "Peer-reviewed contexts document peptide fragment stability for assays",
            "Catalogued for mechanistic cytoskeletal studies, research-only",
        ),
        (
            "Appears in preclinical research on actin-sequestering peptide biochemistry",
            "Research protocols emphasize research-only handling standards",
            "Supplied for laboratory documentation of migration/repair markers",
        ),
    ],
    "Tesamorelin": [
        (
            "Stabilized GHRH analogue studied in GH-axis and metabolic research models",
            "Laboratory literature examines visceral and GH pathway markers",
            "Used in controlled assays of GHRH receptor pharmacology research",
        ),
        (
            "Investigated for endocrine and body-composition observations in models",
            "Peer-reviewed contexts document peptide stabilization strategies",
            "Catalogued for mechanistic GH-axis studies, research-only",
        ),
        (
            "Research models explore GH-related metabolic marker responses",
            "Analytical labs confirm peptide identity before experimental use",
            "Positioned for laboratory documentation, not clinical application",
        ),
    ],
    "Tesamorelin/Ipamorelin": [
        (
            "Paired GHRH analogue and ghrelin-mimetic studied in GH-axis research",
            "Laboratory models examine complementary secretagogue pathway markers",
            "Used in dual-peptide endocrine assay documentation workflows",
        ),
        (
            "Investigated together for synergistic GH-related observations in vitro",
            "Research literature frames both as investigational laboratory materials",
            "Catalogued when dual secretagogue research listing is required",
        ),
        (
            "Controlled studies explore receptor-pathway interaction markers",
            "Analytical verification covers both peptide identities pre-assay",
            "Supplied for mechanistic endocrine research, research-only labeling",
        ),
    ],
    "Tirzepatide": [
        (
            "Dual GIP/GLP-1 agonist peptide studied in metabolic research models",
            "Laboratory literature examines incretin dual-receptor signaling in vitro",
            "Used in controlled assays of multi-incretin pharmacology research",
        ),
        (
            "Investigated for glucose and energy-balance pathway observations in models",
            "Peer-reviewed contexts document engineered dual-agonist peptide design",
            "Catalogued for mechanistic metabolic peptide studies, research-only",
        ),
        (
            "Research models explore GIP/GLP-1 related marker responses",
            "Analytical verification confirms peptide identity before assay use",
            "Positioned for laboratory documentation workflows only",
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
        # Light uniqueness suffix so rows differ while staying research-safe
        out.append(
            (
                a if n <= len(base) else f"{a} (research note {n:02d})",
                b if n <= len(base) else f"{b} · assay set {n:02d}",
                c if n <= len(base) else f"{c} · lab card {n:02d}",
            )
        )
        i += 1
    return out


def main() -> None:
    with CSV_IN.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    n = len(rows)
    assert n == 1000, f"expected 1000 rows, got {n}"

    # Even distribution across 27 products
    per = n // len(LABELS)
    rem = n % len(LABELS)
    assignment: list[str] = []
    for i, label in enumerate(LABELS):
        count = per + (1 if i < rem else 0)
        assignment.extend([label] * count)
    assert len(assignment) == n

    # Pre-expand fact banks per product
    counts = {p: assignment.count(p) for p in LABELS}
    banks = {p: expand_bank(p, counts[p]) for p in LABELS}
    cursors = {p: 0 for p in LABELS}

    out_rows = []
    for row, product in zip(rows, assignment):
        idx = cursors[product]
        f1, f2, f3 = banks[product][idx]
        cursors[product] = idx + 1
        out_rows.append(
            {
                "text_id": row["text_id"],
                "rank": row["rank"],
                "product_name": product,
                "mod_intro": row["mod_intro"],
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
    print("Per product:", {p: counts[p] for p in LABELS})


if __name__ == "__main__":
    main()
