#!/usr/bin/env python3
"""Rebuild the 500_Peptide_Wellness_Reel_Scenes tab on Salvatore's rulings.

The audit (scripts/audit_wellness_sheet.py) found the contract clean and
almost everything else broken:

  * 486 of 750 video_prompt values were 805 characters of boilerplate vial
    lock and nothing else -- byte-identical across all 486, no compound, no
    dose, no scene. Their scene copy was never missing: it sits in the
    `surface` column behind a SINGLE HERO SPOTLIGHT prefix.
  * No row stated a hero scale, so the label had no reason to render large
    enough to read -- the same defect that made the Sheet 9 stills illegible.
  * 545 rows printed a label that was not their own compound, and 195 were
    told to copy GHK-Cu's catalog still regardless of their own compound.
  * 47 pen rows carried a VIAL VISUAL LOCK on top of their pen spec, so the
    prompt ordered one vial, one pen, and then said "Never both".
  * The label ink was named four ways: dark maroon, maroon, dark red, crimson.
  * Cagrilintide printed a 10ml footer against a 5ml vial, and was spelled
    "Cagrilinitide".

Rulings taken:

  pens        drop the 47 pen rows; this tab is vials, pens live on Sheet 14
  banned      drop 5-Amino-1MQ and DSIP (no vial SKU in the price sheet) and
              Semaglutide, Tirzepatide, Retatrutide
  roster      align spellings to Sheet 9, add Ipamorelin-Solo x5, and hold
              every compound at 5 rows or more
  boilerplate rebuild video_prompt from the row's own columns

The vial spec blocks are imported from the Sheet 9 builder rather than
copied, so the two tabs cannot drift apart. Label strings come from Sheet 9's
approved set, so both tabs print identical labels for the same compound.

Usage:
    python3 marketing/scripts/rebuild_wellness_sheet.py --dry-run
    python3 marketing/scripts/rebuild_wellness_sheet.py --write
"""

from __future__ import annotations

import argparse
import collections
import csv
import importlib.util
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SHEET = REPO / "marketing/sheets/500_Peptide_Wellness_Reel_Scenes.csv"
SHEET9 = REPO / "marketing/sheets/9-lab-item-creations-500.csv"
OUT_JSON = REPO / "marketing/sheets/500-wellness-rebuild.json"
OUT_NEW = REPO / "marketing/sheets/500-wellness-new-5.csv"


def load_sheet9_spec():
    """Import the vial spec blocks from the Sheet 9 builder."""
    path = REPO / "marketing/scripts/match_catalog_vial_artwork.py"
    spec = importlib.util.spec_from_file_location("s9spec", path)
    mod = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, ["s9spec", "--dry-run"]
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.argv = argv
    return mod


S9 = load_sheet9_spec()
RED = S9.RED

DROP_COMPOUNDS = {
    # No vial SKU on the price sheet -- a vial row renders a product that
    # does not exist.
    "5-Amino-1MQ", "DSIP",
    # Dropped on Salvatore's ruling.
    "Semaglutide", "Tirzepatide", "Retatrutide",
}

# Align compound_name to the Sheet 9 roster so one type-in addresses both tabs.
RENAME = {
    "Cagrilinitide": "Cagrilintide",
    "Melanotan 2": "Melanotan II",
    "Thymosin Alpha-1": "TA-1",
    "CJC": "CJC-1295",
    "CJC /Ipamorelin": "CJC/Ipamorelin",
    "Tesamorelin/Ipamorelin": "Tesa-Ipa",
}

GLOW_FILL = "clear bright blue"
DEFAULT_FILL = "crystal-clear colorless"

HERO_SCALE = (
    "HERO SCALE (MANDATORY): the vial is the dominant object in the frame. The glass body "
    "fills 40-45% of the frame width and about two thirds of the frame height, standing "
    "upright and centred with the label squarely facing camera. The environment stays "
    "visible around and behind it, but the vial is never a small prop on a large bench and "
    "the label type is never too small to read."
)

