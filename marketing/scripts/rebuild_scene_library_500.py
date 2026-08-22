#!/usr/bin/env python3
"""Replace Sheet 9 single-item stubs with 500 unique full-paragraph research scenes.

Each lab_item is a cinematic paragraph for Grok Imagine (still).
video_prompt + video_motion_prompt are rebuilt to match that scene.
Cameras stay unique (Phase C). FDA research-only; no people / needles / injection.
"""

from __future__ import annotations

import csv
import hashlib
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
LABELS = json.loads((ROOT / "compound-labels.json").read_text())["labels"]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from camera_recipes import build_unique_camera_sequence  # noqa: E402

QUALITY = (
    "ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, "
    "crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR"
)
NO_DOUBLES = (
    "ABSOLUTE RULE — NO DOUBLES ANYWHERE: never duplicate any object, prop, vial, bottle, instrument, "
    "notebook, glass, light fixture, or furniture. Never repeat, tile, stack, mirror-clone, or stencil "
    "the same text, label, amino-acid sequence, wall graphic, logo, diagram, or caption more than once. "
    "If text appears, it appears exactly once. No patterned repeating murals. No twin props. "
    "Reflections may exist but must not create a second readable copy of a label or a second hero object."
)
VIAL_CLOSURE = (
    "VIAL PACKAGING RULE (MANDATORY): When any vial appears it must match Palm Beach Vitality "
    "catalog packaging exactly: clear transparent glass multi-use injection vial; bright blue "
    "plastic flip-off cap seated on a brushed-silver aluminum crimp seal over a rubber septum "
    "(show the blue cap + silver crimp stack clearly); clean white wrap-around label; dark maroon "
    "stylized DNA double-helix logo centered at the top of the label; product name in large bold "
    "dark maroon sans-serif — the exact compound name only, printed once; a solid dark maroon "
    "horizontal bar with white dosage strength; black concentration line (mg/ml) under the bar; "
    "small black footer text exactly '10ml Sterile Multi-Use Vial'. Prefer a single vial hero on "
    "a clear acrylic or glass pedestal. NO amber-glass hero vials, NO gold caps, NO bare crimp "
    "without the blue flip-cap, NO twist-off or screw caps, NO blank/unbranded pharmacy vials, "
    "NO second vial, NO duplicate labels."
)
AVOID = (
    "Avoid: people, hands, faces, skin contact, needles, syringes, injection, medical procedures, "
    "lifestyle influencers, cardboard shipping boxes as hero, fake LAB codes, creation motifs, "
    "000/500 counters, surreal CGI orbs, watermarks, lower-third captions, scene titles printed in frame, "
    "hex IDs, continuity codes, gallery name plaques, burn-in text, subtitles, timecodes, "
    "duplicated text, tiled wall lettering, repeated peptide sequences, cloned props, "
    "amber hero vials, bare-crimp vials without blue flip-caps, twist-top vials, screw-cap vials, plastic twist closures. "
    "Do NOT render any prompt metadata as visible text in the image. "
    f"{NO_DOUBLES} {VIAL_CLOSURE}"
)
# Legal disclaimers belong in Buffer captions only — never in Grok/Seedance prompts
# (they burn into stills / labels). Keep visual safety rules in AVOID instead.
COMPLIANCE = (
    "No treatment, cure, dosage-for-humans, or clinical outcome claims as readable text in the image. "
    "Do not print research-use disclaimers, legal footnotes, or caption bars in the frame."
)

# ---------------------------------------------------------------------------
# Scene construction banks — combinatorial uniqueness × thematic richness
# ---------------------------------------------------------------------------

