#!/usr/bin/env python3
"""Fold #76 into #84: Melanotan II → Melanotan 2 on Sheet 9 and wellness.

Selector and print name both become Melanotan 2 (Salvatore's pick). Leaves the
10ml vial lock and Wolverine→BPC-157/TB-500 print-name work untouched. Pens
already print Melanotan 2.

    python3 marketing/scripts/rename_melanotan2.py
    python3 marketing/scripts/rename_melanotan2.py --write
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

OLD = "Melanotan II"
NEW = "Melanotan 2"

TABS = [
    {
        "name": "lab",
        "path": SHEETS / "9-lab-item-creations-500.csv",
        "payload": SHEETS / "9-lab-item-creations-melanotan2.json",
        "fields": [
            "compound_name",
            "video_prompt",
            "video_motion_prompt",
            "still_edit_prompt",
            "scene_brief",
        ],
        "expect_rows": 5,
        "expect_ids": [
            "PBVita-Lab-511",
            "PBVita-Lab-512",
            "PBVita-Lab-513",
            "PBVita-Lab-514",
            "PBVita-Lab-515",
        ],
    },
    {
        "name": "wellness",
        "path": SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv",
        "payload": SHEETS / "500_Peptide_Wellness_melanotan2.json",
        "fields": [
            "compound_name",
            "caption_lock",
            "video_prompt",
            "video_motion_prompt",
            "still_edit_prompt",
        ],
        "expect_rows": 24,
    },
]

STALE_PAYLOADS = [
    SHEETS / "9-lab-item-creations-10ml-vial-spec.json",
    SHEETS / "500_Peptide_Wellness_10ml-vial-spec.json",
]


def rewrite(text: str) -> str:
    return str(text).replace(OLD, NEW)


def apply_tab(tab: dict, write: bool) -> None:
    path: Path = tab["path"]
    with path.open(newline="") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        original = list(reader)

    out_rows: list[dict[str, str]] = []
    payload: list[dict[str, str]] = []
    changed_rows = 0
    ids: list[str] = []
    for row in original:
        next_row = dict(row)
        item: dict[str, str] = {"creation_id": row["creation_id"]}
        touched = False
        for field in tab["fields"]:
            if field not in fieldnames:
                continue
            before = row.get(field) or ""
            after = rewrite(before)
            if after != before:
                next_row[field] = after
                item[field] = after
                touched = True
        if touched:
            changed_rows += 1
            ids.append(row["creation_id"])
            payload.append(item)
        out_rows.append(next_row)

    if changed_rows != tab["expect_rows"]:
        raise SystemExit(
            f"{tab['name']}: expected {tab['expect_rows']} rewritten rows, got {changed_rows}"
        )
    expect_ids = tab.get("expect_ids")
    if expect_ids and ids != expect_ids:
        raise SystemExit(f"{tab['name']}: expected ids {expect_ids}, got {ids}")

    leftover = [
        r["creation_id"]
        for r in out_rows
        if any(OLD in str(r.get(f) or "") for f in fieldnames)
    ]
    if leftover:
        raise SystemExit(f"{tab['name']}: leftover {OLD} after rewrite: {leftover[:8]}")
    handles = sum(1 for r in out_rows if r.get("compound_name") == NEW)
    if handles != tab["expect_rows"]:
        raise SystemExit(
            f"{tab['name']}: expected {tab['expect_rows']} compound_name={NEW}, got {handles}"
        )
    missing_print = [
        r["creation_id"]
        for r in out_rows
        if r.get("compound_name") == NEW and NEW not in (r.get("video_prompt") or "")
    ]
    if missing_print:
        raise SystemExit(f"{tab['name']}: missing print name {NEW}: {missing_print[:8]}")

    print(f"{tab['name']}: rows rewritten: {changed_rows}")
    print(f"{tab['name']}: compound_name now {NEW}: {handles}")
    if not write:
        print(f"{tab['name']}: dry run only — pass --write to save")
        return

    with path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(out_rows)
    tab["payload"].write_text(json.dumps(payload, indent=1) + "\n")
    print(f"wrote {path}")
    print(f"wrote {tab['payload']} ({len(payload)} rows)")


def patch_stale_payloads(write: bool) -> None:
    for path in STALE_PAYLOADS:
        rows = json.loads(path.read_text())
        changed = 0
        for row in rows:
            touched = False
            for key, value in list(row.items()):
                if not isinstance(value, str):
                    continue
                after = rewrite(value)
                if after != value:
                    row[key] = after
                    touched = True
            if touched:
                changed += 1
            blob = json.dumps(row)
            if OLD in blob:
                raise SystemExit(f"{path.name} {row.get('creation_id')}: leftover {OLD}")
        print(f"{path.name}: objects rewritten: {changed}")
        if not write:
            continue
        path.write_text(json.dumps(rows, indent=1) + "\n")
        print(f"wrote {path}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    for tab in TABS:
        apply_tab(tab, args.write)
    patch_stale_payloads(args.write)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        sys.exit(0)
