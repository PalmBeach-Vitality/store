#!/usr/bin/env python3
"""Expand every lab_item (+ material_detail) to rich 2+ sentence Grok-ready copy.

Grok still/video prompts use:
  PRIMARY SUBJECT: {lab_item}
  Physical detail: {material_detail}

So both fields need concrete visual language — not short noun stubs.
Preserves cameras; rebuilds video_prompt / video_motion_prompt / scene_brief.
Syncs Sheet 8 from Sheet 9.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV9 = SHEETS / "9-lab-item-creations-500.csv"
CSV9_250 = SHEETS / "9-lab-item-creations-250.csv"
CSV8 = SHEETS / "8-lab-items-500.csv"
CSV8_250 = SHEETS / "8-lab-items-250.csv"
JSON9 = ROOT / "pbvita-500-lab-item-creations.json"
JSON8 = ROOT / "pbvita-500-lab-items.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_unique_camera_recipes import (  # noqa: E402
    rebuild_motion_prompt,
    rebuild_scene_brief,
    rebuild_still_prompt,
)

# If lab_item already looks like multi-sentence prose, leave it (idempotent-ish).
SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


# Second-sentence visual banks by category (rotated by rank for variety)
CATEGORY_LOOK = {
    "vials_containers": [
        "Show thick pharmaceutical glass, a crisp crimp or cap edge, and a clean reflection on the vial shoulder — exactly one vial, no tray cluster or cardboard.",
        "Catch warm transmission through the glass wall, a readable shoulder highlight, and a sealed sterile top with empty negative space around the hero.",
        "Macro-honest vial geometry: septum texture, aluminum crimp teeth, and a single upright or posed bottle with no twin beside it.",
        "Premium peptide-vial catalog energy — glass weight, fill-line clarity, and clinical side light with zero lifestyle props.",
    ],
    "research_pens": [
        "Emphasize the barrel window, dial collar, and matte/gloss finishes of one premium research pen — no skin, hands, needles, or injection staging.",
        "Keep a capped-pen still-life silhouette with crisp plastic-metal edges; a loose cap may sit beside the barrel but never implies use on a body.",
        "Read as expensive research hardware: dosage window, clip, and tip cover, isolated on a clean catalog surface.",
        "One pen only, tack-sharp barrel graphics zone, soft reflection beneath, zero medical-procedure context.",
    ],
    "glassware": [
        "Catch a sharp meniscus, optical distortion, and studio highlights traveling through one vessel — no crowded flask rack behind it.",
        "Borosilicate clarity and honest liquid level; the glassware alone owns the frame with premium science-magazine lighting.",
        "Side-lit glass drama with caustics and a stable liquid surface; single piece only, no pipettes stealing the hero role.",
        "Museum-grade glassware catalog shot: ground-glass fitment, etched volume marks if present, empty lab field around it.",
    ],
    "liquid_handling": [
        "Precision liquid-handling hardware: volume window, plunger, tip cone, engineered plastics — tip never touches skin.",
        "One micropipette or dispenser hero with sterile unused tip state and clean negative space for a catalog still.",
        "Show believable scale marks, ejector button, and color-coded accents without a second matching tool in frame.",
        "Clinical product photography of a single liquid-handling instrument, idle and unused, sharp edge detail.",
    ],
    "premium_equipment": [
        "Expensive capital equipment presence — painted metal, precision optics, museum-grade silhouette, one instrument only.",
        "Fill the frame with a single high-end lab machine; no operator, no sample mess, no second chassis.",
        "Editorial science cover energy: polished housings, turret/stage/arm detail, deep controlled falloff.",
        "Photoreal research instrument hero with credible cables/ports minimized and the main form unmistakable.",
    ],
    "instruments": [
        "Credible lab-instrument materials: brushed metal, polymer housings, ports, displays, tight tolerances — idle catalog state.",
        "One module or instrument only; no bench chaos, no people, sharp readable silhouette for image-to-video lock.",
        "Show ports, fasteners, and status UI as quiet detail while the overall form stays the undeniable subject.",
        "Premium instrument still: clean geometry, subtle wear only where realism needs it, empty surroundings.",
    ],
    "qc_analytical": [
        "Calibrated QC hardware energy: solvent lines, steel faces, status LEDs — one analyzer detail owns the frame.",
        "Analytical instrument catalog drama with expensive metal/polymer mix and no competing open sample clutter.",
        "Front-panel or inlet hero with believable engineering detail and clinical color-true lighting.",
        "Single QC system presence; keep secondary vials out unless they are the named subject itself.",
    ],
    "cold_chain": [
        "Cold-chain drama: frost texture, insulation, logger screens, or sealed cold packaging — research context only.",
        "One cold-chain subject with clinical chill cues; never grocery/lifestyle cooler vibes.",
        "Frost-edge glass, gel packs, or logger pixels as supporting texture around a single hero object.",
        "Temperature-controlled research logistics look: sealed, serious, photoreal, empty of people.",
    ],
    "ppe_sterile": [
        "Unused clean-room PPE: crisp folds, matte nitrile/poly, sealed packs — exactly one primary item.",
        "Sterile catalog still of a single PPE piece; no worn gloves, no people, no procedure staging.",
        "Show package seals or fabric texture with clinical white/blue light and generous empty space.",
        "One sterile accessory hero, brand-new state, photoreal material response, no medical theater.",
    ],
    "sterile_env": [
        "Sterile architecture: stainless decks, HEPA grilles, interlocking doors, blue-white cleanroom light — empty and ready.",
        "One environmental hero zone with no operators and no clutter; airflow hardware reads clearly.",
        "Architectural laboratory cleanliness with reflective steel and controlled sterile atmosphere.",
        "Empty BSC/hood/airlock presence as the sole subject — research facility, not a lifestyle interior.",
    ],
    "surfaces_org": [
        "Bench/surface hero with chemical-resistant texture, clean edges, and a subtle catalog reflection.",
        "If a prop sits on the surface, keep one primary object so the surface still reads clearly.",
        "Epoxy/melamine/steel work-surface drama with empty negative space and premium lab realism.",
        "Organized lab surface as subject: honest material grain, clinical light, no cardboard clutter.",
    ],
}

FINISH_BANK = [
    "photoreal catalog finish with micro-scratches only where realism needs them",
    "premium studio contrast with soft falloff and crisp speculars",
    "neutral color-true pharmaceutical look with no surreal CGI glow",
    "tack-sharp focus on the subject silhouette and key material edges",
    "expensive editorial science-magazine presence without lifestyle props",
    "deep controlled shadows and bright product highlights for vertical 9:16",
]


def with_article(noun: str) -> str:
    n = (noun or "").strip()
    if not n:
        return n
    # Already has a determiner
    if re.match(r"^(a|an|the|one|pair|two)\b", n, flags=re.I):
        return n
    # Use "an" before vowel sounds (simple ASCII heuristic)
    first = re.sub(r"[^a-zA-Z]", "", n).lower()
    if first.startswith(("a", "e", "i", "o", "u")):
        return f"an {n}"
    return f"a {n}"


CAT_LABEL = {
    "vials_containers": "vial / container",
    "research_pens": "research pen",
    "glassware": "glassware",
    "liquid_handling": "liquid-handling",
    "premium_equipment": "premium equipment",
    "instruments": "instrument",
    "qc_analytical": "QC / analytical",
    "cold_chain": "cold-chain",
    "ppe_sterile": "PPE / sterile",
    "sterile_env": "sterile environment",
    "surfaces_org": "lab surface",
}


def sentence_count(text: str) -> int:
    parts = [p.strip() for p in SENTENCE_SPLIT.split((text or "").strip()) if p.strip()]
    return len(parts)


def short_title(name: str) -> str:
    """First clause / first sentence, capped — for scene_brief compactness."""
    t = (name or "").strip()
    first = SENTENCE_SPLIT.split(t)[0].strip().rstrip(".")
    # If already short noun phrase
    if len(first) <= 90:
        return first
    return first[:87].rstrip() + "…"


def ensure_period(s: str) -> str:
    s = (s or "").strip().rstrip(".")
    return s + "."


def build_lab_item_description(
    title: str,
    detail: str,
    category: str,
    compound: str,
    rank: int,
) -> str:
    title = re.sub(r"\s+", " ", (title or "").strip())
    if sentence_count(title) >= 2 and len(title) > 120:
        title = peel_original_title(title)

    detail_bit = re.sub(r"\s+", " ", (detail or "").strip())
    detail_bit = re.sub(r"\s*[·•]\s*unique catalog variant\s*$", "", detail_bit, flags=re.I)
    if detail_bit.lower().startswith("materials and construction:"):
        detail_bit = detail_bit.split(":", 1)[-1].strip()
        detail_bit = SENTENCE_SPLIT.split(detail_bit)[0].strip()
        detail_bit = re.sub(
            r",?\s*built as one complete .+$",
            "",
            detail_bit,
            flags=re.I,
        )
    elif sentence_count(detail_bit) >= 2:
        detail_bit = SENTENCE_SPLIT.split(detail_bit)[0].strip().rstrip(".")

    bank = CATEGORY_LOOK.get(category) or [
        "Show real laboratory materials with sharp photoreal detail and premium catalog lighting — one subject only.",
        "Keep the silhouette unmistakable for image-to-video continuity with empty negative space around the hero.",
    ]
    look = bank[rank % len(bank)]
    finish = FINISH_BANK[rank % len(FINISH_BANK)]
    subject = with_article(title)

    s1 = (
        f"The primary subject is {subject}, staged alone as a Palm Beach Vitality "
        f"laboratory research catalog hero"
    )
    if compound:
        s1 += (
            f". If any label or printed panel appears, it must read exactly '{compound}' "
            f"for laboratory research use only"
        )
    s1 = ensure_period(s1)

    physical = detail_bit if detail_bit else ""
    if physical and physical.lower() not in title.lower():
        s2 = f"{look} Call out: {physical.rstrip('.')}; finish with {finish}."
    else:
        s2 = f"{look} Finish with {finish}."
    s2 = ensure_period(s2.rstrip("."))

    text = f"{s1} {s2}".strip()
    if sentence_count(text) < 2:
        text = f"{text} Keep exactly one primary subject recognizable and unchanged for video."
    return text


def build_material_detail(
    title: str,
    detail: str,
    category: str,
    surface: str,
    lighting: str,
    rank: int,
) -> str:
    """Second channel Grok reads — materials, finish, staging constraints (2 sentences)."""
    title_short = peel_original_title(title) if sentence_count(title) >= 2 else short_title(title)
    raw = re.sub(r"\s+", " ", (detail or "").strip())
    raw = re.sub(r"\s*[·•]\s*unique catalog variant\s*$", "", raw, flags=re.I)
    if raw.lower().startswith("materials and construction:"):
        raw = raw.split(":", 1)[-1].strip()
        raw = SENTENCE_SPLIT.split(raw)[0].strip()
        raw = re.sub(r",?\s*built as one complete .+$", "", raw, flags=re.I)

    cue = (raw or title_short).rstrip(".")
    cat_words = CAT_LABEL.get(category, (category or "laboratory").replace("_", " "))

    s1 = (
        f"Materials and construction: {cue} — one complete {cat_words} subject with "
        f"believable scale, weight, and tactile surface response."
    )
    s2 = (
        f"Stage it on {surface or 'a clean laboratory surface'} under "
        f"{lighting or 'clinical catalog lighting'}, with empty negative space so the model "
        f"cannot invent a second competing object (catalog variant {rank:03d})."
    )
    return f"{ensure_period(s1.rstrip('.'))} {ensure_period(s2.rstrip('.'))}"


def peel_original_title(lab_item: str) -> str:
    """Best-effort short title from current lab_item cell."""
    t = (lab_item or "").strip()
    if t.lower().startswith("the primary subject is "):
        rest = t[len("The primary subject is ") :]
        m = re.match(r"(.+?)(?:,|\.| staged as)\b", rest, flags=re.I)
        if m:
            title = m.group(1).strip()
            title = re.sub(r"^(a|an|the)\s+", "", title, flags=re.I)
            return title
    return short_title(t)


def main() -> None:
    with CSV9.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 500:
        raise SystemExit(f"expected 500 creations, got {len(rows)}")

    rows.sort(key=lambda r: int(r["rank"]))

    for r in rows:
        rank = int(r["rank"])
        original_title = peel_original_title(r["lab_item"])
        compound = (r.get("compound_name") or "").strip()
        category = (r.get("category") or "").strip()

        new_item = build_lab_item_description(
            original_title,
            r.get("material_detail") or "",
            category,
            compound,
            rank,
        )
        new_detail = build_material_detail(
            original_title,
            r.get("material_detail") or "",
            category,
            r.get("surface") or "",
            r.get("lighting") or "",
            rank,
        )
        r["lab_item"] = new_item
        r["material_detail"] = new_detail

        shot = {
            "shot_family": r.get("shot_family") or "push_in",
            "camera_angle": r.get("camera_angle") or "eye-level",
            "camera_direction": r.get("camera_direction") or "forward",
            "framing": r.get("framing") or "medium product framing",
            "camera_move": r.get("camera_move") or "slow push-in",
            "energy": "controlled premium catalog motion",
        }
        # Prefer energy embedded in camera_move descriptions — keep a stable default
        r["video_prompt"] = rebuild_still_prompt(r, shot)
        r["video_motion_prompt"] = rebuild_motion_prompt(r, shot)
        # scene_brief uses short title so the cell stays scannable
        brief_row = dict(r)
        brief_row["lab_item"] = original_title
        r["scene_brief"] = rebuild_scene_brief(brief_row, shot)

    # Write sheet 9 (+ compat)
    fieldnames = list(rows[0].keys())
    for path in (CSV9, CSV9_250):
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote {path}")

    JSON9.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {JSON9}")

    # Sync sheet 8 master list from creations
    if CSV8.exists():
        with CSV8.open(newline="", encoding="utf-8") as f:
            items = list(csv.DictReader(f))
        by_id = {r["lab_item_id"]: r for r in rows}
        for it in items:
            src = by_id.get(it["lab_item_id"])
            if not src:
                continue
            it["lab_item"] = src["lab_item"]
            it["material_detail"] = src["material_detail"]
            if "compound_name" in it:
                it["compound_name"] = src.get("compound_name", it.get("compound_name", ""))
            if "category" in it:
                it["category"] = src.get("category", it.get("category", ""))
        item_fields = list(items[0].keys())
        for path in (CSV8, CSV8_250):
            with path.open("w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=item_fields, extrasaction="ignore")
                w.writeheader()
                w.writerows(items)
            print(f"Wrote {path}")
        JSON8.write_text(
            json.dumps({"count": len(items), "items": items}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {JSON8}")

    # Audit
    bad = [r for r in rows if sentence_count(r["lab_item"]) < 2]
    short_detail = [r for r in rows if sentence_count(r["material_detail"]) < 2]
    if bad:
        raise SystemExit(f"{len(bad)} lab_item rows still < 2 sentences")
    if short_detail:
        raise SystemExit(f"{len(short_detail)} material_detail rows still < 2 sentences")

    # uniqueness
    uniq = len({r["lab_item"] for r in rows})
    print(f"PASS: {len(rows)} lab_item descriptions, {uniq} unique, all ≥2 sentences")
    print("sample lab_item:\n ", rows[0]["lab_item"])
    print("sample material_detail:\n ", rows[0]["material_detail"])
    print("prompt PRIMARY snippet:\n ", rows[0]["video_prompt"][180:520])


if __name__ == "__main__":
    main()
