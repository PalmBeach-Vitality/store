#!/usr/bin/env python3
"""Rewrite video_motion_prompt to short I2V-safe camera prompts (fixes xAI 400 Bad Request).

Grok video (image-to-video) already has the still — do NOT re-paste the full scene paragraph.
Long prompts (~3k chars) frequently return HTTP 400 invalid_argument.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV9 = SHEETS / "9-lab-item-creations-500.csv"
CSV9_250 = SHEETS / "9-lab-item-creations-250.csv"
JSON9 = ROOT / "pbvita-500-lab-item-creations.json"

MAX_MOTION = 1200  # well under xAI ~4096; keeps I2V reliable


def build_motion_prompt(row: dict) -> str:
    compound = (row.get("compound_name") or "").strip()
    label = (
        f"Keep any visible product label as '{compound}' only."
        if compound
        else "Do not add new product labels or counters."
    )
    prompt = (
        f"Animate this exact Palm Beach Vitality laboratory research still in vertical 9:16. "
        f"SHOT: {row.get('shot_family') or 'push_in'}. "
        f"ANGLE: {row.get('camera_angle') or 'eye-level'}. "
        f"DIRECTION: {row.get('camera_direction') or 'forward'}. "
        f"CAMERA MOVE: {row.get('camera_move') or 'slow push-in'}. "
        f"FRAMING: {row.get('framing') or 'medium product framing'}. "
        f"Keep lighting ({row.get('lighting') or 'clinical catalog lighting'}) and "
        f"surface ({row.get('surface') or 'clean laboratory surface'}) unchanged. "
        f"Preserve every object, material, and depth cue from the still — no morphing, no new props. "
        f"Motion path is straight or a simple tilt/pedestal/truck only — never orbit. "
        f"{label} "
        f"No people, hands, faces, needles, injection, watermarks, captions, or burn-in text. "
        f"For laboratory research use only. Not for human use or consumption."
    )
    if len(prompt) > MAX_MOTION:
        # Keep camera clause; trim framing if needed
        prompt = prompt[: MAX_MOTION - 1].rstrip() + "."
    return prompt


def main() -> None:
    with CSV9.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 500:
        raise SystemExit(f"expected 500 rows, got {len(rows)}")

    for r in rows:
        r["video_motion_prompt"] = build_motion_prompt(r)

    lens = [len(r["video_motion_prompt"]) for r in rows]
    if max(lens) > MAX_MOTION:
        raise SystemExit(f"motion still too long: {max(lens)}")
    if len({r["video_motion_prompt"] for r in rows}) < 400:
        # cameras are unique so prompts should be nearly unique
        print(
            f"WARN: only {len({r['video_motion_prompt'] for r in rows})} unique motion prompts"
        )

    fields = list(rows[0].keys())
    for path in (CSV9, CSV9_250):
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote {path}")

    JSON9.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {JSON9}")
    print(
        f"PASS: motion prompts min/avg/max = {min(lens)}/{sum(lens)//500}/{max(lens)}"
    )
    print("sample:", rows[0]["video_motion_prompt"])


if __name__ == "__main__":
    main()
