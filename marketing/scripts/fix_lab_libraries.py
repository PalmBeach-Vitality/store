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
# Rule: ONE clear primary subject; no extra vials/pens; no stacks that read as many products.
REPLACEMENTS: dict[str, tuple[str, str]] = {
    # --- prior multi-subject fixes ---
    "dual-chamber lyophilized research vial": (
        "single-chamber lyophilized research vial",
        "one clear glass vial, single chamber only, white lyophilized cake, sealed septum, aluminum crimp",
    ),
    "single-chamber lyophilized research vial": (
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
    "single unused nitrile glove laid flat": (
        "single unused nitrile glove laid flat",
        "exactly one glove, flat, unused, no second glove",
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
    "single serological pipette individually wrapped": (
        "single serological pipette individually wrapped",
        "exactly one wrapped pipette, paper/plastic wrap intact",
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
    # --- cross-category vials (confuses Grok into dual subjects) ---
    "brushed stainless steel lab tray with vial": (
        "empty brushed stainless steel lab tray",
        "one empty rectangular stainless tray, clean mirror finish, no vials or products on it",
    ),
    "laboratory freezer box cardboard with vials": (
        "empty cardboard laboratory freezer box",
        "one closed cardboard freezer storage box, no vials visible",
    ),
    "open carton revealing foam-cradled vial": (
        "open research carton with empty foam insert",
        "one open white carton, empty foam well, no vial inside",
    ),
    "autosampler tray with vials partial": (
        "empty HPLC autosampler tray",
        "one empty plastic autosampler tray, vacant wells only, no vials",
    ),
    "foil pouch resealable with vial silhouette": (
        "resealable foil barrier pouch sealed flat",
        "one flat sealed foil pouch, no vial silhouette, no product inside view",
    ),
    "corrugated mailer for vials": (
        "corrugated laboratory mailer box closed",
        "one small closed corrugated mailer, plain, no vials shown",
    ),
    "frosted ice pan with sealed vials": (
        "empty stainless ice pan with crushed ice",
        "one metal ice pan with ice only, no vials",
    ),
    "refrigerator shelf bin with labeled vials": (
        "empty laboratory refrigerator shelf bin",
        "one empty plastic fridge bin, no vials",
    ),
    "ceramic tile sample with amber vial": (
        "cool gray ceramic lab tile sample square",
        "one ceramic tile square only, no vial",
    ),
    "wire chrome basket with cleaned vials": (
        "empty chrome wire laboratory basket",
        "one empty wire basket, no glassware inside",
    ),
    "void fill kraft paper and vial box": (
        "kraft void-fill paper roll",
        "one kraft paper roll for packing, no vial box",
    ),
    "analytical balance with vial on pan": (
        "analytical balance with empty weighing pan",
        "one analytical balance, draft shield, empty pan, no vial on pan",
    ),
    "cryo cane with clip for vials": (
        "empty aluminum cryogenic cane",
        "one metal cryo cane with empty clips, no vials attached",
    ),
    "insulated vial sleeve neoprene": (
        "neoprene insulated bottle sleeve empty",
        "one empty neoprene sleeve standing open, no bottle or vial inside",
    ),
    "probe thermometer in vial sleeve": (
        "digital probe thermometer alone",
        "one digital probe thermometer on bench, no sleeve, no vial",
    ),
    "child-resistant research vial cap assortment": (
        "single child-resistant research bottle cap",
        "exactly one white CR cap, centered, no assortment pile",
    ),
    "calipers measuring a vial diameter": (
        "digital calipers partially open empty",
        "one digital caliper tool only, jaws open, nothing between jaws",
    ),
    "rigid plastic vial wallet": (
        "rigid plastic sample card holder empty",
        "one empty rigid plastic holder, no vials",
    ),
    "cryobox cardboard 10x10 with partial vials": (
        "empty cardboard cryobox 10x10 grid",
        "one open empty cryobox, all wells vacant, no vials",
    ),
    "bench linear organizer with vials pens": (
        "empty bench linear organizer tray",
        "one empty desk organizer for lab bench, no pens or vials",
    ),
    "drawer organizer custom vial wells": (
        "empty foam drawer organizer insert",
        "one empty foam insert with vacant wells, no vials",
    ),
    "autoclave tape roll and indicator vial": (
        "autoclave indicator tape roll",
        "one roll of autoclave tape only, no vial",
    ),
    "molded pulp egg-crate for vials": (
        "empty molded pulp shipping tray",
        "one empty molded pulp tray, vacant cells, no vials",
    ),
    "barcode scanner beside vial": (
        "handheld laboratory barcode scanner",
        "one barcode scanner only, no vial beside it",
    ),
    # --- stacks / multiples / weird props ---
    "beaker nest set of three": (
        "single borosilicate beaker 250ml",
        "exactly one clear beaker, empty, graduation marks visible",
    ),
    "three-neck flask dry": (
        "single-neck round bottom flask dry",
        "one round-bottom flask, single neck, dry glass, no extra necks in use",
    ),
    "stack of Petri dishes": (
        "single sterile Petri dish closed",
        "exactly one closed Petri dish, clear lid, no stack",
    ),
    "sieve stack for powders": (
        "single laboratory test sieve",
        "exactly one metal test sieve, mesh visible, no stacked sieves",
    ),
    "multipack sleeve holding three cartons": (
        "single research product carton closed",
        "exactly one closed carton, no multipack sleeve",
    ),
    "unit dose blister of research cartridges five": (
        "single research cartridge in blister cell",
        "one blister card showing exactly one cartridge cell, others empty or cropped out",
    ),
    "stainless utility cart two shelf": (
        "stainless laboratory utility cart",
        "one stainless utility cart, empty shelves, no products on it",
    ),
    "cold brick stack of two": (
        "single laboratory cold brick pack",
        "exactly one cold pack brick, flat on bench",
    ),
    "research pen body disassembled halves": (
        "research pen capped intact catalog hero",
        "one intact capped research pen, not disassembled",
    ),
    "chemical absorbent pads stack": (
        "single chemical absorbent pad",
        "exactly one absorbent pad laid flat",
    ),
    "sterile gauze stack in tray": (
        "single sterile gauze pack sealed",
        "one sealed gauze pack in a tray, not a tall stack",
    ),
    "cuvette rack acrylic holding four": (
        "empty acrylic cuvette rack",
        "one empty cuvette rack, vacant slots, no cuvettes",
    ),
    "research pen on white infinity cyclorama": (
        "research pen on matte white seamless paper",
        "one capped research pen on plain white paper backdrop",
    ),
    "clear vial suspended in acrylic block embed mock": (
        "clear research vial on acrylic display block",
        "one vial standing on a solid acrylic block base, not embedded inside plastic",
    ),
    "serialized hologram sticker pack": (
        "serialized tamper-evident sticker sheet",
        "one flat sheet of tamper stickers, matte print, no hologram fantasy glow",
    ),
    "research pen clipped to lab coat pocket fabric still": (
        "research pen on folded lab-coat fabric swatch",
        "one pen resting on a fabric swatch only, no person, no body",
    ),
    "lab stool base only cropped": (
        "laboratory stool with metal base",
        "one lab stool, full object, empty seat, no person",
    ),
    "gowning bench empty": (
        "empty cleanroom gowning bench",
        "one empty wooden or laminate gowning bench, no people",
    ),
    "hands-free sensor trash can closed lab": (
        "closed laboratory step-can waste container",
        "one closed stainless or plastic lab waste can, no hands, no sensors emphasized",
    ),
    "hand sanitizer pump bottle lab brand-agnostic": (
        "isopropyl alcohol wash bottle",
        "one labeled IPA wash bottle, squeeze style, laboratory, no hands",
    ),
    "acrylic glove box exterior gloves hanging": (
        "closed acrylic glove box exterior",
        "one glove box chamber exterior, ports capped, no hanging glove shapes that look like hands in use",
    ),
    "cryogenic gloves folded beside cryobox": (
        "single cryogenic glove folded",
        "exactly one cryo glove folded, no cryobox, no second glove",
    ),
    "septum vial with needle-free research adapter nearby": (
        "septum research vial with sealed crimp",
        "one sealed septum vial only, no adapter, no needle hardware",
    ),
    "vial in vacuum skin-pack card": (
        "research vial in simple blister card",
        "one vial on a flat card blister, realistic retail lab pack, no vacuum skin distortion",
    ),
    "amber powder jar with scoop nested on lid": (
        "amber powder jar sealed lid only",
        "one amber jar, lid sealed, no scoop on lid",
    ),
    "box of nitrile gloves blue closed": (
        "closed box of nitrile examination gloves",
        "one closed glove dispenser box, blue, no gloves outside the box",
    ),
    "finger cots box": (
        "closed box of laboratory finger cots",
        "one closed small product box, catalog still, no fingers or skin",
    ),
    # --- injection-adjacent (realistic lab tools, but high Grok misfire risk) ---
    "cold finger condenser": (
        "glass cold-finger condenser apparatus",
        "one glass condenser piece for lab distillation, clear borosilicate, no body parts",
    ),
    "glass Hamilton-style syringe pipette": (
        "glass microliter pipette with metal plunger",
        "one precision glass pipette tool, no hypodermic needle, research liquid handling only",
    ),
    "sterile syringe filter attached to syringe no needle": (
        "sterile syringe-filter disc unit alone",
        "one 0.22 micron filter unit only, no syringe body, no needle",
    ),
    "glass syringe without needle research only": (
        "glass research barrel with Luer lock cap",
        "one glass barrel capped, no needle, no injection context",
    ),
    "syringe pump bare with research syringe glass": (
        "laboratory syringe pump instrument empty",
        "one syringe pump chassis on bench, empty clamp, no needle, no skin context",
    ),
    "syringe filter unit 0.22 micron": (
        "0.22 micron membrane filter cartridge",
        "one small disc filter cartridge only, packaged or bare, no needle, no syringe body",
    ),
    "0.22 micron syringe-filter cartridge": (
        "0.22 micron membrane filter cartridge",
        "one small disc filter cartridge only, no needle, no syringe body",
    ),
    "sterile syringe-filter disc unit alone": (
        "sterile 0.22 micron membrane filter unit",
        "one sterile filter disc unit only, no syringe, no needle",
    ),
    "laboratory syringe pump instrument empty": (
        "laboratory infusion pump chassis empty",
        "one benchtop pump instrument, empty clamp bay, no needle, no consumable loaded",
    ),
    "laboratory infusion pump chassis empty": (
        "laboratory infusion pump chassis empty",
        "one benchtop pump instrument, empty clamp bay, no needle, no consumable loaded",
    ),
    # --- lyophilized / "beside" scenes that cause stacked dual-chamber vials ---
    "single-chamber lyophilized research vial": (
        "clear liquid-filled research vial with crimp seal",
        "one clear single-chamber vial, liquid fill with sharp meniscus, aluminum crimp, rubber stopper, NOT lyophilized cake, NOT dual-chamber",
    ),
    "clear vial with lyophilized white cake": (
        "clear research vial with colorless liquid fill",
        "one single-chamber vial, clear liquid only, no cake, no powder plug, no dual chamber",
    ),
    "lyo vial with cake cracked texture visible": (
        "amber research vial with clear liquid fill",
        "one amber single-chamber vial, liquid fill, one crimp cap, no lyophilized cake, no stacked chambers",
    ),
    "research vial beside matching empty carton": (
        "research vial catalog hero alone",
        "exactly one sealed research vial centered, no carton, no second object",
    ),
    "glass vial with desiccant canister beside it": (
        "glass research vial sealed alone",
        "exactly one sealed glass vial, no desiccant tin, no second object",
    ),
    "research vial next to calibrated weight set": (
        "research vial standing alone on bench",
        "exactly one sealed vial, no weight set in frame",
    ),
    "amber vial beside silica canister mini": (
        "amber research vial sealed alone",
        "exactly one amber vial, no silica canister",
    ),
    "amber vial next to calibrated pipette tip": (
        "amber research vial sealed alone",
        "exactly one amber vial, no pipette tip in frame",
    ),
    "vial rack aluminum 5x10 empty slots with one vial": (
        "single research vial standing alone on bench",
        "one vial only, no rack, no other slots or vials",
    ),
    "HPLC sample vial with insert": (
        "HPLC autosampler vial sealed",
        "one 2ml vial with septum cap, single chamber, no nested insert that looks like a second vial",
    ),
    "single research vial seated in cardboard tray well": (
        "single research vial standing on matte bench",
        "one vial only, no tray, no other wells",
    ),
    "research vial in individual carton window": (
        "research vial standing free on white surface",
        "one vial only, no carton window framing",
    ),
}

SINGLE_SUBJECT = (
    "SINGLE SUBJECT ONLY: exactly one primary laboratory object, sharp and centered. "
    "If the subject is a vial: ONE continuous glass body, ONE chamber, ONE cap/stopper only. "
    "FORBIDDEN: dual-chamber vials, vial stacked on another vial, two vials fused, "
    "lyophilized cake that looks like a second vial underneath, twin packs, "
    "extra vials in frame, product collage, reflections that read as a second product."
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

    while any(buckets.values()):
        progress = False
        for cat in cat_order:
            if not buckets[cat]:
                continue
            if cat == prev:
                continue
            out.append(buckets[cat].popleft())
            prev = cat
            progress = True
        if progress:
            continue

        # Only `prev` still has items — tuck into a safe gap (prefer near the end,
        # never dump leftovers at rank 1).
        cat = next(c for c, q in buckets.items() if q)
        item = buckets[cat].popleft()
        inserted = False
        for i in range(len(out), -1, -1):
            left = out[i - 1]["category"] if i > 0 else None
            right = out[i]["category"] if i < len(out) else None
            if left == item["category"] or right == item["category"]:
                continue
            # Keep the opening cycle clean — don't insert into the first 10 ranks
            if i < min(10, len(out)):
                continue
            out.insert(i, item)
            inserted = True
            break
        if not inserted:
            for i in range(len(out), -1, -1):
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
