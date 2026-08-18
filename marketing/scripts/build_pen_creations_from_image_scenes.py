#!/usr/bin/env python3
"""Pens-only vidgen library.

Sources (do NOT clone Sheet 13 / molecules):
  - Columns: exact header of 9-lab-item-creations-500.csv
  - Pen input parameters: 3-image-scenes-150 fields
      scene_category, scene_name, lab_environment, camera, lighting,
      product_hero, product_form_detail, compound_id, compound_name,
      canonical_url, scene_brief

Uses the 3-image-scenes-150 *field names* as pen input parameters
(product_hero, product_form_detail, lab_environment, camera, lighting).
Does NOT write or modify 3-image-scenes-150.csv (Buffer sheet — leave it).

Does NOT modify 9-lab-item-creations-500.csv or 13-chem-breakdown-54.csv.
"""

from __future__ import annotations

import csv
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV9 = SHEETS / "9-lab-item-creations-500.csv"
CSV3 = SHEETS / "3-image-scenes-150.csv"
CSV14 = SHEETS / "14-pen-creations-150.csv"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from camera_recipes import build_unique_camera_sequence  # noqa: E402
from rebuild_scene_library_500 import (  # noqa: E402
    ACTIONS,
    BEATS,
    COLOR_GRADES,
    HERO_STYLES,
    LIGHTINGS,
    OPENERS,
    SETTINGS,
    SURFACES,
    THEMES,
    TWISTS,
)

SCENE3_FIELDS = [
    "scene_id",
    "scene_category",
    "scene_name",
    "lab_environment",
    "camera",
    "lighting",
    "product_hero",
    "product_form_detail",
    "compound_id",
    "compound_name",
    "canonical_url",
    "scene_brief",
    "caption_lock",
    "status",
    "rotation_order",
    "last_used_date",
]

# Sheet 9 quality line, pens-only (no vial-or-pen dual language)
QUALITY = (
    "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
    "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR, "
    "exactly one white matte insulin-style 3ml research pen, product count equals 1, no second pen, no vial, "
    "no product pair, no duplicate products, one container only, cap on, orange ridged dial"
)

STILL_EDIT = (
    "CRITICAL PRODUCT FIX: Replace any silver/metal/glass-vial-like object or chrome claw stand "
    "with exactly ONE white matte plastic insulin-style 3ml injectable pen. Make the barrel 10-20% longer "
    "(full-length elongated injector, not stubby/compact). Cap ON with white "
    "pocket clip. Small rectangular barrel window only (not a tall glass chamber). Bright orange "
    "ridged dose-dial on the end opposite the cap. Label: bright BLUE DNA helix + orange compound "
    "name + orange badge '3ml pen' only. DELETE burgundy vial branding, palm trees, milligram dosage, extra pens, "
    "vials, needles, syringes, scales, trays. After the edit: count exactly 1 white pen, zero vials. Cap on."
)

CAPTION_LOCK = (
    "For laboratory research use only. Not for human use or consumption. "
    "Not a drug, dietary supplement, or cosmetic. Not evaluated by the FDA. "
    "Captions only — never burn this into the image or Grok prompt."
)

# Same physical pen in every row. Only pose / surface change.
# Hardware: white insulin-style injector (not a glass vial, not brushed silver).
PEN_HARDWARE = (
    "white matte plastic insulin-style 3ml injectable pen; body 10-20% longer than a stubby travel pen "
    "(elongated barrel, adult full-length injector, not compact/short); white cap with white pocket clip ON "
    "covering the tip; small rectangular transparent barrel window beside the label "
    "(a glimpse of liquid/mechanism only — NOT a tall glass reservoir, NOT most of the body as glass); "
    "bright orange ridged dose-dial / injection button on the end opposite the cap"
)

