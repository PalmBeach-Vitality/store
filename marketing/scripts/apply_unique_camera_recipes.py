#!/usr/bin/env python3
"""Phase C: assign a unique camera angle/direction/move to each creation row."""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV_PATH = SHEETS / "9-lab-item-creations-500.csv"
CSV_250 = SHEETS / "9-lab-item-creations-250.csv"
JSON_PATH = ROOT / "pbvita-500-lab-item-creations.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from camera_recipes import build_unique_camera_sequence  # noqa: E402

SINGLE_SUBJECT = (
    "ENVIRONMENT-FORWARD SCENE: build a full research / wellness / R&D world, "
    "not a boring single-SKU cutout. Depth, architecture, and atmosphere matter."
)
AVOID = (
    "Avoid: people, hands, faces, needles, injection, lifestyle influencers, cardboard boxes "
    "as hero, fake LAB codes, creation motifs, 000/500 counters, surreal CGI orbs, "
    "watermarks, lower-third captions, hex IDs, continuity codes, burn-in text, "
    "scene titles printed in frame, gallery name plaques. "
    "Do NOT render prompt metadata as visible text."
)
QUALITY = (
    "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
    "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR"
)


def rebuild_still_prompt(row: dict, shot: dict) -> str:
    name = row["lab_item"]
    detail = row.get("material_detail") or name
    compound = (row.get("compound_name") or "").strip()
    surface = row.get("surface") or "clean laboratory surface"
    lighting = row.get("lighting") or "clinical catalog lighting"
    color_grade = row.get("color_grade") or "neutral color-true pharmaceutical catalog grade"
    hero_style = row.get("hero_style") or "editorial science magazine cover energy"
    if compound:
        label_rule = (
            f"LABEL REQUIREMENT: if any label, sticker, carton panel, or printed text appears on the subject, "
            f"it MUST read exactly '{compound}' as the product name (Palm Beach Vitality research compound), "
            f"optionally with a small 'For Laboratory Research Use Only' line. "
            f"Do NOT invent other compound names. Do NOT print LAB codes, creation motifs, or 000/500 counters."
        )
    else:
        label_rule = (
            "LABEL REQUIREMENT: this equipment/scene should have NO product compound label. "
            "Keep manufacturer panels minimal/illegible/blank. "
            "Do NOT print compound names, LAB codes, creation motifs, or 000/500 counters on the subject."
        )
    return (
        f"Photoreal vertical 9:16 Palm Beach Vitality cinematic research still. "
        f"Create an exciting unique laboratory / peptide R&D / health-and-wellness industry scene. "
        f"FULL SCENE BRIEF: {name} "
        f"Supporting notes: {detail} "
        f"SHOT FAMILY: {shot['shot_family']}. "
        f"CAMERA ANGLE: {shot['camera_angle']}. "
        f"CAMERA DIRECTION: {shot['camera_direction']}. "
        f"FRAMING: {shot['framing']}. "
        f"Hero style: {hero_style}. "
        f"Setting surface: {surface}. Lighting: {lighting}. "
        f"Intended follow-on camera move: {shot['camera_move']}. Energy: {shot['energy']}. "
        f"Color grade: {color_grade}. "
        f"{label_rule} "
        f"Compose for spectacle and depth — environment-forward storytelling. "
        f"{SINGLE_SUBJECT} "
        f"{AVOID}. "
        f"Quality: {QUALITY}. "
        f"For laboratory research use only. Not for human use or consumption."
    )