THEMES: list[tuple[str, str]] = [
    ("peptide_synthesis", "Peptide synthesis & solid-phase chemistry"),
    ("analytical_qc", "Analytical QC & identity confirmation"),
    ("sterile_cleanroom", "Sterile cleanroom & controlled environments"),
    ("cryo_cold_chain", "Cryostorage & cold-chain research logistics"),
    ("biotech_campus", "Biotech R&D campus interiors"),
    ("longevity_lab", "Longevity & cellular research suites"),
    ("wellness_innovation", "Health & wellness innovation studios"),
    ("formulation_suite", "Formulation & compounding research suites"),
    ("discovery_bench", "Discovery chemistry benches"),
    ("molecular_imaging", "Molecular imaging & microscopy cores"),
    ("sports_science", "Sports science & performance research labs"),
    ("palm_beach_showroom", "Palm Beach premium research showrooms"),
    ("archive_documentation", "Research documentation & standards archives"),
    ("pilot_scale", "Pilot-scale process development"),
    ("wellness_retail_lab", "Boutique wellness × lab hybrid spaces"),
]

SETTINGS = [
    "a Palm Beach waterfront biotech loft with floor-to-ceiling glass and ocean haze beyond",
    "a midnight R&D wing lit only by instrument status LEDs and under-cabinet task light",
    "a white-on-white ISO-class cleanroom corridor opening into a glowing work bay",
    "a walnut-and-steel executive science lounge overlooking a manicured courtyard",
    "a subterranean cryo vault with frosted stainless doors and vapor wisps",
    "a double-height atrium research atrium with floating mezzanine lab pods",
    "a coastal sunrise formulation suite catching warm Florida light on polished epoxy",
    "a blacked-out imaging core with a single illuminated stage as the hero light source",
    "a glass-walled pilot-scale process bay looking onto idle stainless skids",
    "a boutique wellness research boutique with museum pedestals and soft brass accents",
    "a high-throughput analytical bay lined with HPLC stacks and quiet solvent cabinets",
    "a peptide synthesis gallery with resin columns and nitrogen lines as architecture",
    "a sports-performance science lab with force-plate flooring and calibrated gear racks",
    "a longevity institute reading room meeting a wet-lab through a glass airlock",
    "a shipping-prep cold room with validated coolers staged like premium luggage",
    "a rooftop greenhouse annex connected to a cellular biology lab via glass bridge",
    "a concrete-and-glass brutalist lab wing softened by soft cove lighting",
    "a marble reception science gallery that transitions into a visible QC suite",
    "a modular container-lab village on a research campus at blue hour",
    "an amber-lit lyophilization corridor with freeze-dryer portholes like portholes on a ship",
    "a mezzanine peptide library with rolling ladders and sealed amber drawers",
    "a glass bridge connecting two R&D wings above a reflecting pool",
    "a charcoal-walled VIP research briefing room with a lit specimen niche",
    "a soft-pink wellness R&D studio cooled by clinical steel islands",
    "a hangar-scale fill-finish gallery with curtain dividers and glowing status boards",
    "a desert-modern lab exterior courtyard seen through tinted research glass",
    "a rain-soaked loading dock for validated cold-chain totes under sodium lamps",
    "a white cyclorama catalog studio temporarily dressed as a sterile prep bay",
    "a cedar sauna anteroom juxtaposed with a sealed research fridge behind glass",
    "a floating lab pod suspended in an atrium with cable trays as chandelier",
    "a QC war-room with blank monitors and a single illuminated chromatogram print",
    "a moonlit rooftop observatory deck adjacent to a molecular biology suite",
    "a boutique apothecary facade opening into a true GLP-style wet lab",
    "a kinetic sculpture of glass condensers in a discovery hallway",
    "a hush-quiet anechoic-style instrument room for ultra-sensitive balances",
    "a silent metrology room with granite tables and vibration-isolated instruments",
    "a wellness innovation kitchen-lab hybrid with stainless islands and research glassware",
    "a university-style teaching wet lab restaged as a premium catalog set",
    "a private-client research salon with velvet curtains framing a sterile prep alcove",
    "a data-rich control room overlooking a cleanroom through panoramic glass",
]

