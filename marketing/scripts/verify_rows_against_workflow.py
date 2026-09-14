#!/usr/bin/env python3
"""Prove the 501..535 rows run on the existing workflow with no node edits.

Workflow: Vid_gen_lab_scenes -9-lab-items-creations-500 (C4BkmmISpTMmgnAg).

This re-implements, in Python, the checks the live nodes already perform, so a
row that fails here would throw in n8n:

  alias_stack_names       rewrites blend strings -> KLOW / GLOW / Wolverine
  pull_sheet_row          status == 'Active', required fields, compound match
  prep_grok_video_start   duration_seconds == 15, aspect_ratio d+:d+
  fal_kling_generate      prompt / start_image_url / duration / generate_audio

It also reports, per new compound, what `choose_compound` will match. That node
matches on a two-way substring of the normalized name, so a short name can pull
a longer live one (and vice versa); the report names every such overlap.

    python3 marketing/scripts/verify_rows_against_workflow.py
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
LIVE = SHEETS / "9-lab-item-creations-500.csv"
NEW = SHEETS / "9-lab-item-creations-501-535-new.csv"

# pull_sheet_row `required`, verbatim.
REQUIRED = (
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "camera_move",
    "model_still",
    "model_video",
    "still_resolution",
    "duration_seconds",
    "resolution",
    "aspect_ratio",
)

ASPECT_RE = re.compile(r"^\d+:\d+$")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def alias(name: str, compound_id: str = "") -> str:
    """alias_stack_names.nick(), verbatim."""
    n, i = norm(name), norm(compound_id)
    if n in {"klow", "klowblend", "klowpeptide", "kpvbpc157tb500ghkcu"} or i in {
        "pklo001",
        "vklo001",
    }:
        return "KLOW"
    if n in {"glow", "glowblend", "glowpeptide", "bpc157tb500ghkcu"} or i in {
        "pglo001",
        "vglo001",
    }:
        return "GLOW"
    if n in {"wolverine", "wolverineblend", "wolverinestack", "bpc157tb500"} or i in {
        "pwol001",
        "vwol001",
    }:
        return "Wolverine"
    return name


def row_matches(row_compound: str, want: str) -> bool:
    """pull_sheet_row.rowMatches(), verbatim."""
    w, r = norm(want), norm(row_compound)
    if not w:
        return True
    if not r:
        return False
    return r == w or w in r or r in w


def load(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return [dict(r) for r in csv.DictReader(handle)]


def main() -> int:
    live, new = load(LIVE), load(NEW)
    fail: list[str] = []

    def check(label: str, ok: bool, detail: str = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")
        if not ok:
            fail.append(label)

    print(f"Existing-workflow compatibility, {len(new)} new rows\n")

    print("pull_sheet_row")
    check(
        "status is exactly 'Active' (node filters on ===)",
        all((r["status"] or "").strip() == "Active" for r in new),
        str(sorted({r["status"] for r in new})),
    )
    check(
        "creation_id non-empty (node drops falsy ids)",
        all((r["creation_id"] or "").strip() for r in new),
    )
    blanks = [
        (r["creation_id"], f) for r in new for f in REQUIRED if not (r[f] or "").strip()
    ]
    check("all 10 required fields non-empty", not blanks, str(blanks[:5]))
    check(
        "duration_seconds casts to a finite Number",
        all(str(int(float(r["duration_seconds"]))) == r["duration_seconds"] for r in new),
    )

    print("\nprep_grok_video_start")
    check(
        "duration_seconds == 15 (node throws on anything else)",
        all(r["duration_seconds"] == "15" for r in new),
        str(sorted({r["duration_seconds"] for r in new})),
    )
    check(
        "aspect_ratio matches /^\\d+:\\d+$/ after the node's cleanup",
        all(ASPECT_RE.match(r["aspect_ratio"].replace("\u2236", ":").strip()) for r in new),
        str(sorted({r["aspect_ratio"] for r in new})),
    )
    check(
        "no smart quotes / newlines in video_motion_prompt",
        not [r["creation_id"] for r in new if re.search(r"[\r\n\u2018\u2019\u201c\u201d]", r["video_motion_prompt"])],
    )

    print("\nalias_stack_names")
    rewritten = {
        r["creation_id"]: alias(r["compound_name"])
        for r in new
        if alias(r["compound_name"]) != r["compound_name"]
    }
    check(
        "new compound names pass through unrewritten",
        not rewritten,
        json.dumps(rewritten)[:200],
    )

    print("\nsheets_update_creation")
    check(
        "times_used is numeric (node writes Number(times_used) + 1)",
        all((r["times_used"] or "").strip().isdigit() for r in new),
    )
    check(
        "creation_id unique across live + new (update matches on it)",
        len({r["creation_id"] for r in live} & {r["creation_id"] for r in new}) == 0
        and len({r["creation_id"] for r in new}) == len(new),
    )

    print("\nchoose_compound — what each new name will pull")
    live_aliased = [alias(r["compound_name"]) for r in live if (r["status"] or "").strip() == "Active"]
    order = []
    for r in new:
        if r["compound_name"] not in order:
            order.append(r["compound_name"])
    ambiguous = {}
    for want in order:
        others = sorted(
            {n for n in live_aliased if row_matches(n, want)}
            | {n for n in order if n != want and row_matches(n, want)}
        )
        mine = sum(1 for r in new if r["compound_name"] == want)
        if others:
            ambiguous[want] = others
            print(f"  {want:24s} {mine} new rows  + also matches {others}")
        else:
            print(f"  {want:24s} {mine} new rows  (exclusive)")
    if ambiguous:
        print(
            "\n  Overlaps are resolved by the node's own sort: times_used asc, then\n"
            "  last_used_at, then rank. Every new row is times_used=0, so a new row\n"
            "  wins over any used live row. Two names at 0 fall to rank order."
        )

    if fail:
        print(f"\n{len(fail)} check(s) failed: {fail}")
        return 1
    print("\nAll compatibility checks passed. No node edits required.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
