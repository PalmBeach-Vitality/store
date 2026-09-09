#!/usr/bin/env python3
"""Lock FILM-021 pick and light-damage-only crash-ship copy."""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "sheets" / "18-motsc-film-stills.csv"

PICKED_021 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8b66d32b-6ae2-9f50-941f-07875a234619-7910d329.png"
)
TAKES_021 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8b66d32b-6ae2-9f50-941f-07875a234619-f0e4e09c.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8b66d32b-6ae2-9f50-941f-07875a234619-6dc8670e.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8b66d32b-6ae2-9f50-941f-07875a234619-7910d329.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8b66d32b-6ae2-9f50-941f-07875a234619-8b1adf20.png"
)
TAKES_020 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3af0ba63-c3c0-9700-97d6-1c596053b963-0c495f5b.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3af0ba63-c3c0-9700-97d6-1c596053b963-942df774.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3af0ba63-c3c0-9700-97d6-1c596053b963-54b3e952.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3af0ba63-c3c0-9700-97d6-1c596053b963-7f2ce277.png"
)
TAKES_022 = (
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-424b8c9b-a8a8-93b1-8d63-202f32c0a440-23c13efd.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-424b8c9b-a8a8-93b1-8d63-202f32c0a440-ad5051ac.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-424b8c9b-a8a8-93b1-8d63-202f32c0a440-4fae85e0.png | "
    "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-424b8c9b-a8a8-93b1-8d63-202f32c0a440-0c669607.png"
)
LIGHT = (
    "The ship is the SAME sleek dark gunmetal arrowhead interceptor as FILM-010. "
    "Hull stays intact and only SLIGHTLY damaged — light scorch marks, light "
    "scoring, maybe a thin wisp of smoke. NOT a wreck. NOT a complete crash ruin. "
    "NOT torn open. NOT a broken sphere. NOT missing panels. NOT major structural "
    "damage."
)
EDIT_LIGHT = (
    "Keep this exact camera and subjects. Change the ship only: SAME sleek dark "
    "gunmetal arrowhead interceptor as FILM-010, hull intact, only SLIGHTLY "
    "damaged — light scorch, thin smoke. NOT a wreck. NOT torn open. NOT a broken "
    "sphere. NOT major structural damage."
)


def must_replace(text: str, old: str, new: str, still_id: str) -> str:
    if old not in text:
        raise SystemExit(f"{still_id} missing phrase: {old[:80]}")
    return text.replace(old, new)


def main() -> None:
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    locked = 0
    for row in rows:
        sid = (row.get("still_id") or "").strip()
        prompt = row.get("still_prompt") or ""
        if sid == "FILM-015":
            row["still_prompt"] = must_replace(
                prompt,
                "Wide shot of the crashed starship on the pale otherworldly beach, a long skid trench in the sugar sand behind it, hull scorched and dented but intact, thin smoke rising, spray and sand settling.",
                "Wide shot of the landed starship on the pale otherworldly beach, a short skid mark in the sand behind it, spray and sand settling. "
                + LIGHT,
                sid,
            )
            row["still_edit_prompt"] = EDIT_LIGHT
            locked += 1
        elif sid == "FILM-020":
            prompt = must_replace(
                prompt,
                "The starship plunging toward the otherworldly Palm Beach shoreline trailing fire and spray, heat glow on the hull, impact plume beginning in the shallows and sand.",
                "The starship plunging toward the otherworldly Palm Beach shoreline trailing a thin heat-glow and spray, impact plume beginning in the shallows. Hull stays INTACT — only SLIGHTLY damaged, light scoring. NOT breaking apart. NOT a wreck. NOT torn open. NOT major structural damage.",
                sid,
            )
            prompt = must_replace(
                prompt,
                "High drama, spectacle, motion blur on debris.",
                "High drama, spectacle. No wreckage debris.",
                sid,
            )
            row["still_prompt"] = prompt
            row["still_edit_prompt"] = (
                "Keep this exact plunge camera. Hull stays intact: only light "
                "scoring and heat glow. NOT breaking apart. NOT a wreck. NOT major "
                "structural damage."
            )
            row["take_urls"] = TAKES_020
            row["times_used"] = "1"
            row["last_used_at"] = "2026-08-29T16:26:29.505-04:00"
            locked += 1
        elif sid == "FILM-021":
            row["still_prompt"] = must_replace(
                prompt,
                "She stands beside her smoking crashed ship on the iridescent lilac-gold alien-galaxy shoreline",
                "She stands beside her landed ship on the iridescent lilac-gold alien-galaxy shoreline. "
                + LIGHT,
                sid,
            )
            row["still_edit_prompt"] = (
                "Keep this EXACT woman, face, hair, flight suit, vial, and pose. "
                "Change the background ship only: SAME sleek dark gunmetal "
                "arrowhead interceptor as FILM-010, hull intact, only SLIGHTLY "
                "damaged — light scorch, thin smoke. NOT a wreck. NOT torn open. "
                "NOT a broken sphere. NOT major structural damage. Do not change "
                "her face."
            )
            row["picked_url"] = PICKED_021
            row["take_urls"] = TAKES_021
            row["times_used"] = "1"
            row["last_used_at"] = "2026-08-29T16:36:16.927-04:00"
            locked += 1
        elif sid == "FILM-022":
            row["still_prompt"] = must_replace(
                prompt,
                "The crashed ship is small in the background.",
                "The SAME sleek dark gunmetal arrowhead interceptor as FILM-010 sits small in the background, hull intact, only SLIGHTLY damaged — light scorch, thin smoke. NOT a wreck. NOT torn open. NOT a broken sphere. NOT major structural damage.",
                sid,
            )
            row["still_edit_prompt"] = EDIT_LIGHT
            row["take_urls"] = TAKES_022
            row["times_used"] = "1"
            row["last_used_at"] = "2026-08-29T16:42:10.970-04:00"
            locked += 1
        elif sid == "FILM-025":
            row["still_prompt"] = must_replace(
                prompt,
                "The repaired starship lifting off from the pale beach",
                "The repaired starship lifting off from the pale beach, hull fully intact, no wreckage, no major damage, same sleek arrowhead as FILM-010",
                sid,
            )
            row["still_edit_prompt"] = (
                "Keep this exact lift-off camera. Hull fully intact, no wreckage, "
                "no major damage. SAME sleek dark gunmetal arrowhead interceptor "
                "as FILM-010."
            )
            locked += 1

    if locked != 5:
        raise SystemExit(f"expected 5 crash rows, locked={locked}")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"locked {locked} rows in {CSV_PATH}")


if __name__ == "__main__":
    main()
