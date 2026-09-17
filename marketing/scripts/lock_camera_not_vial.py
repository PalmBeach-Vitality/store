#!/usr/bin/env python3
"""Plant the vial. Camera travels. Lab + landscape I2V motion.

Salvatore, 2026-09-17, on the LI-016 Kling clip
(https://v3b.fal.media/files/b/0aaacccc/utS7Qisl3hW--2a2h1H8O_output.mp4):
the camera is supposed to move, not the vial. Fix both workflows.

CAP LOCK only froze the cap ("Camera may move; the cap does not"), so Kling
translated / spun the bottle. This pass prefixes every lab + wellness
video_motion_prompt with a planted-vial CAMERA LOCK. Unique Slow cinematic
camera recipes stay, including wellness orbits as camera paths. 5ml included.
Pens out of scope. Do not put this lock in prep_grok_video_start.

    python3 marketing/scripts/lock_camera_not_vial.py            # dry run
    python3 marketing/scripts/lock_camera_not_vial.py --write
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

FIELD = "video_motion_prompt"

OLD = (
    "CAP LOCK: One solid bright blue cap, seated and frozen. "
    "The cap stays closed. Camera may move; the cap does not. "
)
NEW = (
    "CAMERA LOCK: the vial never moves. It stays planted on its base, "
    "upright and still. If anything travels, it is the camera, not the bottle. "
    "Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, "
    "floating, or turning like a turntable. "
)


def apply_motion(text: str, cid: str) -> tuple[str, str]:
    raw = str(text or "")
    if not raw.strip():
        raise SystemExit(f"{cid}: empty {FIELD}")
    if raw.startswith(NEW):
        return raw, "already"
    if not raw.startswith(OLD):
        raise SystemExit(f"{cid}: unexpected {FIELD} prefix: {raw[:120]!r}")
    return NEW + raw[len(OLD) :], "replaced"


def patch_csv(path: Path, write: bool) -> dict:
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise SystemExit(f"{path}: empty")
    if FIELD not in rows[0]:
        raise SystemExit(f"{path}: missing column {FIELD}")

    counts: Counter[str] = Counter()
    unique_rest: set[str] = set()
    samples: dict[str, str] = {}
    max_len = 0
    for row in rows:
        cid = str(row.get("creation_id") or "?").strip()
        nxt, status = apply_motion(row.get(FIELD) or "", cid)
        row[FIELD] = nxt
        counts[status] += 1
        rest = nxt[len(NEW) :] if nxt.startswith(NEW) else nxt
        unique_rest.add(rest)
        max_len = max(max_len, len(nxt))
        if cid in ("LI-016", "PBVita-Lab-207", "PBVita-Lab-001", "LI-028"):
            samples[cid] = nxt

    if len(unique_rest) != len(rows):
        raise SystemExit(
            f"{path.name}: unique camera recipes collapsed "
            f"({len(unique_rest)} unique tails / {len(rows)} rows)"
        )

    if write:
        fields = list(rows[0].keys())
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(
                f, fieldnames=fields, extrasaction="ignore", lineterminator="\n"
            )
            w.writeheader()
            w.writerows(rows)

    leftover = sum(1 for r in rows if (r.get(FIELD) or "").startswith(OLD))
    camera = sum(1 for r in rows if (r.get(FIELD) or "").startswith(NEW))
    return {
        "path": str(path.relative_to(ROOT.parent)),
        "rows": len(rows),
        "replaced": counts["replaced"],
        "already": counts["already"],
        "camera_lock": camera,
        "leftover_cap_lock": leftover,
        "unique_tails": len(unique_rest),
        "max_len": max_len,
        "samples": samples,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    reports = [
        patch_csv(LAB_MIRROR, args.write),
        patch_csv(WELLNESS_MIRROR, args.write),
    ]
    for r in reports:
        print(
            f"{r['path']}: rows={r['rows']} replaced={r['replaced']} "
            f"already={r['already']} camera_lock={r['camera_lock']} "
            f"leftover_cap_lock={r['leftover_cap_lock']} "
            f"unique_tails={r['unique_tails']} max_len={r['max_len']}"
        )
        for cid, motion in r["samples"].items():
            print(f"  {cid}: {motion}")
        if r["leftover_cap_lock"]:
            raise SystemExit(f"{r['path']}: leftover CAP LOCK {r['leftover_cap_lock']}")
        if r["camera_lock"] != r["rows"]:
            raise SystemExit(f"{r['path']}: camera lock {r['camera_lock']} != rows {r['rows']}")

    mode = "WROTE" if args.write else "DRY RUN"
    print(f"PASS {mode}: planted-vial CAMERA LOCK on lab + wellness {FIELD}. Pens untouched.")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)
