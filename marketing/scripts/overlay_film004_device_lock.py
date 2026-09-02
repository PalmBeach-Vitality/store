#!/usr/bin/env python3
"""Lock Sheet 18 device look to the FILM-004 square left-wrist keeper."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

ROTARY_PHRASE = ", with rotary dials and a small amber CRT."
SQUARE_LOCK = (
    ". The device is a rectangular blocky SQUARE gunmetal box: square housing, "
    "square amber-orange screen with only slightly rounded corners, square or "
    "rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES — "
    "not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, "
    "not round gauges. ALWAYS on her LEFT wrist and left hand only — never the "
    "right hand, never a disembodied prop."
)
SMARTWATCH_OLDS = (
    "The device sits ON the wrist like a thick smartwatch — never a gauntlet",
    "The device sits ON the wrist like a thick smartwatch - never a gauntlet",
)
SMARTWATCH_NEW = (
    "The device sits ON the left wrist like a thick rectangular smart-computer "
    "box — never a gauntlet"
)
FILM003_CRT_OLD = "square amber CRT screen with only slightly rounded corners"
FILM003_CRT_NEW = "square amber-orange screen with only slightly rounded corners"
FILM003_ROTARY_OLD = (
    "Small rotary dials sit on the sides of the square housing, not as giant "
    "round knobs that make the silhouette circular."
)
FILM003_ROTARY_NEW = (
    "Square or rectangular buttons and sliders sit on the SIDES of the box. "
    "NO ROUND SHAPES — not rotary knobs, not a round watch, not a circular bezel, "
    "not a curved CRT, not round gauges. ALWAYS on her LEFT wrist and left hand "
    "only — never the right hand."
)

STILL_005 = (
    "Extreme close-up macro of HER LEFT WRIST and LEFT HAND, 9:16 vertical. "
    "Late-20s beautiful blonde woman astronaut, navy-and-gold flight-suit sleeve "
    "filling the frame. A rectangular blocky SQUARE gunmetal wrist computer is "
    "strapped exactly onto her LEFT wrist bone (the joint between forearm and "
    "hand), housing no wider than the wrist. The device is a thick square box: "
    "brushed dark gunmetal, exposed screws, square amber-orange screen with only "
    "slightly rounded corners, square or rectangular buttons and sliders on the "
    "SIDES of the box. NO ROUND SHAPES: not a round watch face, not a circular "
    "bezel, not a curved CRT, not rotary knobs, not round gauges, not a Pip-Boy "
    "gauntlet. ALWAYS on her LEFT hand — never the right hand, never a floating "
    "device with no person attached. Her left palm, fingers, and thumb continue "
    "past the strap and stay fully visible, anatomically correct. The screen "
    "shows a full bright green horizontal charge bar and the blocky uppercase "
    "word 'MOTS-C' above it, steady and healthy. Screen text is tack sharp and "
    "perfectly legible. Photoreal cinematic sci-fi commercial still, 8k, HDR, "
    "razor sharp. No readable text anywhere except the wrist-device screen. No "
    "logos, no captions, no watermarks."
)
STILL_006 = (
    "Extreme close-up macro of HER LEFT WRIST and LEFT HAND, 9:16 vertical. "
    "Late-20s beautiful blonde woman astronaut, navy-and-gold flight-suit sleeve "
    "filling the frame. A rectangular blocky SQUARE gunmetal wrist computer is "
    "strapped exactly onto her LEFT wrist bone (the joint between forearm and "
    "hand), housing no wider than the wrist. The device is a thick square box: "
    "brushed dark gunmetal, exposed screws, square amber-orange screen with only "
    "slightly rounded corners, square or rectangular buttons and sliders on the "
    "SIDES of the box. NO ROUND SHAPES: not a round watch face, not a circular "
    "bezel, not a curved CRT, not rotary knobs, not round gauges, not a Pip-Boy "
    "gauntlet. ALWAYS on her LEFT hand — never the right hand, never a floating "
    "device with no person attached. Her left palm, fingers, and thumb continue "
    "past the strap and stay fully visible, anatomically correct. The screen "
    "flashes a nearly empty amber-red charge bar and the blocky uppercase words "
    "'MOTS-C LOW' in warning red, glow reflecting on the housing. Screen text is "
    "tack sharp and perfectly legible, exactly the characters 'MOTS-C LOW'. "
    "Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No "
    "readable text anywhere except the wrist-device screen. No logos, no "
    "captions, no watermarks."
)

ASTRONAUT_EDIT = (
    "Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest "
    "patch, lighting, backdrop, and pose. Put a rectangular blocky SQUARE "
    "gunmetal wrist computer on her LEFT wrist joint only. Square housing, "
    "square amber-orange screen, square or rectangular side buttons. NO ROUND "
    "SHAPES — not a round watch, not a curved CRT, not rotary knobs. ALWAYS on "
    "her left hand / left wrist, never the right hand. Left palm, fingers, and "
    "thumb stay fully visible past the strap. Do not change her face."
)
FILM003_EDIT = (
    "Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest "
    "patch, lighting, and gray backdrop. Fix anatomy: exactly two arms and two "
    "hands, no extra limbs, no extra fingers, no third hand. Move the device OFF "
    "the bicep, upper arm, and forearm, and OFF any arm-across-chest pose. Put a "
    "rectangular blocky SQUARE gunmetal computer on her LEFT WRIST JOINT only, "
    "left arm hanging naturally at her side in true left profile. Square housing, "
    "square amber-orange screen with slightly rounded corners, square or "
    "rectangular side buttons. NO ROUND SHAPES — not a round watch, not a curved "
    "CRT, not rotary knobs. ALWAYS on her left hand, never the right hand. Left "
    "hand stays visible past the strap. Do not change her face."
)
DEVICE_EDIT = (
    "Keep this exact left hand, navy flight-suit sleeve, lighting, and square "
    "gunmetal wrist computer. The device must stay a rectangular blocky SQUARE "
    "box on her LEFT wrist joint only — square housing, square amber-orange "
    "screen, square or rectangular side buttons. NO ROUND SHAPES: not a round "
    "watch, not a curved CRT, not rotary knobs. ALWAYS on the left hand, never "
    "the right hand, never a floating prop. Left palm, fingers, and thumb stay "
    "fully visible past the strap. Do not change the screen text."
)

ASTRONAUT_IDS = {"FILM-001", "FILM-002", "FILM-004", "FILM-019", "FILM-021"}


def must_replace_any(text: str, olds: tuple[str, ...] | str, new: str, still_id: str) -> str:
    if isinstance(olds, str):
        olds = (olds,)
    for old in olds:
        if old in text:
            return text.replace(old, new)
    raise SystemExit(f"{still_id} missing expected phrase: {olds[0][:80]}")


def lock_row(row: dict[str, str]) -> None:
    still_id = row["still_id"]
    prompt = row["still_prompt"]
    if still_id == "FILM-005":
        row["still_prompt"] = STILL_005
        row["still_edit_prompt"] = DEVICE_EDIT
    elif still_id == "FILM-006":
        row["still_prompt"] = STILL_006
        row["still_edit_prompt"] = DEVICE_EDIT
    elif still_id == "FILM-003":
        prompt = must_replace_any(prompt, FILM003_CRT_OLD, FILM003_CRT_NEW, still_id)
        prompt = must_replace_any(prompt, FILM003_ROTARY_OLD, FILM003_ROTARY_NEW, still_id)
        row["still_prompt"] = prompt
        row["still_edit_prompt"] = FILM003_EDIT
    elif still_id in ASTRONAUT_IDS:
        prompt = must_replace_any(prompt, ROTARY_PHRASE, SQUARE_LOCK, still_id)
        prompt = must_replace_any(prompt, SMARTWATCH_OLDS, SMARTWATCH_NEW, still_id)
        row["still_prompt"] = prompt
        row["still_edit_prompt"] = ASTRONAUT_EDIT


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    locked = 0
    for row in rows:
        if row["still_id"] in ASTRONAUT_IDS | {"FILM-003", "FILM-005", "FILM-006"}:
            lock_row(row)
            locked += 1
    if locked != 8:
        raise SystemExit(f"expected 8 rows, got {locked}")
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