SINGLE_HERO = (
    "SINGLE HERO SPOTLIGHT (COUNT=1): exactly ONE vial in the entire frame. FORBIDDEN: a "
    "second vial, a background vial, a soft-focus vial, a vial pair for depth, any pen, a "
    "production row, a lineup, a rack, a cluster. COUNT = 1."
)

NO_DOUBLES = (
    "ABSOLUTE RULE — NO DOUBLES ANYWHERE: never duplicate any object, prop, vial, bottle, "
    "instrument, notebook, glass, light fixture, or furniture. Never repeat, tile, stack, "
    "mirror-clone, or stencil the same text, label, wall graphic, logo, diagram, or caption "
    "more than once. If text appears, it appears exactly once. Reflections may exist but "
    "must not create a second readable copy of a label or a second hero object."
)

NO_BURN_IN = (
    "Do not print scene titles, gallery names, hex codes, captions, or legal footnotes "
    "anywhere in frame. No burn-in text, lower thirds, watermarks, or readable signage "
    "except the vial label printed once only. Empty of people; no hands, faces, needles, or "
    "clinical procedure staging."
)

CAP_HEAD = (
    "SEATED CAP LOCK: blue flip-off cap stays fully seated on the silver crimp; never pop off. "
    "VIAL VISUAL LOCK (identical every frame): Exactly ONE sealed Palm Beach Vitality clear "
    "glass research vial. "
)

KEEP_RUNS = (
    "Do not change cap color, helix color/style, vial glass shape/size, crimp, or label "
    "layout colors between runs."
)

# The scene sentence in `surface` opens with its own bottle descriptor -- "a
# glowing amber wellness vial", "a slim silver-capped peptide bottle" -- which
# contradicts the hardware lock. Strip it and let the lock govern appearance
# while the scene governs action and environment.
LEAD_BOTTLE = re.compile(
    r"^(?:A|An|The)\s+(?:[\w\-]+\s+){0,5}?(?:vial|bottle|pen|vessel|flask|container)\b\s*",
    re.I,
)
SURFACE_PREFIX = "COUNT = 1."


def label_strings(sheet9_rows) -> dict:
    """Lift the approved label strings per compound out of Sheet 9."""
    out = {}
    for r in sheet9_rows:
        p, name = r["video_prompt"], r["compound_name"].strip()
        printed = re.search(r"reading exactly '([^']+)', brick red #A63334 dose bar", p)
        dose = re.search(r"dose bar with white text reading exactly '([^']+)'", p)
        conc = re.search(r"concentration line under the bar reading exactly '([^']+)'", p)
        foot = re.search(r"footer reading exactly '([^']+)'", p)
        if not (printed and dose and foot):
            continue
        key = (printed.group(1), dose.group(1), conc.group(1) if conc else None, foot.group(1))
        out.setdefault(name, collections.Counter())[key] += 1
    # Most common wins; BPC-157 legitimately carries two SKUs.
    return {k: v.most_common(1)[0][0] for k, v in out.items()}


def scene_from_surface(surface: str, creation_id: str) -> str:
    i = surface.find(SURFACE_PREFIX)
    if i < 0:
        raise SystemExit(f"{creation_id}: surface has no '{SURFACE_PREFIX}' prefix")
    tail = surface[i + len(SURFACE_PREFIX):].strip()
    if not tail:
        raise SystemExit(f"{creation_id}: surface carries no scene text")
    m = LEAD_BOTTLE.match(tail)
    if m:
        rest = tail[m.end():].strip()
        rest = rest[0].lower() + rest[1:] if rest else rest
        scene = f"The hero vial {rest}"
    else:
        head = tail[0].lower() + tail[1:]
        scene = (
            f"The setting is {head}. The hero vial stands in the foreground, upright and "
            "squarely facing camera"
        )
    return scene.rstrip(". ") + "."


