#!/usr/bin/env python3
"""Local check: landscape single-hero overlay kills production rows and multi-vial beats."""

from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/landscape_500.csv")

# Mirror the n8n overlay swaps (keep in sync with n8n-code-overlay-landscape-single-hero.js)
SWAPS = [
    ("Render a production row of identical", "Render exactly ONE"),
    ("a neat production row of identical", "exactly ONE"),
    ("a production row of identical", "exactly ONE"),
    (
        "COMPOSITION: Camera PULLED BACK. Do NOT fill the frame with one giant pen. Show a collection of identical freshly manufactured catalog pens of '",
        "COMPOSITION: Single hero spotlight. Show exactly ONE catalog pen of '",
    ),
    (
        "' lined up in a neat straight production row, as if they were just produced. Every pen is the same compound, same label, same hardware, same orientation, caps ON, evenly spaced, parallel. Each pen is SMALL in the frame — the row sits mid-ground so the environment stays readable. Wide shot. FORBIDDEN: one oversized hero pen filling the frame, extreme close-up packshot, mixed compounds, vials, syringes, people.",
        "' as the only product in the frame. Cap ON. FORBIDDEN: second pen, production row, lineup, rack, cluster, mixed compounds, vials, syringes, people.",
    ),
    (
        "CRITICAL PRODUCT FIX: Replace the giant single-pen close-up with a pulled-back production row of identical catalog pens of ",
        "CRITICAL PRODUCT FIX: Keep exactly ONE catalog pen of ",
    ),
    (
        ", lined up as if they were just produced. Camera PULLED BACK. Each pen SMALL in the frame. Each pen is one smooth",
        " as the only hero spotlight. DELETE extra pens and production rows. The pen is one smooth",
    ),
    (
        "After the edit: a neat production row of identical longer matte white pens, zero vials, zero hands on the logos.",
        "After the edit: exactly ONE longer matte white pen, zero extras, zero vials, zero hands on the logo.",
    ),
    ("DELETE one oversized hero filling the frame.", "DELETE extra pens and production rows."),
    ("STRETCH each barrel longer", "STRETCH the barrel longer"),
    ("crimson red text and logo on every pen", "crimson red text and logo on the single pen"),
    (
        "Keep the exact same production row of identical matte white catalog pens of ",
        "Keep the exact same single matte white catalog pen of ",
    ),
    (", camera pulled back, each pen small in frame", " as the only hero spotlight"),
    ("on every pen label", "on the single pen label"),
    ("on every label", "on the single label"),
    ("Do not zoom into one giant pen. Do not scramble the row.", "Do not add a second pen. Do not form a row."),
    ("lined up as just produced, camera pulled back, each pen small in frame", "as the only hero spotlight"),
    ("lined up as if they were just produced", "as the only hero spotlight"),
    ("production row", "single hero pen"),
    ("pens labeled", "pen labeled"),
    (
        "while two vials slowly lean toward each other until labels almost touch",
        "while light crawls across the single vial label",
    ),
    (
        "with three vials arranged in a triangle and soft light circulating between them like a circuit",
        "with light circulating across the single vial like a circuit",
    ),
    ("two vials", "the single vial"),
    ("three vials", "the single vial"),
]


def apply(text: str) -> str:
    t = text or ""
    for old, new in SWAPS:
        t = t.replace(old, new)
    return t


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open()))
    keys = [
        "video_prompt",
        "video_motion_prompt",
        "still_edit_prompt",
        "scene_brief",
        "hero_style",
    ]
    leftover_row = leftover_two = leftover_three = 0
    pens = vials = 0
    for row in rows:
        cat = (row.get("category") or "").strip()
        if cat == "pen_3ml":
            pens += 1
        elif cat in ("vial_10ml", "set_environment"):
            vials += 1
        blob = " ".join(apply(row.get(k) or "") for k in keys)
        low = blob.lower()
        if "production row" in low:
            leftover_row += 1
        if "two vials" in low:
            leftover_two += 1
        if "three vials" in low:
            leftover_three += 1
    print(f"pens={pens} vials={vials}")
    print(f"leftover production row={leftover_row}")
    print(f"leftover two vials={leftover_two}")
    print(f"leftover three vials={leftover_three}")
    if leftover_row or leftover_two or leftover_three:
        raise SystemExit("overlay swaps left multi-hero language")
    print("ok")


if __name__ == "__main__":
    main()
