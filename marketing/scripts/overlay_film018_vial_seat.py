#!/usr/bin/env python3
"""Lock FILM-018 reseat-only edit prompt. Sync exec 1628 take_urls."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

VIAL = (
    "Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue "
    "plastic flip-off cap on a brushed-silver aluminum crimp over a rubber septum, "
    "clean white wrap-around label with a dark maroon DNA double-helix icon "
    "centered at the top, the name 'MOTS-C' in large bold dark maroon sans-serif "
    "printed once, a solid dark maroon rectangle badge with white text exactly '10mg'."
)
CORE = (
    "SAME engine core as FILM-013 / core_port_dim: a circular recessed well of "
    "concentric dark charcoal brushed-metal rings, hex bolts, segmented gunmetal "
    "plates. Thin gold energy conduits run as radial spokes recessed into the metal "
    "like veins. Camera looks slightly down into that circular well. NOT a faceted "
    "crystal ring. NOT a glass jewel socket. NOT a nest of thick ribbed rubber hoses "
    "filling the frame. NOT a large radar or HUD monitor as the hero."
)
SEAT = (
    "The vial is dropped fully into the center of the circular well: glass base "
    "flush on the socket floor, locked in like a power cartridge in a recessed bay "
    "— not hovering, not floating above the hole, not perched on the rim, not "
    "offset. Real contact shadow where glass meets metal. Perfectly vertical, "
    "label facing camera."
)
STILL_018 = (
    "Opening keyframe, 9:16 vertical. Macro of the SAME engine core port as FILM-013. "
    f"{CORE} {VIAL} {SEAT} The golden liquid glow is fading and flickering "
    "(not full-bright, not fully dead). Gold conduits dim one by one. A red warning "
    "glow begins to pulse at the frame edges. Tense cinematic mood. Photoreal "
    "cinematic sci-fi commercial still, 8k, HDR, razor sharp. No people, no astronaut, "
    "no hands, no wrist device, no extra vials. No readable text anywhere except the "
    "vial label. No logos, no captions, no watermarks."
)
EDIT_018 = (
    "Keep this EXACT circular brushed-metal core: same concentric rings, same hex "
    "bolts, same radial gold vein conduits, same camera looking slightly down into "
    "the well. Do not redesign the core. Only reseat the MOTS-C 10mg vial: drop it "
    "fully into the center of the circular well so the glass base sits flush on the "
    "socket floor, locked in like a power cartridge in a recessed bay. Not hovering. "
    "Not floating above the hole. Not perched on the rim. Not offset to one side. "
    "Perfectly vertical, label facing camera. Add a real contact shadow where glass "
    "meets metal. Keep the fading flickering glow and red warning at the edges. No "
    "people, no extra vials, no hands."
)
TAKES_1628 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d735323d-d01a-9885-80b0-e885409be4de-7aa0e977.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d735323d-d01a-9885-80b0-e885409be4de-2878a167.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d735323d-d01a-9885-80b0-e885409be4de-699bfa17.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d735323d-d01a-9885-80b0-e885409be4de-180822fe.png"
)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        if (row.get("still_id") or "").strip() != "FILM-018":
            continue
        row["still_prompt"] = STILL_018
        row["still_edit_prompt"] = EDIT_018
        row["take_urls"] = TAKES_1628
        row["times_used"] = "1"
        row["last_used_at"] = "2026-08-29T14:19:59.441-04:00"
        locked += 1

    if locked != 1:
        raise SystemExit(f"expected FILM-018, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked {locked} row in {CSV_PATH}")


if __name__ == "__main__":
    main()