PEN_FORMS: list[tuple[str, str]] = [
    (
        "white matte insulin-style 3ml research pen lying horizontally on a light reflective surface",
        PEN_HARDWARE + "; catalog product still, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen three-quarter catalog view",
        PEN_HARDWARE + "; soft reflection, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen on mirrored chrome plate",
        PEN_HARDWARE + "; hard specular highlights, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen barrel-window close-up",
        PEN_HARDWARE + "; small window readable, shallow depth, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen on matte white seamless paper",
        PEN_HARDWARE + "; plain white backdrop, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen edge-lit silhouette",
        PEN_HARDWARE + "; rim light outlining the white body and orange dial, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen low-angle hero",
        PEN_HARDWARE + "; premium catalog angle, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen on frosted glass platform",
        PEN_HARDWARE + "; soft reflection beneath, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen label-facing catalog",
        PEN_HARDWARE + "; label fully readable, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen slight diagonal on acrylic",
        PEN_HARDWARE + "; one pen only, no stand claw, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen on dark matte acrylic",
        PEN_HARDWARE + "; white body contrast, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen orange-dial macro",
        PEN_HARDWARE + "; orange ridged dial in frame, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen clip-and-cap detail",
        PEN_HARDWARE + "; white pocket clip visible, cap on",
    ),
    (
        "white matte insulin-style 3ml research pen on linen lab wipe",
        PEN_HARDWARE + "; product only, cap on",
    ),
    (
        "single white matte insulin-style 3ml Palm Beach Vitality research pen",
        PEN_HARDWARE + "; no chrome claw stand, no vial, cap on",
    ),
]

COMPOUNDS = [
    ("P-5A1MQ-001", "5-Amino-1MQ", "5-amino-1mq"),
    ("P-AOD-001", "AOD-9604", "aod-9604"),
    ("P-BPC-001", "BPC-157", "bpc-157"),
    ("P-BPCTB-001", "BPC-157/TB-500", "wolverine"),
    ("P-CAGRI-001", "Cagrilinitide", "cagrilinitide"),
    ("P-CJC-001", "CJC", "cjc-1295"),
    ("P-CJCIPA-001", "CJC (no DAC)/Ipamorelin", "cjc-1295"),
    ("P-DSIP-001", "DSIP", "dsip"),
    ("P-GHK-001", "GHK-Cu", "ghk-cu"),
    ("P-GLOW-001", "GLOW", "glow"),
    ("P-KLOW-001", "KLOW", "klow"),
    ("P-KPV-001", "KPV", "kpv"),
    ("P-MT2-001", "Melanotan 2", "melanotan-2"),
    ("P-MOTS-001", "MOTS-C", "mots-c"),
    ("P-NAD-001", "NAD+", "nad"),
    ("P-PT141-001", "PT-141", "pt-141"),
    ("P-RETA-001", "Retatrutide", "retatrutide"),
    ("P-SEL-001", "Selank", "selank"),
    ("P-SEMA-001", "Semaglutide", "semaglutide"),
    ("P-SEMAX-001", "SEMAX", "semax"),
    ("P-SERM-001", "Sermorelin", "sermorelin"),
    ("P-SS31-001", "SS-31", "ss-31"),
    ("P-TA1-001", "TA-1", "ta-1"),
    ("P-TB500-001", "TB-500", "tb-500"),
    ("P-TESA-001", "Tesamorelin", "tesamorelin"),
    ("P-TESAIPA-001", "Tesamorelin/Ipamorelin", "tesamorelin"),
    ("P-TIRZ-001", "Tirzepatide", "tirzepatide"),
]

# Same visual stagger as catalog rotation — not a molecule-sheet clone.
STAGGER = [
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

N_SCENES = 150
PROMPT_MAX = 7900


def sheet9_fields() -> list[str]:
    with CSV9.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f).fieldnames or [])


def pick(seq: list, i: int, salt: int = 0):
    h = int(hashlib.sha1(f"{i}|{salt}|{len(seq)}".encode()).hexdigest(), 16)
    return seq[h % len(seq)]


def liquid_detail(name: str, form: str) -> str:
    if name.upper() == "GLOW":
        extra = (
            "barrel window shows settled clear bright blue liquid already inside at a stable level "
            "(GLOW only — blue liquid); never filling"
        )
    else:
        extra = (
            "barrel window shows settled crystal-clear colorless liquid already inside at a stable level; "
            "never filling"
        )
    if extra.split(";")[0] in form:
        return form
    return f"{form}; {extra}"


def pen_lock(name: str) -> str:
    return (
        f"HARD OUTPUT LOCK (READ FIRST): Render exactly 1 white matte plastic insulin-style "
        f"Palm Beach Vitality 3ml injectable pen labeled '{name}'. Barrel is 10-20% longer than a short "
        f"travel pen — full-length elongated white injector, not stubby or compact. This is a medical injection pen, "
        f"NOT a glass vial, NOT brushed-silver metal, NOT a perfume cartridge, NOT a chrome claw stand. "
        f"Product count = 1. White cap ON with white pocket clip covering the tip — never removed, "
        f"never sitting beside the pen, never showing a needle. Bright orange ridged dose-dial on "
        f"the opposite end. No second pen. No vial. No syringe. No people."
    )


