#!/usr/bin/env python3
"""Fail if lab creation camera diversity is too weak for Grok video."""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parents[1] / "sheets" / "9-lab-item-creations-500.csv"
# Flag real orbit/spin camera language — ignore anti-orbit guards like "no travel around"
ORBIT_CAM = re.compile(
    r"(?<!\bno\s)(?<!\bnever\s)\b(orbit(?:ing|s)?|spin(?:ning)?|360\s*°?|circle around|circular (?:path|orbit)|travel around)\b",
    re.I,
)


def main() -> int:
    rows = list(csv.DictReader(CSV_PATH.open(newline="", encoding="utf-8")))
    errors: list[str] = []

    if len(rows) != 500:
        errors.append(f"expected 500 rows, got {len(rows)}")

    motions = [(r.get("video_motion_prompt") or "").strip() for r in rows]
    cameras = [(r.get("camera_move") or "").strip() for r in rows]
    families = [(r.get("shot_family") or "").strip() for r in rows]
    angles = [(r.get("camera_angle") or "").strip() for r in rows]
    directions = [(r.get("camera_direction") or "").strip() for r in rows]

    if len(set(motions)) != len(rows):
        errors.append(
            f"duplicate video_motion_prompt: unique={len(set(motions))} / {len(rows)}"
        )

    uniq_cam = len(set(c for c in cameras if c))
    # Phase C: every row should have a unique camera_move
    if uniq_cam < len(rows):
        errors.append(f"camera_move unique too low: {uniq_cam} / {len(rows)}")
    if not any(angles):
        errors.append("camera_angle column missing or empty")
    if not any(directions):
        errors.append("camera_direction column missing or empty")

    adj = sum(1 for i in range(1, len(families)) if families[i] and families[i] == families[i - 1])
    if adj:
        errors.append(f"adjacent ranks share shot_family: {adj}")

    for r in rows:
        mp = r.get("video_motion_prompt") or ""
        # Check camera_move + CAMERA: clause only (ignore product names like orbitrap / spinning disk)
        cam_clause = ""
        if "CAMERA:" in mp:
            # take until ENERGY: or end
            after = mp.split("CAMERA:", 1)[1]
            cam_clause = after.split("ENERGY:", 1)[0]
        # Strip anti-orbit guards before matching
        cleaned_move = re.sub(
            r"\b(?:no|never)\s+(?:lateral\s+)?(?:orbiting|travel around|looping)\b[^,.]*",
            " ",
            (r.get("camera_move") or "") + " " + cam_clause,
            flags=re.I,
        )
        if ORBIT_CAM.search(cleaned_move):
            errors.append(
                f"{r.get('creation_id')}: orbit/spin language in camera recipe"
            )

    print(f"rows={len(rows)}")
    print(f"unique video_motion_prompt={len(set(motions))}")
    print(f"unique camera_move={uniq_cam}")
    print(f"unique shot_family={len(set(families))}")
    print(f"unique camera_angle={len(set(a for a in angles if a))}")
    print(f"unique camera_direction={len(set(d for d in directions if d))}")
    print(f"adjacent same shot_family={adj}")

    if errors:
        print("FAIL:")
        for e in errors:
            print(" -", e)
        return 1

    print("PASS — Phase C camera uniqueness OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
