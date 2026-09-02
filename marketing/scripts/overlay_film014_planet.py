#!/usr/bin/env python3
"""Lock FILM-014 to an alien-galaxy coast with no people or vials."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PLANET = (
    "Alien-galaxy luxury coast — same wide empty shoreline idea as Palm Beach, "
    "but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent "
    "crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white "
    "Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller "
    "glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes "
    "against the sky. Twin oversized moons hang huge and close in a deep "
    "violet-magenta sky with alien stars. Water is turquoise with a golden "
    "bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon."
)
STILL_014 = (
    "Wide establishing shot, 9:16 vertical. Empty alien-galaxy luxury coastline "
    f"filling the frame. {PLANET} Vast lonely coastal scale, no buildings, no boats, "
    "no cities, no Earth landmarks, no Miami skyline. Photoreal cinematic sci-fi "
    "commercial still, 8k, HDR, razor sharp. NO other objects in the image: no people, "
    "no astronaut, no hands, no vial, no bottle, no wrist device, no watch, no gloves, "
    "no floating props. No readable text, no logos, no captions, no watermarks."
)
EDIT_014 = (
    "Keep this exact empty coastline camera. Remove every person, hand, astronaut, "
    "vial, bottle, wrist device, and floating prop. Make the sand and trees look like "
    "another galaxy: iridescent lilac-gold glowing sand, glass-veined bioluminescent "
    "teal-violet trees that are not Earth palms, twin huge moons, violet-magenta sky. "
    "Not Earth, not Miami, not Florida."
)
OLD_PLANET = (
    "Otherworldly Palm Beach coast: recognizable luxury beach — pale sugar-white "
    "sand, turquoise shallows, royal palms — but clearly another planet. Twin "
    "moons hang huge in a violet-amber sky, the ocean has a faint golden "
    "bioluminescent sheen at the horizon, palm fronds catch an alien teal-gold "
    "light, sand has a subtle opalescent sparkle, cinematic teal-orange grade. "
    "Not Earth Miami, not a rust-red desert, not a canyon"
)
OLD_SAND = (
    "Standing calmly on pale opalescent beach sand, twin moons and turquoise "
    "water behind, soft amber sky light"
)
NEW_SAND = (
    "Standing calmly on iridescent lilac-gold alien-galaxy beach sand, "
    "glass-veined bioluminescent teal-violet trees and twin huge moons behind, "
    "soft violet-amber sky light. Not Earth, not Florida palms"
)
OLD_SHORE = (
    "beside her smoking crashed ship on the pale otherworldly Palm Beach shoreline"
)
NEW_SHORE = (
    "beside her smoking crashed ship on the iridescent lilac-gold alien-galaxy shoreline"
)
PLANET_IDS = {"FILM-015", "FILM-020", "FILM-025"}


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    locked = 0
    for row in rows:
        still_id = row["still_id"]
        if still_id == "FILM-014":
            row["still_prompt"] = STILL_014
            row["still_edit_prompt"] = EDIT_014
            locked += 1
            continue
        prompt = row["still_prompt"]
        nxt = prompt
        if still_id in PLANET_IDS:
            if OLD_PLANET not in nxt:
                raise SystemExit(f"{still_id} missing OLD_PLANET")
            nxt = nxt.replace(OLD_PLANET, PLANET)
        if still_id == "FILM-016" and OLD_SAND in nxt:
            nxt = nxt.replace(OLD_SAND, NEW_SAND)
        if still_id == "FILM-021" and OLD_SHORE in nxt:
            nxt = nxt.replace(OLD_SHORE, NEW_SHORE)
        if nxt != prompt:
            row["still_prompt"] = nxt
            locked += 1
    if locked < 4:
        raise SystemExit(f"expected 4+ rows, got {locked}")
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"locked {locked} rows")


if __name__ == "__main__":
    main()
