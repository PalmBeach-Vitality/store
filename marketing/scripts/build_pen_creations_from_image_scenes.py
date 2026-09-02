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

METABOLIC_NAMES = {"Semaglutide", "Tirzepatide", "Retatrutide"}


def accent_for(name: str) -> str:
    return "cobalt blue" if name in METABOLIC_NAMES else "crimson red"


def family_for(name: str) -> str:
    return "metabolic" if name in METABOLIC_NAMES else "peptide"


def quality_line(accent: str) -> str:
    return (
        "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
        "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR, "
        "pulled-back wide still of a production row of identical LONGER full-length matte white catalog insulin-style research pens, not stubby, each pen small in frame, "
        "not one giant close-up, no vial, caps on, white ridged dial, DNA helix with no hands, "
        f"{accent} circular plunger tip, no orange"
    )


def still_edit_line(name: str) -> str:
    accent = accent_for(name)
    family = family_for(name)
    return (
        "CRITICAL PRODUCT FIX: Replace the giant single-pen close-up with a pulled-back production row of identical "
        f"matte white catalog insulin-style pens of '{name}', lined up as if they were just produced. Camera PULLED BACK. "
        "Each pen SMALL in the frame. Cap ON with white pocket clip. White ridged gear-like dose dial (not colored). "
        f"Small flat circular plunger tip in {accent}. Logo ABOVE the name: {accent} DNA double-helix icon only — no hands, no palms, "
        "no figurative hands cradling the helix. "
        f"Name '{name}' large bold {accent} sans-serif. Solid {accent} rectangle badge with white '10mg'. "
        "Fine-print black lines under the name. Vertical label text: For Research Purposes Only. "
        f"This is a {family} SKU — {accent} text and logo on every pen. STRETCH each barrel longer — full-length adult "
        "injector, not stubby. DELETE hands around the DNA helix. DELETE one oversized hero filling the frame. DELETE orange, burgundy vial branding, "
        "palm trees, mixed compounds, vials, needles, syringes, scales, trays. After the edit: a neat production row of identical "
        "longer white pens, zero vials, zero hands on the logos. Caps on."
    )

CAPTION_LOCK = (
    "For laboratory research use only. Not for human use or consumption. "
    "Not a drug, dietary supplement, or cosmetic. Not evaluated by the FDA. "
    "Captions only — never burn this into the image or Grok prompt."
)

def hero_pose(name: str) -> str:
    accent = accent_for(name)
    return (
        "production row of identical catalog injectors — just produced, lined up, camera pulled back, "
        f"each pen small in frame, matte white, white clip-cap ON, white ridged dial, "
        f"{accent} DNA helix icon (no hands) + name + 10mg badge, {accent} plunger tip"
    )


# Same physical pens in every row. Collection / production-row framing (do not invent a count).
# Hardware: catalog injector (not a glass vial, not brushed silver, not orange).
PEN_HARDWARE = (
    "smooth matte white cylindrical insulin-style injectable research pen with a LONGER full-length barrel — "
    "PROPORTION: barrel 10-20 percent longer than a stubby travel pen, full-length elongated adult injector, "
    "not compact, not short; stretch the white barrel, keep the diameter the same; matching white matte cap ON "
    "with integrated white pocket clip covering the tip; white ridged gear-like dose dial "
    "(NOT colored, NOT orange); small flat circular plunger tip at the bottom of the dial in the accent color; "
    "small rectangular transparent barrel window beside the label "
    "(a glimpse of liquid/mechanism only — NOT a tall glass reservoir, NOT most of the body as glass)"
)