def closing_lock() -> str:
    return (
        " HARD OUTPUT LOCK (FINAL CHECK): Count every pen and vial. Total product containers must be "
        "exactly 1 — the single capped research pen. If 2+, remove extras. No vials. COUNT = 1. Cap on."
    )


def brand_label(name: str) -> str:
    return (
        "LABEL (MANDATORY, printed ONCE): clean white wrap-around barrel label in landscape along the pen. "
        "Far left: stylized bright BLUE DNA double-helix icon (not burgundy vial branding). "
        f"Next: exact compound name '{name}' in large bold ORANGE sans-serif (Helvetica/Arial), left-aligned. "
        "To the right of the name: a solid ORANGE rounded-rectangle badge with white text exactly '3ml pen'. "
        f"The only readable words on the entire pen are '{name}' and '3ml pen'. "
        "FORBIDDEN on the label and anywhere in frame: milligram dosage, milligram-per-milliliter, "
        "milligram-per-vial, concentration numbers, burgundy vial branding, palm tree, research-use disclaimer, "
        "subcutaneous, extra class names, any other words."
    )


def compound_cycle() -> list[tuple[str, str, str]]:
    by_name = {n: (cid, n, slug) for cid, n, slug in COMPOUNDS}
    missing = [n for n in STAGGER if n not in by_name]
    if missing:
        raise SystemExit(f"stagger missing {missing}")
    seq = []
    while len(seq) < N_SCENES:
        seq.extend(STAGGER)
    names = seq[:N_SCENES]
    for i in range(len(names) - 4):
        chunk = names[i : i + 5]
        if len(set(chunk)) != 5:
            raise SystemExit(f"stagger window failed at {i}: {chunk}")
    return [by_name[n] for n in names]


def build_scene_rows(cams: list[dict]) -> list[dict]:
    compounds = compound_cycle()
    rows = []
    for i, ((cid, name, slug), shot) in enumerate(zip(compounds, cams)):
        theme_key, theme_title = THEMES[(i * 7) % len(THEMES)]
        env = pick(SETTINGS, i, 1)
        hero, form = pick(PEN_FORMS, i, 2)
        form = liquid_detail(name, form)
        lighting = pick(LIGHTINGS, i, 3)
        surface = pick(SURFACES, i, 4)
        mood_twist = pick(TWISTS, i, 5).replace("vial", "pen").replace("Vial", "Pen")
        opener = OPENERS[i % len(OPENERS)]
        beat = BEATS[i % len(BEATS)]
        action = pick(ACTIONS, i, 6)
        scene_name = f"{theme_title.split('&')[0].strip()} · capped pen"
        camera_txt = (
            f"{shot['shot_family']}, {shot['camera_angle']}, {shot['camera_direction']}: "
            f"{shot['camera_move']}"
        )
        brief = (
            f"{theme_key.replace('_', ' ')} · {hero} · {form} · {env[:80]} · "
            f"{lighting} · shot:{shot['shot_family']} · cap ON · label:{name}"
        )
        rows.append(
            {
                "scene_id": f"SCN-{i + 1:03d}",
                "scene_category": theme_key,
                "scene_name": scene_name,
                "lab_environment": f"{opener} {theme_title}. Inside {env}. {mood_twist} {beat.capitalize()}. {action}",
                "camera": camera_txt,
                "lighting": lighting,
                "product_hero": hero,
                "product_form_detail": form,
                "compound_id": cid,
                "compound_name": name,
                "canonical_url": f"https://www.palmbeach-vitality.store/products/#{slug}",
                "scene_brief": brief,
                "caption_lock": CAPTION_LOCK,
                "status": "Active",
                "rotation_order": i + 1,
                "last_used_date": "",
                # carried for Sheet 9 mapping only (not written to CSV 3)
                "_shot": shot,
                "_surface": surface,
                "_color_grade": pick(COLOR_GRADES, i, 7),
                "_hero_style": pick(HERO_STYLES, i, 8),
                "_theme_title": theme_title,
            }
        )
    return rows


