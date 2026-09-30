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
REF = "https://raw.githubusercontent.com/PalmBeach-Vitality/store/main/woocommerce-migration/data"

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

VIALS = (
    "On the tray, a straight row of five identical 10 mL clear glass pharmaceutical vials that match the "
    "reference product photos exactly: bright blue flip-off cap, polished silver aluminum crimp collar, "
    "white wrap-around label with a small crimson DNA double-helix logo, compound name in bold dark-crimson "
    "sans-serif ({names}), and a crimson band below with the dose in white. Vials are crisp and in focus, "
    "realistic glass refraction, soft window light on the glass."
)

PENS = (
    "On the tray, five slim 3 mL research pens that match the reference product photos exactly lie side by "
    "side at a slight diagonal: glossy white body, polished chrome bands near both ends, clear cartridge "
    "window, {dial} dose dial at the end. {label} Pens are crisp and in focus, realistic plastic and chrome "
    "reflections, soft window light."
)

FINISH = (
    "Shallow depth of field, background gently soft, cinematic commercial product photography, high "
    "detail, clean clinical feel. The lower-left corner fades into a soft deep-navy shadow gradient so "
    "white text reads clearly. Text overlay in the "
    "bottom-left corner: small letter-spaced uppercase \"{eyebrow}\" in light sky-blue, and directly "
    "below it large bold white \"{title}\" in a modern geometric sans-serif. Rounded corners on the whole "
    "image. No people, no other text, no watermarks."
)


def refs(*paths):
    return " | ".join(f"{REF}/{p}" for p in paths)


TILES = [
    {
        "tile_id": "TILE-01",
        "rank": 1,
        "slug": "peptides",
        "theme_filename": "home-peptides.jpg",
        "overlay_eyebrow": "VIALS",
        "overlay_title": "Peptides",
        "input_reference_urls": refs(
            "all-product-white-backgrounds/GHK-cu_vial_whitebg-1.jpg",
            "all-product-white-backgrounds/TB-500_vial_whitebg-1.jpg",
        ),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                CORNER_VIEW,
                VIALS.format(names="BPC-157, GHK-Cu, TB-500, BPC-157, GHK-Cu"),
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
        "input_reference_urls": refs(
            "all-product-white-backgrounds/bpc-157-10mg-pen.jpg",
            "all-product-white-backgrounds/tb-500-10mg-pen.jpg",
            "all-product-white-backgrounds/Tesamorelin_10mg_pen_whitebg.jpg",
        ),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                CORNER_VIEW,
                PENS.format(
                    dial="orange-red",
                    label=(
                        "White label with a pale-blue DNA double-helix logo and the compound name printed "
                        "lengthwise in bold crimson sans-serif (BPC-157, TB-500, Tesamorelin, BPC-157, KLOW), "
                        "dose in small dark text."
                    ),
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
        "input_reference_urls": refs(
            "metabolic-vial-images/tirzepatide-50mg-vial.jpg",
            "metabolic-vial-images/retatrutide-30mg-vial.jpg",
            "all-product-white-backgrounds/Semaglutide_25mg_vial_whitebg.jpg",
        ),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                WINDOW_WALL_VIEW,
                VIALS.format(names="Tirzepatide, Retatrutide, Semaglutide, Tirzepatide, Retatrutide"),
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
        "input_reference_urls": refs(
            "all-product-white-backgrounds/sema_15mg_pen_whitebg.jpg",
            "all-product-white-backgrounds/Tirz_40mg_pen_whitebg.jpg",
            "all-product-white-backgrounds/reta_24mg_pen_whitebg.jpg",
        ),
        "still_prompt": " ".join(
            [
                PAVILION_LAB,
                WINDOW_WALL_VIEW,
                PENS.format(
                    dial="cobalt-blue",
                    label=(
                        "White label with the compound name printed lengthwise in bold slate-blue sans-serif "
                        "(Semaglutide, Tirzepatide, Retatrutide, Semaglutide, Tirzepatide), dose in small dark text."
                    ),
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
