#!/usr/bin/env python3
"""Lock FILM-023/024: no gloves, FILM-004 watch-orientation wrist device."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

TAKES_023 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-3f7680cc.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-cec66435.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-78018cb3.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-490e8b55.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-87a59835.png"
)

VIAL = (
    "Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue "
    "plastic flip-off cap on a brushed-silver aluminum crimp over a rubber "
    "septum, clean white wrap-around label with a dark maroon DNA double-helix "
    "icon centered at the top, the name 'MOTS-C' in large bold dark maroon "
    "sans-serif printed once, a solid dark maroon rectangle badge with white "
    "text exactly '10mg'. The liquid inside glows a warm golden-white from "
    "within like a charged power cell, soft light spilling onto nearby surfaces."
)
DEVICE = (
    "SAME square left-wrist device as FILM-004 / FILM-005: a rectangular "
    "blocky SQUARE gunmetal box strapped exactly onto the BACK (dorsal / outer "
    "side) of her LEFT wrist bone, housing no wider than the wrist. Square "
    "housing, square amber-orange screen with only slightly rounded corners, "
    "square or rectangular buttons and sliders on the SIDES of the box. Watch "
    "orientation: the screen sits on the back of the wrist facing OUT, not "
    "toward the palm. The TOP of the screen (MOTS-C text) points toward her "
    "fingers; the BOTTOM of the screen points toward her forearm. NOT rotated "
    "90 degrees. NOT sideways toward the thumb. NOT a long rectangle running "
    "along the forearm. NOT on the inner wrist. NOT a face-on product shot "
    "pointed at the camera. Screen shows only the square amber-orange MOTS-C "
    "readout — no heart-rate, no temperature, no 36.7, no medical HUD. NO "
    "ROUND SHAPES. ALWAYS on her LEFT wrist."
)
NO_GLOVES = (
    "Her LEFT hand is BARE skin — palm, fingers, and thumb fully visible, "
    "anatomically correct. NO gloves. NO gauntlets. NO space-suit gloves. NO "
    "tactical gloves."
)
STILL_023 = (
    "Money-shot keyframe, 9:16 vertical. Extreme close-up of the handoff: the "
    "alien's slender pearl-white fingers placing the glowing vial into the "
    f"astronaut's BARE LEFT open palm, label facing camera perfectly readable: "
    f"{VIAL} {NO_GLOVES} {DEVICE} Golden glow lighting both bare hands, "
    "shallow depth of field, dusk ocean and palm bokeh. Photoreal cinematic "
    "sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere "
    "except the vial label and the wrist-device screen. No logos, no captions, "
    "no watermarks. No faces. No extra people. No gloves."
)
STILL_024 = (
    "Keyframe, 9:16 vertical. Close on the astronaut's BARE LEFT hand seating "
    "the glowing vial into the SAME FILM-013 circular brushed-metal core well: "
    f"{VIAL} {NO_GLOVES} {DEVICE} Golden energy floods outward through the "
    "recessed gold radial vein conduits, sparks of light, the red warning glow "
    "dying as gold takes over. NOT a crystal socket. NOT a hose nest. "
    "Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No "
    "readable text anywhere except the vial label and the wrist-device screen. "
    "No logos, no captions, no watermarks. No faces. No extra people. No gloves."
)
EDIT_023 = (
    "Keep this exact handoff camera, vial, and alien pearl-white fingers. "
    "REMOVE every glove. The astronaut hand must be BARE LEFT skin — palm, "
    "fingers, thumb visible. Put the FILM-004 square gunmetal wrist computer "
    "on the BACK of her LEFT wrist in watch orientation: screen faces out "
    "from the dorsal wrist, MOTS-C text toward the fingers, not rotated 90 "
    "degrees, not along the forearm, not a medical HUD. No gloves."
)
EDIT_024 = (
    "Keep this exact insert camera and vial. REMOVE every glove. Bare LEFT "
    "hand only. FILM-004 square device on the BACK of her LEFT wrist, watch "
    "orientation: MOTS-C text toward the fingers, not rotated 90 degrees. "
    "Seat the vial in the FILM-013 circular brushed-metal well, not a crystal "
    "socket. No gloves."
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        sid = (row.get("still_id") or "").strip()
        if sid == "FILM-023":
            row["still_prompt"] = STILL_023
            row["still_edit_prompt"] = EDIT_023
            row["take_urls"] = TAKES_023
            row["times_used"] = "1"
            row["last_used_at"] = "2026-08-29T17:31:58.959-04:00"
            locked += 1
        elif sid == "FILM-024":
            row["still_prompt"] = STILL_024
            row["still_edit_prompt"] = EDIT_024
            locked += 1

    if locked != 2:
        raise SystemExit(f"expected 2 hand rows, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked {locked} rows in {CSV_PATH}")


if __name__ == "__main__":
    main()
