#!/usr/bin/env python3
"""Apply wrist-on-wrist lock to marketing/sheets/18-motsc-film-stills.csv."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

OLD_WRIST = (
    "chunky retro-futuristic wrist computer on her left forearm "
    "with rotary dials and a small amber CRT screen"
)
NEW_WRIST = (
    "a small watch-scale retro-futuristic wrist computer strapped exactly onto "
    "her left wrist bone (the joint between forearm and hand), housing no wider "
    "than her wrist, with rotary dials and a small amber CRT. Her left hand, "
    "palm, fingers, and thumb stay fully visible past the device, anatomically "
    "correct. The device sits ON the wrist like a thick smartwatch — never a "
    "gauntlet, never a forearm tank, never a prosthetic, never replacing the "
    "hand, never covering the fingers"
)
OLD_FOREARM_VISIBLE = "wrist computer clearly visible on left forearm"
NEW_FOREARM_VISIBLE = (
    "wrist computer clearly visible sitting on her left wrist with her left "
    "hand and fingers fully visible"
)
OLD_DEVICE = (
    "Chunky retro-futuristic wrist-mounted computer strapped to a flight-suit forearm"
)
NEW_DEVICE = (
    "Watch-scale retro-futuristic wrist-mounted computer strapped exactly onto "
    "a flight-suit WRIST (the joint, not the hand), housing no wider than the "
    "wrist. A natural human left hand with palm, fingers, and thumb continues "
    "past the strap and stays fully visible. The device does not replace the "
    "hand, does not cover the fingers, and is not a giant gauntlet"
)
OLD_RAISED = "looking down at her raised left forearm:"
NEW_RAISED = (
    "looking down at her raised left wrist, her left hand and fingers still "
    "fully visible:"
)

ASTRONAUT_EDIT = (
    "Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest "
    "patch, lighting, backdrop, and pose. The wrist meter is too big and is "
    "replacing her left hand. Shrink it to a watch-scale device sitting EXACTLY "
    "on her left wrist only. Restore her natural left hand — palm, fingers, and "
    "thumb fully visible past the strap, anatomically correct, attached to her "
    "left arm. The device is a small retro-futuristic wrist computer with rotary "
    "dials and a small amber CRT, strapped around the wrist like a thick "
    "smartwatch. It must not cover or replace the hand, must not be a gauntlet, "
    "must not sit on the fingers. Do not change her face or anything else in "
    "the frame."
)
DEVICE_EDIT = (
    "Keep this exact wrist device, screen, and lighting. The device is too big "
    "and is replacing the hand. Shrink it to a watch-scale unit sitting EXACTLY "
    "on the wrist. Restore the natural left hand — palm, fingers, and thumb "
    "fully visible past the strap. Not a gauntlet, not a prosthetic. Do not "
    "change the screen text."
)
ASTRONAUT_IDS = {
    "FILM-001",
    "FILM-002",
    "FILM-003",
    "FILM-004",
    "FILM-019",
    "FILM-021",
}
DEVICE_IDS = {"FILM-005", "FILM-006"}
FILM001_TAKES = [
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-922976ae-4cd1-97eb-94da-2eae310a0ea0-e4873b78.png",
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-922976ae-4cd1-97eb-94da-2eae310a0ea0-de377bb3.png",
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-922976ae-4cd1-97eb-94da-2eae310a0ea0-90d66e5a.png",
]


def lock_prompt(text: str) -> str:
    t = text or ""
    t = t.replace(OLD_WRIST, NEW_WRIST)
    t = t.replace(OLD_FOREARM_VISIBLE, NEW_FOREARM_VISIBLE)
    t = t.replace(OLD_DEVICE, NEW_DEVICE)
    t = t.replace(OLD_RAISED, NEW_RAISED)
    return t.strip()[:7900]


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []
    if "still_edit_prompt" not in fieldnames:
        insert_at = fieldnames.index("still_prompt") + 1 if "still_prompt" in fieldnames else len(fieldnames)
        fieldnames.insert(insert_at, "still_edit_prompt")

    locked = 0
    for row in rows:
        still_id = (row.get("still_id") or "").strip()
        row["still_prompt"] = lock_prompt(row.get("still_prompt") or "")
        if still_id in ASTRONAUT_IDS:
            row["still_edit_prompt"] = ASTRONAUT_EDIT[:7900]
            locked += 1
        elif still_id in DEVICE_IDS:
            row["still_edit_prompt"] = DEVICE_EDIT[:7900]
            locked += 1
        else:
            row.setdefault("still_edit_prompt", "")
        if still_id == "FILM-001" and not (row.get("take_urls") or "").strip():
            row["take_urls"] = " | ".join(FILM001_TAKES)

    if locked != 8:
        raise SystemExit(f"expected 8 astronaut/device rows, got {locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {CSV_PATH} locked_rows={locked}")


if __name__ == "__main__":
    main()
