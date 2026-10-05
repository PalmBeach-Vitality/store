#!/usr/bin/env python3
"""Rebuild lab + wellness video_motion_prompt so background props stay put.

Kling I2V was told "No new objects" and, on wellness, "laboratory research scene",
while the camera move revealed new background. It drew props, then erased them.

This pass rewrites video_motion_prompt only. The still (video_prompt) stays.
The camera path is the row's own camera_move / shot_family / angle / direction.
The printed label quote already in the motion cell is kept.

    python3 marketing/scripts/repair_i2v_motion_continuity.py            # dry run
    python3 marketing/scripts/repair_i2v_motion_continuity.py --write
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

from lock_lab_bottle_still import LOCK as LAB_LOCK
from lock_lab_bottle_still import build_motion as build_lab_motion

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
LAB = SHEETS / "9-lab-item-creations-500.csv"
WELLNESS = SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv"

LOCK = (
    "CAMERA LOCK: the vial never moves. It stays planted on its base, "
    "upright and still. If anything travels, it is the camera, not the bottle. "
    "Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, "
    "floating, or turning like a turntable. "
)
CONTINUITY = (
    "Keep the same setting, materials, and lighting already in the still. "
    "Every background object already in frame stays solid and visible. "
    "Nothing fades in, fades out, appears, or disappears."
)
LABEL_RE = re.compile(r"Keep label '([^']*)' unchanged")
ORBIT_RE = re.compile(r"\borbit\b", re.I)


def squeeze(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def label_of(motion: str, cid: str) -> str:
    found = LABEL_RE.findall(motion or "")
    if len(found) != 1 or not found[0].strip():
        raise SystemExit(f"{cid}: motion prompt needs exactly one Keep label quote")
    return found[0]


def build_motion(row: dict, *, lab: bool) -> str:
    cid = squeeze(row.get("creation_id"))
    if not cid:
        raise SystemExit("row missing creation_id")
    move = squeeze(row.get("camera_move"))
    family = squeeze(row.get("shot_family"))
    angle = squeeze(row.get("camera_angle"))
    direction = squeeze(row.get("camera_direction"))
    for name, val in (
        ("camera_move", move),
        ("shot_family", family),
        ("camera_angle", angle),
        ("camera_direction", direction),
    ):
        if not val:
            raise SystemExit(f"{cid}: empty {name}")
    if lab:
        return build_lab_motion(row)
    printed = label_of(row.get("video_motion_prompt") or "", cid)
    no_orbit = ""
    if lab and not ORBIT_RE.search(move):
        no_orbit = "No orbit. "
    return (
        f"{LOCK}"
        f"Slow cinematic camera: {move}. "
        f"Shot {family}, angle {angle}, direction {direction}. "
        f"{CONTINUITY} "
        f"{no_orbit}"
        f"No people, hands, faces, or burn-in. "
        f"Keep label '{printed}' unchanged if visible, once only."
    )


def patch(path: Path, *, lab: bool, expect: int, write: bool) -> dict:
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != expect:
        raise SystemExit(f"{path.name}: expected {expect} rows, got {len(rows)}")
    changed = 0
    for row in rows:
        nxt = build_motion(row, lab=lab)
        if "No new objects" in nxt or "laboratory research scene" in nxt:
            raise SystemExit(f"{row['creation_id']}: fade sentence survived")
        if nxt != row.get("video_motion_prompt"):
            changed += 1
        row["video_motion_prompt"] = nxt
    if write:
        fields = list(rows[0].keys())
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
            w.writeheader()
            w.writerows(rows)
    return {"path": path.name, "rows": len(rows), "changed": changed, "rows_out": rows}


def assert_samples(lab_rows: list[dict], well_rows: list[dict]) -> None:
    by_lab = {r["creation_id"]: r["video_motion_prompt"] for r in lab_rows}
    by_well = {r["creation_id"]: r["video_motion_prompt"] for r in well_rows}
    m501 = by_lab["PBVita-Lab-501"]
    if "crane-down" not in m501:
        raise SystemExit("PBVita-Lab-501 motion is not the crane settle on the row")
    if "side-profile" in m501:
        raise SystemExit("PBVita-Lab-501 still carries the side-profile track")
    m067 = by_lab["PBVita-Lab-067"]
    if "never a full circle" not in m067:
        raise SystemExit("PBVita-Lab-067 profile line is still chopped")
    if "No orbit." not in m501:
        raise SystemExit("lab non-orbit row lost No orbit")
    w501 = by_well["LI-501"]
    if "unique recipe LI-501" not in w501 or "LI-028" in w501:
        raise SystemExit("LI-501 motion still names the donor recipe")
    orbits = [r for r in well_rows if ORBIT_RE.search(r["camera_move"] or "")]
    if not orbits:
        raise SystemExit("wellness orbit rows missing")
    if any("No orbit." in r["video_motion_prompt"] for r in orbits):
        raise SystemExit("wellness orbit row was told No orbit")
    if any("No orbit." in r["video_motion_prompt"] for r in well_rows):
        raise SystemExit("wellness motion should not say No orbit")
    for r in lab_rows:
        motion = r["video_motion_prompt"]
        if not motion.startswith(LAB_LOCK):
            raise SystemExit(f"{r['creation_id']}: bottle lock missing")
        if "The small DNA mark keeps the same shape" not in motion:
            raise SystemExit(f"{r['creation_id']}: DNA mark line missing")
    for r in well_rows:
        motion = r["video_motion_prompt"]
        if not motion.startswith(LOCK):
            raise SystemExit(f"{r['creation_id']}: CAMERA LOCK missing")
    for r in lab_rows + well_rows:
        motion = r["video_motion_prompt"]
        if CONTINUITY not in motion:
            raise SystemExit(f"{r['creation_id']}: continuity sentence missing")
        if "needles" in motion:
            raise SystemExit(f"{r['creation_id']}: needles leaked back into motion")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    lab = patch(LAB, lab=True, expect=535, write=args.write)
    well = patch(WELLNESS, lab=False, expect=601, write=args.write)
    assert_samples(lab["rows_out"], well["rows_out"])
    mode = "WROTE" if args.write else "DRY RUN"
    print(
        f"PASS {mode}: lab {lab['rows']} changed {lab['changed']}; "
        f"wellness {well['rows']} changed {well['changed']}. "
        "video_prompt untouched."
    )


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)