FOCALS = [
    "a constellation of crimped-seal rubber-septum injection research vials catching rim light on a reflective black plinth",
    "an open lyophilizer chamber revealing frost-kissed shelves with empty product trays",
    "a confocal microscope under a soft spotlight with fluorescence filters staged beside it",
    "a bank of peptide synthesizer modules with glowing status strips and tidy solvent lines",
    "a cascade of amber and clear borosilicate vessels holding vividly dyed research solutions",
    "a cryogenic dewar with rising vapor and a single labeled research cassette on the sill",
    "a precision analytical balance under a draft shield, blue LED breathing slowly",
    "a laminar-flow hood interior empty and ready, HEPA grille glowing cold blue-white",
    "a carousel of research pens on matte acrylic like jewelry, caps sealed",
    "stacked chromatography columns with jewel-toned solvent reservoirs in soft focus behind",
    "a mass-spec inlet detail with polished steel and quiet cable management",
    "a sterile pass-through window with UV indicator strips and interlocking door lights",
    "a single crimped-seal rubber-septum injection research vial on a clear acrylic pedestal as the quiet hero",
    "a wellness recovery lounge vignette: cold plunge edge in bokeh, research fridge in focus",
    "a formulation homogenizer mid-idle with a single beaker of pearlescent research emulsion",
    "an ultra-low freezer door cracked just enough to show frost lace on the gasket",
    "a digital temperature-logger orchestra clipped to validated cold packs in geometric array",
    "a stereo microscope on a boom arm hovering over a crystalline research powder dish",
    "a cleanroom garmenting antechamber with hanging coveralls and lit shoe racks — empty of people",
    "a glow of incubator windows stacked like a city skyline of cellular research",
    "a HPLC system face with solvent lines as intentional graphic design",
    "a marble console holding one premium research carton silhouette plus a clear crimped-seal rubber-septum injection vial hero",
    "a bioreactor sight-glass catching caustic highlights from a side practical light",
    "a wall of reference standards binders and sealed ampoules in museum-like niches",
    "a sports-science motion-capture volume empty, with calibration wand and peptide fridge aside",
    "a copper-peptide research tray with aqua solution under macro side light",
    "a NAD+ research display: luminous yellow-green solution in a sealed vessel on slate",
    "a dual-chamber metaphor avoided — instead one elegant multi-vial storyboard of crimped-seal rubber-septum injection vials on a rail",
    "a palm-shadow silhouette projected across a sterile bench at late afternoon",
    "a floating glass shelf of research powders in sealed jars, labeled for laboratory use only",
    "a helix-inspired shelving sculpture holding sealed research ampoules",
    "a glowing -80 freezer bank as a skyline of cold blue seals",
    "a single aluminum-crimped rubber-septum injection vial under a museum pin spot on travertine",
    "an open autoclave chamber with still-steaming empty racks",
    "a robotic liquid handler idle mid-deck with tips staged like a skyline",
    "a wall of nitrogen generators with braided stainless lines as art",
    "a crystal dish of lyophilized cake under a stereo microscope boom",
    "a wellness cold-plunge edge blurred behind a sharp research cooler hero",
    "a sequence of sealed research pouches on a chrome rail without clinical-use cues",
    "a powder-weighing enclosure with unused gauntlets hanging — chamber empty",
    "a chromatography fridge with amber bottles in perfect color order",
    "a peptide synthesizer touch panel glowing beside resin-filled columns",
    "a sterile isolator with empty glove ports and a lit interior chamber",
    "a tray of copper-peptide aqua standards under macro caustics",
    "a panoramic cleanroom view reflected in a polished vial shoulder",
]

MOODS = [
    "cinematic luxury-science energy — expensive, quiet, and slightly futuristic",
    "editorial National-Geographic-meets-pharma catalog tension",
    "warm coastal wellness optimism restrained by clinical precision",
    "noir laboratory drama with specular highlights and deep velvet shadows",
    "bright ISO-clean optimism with crisp whites and soft cyan instrument glows",
    "golden-hour discovery mood as if a breakthrough just happened off-camera",
    "midnight R&D intensity — status LEDs like constellation navigation",
    "spa-adjacent calm: soft diffusion, pale stone, and one sharp scientific hero",
    "high-fashion product direction applied to real lab hardware",
    "documentary truthfulness with museum lighting and honest material texture",
    "hyper-modern biotech campus brochure energy without feeling corporate-generic",
    "intimate macro world where textures become landscape",
]

