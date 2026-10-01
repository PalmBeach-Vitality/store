#!/usr/bin/env python3
"""Fail if a Sheet 14 camera sentence would make Kling arc, lock, or drift.

Scans camera_move, camera_direction, camera_angle, and video_motion_prompt.
Does not scan video_prompt (the still prompt is frozen) or negative_prompt
(that column is where orbit / shake / handheld belong).
"""

from __future__ import annotations

import csv
import re
import sys
from collections import Counter
from pathlib import Path

CSV14 = Path(__file__).resolve().parents[1] / "sheets" / "14-pen-creations-150.csv"

FORBIDDEN_FAMILIES = {"static_lock", "doc_drift", "crane_settle"}

ALLOWED_ANGLES = {
    "eye-level",
    "slight-low",
    "slight-high",
    "high looking down",
    "high three-quarter",
    "true side profile left",
    "true side profile right",
    "label-plane flat",
    "low-angle",
    "three-quarter-left",
    "three-quarter-right",
    "true top-down 90 degrees",
    "macro flat-on",
}

ALLOWED_DIRECTIONS = {
    "forward",
    "backward",
    "left to right",
    "right to left",
    "up",
    "down",
    "tilt up",
    "tilt down",
}

# Worded so "research" does not match "arc", and "No people" does not match.
DEFECTS = (
    (r"\bhold\b", "hold"),
    (r"\blocked\b", "locked"),
    (r"\btripod\b", "tripod"),
    (r"\bfrozen\b", "frozen"),
    (r"\bhandheld\b", "handheld"),
    (r"\bbreathing\b", "breathing"),
    (r"micro-?focus", "micro-focus"),
    (r"\borbit\b", "orbit"),
    (r"\bcircl", "circle"),
    (r"\barc\b", "arc"),
    (r"\b360\b", "360"),
    (r"\bflange\b", "flange"),
    (r"\bchassis\b", "chassis"),
    (r"\bengraved\b", "engraved"),
    (r"\bcaustic\b", "caustic"),
    (r"\bdoes not\b", "does not"),
    (r"\bdo not\b", "do not"),
    (r"\bnever\b", "never"),
    (r"no travel", "no travel"),
    (r"no lateral", "no lateral"),
    (r"no sideways", "no sideways"),
    (r"static_lock", "static_lock"),
    (r"\bcreeping\b", "creeping"),
    (r"razor shallow", "razor shallow"),
    (r"a few centimeters", "a few centimeters"),
    (r"\bstart on\b", "start on"),
    (r"from ceiling", "from ceiling"),
    (r"foot of instrument", "foot of instrument"),
    (r"doc_drift", "doc_drift"),
    (r"\bcrane\b", "crane"),
    (r"\bdrift\b", "drift"),
    (r"negative space", "negative space"),
    (r"\bwobble\b", "wobble"),
    (r"depth of field", "depth of field"),
    (r"lighting wrap", "lighting wrap"),
    (r"\bport\b", "port"),
    (r"\bunderside\b", "underside"),
    (r"\brising\b", "rising"),
    (r"\bsettling\b", "settling"),
    (r"to eye level", "to eye level"),
    (r"to eye-level", "to eye-level"),
    (r"\bbarely\b", "barely"),
)


def find_defects(text: str) -> list[str]:
    found: list[str] = []
    for pattern, label in DEFECTS:
        if re.search(pattern, text, re.I):
            found.append(label)
    return found


def main() -> int:
    with CSV14.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    counts: Counter[str] = Counter()
    bad_rows = 0
    for row in rows:
        blob = " ".join(
            row.get(key) or ""
            for key in ("camera_move", "camera_direction", "camera_angle", "video_motion_prompt", "shot_family")
        )
        hits = find_defects(blob)
        if row.get("shot_family") in FORBIDDEN_FAMILIES and "family" not in hits:
            hits.append("forbidden family")
        if (row.get("camera_angle") or "") not in ALLOWED_ANGLES:
            hits.append("angle")
        if (row.get("camera_direction") or "") not in ALLOWED_DIRECTIONS:
            hits.append("direction")
        if hits:
            bad_rows += 1
            for hit in hits:
                counts[hit] += 1
    print(f"rows={len(rows)} bad_rows={bad_rows}")
    for label, n in counts.most_common():
        print(f"  {n:4d}  {label}")
    if bad_rows:
        print("FAIL")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