def lab_item_paragraph(scene: dict) -> str:
    name = scene["compound_name"]
    return (
        f"{pen_lock(name)} "
        f"{scene['lab_environment']} "
        f"PRODUCT HERO (from 3-image-scenes-150 product_hero): {scene['product_hero']}. "
        f"FORM (from 3-image-scenes-150 product_form_detail): {scene['product_form_detail']}. "
        f"{brand_label(name)} "
        f"Lighting: {scene['lighting']}. "
        "Empty of people; no clinical procedure staging; no needles. "
        "No research-use disclaimer, captions, watermarks, palm tree, or burn-in text in frame "
        f"except '{name}' and '3ml pen' on the pen label once."
        f"{closing_lock()}"
    )


def material_detail(scene: dict) -> str:
    return (
        f"3-image-scenes product_hero — {scene['product_hero']}; "
        f"product_form_detail — {scene['product_form_detail']}; "
        f"lab_environment — {scene['lab_environment'][:180]}; "
        f"surface {scene['_surface']}; lighting {scene['lighting']}. "
        "One capped pen only. No vial."
    )


def video_prompt(scene: dict, lab_item: str, material: str) -> str:
    name = scene["compound_name"]
    shot = scene["_shot"]
    body = (
        f"{pen_lock(name)} "
        "Photoreal vertical 9:16 Palm Beach Vitality cinematic research still. "
        "Create an exciting laboratory / peptide R&D / health-and-wellness industry environment "
        "that contains exactly ONE capped research pen (never a vial, never two pens). "
        f"FULL SCENE BRIEF: {lab_item} "
        f"Supporting notes: {material} "
        f"SHOT FAMILY: {shot['shot_family']}. "
        f"CAMERA ANGLE: {shot['camera_angle']}. "
        f"CAMERA DIRECTION: {shot['camera_direction']}. "
        f"FRAMING: {shot['framing']}. "
        f"Hero style: {scene['_hero_style']}. "
        f"Setting surface: {scene['_surface']}. Lighting: {scene['lighting']}. "
        f"Intended follow-on camera move: {shot['camera_move']}. "
        f"Energy: {shot.get('energy', 'cinematic')}. "
        f"Color grade: {scene['_color_grade']}. "
        f"{brand_label(name)} "
        "Avoid: people, hands, faces, skin, needles, syringes, injection, medical procedures, "
        "vials, second pens, silver vial-pens, chrome claw stands, scales, trays, watermarks, "
        "lower-thirds, scene titles, burn-in text. "
        "Do NOT render prompt metadata as visible text. "
        f"Quality: {QUALITY}. "
        "No treatment, cure, dosage-for-humans, or clinical outcome claims as readable text. "
        "Do not print research-use disclaimers, legal footnotes, or caption bars in the frame."
        f"{closing_lock()}"
    )
    body = " ".join(body.split())
    if len(body) > PROMPT_MAX:
        body = body[:PROMPT_MAX]
    return body


def motion_prompt(scene: dict) -> str:
    name = scene["compound_name"]
    shot = scene["_shot"]
    glow = (
        "Keep the bright blue liquid level frozen in the barrel window. "
        if name.upper() == "GLOW"
        else "Keep the clear liquid level frozen in the barrel window. "
    )
    move = shot["camera_move"].replace("—", "-").replace("–", "-")
    return (
        f"Slow cinematic camera: {move}. "
        f"Shot {shot['shot_family']}, angle {shot['camera_angle']}, "
        f"direction {shot['camera_direction']}. "
        f"Keep the exact same single white insulin-style '{name}' 3ml pen (same 10-20% longer full-length barrel), orange dial, "
        "blue DNA icon, materials, and lighting. "
        "Cap stays ON. No orbit. No new objects. No second pen. No vial, people, needles, "
        "watermarks, burn-in, or on-screen disclaimers. "
        f"{glow}"
        "Liquid does not change level — pre-filled and static. "
        f"Keep label words '{name}' and '3ml pen' unchanged, once only. No milligram dosage text."
    )


