#!/usr/bin/env python3
"""Rewrite Sheet 14 catalog prompts: production-row → exactly 1 pen / 1 compound.

Keeps the live catalog lock (white matte longer barrel, white clip-cap ON,
white ridged dial, crimson peptide / cobalt Sema-Tirz-Reta, 10mg badge,
DNA helix with no hands, vertical For Research Purposes Only, no orange).
Does not invent a new look — only flips COUNT and camera from a lineup
to a single hero.

Safe to re-run. Does not touch times_used / last_used_at.
"""

from __future__ import annotations

import csv
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV14 = SHEETS / "14-pen-creations-150.csv"

METABOLIC = {"Semaglutide", "Tirzepatide", "Retatrutide"}
PROMPT_MAX = 7900

# Longest replacements first so leftovers do not re-match shorter fragments.
REPLACES = (
    (
        "This is a PRODUCTION ROW of identical freshly made pens, camera pulled back, each pen small in frame. Not one oversized close-up. Lined up as just produced. No vials. No mixed SKUs. Caps on.",
        "This is exactly ONE freshly made pen, camera closer on the one hero. Product count = 1. No extra pens. No vials. No mixed SKUs. Cap on.",
    ),
    (
        "caps on, production row;",
        "cap on, COUNT=1;",
    ),
    (
        "Render a production row of identical smooth matte white cylindrical insulin-style Palm Beach Vitality research pens labeled",
        "Render exactly ONE smooth matte white cylindrical insulin-style Palm Beach Vitality research pen labeled",
    ),
    (
        "a production row of identical capped research pens, lined up as just produced, camera pulled back (never a vial, never one giant close-up pen)",
        "exactly ONE capped research pen as a catalog hero (never a vial, never two pens, never a production row)",
    ),
    (
        "a collection of identical matte white catalog insulin-style research pens lined up on",
        "exactly ONE matte white catalog insulin-style research pen on",
    ),
    (
        "lined up as if they were just produced. Camera PULLED BACK. Each pen SMALL in the frame.",
        "as a single catalog hero. Camera closer on the one pen. Product count = 1.",
    ),
    (
        "Camera PULLED BACK. Each pen SMALL in the frame.",
        "Camera closer on the one pen. Product count = 1.",
    ),
    (
        "FORBIDDEN: one oversized hero pen filling the frame",
        "FORBIDDEN: extra pens, production row, lineup, cluster, second pen",
    ),
    (
        "pulled-back wide still of a production row of identical LONGER full-length matte white catalog insulin-style research pens, not stubby, each pen small in frame, not one giant close-up",
        "catalog hero still of exactly ONE LONGER full-length matte white catalog insulin-style research pen, not stubby, one pen only, not a production row",
    ),
    (
        "production row of identical catalog injectors — just produced, lined up, camera pulled back, each pen small in frame",
        "exactly ONE catalog injector — single hero, camera closer, one compound on one pen",
    ),
    (
        "Keep the exact same production row of identical matte white catalog",
        "Keep the exact same single matte white catalog",
    ),
    (
        "pens, camera pulled back, each pen small in frame",
        "pen, camera closer on the one hero, product count = 1",
    ),
    (
        "Do not zoom into one giant pen",
        "Do not add extra pens or a production row",
    ),
    (
        "production row of identical",
        "exactly one",
    ),
    (
        "a collection of identical",
        "exactly one",
    ),
    (
        "lined up as if they were just produced",
        "as a single catalog hero",
    ),
    (
        "Lined up as just produced",
        "Single catalog hero",
    ),
    (
        "lined up as just produced",
        "as a single catalog hero",
    ),
    (
        "each pen SMALL in the frame",
        "the one pen is the catalog hero",
    ),
    (
        "each pen small in frame",
        "one pen only",
    ),
    (
        "camera pulled back",
        "camera closer on the one pen",
    ),
    (
        "Camera pulled back",
        "Camera closer on the one pen",
    ),
    (
        "Caps stay ON",
        "Cap stays ON",
    ),
    (
        "on every pen",
        "on the pen",
    ),
    (
        "STRETCH each barrel longer",
        "STRETCH the barrel longer",
    ),
    (
        "pens labeled",
        "pen labeled",
    ),
)

