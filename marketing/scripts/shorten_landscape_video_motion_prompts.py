#!/usr/bin/env python3
"""Rewrite landscape Sheet video_motion_prompt for I2V.

Grok video already has the still. Motion must stay short and affirmative.
Do NOT mention flip-off / uncap / pop — I2V treats those as action.

CAP LOCK: solid bright blue cap, seated and frozen. Camera may move; the cap does not.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "sheets" / "500_Peptide_Wellness_Reel_Scenes.csv"

MAX_MOTION = 700

CAP_LOCK = (
    "CAP LOCK: One solid bright blue cap, seated and frozen. "
    "The cap stays closed. Camera may move; the cap does not."
)

BAD_MOTION = re.compile(
    r"flip-?off|flip-?cap|uncap|pop off|fly away|detach|unscrew|wobble|"
    r"do not animate the cap|CAP MOTION LOCK|VIAL VISUAL LOCK|SEATED CAP LOCK",
    re.I,
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


def build_motion_prompt(row: dict) -> str:
    compound = require(row, "compound_name")
    move = require(row, "camera_move")[:160]
    prompt = (
        f"{CAP_LOCK} "
        f"Slow cinematic camera: {move}. "
        f"Shot {require(row, 'shot_family')}, "
        f"angle {require(row, 'camera_angle')}, "
        f"direction {require(row, 'camera_direction')}. "
        f"Keep the exact same laboratory research scene, materials, and lighting. "
        f"No new objects. No people, hands, faces, needles, or burn-in. "
        f"Keep label '{compound}' unchanged if visible, once only."
    )
    prompt = ascii(prompt)
    if len(prompt) > MAX_MOTION:
        prompt = prompt[: MAX_MOTION - 1].rsplit(" ", 1)[0] + "."
    if BAD_MOTION.search(prompt):
        raise SystemExit(f"motion still has cap-action language: {prompt[:180]}")
    return prompt


def main() -> None:
    with CSV.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise SystemExit("empty landscape sheet")

    for r in rows:
        r["video_motion_prompt"] = build_motion_prompt(r)

    lens = [len(r["video_motion_prompt"]) for r in rows]
    fields = list(rows[0].keys())
    with CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {CSV} rows={len(rows)}")
    print(f"PASS: motion min/avg/max = {min(lens)}/{sum(lens)//len(rows)}/{max(lens)}")
    print("sample:", rows[0]["video_motion_prompt"])


if __name__ == "__main__":
    main()
