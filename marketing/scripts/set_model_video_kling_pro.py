#!/usr/bin/env python3
"""Point the three vid-gen tabs at fal Kling v3 Pro image-to-video.

Salvatore asked for all three vid-gen workflows to run fal Kling 3.0 Pro at
1080p. `model_video` is a sheet-owned field, so the slug has to change on the
sheet (and its repo mirror) rather than inside an n8n node.

Only the mirrors of tabs the three workflows actually read are touched. The
legacy `7-unique-reel-creations-500` library and the `12-import-still-queue`
still queue are left alone -- they do not feed these workflows.

Run: python3 marketing/scripts/set_model_video_kling_pro.py
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

OLD_SLUG = "grok-imagine-video-1.5"
NEW_SLUG = "fal-ai/kling-video/v3/pro/image-to-video"

SHEETS_DIR = Path(__file__).resolve().parent.parent / "sheets"

# Live tabs read by Vid_gen_lab_scenes / peptide_pen_vid_gen /
# Vid_gen_landscape_scenes, plus the staged batches that get appended to them.
TARGETS = (
    "9-lab-item-creations-500.csv",
    "9-lab-item-creations-501-535-new.csv",
    "14-pen-creations-150.csv",
    "14-pen-creations-new-36.csv",
    "500_Peptide_Wellness_Reel_Scenes.csv",
    "500-wellness-new-5.csv",
)


def column_only(path: Path) -> int:
    """Count model_video cells holding the old slug, and refuse if it leaks elsewhere.

    A plain text replace keeps the diff minimal, but only stays safe while the
    slug appears in exactly one column. This asserts that before we rewrite.
    """
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        if "model_video" not in (reader.fieldnames or []):
            raise SystemExit(f"{path.name}: no model_video column")
        in_column = 0
        for row in reader:
            for field, value in row.items():
                if value and OLD_SLUG in str(value):
                    if field != "model_video":
                        raise SystemExit(
                            f"{path.name}: {OLD_SLUG} also appears in "
                            f"{field!r} -- a text replace would corrupt it"
                        )
                    in_column += 1
    return in_column


def main() -> int:
    total = 0
    for name in TARGETS:
        path = SHEETS_DIR / name
        if not path.exists():
            raise SystemExit(f"missing sheet mirror: {path}")

        expected = column_only(path)
        text = path.read_text(encoding="utf-8")
        found = text.count(OLD_SLUG)
        if found != expected:
            raise SystemExit(
                f"{name}: {found} raw matches but {expected} model_video cells"
            )
        if found:
            path.write_text(text.replace(OLD_SLUG, NEW_SLUG), encoding="utf-8")

        after = column_only(path)
        if after:
            raise SystemExit(f"{name}: {after} rows still on {OLD_SLUG}")
        print(f"{name}: {found} rows -> {NEW_SLUG}")
        total += found

    print(f"\n{total} rows repointed across {len(TARGETS)} mirrors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