ACTIONS = [
    "Compose as a vertical 9:16 hero still that could open a premium Instagram reel.",
    "Let architecture lead, then reward the eye with one unmistakable research focal point.",
    "Build depth with foreground glass, mid-ground hero, and soft background process glow.",
    "Use negative space generously so the scene breathes and never feels like a cluttered bench dump.",
    "Treat the environment as a character — the peptide research story is told by place, light, and material.",
    "Prioritize photoreal materials: glass weight, metal wear, frost, epoxy sheen, fabric sterile blues.",
    "Make the still exciting enough that a slow camera move will feel like entering a world, not inspecting a SKU.",
    "Keep every readable label sparse; if a compound name appears it must be exact and research-only.",
]

TWISTS = [
    "A faint ocean reflection ghosts across a glass partition.",
    "Condensation beads map a perfect gradient down a cold vial shoulder.",
    "Instrument LEDs pulse out of sync like a living heartbeat of the lab.",
    "A single shaft of sunrise cuts a diagonal across otherwise clinical white.",
    "Vapor from a dewar curls into a soft ribbon then vanishes.",
    "Polished black acrylic gives a soft reflection without cloning a second hero object.",
    "HEPA airflow is implied by a barely visible tissue-stream indicator.",
    "A soft abstract wall wash with no readable lettering or repeated motifs.",
    "Brass and stainless share the frame — wellness luxury meeting laboratory steel.",
    "Color-blocked solvent bottles create a deliberate Pantone story behind the hero.",
    "Frost blooms into fern-like crystals on a freezer window port.",
    "A mezzanine railing frames the scene like an architecture photograph.",
    "Soft bokeh of city lights beyond the lab glass reminds you this is coastal biotech.",
    "A calibration card leans just out of focus — honesty over CGI perfection.",
    "Shadow play from a palm frond lands across the bench without breaking sterility cues.",
    "The floor epoxy has a subtle marble swirl catching a rim light streak.",
    "Nested glass doors create recursive reflections of the same hero object.",
    "A silent alarm tower glows green — all systems nominal, nobody present.",
    "Macro dust motes hang in a projector beam like scientific glitter.",
    "A research notebook lies closed; the story is visual, not textual.",
    "Rain streaks the exterior glass while the interior stays surgically dry.",
    "A red 'AUTHORIZED PERSONNEL' light is off — the room waits in standby elegance.",
    "Tiny QR stickers are deliberately unreadable; brand story is visual not textual spam.",
    "A floating shelf casts a hard shadow that slices the composition into thirds.",
    "Solvent fumes are absent; instead you smell nothing — pure visual sterile fantasy.",
    "A rack of pipette tips becomes a geometric sculpture in shallow depth of field.",
    "Chrome legs of an anti-vibration table draw leading lines toward the hero.",
    "A wellness smoothie bar is visible through glass but stays soft background only.",
    "Infrared cabinet glass shows a faint ghost reflection of the vial hero.",
    "Cable management is immaculate — luxury expressed as engineering discipline.",
]

# Alternate paragraph openings so scenes don't share the same cadence
OPENERS = [
    "Wide establishing energy:",
    "Intimate cinematic entry:",
    "Architectural reveal:",
    "Macro-world portal:",
    "After-hours R&D atmosphere:",
    "Coastal biotech brochure frame:",
    "Quiet luxury-science tableau:",
    "Process-gallery spectacle:",
    "Wellness-meets-lab hybrid:",
    "Discovery-morning clarity:",
]

