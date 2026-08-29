#!/usr/bin/env python3
"""Lock FILM-023/024 device to FILM-005/006 orientation (MOTS-C toward elbow)."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

OLD_ORIENT = (
    "Watch orientation: the screen sits on the back of the wrist facing OUT, "
    "not toward the palm. The TOP of the screen (MOTS-C text) points toward "
    "her fingers; the BOTTOM of the screen points toward her forearm."
)
NEW_ORIENT = (
    "SAME screen orientation as FILM-005 and FILM-006: the screen sits on the "
    "back of the wrist facing OUT, not toward the palm. The TOP of the screen "
    "(MOTS-C text) points toward her forearm / elbow; the BOTTOM of the screen "
    "points toward her fingers."
)

EDIT_023 = (
    "Keep this exact handoff camera, vial, alien pearl-white fingers, and BARE "
    "LEFT astronaut palm. Do not add gloves. ONLY rotate the square gunmetal "
    "wrist device to match FILM-005 and FILM-006: screen on the BACK of the "
    "LEFT wrist, TOP of the MOTS-C text toward the forearm / elbow, BOTTOM of "
    "the MOTS-C text toward the fingers. Screen text stays MOTS-C only — do "
    "not print FILM-004 or any other extra words. NOT rotated 90 degrees. NOT "
    "sideways toward the thumb. NOT a long rectangle along the forearm. NOT a "
    "medical HUD. No other changes."
)
EDIT_024 = (
    "Keep this exact insert camera and vial. REMOVE every glove. Bare LEFT "
    "hand only. Square device on the BACK of her LEFT wrist, SAME orientation "
    "as FILM-005 / FILM-006: MOTS-C text toward the forearm / elbow, bottom "
    "toward the fingers, not rotated 90 degrees. Seat the vial in the "
    "FILM-013 circular brushed-metal well, not a crystal socket. No gloves."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        still_id = (row.get("still_id") or "").strip()
        if still_id not in {"FILM-023", "FILM-024"}:
            continue
        prompt = row.get("still_prompt") or ""
        if OLD_ORIENT not in prompt:
            raise SystemExit(
                f"{still_id} still_prompt missing expected orientation lock"
            )
        row["still_prompt"] = prompt.replace(OLD_ORIENT, NEW_ORIENT)
        row["still_edit_prompt"] = EDIT_023 if still_id == "FILM-023" else EDIT_024
        locked += 1

    if locked != 2:
        raise SystemExit(f"expected 2 rows, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked 005/006 orientation on {locked} rows in {CSV_PATH}")


if __name__ == "__main__":
    main()
