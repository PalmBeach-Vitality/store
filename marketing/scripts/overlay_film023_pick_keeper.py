#!/usr/bin/env python3
"""Save FILM-023 keeper pick and lock the wrist-orientation edit prompt."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PICKED_023 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-490e8b55.png"
)
EDIT_023 = (
    "Keep this exact handoff camera, vial, alien pearl-white fingers, and BARE "
    "LEFT astronaut palm. Do not add gloves. ONLY rotate the square gunmetal "
    "wrist device into FILM-004 watch orientation: screen on the BACK of the "
    "LEFT wrist facing out, TOP of the MOTS-C text toward the fingers, BOTTOM "
    "toward the forearm. NOT rotated 90 degrees. NOT sideways toward the thumb. "
    "NOT a long rectangle along the forearm. NOT a medical HUD. No other changes."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        if (row.get("still_id") or "").strip() == "FILM-023":
            row["picked_url"] = PICKED_023
            row["still_edit_prompt"] = EDIT_023
            locked += 1

    if locked != 1:
        raise SystemExit(f"expected 1 FILM-023 row, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked pick on {locked} row in {CSV_PATH}")


if __name__ == "__main__":
    main()
