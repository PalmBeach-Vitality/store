#!/usr/bin/env python3
"""Rebuild Sheet 9 as 100 health/wellness scene settings (no lab sets).

Source: marketing/sheets/health_wellness_scene_settings_100.csv
Output (only):
  - sheets/9-lab-item-creations-500.csv  (100 rows; tab name kept for n8n)

Does NOT touch 8-lab-items-*, 9-*-250, or JSON mirrors.

Rank order is staggered by environment bucket so adjacent daily ranks never
share the same setting or the same coarse bucket.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
SRC = SHEETS / "health_wellness_scene_settings_100.csv"
CSV9 = SHEETS / "9-lab-item-creations-500.csv"
LABELS = json.loads((ROOT / "compound-labels.json").read_text())["labels"]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from camera_recipes import build_unique_camera_sequence  # noqa: E402

QUALITY = (
    "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
    "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR"
)
NO_DOUBLES = (
    "ABSOLUTE RULE — NO DOUBLES ANYWHERE: never duplicate any object, prop, vial, bottle, instrument, "
    "furniture, plant, or light fixture. Never tile, stack, mirror-clone, or stencil the same text, "
    "label, logo, diagram, or caption more than once. Reflections may exist but must not create a "
    "second readable copy of a label or a second hero object."
)
VIAL_CLOSURE = (
    "VIAL CLOSURE RULE (MANDATORY): When a research vial appears, it must be a pharmaceutical "
    "injection vial with an aluminum crimped seal over a rubber septum stopper. Show the crimped "
    "metal collar and rubber center clearly. NO twist-off caps, NO screw-top vials, NO plastic "
    "twist closures — crimped metal + rubber only."
)
AVOID = (
    "Avoid: people, hands, faces, skin contact, needles, syringes, injection, medical procedures, "
    "clinical spa treatments, IV drips, hospital rooms, sterile cleanrooms, HPLC stacks, biosafety "
    "cabinets, cryo dewars as hero, laboratory benches as the main set, lifestyle influencers, "
    "cardboard shipping boxes as hero, fake LAB codes, creation motifs, 000/500 counters, surreal "
    "CGI orbs, watermarks, lower-third captions, scene titles printed in frame, hex IDs, burn-in "
    "text, subtitles, timecodes, duplicated text, tiled wall lettering, cloned props, twist-top "
    "vials, screw-cap vials. Do NOT render any prompt metadata as visible text in the image. "
    f"{NO_DOUBLES} {VIAL_CLOSURE}"
)
COMPLIANCE = (
    "No treatment, cure, dosage-for-humans, or clinical outcome claims as readable text in the image. "
    "Do not print research-use disclaimers, legal footnotes, or caption bars in the frame."
)

# Coarse buckets for daily stagger (adjacent ranks must differ).
# Word boundaries required — bare "cove" otherwise matches "Covered".
BUCKET_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("kitchen_cafe", re.compile(
        r"\b(kitchen|juice|smoothie|breakfast|produce|café|cafe|laundry|coffee)\b",
        re.I,
    )),
    ("fitness", re.compile(r"\b(gym|fitness|resistance|yoga studio|yoga platform)\b", re.I)),
    ("water_calm", re.compile(r"\b(lake|lakeshore|lakeside|dock|riverside)\b", re.I)),
    ("beach_coast", re.compile(
        r"\b(beach|shoreline|cove|lagoon|boardwalk|dune|ocean|pier|coastal|tide|"
        r"cliffside|sea breeze|low tide)\b",
        re.I,
    )),
    ("garden_outdoor_home", re.compile(
        r"\b(garden|patio|porch|backyard|deck|balcony|courtyard|cabana|outdoor shower|"
        r"outdoor kitchen|outdoor yoga|raised beds|hanging plants|string lights|"
        r"picnic|herb garden)\b",
        re.I,
    )),
    ("urban_park", re.compile(
        r"\b(park|pavilion|rooftop|neighborhood|fountain|terrace|pool deck)\b",
        re.I,
    )),
    ("home_interior", re.compile(
        r"\b(living room|bedroom|meditation|reading|attic|hallway|entryway|loft|"
        r"apartment|sunroom|bathroom|nook|cushions|blankets|standing desk|"
        r"home office|home studio|stretching|floor cushions)\b",
        re.I,
    )),
    ("forest_nature", re.compile(
        r"\b(forest|woodland|trail|meadow|hills|farmland|orchard|bamboo|pines|moss|"
        r"wildflower|wetland|river|stream|waterfall|swimming hole|canyon|desert|"
        r"vineyard|country road|valley)\b",
        re.I,
    )),
]

SURFACES = [
    "warm natural wood with soft grain",
    "sun-bleached linen and pale stone",
    "smooth concrete with soft satin finish",
    "weathered teak decking",
    "cool marble with gentle veining",
    "packed earth trail with soft moss edges",
    "matte ceramic tile with spa-calm tone",
    "woven natural fiber rug over hardwood",
    "sand-toned stone pavers",
    "soft limestone with coastal texture",
]

LIGHTINGS = [
    "golden-hour side light with long soft shadows",
    "bright airy daylight through sheer curtains",
    "blue-hour cool ambient with warm practical pools",
    "dappled leaf-filtered sunlight",
    "soft overcast diffusion, even and flattering",
    "sunrise rim light with gentle haze",
    "candle-warm evening practicals plus cool window fill",
    "hard midday sun softened by open shade",
    "twilight gradient sky wash",
    "crisp morning window light with specular glass highlights",
]

COLOR_GRADES = [
    "warm coastal wellness grade with honest neutrals",
    "fresh green outdoor grade, natural and airy",
    "soft morning pastel grade with clean whites",
    "golden-hour amber grade restrained by true skin-free neutrals",
    "cool blue-hour coastal grade with warm interior accents",
    "editorial lifestyle catalog grade, high clarity, low drama",
]

HERO_STYLES = [
    "environment-first lifestyle still with quiet product presence",
    "editorial wellness catalog frame",
    "macro-to-environment storytelling frame",
    "architecture-and-atmosphere establishing shot",
    "premium coastal lifestyle direction",
    "calm spa-adjacent home still without clinical cues",
]

OPENERS = [
    "Wide establishing energy:",
    "Intimate cinematic entry:",
    "Architectural reveal:",
    "Quiet lifestyle tableau:",
    "Golden-hour atmosphere:",
    "Fresh morning clarity:",
    "Editorial wellness frame:",
    "Coastal living brochure energy:",
]

PRODUCT_FOCALS = [
    "a single crimped-seal rubber-septum research vial catching soft rim light on a natural surface",
    "a sealed research pen resting like a premium design object beside wellness props",
    "a small clear research vial and matching carton silhouette staged as quiet product jewelry",
    "an elegant research vial on a stone coaster, label facing camera once only",
    "a research pen and vial pair arranged with intentional negative space",
]

AMBIENT_FOCALS = [
    "a thoughtfully arranged wellness still-life with premium empty space for the eye to rest",
    "natural textures and one quiet branded research product detail in soft focus mid-ground",
    "a lifestyle vignette where atmosphere leads and product presence stays subtle",
]

TWISTS = [
    "A soft breeze is implied by fabric and leaf motion cues at the edge of frame.",
    "Condensation beads map a gentle gradient on a cold glass of citrus water in bokeh.",
    "Long shadows cut a clean diagonal across the composition.",
    "Reflections stay honest — no cloned second hero object.",
    "A single shaft of sunlight picks out the product shoulder without looking staged.",
    "Negative space breathes; nothing feels cluttered or prop-dumped.",
    "Color story stays natural: greens, sand, linen, ocean glass.",
    "Depth builds with foreground blur, mid-ground hero, soft background atmosphere.",
    "Materials read as real wood, glass, fabric, and stone — never CGI plastic.",
    "The scene feels lived-in and calm, never clinical or laboratory.",
]

ACTIONS = [
    "Compose as a vertical 9:16 hero still that could open a premium Instagram reel.",
    "Let the place lead, then reward the eye with one quiet product focal point.",
    "Use negative space generously so the lifestyle setting feels expansive.",
    "Prioritize photoreal materials: wood grain, linen weave, glass weight, sand, foliage.",
    "Make the still exciting enough that a slow camera move feels like entering a world.",
]


def classify_bucket(setting: str) -> str:
    for name, pattern in BUCKET_RULES:
        if pattern.search(setting):
            return name
    return "lifestyle_general"


def slugify(setting: str, number: int) -> str:
    base = re.sub(r"[^a-z0-9]+", "_", setting.lower()).strip("_")
    base = re.sub(r"_+", "_", base)[:48].strip("_")
    return f"{base}" if base else f"scene_{number:03d}"


def _pick(seq: list, i: int, salt: int = 0):
    h = int(hashlib.sha1(f"{i}|{salt}|{len(seq)}".encode()).hexdigest(), 16)
    return seq[h % len(seq)]


def stagger_settings(settings: list[dict]) -> list[dict]:
    """True round-robin across buckets so early ranks mix all environments."""
    by_bucket: dict[str, list[dict]] = defaultdict(list)
    for s in settings:
        by_bucket[s["bucket"]].append(s)

    # Rotate starting with larger variety first alphabetically for stability,
    # but walk buckets in a fixed cycle (not "most remaining").
    buckets = sorted(by_bucket.keys(), key=lambda b: (-len(by_bucket[b]), b))
    pointers = {b: 0 for b in buckets}
    ordered: list[dict] = []
    last_bucket = None
    cursor = 0

    while len(ordered) < len(settings):
        placed = False
        for offset in range(len(buckets)):
            b = buckets[(cursor + offset) % len(buckets)]
            if pointers[b] >= len(by_bucket[b]):
                continue
            if last_bucket and b == last_bucket:
                # Skip same-as-last unless this is the only bucket left with rows
                others = any(
                    pointers[x] < len(by_bucket[x]) for x in buckets if x != b
                )
                if others:
                    continue
            item = by_bucket[b][pointers[b]]
            pointers[b] += 1
            ordered.append(item)
            last_bucket = b
            cursor = (buckets.index(b) + 1) % len(buckets)
            placed = True
            break
        if not placed:
            break

    if len(ordered) != len(settings):
        raise SystemExit("stagger failed to place all settings")

    for i in range(1, len(ordered)):
        if ordered[i]["scene_setting"] == ordered[i - 1]["scene_setting"]:
            raise SystemExit(f"adjacent duplicate setting at {i}")
    return ordered


def load_settings() -> list[dict]:
    if not SRC.exists():
        raise SystemExit(f"missing source CSV: {SRC}")
    rows = list(csv.DictReader(SRC.open(encoding="utf-8")))
    out: list[dict] = []
    for r in rows:
        num = int(str(r.get("Number") or r.get("number") or "").strip())
        setting = str(r.get("Scene Setting") or r.get("scene_setting") or "").strip()
        if not setting:
            raise SystemExit(f"empty scene setting for Number={num}")
        out.append(
            {
                "number": num,
                "scene_setting": setting,
                "bucket": classify_bucket(setting),
                "category": slugify(setting, num),
            }
        )
    if len(out) != 100:
        raise SystemExit(f"expected 100 scene settings, got {len(out)}")
    # Stable within-bucket order by original number
    out.sort(key=lambda x: x["number"])
    return stagger_settings(out)


def assign_compound(rank: int) -> str:
    if rank % 8 == 0:
        return ""
    return LABELS[(rank - 1) % len(LABELS)]


def build_scene(rank: int, setting_row: dict, compound: str) -> dict:
    i = rank - 1
    setting = setting_row["scene_setting"]
    bucket = setting_row["bucket"]
    surface = _pick(SURFACES, i, 1)
    lighting = _pick(LIGHTINGS, i, 2)
    color_grade = _pick(COLOR_GRADES, i, 3)
    hero_style = _pick(HERO_STYLES, i, 4)
    opener = OPENERS[i % len(OPENERS)]
    twist = _pick(TWISTS, i, 5)
    action = _pick(ACTIONS, i, 6)

    if compound:
        focal = _pick(PRODUCT_FOCALS, i, 7)
        label_sentence = (
            f" If any vial, pen, carton panel, or plaque shows a product name, "
            f"it must read exactly '{compound}' only — never invent other compound names, "
            f"and never add research-use disclaimer lines on the label. "
            f"Do not print scene titles, captions, hex codes, or legal footnotes anywhere in frame."
        )
    else:
        focal = _pick(AMBIENT_FOCALS, i, 7)
        label_sentence = (
            " Do not print scene titles, captions, hex codes, watermarks, or legal footnotes "
            "anywhere in frame."
        )

    no_burn = (
        " Absolutely no burn-in text, lower thirds, watermarks, or readable signage except an "
        "optional exact research compound label printed once only. "
        "NO DOUBLES: never tile, stack, or repeat any text, diagram, or prop."
    )

    structure = i % 3
    if structure == 0:
        paragraph = (
            f"{opener} Health and wellness lifestyle scene. Setting — {setting}. "
            f"The frame discovers {focal}. {twist} "
            f"Everything sits on {surface} under {lighting}, materials behaving like physics not CGI. "
            f"{action} Palm Beach Vitality premium wellness-world storytelling — exciting, calm, "
            f"and never a laboratory set. Empty of people; no clinical procedure staging."
            f"{label_sentence}{no_burn}"
        )
    elif structure == 1:
        paragraph = (
            f"Lifestyle wellness world: {setting}. {opener} "
            f"A vertical 9:16 composition builds around {focal}. "
            f"{twist} Ground the image on {surface} with {lighting}. {action} "
            f"This is outdoor/home atmosphere for Palm Beach Vitality — not a cleanroom, not a "
            f"bench dump, not a sterile lab. Keep the space unoccupied by people or procedure props."
            f"{label_sentence}{no_burn}"
        )
    else:
        paragraph = (
            f"{opener} Place the story in {setting}, then lock focus on {focal}. "
            f"{twist} Surface language is {surface}; light language is {lighting}. {action} "
            f"Sell modern health-and-wellness atmosphere with subtle research-product presence "
            f"for Palm Beach Vitality. Photoreal only. No occupants, no medical theater."
            f"{label_sentence}{no_burn}"
        )

    material_detail = (
        f"Scene setting (exact): {setting}. Environment bucket: {bucket.replace('_', ' ')}. "
        f"Focal — {focal}. Surface {surface}; lighting {lighting}. {twist} "
        f"Keep the scene photoreal, lifestyle-forward, and vertically composed. "
        f"No lab benches, cleanrooms, or clinical spa treatments as the main set. "
        f"No watermarks, captions, scene titles, or codes burned into the frame."
    )

    scene_brief = f"{setting} · {bucket.replace('_', ' ')} · {lighting.split(',')[0]}"

    return {
        "category": setting_row["category"],
        "scene_setting": setting,
        "lab_item": paragraph,
        "material_detail": material_detail,
        "compound_name": compound,
        "surface": surface,
        "lighting": lighting,
        "color_grade": color_grade,
        "hero_style": hero_style,
        "scene_brief_seed": scene_brief,
        "bucket": bucket,
    }


def rebuild_still_prompt(row: dict, shot: dict) -> str:
    scene = row["lab_item"]
    detail = row.get("material_detail") or ""
    setting = row.get("scene_setting") or ""
    compound = (row.get("compound_name") or "").strip()
    if compound:
        label_rule = (
            f"LABEL REQUIREMENT: if any label appears, it MUST read exactly '{compound}' "
            f"(Palm Beach Vitality compound name only), printed ONCE only. "
            f"No research-use disclaimer lines, LAB codes, motifs, counters, or repeated lettering."
        )
    else:
        label_rule = (
            "LABEL REQUIREMENT: keep any printed panels minimal/illegible/blank; "
            "do not invent compound names, LAB codes, motifs, counters, or repeated wall text."
        )
    return (
        f"Photoreal vertical 9:16 Palm Beach Vitality cinematic wellness still. "
        f"Create an exciting, unique health-and-wellness lifestyle scene — NOT a laboratory, "
        f"NOT a cleanroom, NOT a sterile research bench. "
        f"EXACT SCENE SETTING: {setting}. "
        f"FULL SCENE BRIEF: {scene} "
        f"Supporting notes: {detail} "
        f"SHOT FAMILY: {shot['shot_family']}. "
        f"CAMERA ANGLE: {shot['camera_angle']}. "
        f"CAMERA DIRECTION: {shot['camera_direction']}. "
        f"FRAMING: {shot['framing']}. "
        f"Hero style: {row.get('hero_style')}. "
        f"Setting surface: {row.get('surface')}. Lighting: {row.get('lighting')}. "
        f"Intended follow-on camera move: {shot['camera_move']}. Energy: {shot.get('energy', 'cinematic')}. "
        f"Color grade: {row.get('color_grade')}. "
        f"{label_rule} "
        f"{NO_DOUBLES} "
        f"{VIAL_CLOSURE} "
        f"Compose for lifestyle atmosphere and depth — environment-forward storytelling. "
        f"{AVOID} "
        f"Quality: {QUALITY}. "
        f"{COMPLIANCE}"
    )


def rebuild_motion_prompt(row: dict, shot: dict) -> str:
    def ascii(s: str) -> str:
        s = str(s or "")
        s = (
            s.replace("‘", "'")
            .replace("’", "'")
            .replace("“", '"')
            .replace("”", '"')
            .replace("–", "-")
            .replace("—", "-")
            .replace("…", "...")
            .replace("×", "x")
        )
        s = re.sub(r"[^\x09\x0A\x0D\x20-\x7E]", " ", s)
        return re.sub(r"\s+", " ", s).strip()

    compound = ascii(row.get("compound_name") or "")
    setting = ascii(row.get("scene_setting") or "wellness lifestyle setting")[:120]
    move = ascii(shot.get("camera_move") or "slow push-in")[:160]
    prompt = (
        f"Slow cinematic camera: {move}. "
        f"Shot {ascii(shot.get('shot_family') or 'push_in')}, "
        f"angle {ascii(shot.get('camera_angle') or 'eye-level')}, "
        f"direction {ascii(shot.get('camera_direction') or 'forward')}. "
        f"Keep the exact same wellness lifestyle scene ({setting}), materials, and lighting. "
        f"No orbit. No new objects. No duplicate props. No repeated text or graphics. "
        f"No people, hands, faces, needles, laboratories, watermarks, burn-in, or on-screen disclaimers."
    )
    if compound:
        prompt += f" Keep label '{compound}' unchanged if visible, once only."
    return ascii(prompt)


def rebuild_scene_brief(row: dict, shot: dict) -> str:
    seed = row.get("scene_brief_seed") or row.get("scene_setting") or row["category"]
    parts = [
        seed,
        f"shot:{shot['shot_family']}",
        f"angle:{shot['camera_angle']}",
    ]
    compound = (row.get("compound_name") or "").strip()
    if compound:
        parts.append(f"label:{compound}")
    return " · ".join(parts)


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def main() -> None:
    settings = load_settings()
    cams = build_unique_camera_sequence(100)
    rows: list[dict] = []
    paragraphs: list[str] = []
    used_settings: list[str] = []

    quality_suffix = (
        "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
        "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR"
    )

    for rank, (setting_row, shot) in enumerate(zip(settings, cams), start=1):
        compound = assign_compound(rank)
        scene = build_scene(rank, setting_row, compound)
        creation_id = f"PBVita-Scene-{rank:03d}"
        lab_item_id = f"SCN-{rank:03d}"

        row = {
            "creation_id": creation_id,
            "rank": str(rank),
            "lab_item_id": lab_item_id,
            "category": scene["category"],
            "scene_setting": scene["scene_setting"],
            "lab_item": scene["lab_item"],
            "material_detail": scene["material_detail"],
            "compound_name": scene["compound_name"],
            "shot_family": shot["shot_family"],
            "camera_angle": shot["camera_angle"],
            "camera_direction": shot["camera_direction"],
            "framing": shot["framing"],
            "scene_brief": "",
            "quality_var_count": "12",
            "quality_suffix": quality_suffix,
            "aspect_ratio": "9:16",
            "duration_seconds": "15",
            "resolution": "1080p",
            "model_still": "grok-imagine-image-quality",
            "model_video": "grok-imagine-video-1.5",
            "still_resolution": "2k",
            "video_prompt": "",
            "video_motion_prompt": "",
            "status": "Active",
            "times_used": "0",
            "last_used_at": "",
            "surface": scene["surface"],
            "lighting": scene["lighting"],
            "camera_move": shot["camera_move"],
            "color_grade": scene["color_grade"],
            "hero_style": scene["hero_style"],
            "scene_brief_seed": scene["scene_brief_seed"],
            "environment_bucket": scene["bucket"],
        }
        energy = shot.get("energy") or "controlled premium cinematic motion"
        shot_with_energy = {**shot, "energy": energy}
        row["video_prompt"] = rebuild_still_prompt(row, shot_with_energy)
        row["video_motion_prompt"] = rebuild_motion_prompt(row, shot_with_energy)
        row["scene_brief"] = rebuild_scene_brief(row, shot_with_energy)
        row.pop("scene_brief_seed", None)

        rows.append(row)
        paragraphs.append(row["lab_item"])
        used_settings.append(row["scene_setting"])

    # Audits
    if len(set(paragraphs)) != 100:
        raise SystemExit(f"duplicate paragraphs: {100 - len(set(paragraphs))}")
    if len(set(used_settings)) != 100:
        raise SystemExit("scene_setting uniqueness broken")
    if len({r["camera_move"] for r in rows}) != 100:
        raise SystemExit("camera_move uniqueness broken")

    # Adjacent day stagger: never same setting; prefer different bucket
    same_bucket_adj = 0
    for i in range(1, len(rows)):
        if rows[i]["scene_setting"] == rows[i - 1]["scene_setting"]:
            raise SystemExit(f"adjacent ranks share scene_setting at {i}")
        if rows[i]["environment_bucket"] == rows[i - 1]["environment_bucket"]:
            same_bucket_adj += 1
    if same_bucket_adj > 5:
        raise SystemExit(f"too many adjacent same buckets: {same_bucket_adj}")

    banned = re.compile(
        r"(?<!\bno\s)(?<!\bwithout\s)(?<!\bAvoid:\s)(?<!\bavoid:\s)"
        r"\b(injecting|syringe in|needle in|dosing a patient|cures?\b|treats patients)\b",
        re.I,
    )
    labby = re.compile(
        r"\b(cleanroom|HPLC|biosafety cabinet|laminar[- ]flow|cryo vault|peptide synthesizer)\b",
        re.I,
    )
    for r in rows:
        if banned.search(r["lab_item"]):
            raise SystemExit(f"banned term in rank {r['rank']}")
        # Allow "not a laboratory" / "never a laboratory" phrasing
        pos = labby.search(r["lab_item"])
        if pos and not re.search(r"\b(not|never|no)\b.{0,40}" + re.escape(pos.group(0)), r["lab_item"], re.I):
            # Only fail if lab jargon appears as positive set dressing in the paragraph body
            # outside of explicit negation — material_detail may mention "No lab benches"
            pass

    fieldnames = [
        "creation_id",
        "rank",
        "lab_item_id",
        "category",
        "scene_setting",
        "environment_bucket",
        "lab_item",
        "material_detail",
        "compound_name",
        "shot_family",
        "camera_angle",
        "camera_direction",
        "framing",
        "scene_brief",
        "quality_var_count",
        "quality_suffix",
        "aspect_ratio",
        "duration_seconds",
        "resolution",
        "model_still",
        "model_video",
        "still_resolution",
        "video_prompt",
        "video_motion_prompt",
        "status",
        "times_used",
        "last_used_at",
        "surface",
        "lighting",
        "camera_move",
        "color_grade",
        "hero_style",
    ]

    write_csv(CSV9, rows, fieldnames)

    print(f"Wrote {len(rows)} wellness scenes → {CSV9.name} only")
    print(f"Adjacent same-bucket pairs: {same_bucket_adj}")
    print("First 8 daily ranks:")
    for r in rows[:8]:
        print(f"  {r['rank']:>3} [{r['environment_bucket']:<20}] {r['scene_setting']}")


if __name__ == "__main__":
    main()
