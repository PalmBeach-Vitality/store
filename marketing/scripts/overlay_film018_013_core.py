#!/usr/bin/env python3
"""Lock FILM-018 / FILM-019 to the FILM-013 circular brushed-metal core."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

VIAL = (
    "Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue "
    "plastic flip-off cap on a brushed-silver aluminum crimp over a rubber septum, "
    "clean white wrap-around label with a dark maroon DNA double-helix icon "
    "centered at the top, the name 'MOTS-C' in large bold dark maroon sans-serif "
    "printed once, a solid dark maroon rectangle badge with white text exactly '10mg'."
)
CORE = (
    "SAME engine core as FILM-013 / core_port_dim: a circular recessed well of "
    "concentric dark charcoal brushed-metal rings, hex bolts, segmented gunmetal "
    "plates. Thin gold energy conduits run as radial spokes recessed into the metal "
    "like veins. Camera looks slightly down into that circular well. NOT a faceted "
    "crystal ring. NOT a glass jewel socket. NOT a nest of thick ribbed rubber hoses "
    "filling the frame. NOT a large radar or HUD monitor as the hero."
)
STILL_018 = (
    "Opening keyframe, 9:16 vertical. Macro of the SAME engine core port as FILM-013. "
    f"{CORE} {VIAL} The vial stands perfectly vertical and upright in the "
    "brushed-metal socket — not tilted, not leaning. The golden liquid glow is "
    "fading and flickering (not full-bright, not fully dead). Gold conduits dim one "
    "by one. A red warning glow begins to pulse at the frame edges. Tense cinematic "
    "mood. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No "
    "people, no astronaut, no hands, no wrist device, no extra vials. No readable "
    "text anywhere except the vial label. No logos, no captions, no watermarks."
)
EDIT_018 = (
    "Keep this EXACT FILM-013 circular brushed-metal core: same concentric rings, "
    "same hex bolts, same radial gold vein conduits, same camera looking down into "
    "the well. Delete any faceted crystal ring, jewel socket, ribbed hose nest, or "
    "radar HUD. Keep the MOTS-C 10mg vial perfectly vertical in the metal socket. "
    "Drain only partway: glow fading and flickering, conduits dimming, red warning "
    "starting. No people, no hands, no extra vials."
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
    "and looks down at her raised left wrist, left hand and fingers still fully "
    "visible: the wrist device screen flashes an almost-empty amber-red bar and "
    "blocky uppercase MOTS-C LOW, text tack sharp. BACKGROUND must be that SAME "
    "FILM-013 core — circular brushed-metal well, concentric rings, dim gold radial "
    "vein conduits, red warning glow — slightly out of focus behind her wrist. NOT "
    "a different cockpit. NOT a space canopy. NOT a crystal socket. NOT a hose nest. "
    "NOT a radar HUD hero. Photoreal cinematic sci-fi commercial still, 8k, HDR, "
    "razor sharp. No readable text anywhere except the wrist-device screen. No logos, "
    "no captions, no watermarks, no people other than the astronaut."
)
EDIT_019 = (
    "Keep this exact woman, face, hair, flight suit, and square LEFT-wrist device "
    "with MOTS-C LOW. Change the background to the FILM-013 circular brushed-metal "
    "core well: concentric rings, hex bolts, dim gold radial vein conduits, red "
    "warning glow behind her wrist. Remove any crystal socket, hose nest, radar HUD, "
    "or space canopy. Do not change her face or the square device."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        sid = (row.get("still_id") or "").strip()
        if sid == "FILM-018":
            row["still_prompt"] = STILL_018
            row["still_edit_prompt"] = EDIT_018
            row["take_urls"] = ""
            row["times_used"] = "0"
            locked += 1
        elif sid == "FILM-019":
            row["still_prompt"] = STILL_019
            row["still_edit_prompt"] = EDIT_019
            locked += 1

    if locked != 2:
        raise SystemExit(f"expected FILM-018 and FILM-019, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked {locked} rows in {CSV_PATH}")


if __name__ == "__main__":
    main()