PEN_FORMS: list[tuple[str, str]] = [
    (
        "a collection of identical matte white catalog insulin-style research pens lined up in a neat production row on a light reflective surface, camera pulled back, each pen small in frame",
        PEN_HARDWARE + "; catalog product still, caps on, production row",
    ),
    (
        "a collection of identical matte white catalog insulin-style research pens in a three-quarter production-row catalog view, camera pulled back",
        PEN_HARDWARE + "; soft reflection, caps on, lined up as just produced",
    ),
    (
        "a collection of identical matte white catalog insulin-style research pens lined up on a mirrored chrome plate, camera pulled back, each pen small in frame",
        PEN_HARDWARE + "; hard specular highlights, caps on, production row",
    ),
    (
        "a collection of identical matte white catalog insulin-style research pens lined up so barrel windows stay readable, wide pulled-back production row (not a close-up)",
        PEN_HARDWARE + "; labels readable, caps on, mid-ground row",
    ),
    (
        "a collection of identical matte white catalog insulin-style research pens lined up on matte white seamless paper, camera pulled back",
        PEN_HARDWARE + "; plain white backdrop, caps on, production row",
    ),
    (
        "a collection of identical matte white catalog insulin-style research pens edge-lit in a production row, camera pulled back, each pen small in frame",
        PEN_HARDWARE + "; rim light outlining each white body and accent plunger tip, caps on",
    ),
    (
        "matte white catalog insulin-style research pen low-angle hero",
        PEN_HARDWARE + "; premium catalog angle, cap on",
    ),
    (
        "matte white catalog insulin-style research pen on frosted glass platform",
        PEN_HARDWARE + "; soft reflection beneath, cap on",
    ),
    (
        "matte white catalog insulin-style research pen label-facing catalog",
        PEN_HARDWARE + "; label fully readable, cap on",
    ),
    (
        "matte white catalog insulin-style research pen slight diagonal on acrylic",
        PEN_HARDWARE + "; one pen only, no stand claw, cap on",
    ),
    (
        "matte white catalog insulin-style research pen on dark matte acrylic",
        PEN_HARDWARE + "; white body contrast, cap on",
    ),
    (
        "matte white catalog insulin-style research pen plunger-tip macro",
        PEN_HARDWARE + "; accent-color circular plunger tip in frame, cap on",
    ),
    (
        "matte white catalog insulin-style research pen clip-and-cap detail",
        PEN_HARDWARE + "; white pocket clip visible, cap on",
    ),
    (
        "matte white catalog insulin-style research pen on linen lab wipe",
        PEN_HARDWARE + "; product only, cap on",
    ),
    (
        "single matte white catalog insulin-style Palm Beach Vitality research pen",
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
    accent = accent_for(name)
    family = family_for(name)
    return (
        "HARD OUTPUT LOCK (READ FIRST): Copy the catalog injector still. Render a production row of identical "
        f"smooth matte white cylindrical insulin-style Palm Beach Vitality research pens labeled '{name}', "
        "lined up as if they were just produced. Camera PULLED BACK. Each pen SMALL in the frame. "
        "LONGER full-length barrel — stretch 10-20 percent longer than a stubby travel pen, adult injector, "
        "not compact, not short, keep the diameter. "
        "This is a medical injection pen, NOT a glass vial, NOT brushed-silver metal, NOT a perfume cartridge, "
        "NOT a chrome claw stand. White matte cap ON with integrated white pocket clip "
        "covering the tip — never removed, never sitting beside the pen, never showing a needle. "
        "White ridged gear-like dose dial (NOT colored, NOT orange). Small flat circular plunger tip "
        f"at the bottom of the dial in {accent}. No mixed compounds. No vial. No syringe. No people. "
        "COLOR LOCK: Peptide pens = crimson red text + logo. Metabolic pens "
        "(Semaglutide / Tirzepatide / Retatrutide only) = cobalt blue text + logo. "
        f"This SKU is {family} / {accent}. FORBIDDEN: orange anywhere. FORBIDDEN: hands near the DNA helix. "
        "FORBIDDEN: one oversized hero pen filling the frame."
    )


def closing_lock() -> str:
    return (
        " HARD OUTPUT LOCK (FINAL CHECK): This is a PRODUCTION ROW of identical freshly made pens, camera pulled back, "
        "each pen small in frame. Not one oversized close-up. Lined up as just produced. No vials. No mixed SKUs. "
        "Caps on. Longer full-length barrel on each pen. White dial. Accent plunger tip. DNA helix with no hands. No orange."
    )


def brand_label(name: str) -> str:
    accent = accent_for(name)
    return (
        "LABEL (MANDATORY): clean white wrap-around barrel label. "
        f"Logo ABOVE the name: {accent} DNA double-helix icon only — no hands, no palms, "
        "no figurative hands cradling the helix. "
        f"Exact compound name '{name}' in large bold {accent} sans-serif (Helvetica/Arial). "
        f"Solid {accent} rectangle badge with white text exactly '10mg'. "
        "Small dense black/dark-grey fine-print lines under the name. "
        "Vertical side text on the label: For Research Purposes Only. "
        "FORBIDDEN: orange DNA, orange name, orange badge, orange dial, orange anywhere, "
        "burgundy vial branding, palm tree, extra class names, poster overlays."
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
                "_hero_style": hero_pose(name),
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
        "No poster overlay, captions, watermarks, palm tree, or burn-in text in frame "
        f"except the catalog label ('{name}', '10mg', DNA helix icon with no hands, vertical For Research Purposes Only)."
        f"{closing_lock()}"
    )


def material_detail(scene: dict) -> str:
    return (
        f"3-image-scenes product_hero — {scene['product_hero']}; "
        f"product_form_detail — {scene['product_form_detail']}; "
        f"lab_environment — {scene['lab_environment'][:180]}; "
        f"surface {scene['_surface']}; lighting {scene['lighting']}. "
        "A production row of identical capped pens. No vial."
    )


def video_prompt(scene: dict, lab_item: str, material: str) -> str:
    name = scene["compound_name"]
    shot = scene["_shot"]
    body = (
        f"{pen_lock(name)} "
        "Photoreal vertical 9:16 Palm Beach Vitality cinematic research still. "
        "Create an exciting laboratory / peptide R&D / health-and-wellness industry environment "
        "that contains a production row of identical capped research pens, lined up as just produced, camera pulled back "
        "(never a vial, never one giant close-up pen). "
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
        "vials, mixed compounds, one giant close-up pen filling the frame, silver vial-pens, chrome claw stands, scales, trays, watermarks, "
        "lower-thirds, scene titles, burn-in text. "
        "Do NOT render prompt metadata as visible text. "
        f"Quality: {quality_line(accent_for(name))}. "
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
        "Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. "
        f"Slow cinematic camera: {move}. "
        f"Shot {shot['shot_family']}, angle {shot['camera_angle']}, "
        f"direction {shot['camera_direction']}. "
        f"Keep the exact same production row of identical matte white catalog '{name}' pens, camera pulled back, "
        f"each pen small in frame, white ridged dial, {accent_for(name)} plunger tip, "
        f"{accent_for(name)} DNA helix icon with no hands, materials, and lighting. "
        "Caps stay ON. No orbit. No new objects. Do not zoom into one giant pen. No vial, people, needles, "
        "watermarks, poster overlays, or orange paint. "
        f"{glow}"
        "Liquid does not change level — pre-filled and static. "
        f"Keep label words '{name}' and '10mg' and vertical For Research Purposes Only unchanged."
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
            "quality_suffix": quality_line(accent_for(scene["compound_name"])),
            "aspect_ratio": "9:16",
            "duration_seconds": 15,
            "resolution": "1080p",
            "model_still": "grok-imagine-image-2.0",
            "model_video": "grok-imagine-video-1.5",
            "still_resolution": "2k",
            "still_n": 1,
            "video_prompt": video_prompt(scene, lab_item, material),
            "video_motion_prompt": motion_prompt(scene),
            "still_edit_prompt": still_edit_line(scene["compound_name"]),
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
    if "still_n" not in fields9:
        fields9 = fields9 + ["still_n"]
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
        if "'10mg'" not in r["video_prompt"] and "exactly '10mg'" not in r["video_prompt"]:
            raise SystemExit(f"missing 10mg badge: {r['creation_id']}")
        if re.search(r"bright orange ridged|large bold orange|solid orange rounded", vp):
            raise SystemExit(f"orange leaked: {r['creation_id']}")
        accent = accent_for(r["compound_name"])
        if accent not in r["video_prompt"]:
            raise SystemExit(f"missing {accent} on {r['creation_id']}")
        if re.search(r"\d\s*mg/(?:ml|vial)\b", r["video_prompt"], re.I):
            raise SystemExit(f"mg/ml leaked: {r['creation_id']}")
        if "dark maroon" in vp:
            raise SystemExit(f"maroon leaked: {r['creation_id']}")
        if "small palm mark" in vp:
            raise SystemExit(f"palm mark leaked: {r['creation_id']}")
        if "insulin-style" not in vp and "matte white" not in vp and "white matte" not in vp:
            raise SystemExit(f"missing white insulin-style hardware: {r['creation_id']}")
        if "pocket clip" not in vp:
            raise SystemExit(f"missing pocket clip: {r['creation_id']}")
        if "cradled by two hands" in vp or "hands-and-dna" in vp:
            raise SystemExit(f"hands-and-DNA leaked: {r['creation_id']}")
        if "dna double-helix icon only" not in vp and "helix icon" not in vp:
            raise SystemExit(f"missing helix-only logo: {r['creation_id']}")
        if "10-20 percent longer" not in vp and "longer full-length" not in vp:
            raise SystemExit(f"missing longer-barrel lock: {r['creation_id']}")
        if "production row" not in vp and "lined up" not in vp:
            raise SystemExit(f"missing production row: {r['creation_id']}")
        if "pulled back" not in vp and "small in the frame" not in vp and "small in frame" not in vp:
            raise SystemExit(f"missing pulled-back framing: {r['creation_id']}")
        if "never two pens" in vp or "product count = 1" in vp or "product count equals 1" in vp:
            raise SystemExit(f"single-pen lock leaked: {r['creation_id']}")
        if "10mg" not in r["video_prompt"]:
            raise SystemExit(f"missing 10mg badge: {r['creation_id']}")
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