def build_prompt(row: dict, labels: dict) -> str:
    cid = row["creation_id"]
    compound = row["compound_name"].strip()
    if compound not in labels:
        raise SystemExit(f"{cid}: no approved label strings for {compound!r}")
    printed, dose, conc, footer = labels[compound]

    vol = re.match(r"(\d+)mL", footer)
    if not vol:
        raise SystemExit(f"{cid}: cannot read a volume out of {footer!r}")
    width = S9.WIDTH_5ML if vol.group(1) == "5" else S9.WIDTH_10ML

    if conc:
        conc_clause = f"black concentration line under the bar reading exactly '{conc}'"
        strings = [printed, dose, conc, footer]
        count = "four"
    else:
        conc_clause = "NO mg/ml concentration line anywhere (do not invent one)"
        strings = [printed, dose, footer]
        count = "three"

    fill = GLOW_FILL if compound == "GLOW" else DEFAULT_FILL
    quoted = ", ".join(f"'{s}'" for s in strings[:-1]) + f", and '{strings[-1]}'"

    parts = [
        CAP_HEAD + S9.VIAL_SHAPE + width,
        f"Label: white face with a single {RED} double-helix DNA emblem centred at the top, "
        f"compound name in large bold {RED} reading exactly '{printed}', {RED} dose bar with "
        f"white text reading exactly '{dose}', {conc_clause}, small black footer reading "
        f"exactly '{footer}'. All {count} strings are printed once, spelled exactly as "
        "written, in crisp sharp type that is fully legible at full resolution.",
        S9.LABEL_PLACEMENT.strip(),
        S9.EMBLEM.strip(),
        f"The {RED} dose bar is inset from both label edges with even white margin on the "
        "left and the right, never bleeding off the edge of the label.",
        HERO_SCALE,
        KEEP_RUNS,
        SINGLE_HERO,
        "Photoreal vertical 9:16 Palm Beach Vitality cinematic research still.",
        f"FULL SCENE BRIEF: {scene_from_surface(row['surface'], cid)} "
        f"Lighting: {row['lighting'].strip().rstrip('.')}. "
        f"Color grade: {row['color_grade'].strip().rstrip('.')}. "
        f"The mood is {row['vibe'].strip().lower()} on the theme of {row['theme'].strip()}. "
        "Use negative space generously so the scene breathes and never reads as a cluttered "
        "bench dump.",
        "VIAL STATE RULE (MANDATORY — CRITICAL): Exactly ONE vial only in the entire frame. "
        "The vial is ALWAYS upright — standing vertical on its base, never tipped, never on "
        "its side, never diagonal, never lying down. The vial is ALWAYS pre-filled before the "
        f"still is captured: show a settled {fill} liquid fill already inside the vial at a "
        "stable level. FORBIDDEN in still and video: pouring into the vial, filling up, "
        "rising liquid level, empty vial, half-filling animation, dripping into the vial, "
        "uncapping to fill, syringe or transfer into the vial, bubbling as if just poured. "
        "Liquid does not change level during video — pre-filled and static.",
        NO_BURN_IN,
        f"LABEL REQUIREMENT: the label prints exactly {count} strings and nothing else — "
        f"{quoted} — each printed once, alongside the {RED} DNA helix icon. No other lettering "
        "anywhere on the label: no research-use disclaimer lines, no LAB codes, no lot "
        "numbers, no fine print, no motifs, no counters, no repeated lettering. Any text that "
        f"is not one of those {count} strings is wrong.",
        f"SHOT FAMILY: {row['shot_family'].strip()}. "
        f"CAMERA ANGLE: {row['camera_angle'].strip()}. "
        f"CAMERA DIRECTION: {row['camera_direction'].strip()}. "
        f"FRAMING: {row['framing'].strip()}. "
        f"Intended follow-on camera move: {row['camera_move'].strip().rstrip('.')}.",
        NO_DOUBLES,
    ]
    suffix = row["quality_suffix"].strip()
    if suffix:
        parts.append(f"Quality variable: {suffix}.")

    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def build_brief(prompt: str) -> str:
    m = re.search(r"FULL SCENE BRIEF: (.*?) VIAL STATE RULE", prompt, re.S)
    if not m:
        raise SystemExit("could not re-derive scene_brief")
    return m.group(1).strip()


