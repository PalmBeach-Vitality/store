#!/usr/bin/env python3
"""Rewrite Sheet 14 video_motion_prompt for pen I2V.

Grok video already has the pen still. Motion must stay short and affirmative.
Do NOT mention vials / flip-off / uncap — I2V morphs the pen into a vial.

PEN LOCK: white catalog pen, clip-cap on and frozen. Camera may move; the pen does not.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV14 = ROOT / "sheets" / "14-pen-creations-150.csv"

MAX_MOTION = 700

PEN_LOCK = (
    "PEN LOCK: One white catalog injection pen. White clip-cap on and frozen. "
    "Camera may move; the pen does not."
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
    move = require(row, "camera_move")[:160]
    prompt = (
        f"{PEN_LOCK} "
        f"Slow cinematic camera: {move}. "
        f"Shot {require(row, 'shot_family')}, "
        f"angle {require(row, 'camera_angle')}, "
        f"direction {require(row, 'camera_direction')}. "
        f"Keep the exact same laboratory research scene, materials, and lighting. "
        f"No orbit. No new objects. No people, hands, faces, needles, or burn-in. "
        f"Keep label '{compound}' and '3ml Pen' unchanged if visible."
    )
    prompt = ascii(prompt)
    if len(prompt) > MAX_MOTION:
        prompt = prompt[: MAX_MOTION - 1].rsplit(" ", 1)[0] + "."
    if BAD_MOTION.search(prompt):
        raise SystemExit(f"motion still has vial/cap-action language: {prompt[:180]}")
    return prompt


def patch_rows(rows: list[dict]) -> None:
    extra = ("lab_item", "material_detail", "hero_style", "scene_brief")
    for r in rows:
        r["video_motion_prompt"] = build_motion_prompt(r)
        for key in extra:
            if key in r and r[key]:
                r[key] = strip_vial_lock_prefix(r[key])


def main() -> None:
    with CSV14.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 150:
        raise SystemExit(f"expected 150 rows, got {len(rows)}")

    patch_rows(rows)
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
    print(f"PASS: motion min/avg/max = {min(lens)}/{sum(lens)//150}/{max(lens)}")
    print("sample:", rows[0]["video_motion_prompt"])


if __name__ == "__main__":
    main()
