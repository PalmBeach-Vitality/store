#!/usr/bin/env python3
"""Confirm FILM-015 / 020 keepers: minor hull damage is correct."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PICKED_015 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-7fa5cb73-d4fb-992d-b288-9f5df5ad574b-96d99939.png"
)
PICKED_020 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3af0ba63-c3c0-9700-97d6-1c596053b963-54b3e952.png"
)
EDIT_015 = (
    "Keep this exact camera, beach, and ship. Hull damage is already correct: "
    "only minor scorch and light scoring. Do not add wreckage. Do not tear the "
    "ship open. Do not change the hull."
)
EDIT_020 = (
    "Keep this exact plunge camera and ship. Hull damage is already correct: "
    "only minor scoring and heat glow. Do not break the ship apart. Do not add "
    "wreckage. Do not change the hull."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        sid = (row.get("still_id") or "").strip()
        if sid == "FILM-015":
            row["picked_url"] = PICKED_015
            row["still_edit_prompt"] = EDIT_015
            row["times_used"] = "1"
            if not (row.get("take_urls") or "").strip():
                row["take_urls"] = PICKED_015
            locked += 1
        elif sid == "FILM-020":
            row["picked_url"] = PICKED_020
            row["still_edit_prompt"] = EDIT_020
            locked += 1

    if locked != 2:
        raise SystemExit(f"expected 2 keeper rows, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked {locked} keeper rows in {CSV_PATH}")


if __name__ == "__main__":
    main()