def retarget_motion(motion: str, printed: str, cid: str) -> str:
    """The motion prompt is sound; only its label quote can be stale."""
    out, n = re.subn(r"Keep label '[^']*' unchanged", f"Keep label '{printed}' unchanged", motion)
    if n != 1:
        raise SystemExit(f"{cid}: motion prompt has no single label clause")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.write or args.dry_run):
        ap.error("pass --dry-run or --write")

    with SHEET.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        rows = [dict(r) for r in reader]
    with SHEET9.open(newline="", encoding="utf-8") as fh:
        labels = label_strings([dict(r) for r in csv.DictReader(fh)])

    if any("VIAL SHAPE (MANDATORY" in r["video_prompt"] for r in rows):
        raise SystemExit("the tab is already rebuilt — restore the mirror from git first")

    before = len(rows)
    dropped_pen = [r for r in rows if r["category"] == "pen_3ml"]
    rows = [r for r in rows if r["category"] != "pen_3ml"]
    dropped_ban = [r for r in rows if r["compound_name"].strip() in DROP_COMPOUNDS]
    rows = [r for r in rows if r["compound_name"].strip() not in DROP_COMPOUNDS]

    for r in rows:
        name = r["compound_name"].strip()
        r["compound_name"] = RENAME.get(name, name)

    # --------------------------------------------------- add Ipamorelin-Solo
    used_ids = {r["creation_id"] for r in rows}
    donors, seen_moves = [], set()
    for r in rows:
        if r["shot_family"] != "vial_landscape":
            continue
        verb = re.sub(r"\bunique recipe \S+", "", r["camera_move"])[:40]
        if verb in seen_moves:
            continue
        seen_moves.add(verb)
        donors.append(r)
        if len(donors) == 5:
            break
    if len(donors) != 5:
        raise SystemExit("could not find 5 donor rows with distinct camera moves")

    next_rank = max(int(r["rank"]) for r in rows) + 1
    new_rows = []
    for i, donor in enumerate(donors, start=1):
        cid = f"LI-{500 + i:03d}"
        if cid in used_ids:
            raise SystemExit(f"{cid} already exists")
        new = dict(donor)
        new["creation_id"] = cid
        new["rank"] = str(next_rank + i - 1)
        new["compound_name"] = "Ipamorelin-Solo"
        new["compound_id"] = "V-IPA-001"
        new["canonical_url"] = "https://www.palmbeach-vitality.store/products/ipamorelin"
        new["caption_lock"] = (
            "Captions MUST be only about Ipamorelin (V-IPA-001) and "
            "https://www.palmbeach-vitality.store/products/ipamorelin."
        )
        new["camera_move"] = re.sub(r"unique recipe \S+?,", f"unique recipe {cid},",
                                    donor["camera_move"])
        new["framing"] = re.sub(r"recipe \S+$", f"recipe {cid}", donor["framing"])
        new["times_used"] = "0"
        new["last_used_at"] = ""
        new["reel_still_url"] = ""
        new["video_url"] = ""
        new_rows.append(new)
    rows.extend(new_rows)

    # ------------------------------------------------------- rebuild prompts
    for r in rows:
        r["video_prompt"] = build_prompt(r, labels)
        r["scene_brief"] = build_brief(r["video_prompt"])
        printed = labels[r["compound_name"].strip()][0]
        r["video_motion_prompt"] = retarget_motion(
            r["video_motion_prompt"], printed, r["creation_id"])
        # These three held copies of the old lock rather than their own
        # content; point them at the spec that is now authoritative.
        head = r["video_prompt"][:r["video_prompt"].find("Label: white face")].strip()
        r["material_detail"] = head
        r["hero_style"] = head
        r["surface"] = f"{SINGLE_HERO} {scene_from_surface(r['surface'], r['creation_id'])}"
        r["still_edit_prompt"] = (
            f"VIAL LABEL LOCK: print exactly "
            + ", ".join(f"'{s}'" for s in
                        [labels[r['compound_name'].strip()][0],
                         labels[r['compound_name'].strip()][1]]
                        + ([f"{labels[r['compound_name'].strip()][2]}"]
                           if labels[r["compound_name"].strip()][2] else [])
                        + [labels[r["compound_name"].strip()][3]])
            + " once each and nothing else."
        )

    rows.sort(key=lambda r: int(r["rank"]))

    # ------------------------------------------------------------------- QA
    fails = []
    names = collections.Counter(r["compound_name"] for r in rows)

    def norm(s):
        return re.sub(r"[^a-z0-9]", "", s.lower())

    for a in names:
        for b in names:
            if a == b:
                continue
            na, nb = norm(a), norm(b)
            if na in nb or nb in na:
                fails.append(f"reachability: {a!r} and {b!r} collide")
    for name, n in names.items():
        if n < 5:
            fails.append(f"{name!r} has only {n} rows (minimum 5)")
        if name != name.strip():
            fails.append(f"{name!r} has stray whitespace")
    for r in rows:
        p = r["video_prompt"]
        for once in ("VIAL SHAPE (MANDATORY", "LABEL PLACEMENT:", "HELIX EMBLEM (MANDATORY",
                     "HERO SCALE (MANDATORY)", "LABEL REQUIREMENT:", "FULL SCENE BRIEF:",
                     "VIAL STATE RULE"):
            if p.count(once) != 1:
                fails.append(f"{r['creation_id']}: {once!r} appears {p.count(once)}x")
        if re.search(r"\bmaroon\b|\bcrimson\b|dark red double|GHK-Cu catalog", p):
            if r["compound_name"] != "GHK-Cu" or "catalog still" in p:
                fails.append(f"{r['creation_id']}: stale colour or donor wording survived")
        if "Multi-Use" in p or re.search(r"'\d+ml ", p):
            fails.append(f"{r['creation_id']}: old footer typography survived")
        printed = labels[r["compound_name"].strip()][0]
        if f"reading exactly '{printed}'" not in p:
            fails.append(f"{r['creation_id']}: label is not its own compound")
        if f"Keep label '{printed}'" not in r["video_motion_prompt"]:
            fails.append(f"{r['creation_id']}: motion label not retargeted")
        for f in ("camera_move", "framing", "lighting", "color_grade", "theme", "vibe"):
            if not str(r[f]).strip():
                fails.append(f"{r['creation_id']}: {f} blank")
    for f in ("creation_id", "camera_move", "framing", "rank", "video_prompt"):
        dup = [k for k, v in collections.Counter(r[f] for r in rows).items() if v > 1]
        if dup:
            fails.append(f"duplicate {f}: {[str(d)[:40] for d in dup[:4]]}")

    lens = [len(r["video_prompt"]) for r in rows]
    print(f"rows: {before} -> {len(rows)}")
    print(f"  dropped {len(dropped_pen)} pen rows, {len(dropped_ban)} banned-compound rows, "
          f"added {len(new_rows)}")
    print(f"compounds: {len(names)}")
    print(f"row counts: min {min(names.values())}, max {max(names.values())}")
    print(f"prompt length: {min(lens)}-{max(lens)} chars")
    print(f"scene briefs distinct: {len({r['scene_brief'] for r in rows})} of {len(rows)}")
    print(f"QA: {'PASS' if not fails else f'{len(fails)} FAIL'}")
    for f in fails[:20]:
        print("   ", f)
    if fails:
        return 1

    if args.write:
        with SHEET.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)
        with OUT_NEW.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields)
            w.writeheader()
            w.writerows(new_rows)
        OUT_JSON.write_text(json.dumps(
            {
                "keep": [{f: r[f] for f in fields} for r in rows],
                "delete_ids": sorted(r["creation_id"] for r in dropped_pen + dropped_ban),
            }, indent=1) + "\n")
        print(f"\nwrote {SHEET.name}, {OUT_NEW.name}, {OUT_JSON.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
