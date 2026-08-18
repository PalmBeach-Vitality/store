#!/usr/bin/env python3
"""Build a NEW Sheet-9-format library for pens-only vids.

Does NOT modify 9-lab-item-creations-500.csv or 13-chem-breakdown-54.csv.
Output: marketing/sheets/14-pen-creations-54.csv

Pen look is the 3-image-scenes-150 product_hero / product_form_detail schema
as specified in the lab-item banks (CSV data rows were empty):
  product_hero        = pre-filled catalog research pen
  product_form_detail = clear barrel window, dial collar, capped tip cover on
Hard rules: exactly ONE pen, cap ON, no vial, no second pen, never filling.
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sheets" / "14-pen-creations-54.csv"

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

# 3-image-scenes-150 product_form_detail (research_pens bank)
FORM_DETAIL = "clear barrel window, dial collar, capped tip cover on"

QUALITY = (
    "photoreal, physically based, razor sharp focus, 8k, HDR, "
    "exactly one capped research pen, product count equals 1, no second pen, "
    "no vials, no syringes, no needles, no people"
)

STILL_EDIT = (
    "CRITICAL: Keep exactly ONE sealed Palm Beach Vitality research pen, cap ON. "
    "DELETE any extra pens, duplicate pens in reflections, vials, syringes, needles, "
    "scales, trays, or loose caps. Keep lighting, camera, and environment. "
    "Do not restyle the pen. Count = 1. Cap stays on."
)

# Same 27 catalog compounds as Sheet 13 / compound-labels.json
COMPOUNDS = [
    ("P-5A1MQ-001", "5-Amino-1MQ"),
    ("P-AOD-001", "AOD-9604"),
    ("P-BPC-001", "BPC-157"),
    ("P-BPCTB-001", "BPC-157/TB-500"),
    ("P-CAGRI-001", "Cagrilinitide"),
    ("P-CJC-001", "CJC"),
    ("P-CJCIPA-001", "CJC (no DAC)/Ipamorelin"),
    ("P-DSIP-001", "DSIP"),
    ("P-GHK-001", "GHK-Cu"),
    ("P-GLOW-001", "GLOW"),
    ("P-KLOW-001", "KLOW"),
    ("P-KPV-001", "KPV"),
    ("P-MT2-001", "Melanotan 2"),
    ("P-MOTS-001", "MOTS-C"),
    ("P-NAD-001", "NAD+"),
    ("P-PT141-001", "PT-141"),
    ("P-RETA-001", "Retatrutide"),
    ("P-SEL-001", "Selank"),
    ("P-SEMA-001", "Semaglutide"),
    ("P-SEMAX-001", "SEMAX"),
    ("P-SERM-001", "Sermorelin"),
    ("P-SS31-001", "SS-31"),
    ("P-TA1-001", "TA-1"),
    ("P-TB500-001", "TB-500"),
    ("P-TESA-001", "Tesamorelin"),
    ("P-TESAIPA-001", "Tesamorelin/Ipamorelin"),
    ("P-TIRZ-001", "Tirzepatide"),
]

LOOKS = [
    {
        "suffix": "A",
        "category": "pen_studio",
        "lab_item": "Catalog research pen — matte acrylic studio hero",
        "surface": "matte black acrylic pedestal",
        "lighting": "soft high-key catalog key plus cool rim on barrel window",
        "color_grade": "clean editorial, true plastics and glass, gentle contrast",
        "hero_style": "pre-filled research pen, cap on, catalog still-life",
        "shot_family": "push_in",
        "camera_angle": "eye-level",
        "camera_direction": "forward",
        "framing": "9:16, pen centered mid-frame, generous negative space",
        "camera_move": "slow straight push-in toward the capped pen, then hold",
        "env": (
            "A bright sunlit glass photography studio with a white cyclorama and one "
            "matte black acrylic pedestal. Coastal daylight through tall windows. "
            "Palm-frond shadow may fall on the cyc once. Air is clear. Product photography, "
            "not a medical procedure. No people, no hands, no injection staging."
        ),
    },
    {
        "suffix": "B",
        "category": "pen_creative",
        "lab_item": "Catalog research pen — Palm Beach showroom hero",
        "surface": "frosted optical glass over honed pale stone",
        "lighting": "golden coastal window plus cool bounce; cinematic but airy",
        "color_grade": "warm coastal grade, honest speculars on barrel glass",
        "hero_style": "pre-filled research pen, cap on, designed environment",
        "shot_family": "static_lock",
        "camera_angle": "low-angle",
        "camera_direction": "no travel / locked",
        "framing": "9:16, low heroic angle, pen large in the lower third to mid-frame",
        "camera_move": "locked tripod, pen may catch a slow specular slide, then hold",
        "env": (
            "A designed Palm Beach research-showroom: pale stone, one prism catching a "
            "rainbow caustic, distant out-of-focus glass architecture. The single capped "
            "research pen stands on frosted optical glass. Creative and premium — still "
            "photoreal catalog. Not a clinic, not a body, not a needle."
        ),
    },
]


def liquid_line(name: str) -> str:
    if name.upper() == "GLOW":
        return (
            "The clear barrel window shows a settled clear bright blue liquid fill "
            "already inside at a stable level (GLOW only — blue liquid). "
        )
    return (
        "The clear barrel window shows a settled crystal-clear colorless liquid fill "
        "already inside at a stable level. "
    )


def pen_lock(name: str) -> str:
    return (
        f"HARD OUTPUT LOCK: exactly ONE sealed Palm Beach Vitality research pen labeled '{name}'. "
        "Hero count = 1. Cap ON covering the tip — never removed, never sitting beside the pen, "
        "never showing a needle. No second pen, no background pen, no carousel, no pen tray, "
        "no vial, no syringe, no people. Photoreal product photography (not cartoon). "
        f"If any text appears, print '{name}' once only in clean white sans-serif near the bottom. "
        "A small circular palm-tree mark may appear once in the top-right. No other text. "
        "No research-use disclaimer in frame."
    )


def closing_lock() -> str:
    return (
        " FINAL CHECK: count every pen and vial. Total product containers must be 1 — "
        "the single capped research pen. If 2+, remove extras. No vials. COUNT = 1. Cap on."
    )


def hero_body(name: str) -> str:
    return (
        "HERO (product_hero from 3-image-scenes-150): a single pre-filled Palm Beach Vitality "
        "research pen standing upright on the pedestal, cap on. "
        f"FORM (product_form_detail): {FORM_DETAIL}. "
        "Matte-and-gloss premium body, crisp plastic-metal edges, visible dial collar, "
        "tack-sharp barrel-graphics zone, soft reflection beneath. "
        "Clean white wrap-around barrel label with a dark maroon DNA double-helix logo, "
        f"the exact compound name '{name}' in large bold dark maroon type, and a solid dark maroon "
        "dosage bar with white mg strength. "
        f"{liquid_line(name)}"
        "FORBIDDEN: pouring, filling, rising liquid, empty barrel, loose cap, needle, "
        "second pen, any vial, scale, tray, skin, hands."
    )


def video_prompt(name: str, look: dict) -> str:
    lock = pen_lock(name)
    body = (
        f"Photoreal vertical 9:16 Palm Beach Vitality catalog still. "
        f"{look['env']} "
        f"{hero_body(name)} "
        "Shallow depth of field, cinematic macro lens, tack-sharp pen, soft background. "
        "No captions or watermarks besides the optional single palm mark. No medical claims in frame."
    )
    return f"{lock} {body}{closing_lock()}"


def motion(name: str, look: dict) -> str:
    glow = (
        "Keep the bright blue liquid level frozen in the barrel window. "
        if name.upper() == "GLOW"
        else "Keep the clear liquid level frozen in the barrel window. "
    )
    return (
        f"Slow cinematic camera: {look['camera_move']}. "
        f"Keep the exact same single capped '{name}' research pen, materials, and lighting. "
        "Cap stays ON. No new objects. No second pen. No vial, people, needles, burn-in, or extra text. "
        f"{glow}"
        "Liquid does not change level — pre-filled and static. "
        f"Keep label '{name}' unchanged if visible, once only."
    )


def brief(name: str, look: dict) -> str:
    liquid = "bright-blue fill" if name.upper() == "GLOW" else "clear fill"
    return (
        f"pen catalog · {name} · pre-filled research pen · {FORM_DETAIL} · {liquid} · "
        f"{look['env'][:140]}… shot:{look['shot_family']} · {look['camera_angle']} · cap ON"
    )


def material_detail(name: str) -> str:
    liquid = "bright blue liquid (GLOW)" if name.upper() == "GLOW" else "crystal-clear colorless liquid"
    return (
        f"pre-filled research pen; {FORM_DETAIL}; {liquid}; "
        "white maroon-DNA barrel label; one pen only"
    )


# Visual stagger: family members stay far apart (same order as Sheet 13).
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
        wrap = seq + round_a[:MIN_UNIQUE_WINDOW]
        if window_ok(seq) and window_ok(wrap):
            return round_b
    raise SystemExit("could not stagger round B")


def make_row(rank: int, name: str, look: dict) -> dict:
    return {
        "creation_id": f"PBVita-Pen-{rank:03d}",
        "rank": rank,
        "lab_item_id": f"PEN-{rank:03d}",
        "category": look["category"],
        "lab_item": look["lab_item"],
        "material_detail": material_detail(name),
        "compound_name": name,
        "shot_family": look["shot_family"],
        "camera_angle": look["camera_angle"],
        "camera_direction": look["camera_direction"],
        "framing": look["framing"],
        "scene_brief": brief(name, look),
        "quality_var_count": 8,
        "quality_suffix": QUALITY,
        "aspect_ratio": "9:16",
        "duration_seconds": 15,
        "resolution": "1080p",
        "model_still": "grok-imagine-image-2.0",
        "model_video": "grok-imagine-video-1.5",
        "still_resolution": "2k",
        "video_prompt": video_prompt(name, look),
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
    by_name = {name: cid for cid, name in COMPOUNDS}
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
        rows.append(make_row(rank, name, look))

    names = [r["compound_name"] for r in rows]
    if not window_ok(names):
        raise SystemExit("final sequence window failed")

    for r in rows:
        if "vial" in r["video_prompt"].lower() and "No vial" not in r["video_prompt"] and "no vial" not in r["video_prompt"]:
            raise SystemExit(f"unexpected vial language in {r['creation_id']}")
        if "cap ON" not in r["video_prompt"] and "Cap ON" not in r["video_prompt"]:
            raise SystemExit(f"missing cap ON in {r['creation_id']}")
        if r["compound_name"] == "GLOW" and "bright blue liquid" not in r["video_prompt"]:
            raise SystemExit("GLOW missing blue liquid")
        if r["compound_name"] != "GLOW" and "bright blue liquid" in r["video_prompt"]:
            raise SystemExit(f"non-GLOW has blue liquid: {r['compound_name']}")
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
