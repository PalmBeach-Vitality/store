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
    "photoreal, physically based 3D, razor sharp focus, 8k, HDR, "
    "exactly one molecular hero, product count equals 1, no second molecule, "
    "no vials, no pens, no people"
)

STILL_EDIT = (
    "CRITICAL: Keep exactly ONE 3D molecular model as the hero. "
    "DELETE any extra molecules, duplicate peptide chains, vials, pens, syringes, "
    "or product bottles. Keep lighting, camera, and environment. "
    "Do not restyle the molecule into a cartoon. Count = 1."
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
        "lab_item": "Chemical breakdown — sunlit glass studio molecule hero",
        "surface": "frosted optical glass pedestal over white cyclorama",
        "lighting": "soft high-key studio key plus warm rim; not a dark wet interior",
        "color_grade": "clean editorial, true materials, gentle contrast",
        "hero_style": "photoreal 3D molecule as luxury catalog hero",
        "shot_family": "push_in",
        "camera_angle": "eye-level",
        "camera_direction": "forward",
        "framing": "9:16, molecule centered mid-frame, generous negative space",
        "camera_move": "slow straight push-in toward the molecule, then hold",
        "env": (
            "A bright sunlit glass photography studio with a white cyclorama, "
            "one frosted optical-glass pedestal, and a single 3D molecular model as the only hero. "
            "Coastal daylight through tall windows. Palm-frond shadow may fall on the cyc once. "
            "Air is clear — no dark body-fluid, no wet pores, no medical interior."
        ),
    },
    {
        "suffix": "B",
        "category": "chem_creative",
        "lab_item": "Chemical breakdown — creative photoreal environment molecule hero",
        "surface": "honed pale stone with a shallow water sheen (not submerged)",
        "lighting": "golden coastal window plus cool bounce; cinematic but airy",
        "color_grade": "warm coastal grade, honest speculars on glass atoms",
        "hero_style": "photoreal 3D molecule in a designed environment",
        "shot_family": "static_lock",
        "camera_angle": "low-angle",
        "camera_direction": "no travel / locked",
        "framing": "9:16, low heroic angle, molecule large in the lower third to mid-frame",
        "camera_move": "locked tripod, molecule may slowly yaw a few degrees, then hold",
        "env": (
            "A designed Palm Beach research-showroom environment: pale stone, one prism catching "
            "a rainbow caustic, distant out-of-focus glass architecture. The single molecular model "
            "hovers just above the surface. Creative and premium — still photoreal. "
            "Not a dark wet microscopy cavity, not a horror cell interior."
        ),
    },
]


def molecule_lock(name: str) -> str:
    return (
        f"HARD OUTPUT LOCK: exactly ONE 3D molecular model of '{name}' as the hero. "
        "Hero count = 1. No second molecule, no background molecule, no vial, no pen, "
        "no syringe, no people. Photoreal physically-based 3D (not cartoon, not sketch). "
        f"If any text appears, print '{name}' once only in clean white sans-serif near the bottom. "
        "A small circular palm-tree mark may appear once in the top-right. No other text."
    )


def closing_lock() -> str:
    return (
        " FINAL CHECK: count molecular heroes. Total must be 1. "
        "If 2+, remove extras. No vials. COUNT = 1."
    )


def video_prompt(name: str, look: dict, mol: str) -> str:
    lock = molecule_lock(name)
    body = (
        f"Photoreal vertical 9:16 Palm Beach Vitality chemical-breakdown still. "
        f"{look['env']} "
        f"HERO: {mol}. Atoms feel like glass and metal with correct weight and refraction. "
        "Shallow depth of field, cinematic macro lens, tack-sharp molecule, soft background. "
        "No product packaging. No research-use disclaimer text. No captions, watermarks besides "
        "the optional single palm mark. No medical claims in frame."
    )
    return f"{lock} {body}{closing_lock()}"


def motion(name: str, look: dict) -> str:
    return (
        f"Slow cinematic camera: {look['camera_move']}. "
        f"Keep the exact same photoreal 3D '{name}' molecule, materials, and lighting. "
        "The molecule may rotate a few degrees on its axis. No new objects. "
        "No second molecule. No vials, people, needles, burn-in, or extra text. "
        f"Keep label '{name}' unchanged if visible, once only."
    )


def brief(name: str, look: dict, mol: str) -> str:
    return (
        f"chem breakdown · {name} · {mol} · {look['env'][:160]}… "
        f"shot:{look['shot_family']} · {look['camera_angle']} · label:{name}"
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
