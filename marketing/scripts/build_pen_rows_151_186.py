#!/usr/bin/env python3
"""Rebuild 14-pen-creations-150 to Salvatore's 2026-09-14 ruling.

Four changes, in order:

1. Drop Semaglutide, Tirzepatide and Retatrutide entirely. Salvatore: remove
   them from this sheet completely — every pen here is a peptide pen.
2. Force crimson red on every surviving row. Twenty-one rows contradicted
   themselves, carrying a BLUE ACCENTS head over a crimson COLOR LOCK body,
   and the COLOR LOCK named a cobalt exception for the three SKUs now gone.
3. Fix the Cagrilintide spelling. The pen prints its compound name, so the
   five 'Cagrilinitide' rows were rendering a misspelled label.
4. Add six pens the price sheet sells but the tab never had, six rows each:
   Dihexa, Epithalon, Glutathione, IGF-LR3, Ipamorelin, Kisspeptin.

Selector handles follow Sheet 9 so choose_compound can address each SKU on
its own: pull_sheet_row matches compound_name with a two-way substring test,
so 'CJC' is unreachable beside 'CJC/Ipamorelin' and 'Ipamorelin' would be
unreachable beside both blends. compound_name only picks the row — the name
printed on the pen comes from video_prompt and keeps the real product name.

Pen labels carry no dose (the prompt forbids milligrams outright), so unlike
the vial rows these need no dose research.

    python3 marketing/scripts/build_pen_rows_151_186.py            # dry run
    python3 marketing/scripts/build_pen_rows_151_186.py --write
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from camera_recipes import generate_all_recipes  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
MIRROR = SHEETS / "14-pen-creations-150.csv"

DROP = {"Semaglutide", "Tirzepatide", "Retatrutide"}

# compound_name is the selector; label is what the pen prints.
HANDLES = {"CJC": "CJC-1295", "Tesamorelin/Ipamorelin": "Tesa-Ipa"}
TYPO = ("Cagrilinitide", "Cagrilintide")

NEW_PENS = [
    # (label printed on the pen, selector handle)
    ("Dihexa", "Dihexa"),
    ("Epithalon", "Epithalon"),
    ("Glutathione", "Glutathione"),
    ("IGF-LR3", "IGF-LR3"),
    ("Ipamorelin", "Ipamorelin-Solo"),
    ("Kisspeptin", "Kisspeptin"),
]
ROWS_EACH = 6

BLUE_HEAD = (
    "BLUE ACCENTS only (weight-loss): cobalt blue compound name, logo, helix, "
    "and plunger/accent bits. Logo = cobalt blue double-helix DNA icon only — "
    "no hands near the helix. No red accents."
)
RED_HEAD = (
    "RED ACCENTS only (peptide): crimson/dark-red compound name, logo, helix, "
    "and plunger/accent bits. Logo = dark red double-helix DNA icon only — "
    "no hands near the helix. No blue accents."
)
OLD_LOCK = (
    "COLOR LOCK: Peptide pens = crimson red text + logo. Metabolic pens "
    "(Semaglutide / Tirzepatide / Retatrutide only) = cobalt blue text + logo."
)
NEW_LOCK = (
    "COLOR LOCK: Every pen on this sheet is a peptide pen = crimson red text + logo. "
    "No other accent colour exists on this sheet."
)
BLUE_SKU = "This SKU is metabolic / cobalt blue."
RED_SKU = "This SKU is peptide / crimson red."

TEXT_COLUMNS = [
    "lab_item",
    "material_detail",
    "scene_brief",
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
    "hero_style",
    "quality_suffix",
]


def dash_loose(text: str) -> str:
    """Match a camera move whichever dash the column and the prompt used."""
    return re.escape(text).replace("—", "[—-]").replace("\\-", "[—-]")


def swap_camera(text: str, donor: dict[str, str], recipe: dict[str, str]) -> str:
    out = re.sub(dash_loose(donor["camera_move"]), recipe["camera_move"], text)
    out = out.replace(
        f"SHOT FAMILY: {donor['shot_family']}. "
        f"CAMERA ANGLE: {donor['camera_angle']}. "
        f"CAMERA DIRECTION: {donor['camera_direction']}. "
        f"FRAMING: {donor['framing']}.",
        f"SHOT FAMILY: {recipe['shot_family']}. "
        f"CAMERA ANGLE: {recipe['camera_angle']}. "
        f"CAMERA DIRECTION: {recipe['camera_direction']}. "
        f"FRAMING: {recipe['framing']}.",
    )
    out = out.replace(
        f"Shot {donor['shot_family']}, angle {donor['camera_angle']}, "
        f"direction {donor['camera_direction']}.",
        f"Shot {recipe['shot_family']}, angle {recipe['camera_angle']}, "
        f"direction {recipe['camera_direction']}.",
    )
    out = out.replace(f"· shot:{donor['shot_family']} ·", f"· shot:{recipe['shot_family']} ·")
    return out


def force_red(row: dict[str, str]) -> dict[str, str]:
    for column in TEXT_COLUMNS:
        value = row.get(column, "")
        if not value:
            continue
        value = value.replace(BLUE_HEAD, RED_HEAD)
        value = value.replace(OLD_LOCK, NEW_LOCK)
        value = value.replace(BLUE_SKU, RED_SKU)
        row[column] = value
    return row


def fix_typo(row: dict[str, str]) -> dict[str, str]:
    wrong, right = TYPO
    if row["compound_name"] == wrong:
        row["compound_name"] = right
    for column in TEXT_COLUMNS:
        if row.get(column):
            row[column] = row[column].replace(wrong, right)
    return row


def word_re(name: str) -> re.Pattern[str]:
    return re.compile(r"(?<![A-Za-z0-9-])" + re.escape(name) + r"(?![A-Za-z0-9-])")


def build_row(
    donor: dict[str, str],
    label: str,
    handle: str,
    recipe: dict[str, str],
    index: int,
    columns: list[str],
) -> dict[str, str]:
    row = dict(donor)
    old_label = donor["label_name"]

    for column in TEXT_COLUMNS:
        value = row.get(column, "")
        if value:
            row[column] = word_re(old_label).sub(label, value)

    for column in ("video_prompt", "video_motion_prompt", "scene_brief"):
        row[column] = swap_camera(row[column], donor, recipe)

    row["creation_id"] = f"PBVita-Pen-{150 + index:03d}"
    row["rank"] = str(150 + index)
    row["lab_item_id"] = f"SCN-{150 + index:03d}"
    row["compound_name"] = handle
    row["shot_family"] = recipe["shot_family"]
    row["camera_angle"] = recipe["camera_angle"]
    row["camera_direction"] = recipe["camera_direction"]
    row["framing"] = recipe["framing"]
    row["camera_move"] = recipe["camera_move"]
    row["status"] = "Active"
    row["times_used"] = "0"
    row["last_used_at"] = ""
    return {c: row.get(c, "") for c in columns}


def main() -> int:
    write = "--write" in sys.argv

    with MIRROR.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        live = [dict(r) for r in reader]

    print(f"live rows: {len(live)}")

    kept = [r for r in live if r["compound_name"] not in DROP]
    print(f"dropped {len(live) - len(kept)} rows ({', '.join(sorted(DROP))})")

    kept = [fix_typo(force_red(r)) for r in kept]

    # Remember the printed label before the selector handle overwrites it.
    for row in kept:
        row["label_name"] = row["compound_name"]
        if row["compound_name"] in HANDLES:
            row["compound_name"] = HANDLES[row["compound_name"]]

    used_moves = {r["camera_move"] for r in kept}
    pool = [r for r in generate_all_recipes() if r["camera_move"] not in used_moves]
    print(f"unused camera recipes available: {len(pool)}")

    # One distinct donor per new row keeps every scene_brief unique, and
    # spreading donors across the sheet keeps the environments varied.
    donors = [r for r in kept if r["label_name"] not in {"GLOW", "KLOW", "Wolverine"}]
    need = len(NEW_PENS) * ROWS_EACH
    if len(donors) < need:
        raise SystemExit(f"need {need} distinct donors, have {len(donors)}")
    stride = len(donors) // need

    new_rows: list[dict[str, str]] = []
    for slot, (label, handle) in enumerate(NEW_PENS):
        for take in range(ROWS_EACH):
            index = slot * ROWS_EACH + take
            donor = donors[(index * stride) % len(donors)]
            new_rows.append(
                build_row(donor, label, handle, pool[index], index + 1, columns)
            )

    for row in kept:
        row.pop("label_name", None)
    final = [{c: r.get(c, "") for c in columns} for r in kept] + new_rows
    print(f"new rows: {len(new_rows)}  |  final tab: {len(final)} rows")

    # --- QA -----------------------------------------------------------------
    failures: list[str] = []

    def check(label: str, ok: bool, detail: object = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label} — {detail}")
        if not ok:
            failures.append(label)

    print("\nQA")
    check("row count is 132 + 36", len(final) == 168, len(final))

    gone = sorted({c for c in DROP for r in final if word_re(c).search(r["video_prompt"])})
    check("no Sema/Tirz/Reta anywhere", not gone, gone or "clean")

    blue = [
        r["creation_id"]
        for r in final
        if "cobalt" in r["video_prompt"].lower() or "BLUE ACCENTS" in r["video_prompt"]
    ]
    check("no blue accent language left", not blue, f"{len(blue)} rows")

    red = [r["creation_id"] for r in final if RED_SKU not in r["video_prompt"]]
    check("every row declares crimson red", not red, f"{len(red)} rows")

    typo = [r["creation_id"] for r in final if TYPO[0] in json.dumps(r)]
    check("Cagrilintide spelled right", not typo, f"{len(typo)} rows")

    ids = Counter(r["creation_id"] for r in final)
    check("creation_id unique", all(n == 1 for n in ids.values()), "clean")

    for field in ("camera_move", "scene_brief"):
        dupes = [k for k, n in Counter(r[field] for r in final).items() if n > 1]
        check(f"{field} unique across the tab", not dupes, f"{len(dupes)} duplicated")

    names = sorted({r["compound_name"] for r in final})

    def norm(text: str) -> str:
        return re.sub(r"[^a-z0-9]", "", text.lower())

    collide = {
        n: [o for o in names if o != n and (norm(n) in norm(o) or norm(o) in norm(n))]
        for n in names
    }
    collide = {k: v for k, v in collide.items() if v}
    for name, hit in collide.items():
        print(f"        {name!r} still matches {hit}")
    check("every selector is addressable", not collide, f"{len(collide)} colliding")

    for label, handle in NEW_PENS:
        rows = [r for r in final if r["compound_name"] == handle]
        named = all(word_re(label).search(r["video_prompt"]) for r in rows)
        check(f"{handle}: {ROWS_EACH} rows naming {label!r}", len(rows) == ROWS_EACH and named, len(rows))

    required = [
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
    for field in required:
        blank = [r["creation_id"] for r in final if not str(r.get(field, "")).strip()]
        check(f"{field} filled", not blank, f"{len(blank)} blank")

    for field, want in (("aspect_ratio", "9:16"), ("duration_seconds", "15"), ("resolution", "1080p")):
        off = sorted({str(r[field]) for r in final if str(r[field]).strip() != want})
        check(f"{field} == {want}", not off, off or "clean")

    vial = re.compile(r"vial visual lock|flip-?off|clear glass research vial|uncap|pop off", re.I)
    leak = [r["creation_id"] for r in final if vial.search(r["video_motion_prompt"])]
    check("no vial language in motion", not leak, f"{len(leak)} rows")

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1
    print("\nAll checks passed.")

    compounds = Counter(r["compound_name"] for r in final)
    print(f"\n{len(final)} rows, {len(compounds)} compounds")

    if not write:
        print("\nDry run. Re-run with --write to emit the payloads and update the mirror.")
        return 0

    with MIRROR.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(final)
    print(f"\nwrote {MIRROR.relative_to(ROOT.parent)} ({len(final)} rows)")

    payload = SHEETS / "14-pen-creations-rebuild.json"
    payload.write_text(
        json.dumps({"count": len(final), "columns": columns, "rows": final}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {payload.relative_to(ROOT.parent)}")

    audit = SHEETS / "14-pen-creations-new-36.csv"
    with audit.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(new_rows)
    print(f"wrote {audit.relative_to(ROOT.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
