#!/usr/bin/env python3
"""Apply otherworldly Palm Beach planet lock to 18-motsc-film-stills.csv."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PLANET_ESTABLISH = (
    "Wide establishing shot of an otherworldly Palm Beach. You recognize it "
    "instantly as a luxury beach — pale sugar-white sand, turquoise shallows, "
    "a quiet line of royal palms — but it is clearly another planet. Twin moons "
    "hang huge and close in a violet-amber sky. The water holds a faint golden "
    "bioluminescent sheen at the horizon. Palm fronds catch an alien teal-gold "
    "rim light. The sand has a subtle opalescent sparkle, like crushed pearl. "
    "Vast lonely coastal scale, no buildings, no boats, no people, no creatures. "
    "Cinematic teal-orange grade. Not Earth Miami, not a rust-red desert, not a "
    "canyon. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. "
    "No readable text anywhere except the vial label and the wrist-device screen. "
    "No logos, no captions, no watermarks."
)

OLD_PLANET = (
    "Rust-red desert planet, deep dusty canyon, distant twin moons in a "
    "violet-amber sky, wind-blown fine dust, cinematic teal-orange grade"
)
NEW_PLANET = (
    "Otherworldly Palm Beach coast: recognizable luxury beach — pale sugar-white "
    "sand, turquoise shallows, royal palms — but clearly another planet. Twin "
    "moons hang huge in a violet-amber sky, the ocean has a faint golden "
    "bioluminescent sheen at the horizon, palm fronds catch an alien teal-gold "
    "light, sand has a subtle opalescent sparkle, cinematic teal-orange grade. "
    "Not Earth Miami, not a rust-red desert, not a canyon"
)

REPLACES = [
    (
        "at the bottom of a dusty red canyon, long skid trench behind it, hull scorched and dented but intact, thin smoke rising, dust settling",
        "on the pale otherworldly beach, a long skid trench in the sugar sand behind it, hull scorched and dented but intact, thin smoke rising, spray and sand settling",
    ),
    (
        "plunging into the rust-red canyon trailing fire and dust, heat glow on the hull, impact plume beginning at the canyon floor",
        "plunging toward the otherworldly Palm Beach shoreline trailing fire and spray, heat glow on the hull, impact plume beginning in the shallows and sand",
    ),
    (
        "Standing calmly on rust-red canyon ground, soft amber sky light",
        "Standing calmly on pale opalescent beach sand, twin moons and turquoise water behind, soft amber sky light",
    ),
    (
        "beside her smoking crashed ship in the red canyon",
        "beside her smoking crashed ship on the pale otherworldly Palm Beach shoreline",
    ),
    (
        "walks toward camera across the canyon floor",
        "walks toward camera along the pale shoreline",
    ),
    ("dusk canyon bokeh", "dusk ocean and palm bokeh"),
    (
        "lifting off from the canyon floor on pillars of golden-white engine light, dust blasting outward",
        "lifting off from the pale beach on pillars of golden-white engine light, sand and spray blasting outward",
    ),
    (OLD_PLANET, NEW_PLANET),
]


def lock_prompt(text: str) -> str:
    t = text or ""
    for old, new in REPLACES:
        t = t.replace(old, new)
    return t.strip()[:7900]


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    changed = 0
    found_establish = False
    for row in rows:
        still_id = (row.get("still_id") or "").strip()
        if still_id == "FILM-014":
            row["still_prompt"] = PLANET_ESTABLISH[:7900]
            found_establish = True
            changed += 1
            continue
        nxt = lock_prompt(row.get("still_prompt") or "")
        if nxt != (row.get("still_prompt") or ""):
            row["still_prompt"] = nxt
            changed += 1

    if not found_establish:
        raise SystemExit("FILM-014 planet_establish missing")
    leftover = [
        row["still_id"]
        for row in rows
        if "Rust-red desert planet" in (row.get("still_prompt") or "")
        or "dusty red canyon" in (row.get("still_prompt") or "")
    ]
    if leftover:
        raise SystemExit(f"leftover rust-canyon language: {leftover}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {CSV_PATH} changed_rows={changed}")


if __name__ == "__main__":
    main()
