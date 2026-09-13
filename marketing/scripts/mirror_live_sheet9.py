#!/usr/bin/env python3
"""Mirror the live 9-lab-item-creations-500 Google Sheet into the repo.

The live sheet is the source of truth for this tab. Earlier compound
rotations were applied live but never mirrored, so the repo copy drifted
(27 compounds + 62 blanks in the repo vs 16 compounds live).

Input is a CSV export of the live tab. Usage:

    python3 marketing/scripts/mirror_live_sheet9.py <live-export.csv>
"""

from __future__ import annotations

import csv
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV_TARGETS = ("9-lab-item-creations-500.csv", "9-lab-item-creations-250.csv")
JSON_TARGETS = (
    "pbvita-500-lab-item-creations.json",
    "pbvita-250-lab-item-creations.json",
)

EXPECTED_COLUMNS = [
    "creation_id",
    "rank",
    "lab_item_id",
    "category",
    "lab_item",
    "material_detail",
    "compound_name",
    "shot_family",
    "camera_angle",
    "camera_direction",
    "framing",
    "scene_brief",
    "quality_var_count",
    "quality_suffix",
    "aspect_ratio",
    "duration_seconds",
    "resolution",
    "model_still",
    "model_video",
    "still_resolution",
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "status",
    "times_used",
    "last_used_at",
    "surface",
    "lighting",
    "camera_move",
    "color_grade",
    "hero_style",
]


def load(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != EXPECTED_COLUMNS:
            raise SystemExit(
                "Live export column order does not match the locked schema.\n"
                f"  got:      {reader.fieldnames}\n"
                f"  expected: {EXPECTED_COLUMNS}"
            )
        return [dict(row) for row in reader]


def check(rows: list[dict[str, str]]) -> None:
    if not rows:
        raise SystemExit("Live export is empty.")

    ids = Counter(r["creation_id"] for r in rows)
    dupes = sorted(k for k, n in ids.items() if n > 1)
    if dupes:
        raise SystemExit(f"Duplicate creation_id in live export: {dupes}")

    blank = [r["creation_id"] for r in rows if not r["compound_name"].strip()]
    if blank:
        raise SystemExit(f"Live export has blank compound_name rows: {blank}")

    # Hard constants the studio locks for this tab.
    for field, want in (
        ("aspect_ratio", "9:16"),
        ("duration_seconds", "15"),
        ("resolution", "1080p"),
    ):
        offenders = sorted({r[field] for r in rows if r[field].strip() != want})
        if offenders:
            raise SystemExit(f"Live export has unexpected {field}: {offenders}")


def write(rows: list[dict[str, str]]) -> None:
    for name in CSV_TARGETS:
        path = SHEETS / name
        with path.open("w", newline="\n", encoding="utf-8") as handle:
            writer = csv.DictWriter(
                handle, fieldnames=EXPECTED_COLUMNS, lineterminator="\n"
            )
            writer.writeheader()
            writer.writerows(rows)
        print(f"wrote {path.relative_to(ROOT.parent)} ({len(rows)} rows)")

    payload = {"count": len(rows), "creations": rows}
    for name in JSON_TARGETS:
        path = ROOT / name
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT.parent)}")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(f"usage: {sys.argv[0]} <live-export.csv>")
    rows = load(Path(sys.argv[1]))
    check(rows)
    write(rows)

    counts = Counter(r["compound_name"] for r in rows)
    print(f"\n{len(rows)} rows, {len(counts)} compounds:")
    for name, n in counts.most_common():
        print(f"  {n:3d}  {name}")


if __name__ == "__main__":
    main()
