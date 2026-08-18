#!/usr/bin/env python3
"""Build a NEW Sheet-9-format library for chemical-breakdown vids.

Does NOT modify 9-lab-item-creations-500.csv.
Output: marketing/sheets/13-chem-breakdown-54.csv
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sheets" / "13-chem-breakdown-54.csv"

FIELDS = [
    "creation_id",
    "rank",
    "lab_item_id",
    "category",
    "lab_item",
    "material_detail",
    "compound_name",
    "shot_family",
    "camera_angle",
    "camera_direction",
    "framing",
    "scene_brief",
    "quality_var_count",
    "quality_suffix",
    "aspect_ratio",
    "duration_seconds",
    "resolution",
    "model_still",
    "model_video",
    "still_resolution",
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "status",
    "times_used",
    "last_used_at",
    "surface",
    "lighting",
    "camera_move",
    "color_grade",
    "hero_style",
]

QUALITY = (
    "cinematic 3D medical animation of a cellular chemical reaction, photoreal, 8k, HDR, "
    "living cells plus amino acids reacting at microscopic scale, "
    "no vials, no pens, no people, no product studio, no readable text, no logos"
)

STILL_EDIT = (
    "CRITICAL VIBE FIX: This must be an IN-PROGRESS cellular chemical reaction, not a catalog product still. "
    "Replace any sunlit studio, white cyclorama, glass pedestal, spa, or floating lone molecule on a stand "
    "with a DARK microscopic living-cell scene: lipid-bilayer cell membrane, cytoplasm, amino-acid "
    "ball-and-stick monomers colliding and forming peptide bonds with energy flashes. "
    "DELETE every logo, palm tree, watermark, URL, caption, letter, number, and label. "
    "BLANK frame — no typography anywhere. No vials, no pens, no people. Do not restyle into a cartoon."
)

COMPOUNDS = [
    ("P-5A1MQ-001", "5-Amino-1MQ", "compact small-molecule with warm amber carbon spheres and cool gray heteroatoms"),
    ("P-AOD-001", "AOD-9604", "short peptide ribbon in pale gold with silver side-chain beads"),
    ("P-BPC-001", "BPC-157", "translucent pink-violet peptide ball-and-stick chain, glass-like atoms"),
    ("P-BPCTB-001", "BPC-157/TB-500", "two complementary peptide ribbons — pink and teal — fused as ONE linked complex, not two separate heroes"),
    ("P-CAGRI-001", "Cagrilinitide", "long helical peptide in soft coral with metallic backbone"),
    ("P-CJC-001", "CJC", "neat helical peptide in champagne gold"),
    ("P-CJCIPA-001", "CJC (no DAC)/Ipamorelin", "paired helices as ONE stacked complex in gold and ice-blue"),
    ("P-DSIP-001", "DSIP", "compact sleep-research peptide in dusk lavender"),
    ("P-GHK-001", "GHK-Cu", "copper-blue tripeptide complex with a single copper center glow"),
    ("P-GLOW-001", "GLOW", "bright cyan-blue peptide blend, luminous but photoreal glass atoms"),
    ("P-KLOW-001", "KLOW", "warm copper-gold peptide blend with a single copper accent"),
    ("P-KPV-001", "KPV", "short tripeptide in clean white-opal with rose-gold bonds"),
    ("P-MT2-001", "Melanotan 2", "cyclic peptide in bronze and deep rose"),
    ("P-MOTS-001", "MOTS-C", "compact mitochondrial peptide in sunlit gold"),
    ("P-NAD-001", "NAD+", "classic dinucleotide: two rings, amber-gold phosphates, photoreal"),
    ("P-PT141-001", "PT-141", "cyclic peptide in wine-rose with silver bonds"),
    ("P-RETA-001", "Retatrutide", "large multi-agonist peptide in peach and champagne"),
    ("P-SEL-001", "Selank", "short neat peptide in cool mint glass"),
    ("P-SEMA-001", "Semaglutide", "long lipidated peptide in coral with a single lipid tail"),
    ("P-SEMAX-001", "SEMAX", "short peptide in electric-sky blue glass"),
    ("P-SERM-001", "Sermorelin", "growth-research peptide helix in pale platinum"),
    ("P-SS31-001", "SS-31", "mitochondrial peptide in teal and gold"),
    ("P-TA1-001", "TA-1", "immune-research peptide ribbon in ivory and bronze"),
    ("P-TB500-001", "TB-500", "actin-research peptide in ocean teal ball-and-stick"),
    ("P-TESA-001", "Tesamorelin", "long helical peptide in champagne with soft speculars"),
    ("P-TESAIPA-001", "Tesamorelin/Ipamorelin", "two helices as ONE stacked complex, champagne plus ice-blue"),
    ("P-TIRZ-001", "Tirzepatide", "dual-agonist peptide in warm terracotta and gold"),
]

LOOKS = [
    {
        "suffix": "A",
        "category": "chem_studio",
        "lab_item": "Chemical breakdown — cellular amino-acid reaction at the cell membrane",
        "surface": "living cell lipid bilayer, wet receptors, extracellular fluid",
        "lighting": "dramatic subsurface glow from cytoplasm; reaction sparks at forming bonds",
        "color_grade": "cool microscopic medical grade, luminous amino acids vs navy cell",
        "hero_style": "cellular chemical reaction — amino acids assembling a peptide at a living cell",
        "shot_family": "push_in",
        "camera_angle": "eye-level",
        "camera_direction": "forward",
        "framing": "9:16, living cell filling lower frame, amino acids reacting mid-frame, shallow DOF",
        "camera_move": "slow push-in as amino acids dock the membrane and peptide bonds flash, then hold",
        "env": (
            "DARK cinematic 3D medical animation of a LIVE cellular chemical reaction at microscopic scale. "
            "A real biological cell dominates the lower frame: lipid-bilayer membrane, wet receptors, "
            "cytoplasm glowing faintly inside. In the extracellular fluid, many small photoreal amino-acid "
            "monomers (glossy colored ball-and-stick) swarm, collide, and chemically react — peptide bonds "
            "snap into place with brief energy flashes, wispy electron-cloud filaments, and released particles. "
            "A forming peptide chain grows at a membrane receptor. This is chemistry in a living cell, "
            "not a catalog product still. NOT a photography studio. NOT a white cyclorama. NOT a glass pedestal."
        ),
    },
    {
        "suffix": "B",
        "category": "chem_creative",
        "lab_item": "Chemical breakdown — intracellular amino-acid condensation reaction",
        "surface": "cytoplasm among organelles, ribosome-like machinery, wet protein mesh",
        "lighting": "backlit cytoplasmic bloom plus hard spec on reacting amino-acid atoms",
        "color_grade": "high-contrast intracellular biotech: luminous bonds vs deep navy cytoplasm",
        "hero_style": "intracellular chemical reaction — amino acids condensing into a peptide chain",
        "shot_family": "static_lock",
        "camera_angle": "low-angle",
        "camera_direction": "no travel / locked",
        "framing": "9:16, cytoplasm volume, amino acids condensing into a vertical peptide chain",
        "camera_move": "locked tripod, amino acids stream in and lock onto the growing chain with bond flashes",
        "env": (
            "DARK cinematic 3D medical animation INSIDE a living cell. Cytoplasm, organelle silhouettes, "
            "and a wet protein mesh fill the frame. Amino-acid monomers stream toward a growing peptide "
            "chain and condense — each new peptide bond a sharp chemical flash. Nearby a cell nucleus "
            "or mitochondrion looms in bokeh. Active reaction, not a static floating molecule. "
            "NOT a sunlit showroom. NOT a product catalog set. NOT a glass pedestal."
        ),
    },
]


def molecule_lock(name: str) -> str:
    return (
        f"HARD OUTPUT LOCK: a cellular-level CHEMICAL REACTION featuring the peptide '{name}'. "
        "Show living cells AND amino acids actually reacting (bonds forming, docking, condensation). "
        "Cinematic photoreal 3D medical animation — not cartoon, not sketch, not product photography. "
        "NO TEXT anywhere: no letters, numbers, captions, titles, compound-name overlay, labels. "
        "NO LOGO, NO palm tree, NO watermark, NO URL, NO brand mark. "
        "No vial, no pen, no syringe, no people, no packaging. "
        f"Use '{name}' only as the unseen scientific subject — never render it as readable type."
    )


def closing_lock() -> str:
    return (
        " FINAL CHECK: this is a living-cell chemical reaction with amino acids, not a studio product shot. "
        "Zero typography. Zero logos. No vials. No pens."
    )


def video_prompt(name: str, look: dict, mol: str) -> str:
    lock = molecule_lock(name)
    body = (
        f"Vertical 9:16 chemical-reaction still — DARK microscopic cellular animation. "
        f"{look['env']} "
        f"REACTION SUBJECT (visual only, never as text): {mol}. "
        "Amino acids are glossy translucent colored glass spheres with metallic bonds; "
        "the forming peptide matches that look as monomers lock together. "
        "Shallow depth of field, cinematic macro lens, tack-sharp reaction plane, dark cellular bokeh. "
        "FORBIDDEN scenery: white cyclorama, sunlit photography studio, frosted optical-glass pedestal, "
        "spa, lifestyle interior, windows, palm-frond wall shadows, product stands. "
        "FORBIDDEN overlays: any readable text, any logo, any URL, any palm watermark, any caption. "
        "No product packaging. No research-use disclaimer. No medical claims in frame."
    )
    return f"{lock} {body}{closing_lock()}"


def motion(name: str, look: dict) -> str:
    return (
        "Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. "
        f"Camera: {look['camera_move']}. "
        "Keep the same living-cell environment and lighting. "
        "Continue the chemical reaction: amino acids drift in, collide, peptide bonds form with "
        "energy flashes, the cell membrane / cytoplasm undulates. "
        "Do not cut to a studio or pedestal. No vials, people, needles. "
        "NO text appears. NO logos appear. NO captions. Completely blank of typography."
    )


def brief(name: str, look: dict, mol: str) -> str:
    return (
        f"chem reaction · {name} · {mol} · {look['env'][:160]}… "
        f"shot:{look['shot_family']} · {look['camera_angle']} · no text · no logo"
    )


# Visual stagger: family members (BPC / TB / blend) stay far apart.
STAGGER_ROUND_A = [
    "BPC-157",
    "Retatrutide",
    "GHK-Cu",
    "NAD+",
    "Semaglutide",
    "GLOW",
    "Sermorelin",
    "PT-141",
    "Tirzepatide",
    "MOTS-C",
    "Selank",
    "TB-500",
    "5-Amino-1MQ",
    "Tesamorelin",
    "KPV",
    "CJC",
    "Melanotan 2",
    "SS-31",
    "AOD-9604",
    "BPC-157/TB-500",
    "SEMAX",
    "KLOW",
    "Cagrilinitide",
    "TA-1",
    "DSIP",
    "Tesamorelin/Ipamorelin",
    "CJC (no DAC)/Ipamorelin",
]

MIN_UNIQUE_WINDOW = 5


def related_family(name: str) -> str:
    if name in ("BPC-157", "BPC-157/TB-500", "TB-500"):
        return "bpc_tb"
    if name in ("CJC", "CJC (no DAC)/Ipamorelin"):
        return "cjc"
    if name in ("Tesamorelin", "Tesamorelin/Ipamorelin"):
        return "tesa"
    if name in ("GLOW", "KLOW"):
        return "glow_klow"
    return name


def window_ok(names: list[str], window: int = MIN_UNIQUE_WINDOW) -> bool:
    for i in range(len(names)):
        chunk = names[i : i + window]
        if len(chunk) < 2:
            continue
        if len(set(chunk)) != len(chunk):
            return False
    return True


def rotate_until_ok(round_a: list[str], offset: int) -> list[str]:
    n = len(round_a)
    for extra in range(n):
        rot = (offset + extra) % n
        round_b = round_a[rot:] + round_a[:rot]
        seq = round_a + round_b
        # also check wrap from last rows back to first (if someone loops the sheet)
        wrap = seq + round_a[:MIN_UNIQUE_WINDOW]
        if window_ok(seq) and window_ok(wrap):
            return round_b
    raise SystemExit("could not stagger round B")


def make_row(rank: int, cid: str, name: str, mol: str, look: dict) -> dict:
    return {
        "creation_id": f"PBVita-Chem-{rank:03d}",
        "rank": rank,
        "lab_item_id": f"CHEM-{rank:03d}",
        "category": look["category"],
        "lab_item": look["lab_item"],
        "material_detail": mol,
        "compound_name": name,
        "shot_family": look["shot_family"],
        "camera_angle": look["camera_angle"],
        "camera_direction": look["camera_direction"],
        "framing": look["framing"],
        "scene_brief": brief(name, look, mol),
        "quality_var_count": 8,
        "quality_suffix": QUALITY,
        "aspect_ratio": "9:16",
        "duration_seconds": 15,
        "resolution": "1080p",
        "model_still": "grok-imagine-image-2.0",
        "model_video": "grok-imagine-video-1.5",
        "still_resolution": "2k",
        "video_prompt": video_prompt(name, look, mol),
        "video_motion_prompt": motion(name, look),
        "still_edit_prompt": STILL_EDIT,
        "status": "Active",
        "times_used": 0,
        "last_used_at": "",
        "surface": look["surface"],
        "lighting": look["lighting"],
        "camera_move": look["camera_move"],
        "color_grade": look["color_grade"],
        "hero_style": look["hero_style"],
    }


def main() -> None:
    by_name = {name: (cid, mol) for cid, name, mol in COMPOUNDS}
    missing = [n for n in STAGGER_ROUND_A if n not in by_name]
    extra = [n for n in by_name if n not in STAGGER_ROUND_A]
    if missing or extra:
        raise SystemExit(f"stagger mismatch missing={missing} extra={extra}")
    if len(set(STAGGER_ROUND_A)) != 27:
        raise SystemExit("STAGGER_ROUND_A must be 27 unique compounds")
    if not window_ok(STAGGER_ROUND_A):
        raise SystemExit("round A window failed")

    round_b = rotate_until_ok(STAGGER_ROUND_A, offset=13)
    sequence = [(n, LOOKS[0]) for n in STAGGER_ROUND_A] + [(n, LOOKS[1]) for n in round_b]

    rows = []
    for rank, (name, look) in enumerate(sequence, start=1):
        cid, mol = by_name[name]
        rows.append(make_row(rank, cid, name, mol, look))

    names = [r["compound_name"] for r in rows]
    if not window_ok(names):
        raise SystemExit("final sequence window failed")

    for r in rows:
        vp = r["video_prompt"].lower()
        mp = r["video_motion_prompt"].lower()
        if "chemical reaction" not in vp and "amino acid" not in vp:
            raise SystemExit(f"missing cellular reaction vibe {r['creation_id']}")
        if "living cell" not in vp and "cytoplasm" not in vp and "lipid" not in vp:
            raise SystemExit(f"missing living-cell scenery {r['creation_id']}")
        if "no text" not in vp:
            raise SystemExit(f"missing no-text lock {r['creation_id']}")
        if "no logo" not in vp and "no palm" not in vp:
            raise SystemExit(f"missing no-logo lock {r['creation_id']}")
        if "silent" not in mp:
            raise SystemExit(f"missing silent lock {r['creation_id']}")
        if "bottom-center" in vp or "sans-serif" in vp:
            raise SystemExit(f"overlay text still requested {r['creation_id']}")
        if len(r["video_prompt"]) > 7900:
            raise SystemExit(f"prompt too long {r['creation_id']} {len(r['video_prompt'])}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    lens = [len(r["video_prompt"]) for r in rows]
    print(f"wrote {OUT.name}: {len(rows)} rows")
    print(f"video_prompt chars min={min(lens)} max={max(lens)}")
    print("rank sequence:")
    for r in rows:
        print(f"  {r['rank']:02d}  {r['category']:<14}  {r['compound_name']}")
    print("round B offset compounds:", ", ".join(round_b[:5]), "...")


if __name__ == "__main__":
    main()
