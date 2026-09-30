#!/usr/bin/env python3
"""Build marketing/sheets/24-site-tiles-4.csv, the four homepage collection tiles.

One row per tile in woocommerce-migration/theme/palmbeach-vitality/inc/homepage-shop.php.
Workflow `site_tiles_flux_gen` reads every generation value from this sheet. The prompts
are Salvatore's working drafts; he revises them on the live sheet, so re-mirror the live
tab before re-running this script or it will overwrite his edits.
"""

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "marketing" / "sheets" / "24-site-tiles-4.csv"

COLUMNS = [
    "tile_id",
    "status",
    "rank",
    "slug",
    "theme_filename",
    "overlay_eyebrow",
    "overlay_title",
    "model_still",
    "aspect_ratio",
    "output_format",
    "still_n",
    "still_takes",
    "still_timeout_seconds",
    "min_width",
    "min_height",
    "input_reference_urls",
    "still_prompt",
    "take_urls",
    "take_sizes",
    "take_cost_usd",
    "times_used",
    "last_used_at",
]

SHARED = {
    "status": "Active",
    "model_still": "black-forest-labs/flux.2-max",
    "aspect_ratio": "16:9",
    "output_format": "png",
    "still_n": 1,
    "still_takes": 3,
    "still_timeout_seconds": 300,
    "min_width": 1792,
    "min_height": 1008,
    "take_urls": "",
    "take_sizes": "",
    "take_cost_usd": "",
    "times_used": 0,
    "last_used_at": "",
}

PAVILION_LAB = (
    "Photorealistic wide 16:9 interior of a clean, futuristic beachside research laboratory inside a "
    "sleek white-and-brushed-silver glass pavilion raised on slim stilts right at the water's edge. "
    "Seamless floor-to-ceiling windows run top to bottom, frameless except for thin silver mullions, and "
    "wrap around a softly rounded glass corner. Through the glass: pale sand, leaning palm trees and gentle "
    "turquoise surf fading into soft white morning sea mist. Bright, airy, high-key light, soft diffuse "
    "daylight, no harsh shadows, a pale palette of white, silver, soft sand and sea-glass blue. Minimal, "
    "uncluttered interior: glossy white lab benches with rounded edges, brushed-aluminum trim, a thin "
    "recessed linear light strip in the white ceiling, a pale polished floor reflecting the windows."
)

CORNER_VIEW = (
    "Camera faces the curved glass corner with the ocean beyond; in the soft background a few neat glass "
    "beakers and a slim white monitor showing a faint blue molecule diagram. In the left foreground on a "
    "white bench sits a white glossy tray with a thin softly glowing blue edge."
)

WINDOW_WALL_VIEW = (
    "Camera looks down the long window wall toward the sea; in the soft background a slim white robotic "
    "arm works at a bench and a glass display shows a faint blue molecular network. In the left foreground "
    "on a white bench sits a white glossy tray with a thin softly glowing blue edge."
)

# One photo per tile, shared as Anyone with the link so Flux can fetch it.
DRIVE = "https://drive.usercontent.google.com/download?id={file_id}&export=download"

PRODUCT = (
    "On the tray, a straight row of five identical copies of the single product in the reference photo, "
    "laid so the label faces the camera. {detail} Copy that reference photo exactly: same shape, cap, "
    "colors, logo and every printed word. Do not invent a different compound, dose, or spelling. "
    "The products are crisp and in focus, with soft window light on the glass and plastic."
)

FINISH = (
    "Shallow depth of field, background gently soft, cinematic commercial product photography, high "
    "detail, clean clinical feel. The lower-left corner fades into a soft deep-navy shadow gradient so "
    "white text reads clearly. Text overlay in the "
    "bottom-left corner: small letter-spaced uppercase \"{eyebrow}\" in light sky-blue, and directly "
    "below it large bold white \"{title}\" in a modern geometric sans-serif. Rounded corners on the whole "
    "image. No people, no other text, no watermarks."
)


TILES = [
    {
        "tile_id": "TILE-01",
        "rank": 1,
        "slug": "peptides",
        "theme_filename": "home-peptides.jpg",
        "overlay_eyebrow": "VIALS",
        "overlay_title": "Peptides",
        "input_reference_urls": DRIVE.format(file_id="1W9wBLcjNMJG54HLpB7iErcJRPtGr0M_v"),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                CORNER_VIEW,
                PRODUCT.format(
                    detail=(
                        "It is a clear glass pharmaceutical vial with a bright blue flip-off cap, a polished "
                        "silver crimp collar, a white label, a crimson DNA helix, and a crimson dose band."
                    )
                ),
                FINISH.format(eyebrow="VIALS", title="Peptides"),
            ]
        ),
    },
    {
        "tile_id": "TILE-02",
        "rank": 2,
        "slug": "peptide-pens",
        "theme_filename": "home-peptide-pens.jpg",
        "overlay_eyebrow": "PENS",
        "overlay_title": "Peptides",
        "input_reference_urls": DRIVE.format(file_id="1clxbJQlcH8y4p2nnfunjvCK1CG07X8R3"),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                CORNER_VIEW,
                PRODUCT.format(
                    detail=(
                        "It is a slim white research pen with a white cap and side clip, polished chrome bands, "
                        "a pale-blue infinity DNA logo, the compound name in crimson printed lengthwise, and "
                        "an orange ridged dial at the end."
                    )
                ),
                FINISH.format(eyebrow="PENS", title="Peptides"),
            ]
        ),
    },
    {
        "tile_id": "TILE-03",
        "rank": 3,
        "slug": "weight-loss",
        "theme_filename": "home-weight-loss.jpg",
        "overlay_eyebrow": "VIALS",
        "overlay_title": "Metabolic",
        "input_reference_urls": DRIVE.format(file_id="1eYc8L15WhxmRmQM9gzWp-vs0e9sdpcQg"),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                WINDOW_WALL_VIEW,
                PRODUCT.format(
                    detail=(
                        "It is a clear glass pharmaceutical vial with a bright blue flip-off cap, a polished "
                        "silver crimp collar, a white label, a crimson DNA helix, and a crimson dose band."
                    )
                ),
                FINISH.format(eyebrow="VIALS", title="Metabolic"),
            ]
        ),
    },
    {
        "tile_id": "TILE-04",
        "rank": 4,
        "slug": "weight-loss-pens",
        "theme_filename": "home-weight-loss-pens.jpg",
        "overlay_eyebrow": "PENS",
        "overlay_title": "Metabolic",
        "input_reference_urls": DRIVE.format(file_id="1vDx2xDgTaCQlmTlhiFPAlhqSin8mbWiM"),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                WINDOW_WALL_VIEW,
                PRODUCT.format(
                    detail=(
                        "It is a slim white research pen with a white cap and side clip, polished chrome bands, "
                        "a pale-blue infinity DNA logo, the compound name in slate-blue printed lengthwise, and "
                        "a cobalt-blue dial at the end."
                    )
                ),
                FINISH.format(eyebrow="PENS", title="Metabolic"),
            ]
        ),
    },
]


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS, lineterminator="\n")
        w.writeheader()
        for tile in TILES:
            w.writerow({**SHARED, **tile})
    print(f"wrote {OUT.relative_to(ROOT)} ({len(TILES)} rows)")


if __name__ == "__main__":
    main()
