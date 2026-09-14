#!/usr/bin/env python3
"""Pin the pen red to a number, and put a pen spec where the vial spec was.

Salvatore, 2026-09-14: lock in the closest matching colour number, and change
the vial spec to a pen spec.

Colour number
    The prompts already agree on the words "crimson red" but words are a weak
    lock — nothing in this repo pinned a number, and the site is teal-branded
    so it offered none either. The closest matching number to the phrase
    already approved is the standard named colour crimson, #DC143C. Every
    "crimson red" in the two fields that reach an API gets it. All of them,
    not some: a prompt where half the reds carry a number and half do not
    reads as two different reds, which is the drift this is meant to end.

Pen spec
    lab_item, material_detail and hero_style opened with a 716-character
    VIAL VISUAL LOCK on all 168 rows — glass vial, blue flip-off cap, 10ml
    multi-use, maroon dose bar — and so did 19 scene_brief values. It is a
    constant prefix in every case, with legitimate pen copy after it. Swap it
    for the row's own PEN VISUAL LOCK, lifted from its video_prompt, so the
    spec matches the product and nothing is invented.

    python3 marketing/scripts/pin_pen_red_and_spec.py           # dry run
    python3 marketing/scripts/pin_pen_red_and_spec.py --write
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
MIRROR = SHEETS / "14-pen-creations-150.csv"

RED = "crimson red"
HEX = "#DC143C"
RED_HEX = f"{RED} {HEX}"

PROMPT_FIELDS = ["video_prompt", "still_edit_prompt"]
SPEC_FIELDS = ["lab_item", "material_detail", "hero_style", "scene_brief"]

VIAL_START = "VIAL VISUAL LOCK"
VIAL_END = "label layout colors between runs. "
PEN_START = "PEN VISUAL LOCK"
PEN_END = "HARD RULE (stills and video, READ FIRST):"


def pen_lock(video_prompt: str, creation_id: str) -> str:
    start = video_prompt.find(PEN_START)
    end = video_prompt.find(PEN_END, start)
    if start == -1 or end == -1:
        raise SystemExit(f"{creation_id}: no PEN VISUAL LOCK to copy")
    return video_prompt[start:end]


def main() -> int:
    write = "--write" in sys.argv

    with MIRROR.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]

    print(f"{len(rows)} rows\n")

    # --- colour number ------------------------------------------------------
    pinned = 0
    for row in rows:
        for field in PROMPT_FIELDS:
            value = row[field]
            # Guard against double-pinning on a re-run.
            value = value.replace(RED_HEX, RED)
            pinned += value.count(RED)
            row[field] = value.replace(RED, RED_HEX)
    print(f"colour number: pinned {HEX} to {pinned} reds across {len(rows)} rows")

    # --- vial spec -> pen spec ---------------------------------------------
    swapped: Counter[str] = Counter()
    for row in rows:
        lock = pen_lock(row["video_prompt"], row["creation_id"])
        for field in SPEC_FIELDS:
            value = row[field]
            if VIAL_START not in value:
                continue
            end = value.find(VIAL_END)
            if end == -1:
                raise SystemExit(f"{row['creation_id']}/{field}: vial block has no end marker")
            row[field] = lock + value[end + len(VIAL_END) :]
            swapped[field] += 1
    for field, n in sorted(swapped.items()):
        print(f"pen spec: replaced the vial block on {n} {field} values")

    # --- QA -----------------------------------------------------------------
    failures: list[str] = []

    def check(label: str, ok: bool, detail: object = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label} — {detail}")
        if not ok:
            failures.append(label)

    print("\nQA")

    bare = []
    for row in rows:
        for field in PROMPT_FIELDS:
            for match in re.finditer(re.escape(RED), row[field]):
                after = row[field][match.end() : match.end() + len(HEX) + 1]
                if after != f" {HEX}":
                    bare.append(f"{row['creation_id']}:{field}")
    check("every red carries the number", not bare, f"{len(bare)} bare")

    counts = [r["video_prompt"].count(RED_HEX) for r in rows]
    check("every video_prompt carries it", min(counts) > 0, f"{min(counts)}-{max(counts)} per row")

    others = re.compile(r"#(?!DC143C\b)[0-9A-Fa-f]{6}\b")
    stray = [r["creation_id"] for r in rows for f in PROMPT_FIELDS if others.search(r[f])]
    check("no other colour number appears", not stray, f"{len(stray)} rows")

    vial = [
        f"{r['creation_id']}:{f}"
        for r in rows
        for f in columns
        if VIAL_START in str(r[f])
    ]
    check("no VIAL VISUAL LOCK anywhere", not vial, f"{len(vial)} fields")

    for phrase in ("clear glass research vial", "flip-off cap", "Multi-Use Vial", "maroon"):
        hit = [f"{r['creation_id']}:{f}" for r in rows for f in columns if phrase in str(r[f])]
        check(f"no {phrase!r} left on the pen tab", not hit, f"{len(hit)} fields")

    # scene_brief only ever carried the vial block on 19 rows; the other 149
    # were always ordinary briefs and are left alone.
    for field in SPEC_FIELDS:
        opens = sum(1 for r in rows if r[field].startswith(PEN_START))
        print(f"        {field}: {opens}/{len(rows)} now open with the pen lock")

    lengths = sorted(len(r["video_prompt"]) for r in rows)
    print(f"        video_prompt length is now {lengths[0]}-{lengths[-1]}")

    empty = [r["creation_id"] for r in rows for f in SPEC_FIELDS if not r[f].strip()]
    check("no spec field emptied", not empty, f"{len(empty)} blank")

    for field in ("scene_brief", "camera_move"):
        dupes = [k for k, n in Counter(r[field] for r in rows).items() if n > 1]
        check(f"{field} still unique", not dupes, f"{len(dupes)} duplicated")

    blue = [r["creation_id"] for r in rows if "cobalt" in r["video_prompt"].lower()]
    check("still no cobalt", not blue, f"{len(blue)} rows")

    for field, want in (("aspect_ratio", "9:16"), ("duration_seconds", "15"), ("resolution", "1080p")):
        off = sorted({str(r[field]) for r in rows if str(r[field]).strip() != want})
        check(f"{field} untouched at {want}", not off, off or "clean")

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1
    print("\nAll checks passed.")

    if not write:
        print("\nDry run. Re-run with --write to emit the payload and update the mirror.")
        return 0

    with MIRROR.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nwrote {MIRROR.relative_to(ROOT.parent)} ({len(rows)} rows)")

    payload = SHEETS / "14-pen-creations-red-spec.json"
    fields = PROMPT_FIELDS + SPEC_FIELDS
    payload.write_text(
        json.dumps(
            {
                "count": len(rows),
                "fields": fields,
                "rows": [
                    {"creation_id": r["creation_id"], **{f: r[f] for f in fields}} for r in rows
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {payload.relative_to(ROOT.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
