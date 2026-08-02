#!/usr/bin/env python3
"""
Audit + fix lab-item / creation / Creatomate-text libraries.

- Replace multi-subject / dual-chamber / twin items with single realistic subjects
- Enforce SINGLE SUBJECT wording in every video_prompt
- Interleave categories by rank so early picks are not vial→vial→vial
- Ensure text library has text_id filled and strips · ref/motif suffixes
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

# Problematic lab_item → (new_name, new_detail)
REPLACEMENTS: dict[str, tuple[str, str]] = {
    "dual-chamber lyophilized research vial": (
        "single-chamber lyophilized research vial",
        "one clear glass vial, single chamber only, white lyophilized cake, sealed septum, aluminum crimp",
    ),
    "clear vial cluster in cardboard vial tray": (
        "single research vial seated in cardboard tray well",
        "exactly one clear vial in one die-cut well, other wells empty, no second vial",
    ),
    "pair of matched peptide vials side by side": (
        "single peptide vial catalog hero",
        "exactly one clear peptide vial, centered, sealed cap, no second vial",
    ),
    "two research pens parallel on slate": (
        "single research pen on slate",
        "exactly one capped research pen, centered on slate, no second pen",
    ),
    "dual research pens crossed at 15 degrees": (
        "single research pen angled catalog pose",
        "exactly one research pen at a slight angle, cap on, no second pen",
    ),
    "research pen components laid out as kit": (
        "assembled research pen sealed catalog hero",
        "one complete capped research pen only, not disassembled components",
    ),
    "cuvette pair in foam": (
        "single quartz cuvette in foam well",
        "exactly one clear cuvette seated in foam, adjacent wells empty",
    ),
    "pair of nitrile gloves laid flat unused": (
        "single unused nitrile glove laid flat",
        "exactly one glove, flat, unused, no pair visible",
    ),
    "twin-pack vials in clear clamshell": (
        "single vial in clear clamshell well",
        "exactly one vial in open clamshell, second well empty",
    ),
    "research pen with spare cartridge pair": (
        "research pen with one spare cartridge",
        "one pen and one cartridge only, no duplicate pens",
    ),
    "research pen capped and uncapped twins": (
        "research pen capped catalog hero",
        "exactly one capped research pen, no uncapped duplicate",
    ),
    "serological pipette individually wrapped bundle": (
        "single serological pipette individually wrapped",
        "exactly one wrapped pipette, no bundle stack",
    ),
    "LN2 glove pair boxed": (
        "single cryogenic glove on box lid",
        "exactly one cryo glove displayed, box as prop only",
    ),
    "dropper assembly components laid out": (
        "assembled research dropper bottle sealed",
        "one complete sealed dropper bottle only",
    ),
    "PET clam for dual pens": (
        "PET clamshell with single research pen",
        "clamshell holding exactly one pen, second cavity empty",
    ),
    "sleeve protector pair packaged": (
        "single sleeve protector packaged",
        "one packaged sleeve protector only",
    ),
    "cut-resistant glove pair folded": (
        "single cut-resistant glove folded",
        "exactly one glove, folded, unused",
    ),
    "sterile gloves individually wrapped pair": (
        "single sterile glove individually wrapped",
        "exactly one wrapped sterile glove",
    ),
}

# multi-dose is fine (realistic) — leave it
# stainless utility cart two shelf is fine (one cart)
# research vial in individual carton window is fine (one vial)

SINGLE_SUBJECT = (
    "SINGLE SUBJECT ONLY: exactly one primary laboratory object, sharp and centered. "
    "No second vial, no dual-chamber stack, no twin pack, no product collage, "
    "no overlapping duplicate subjects, no vial-on-vial, no paired props that read as two products."
)

AVOID = (
    "No abstract shapes, no glass orbs, no crystal balls, no surreal spheres, no CGI blobs, "
    "no nebula, no galaxies, no fantasy energy, no particle portals, no impossible geometry, "
    "no melting objects, no dreamscape, no people, no faces, no hands, no bare skin, "
    "no needles penetrating skin, no injection act, no clinic patient scene, no gym, "
    "no lifestyle, no wellness claims, no nicknames, no supplements aesthetic"
)

QUALITY = (
    "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
    "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR"
)

SURFACES = [
    "polished black reflective acrylic",
    "matte pure white infinity surface",
    "brushed stainless steel lab bench",
    "dark charcoal epoxy resin countertop",
    "cool gray ceramic tile",
    "mirrored chrome instrument tray",
    "white melamine cleanroom table",
    "textured slate sample board",
    "soft gray seamless paper backdrop",
    "anodized aluminum tray",
]
LIGHTING = [
    "soft rim light from behind",
    "cool clinical blue-white LED",
    "single hard key light with controlled fill",
    "soft overhead softbox, even catalog lighting",
    "warm neutral side light, still clinical",
    "split soft key and gentle bounce",
    "high-key seamless catalog lighting",
    "low-key selective highlight on glass edges",
]
CAMERA = [
    "slow 360 degree orbit at eye level",
    "extreme macro push-in",
    "gentle top-down descending move",
    "locked tripod hero frame with subtle push",
    "low angle tracking slide",
    "circular arc that never fully completes",
    "vertical rise from base to label",
    "fast resolve into locked hero frame",
]


def interleave_by_category(rows: list[dict]) -> list[dict]:
    """Order rows so every rank differs in category from the row above and below.

    Rotates through all categories (round-robin), never repeating a category
    on adjacent ranks.
    """
    from collections import deque

    buckets: dict[str, deque] = defaultdict(deque)
    for r in rows:
        buckets[r["category"]].append(r)

    # Fixed daily rotation — never the same category on adjacent ranks.
    # Example: surfaces_org → packaging → ppe_sterile → vials_containers → …
    cat_order = [
        "surfaces_org",
        "packaging",
        "ppe_sterile",
        "vials_containers",
        "research_pens",
        "glassware",
        "instruments",
        "liquid_handling",
        "cold_chain",
        "qc_analytical",
    ]
    # Include any unexpected categories at the end
    for c in sorted(buckets.keys()):
        if c not in cat_order:
            cat_order.append(c)

    out: list[dict] = []
    prev = None
    cursor = 0

    while any(buckets.values()):
        placed = False
        for step in range(len(cat_order)):
            idx = (cursor + step) % len(cat_order)
            cat = cat_order[idx]
            if not buckets[cat] or cat == prev:
                continue
            out.append(buckets[cat].popleft())
            prev = cat
            cursor = (idx + 1) % len(cat_order)
            placed = True
            break

        if placed:
            continue

        # Only one category left — insert into an earlier safe gap
        cat = next(c for c, q in buckets.items() if q)
        item = buckets[cat].popleft()
        inserted = False
        for i in range(len(out) + 1):
            left = out[i - 1]["category"] if i > 0 else None
            right = out[i]["category"] if i < len(out) else None
            if left == item["category"] or right == item["category"]:
                continue
            out.insert(i, item)
            inserted = True
            break
        if not inserted:
            raise SystemExit(
                f"Cannot place leftover category without adjacency: {item['category']}"
            )
        prev = out[-1]["category"]

    for i in range(1, len(out)):
        if out[i]["category"] == out[i - 1]["category"]:
            raise SystemExit(f"Adjacent category at ranks {i}/{i+1}: {out[i]['category']}")
    return out


def rebuild_prompt(idx: int, lab_item_id: str, name: str, detail: str, surface: str, lighting: str, camera: str) -> str:
    return (
        f"Photoreal vertical 9:16 Palm Beach Vitality laboratory research catalog film, "
        f"chemical research material only, premium American research aesthetic. "
        f"PRIMARY SUBJECT (must be clearly recognizable, real laboratory object, sharp and centered): {name}. "
        f"Physical detail: {detail}. "
        f"Setting surface: {surface}. Lighting: {lighting}. Camera: {camera}. "
        f"{SINGLE_SUBJECT} "
        f"{AVOID}. "
        f"Quality: {QUALITY}. "
        f"creation motif {idx:03d}/500 · {lab_item_id}. "
        f"Keep product identity and any on-screen research typography sharp and unchanged. "
        f"For laboratory research use only. Not for human use or consumption."
    )


def fix_lab_libraries() -> None:
    items_path = SHEETS / "8-lab-items-500.csv"
    cre_path = SHEETS / "9-lab-item-creations-500.csv"
    items = list(csv.DictReader(items_path.open()))
    creations = list(csv.DictReader(cre_path.open()))
    assert len(items) == 500 and len(creations) == 500

    # Apply replacements on items
    replaced = 0
    for r in items:
        key = r["lab_item"].strip().lower()
        # match original names case-insensitively via exact current name
        name = r["lab_item"].strip()
        if name in REPLACEMENTS:
            new_name, new_detail = REPLACEMENTS[name]
            r["lab_item"] = new_name
            r["material_detail"] = new_detail
            replaced += 1
        else:
            # try lower match on keys
            for old, (new_name, new_detail) in REPLACEMENTS.items():
                if name.lower() == old.lower():
                    r["lab_item"] = new_name
                    r["material_detail"] = new_detail
                    replaced += 1
                    break

    # Sync creations from items by lab_item_id before reorder
    item_by_id = {r["lab_item_id"]: r for r in items}
    for c in creations:
        src = item_by_id[c["lab_item_id"]]
        c["lab_item"] = src["lab_item"]
        c["material_detail"] = src["material_detail"]
        c["category"] = src["category"]

    # Interleave categories (both lists stay aligned via lab_item_id)
    items = interleave_by_category(items)
    id_order = [r["lab_item_id"] for r in items]
    cre_by_id = {c["lab_item_id"]: c for c in creations}
    creations = [cre_by_id[i] for i in id_order]

    # Reassign rank + ids sequentially after interleave
    for idx, (it, cr) in enumerate(zip(items, creations), 1):
        lab_item_id = f"LAB-{idx:03d}"
        # keep stable? User sheets already have times_used on old ids.
        # Prefer STABLE lab_item_id from content — remapping IDs breaks their Sheet writebacks.
        # So: keep existing lab_item_id / creation_id, only change rank for pick order.
        pass

    # Safer: keep IDs stable; only rewrite rank for interleaved order
    for idx, (it, cr) in enumerate(zip(items, creations), 1):
        it["rank"] = idx
        cr["rank"] = idx
        cr["lab_item"] = it["lab_item"]
        cr["material_detail"] = it["material_detail"]
        cr["category"] = it["category"]
        surface = it.get("surface") or SURFACES[(idx - 1) % len(SURFACES)]
        lighting = it.get("lighting") or LIGHTING[(idx - 1) % len(LIGHTING)]
        camera = it.get("camera_move") or CAMERA[(idx - 1) % len(CAMERA)]
        it["surface"] = surface
        it["lighting"] = lighting
        it["camera_move"] = camera
        cr["scene_brief"] = f"{it['lab_item']} on {surface}, {lighting}, {camera}"
        cr["video_prompt"] = rebuild_prompt(
            idx, it["lab_item_id"], it["lab_item"], it["material_detail"], surface, lighting, camera
        )
        # Ensure status Active
        it["status"] = it.get("status") or "Active"
        cr["status"] = cr.get("status") or "Active"

    # Write
    for path, rows in [
        (SHEETS / "8-lab-items-500.csv", items),
        (SHEETS / "8-lab-items-250.csv", items),
        (SHEETS / "9-lab-item-creations-500.csv", creations),
        (SHEETS / "9-lab-item-creations-250.csv", creations),
    ]:
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    (ROOT / "pbvita-500-lab-items.json").write_text(
        json.dumps({"count": 500, "items": items}, indent=2)
    )
    (ROOT / "pbvita-500-lab-item-creations.json").write_text(
        json.dumps({"count": 500, "creations": creations}, indent=2)
    )

    # Verify no dual/twin/pair left in names (allow "multi-dose")
    bad = []
    for r in items:
        n = r["lab_item"].lower()
        if any(x in n for x in ["dual-chamber", "twin-pack", "pair of", "two research", "cluster in", "twins", "dual pens", "dual research"]):
            bad.append(r["lab_item"])
    cats = [r["category"] for r in items]
    vial_streak = 1
    max_vial = 1
    for i in range(1, len(cats)):
        if cats[i] == cats[i - 1] == "vials_containers":
            vial_streak += 1
            max_vial = max(max_vial, vial_streak)
        else:
            vial_streak = 1

    print(f"Replaced {replaced} multi-subject items")
    print(f"Max consecutive vials_containers by new rank order: {max_vial}")
    print(f"First 15 categories: {cats[:15]}")
    print(f"Remaining bad names: {bad or 'none'}")
    print(f"Sample rank1: {items[0]['lab_item_id']} {items[0]['category']} {items[0]['lab_item'][:50]}")


def clean_fact(text: str) -> str:
    t = str(text or "")
    t = re.sub(r"\s*[·•⋅∙.\u00b7]\s*(ref|motif|card|line|cta)\s*\d+\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*[-–—|]\s*(ref|motif|card|line|cta)\s*\d+\s*$", "", t, flags=re.I)
    t = re.sub(r"\s+(ref|motif|card|line|cta)\s*\d+\s*$", "", t, flags=re.I)
    return t.strip()


def clean_intro(text: str) -> str:
    return re.sub(r"\s*\(\s*\d+\s*/\s*\d+\s*\)\s*$", "", str(text or "")).strip()


def fix_text_library() -> None:
    path = SHEETS / "10-creatomate-text-1000.csv"
    rows = list(csv.DictReader(path.open()))
    assert len(rows) == 1000
    for i, r in enumerate(rows, 1):
        tid = (r.get("text_id") or "").strip()
        if not tid:
            r["text_id"] = f"PBVita-Text-{i:04d}"
        r["rank"] = str(i)
        r["mod_intro"] = clean_intro(r.get("mod_intro", ""))
        for k in ("mod_fact_1", "mod_fact_2", "mod_fact_3", "mod_fact_4", "mod_fact_5"):
            r[k] = clean_fact(r.get(k, ""))
        if not (r.get("status") or "").strip():
            r["status"] = "Active"
        if not (r.get("times_used") or "").strip():
            r["times_used"] = "0"
        if r.get("last_used_at") is None:
            r["last_used_at"] = ""

    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    # legacy 500
    path500 = SHEETS / "10-creatomate-text-500.csv"
    with path500.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows[:500])

    print(f"Text library: filled text_ids, cleaned facts/intros, rows={len(rows)}")
    print(f"Sample Text-0001 fact_1={rows[0]['mod_fact_1'][:70]}")


def main() -> None:
    fix_lab_libraries()
    fix_text_library()


if __name__ == "__main__":
    main()