BEATS = [
    "a slow sense of discovery in the empty room",
    "the hush of validated equipment between runs",
    "a showroom-ready stillness that still feels operational",
    "the tension between wellness softness and lab rigor",
    "an almost theatrical reveal of research craftsmanship",
    "quiet prosperity — science as coastal luxury infrastructure",
    "the feeling that a breakthrough is minutes away off-frame",
    "premium calm: every object placed with intentional design",
    "industrial poetry — pipes and glass as modern sculpture",
    "client-facing wonder without tipping into medical theater",
]

SURFACES = [
    "polished black reflective acrylic",
    "white epoxy resin lab flooring with soft sheen",
    "brushed stainless steel bench with micro-scratch realism",
    "warm walnut console meeting clinical white laminate",
    "frosted glass pedestal over charcoal stone",
    "matte concrete with sealed satin finish",
    "pale limestone tile with wellness-spa undertone",
    "mirrored chrome instrument deck",
    "soft gray cleanroom vinyl with anti-static texture",
    "honed marble with cool gray veining",
]

LIGHTINGS = [
    "low-key cinematic spotlight with velvet falloff",
    "bright clinical cove lighting plus cool instrument practicals",
    "golden coastal window light mixed with white LED task lamps",
    "blue-hour exterior wash through glass with warm interior pools",
    "soft spa diffusion plus one hard scientific key light",
    "noir side light with controlled speculars on glass and metal",
    "museum track lighting with narrow beams on pedestals",
    "under-cabinet ribbon light and dark ceiling void",
    "fluorescence-inspired cyan accent without neon cartoon glow",
    "sunrise rim light cutting across frost and steel",
]

COLOR_GRADES = [
    "neutral color-true pharmaceutical catalog grade with rich contrast",
    "cool cyan-steel biotech grade with warm skin-tone-free neutrals",
    "warm coastal wellness grade restrained by clinical whites",
    "high-contrast noir science grade with deep blacks",
    "soft pastel wellness grade anchored by honest metal textures",
    "HDR crisp instrument grade, slightly cool, magazine-ready",
]

HERO_STYLES = [
    "cinematic research-world establishing shot",
    "editorial science-magazine cover energy",
    "luxury wellness × laboratory hybrid direction",
    "architecture-forward biotech campus still",
    "macro-to-environment storytelling frame",
    "premium catalog spectacle — environment first",
]

CATEGORY_FOR_THEME = {
    "peptide_synthesis": "peptide_synthesis",
    "analytical_qc": "analytical_qc",
    "sterile_cleanroom": "sterile_cleanroom",
    "cryo_cold_chain": "cryo_cold_chain",
    "biotech_campus": "biotech_campus",
    "longevity_lab": "longevity_lab",
    "wellness_innovation": "wellness_innovation",
    "formulation_suite": "formulation_suite",
    "discovery_bench": "discovery_bench",
    "molecular_imaging": "molecular_imaging",
    "sports_science": "sports_science",
    "palm_beach_showroom": "palm_beach_showroom",
    "archive_documentation": "archive_documentation",
    "pilot_scale": "pilot_scale",
    "wellness_retail_lab": "wellness_retail_lab",
}


def _pick(seq: list, i: int, salt: int = 0):
    """Stable but well-mixed picker — avoids small-bank pair lockstep."""
    h = int(hashlib.sha1(f"{i}|{salt}|{len(seq)}".encode()).hexdigest(), 16)
    return seq[h % len(seq)]