def rebuild_motion_prompt(row: dict, shot: dict) -> str:
    name = row["lab_item"]
    detail = (row.get("material_detail") or "").strip()
    compound = (row.get("compound_name") or "").strip()
    surface = row.get("surface") or "clean laboratory surface"
    lighting = row.get("lighting") or "clinical catalog lighting"
    if compound:
        label_rule = (
            f"Keep any on-subject label unchanged and readable as '{compound}' only. "
            f"No motif/LAB/counter text."
        )
    else:
        label_rule = "Do not add product compound labels or counters onto the subject."
    detail_clause = f" Continuity notes: {detail}." if detail else ""
    return (
        f"Photoreal vertical 9:16 cinematic laboratory research film continuing this exact scene: {name}."
        f"{detail_clause} "
        f"SHOT FAMILY: {shot['shot_family']}. "
        f"CAMERA ANGLE: {shot['camera_angle']}. "
        f"CAMERA DIRECTION: {shot['camera_direction']}. "
        f"FRAMING: {shot['framing']}. "
        f"CAMERA: {shot['camera_move']}. "
        f"ENERGY: {shot['energy']}. "
        f"Path must be straight or a simple tilt/pedestal/truck only — never travel around the subject. "
        f"Lighting continuity: {lighting}. Surface continuity: {surface}. "
        f"Keep the world sharp, recognizable, and unchanged from the still — exciting depth, not a SKU spin. "
        f"{label_rule} "
        f"No people, no hands, no faces, no needles, no injection, no lifestyle influencers, no cardboard box heroes. "
        f"For laboratory research use only. Not for human use or consumption."
    )


def rebuild_scene_brief(row: dict, shot: dict) -> str:
    # Prefer a short title so scene_brief stays scannable when lab_item is a full paragraph
    title = (row.get("lab_item") or "").strip()
    # Grab theme fragment if present: "Scene 001 — Theme" or "Scene 001 (Theme)"
    m = re.search(r"Scene\s+\d+\s*[—\-:(]+\s*([^).\n]+)", title)
    if m:
        first = m.group(1).strip()[:90]
    else:
        first = title.split(".")[0].strip()[:90]
    parts = [
        first,
        f"shot:{shot['shot_family']}",
        f"angle:{shot['camera_angle']}",
        f"dir:{shot['camera_direction']}",
    ]
    compound = (row.get("compound_name") or "").strip()
    if compound:
        parts.append(f"intro:{compound}")
        parts.append(f"label:{compound}")
    parts.append(shot["framing"])
    parts.append(shot["camera_move"])
    if row.get("color_grade"):
        parts.append(row["color_grade"])
    return " · ".join(parts)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 500:
        raise SystemExit(f"expected 500 rows, got {len(rows)}")

    rows.sort(key=lambda r: int(r["rank"]))
    cams = build_unique_camera_sequence(500)

    for row, shot in zip(rows, cams):
        row["shot_family"] = shot["shot_family"]
        row["framing"] = shot["framing"]
        row["camera_move"] = shot["camera_move"]
        row["camera_angle"] = shot["camera_angle"]
        row["camera_direction"] = shot["camera_direction"]
        row["video_prompt"] = rebuild_still_prompt(row, shot)
        row["video_motion_prompt"] = rebuild_motion_prompt(row, shot)
        row["scene_brief"] = rebuild_scene_brief(row, shot)

    fieldnames = list(rows[0].keys())
    # Keep a stable column order: insert new camera cols after framing
    preferred = [
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
        "status",
        "times_used",
        "last_used_at",
        "surface",
        "lighting",
        "camera_move",
        "color_grade",
        "hero_style",
    ]
    for c in fieldnames:
        if c not in preferred:
            preferred.append(c)

    for path in (CSV_PATH, CSV_250):
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=preferred, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote {path}")

    JSON_PATH.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {JSON_PATH}")

    moves = {r["camera_move"] for r in rows}
    angles = {r["camera_angle"] for r in rows}
    dirs = {r["camera_direction"] for r in rows}
    fams = {r["shot_family"] for r in rows}
    adj = sum(
        1
        for i in range(1, len(rows))
        if rows[i]["shot_family"] == rows[i - 1]["shot_family"]
    )
    print(
        f"unique camera_move={len(moves)} angles={len(angles)} "
        f"directions={len(dirs)} families={len(fams)} adjacent_same_family={adj}"
    )
    sample = rows[0]
    print("sample rank1:", sample["shot_family"], "|", sample["camera_angle"], "|", sample["camera_direction"])
    print("CAMERA:", sample["camera_move"][:140])


if __name__ == "__main__":
    main()
