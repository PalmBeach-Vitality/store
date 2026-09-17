#!/usr/bin/env python3
"""Print BPC-157/TB-500 on Wolverine rows. Keep compound_name as the handle.

Grok Imagine rejected Vid_gen_lab_scenes execution 2251 (PBVita-Lab-207) because
the still prompt said reading exactly 'Wolverine' — Marvel IP. Salvatore: change
every Wolverine to BPC-157/TB-500, leave choose_compound / compound_name alone.

    python3 marketing/scripts/rename_wolverine_print_name.py
    python3 marketing/scripts/rename_wolverine_print_name.py --write
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

OLD = "Wolverine"
NEW = "BPC-157/TB-500"
WOLVERINE_RE = re.compile(r"wolverine", re.IGNORECASE)
URL_RE = re.compile(r"https?://[^\s]+")

TABS = [
    {
        "name": "lab",
        "path": SHEETS / "9-lab-item-creations-500.csv",
        "payload": SHEETS / "9-lab-item-creations-wolverine-print.json",
        "fields": [
            "video_prompt",
            "video_motion_prompt",
            "still_edit_prompt",
            "scene_brief",
        ],
        "expect_rows": 29,
    },
    {
        "name": "wellness",
        "path": SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv",
        "payload": SHEETS / "500_Peptide_Wellness_wolverine-print.json",
        "fields": [
            "caption_lock",
            "video_prompt",
            "video_motion_prompt",
            "still_edit_prompt",
        ],
        "expect_rows": 32,
    },
    {
        "name": "pen",
        "path": SHEETS / "14-pen-creations-150.csv",
        "payload": SHEETS / "14-pen-creations-wolverine-print.json",
        "fields": [
            "lab_item",
            "material_detail",
            "scene_brief",
            "video_prompt",
            "video_motion_prompt",
            "still_edit_prompt",
        ],
        "expect_rows": 5,
    },
]

STALE_PAYLOADS = [
    SHEETS / "9-lab-item-creations-10ml-vial-spec.json",
    SHEETS / "500_Peptide_Wellness_10ml-vial-spec.json",
]


def rewrite(text: str) -> str:
    urls: list[str] = []

    def hold(match: re.Match[str]) -> str:
        urls.append(match.group(0))
        return f"\x00URL{len(urls) - 1}\x00"

    protected = URL_RE.sub(hold, text)
    if not WOLVERINE_RE.search(protected):
        return text
    out = WOLVERINE_RE.sub(NEW, protected)
    for i, url in enumerate(urls):
        out = out.replace(f"\x00URL{i}\x00", url)
    return out


def apply_tab(tab: dict, write: bool) -> None:
    path: Path = tab["path"]
    with path.open(newline="") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        original = list(reader)

    out_rows: list[dict[str, str]] = []
    payload: list[dict[str, str]] = []
    changed_rows = 0
    handle_kept = 0
    for row in original:
        next_row = dict(row)
        item: dict[str, str] = {"creation_id": row["creation_id"]}
        touched = False
        for field in tab["fields"]:
            before = row.get(field) or ""
            after = rewrite(before)
            if after != before:
                next_row[field] = after
                item[field] = after
                touched = True
        if row.get("compound_name") == OLD:
            handle_kept += 1
            if next_row.get("compound_name") != OLD:
                raise SystemExit(f"{tab['name']} {row['creation_id']}: compound_name mutated")
        prompt_blob = " ".join(next_row.get(f) or "" for f in tab["fields"])
        if WOLVERINE_RE.search(URL_RE.sub("", prompt_blob)):
            raise SystemExit(
                f"{tab['name']} {row['creation_id']}: Wolverine still in prompt fields"
            )
        if touched:
            changed_rows += 1
            payload.append(item)
        out_rows.append(next_row)

    if changed_rows != tab["expect_rows"]:
        raise SystemExit(
            f"{tab['name']}: expected {tab['expect_rows']} rewritten rows, got {changed_rows}"
        )
    if handle_kept != tab["expect_rows"]:
        raise SystemExit(
            f"{tab['name']}: expected {tab['expect_rows']} compound_name=Wolverine handles, got {handle_kept}"
        )
    for row in out_rows:
        if row.get("compound_name") == OLD and NEW not in (row.get("video_prompt") or ""):
            raise SystemExit(
                f"{tab['name']} {row['creation_id']}: handle Wolverine missing print name {NEW}"
            )

    print(f"{tab['name']}: prompt rows rewritten: {changed_rows}")
    print(f"{tab['name']}: compound_name still Wolverine: {handle_kept}")
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
            if "compound_name" in row and row["compound_name"] != OLD:
                continue
            touched = False
            for key, value in list(row.items()):
                if key in {"creation_id", "compound_name", "canonical_url"}:
                    continue
                if not isinstance(value, str):
                    continue
                after = rewrite(value)
                if after != value:
                    row[key] = after
                    touched = True
            if touched:
                changed += 1
            blob = " ".join(str(v) for k, v in row.items() if k not in {"creation_id", "compound_name", "canonical_url"} and isinstance(v, str))
            if WOLVERINE_RE.search(URL_RE.sub("", blob)):
                raise SystemExit(f"{path.name} {row.get('creation_id')}: Wolverine still in payload fields")
        print(f"{path.name}: prompt objects rewritten: {changed}")
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
