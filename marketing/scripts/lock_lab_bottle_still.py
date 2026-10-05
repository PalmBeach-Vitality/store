#!/usr/bin/env python3
"""Keep the Sheet 9 bottle and its printed DNA mark still. The camera travels.

Exec 2647 (PBVita-Lab-398) sent a CAMERA LOCK that named sliding and spinning,
then ended the pedestal in "then hold". Kling moved the vial and twisted the
printed DNA mark. This pass rewrites camera_move and video_motion_prompt only.
video_prompt, times_used, and the still stay as they are.
static_lock and doc_drift speak direction forward.
Live write: lock_lab_bottle_still 5m4Wfq418VfQQkyB exec 2648,
then fix_lab_static_lock_direction 8ekpdsxhSnWhsniY exec 2649.

    python3 marketing/scripts/lock_lab_bottle_still.py
    python3 marketing/scripts/lock_lab_bottle_still.py --write
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV9 = ROOT / "sheets" / "9-lab-item-creations-500.csv"

LOCK = (
    "The glass bottle stays planted on its base, upright, the same object as the first frame. "
    "The cap stays seated and closed. "
    "The label is flat printed ink. The small DNA mark keeps the same shape and the same place on the glass. "
    "Only the camera travels. "
)
CONTINUITY = (
    "Keep the same setting, materials, and lighting already in the still. "
    "Every background object already in frame stays solid and visible. "
    "Nothing fades in, fades out, appears, or disappears."
)
LABEL_RE = re.compile(r"Keep label '([^']*)'")
HOLD_RE = re.compile(
    r",?\s*then settle and hard hold|,?\s*then hard hold|,?\s*then hold",
    re.I,
)
ORBIT_RE = re.compile(r"\borbit\b", re.I)
BANNED = (
    "then hold",
    "hard hold",
    "locked tripod",
    "does not travel",
    "lighting wrap",
    "forbidden",
    "handheld",
    "frozen",
    "static_lock",
    "label lock",
    "drift",
    "no travel",
)


def squeeze(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def label_of(motion: str, cid: str) -> str:
    found = LABEL_RE.findall(motion or "")
    if len(found) != 1 or not found[0].strip():
        raise SystemExit(f"{cid}: motion prompt needs exactly one Keep label quote")
    return found[0]


def clean_camera(move: str, family: str) -> str:
    raw = squeeze(move)
    if family == "static_lock" or "locked tripod" in raw:
        found = re.search(r"at ([^,]+), subject ([^,]+)", raw)
        angle = found.group(1).strip() if found else ""
        place = found.group(2).strip() if found else ""
        if not angle or not place:
            raise SystemExit(f"static_lock camera could not be read: {raw}")
        return (
            f"slow straight dolly-in a few centimeters at {angle}, "
            f"subject {place}, one continuous move for the whole shot"
        )
    if family == "doc_drift" or "handheld" in raw or "micro drift" in raw:
        found = re.search(r"\bat ([^,]+)", raw)
        angle = found.group(1).strip() if found else ""
        angle = angle.replace("slight handheld high", "slight-high")
        angle = angle.replace("slight handheld low", "slight-low")
        angle = angle.replace("documentary", "")
        angle = squeeze(angle).strip(" ,")
        if not angle:
            raise SystemExit(f"doc_drift camera could not be read: {raw}")
        return (
            f"slow straight dolly-in a few centimeters at {angle}, "
            "one continuous move for the whole shot, no circling path"
        )
    text = raw.replace(", lighting wrap shifts on edges", "")
    text = text.replace("lighting wrap shifts on edges, ", "")
    text = re.sub(
        r"(?:creeping|ultra-slow|barely moving) tiny forward drift only",
        "slow continuous move closer",
        text,
        flags=re.I,
    )
    text = HOLD_RE.sub("", text)
    text = text.replace("—", ",")
    text = text.replace("focus locked on subject", "the bottle stays in focus")
    text = text.replace("then lock off on the label plane", "continuing across the label")
    text = text.replace("(straight up to label lock)", "(straight up across the label)")
    text = text.replace("locked offset composition", "offset composition")
    text = text.replace("locked with breath ", "")
    text = text.replace("slight handheld high", "slight-high")
    text = text.replace("slight handheld low", "slight-low")
    text = squeeze(text).strip(" ,")
    if "one continuous move for the whole shot" not in text:
        text = text.rstrip(".") + ", one continuous move for the whole shot"
    return squeeze(text)


def build_motion(row: dict) -> str:
    cid = squeeze(row.get("creation_id"))
    if not cid:
        raise SystemExit("row missing creation_id")
    family = squeeze(row.get("shot_family"))
    angle = squeeze(row.get("camera_angle"))
    direction = squeeze(row.get("camera_direction"))
    move = squeeze(row.get("camera_move"))
    for name, val in (
        ("shot_family", family),
        ("camera_angle", angle),
        ("camera_direction", direction),
        ("camera_move", move),
    ):
        if not val:
            raise SystemExit(f"{cid}: empty {name}")
    printed = label_of(row.get("video_motion_prompt") or "", cid)
    camera = clean_camera(move, family)
    spoken_angle = squeeze(
        angle.replace("documentary", "")
        .replace("slight handheld high", "slight-high")
        .replace("slight handheld low", "slight-low")
    )
    spoken_direction = "forward" if family in ("doc_drift", "static_lock") else direction
    shot = f"Angle {spoken_angle}, direction {spoken_direction}. "
    no_orbit = ""
    if not ORBIT_RE.search(move) and not ORBIT_RE.search(camera):
        no_orbit = "No orbit. "
    prompt = (
        f"{LOCK}"
        f"Slow cinematic camera: {camera}. "
        f"{shot}"
        f"{CONTINUITY} "
        f"{no_orbit}"
        f"No people, hands, faces, or burn-in. "
        f"Keep label '{printed}' unchanged if visible, once only."
    )
    prompt = squeeze(prompt)
    low = prompt.lower()
    for bad in BANNED:
        if bad in low:
            raise SystemExit(f"{cid}: banned {bad!r} in motion")
    if "the small dna mark keeps the same shape" not in low:
        raise SystemExit(f"{cid}: DNA mark line missing")
    if "only the camera travels" not in low:
        raise SystemExit(f"{cid}: camera line missing")
    if len(prompt) > 2500:
        raise SystemExit(f"{cid}: motion is {len(prompt)} characters")
    return prompt


def patch(path: Path, *, write: bool) -> dict:
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
        fields = list(rows[0].keys()) if rows else []
    if len(rows) != 535:
        raise SystemExit(f"{path.name}: expected 535 rows, got {len(rows)}")
    changed = 0
    for row in rows:
        motion = row.get("video_motion_prompt") or ""
        if motion.startswith(LOCK):
            raise SystemExit(f"{row.get('creation_id')}: bottle lock already applied")
        if not motion.startswith("CAMERA LOCK:"):
            raise SystemExit(f"{row.get('creation_id')}: motion is not the CAMERA LOCK pass")
        camera = clean_camera(row["camera_move"], row["shot_family"])
        nxt = build_motion(row)
        if camera != row["camera_move"] or nxt != motion:
            changed += 1
        row["camera_move"] = camera
        row["video_motion_prompt"] = nxt
    if write:
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
    return {"rows": len(rows), "changed": changed, "rows_out": rows}


def assert_rows(rows: list[dict]) -> None:
    by_id = {r["creation_id"]: r for r in rows}
    sample = by_id["PBVita-Lab-398"]
    motion = sample["video_motion_prompt"]
    camera = sample["camera_move"]
    if "pedestal up" not in camera or "one continuous move" not in camera:
        raise SystemExit("PBVita-Lab-398 camera is not a continuous pedestal")
    if "DNA mark" not in motion or "Only the camera travels" not in motion:
        raise SystemExit("PBVita-Lab-398 motion lost the bottle lock")
    if "CJC/Ipamorelin" not in motion:
        raise SystemExit("PBVita-Lab-398 lost its label quote")
    if not by_id["PBVita-Lab-501"]["video_motion_prompt"].find("crane-down") >= 0:
        raise SystemExit("PBVita-Lab-501 lost the crane")
    if "never a full circle" not in by_id["PBVita-Lab-067"]["video_motion_prompt"]:
        raise SystemExit("PBVita-Lab-067 lost the profile limit")
    stills = [r for r in rows if r["shot_family"] == "static_lock"]
    if len(stills) != 24:
        raise SystemExit(f"expected 24 static_lock rows, got {len(stills)}")
    if any("dolly-in" not in r["camera_move"] for r in stills):
        raise SystemExit("a static_lock row still has no camera travel")
    if any("direction forward" not in r["video_motion_prompt"] for r in stills):
        raise SystemExit("a static_lock row still says the camera does not travel")
    if any("no travel" in r["video_motion_prompt"].lower() for r in rows):
        raise SystemExit("a motion still says no travel")
    if any("VIAL VISUAL LOCK" not in r["video_prompt"] for r in rows):
        raise SystemExit("video_prompt was rewritten")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    result = patch(CSV9, write=args.write)
    assert_rows(result["rows_out"])
    mode = "WROTE" if args.write else "DRY RUN"
    sample = next(r for r in result["rows_out"] if r["creation_id"] == "PBVita-Lab-398")
    print(f"PASS {mode}: {result['rows']} rows, changed {result['changed']}")
    print("398 camera:", sample["camera_move"])
    print("398 motion:", sample["video_motion_prompt"])


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)
