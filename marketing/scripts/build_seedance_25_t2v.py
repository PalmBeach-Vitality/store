#!/usr/bin/env python3
"""Build 17-seedance-25-t2v.csv from 15-caption-science-27 compounds.

One Active row per catalog compound. Prompt / model / duration live on the
sheet. Seedance 2.5 fal native max is 30 seconds — duration_seconds is 30.
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCIENCE = ROOT / "sheets" / "15-caption-science-27.csv"
OUT = ROOT / "sheets" / "17-seedance-25-t2v.csv"

MODEL = "bytedance/seedance-2.5/text-to-video"
HEADERS = [
    "creation_id",
    "rank",
    "compound_id",
    "compound_name",
    "canonical_url",
    "video_prompt",
    "model_video",
    "duration_seconds",
    "resolution",
    "aspect_ratio",
    "audio",
    "bitrate_mode",
    "wait_seconds",
    "status",
    "times_used",
    "last_used_at",
    "video_url",
    "request_id",
]

SCENES = [
    (
        "Grade A/B fill-finish suite with interlocking airlock doors and HEPA soffits",
        "slow push-in from the airlock threshold toward a single mid-ground bench",
        "high-key sterile white with cool steel speculars",
    ),
    (
        "soft-pink wellness R&D studio cooled by clinical steel islands and anti-vibration tables",
        "low eye-level dolly along chrome table legs toward the hero",
        "golden-hour ribbon light sliding across polished steel",
    ),
    (
        "pharmaceutical gowning corridor with step-over benches and interlocking doors",
        "wide tracking shot through the corridor, camera pulled back",
        "soft daylight sterile panels, no flicker",
    ),
    (
        "environmental monitoring ante-room with settle-plate prep benches",
        "slow crane down from the HEPA ceiling to a single clean bench",
        "high-key sterile white, deep shadows only in the ceiling plenum",
    ),
    (
        "classified warehouse of sealed cartons and stainless pallet racking",
        "slow lateral truck past identical cartons, hero isolated on a chrome plate",
        "cool industrial skylight mixed with under-shelf LEDs",
    ),
    (
        "peptide synthesis bay with glass-jacketed reactors and chilled circulating baths",
        "slow orbit around the reactor island, never crossing a person path",
        "warm amber bath glow plus overhead cleanroom white",
    ),
    (
        "HPLC instrument alley with stacked solvent bottles and quiet pump racks",
        "slow push along the instrument faces toward one labeled vial at the end",
        "cool blue instrument LEDs, no neon, no orange",
    ),
    (
        "lyophilizer cleanroom with frost-lined shelves visible through a viewport",
        "slow push toward the viewport, reflections crawling across the glass",
        "cold cyan chamber light against warm anteroom tungsten",
    ),
    (
        "stability chamber corridor lined with glass-front climate cabinets",
        "slow walk-and-hold down the corridor, cameras locked on one cabinet",
        "even cabinet LEDs, no hazard stripes",
    ),
    (
        "copper-peptide compounding alcove with brushed-brass fixtures and white stone",
        "slow rise from the stone counter to a single mid-ground hero",
        "warm museum spots, no people shadows",
    ),
    (
        "cosmetic-science clean bench under a laminar hood with copper-tone glassware",
        "slow lateral slide under the hood lip",
        "soft hood daylight, copper reflections only",
    ),
    (
        "skin-matrix imaging suite with a dark confocal enclosure and a lit sample stage",
        "slow push into the enclosure, stage remaining centered",
        "single hard key on the stage, room otherwise dark",
    ),
    (
        "epithelial barrier lab with transparent well plates on a vibration-isolated table",
        "slow top-down descend onto one plate, then hold",
        "high-key white plus a thin teal accent on the isolation feet",
    ),
    (
        "melanocortin receptor lab with matte charcoal walls and a single lit island",
        "slow 3/4 orbit, camera pulled back, island small in frame",
        "hard cinematic key, no colored gels except a faint rose rim",
    ),
    (
        "mitochondrial energetics room with black granite benches and gold instrument bezels",
        "slow push across granite toward one isolated hero",
        "low warm practicals, no people",
    ),
    (
        "cellular-energy core with a glowing NAD assay reader and dark glass partitions",
        "slow dolly past partitions to the reader, then hold",
        "deep teal reader glow, otherwise dark",
    ),
    (
        "neuroscience receptor suite with muted taupe panels and a single chrome stand",
        "slow crane around the stand, environment readable behind",
        "soft north-light, no captions",
    ),
    (
        "triple-agonist metabolic lab with white Corian islands and cobalt glass accents",
        "slow push from a wide establishing shot into a mid-ground hero",
        "clean daylight plus a single cobalt edge light",
    ),
    (
        "quiet neuropeptide reading room styled as a clinical library of sealed binders",
        "slow lateral past binders to one hero on a clear acrylic shelf",
        "warm library lamps, no paper text readable",
    ),
    (
        "incretin signaling gallery with long reflective floors and a single pedestal",
        "slow push down the gallery, pedestal remaining centered",
        "overcast skylight, long floor reflections",
    ),
    (
        "cognitive-pathway loft with raw concrete and a single stainless research cart",
        "slow handheld-feel but locked, circling the cart at a distance",
        "soft overcast through frosted glass",
    ),
    (
        "pituitary-axis cleanroom with pale sage walls and a single dosing bench",
        "slow rise from floor marks to the bench, camera pulled back",
        "even sterile white, sage only on walls",
    ),
    (
        "inner-membrane bioenergetics vault with black glass and a single warm practical",
        "slow push through darkness until the practical reveals the hero",
        "one warm beam, no fill",
    ),
    (
        "immune-education suite with frosted glass partitions and a single white island",
        "slow tracking past partitions, island revealed last",
        "high-key white, no posters",
    ),
    (
        "cytoskeletal dynamics bay with cable-stayed overhead service booms",
        "slow crane under the booms toward a mid-ground hero",
        "cool overhead industrial, no orange",
    ),
    (
        "visceral-metabolic imaging room with a dark gantry and a lit central shelf",
        "slow push toward the shelf, gantry readable in the background",
        "single key on the shelf, gantry silhouette only",
    ),
    (
        "stacked endocrine complex with twin chilled baths flanking one empty center stand",
        "slow push between the baths to the center stand",
        "twin cyan bath glows, center in white key",
    ),
]


LOCK = (
    "HYPERREALISTIC photoreal cinema, IMAX-grade texture, 30-second SINGLE CONTINUOUS TAKE, "
    "no cuts. Camera PULLED BACK. Environment fully readable. Empty of people, hands, faces, "
    "and silhouettes. No needles. No syringes. No burn-in captions, watermarks, subtitles, "
    "logos, or poster text. No cartoon hazard graphics, no biohazard trefoils, no striped "
    "danger tape. Premium pharmaceutical manufacturing aesthetic — stainless, HEPA, sanitary "
    "finishes — not sci-fi, not a university teaching lab. Silent room tone only; no music "
    "score described as on-screen. Keep label text printed once if a product is visible."
)


def https_store(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return "https://www.palmbeach-vitality.store"
    if u.startswith("http://") or u.startswith("https://"):
        return u
    return "https://" + u.lstrip("/")


def prompt_for(name: str, environment: str, camera: str, lighting: str) -> str:
    return (
        f"{LOCK} Compound lock: {name}. Environment: {environment}. "
        f"Camera: {camera}. Lighting: {lighting}. "
        f"If a catalog product appears it is mid-ground and small in frame — never a giant "
        f"close-up filling the shot. One SKU only. No mixed compounds. "
        f"Photoreal materials, true optical bokeh, natural micro-dust in light beams, "
        f"physically based reflections. Hold the last two seconds on the settled frame."
    )


def main() -> None:
    with SCIENCE.open(newline="", encoding="utf-8") as fh:
        compounds = [row for row in csv.DictReader(fh) if row.get("compound_id")]
    if len(compounds) != len(SCENES):
        raise SystemExit(
            f"scene count {len(SCENES)} != compound count {len(compounds)}"
        )

    rows = []
    for i, (row, scene) in enumerate(zip(compounds, SCENES), start=1):
        environment, camera, lighting = scene
        name = row["compound_name"].strip()
        rows.append(
            {
                "creation_id": f"SD25-{i:03d}",
                "rank": str(i),
                "compound_id": row["compound_id"].strip(),
                "compound_name": name,
                "canonical_url": https_store(row.get("store_url", "")),
                "video_prompt": prompt_for(name, environment, camera, lighting),
                "model_video": MODEL,
                "duration_seconds": "30",
                "resolution": "720p",
                "aspect_ratio": "9:16",
                "audio": "false",
                "bitrate_mode": "high",
                "wait_seconds": "600",
                "status": "Active",
                "times_used": "0",
                "last_used_at": "",
                "video_url": "",
                "request_id": "",
            }
        )

    with OUT.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} rows → {OUT}")


if __name__ == "__main__":
    main()
