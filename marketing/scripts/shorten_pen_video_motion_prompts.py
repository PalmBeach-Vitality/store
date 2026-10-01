#!/usr/bin/env python3
"""Rewrite Sheet 14 video_motion_prompt for pen I2V.

The spoken sentence is that row's camera_move only. shot_family is a sheet
label and is not pasted into the prompt: Kling treated "static_lock" and
"no travel / locked" as instructions and either froze or invented an arc.

Do not name the cap, clip, dial, or plunger. negative_prompt is its own
column. The fal node reads it.
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_pen_camera_moves import find_defects  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CSV14 = ROOT / "sheets" / "14-pen-creations-150.csv"

MAX_MOTION = 1400

PEN_LOCK = "The product matches the start image. Same silhouette, same colors, same parts."

NEGATIVE_PROMPT = (
    "morphing, melting, transforming, shape change, cap moving, "
    "clip sliding, uncapping, dial turning, knob rotating, plunger extending, "
    "button popping out, deformation, growing, shrinking, "
    "orbit, circling, arc around, camera shake, handheld, wobble, dutch angle, snap zoom"
)

ADDED_FREEZE = (
    "same place on the surface",
    "stays a still object",
    "rigid and unchanged",
    "Camera, from the sheet",
    "product stays planted",
    "Only the camera",
)

BAD_MOTION = re.compile(
    r"vial visual lock|flip-?off|flip-?cap|uncap|pop off|fly away|"
    r"clear glass research vial|10ml sterile multi-use vial|"
    r"CAP MOTION LOCK|VIAL VISUAL LOCK",
    re.I,
)

VIAL_LOCK_PREFIX = re.compile(
    r"^VIAL VISUAL LOCK \(identical every frame\):.*?"
    r"Do not change cap color, helix color/style, vial glass shape/size, crimp, "
    r"or label layout colors between runs\.\s*",
    re.I | re.S,
)


def ascii(s: str) -> str:
    s = str(s or "")
    s = (
        s.replace("‘", "'")
        .replace("’", "'")
        .replace("“", '"')
        .replace("”", '"')
        .replace("–", "-")
        .replace("—", "-")
        .replace("−", "-")
        .replace("…", "...")
        .replace("×", "x")
    )
    s = re.sub(r"[^\x09\x0A\x0D\x20-\x7E]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def require(row: dict, key: str) -> str:
    val = ascii(row.get(key) or "")
    cid = ascii(row.get("creation_id") or "?")
    if not val:
        raise SystemExit(f"{cid}: missing sheet field {key}")
    return val


def strip_vial_lock_prefix(text: str) -> str:
    t = str(text or "")
    t = VIAL_LOCK_PREFIX.sub("", t, count=1)
    return ascii(t)


def build_motion_prompt(row: dict) -> str:
    compound = require(row, "compound_name")
    move = require(row, "camera_move")
    prompt = (
        f"{PEN_LOCK} "
        f"{move}. "
        "No new objects. No people, hands, faces, needles, or burn-in. "
        f"Keep label '{compound}' and '3ml Pen' unchanged."
    )
    prompt = ascii(prompt)
    if len(prompt) > MAX_MOTION:
        raise SystemExit(f"{row.get('creation_id')}: motion is {len(prompt)} characters")
    if BAD_MOTION.search(prompt):
        raise SystemExit(f"motion still has vial/cap-action language: {prompt[:180]}")
    low = prompt.lower()
    for phrase in ADDED_FREEZE:
        if phrase.lower() in low:
            raise SystemExit(f"{row.get('creation_id')}: added camera freeze: {phrase}")
    if move not in prompt:
        raise SystemExit(f"{row.get('creation_id')}: dropped the sheet camera move")
    defects = find_defects(prompt)
    if defects:
        raise SystemExit(f"{row.get('creation_id')}: camera defect in motion: {defects}")
    return prompt


def patch_rows(rows: list[dict]) -> None:
    extra = ("lab_item", "material_detail", "hero_style", "scene_brief")
    for r in rows:
        r["video_motion_prompt"] = build_motion_prompt(r)
        r["negative_prompt"] = NEGATIVE_PROMPT
        for key in extra:
            if key in r and r[key]:
                r[key] = strip_vial_lock_prefix(r[key])


def main() -> None:
    with CSV14.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 168:
        raise SystemExit(f"expected 168 rows, got {len(rows)}")

    patch_rows(rows)
    for r in rows:
        r.pop("cfg_scale", None)
    lens = [len(r["video_motion_prompt"]) for r in rows]
    leftover = sum(
        1
        for r in rows
        for key in ("video_motion_prompt", "lab_item", "material_detail", "hero_style", "scene_brief")
        if BAD_MOTION.search(r.get(key) or "")
    )
    if leftover:
        raise SystemExit(f"still {leftover} vial/flip-off hits after patch")

    fields = list(rows[0].keys())
    with CSV14.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {CSV14}")
    print(f"PASS: motion min/avg/max = {min(lens)}/{sum(lens)//len(rows)}/{max(lens)}")
    print("sample:", rows[0]["video_motion_prompt"])


if __name__ == "__main__":
    main()
