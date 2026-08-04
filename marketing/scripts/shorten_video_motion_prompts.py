#!/usr/bin/env python3
"""Rewrite video_motion_prompt to short I2V-safe camera prompts (fixes xAI 400 Bad Request).

Grok video (image-to-video) already has the still — do NOT re-paste the full scene paragraph.
Includes NO DOUBLES rule for motion continuity.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV9 = SHEETS / "9-lab-item-creations-500.csv"
CSV9_250 = SHEETS / "9-lab-item-creations-250.csv"
JSON9 = ROOT / "pbvita-500-lab-item-creations.json"

MAX_MOTION = 700


def ascii(s: str) -> str:
    s = str(s or "")
    s = (
        s.replace("‘", "'")
        .replace("’", "'")
        .replace("“", '"')
        .replace("”", '"')
        .replace("–", "-")
        .replace("—", "-")
        .replace("−", "-")
        .replace("…", "...")
        .replace("×", "x")
    )
    s = re.sub(r"[^\x09\x0A\x0D\x20-\x7E]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def build_motion_prompt(row: dict) -> str:
    compound = ascii(row.get("compound_name") or "")
    move = ascii(row.get("camera_move") or "slow push-in")[:160]
    prompt = (
        f"Slow cinematic camera: {move}. "
        f"Shot {ascii(row.get('shot_family') or 'push_in')}, "
        f"angle {ascii(row.get('camera_angle') or 'eye-level')}, "
        f"direction {ascii(row.get('camera_direction') or 'forward')}. "
        f"Keep the exact same laboratory research scene, materials, and lighting. "
        f"No orbit. No new objects. No duplicate props. No repeated text or graphics. "
        f"No people, hands, faces, needles, watermarks, or burn-in. "
        f"For laboratory research use only."
    )
    if compound:
        prompt += f" Keep label '{compound}' unchanged if visible, once only."
    prompt = ascii(prompt)
    if len(prompt) > MAX_MOTION:
        prompt = prompt[: MAX_MOTION - 1].rsplit(" ", 1)[0] + "."
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

    fields = list(rows[0].keys())
    for path in (CSV9, CSV9_250):
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote {path}")

    JSON9.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {JSON9}")
    print(f"PASS: motion min/avg/max = {min(lens)}/{sum(lens)//500}/{max(lens)}")
    print("sample:", rows[0]["video_motion_prompt"])


if __name__ == "__main__":
    main()
