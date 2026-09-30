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

CORRIDOR_LAB = (
    "Photorealistic wide 16:9 interior of a futuristic beachside research laboratory at golden hour. "
    "Floor-to-ceiling curved glass walls on both sides open onto a calm turquoise ocean, white sand and "
    "tall palm trees, soft warm sunlight streaming in from the right. The lab is sleek and minimal: white "
    "and deep-navy surfaces, rounded arch doorways receding down a central corridor, thin cool-blue LED "
    "light strips tracing the ceiling and arch edges, polished reflective floor. On the right, a white lab "
    "bench with a rack of four silver pipettes and a small glass apparatus. In the left foreground on a "
    "dark bench sits a black glass tray with a softly glowing blue edge."
)

ROBOT_LAB = (
    "Photorealistic wide 16:9 interior of a futuristic beachside automated research laboratory in bright "
    "late-afternoon light. A wide panoramic glass wall at the back looks out over a turquoise ocean, white "
    "sand beach and swaying palm trees. Inside, two sleek white-and-silver robotic arms work over "
    "glass-and-steel lab equipment; wall-mounted screens display glowing blue 3D molecular network diagrams; "
    "a small tablet display on the bench. Deep-navy and white surfaces with thin cool-blue LED trim along "
    "the ceiling. In the center foreground on a dark polished bench sits a black glass tray with a softly "
    "glowing blue edge."
)

VIALS = (
    "On the tray, a straight row of five identical 10 mL clear glass pharmaceutical vials, each with a "
    "bright blue flip-off cap and polished silver aluminum crimp collar, white wrap-around label with a "
    "small crimson DNA double-helix logo, compound name in bold dark-crimson sans-serif ({names}), and a "
    "crimson band below with the dose in white. Vials are crisp and in focus, realistic glass refraction, "
    "ocean light reflecting on the glass."
)

PENS = (
    "On the tray, five slim 3 mL research pens lie side by side at a slight diagonal: glossy white body, "
    "polished chrome bands near both ends, clear cartridge window, {dial} dose dial at the end. "
    "{label} Pens are crisp and in focus, realistic plastic and chrome reflections, warm ocean light."
)

FINISH = (
    "Shallow depth of field, background gently soft, cinematic commercial product photography, high "
    "detail, clean clinical feel, lower-left corner slightly darker for text. Text overlay in the "
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
                CORRIDOR_LAB,
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
                CORRIDOR_LAB,
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
                ROBOT_LAB,
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
                ROBOT_LAB,
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
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        for tile in TILES:
            w.writerow({**SHARED, **tile})
    print(f"wrote {OUT.relative_to(ROOT)} ({len(TILES)} rows)")


if __name__ == "__main__":
    main()
