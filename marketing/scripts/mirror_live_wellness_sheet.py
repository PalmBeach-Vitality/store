#!/usr/bin/env python3
"""Mirror the live 500_Peptide_Wellness_Reel_Scenes tab into the repo.

The repo copy had drifted 688 of 750 rows behind live: live had been switched
to the KLOW / GLOW / Wolverine nicknames in compound_name (and through the
prompt text), and the VIAL DOSE LOCK clause had been deleted from
video_prompt. Live is the source of truth.

Reads a JSON dump of the live rows produced by a throwaway read workflow.

Usage:
    python3 marketing/scripts/mirror_live_wellness_sheet.py /tmp/wellness_live.json
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SHEET = REPO / "marketing/sheets/500_Peptide_Wellness_Reel_Scenes.csv"


def cell(v) -> str:
    if v is True:
        return "TRUE"
    if v is False:
        return "FALSE"
    if v is None:
        return ""
    return str(v)


def main(dump: str) -> int:
    live = json.loads(Path(dump).read_text())

    with SHEET.open(newline="", encoding="utf-8") as fh:
        fields = csv.DictReader(fh).fieldnames
    assert fields, "mirror has no header"

    extra = [k for k in live[0] if k not in fields and k != "row_number"]
    if extra:
        raise SystemExit(f"live has columns the mirror lacks: {extra}")

    live.sort(key=lambda r: int(r.get("row_number") or 0))
    with SHEET.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for r in live:
            w.writerow({f: cell(r.get(f, "")) for f in fields})

    print(f"mirrored {len(live)} rows into {SHEET.name}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: mirror_live_wellness_sheet.py <live-dump.json>")
    sys.exit(main(sys.argv[1]))