def build_scene(rank: int, compound: str) -> dict:
    """Build one unique full-paragraph scene for 1-indexed rank."""
    i = rank - 1
    # Coprime stride so all themes appear and neighbors rarely match
    theme_key, theme_title = THEMES[(i * 7) % len(THEMES)]

    setting = _pick(SETTINGS, i, 1)
    focal = _pick(FOCALS, i, 2)
    mood = _pick(MOODS, i, 3)
    action = _pick(ACTIONS, i, 4)
    twist = _pick(TWISTS, i, 5)
    surface = _pick(SURFACES, i, 6)
    lighting = _pick(LIGHTINGS, i, 7)
    color_grade = _pick(COLOR_GRADES, i, 8)
    hero_style = _pick(HERO_STYLES, i, 9)

    # Uniqueness comes from combination of banks — never put hex/ID tokens in the prompt
    # (Grok Imagine often burns "continuity code" / gallery names into the still).
    beat = BEATS[i % len(BEATS)]
    opener = OPENERS[i % len(OPENERS)]

    label_sentence = ""
    if compound:
        label_sentence = (
            f" If any vial, pen, carton panel, or pedestal plaque shows a product name, "
            f"it must read exactly '{compound}' only — never invent other compound names, "
            f"and never add research-use disclaimer lines on the label. "
            f"Do not print scene titles, gallery names, hex codes, captions, or legal footnotes anywhere in frame."
        )
    else:
        label_sentence = (
            " Do not print scene titles, gallery names, hex codes, watermarks, or captions anywhere in frame."
        )

    no_burn = (
        " Absolutely no burn-in text, lower thirds, watermarks, or readable signage except an optional "
        "exact research compound label printed once only. "
        "NO DOUBLES: never tile, stack, or repeat any text, amino sequence, diagram, or prop."
    )

    # Rotate paragraph structure by rank for cadence diversity
    structure = i % 4
    if structure == 0:
        paragraph = (
            f"{opener} {theme_title}. Inside {setting}, the frame discovers {focal}. "
            f"The mood is {mood}, carried by {beat}. {twist} "
            f"Everything sits on {surface} under {lighting}, materials behaving like physics not CGI. "
            f"{action} Palm Beach Vitality research-world storytelling for peptides, R&D, and the "
            f"health-and-wellness industry — exciting, premium, laboratory-true. "
            f"Empty of people; no clinical procedure staging.{label_sentence}{no_burn}"
        )
    elif structure == 1:
        paragraph = (
            f"{theme_title}. {opener} Inside {setting}, "
            f"a vertical 9:16 world builds around {focal}. "
            f"{twist} Mood: {mood}. Emotional undercurrent: {beat}. "
            f"Ground the image on {surface} with {lighting}. {action} "
            f"This is not a single boring SKU — it is an industry scene spanning labs, peptide science, "
            f"and wellness innovation for Palm Beach Vitality. "
            f"Keep the space unoccupied by people or procedure props.{label_sentence}{no_burn}"
        )
    elif structure == 2:
        paragraph = (
            f"{opener} {theme_title}. Start with atmosphere: {mood}. "
            f"Place the story inside {setting}, then lock focus on {focal}. "
            f"{twist} Surface language is {surface}; light language is {lighting}; "
            f"the room feels like {beat}. {action} "
            f"Sell the fantasy of serious peptide research and modern wellness infrastructure "
            f"without medical claims or human subjects. "
            f"Photoreal only.{label_sentence}{no_burn}"
        )
    else:
        paragraph = (
            f"A full {theme_title.lower()} experience. "
            f"Location — {setting}. Hero cluster — {focal}. "
            f"Then layer {twist[:-1] if twist.endswith('.') else twist}, "
            f"because tiny specifics make Grok commit to a unique still. "
            f"Mood is {mood}; pacing is {beat}. Stage on {surface}, lit by {lighting}. "
            f"{action} Brand world: Palm Beach Vitality × labs × peptides × R&D × health & wellness. "
            f"No occupants, no procedure theater.{label_sentence}{no_burn}"
        )

    # Secondary detail channel for prompts — never include hex/ID tokens
    material_detail = (
        f"Environment cues: {theme_title.lower()}; focal — {focal}; "
        f"surface {surface}; lighting {lighting}; twist — {twist} "
        f"Keep the scene photoreal and vertically composed. "
        f"No watermarks, captions, scene titles, or codes burned into the frame."
    )

    scene_brief = (
        f"{theme_key.replace('_', ' ')} · {focal[:48]}… · {mood.split('—')[0].strip()}"
    )

    return {
        "category": CATEGORY_FOR_THEME[theme_key],
        "lab_item": paragraph,
        "material_detail": material_detail,
        "compound_name": compound,
        "surface": surface,
        "lighting": lighting,
        "color_grade": color_grade,
        "hero_style": hero_style,
        "scene_brief_seed": scene_brief,
        "theme_title": theme_title,
    }