TEXT_KEYS = (
    "lab_item",
    "material_detail",
    "scene_brief",
    "quality_suffix",
    "hero_style",
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
)


def squeeze(s: str) -> str:
    t = str(s or "")
    while "  " in t:
        t = t.replace("  ", " ")
    return t.strip()


def apply_replaces(text: str) -> str:
    t = str(text or "")
    for old, new in REPLACES:
        t = t.replace(old, new)
    return squeeze(t)


def accent(compound: str) -> tuple[str, str, str]:
    if compound in METABOLIC:
        return "cobalt blue", "metabolic", "cobalt blue text and logo"
    return "crimson red", "peptide", "crimson red text and logo"


def still_edit_count1(name: str) -> str:
    color, sku, lock = accent(name)
    return squeeze(
        "CRITICAL PRODUCT FIX: Keep this exact catalog pen, then remove every extra pen until only ONE remains. "
        "White matte barrel, white clip-cap ON, white ridged dose dial (NOT orange). "
        f"Logo ABOVE the name: {color} DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. "
        f"Name '{name}' large bold {color} sans-serif. Solid {color} rectangle badge with white '10mg'. "
        "Fine-print black lines under the name. Vertical label text: For Research Purposes Only. "
        f"This is a {sku} SKU — {lock} on the pen. Camera closer, 9:16, one compound / one pen. "
        "STRETCH the barrel longer — full-length adult injector, not stubby. "
        "DELETE extra pens, production rows, lineups, clusters. DELETE hands around the DNA helix. "
        "DELETE orange, burgundy vial branding, palm trees, mixed compounds, vials, needles, syringes, scales, trays. "
        "After the edit: count exactly 1 longer white pen, zero extra pens, zero vials, zero hands on the logo. Cap on."
    )


def rewrite_row(row: dict[str, str]) -> dict[str, str]:
    out = dict(row)
    name = str(out.get("compound_name") or "").strip()
    if not name:
        raise SystemExit(f"empty compound_name on {out.get('creation_id')}")
    for key in TEXT_KEYS:
        if key == "still_edit_prompt":
            out[key] = still_edit_count1(name)
        elif key in out:
            out[key] = apply_replaces(out[key])
        if key in ("video_prompt", "video_motion_prompt", "still_edit_prompt") and len(out[key]) > PROMPT_MAX:
            out[key] = out[key][:PROMPT_MAX]
    return out


# Positive leftovers that still ASK for a lineup (forbidden mentions are OK).
FORBIDDEN_LEFTOVERS = (
    "render a production row",
    "this is a production row",
    "caps on, production row",
    "lined up as if they were just produced",
    "lined up as just produced",
    "each pen small in the frame",
    "each pen small in frame",
    "camera pulled back",
    "one oversized hero pen filling the frame",
)


def validate(rows: list[dict[str, str]]) -> None:
    for row in rows:
        blob = " ".join(str(row.get(k) or "") for k in TEXT_KEYS).lower()
        for bad in FORBIDDEN_LEFTOVERS:
            if bad in blob:
                raise SystemExit(f"{row['creation_id']} still has leftover {bad!r}")
        if "exactly 1" not in blob and "exactly one" not in blob and "only one" not in blob:
            raise SystemExit(f"{row['creation_id']} missing COUNT=1 lock")
        if "orange ridged" in blob or "3ml pen" in blob:
            raise SystemExit(f"{row['creation_id']} drifted back to orange/3ml look")


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else CSV14
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else CSV14
    fieldnames, rows = read_csv(src)
    if "still_n" not in fieldnames:
        fieldnames.append("still_n")
    out = []
    for row in rows:
        rewritten = rewrite_row(row)
        if not str(rewritten.get("still_n") or "").strip():
            rewritten["still_n"] = "1"
        out.append(rewritten)
    validate(out)
    write_csv(dst, fieldnames, out)
    print(f"wrote {len(out)} COUNT=1 pen rows → {dst}")


if __name__ == "__main__":
    main()