def map_to_sheet9(scene: dict, fields: list[str]) -> dict:
    lab_item = lab_item_paragraph(scene)
    material = material_detail(scene)
    shot = scene["_shot"]
    rank = int(scene["rotation_order"])
    row = {k: "" for k in fields}
    row.update(
        {
            "creation_id": f"PBVita-Pen-{rank:03d}",
            "rank": rank,
            "lab_item_id": scene["scene_id"],
            "category": scene["scene_category"],
            "lab_item": lab_item,
            "material_detail": material,
            "compound_name": scene["compound_name"],
            "shot_family": shot["shot_family"],
            "camera_angle": shot["camera_angle"],
            "camera_direction": shot["camera_direction"],
            "framing": shot["framing"],
            "scene_brief": scene["scene_brief"],
            "quality_var_count": 12,
            "quality_suffix": QUALITY,
            "aspect_ratio": "9:16",
            "duration_seconds": 15,
            "resolution": "1080p",
            "model_still": "grok-imagine-image-2.0",
            "model_video": "grok-imagine-video-1.5",
            "still_resolution": "2k",
            "video_prompt": video_prompt(scene, lab_item, material),
            "video_motion_prompt": motion_prompt(scene),
            "still_edit_prompt": STILL_EDIT,
            "status": "Active",
            "times_used": 0,
            "last_used_at": "",
            "surface": scene["_surface"],
            "lighting": scene["lighting"],
            "camera_move": shot["camera_move"],
            "color_grade": scene["_color_grade"],
            "hero_style": scene["_hero_style"],
        }
    )
    return row


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n", extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def main() -> None:
    fields9 = sheet9_fields()
    if "creation_id" not in fields9 or "video_prompt" not in fields9:
        raise SystemExit("could not read Sheet 9 columns from 9-lab-item-creations-500.csv")
    with CSV3.open(newline="", encoding="utf-8") as f:
        header3 = list(csv.DictReader(f).fieldnames or [])
    if header3 != SCENE3_FIELDS:
        raise SystemExit(
            "3-image-scenes-150 header changed — do not overwrite that file; update SCENE3_FIELDS if intended"
        )
    # Never write CSV3. Buffer sheet stays as-is.

    cams = build_unique_camera_sequence(N_SCENES)
    scenes = build_scene_rows(cams)
    creations = [map_to_sheet9(s, fields9) for s in scenes]

    for r in creations:
        vp = r["video_prompt"].lower()
        if "cap on" not in vp:
            raise SystemExit(f"missing cap on: {r['creation_id']}")
        if r["compound_name"] == "GLOW" and "bright blue liquid" not in vp:
            raise SystemExit("GLOW missing blue liquid")
        if r["compound_name"] != "GLOW" and "bright blue liquid" in vp:
            raise SystemExit(f"non-GLOW blue: {r['compound_name']}")
        if "chem_studio" in r["category"] or "molecule" in vp:
            raise SystemExit("molecule leakage")
        if "3ml pen" not in r["video_prompt"]:
            raise SystemExit(f"missing 3ml pen badge: {r['creation_id']}")
        if re.search(r"\d\s*mg(?:/ml|/vial)?\b", r["video_prompt"], re.I):
            raise SystemExit(f"mg/ml leaked: {r['creation_id']}")
        if "dark maroon" in vp:
            raise SystemExit(f"maroon leaked: {r['creation_id']}")
        if "small palm mark" in vp:
            raise SystemExit(f"palm mark leaked: {r['creation_id']}")
        if "insulin-style" not in vp and "white matte" not in vp:
            raise SystemExit(f"missing white insulin-style hardware: {r['creation_id']}")
        if "10-20%" not in r["video_prompt"] and "full-length" not in vp:
            raise SystemExit(f"missing longer-pen proportion: {r['creation_id']}")
        if len(r["video_prompt"]) > PROMPT_MAX:
            raise SystemExit(f"prompt too long {r['creation_id']} {len(r['video_prompt'])}")

    write_csv(CSV14, fields9, creations)

    old = SHEETS / "14-pen-creations-54.csv"
    if old.exists():
        old.unlink()

    lens = [len(r["video_prompt"]) for r in creations]
    print(f"wrote {CSV14.name}: {len(creations)} Sheet-9-column rows (did not touch 3-image-scenes-150.csv)")
    print(f"Sheet 9 columns ({len(fields9)}): {', '.join(fields9)}")
    print(f"video_prompt chars min={min(lens)} max={max(lens)}")
    print("first 8 ranks:")
    for r in creations[:8]:
        print(f"  {r['rank']:03d}  {r['category']:<22}  {r['compound_name']:<24}  {r['lab_item_id']}")


if __name__ == "__main__":
    main()
