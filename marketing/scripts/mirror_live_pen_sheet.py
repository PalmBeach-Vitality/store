#!/usr/bin/env python3
"""Mirror the live 14-pen-creations-150 tab into the repo.

Same story as Sheet 9: the live tab is the source of truth and the repo copy
had drifted. Every one of the 150 rows differed on video_prompt,
video_motion_prompt, scene_brief, still_edit_prompt, lab_item,
material_detail, quality_suffix and hero_style, five differed on
compound_name, and the repo was missing the still_n column entirely — which
matters because pull_sheet_row lists still_n as required and throws without
it.

Input is a JSON array of the live rows, as read by a Google Sheets node.

    python3 marketing/scripts/mirror_live_pen_sheet.py <live-rows.json>
"""

from __future__ import annotations

import csv
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "sheets" / "14-pen-creations-150.csv"

# Sheet order. row_number is a Google Sheets read artifact, not a column.
COLUMNS = [
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
    "still_n",
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

# pull_sheet_row throws if any of these are blank on the matched row.
REQUIRED = [
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "camera_move",
    "model_still",
    "model_video",
    "still_resolution",
    "still_n",
    "duration_seconds",
    "resolution",
    "aspect_ratio",
]


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit(f"usage: {sys.argv[0]} <live-rows.json>")

    rows = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    if not rows:
        raise SystemExit("live export is empty")

    ids = Counter(r["creation_id"] for r in rows)
    dupes = sorted(k for k, n in ids.items() if n > 1)
    if dupes:
        raise SystemExit(f"duplicate creation_id in live export: {dupes}")

    for field in REQUIRED:
        blank = [r["creation_id"] for r in rows if not str(r.get(field, "")).strip()]
        if blank:
            raise SystemExit(f"{field} blank on {len(blank)} rows, e.g. {blank[:5]}")

    for field, want in (
        ("aspect_ratio", "9:16"),
        ("duration_seconds", "15"),
        ("resolution", "1080p"),
    ):
        off = sorted({str(r[field]) for r in rows if str(r[field]).strip() != want})
        if off:
            raise SystemExit(f"unexpected {field}: {off}")

    with TARGET.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=COLUMNS, lineterminator="\n", extrasaction="ignore"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in COLUMNS})
    print(f"wrote {TARGET.relative_to(ROOT.parent)} ({len(rows)} rows)")

    counts = Counter(r["compound_name"] for r in rows)
    print(f"\n{len(rows)} rows, {len(counts)} compounds:")
    for name, n in counts.most_common():
        print(f"  {n:3d}  {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
