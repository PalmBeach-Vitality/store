#!/usr/bin/env python3
"""Check every Sheet 9 row against what the live nodes demand.

Workflow: Vid_gen_lab_scenes -9-lab-items-creations-500 (C4BkmmISpTMmgnAg).

This re-implements, in Python, the checks the nodes already perform, so a row
that fails here would throw in n8n:

  alias_stack_names       rewrites blend strings -> KLOW / GLOW / Wolverine
  pull_sheet_row          status == 'Active', required fields, compound match
  prep_grok_video_start   duration_seconds == 15, aspect_ratio d+:d+
  grok_imagine_reel_still sends video_prompt and nothing else
  sheets_update_creation  matches on creation_id, increments times_used

It also reports, per compound, whether choose_compound can address it. That
node matches on a two-way substring of the normalized name, so a name that sits
inside another active name is unreachable; compound_name is a selector only,
never label text, so the fix for a clash is a distinct handle in that column.

    python3 marketing/scripts/verify_rows_against_workflow.py
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "sheets" / "9-lab-item-creations-500.csv"

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

# Hard locks the still must carry. video_prompt is the only field the still
# node sends, so a marker missing there is simply absent from the render.
MARKERS = (
    "LABEL REQUIREMENT",
    "VIAL STATE RULE",
    "SINGLE HERO PRODUCT RULE",
    "PRODUCT COUNT MUST EQUAL 1",
    "NO DOUBLES ANYWHERE",
)

# compound_name is a selector; these rows print a different name on the vial.
HANDLE_LABELS = {
    "CJC-1295": "CJC",
    "Ipamorelin-Solo": "Ipamorelin",
    "Tesa-Ipa": "Tesamorelin/Ipamorelin",
}

ASPECT_RE = re.compile(r"^\d+:\d+$")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def alias(name: str) -> str:
    """alias_stack_names.nick(), verbatim."""
    n = norm(name)
    if n in {"klow", "klowblend", "klowpeptide", "kpvbpc157tb500ghkcu"}:
        return "KLOW"
    if n in {"glow", "glowblend", "glowpeptide", "bpc157tb500ghkcu"}:
        return "GLOW"
    if n in {"wolverine", "wolverineblend", "wolverinestack", "bpc157tb500"}:
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


def word_re(name: str) -> re.Pattern:
    return re.compile(r"(?<![A-Za-z0-9-])" + re.escape(name) + r"(?![A-Za-z0-9-])")


def main() -> int:
    with SHEET.open(newline="", encoding="utf-8") as handle:
        rows = [dict(r) for r in csv.DictReader(handle)]
    fail: list[str] = []

    def check(label: str, ok: bool, detail: str = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")
        if not ok:
            fail.append(label)

    print(f"Workflow compatibility, {len(rows)} rows\n")

    print("pull_sheet_row")
    check(
        "status is exactly 'Active' (node filters on ===)",
        all((r["status"] or "").strip() == "Active" for r in rows),
        str(sorted({r["status"] for r in rows})),
    )
    ids = [r["creation_id"].strip() for r in rows]
    check("creation_id non-empty and unique", all(ids) and len(set(ids)) == len(ids))
    blanks = [
        (r["creation_id"], f) for r in rows for f in REQUIRED if not (r[f] or "").strip()
    ]
    check("all 10 required fields non-empty", not blanks, str(blanks[:5]))

    print("\nprep_grok_video_start")
    check(
        "duration_seconds == 15 (node throws on anything else)",
        all(r["duration_seconds"] == "15" for r in rows),
        str(sorted({r["duration_seconds"] for r in rows})),
    )
    check(
        "aspect_ratio matches /^\\d+:\\d+$/ after the node's cleanup",
        all(ASPECT_RE.match(r["aspect_ratio"].replace("\u2236", ":").strip()) for r in rows),
        str(sorted({r["aspect_ratio"] for r in rows})),
    )

    print("\ngrok_imagine_reel_still (sends video_prompt only)")
    for m in MARKERS:
        missing = [r["creation_id"] for r in rows if m not in r["video_prompt"]]
        check(f"every row carries {m}", not missing, f"{len(missing)} missing")
    unnamed = [
        r["creation_id"]
        for r in rows
        if not word_re(
            HANDLE_LABELS.get(r["compound_name"], r["compound_name"])
        ).search(r["video_prompt"])
    ]
    check("every row names its compound in video_prompt", not unnamed, str(unnamed[:5]))

    print("\nalias_stack_names")
    rewritten = {
        r["creation_id"]: alias(r["compound_name"])
        for r in rows
        if r["compound_name"] in HANDLE_LABELS and alias(r["compound_name"]) != r["compound_name"]
    }
    check("selector handles pass through unrewritten", not rewritten, str(rewritten))

    print("\nsheets_update_creation")
    check(
        "times_used is numeric (node writes Number(times_used) + 1)",
        all((r["times_used"] or "").strip().isdigit() for r in rows),
    )

    print("\nchoose_compound reachability")
    names = sorted({alias(r["compound_name"]) for r in rows})
    clashes = {}
    for want in names:
        others = sorted(n for n in names if n != want and row_matches(n, want))
        if others:
            clashes[want] = others
    for want in names:
        n = sum(1 for r in rows if alias(r["compound_name"]) == want)
        note = f"CLASHES with {clashes[want]}" if want in clashes else "exclusive"
        print(f"  {want:24s} {n:3d} rows  {note}")
    check("no compound name is a substring of another", not clashes, str(clashes))

    if fail:
        print(f"\n{len(fail)} check(s) failed: {fail}")
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
