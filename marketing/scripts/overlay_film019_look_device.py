#!/usr/bin/env python3
"""Lock FILM-019 look-at-device edit. Sync exec 1630 takes + picked keeper."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PICKED = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-97eff08a-b0a1-99eb-86f1-bc1d1a62b8c2-13d57662.jpeg"
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
    "is reading the screen. The square screen and the glowing MOTS-C LOW text face "
    "HER — right-side-up for her eyes, upside-down or edge-on to the camera. NOT a "
    "face-on product shot pointed at the lens. Camera sees the SIDE and TOP EDGE of "
    "the square box as she reads it. Left hand and fingers "
    "still fully visible. BACKGROUND must be that SAME FILM-013 core — circular "
    "brushed-metal well, concentric rings, dim gold radial vein conduits, red "
    "warning glow — slightly out of focus behind her. NOT a different cockpit. "
    "NOT a space canopy. NOT a crystal socket. NOT a hose nest. NOT a radar HUD "
    "hero. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No "
    "readable text anywhere except the wrist-device screen. No logos, no captions, "
    "no watermarks, no people other than the astronaut."
)
EDIT_019 = (
    "Keep this EXACT woman, face, hair, pose, flight suit, Palm Beach chest patch, "
    "and circular brushed-metal core. Do not change her face. Do not move her left "
    "arm. Do not take the device off her left wrist. ONLY rotate the square "
    "wrist-computer screen 180 degrees so the glowing MOTS-C LOW text faces HER "
    "and is right-side-up for her eyes. From the camera the letters should appear "
    "upside-down or edge-on — she is reading it, the audience is not. The square "
    "housing stays on her LEFT wrist. Left hand, fingers, and thumb stay visible. "
    "No handheld prop. No engraved text on the core. No extra people."
)
TAKES_AFTER_1632 = (
    TAKES_1630
    + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8853ecc9-71c3-9a38-8e1c-0fad6da2c306-5790c9d7.jpeg"
    + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-985c0b9b-94c9-9c40-99c8-e77c44a830f5-46de5d90.jpeg"
    + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3074a60b-2516-94a5-8b58-e0483160c9d9-45eda879.jpeg"
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
        row["take_urls"] = (
            TAKES_AFTER_1632
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-a7fec17c-279d-9a44-bd5d-06f80669befc-5ada7371.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-97eff08a-b0a1-99eb-86f1-bc1d1a62b8c2-13d57662.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d4fdea06-7fcd-9d10-8752-3b12ab87371d-be2d2113.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-98f8e437-d608-9c33-aab4-9a7a0e8ec4de-84da06a6.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-2a7e5bc4-98ba-91a2-99a7-6a9a2ed31fe3-6dba7324.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3a65f6f8-e8f8-9958-9997-0855099bbeba-20ad4364.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-aca88bfa-ecde-90bc-b867-ff10d07895d9-fc2b8ec8.jpeg"
            + " | https://imgen.x.ai/xai-imgen/xai-tmp-imgen-bb4ce8d0-70cc-909e-b486-fe7507070463-08632928.jpeg"
        )
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
