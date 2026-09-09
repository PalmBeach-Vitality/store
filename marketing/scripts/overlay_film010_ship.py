#!/usr/bin/env python3
"""Lock FILM-010 (and matching hull stills) to a large sleek ship, no extra props."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

HULL = (
    "A MUCH LARGER sleek stealth interceptor, capital-scout scale: elongated "
    "arrowhead wedge silhouette, needle nose flaring into a broad blended-wing "
    "rear, dark matte charcoal gunmetal plating with dense panel lines and "
    "greebles. The faceted cockpit canopy is tiny relative to the hull so the "
    "ship reads as a long vessel, not a toy, not a one-person fighter, not a "
    "white luxury shuttle. Thin cyan-blue energy strips run along the sides and "
    "dorsal spine. Twin circular rear engine nozzles with a cool blue inner glow. "
    "One subtle thin navy-and-gold identity stripe on the upper hull. No readable "
    "hull text."
)
STILL_009 = (
    "Establishing still, 9:16 vertical. Three-quarter front view of a starship "
    "isolated in a clean deep-space void. The ship fills most of the frame. "
    f"{HULL} Soft key from a distant sun, empty star field, no other craft, no "
    "planets, no debris. Photoreal cinematic sci-fi commercial still, 8k, HDR, "
    "razor sharp. NO other objects in the image: no people, no hands, no "
    "astronaut, no vial, no wrist device, no watch, no gloves, no floating "
    "props. No readable text, no logos, no captions, no watermarks."
)
STILL_010 = (
    "Establishing still, 9:16 vertical. Clean FULL SIDE PROFILE of the same "
    "starship in flight, isolated, hull filling the frame from needle nose to "
    f"twin engines. {HULL} Identical hull design and paint as the three-quarter "
    "view. Empty deep-space void, no other craft, no planets, no debris. "
    "Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. NO other "
    "objects in the image: no people, no hands, no astronaut, no vial, no wrist "
    "device, no watch, no gloves, no floating props. No readable text, no logos, "
    "no captions, no watermarks."
)
SHIP_EDIT = (
    "Keep this exact ship angle and lighting. Remove every extra object: no "
    "hands, no vials, no wrist devices, no people, no gloves, no floating props. "
    "Make the ship MUCH LARGER and sleeker: elongated dark charcoal gunmetal "
    "arrowhead interceptor, tiny cockpit canopy relative to the hull, cyan-blue "
    "energy strips, twin circular blue engines. Empty space only."
)
HULL_OLD = (
    "Sleek compact single-pilot starship, smooth white hull with navy-and-gold "
    "accent striping, no readable text on the hull, cinematic teal-orange grade."
)
EXCEPT_OLD = (
    "No readable text anywhere except the vial label and the wrist-device "
    "screen. No logos, no captions, no watermarks, no people."
)
EXCEPT_NEW = (
    "No readable text, no logos, no captions, no watermarks. NO people, NO "
    "hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props."
)
HULL_IDS = {"FILM-015", "FILM-020", "FILM-025"}


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    locked = 0
    for row in rows:
        still_id = row["still_id"]
        if still_id == "FILM-009":
            row["still_prompt"] = STILL_009
            row["still_edit_prompt"] = SHIP_EDIT
            locked += 1
        elif still_id == "FILM-010":
            row["still_prompt"] = STILL_010
            row["still_edit_prompt"] = SHIP_EDIT
            locked += 1
        elif still_id in HULL_IDS:
            prompt = row["still_prompt"]
            if HULL_OLD not in prompt:
                raise SystemExit(f"{still_id} missing hull phrase")
            prompt = prompt.replace(HULL_OLD, HULL)
            prompt = prompt.replace(EXCEPT_OLD, EXCEPT_NEW)
            row["still_prompt"] = prompt
            locked += 1
    if locked != 5:
        raise SystemExit(f"expected 5 rows, got {locked}")
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
