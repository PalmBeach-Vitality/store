#!/usr/bin/env python3
"""Build Sheet 15 — science briefs for IG captions (vial + pen).

Does NOT modify Sheet 9 / 10 / 13 / 14.
Output: marketing/sheets/15-caption-science-27.csv
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sheets" / "15-caption-science-27.csv"

STORE = "www.palmbeach-vitality.store"

FIELDS = [
    "compound_id",
    "compound_name",
    "aliases",
    "science_what",
    "science_focus",
    "science_pathways",
    "tag2",
    "tag3",
    "tag4",
    "tag5",
    "store_url",
    "status",
]

# science_* stay research-framed: no human-use, benefits-of-using, dose, inject.
COMPOUNDS = [
    (
        "P-5A1MQ-001",
        "5-Amino-1MQ",
        "5amino1mq,5-amino,amino1mq",
        "a compact research compound used in studies of cellular energy handling",
        "how cells manage NAD+-related pathways and metabolic signaling in laboratory models",
        "NNMT-related activity and energy-pathway mapping at the molecular level",
        "MetabolicResearch",
        "CellularEnergy",
        "PeptideResearch",
        "ResearchPeptides",
    ),
    (
        "P-AOD-001",
        "AOD-9604",
        "aod9604,aod,aod-9604",
        "a fragment-style research peptide drawn from growth-hormone sequence work",
        "lipid-metabolism signaling and fat-mobilization pathways in controlled lab models",
        "how researchers map metabolic peptide fragments without making outcome claims",
        "MetabolicScience",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-BPC-001",
        "BPC-157",
        "bpc157,bpc-157,bpc 157,bpc",
        "a synthetic peptide modeled after a natural protective compound found in gastric juice",
        "its role in cellular signaling, tissue repair pathways, and support of the body's natural recovery processes at the molecular level",
        "how laboratory models track cell-to-cell signaling during structured recovery research",
        "PeptideResearch",
        "TissueRepair",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-BPCTB-001",
        "BPC-157/TB-500",
        "bpc tb,bpctb,bpc157tb500,bpc/tb",
        "a paired research complex combining two widely studied repair-pathway peptides",
        "complementary signaling work around cytoskeletal dynamics and tissue-research models",
        "how two peptide sequences are cataloged together for side-by-side laboratory study",
        "PeptideResearch",
        "TissueRepair",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-CAGRI-001",
        "Cagrilinitide",
        "cagri,cagrilintide,cagrilinitide",
        "an amylin-analogue research peptide used in metabolic-pathway studies",
        "amylin-related signaling and appetite-circuit mapping in laboratory systems",
        "how researchers describe long-acting amylin analogues at the receptor level",
        "MetabolicResearch",
        "PeptideScience",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-CJC-001",
        "CJC",
        "cjc1295,cjc-1295,cjc 1295",
        "a GHRH-analogue research peptide used in endocrine-axis laboratory work",
        "growth-hormone–releasing pathways and pituitary signaling in research models",
        "how analog design changes receptor engagement in controlled endocrine studies",
        "EndocrineLab",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-CJCIPA-001",
        "CJC (no DAC)/Ipamorelin",
        "cjc ipamorelin,cjc/ipa,cjcipa,no dac",
        "a stacked GHRH plus ghrelin-mimetic pair cataloged as one research complex",
        "combined growth-axis signaling in laboratory endocrine models",
        "how two complementary sequences are studied together without outcome claims",
        "EndocrineLab",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-DSIP-001",
        "DSIP",
        "delta sleep,dsip peptide",
        "a short neuropeptide studied in sleep-architecture and stress-axis research",
        "delta-sleep–inducing peptide signaling and neuroendocrine laboratory models",
        "how a compact peptide is used to map rest-related neural pathways in vitro",
        "NeuropeptideScience",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-GHK-001",
        "GHK-Cu",
        "ghkcu,ghk cu,ghk-cu,copper peptide,ghk",
        "a copper-binding tripeptide complex used in extracellular-matrix research",
        "copper-peptide signaling, collagen-related gene work, and skin-matrix laboratory models",
        "how a tripeptide chelate is cataloged for regenerative-pathway mapping",
        "CopperPeptide",
        "CellularScience",
        "PeptideResearch",
        "ResearchPeptides",
    ),
    (
        "P-GLOW-001",
        "GLOW",
        "glow blend,glow peptide",
        "a research blend built around copper-peptide and repair-pathway components",
        "combined matrix and signaling work in cosmetic-science laboratory catalogs",
        "how a multi-peptide blend is documented for controlled research use",
        "PeptideResearch",
        "CellularScience",
        "CopperPeptide",
        "ResearchPeptides",
    ),
    (
        "P-KLOW-001",
        "KLOW",
        "klow blend,klow peptide",
        "a research blend neighboring GLOW, built for matrix and tone-pathway catalogs",
        "copper-peptide plus complementary sequences in laboratory skin-science models",
        "how blend composition is described for research documentation, not results",
        "PeptideResearch",
        "CellularScience",
        "CopperPeptide",
        "ResearchPeptides",
    ),
    (
        "P-KPV-001",
        "KPV",
        "kpv peptide,lys-pro-val",
        "a short anti-inflammatory-pathway tripeptide used in barrier-research models",
        "epithelial signaling and immune-modulating cascade mapping in laboratory systems",
        "how a three-residue sequence is studied at the cell-surface level",
        "PeptideResearch",
        "CellularScience",
        "TissueRepair",
        "ResearchPeptides",
    ),
    (
        "P-MT2-001",
        "Melanotan 2",
        "mt2,melanotan2,melanotan-2,mt-2",
        "a cyclic melanocortin research peptide used in pigmentation-pathway studies",
        "MC1R/MC4R-related signaling in controlled laboratory melanocortin models",
        "how a cyclic analogue is cataloged for receptor-level research",
        "PeptideResearch",
        "CellularScience",
        "ReceptorScience",
        "ResearchPeptides",
    ),
    (
        "P-MOTS-001",
        "MOTS-C",
        "motsc,mots-c,mots c",
        "a mitochondrial-encoded research peptide used in metabolic-stress models",
        "cellular energy sensing and mitochondrial peptide signaling in laboratory work",
        "how a 16-residue mitochondrial peptide is mapped in metabolic research",
        "MitochondrialScience",
        "CellularEnergy",
        "PeptideResearch",
        "ResearchPeptides",
    ),
    (
        "P-NAD-001",
        "NAD+",
        "nad,nad plus,nadplus,nicotinamide",
        "a core redox cofactor cataloged for cellular-energy and sirtuin-pathway research",
        "electron-transfer chemistry and NAD+-dependent enzyme work in laboratory models",
        "how dinucleotide structure supports metabolic mapping at the molecular level",
        "CellularEnergy",
        "MetabolicResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-PT141-001",
        "PT-141",
        "pt141,pt 141,bremelanotide",
        "a cyclic melanocortin research peptide used in receptor-signaling studies",
        "central melanocortin pathways mapped in laboratory neuroscience models",
        "how cyclic peptide design is documented for receptor-engagement research",
        "PeptideResearch",
        "ReceptorScience",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-RETA-001",
        "Retatrutide",
        "reta,retatrutide,ly3437943",
        "a multi-agonist research peptide used in metabolic-receptor laboratory work",
        "GLP-1, GIP, and glucagon receptor signaling studied as one triple-agonist model",
        "how a large peptide analogue is cataloged for multi-receptor mapping",
        "MetabolicResearch",
        "PeptideScience",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-SEL-001",
        "Selank",
        "selank peptide",
        "a tuftsin-derived research peptide used in anxiety-axis and immune-signal models",
        "neuropeptide signaling and GABA-related laboratory pathway work",
        "how a short analogue is described for cognitive-research catalogs",
        "NeuropeptideScience",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-SEMA-001",
        "Semaglutide",
        "sema,ozempic research,semaglutide",
        "a long-acting GLP-1 receptor agonist peptide used in metabolic laboratory models",
        "incretin signaling and glucose-pathway mapping in controlled research systems",
        "how lipidated peptide design is cataloged for receptor-duration studies",
        "MetabolicResearch",
        "PeptideScience",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-SEMAX-001",
        "SEMAX",
        "semax peptide",
        "a synthetic ACTH-fragment analogue used in cognitive and neuroprotective research catalogs",
        "BDNF-related signaling and neuropeptide laboratory models",
        "how a modified fragment is documented for neural-pathway mapping",
        "NeuropeptideScience",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-SERM-001",
        "Sermorelin",
        "sermorelin acetate,ghrh 1-29",
        "a GHRH 1-29 research peptide used in growth-axis laboratory studies",
        "pituitary signaling and growth-hormone–release pathway mapping",
        "how a physiologic-length analogue is cataloged for endocrine research",
        "EndocrineLab",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-SS31-001",
        "SS-31",
        "ss31,elamipretide,ss-31",
        "a mitochondria-targeted research tetrapeptide used in bioenergetic models",
        "cardiolipin-associated mitochondrial signaling in laboratory systems",
        "how a small peptide is mapped to inner-membrane research questions",
        "MitochondrialScience",
        "CellularEnergy",
        "PeptideResearch",
        "ResearchPeptides",
    ),
    (
        "P-TA1-001",
        "TA-1",
        "ta1,thymosin alpha,thymosin a1",
        "an immune-research peptide used in T-cell signaling laboratory models",
        "thymic peptide pathways and immune-education research catalogs",
        "how a 28-residue sequence is documented for immunology studies",
        "ImmuneResearch",
        "PeptideScience",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-TB500-001",
        "TB-500",
        "tb500,tb 500,thymosin beta4,tb-500",
        "an actin-regulating research peptide used in cell-migration laboratory models",
        "cytoskeletal dynamics and tissue-architecture signaling at the molecular level",
        "how a thymosin-beta fragment is cataloged for structural-cell research",
        "TissueRepair",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-TESA-001",
        "Tesamorelin",
        "tesamorelin,tesa",
        "a stabilized GHRH analogue used in visceral-fat and endocrine laboratory research",
        "growth-axis signaling and metabolic-compartment mapping in research models",
        "how a long analogue is documented for pituitary-pathway catalogs",
        "EndocrineLab",
        "MetabolicResearch",
        "PeptideResearch",
        "ResearchPeptides",
    ),
    (
        "P-TESAIPA-001",
        "Tesamorelin/Ipamorelin",
        "tesa ipa,tesamorelin ipamorelin",
        "a stacked GHRH analogue plus ghrelin-mimetic pair for endocrine research catalogs",
        "combined growth-axis signaling studied as one laboratory complex",
        "how two complementary peptides are listed together for pathway comparison",
        "EndocrineLab",
        "PeptideResearch",
        "CellularScience",
        "ResearchPeptides",
    ),
    (
        "P-TIRZ-001",
        "Tirzepatide",
        "tirz,mounjaro research,tirzepatide",
        "a dual GIP/GLP-1 receptor agonist peptide used in metabolic laboratory models",
        "incretin dual-agonist signaling and energy-pathway mapping in research systems",
        "how a large dual-agonist analogue is cataloged for receptor-level study",
        "MetabolicResearch",
        "PeptideScience",
        "CellularScience",
        "ResearchPeptides",
    ),
]


def main() -> None:
    if len(COMPOUNDS) != 27:
        raise SystemExit(f"expected 27 compounds, got {len(COMPOUNDS)}")
    names = [c[1] for c in COMPOUNDS]
    if len(set(names)) != 27:
        raise SystemExit("duplicate compound names")

    rows = []
    for rec in COMPOUNDS:
        cid, name, aliases, what, focus, pathways, t2, t3, t4, t5 = rec
        blob = " ".join([what, focus, pathways]).lower()
        for banned in ("human use", "benefits of using", "inject", "dosage", "you will"):
            if banned in blob:
                raise SystemExit(f"banned phrase in {name}: {banned}")
        rows.append(
            {
                "compound_id": cid,
                "compound_name": name,
                "aliases": aliases,
                "science_what": what,
                "science_focus": focus,
                "science_pathways": pathways,
                "tag2": t2,
                "tag3": t3,
                "tag4": t4,
                "tag5": t5,
                "store_url": STORE,
                "status": "Active",
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {OUT.name}: {len(rows)} rows")


if __name__ == "__main__":
    main()
