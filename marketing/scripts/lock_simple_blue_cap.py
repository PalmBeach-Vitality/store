#!/usr/bin/env python3
"""Simple uniform blue cap. No tabs. Lab + landscape still/video prompts.

Sal, 2026-09-18, on landscape still
https://imgen.x.ai/xai-imgen/xai-tmp-imgen-e54ccb58-7797-90d3-804a-2a0b0f0e8411-f328d427.png
(Vid_gen_landscape_scenes): vial specs are good but the cap still shows tabs.
Should be a simple uniform blue cap with no tabs. Tabs are forbidden.

Root cause: every row still says "flip-off cap". That is the pharma part with
tear-tabs. FORBIDDEN: tabs was already in the lock and Grok drew tabs anyway.

This pass drops flip-off, pins a simple uniform one-piece disc, keeps
FORBIDDEN: tabs, and does not touch video_motion_prompt (CAMERA LOCK) or
the TINY helix. 5ml included (same cap wording). Pens out of scope.

    python3 marketing/scripts/lock_simple_blue_cap.py            # dry run
    python3 marketing/scripts/lock_simple_blue_cap.py --write
"""

from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
LAB_MIRROR = SHEETS / "9-lab-item-creations-500.csv"
WELLNESS_MIRROR = SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv"

LAB_FIELDS = [
    "lab_item",
    "material_detail",
    "hero_style",
    "still_edit_prompt",
    "video_prompt",
]
WELLNESS_FIELDS = ["material_detail", "hero_style", "video_prompt"]
MOTION = "video_motion_prompt"

REPLACES: list[tuple[str, str]] = [
    (
        "plain bright blue plastic flip-off cap ONLY 94 percent of body width "
        "(smooth round flip-off — FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, "
        "side flaps, hanging pieces).",
        "simple uniform bright blue plastic cap ONLY 94 percent of body width "
        "(smooth round one-piece disc, no tabs — FORBIDDEN: tabs, wings, "
        "pull-tabs, tear-tabs, side flaps, hanging pieces).",
    ),
    (
        "plain bright blue plastic flip-off cap ONLY (smooth round flip-off — "
        "FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces).",
        "simple uniform bright blue plastic cap ONLY (smooth round one-piece "
        "disc, no tabs — FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side "
        "flaps, hanging pieces).",
    ),
    (
        "a flat royal-blue plastic flip-off cap, a plain smooth disc about 94% "
        "of the body width",
        "a simple uniform royal-blue plastic cap, a plain smooth disc about 94% "
        "of the body width",
    ),
    (
        "a flat royal-blue plastic flip-off cap, a plain smooth disc about 95% "
        "of the body width",
        "a simple uniform royal-blue plastic cap, a plain smooth disc about 95% "
        "of the body width",
    ),
    (
        "SEATED CAP LOCK: blue flip-off cap stays fully seated on the silver "
        "crimp; never pop off.",
        "SEATED CAP LOCK: simple uniform blue cap stays fully seated on the "
        "silver crimp; never pop off.",
    ),
    (
        "bright blue flip-off cap",
        "simple uniform bright blue cap",
    ),
]


def apply_text(text: str) -> tuple[str, int]:
    out = str(text or "")
    hits = 0
    for old, new in REPLACES:
        n = out.count(old)
        if n:
            out = out.replace(old, new)
            hits += n
    return out, hits


def patch_csv(path: Path, fields: list[str], write: bool) -> dict:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        original = list(reader)

    hits: Counter[str] = Counter()
    out_rows: list[dict[str, str]] = []
    changed_rows = 0
    for row in original:
        cid = str(row.get("creation_id") or "")
        nxt = dict(row)
        motion_before = nxt.get(MOTION) or ""
        row_hits = 0
        for field in fields:
            if field not in nxt:
                continue
            patched, n = apply_text(nxt.get(field) or "")
            if n:
                nxt[field] = patched
                hits[field] += n
                row_hits += n
        if (nxt.get(MOTION) or "") != motion_before:
            raise SystemExit(f"{cid}: video_motion_prompt was modified")
        leftover = " ".join(nxt.get(f) or "" for f in fields)
        if "flip-off" in leftover.lower():
            raise SystemExit(f"{cid}: leftover flip-off after cap lock")
        if "simple uniform" not in leftover:
            raise SystemExit(f"{cid}: missing simple uniform cap")
        if "FORBIDDEN: tabs" not in leftover and "FORBIDDEN on the cap: tabs" not in leftover:
            raise SystemExit(f"{cid}: missing FORBIDDEN tabs")
        if row_hits:
            changed_rows += 1
        out_rows.append(nxt)

    camera = sum(
        1
        for r in out_rows
        if (r.get(MOTION) or "").startswith("CAMERA LOCK: the vial never moves")
    )
    tiny = sum(1 for r in out_rows if "TINY red DNA double-helix" in (r.get("video_prompt") or ""))
    if camera != len(out_rows):
        raise SystemExit(f"{path.name}: CAMERA LOCK {camera} != rows {len(out_rows)}")

    if write:
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
            writer.writeheader()
            writer.writerows(out_rows)

    return {
        "path": str(path.relative_to(ROOT.parent)),
        "rows": len(out_rows),
        "changed_rows": changed_rows,
        "camera_lock": camera,
        "tiny_helix": tiny,
        "hits": dict(hits),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    reports = [
        patch_csv(LAB_MIRROR, LAB_FIELDS, args.write),
        patch_csv(WELLNESS_MIRROR, WELLNESS_FIELDS, args.write),
    ]
    for r in reports:
        print(
            f"{r['path']}: rows={r['rows']} changed={r['changed_rows']} "
            f"camera_lock={r['camera_lock']} tiny_helix={r['tiny_helix']} hits={r['hits']}"
        )
    mode = "WROTE" if args.write else "DRY RUN"
    print(f"PASS {mode}: simple uniform blue cap, no flip-off, tabs forbidden. CAMERA LOCK + TINY helix kept.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        sys.exit(0)
