#!/usr/bin/env python3
"""Lock FILM-023/024: device on TOP of the wrist, never underneath."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

OLD_PLACE = (
    "a rectangular blocky SQUARE gunmetal box strapped exactly onto the BACK "
    "(dorsal / outer side) of her LEFT wrist bone, housing no wider than the wrist."
)
NEW_PLACE = (
    "a rectangular blocky SQUARE gunmetal box strapped exactly onto the TOP of "
    "her LEFT wrist — the BACK / dorsal / outer side, same as a normal watch "
    "and as FILM-005 / FILM-006, housing no wider than the wrist. NEVER "
    "underneath the wrist. NEVER on the inner wrist. NEVER on the palm side."
)
EDIT_023 = (
    "Keep this exact handoff camera, vial, alien pearl-white fingers, and BARE "
    "LEFT open palm. Do not add gloves. The square gunmetal device is on the "
    "WRONG side of the wrist: it is sitting UNDERNEATH / on the inner wrist / "
    "palm side. MOVE the entire box onto the TOP of the LEFT wrist — the BACK "
    "of the wrist — SAME as FILM-005 and FILM-006. Like a watch. Screen faces "
    "out from the TOP of the wrist, away from the palm. Because the palm faces "
    "the camera, the device sits on the far side of the wrist; the camera may "
    "see only the side edge of the box. NOT under the wrist. NOT on the inner "
    "wrist. NOT a face-on screen on the palm side. Do not just rotate the text. "
    "Screen text stays MOTS-C only. No other changes."
)
EDIT_024 = (
    "Keep this exact insert camera and vial. Bare LEFT hand only. MOVE the "
    "square device onto the TOP of the LEFT wrist, the BACK of the wrist, SAME "
    "as FILM-005 / FILM-006. NEVER underneath. NEVER on the inner wrist. Seat "
    "the vial in the FILM-013 circular brushed-metal well. No gloves."
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
        if OLD_PLACE not in prompt:
            raise SystemExit(f"{still_id} still_prompt missing expected placement lock")
        row["still_prompt"] = prompt.replace(OLD_PLACE, NEW_PLACE)
        row["still_edit_prompt"] = EDIT_023 if still_id == "FILM-023" else EDIT_024
        locked += 1

    if locked != 2:
        raise SystemExit(f"expected 2 rows, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked device-on-top on {locked} rows in {CSV_PATH}")


if __name__ == "__main__":
    main()