def rebuild_still_prompt(row: dict, shot: dict) -> str:
    scene = row["lab_item"]
    detail = row.get("material_detail") or ""
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
        f"Photoreal vertical 9:16 Palm Beach Vitality cinematic research still. "
        f"Create an exciting, unique laboratory / peptide R&D / health-and-wellness "
        f"industry environment scene that still contains exactly ONE product hero only "
        f"(never two vials, never two pens, never a product pair). "
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
        f"Compose for spectacle and depth — environment-forward storytelling. "
        f"{AVOID} "
        f"Quality: {QUALITY}. "
        f"{COMPLIANCE}"
    )


def rebuild_motion_prompt(row: dict, shot: dict) -> str:
    """Short I2V motion prompt — full scene lives in the still, not here."""
    import re

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
    move = ascii(shot.get("camera_move") or "slow push-in")[:160]
    prompt = (
        f"Slow cinematic camera: {move}. "
        f"Shot {ascii(shot.get('shot_family') or 'push_in')}, "
        f"angle {ascii(shot.get('camera_angle') or 'eye-level')}, "
        f"direction {ascii(shot.get('camera_direction') or 'forward')}. "
        f"Keep the exact same laboratory research scene, materials, and lighting. "
        f"No orbit. No new objects. No duplicate props. No repeated text or graphics. "
        f"No people, hands, faces, needles, watermarks, burn-in, or on-screen disclaimers."
    )
    if compound:
        prompt += f" Keep label '{compound}' unchanged if visible, once only."
    return ascii(prompt)


def rebuild_scene_brief(row: dict, shot: dict) -> str:
    seed = row.get("scene_brief_seed") or row["category"]
    parts = [
        seed,
        f"shot:{shot['shot_family']}",
        f"angle:{shot['camera_angle']}",
        f"dir:{shot['camera_direction']}",
    ]
    compound = (row.get("compound_name") or "").strip()
    if compound:
        parts.append(f"label:{compound}")
    parts.append(shot["camera_move"][:80])
    return " · ".join(parts)


def assign_compound(rank: int) -> str:
    """Most scenes get a compound for label consistency; some ambient scenes stay unlabeled."""
    # ~1 in 8 unlabeled architectural/wellness atmosphere scenes
    if rank % 8 == 0:
        return ""
    return LABELS[(rank - 1) % len(LABELS)]


