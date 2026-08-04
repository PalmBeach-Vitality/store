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

    if len(set(motions)) != len(rows):
        errors.append(
            f"duplicate video_motion_prompt: unique={len(set(motions))} / {len(rows)}"
        )

    uniq_cam = len(set(c for c in cameras if c))
    # Soft threshold today (16); raise after Phase C rebuild
    if uniq_cam < 16:
        errors.append(f"camera_move unique too low: {uniq_cam}")

    adj = sum(1 for i in range(1, len(families)) if families[i] and families[i] == families[i - 1])
    if adj:
        errors.append(f"adjacent ranks share shot_family: {adj}")

    for r in rows:
        mp = r.get("video_motion_prompt") or ""
        # Ignore product-name false positives by checking CAMERA: clause only
        cam_clause = ""
        if "CAMERA:" in mp:
            cam_clause = mp.split("CAMERA:", 1)[1].split(".", 1)[0]
        if ORBIT_CAM.search(cam_clause) or ORBIT_CAM.search(r.get("camera_move") or ""):
            errors.append(
                f"{r.get('creation_id')}: orbit/spin language in camera recipe"
            )

    print(f"rows={len(rows)}")
    print(f"unique video_motion_prompt={len(set(motions))}")
    print(f"unique camera_move={uniq_cam}")
    print(f"unique shot_family={len(set(families))}")
    print(f"adjacent same shot_family={adj}")

    if uniq_cam < 200:
        print(
            "WARN: only",
            uniq_cam,
            "unique camera_move values — Phase C rebuild still needed for true per-video camera uniqueness.",
        )

    if errors:
        print("FAIL:")
        for e in errors:
            print(" -", e)
        return 1

    print("PASS (structural). Raise camera_move uniqueness via Phase C for full goal.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
