#!/usr/bin/env python3
"""Lock FILM-003 identity_side: left-profile wrist, two arms, square device."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

STILL = (
    "Studio-lit identity portrait, true anatomical LEFT side profile, head and shoulders, "
    "9:16 vertical. Camera is on her left side so her left ear, left cheek, and left arm "
    "are nearest the lens. Late-20s beautiful blonde woman astronaut, long golden-blonde "
    "hair in a low ponytail, bright green eyes, light freckles, athletic build, "
    "navy-and-gold flight suit with a small circular Palm Beach chest patch, helmet off. "
    "Exactly ONE head, TWO arms, TWO hands, TEN fingers — no extra limbs, no extra arms, "
    "no extra hands, no extra fingers, no fused joints, no truncated forearm. Her left arm "
    "hangs naturally down at her left side, slightly in front of her hip so the LEFT WRIST "
    "is visible in the lower frame. Do not bend the left arm across her chest. Do not raise "
    "the device to her chin. Do not put the device on her bicep, upper arm, or forearm. A "
    "square boxy watch-scale retro-futuristic wrist computer is strapped exactly onto her "
    "left wrist bone (the joint between forearm and hand), housing no wider than her wrist. "
    "The device is SQUARE: square dark gunmetal housing, square amber CRT screen with only "
    "slightly rounded corners, small square face. Not round, not circular, not a round watch, "
    "not a round CRT disc, not a round gauge, not a Pip-Boy gauntlet. Small rotary dials sit "
    "on the sides of the square housing, not as giant round knobs that make the silhouette "
    "circular. Her left hand, palm, fingers, and thumb continue past the strap and stay fully "
    "visible, anatomically correct. The right arm stays behind her torso in true profile — "
    "do not invent a second left arm to show the watch. Neutral soft gray backdrop, even "
    "cinematic key light, natural confident expression. Photoreal cinematic sci-fi commercial "
    "still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the "
    "wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut."
)

EDIT = (
    "Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, lighting, "
    "and gray backdrop. Fix anatomy: exactly two arms and two hands, no extra limbs, no extra "
    "fingers, no third hand. Move the device OFF the bicep, upper arm, and forearm, and OFF "
    "any arm-across-chest pose. Put a SQUARE watch-scale computer on her LEFT WRIST JOINT only, "
    "left arm hanging naturally at her side in true left profile. Square housing, square amber "
    "screen with slightly rounded corners — not round, not a circular watch face. Left hand "
    "stays visible past the strap. Do not change her face."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    for row in rows:
        if row["still_id"] == "FILM-003":
            row["still_prompt"] = STILL
            row["still_edit_prompt"] = EDIT
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