def main() -> None:
    with CSV9.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 500:
        raise SystemExit(f"expected 500 rows, got {len(rows)}")

    rows.sort(key=lambda r: int(r["rank"]))
    cams = build_unique_camera_sequence(500)

    paragraphs: list[str] = []
    for row, shot in zip(rows, cams):
        rank = int(row["rank"])
        compound = assign_compound(rank)
        scene = build_scene(rank, compound)

        row["category"] = scene["category"]
        row["lab_item"] = scene["lab_item"]
        row["material_detail"] = scene["material_detail"]
        row["compound_name"] = scene["compound_name"]
        row["surface"] = scene["surface"]
        row["lighting"] = scene["lighting"]
        row["color_grade"] = scene["color_grade"]
        row["hero_style"] = scene["hero_style"]
        row["scene_brief_seed"] = scene["scene_brief_seed"]

        row["shot_family"] = shot["shot_family"]
        row["camera_angle"] = shot["camera_angle"]
        row["camera_direction"] = shot["camera_direction"]
        row["framing"] = shot["framing"]
        row["camera_move"] = shot["camera_move"]

        # duration/resolution stay production defaults
        row["duration_seconds"] = row.get("duration_seconds") or "15"
        row["resolution"] = row.get("resolution") or "1080p"
        row["still_resolution"] = row.get("still_resolution") or "2k"
        row["aspect_ratio"] = row.get("aspect_ratio") or "9:16"
        row["status"] = row.get("status") or "Active"

        energy = shot.get("energy") or "controlled premium cinematic motion"
        shot_with_energy = {**shot, "energy": energy}
        row["video_prompt"] = rebuild_still_prompt(row, shot_with_energy)
        row["video_motion_prompt"] = rebuild_motion_prompt(row, shot_with_energy)
        row["scene_brief"] = rebuild_scene_brief(row, shot_with_energy)
        paragraphs.append(row["lab_item"])

        # cleanup helper key
        row.pop("scene_brief_seed", None)

    # Uniqueness audits
    if len(set(paragraphs)) != 500:
        raise SystemExit(
            f"duplicate lab_item paragraphs: {500 - len(set(paragraphs))} collisions"
        )
    short = [p for p in paragraphs if len(p) < 280]
    if short:
        raise SystemExit(f"{len(short)} paragraphs too short (<280 chars)")
    # first 80 chars uniqueness (opening should vary)
    heads = [p[:100] for p in paragraphs]
    if len(set(heads)) < 400:
        print(f"WARN: only {len(set(heads))} unique 100-char openings")

    # camera uniqueness
    if len({r["camera_move"] for r in rows}) != 500:
        raise SystemExit("camera_move uniqueness broken")

    # banned positive medical-procedure staging (allow "no injection" style negatives in AVOID)
    banned = re.compile(
        r"(?<!\bno\s)(?<!\bwithout\s)(?<!\bavoid:\s)(?<!\bAvoid:\s)"
        r"\b(injecting|syringe in|needle in|dosing a patient|cures?\b|treats patients)\b",
        re.I,
    )
    for r in rows:
        if banned.search(r["lab_item"]):
            raise SystemExit(f"banned term in lab_item rank {r['rank']}: {r['lab_item'][:120]}")

    preferred = [
        "creation_id",
        "rank",
        "lab_item_id",
        "category",
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
    for c in rows[0].keys():
        if c not in preferred:
            preferred.append(c)

    for path in (CSV9, CSV9_250):
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=preferred, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"Wrote {path}")

    JSON9.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {JSON9}")

    # Sync sheet 8 master (id, category, lab_item, material_detail, compound, surface, lighting, etc.)
    if CSV8.exists():
        with CSV8.open(newline="", encoding="utf-8") as f:
            items = list(csv.DictReader(f))
        by_id = {r["lab_item_id"]: r for r in rows}
        for it in items:
            src = by_id.get(it["lab_item_id"])
            if not src:
                continue
            for k in (
                "category",
                "lab_item",
                "material_detail",
                "compound_name",
                "surface",
                "lighting",
                "color_grade",
                "hero_style",
                "camera_move",
                "shot_family",
            ):
                if k in it or k in src:
                    it[k] = src.get(k, it.get(k, ""))
        fields = list(items[0].keys())
        for path in (CSV8, CSV8_250):
            with path.open("w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
                w.writeheader()
                w.writerows(items)
            print(f"Wrote {path}")
        JSON8.write_text(
            json.dumps({"count": len(items), "items": items}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {JSON8}")

    # Report
    cats = {}
    for r in rows:
        cats[r["category"]] = cats.get(r["category"], 0) + 1
    print("category mix:", dict(sorted(cats.items())))
    print("avg lab_item chars:", sum(len(p) for p in paragraphs) // 500)
    print("sample rank1:\n", rows[0]["lab_item"][:500], "…")
    print("sample rank2 category:", rows[1]["category"])
    print("motion starts:", rows[0]["video_motion_prompt"][:180], "…")
    print("PASS: 500 unique full-paragraph scenes")


if __name__ == "__main__":
    main()
