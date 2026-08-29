#!/usr/bin/env python3
"""Lock FILM-019 look-at-device edit. Sync exec 1630 takes + picked keeper."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PICKED = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2f7e139-d98d-9030-8862-3614b91f5719-4d9f0046.png"
)
TAKES_1630 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2f7e139-d98d-9030-8862-3614b91f5719-e5f630cf.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2f7e139-d98d-9030-8862-3614b91f5719-4d9f0046.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2f7e139-d98d-9030-8862-3614b91f5719-c7d575aa.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2f7e139-d98d-9030-8862-3614b91f5719-06141e5d.png"
)
STILL_019 = (
    "Keyframe, 9:16 vertical. Late-20s beautiful blonde woman astronaut, long "
    "golden-blonde hair in a low ponytail, bright green eyes, light freckles, "
    "athletic build, navy-and-gold flight suit with a small circular Palm Beach "
    "chest patch, a small watch-scale retro-futuristic wrist computer strapped "
    "exactly onto her left wrist bone (the joint between forearm and hand), housing "
    "no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal "
    "box: square housing, square amber-orange screen with only slightly rounded "
    "corners, square or rectangular buttons and sliders on the SIDES of the box. "
    "NO ROUND SHAPES — not a round watch, not a circular bezel, not a curved CRT, "
    "not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand "
    "only — never the right hand, never a disembodied prop. Her left hand, palm, "
    "fingers, and thumb stay fully visible past the device, anatomically correct. "
    "The device sits ON the left wrist like a thick rectangular smart-computer box "
    "— never a gauntlet, never a forearm tank, never a prosthetic, never replacing "
    "the hand, never covering the fingers. She stands at the FILM-013 engine core "
    "and looks DOWN at her raised left wrist: chin tucked, eyes on the device, she "
    "is reading the screen. The square screen faces HER face, tilted toward her "
    "eyes — NOT facing the camera, NOT a face-on product shot pointed at the lens. "
    "Camera sees the device in 3/4 from above as she reads it. The screen flashes "
    "an almost-empty amber-red bar and blocky uppercase MOTS-C LOW, text tack "
    "sharp and still readable from that high 3/4 angle. Left hand and fingers "
    "still fully visible. BACKGROUND must be that SAME FILM-013 core — circular "
    "brushed-metal well, concentric rings, dim gold radial vein conduits, red "
    "warning glow — slightly out of focus behind her. NOT a different cockpit. "
    "NOT a space canopy. NOT a crystal socket. NOT a hose nest. NOT a radar HUD "
    "hero. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No "
    "readable text anywhere except the wrist-device screen. No logos, no captions, "
    "no watermarks, no people other than the astronaut."
)
EDIT_019 = (
    "Keep this EXACT woman, face, hair, flight suit, Palm Beach chest patch, and "
    "FILM-013 circular brushed-metal core behind her. Do not change her face. Do "
    "not redesign the square LEFT-wrist device. Turn her head and eyes DOWN so she "
    "is looking at the wrist computer — she is reading it, not glancing aside, not "
    "looking at camera. Rotate her left wrist so the square amber-orange screen "
    "faces HER face, not the camera. The device must NOT face out toward the lens. "
    "We see it in 3/4 from above as she reads MOTS-C LOW. Left hand, palm, fingers, "
    "and thumb stay fully visible past the strap. No round shapes. No extra people."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        if (row.get("still_id") or "").strip() != "FILM-019":
            continue
        row["still_prompt"] = STILL_019
        row["still_edit_prompt"] = EDIT_019
        row["picked_url"] = PICKED
        row["take_urls"] = TAKES_1630
        row["times_used"] = "1"
        row["last_used_at"] = "2026-08-29T14:31:22.449-04:00"
        locked += 1

    if locked != 1:
        raise SystemExit(f"expected FILM-019, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked {locked} row in {CSV_PATH}")


if __name__ == "__main__":
    main()
