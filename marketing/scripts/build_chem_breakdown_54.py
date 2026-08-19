#!/usr/bin/env python3
"""Build a NEW Sheet-9-format library for chemical-breakdown vids.

Does NOT modify 9-lab-item-creations-500.csv.
Output: marketing/sheets/13-chem-breakdown-54.csv
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sheets" / "13-chem-breakdown-54.csv"

FIELDS = [
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
    "still_edit_prompt",
    "status",
    "times_used",
    "last_used_at",
    "surface",
    "lighting",
    "camera_move",
    "color_grade",
    "hero_style",
]

QUALITY = (
    "cinematic 3D medical animation of a cellular chemical reaction, photoreal, 8k, HDR, "
    "living cells plus amino acids reacting at microscopic scale, "
    "no vials, no pens, no people, no product studio, no readable text, no logos"
)

STILL_EDIT = (
    "CRITICAL VIBE FIX: This must be an IN-PROGRESS cellular chemical reaction, not a catalog product still. "
    "Replace any sunlit studio, white cyclorama, glass pedestal, spa, or floating lone molecule on a stand "
    "with a DARK microscopic living-cell scene: lipid-bilayer cell membrane, cytoplasm, amino-acid "
    "ball-and-stick monomers colliding and forming peptide bonds with energy flashes. "
    "DELETE every logo, palm tree, watermark, URL, caption, letter, number, and label. "
    "BLANK frame — no typography anywhere. No vials, no pens, no people. Do not restyle into a cartoon. "
    "Keep the row's SURFACE, LIGHTING, COLOR GRADE, and CAMERA MOVE."
)

COMPOUNDS = [
    ("P-5A1MQ-001", "5-Amino-1MQ", "compact small-molecule with warm amber carbon spheres and cool gray heteroatoms"),
    ("P-AOD-001", "AOD-9604", "short peptide ribbon in pale gold with silver side-chain beads"),
    ("P-BPC-001", "BPC-157", "translucent pink-violet peptide ball-and-stick chain, glass-like atoms"),
    ("P-BPCTB-001", "BPC-157/TB-500", "two complementary peptide ribbons — pink and teal — fused as ONE linked complex, not two separate heroes"),
    ("P-CAGRI-001", "Cagrilinitide", "long helical peptide in soft coral with metallic backbone"),
    ("P-CJC-001", "CJC", "neat helical peptide in champagne gold"),
    ("P-CJCIPA-001", "CJC (no DAC)/Ipamorelin", "paired helices as ONE stacked complex in gold and ice-blue"),
    ("P-DSIP-001", "DSIP", "compact sleep-research peptide in dusk lavender"),
    ("P-GHK-001", "GHK-Cu", "copper-blue tripeptide complex with a single copper center glow"),
    ("P-GLOW-001", "GLOW", "bright cyan-blue peptide blend, luminous but photoreal glass atoms"),
    ("P-KLOW-001", "KLOW", "warm copper-gold peptide blend with a single copper accent"),
    ("P-KPV-001", "KPV", "short tripeptide in clean white-opal with rose-gold bonds"),
    ("P-MT2-001", "Melanotan 2", "cyclic peptide in bronze and deep rose"),
    ("P-MOTS-001", "MOTS-C", "compact mitochondrial peptide in sunlit gold"),
    ("P-NAD-001", "NAD+", "classic dinucleotide: two rings, amber-gold phosphates, photoreal"),
    ("P-PT141-001", "PT-141", "cyclic peptide in wine-rose with silver bonds"),
    ("P-RETA-001", "Retatrutide", "large multi-agonist peptide in peach and champagne"),
    ("P-SEL-001", "Selank", "short neat peptide in cool mint glass"),
    ("P-SEMA-001", "Semaglutide", "long lipidated peptide in coral with a single lipid tail"),
    ("P-SEMAX-001", "SEMAX", "short peptide in electric-sky blue glass"),
    ("P-SERM-001", "Sermorelin", "growth-research peptide helix in pale platinum"),
    ("P-SS31-001", "SS-31", "mitochondrial peptide in teal and gold"),
    ("P-TA1-001", "TA-1", "immune-research peptide ribbon in ivory and bronze"),
    ("P-TB500-001", "TB-500", "actin-research peptide in ocean teal ball-and-stick"),
    ("P-TESA-001", "Tesamorelin", "long helical peptide in champagne with soft speculars"),
    ("P-TESAIPA-001", "Tesamorelin/Ipamorelin", "two helices as ONE stacked complex, champagne plus ice-blue"),
    ("P-TIRZ-001", "Tirzepatide", "dual-agonist peptide in warm terracotta and gold"),
]

# 6 values each. Rank i uses offsets so consecutive days never repeat
# shot_family, camera_move, surface, lighting, or color_grade.
SHOTS = [
    {
        "shot_family": "push_in",
        "camera_angle": "eye-level",
        "camera_direction": "forward",
        "framing": "9:16, reaction plane mid-frame, finishes closer, shallow DOF",
        "camera_move": "slow push-in as amino acids dock and peptide bonds flash, then hold",
    },
    {
        "shot_family": "pull_back",
        "camera_angle": "slight-high",
        "camera_direction": "backward",
        "framing": "9:16, starts tight on a forming bond, reveals the full cell",
        "camera_move": "slow pull-back from a flashing peptide bond to the whole living cell, then hold",
    },
    {
        "shot_family": "vertical_rise",
        "camera_angle": "slight-low",
        "camera_direction": "up",
        "framing": "9:16, starts at the lower membrane, rises along the reaction",
        "camera_move": "slow vertical rise along the bilayer as amino acids lock into the chain, then hold",
    },
    {
        "shot_family": "lateral_drift",
        "camera_angle": "three-quarter-left",
        "camera_direction": "left to right",
        "framing": "9:16, slides along the membrane edge, reaction stays sharp",
        "camera_move": "slow lateral drift along the membrane as monomers collide and bonds flash, then hold",
    },
    {
        "shot_family": "macro_detail",
        "camera_angle": "macro-plane",
        "camera_direction": "micro-push",
        "framing": "9:16, extreme close on two amino acids forming a peptide bond",
        "camera_move": "creeping macro push onto the bond-forming atoms with a single energy flash, then hold",
    },
    {
        "shot_family": "static_lock",
        "camera_angle": "low-angle",
        "camera_direction": "no travel / locked",
        "framing": "9:16, locked volume, peptide chain growing in place, shallow DOF",
        "camera_move": "locked tripod, amino acids stream in and lock onto the growing chain with bond flashes",
    },
]

SURFACES = [
    {
        "surface": "living cell lipid bilayer, wet receptors, extracellular fluid",
        "category": "chem_membrane",
        "lab_item": "Chemical breakdown — amino-acid reaction at the cell membrane",
        "hero_style": "membrane docking — amino acids assembling a peptide at a living cell",
        "env": (
            "DARK cinematic 3D medical animation at the OUTER membrane of a living cell. "
            "Lipid-bilayer, wet receptors, extracellular fluid. Amino-acid monomers swarm, dock, "
            "and form peptide bonds with energy flashes. A forming chain grows at a receptor. "
            "NOT a photography studio. NOT a white cyclorama. NOT a glass pedestal."
        ),
    },
    {
        "surface": "cytoplasm among organelles, ribosome-like machinery, wet protein mesh",
        "category": "chem_cytosol",
        "lab_item": "Chemical breakdown — intracellular amino-acid condensation",
        "hero_style": "cytosol condensation — amino acids locking into a peptide chain",
        "env": (
            "DARK cinematic 3D medical animation INSIDE a living cell. Cytoplasm, organelle silhouettes, "
            "wet protein mesh. Amino-acid monomers stream toward a growing peptide and condense — "
            "each new bond a sharp chemical flash. Nucleus or mitochondrion in bokeh. "
            "NOT a sunlit showroom. NOT a product catalog set. NOT a glass pedestal."
        ),
    },
    {
        "surface": "mitochondrial inner membrane, cristae folds, dense matrix",
        "category": "chem_mito",
        "lab_item": "Chemical breakdown — mitochondrial-membrane peptide assembly",
        "hero_style": "cristae reaction — amino acids assembling along inner membrane folds",
        "env": (
            "DARK cinematic 3D medical animation at a mitochondrion. Cristae folds, dense matrix, "
            "inner membrane. Amino acids collide along the membrane and form peptide bonds with "
            "brief energy flashes. Living-cell chemistry, not a catalog still. "
            "NOT a photography studio. NOT a glass pedestal."
        ),
    },
    {
        "surface": "nuclear envelope pore, chromatin bokeh, nucleoplasm edge",
        "category": "chem_nucleus",
        "lab_item": "Chemical breakdown — nuclear-envelope peptide reaction",
        "hero_style": "nuclear-pore reaction — amino acids assembling at the envelope edge",
        "env": (
            "DARK cinematic 3D medical animation at the nuclear envelope. A nuclear pore, chromatin "
            "bokeh, nucleoplasm edge. Amino-acid monomers gather at the pore and form peptide bonds "
            "with wispy electron-cloud filaments. NOT a spa. NOT a white cyclorama. NOT a glass pedestal."
        ),
    },
    {
        "surface": "endoplasmic reticulum cisternae, ribosome-studded membrane",
        "category": "chem_er",
        "lab_item": "Chemical breakdown — ER-membrane peptide condensation",
        "hero_style": "ER cisternae reaction — amino acids condensing on a ribosome-studded membrane",
        "env": (
            "DARK cinematic 3D medical animation on endoplasmic reticulum. Stacked cisternae, "
            "ribosome-studded membrane. Amino acids condense into a growing peptide along the ER "
            "surface with bond flashes. Active reaction, not a floating molecule. "
            "NOT a sunlit studio. NOT a glass pedestal."
        ),
    },
    {
        "surface": "vesicle docking field, cytosolic haze, membrane fusion sites",
        "category": "chem_vesicle",
        "lab_item": "Chemical breakdown — vesicle-docking peptide reaction",
        "hero_style": "vesicle-field reaction — amino acids assembling at docking sites",
        "env": (
            "DARK cinematic 3D medical animation in a vesicle docking field. Cytosolic haze, "
            "membrane fusion sites. Amino-acid monomers cluster at a docking patch and form peptide "
            "bonds with energy flashes. Living-cell chemistry. "
            "NOT a product stand. NOT a white cyclorama. NOT a glass pedestal."
        ),
    },
]

LIGHTINGS = [
    "dramatic subsurface glow from cytoplasm; reaction sparks at forming bonds",
    "backlit cytoplasmic bloom plus hard spec on reacting amino-acid atoms",
    "low-key rim light along the membrane; bond flashes as the only key",
    "volumetric caustic shafts through translucent cytoplasm",
    "cool bioluminescent fill with a warm flash at each peptide bond",
    "dark-field microscope look: near-black surround, luminous atoms",
]

COLOR_GRADES = [
    "cool microscopic medical grade, luminous amino acids vs navy cell",
    "high-contrast intracellular biotech: luminous bonds vs deep navy cytoplasm",
    "teal-and-gold mitochondrial grade, warm bond sparks",
    "violet-cyan night-lab grade, ice-blue amino acids",
    "emerald cytosol grade, rose-gold peptide bonds",
    "copper-amber organelle grade, cool cyan highlights",
]


def look_for_rank(rank: int) -> dict:
    """1-based rank. Offsets keep adjacent days from sharing any of the 5 look columns."""
    i = rank - 1
    shot = SHOTS[i % 6]
    surface = SURFACES[(i + 1) % 6]
    lighting = LIGHTINGS[(i + 2) % 6]
    color_grade = COLOR_GRADES[(i + 3) % 6]
    return {
        **shot,
        **surface,
        "lighting": lighting,
        "color_grade": color_grade,
    }


def molecule_lock(name: str) -> str:
    return (
        f"HARD OUTPUT LOCK: a cellular-level CHEMICAL REACTION featuring the peptide '{name}'. "
        "Show living cells AND amino acids actually reacting (bonds forming, docking, condensation). "
        "Cinematic photoreal 3D medical animation — not cartoon, not sketch, not product photography. "
        "NO TEXT anywhere: no letters, numbers, captions, titles, compound-name overlay, labels. "
        "NO LOGO, NO palm tree, NO watermark, NO URL, NO brand mark. "
        "No vial, no pen, no syringe, no people, no packaging. "
        f"Use '{name}' only as the unseen scientific subject — never render it as readable type."
    )


def closing_lock() -> str:
    return (
        " FINAL CHECK: this is a living-cell chemical reaction with amino acids, not a studio product shot. "
        "Zero typography. Zero logos. No vials. No pens."
    )


def video_prompt(name: str, look: dict, mol: str) -> str:
    lock = molecule_lock(name)
    body = (
        f"Vertical 9:16 chemical-reaction still — DARK microscopic cellular animation. "
        f"{look['env']} "
        f"SURFACE: {look['surface']}. "
        f"LIGHTING: {look['lighting']}. "
        f"COLOR GRADE: {look['color_grade']}. "
        f"SHOT FAMILY: {look['shot_family']}. CAMERA MOVE: {look['camera_move']}. "
        f"REACTION SUBJECT (visual only, never as text): {mol}. "
        "Amino acids are glossy translucent colored glass spheres with metallic bonds; "
        "the forming peptide matches that look as monomers lock together. "
        "Shallow depth of field, cinematic macro lens, tack-sharp reaction plane, dark cellular bokeh. "
        "FORBIDDEN scenery: white cyclorama, sunlit photography studio, frosted optical-glass pedestal, "
        "spa, lifestyle interior, windows, palm-frond wall shadows, product stands. "
        "FORBIDDEN overlays: any readable text, any logo, any URL, any palm watermark, any caption. "
        "No product packaging. No research-use disclaimer. No medical claims in frame."
    )
    return f"{lock} {body}{closing_lock()}"


def motion(name: str, look: dict) -> str:
    return (
        "Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. "
        f"Camera: {look['camera_move']}. "
        "Keep the same living-cell environment and lighting. "
        "Continue the chemical reaction: amino acids drift in, collide, peptide bonds form with "
        "energy flashes, the cell membrane / cytoplasm undulates. "
        "Do not cut to a studio or pedestal. No vials, people, needles. "
        "NO text appears. NO logos appear. NO captions. Completely blank of typography."
    )


def brief(name: str, look: dict, mol: str) -> str:
    return (
        f"chem reaction · {name} · {mol} · {look['env'][:160]}… "
        f"shot:{look['shot_family']} · {look['camera_angle']} · {look['surface'][:48]} · no text · no logo"
    )


# Visual stagger: family members (BPC / TB / blend) stay far apart.
STAGGER_ROUND_A = [
    "BPC-157",
    "Retatrutide",
    "GHK-Cu",
    "NAD+",
    "Semaglutide",
    "GLOW",
    "Sermorelin",
    "PT-141",
    "Tirzepatide",
    "MOTS-C",
    "Selank",
    "TB-500",
    "5-Amino-1MQ",
    "Tesamorelin",
    "KPV",
    "CJC",
    "Melanotan 2",
    "SS-31",
    "AOD-9604",
    "BPC-157/TB-500",
    "SEMAX",
    "KLOW",
    "Cagrilinitide",
    "TA-1",
    "DSIP",
    "Tesamorelin/Ipamorelin",
    "CJC (no DAC)/Ipamorelin",
]

MIN_UNIQUE_WINDOW = 5


def related_family(name: str) -> str:
    if name in ("BPC-157", "BPC-157/TB-500", "TB-500"):
        return "bpc_tb"
    if name in ("CJC", "CJC (no DAC)/Ipamorelin"):
        return "cjc"
    if name in ("Tesamorelin", "Tesamorelin/Ipamorelin"):
        return "tesa"
    if name in ("GLOW", "KLOW"):
        return "glow_klow"
    return name


def window_ok(names: list[str], window: int = MIN_UNIQUE_WINDOW) -> bool:
    for i in range(len(names)):
        chunk = names[i : i + window]
        if len(chunk) < 2:
            continue
        if len(set(chunk)) != len(chunk):
            return False
    return True


def rotate_until_ok(round_a: list[str], offset: int) -> list[str]:
    n = len(round_a)
    for extra in range(n):
        rot = (offset + extra) % n
        round_b = round_a[rot:] + round_a[:rot]
        seq = round_a + round_b
        # also check wrap from last rows back to first (if someone loops the sheet)
        wrap = seq + round_a[:MIN_UNIQUE_WINDOW]
        if window_ok(seq) and window_ok(wrap):
            return round_b
    raise SystemExit("could not stagger round B")


def make_row(rank: int, cid: str, name: str, mol: str, look: dict) -> dict:
    return {
        "creation_id": f"PBVita-Chem-{rank:03d}",
        "rank": rank,
        "lab_item_id": f"CHEM-{rank:03d}",
        "category": look["category"],
        "lab_item": look["lab_item"],
        "material_detail": mol,
        "compound_name": name,
        "shot_family": look["shot_family"],
        "camera_angle": look["camera_angle"],
        "camera_direction": look["camera_direction"],
        "framing": look["framing"],
        "scene_brief": brief(name, look, mol),
        "quality_var_count": 6,
        "quality_suffix": QUALITY,
        "aspect_ratio": "9:16",
        "duration_seconds": 15,
        "resolution": "1080p",
        "model_still": "grok-imagine-image-2.0",
        "model_video": "grok-imagine-video-1.5",
        "still_resolution": "2k",
        "video_prompt": video_prompt(name, look, mol),
        "video_motion_prompt": motion(name, look),
        "still_edit_prompt": STILL_EDIT,
        "status": "Active",
        "times_used": 0,
        "last_used_at": "",
        "surface": look["surface"],
        "lighting": look["lighting"],
        "camera_move": look["camera_move"],
        "color_grade": look["color_grade"],
        "hero_style": look["hero_style"],
    }


def main() -> None:
    by_name = {name: (cid, mol) for cid, name, mol in COMPOUNDS}
    missing = [n for n in STAGGER_ROUND_A if n not in by_name]
    extra = [n for n in by_name if n not in STAGGER_ROUND_A]
    if missing or extra:
        raise SystemExit(f"stagger mismatch missing={missing} extra={extra}")
    if len(set(STAGGER_ROUND_A)) != 27:
        raise SystemExit("STAGGER_ROUND_A must be 27 unique compounds")
    if not window_ok(STAGGER_ROUND_A):
        raise SystemExit("round A window failed")

    round_b = rotate_until_ok(STAGGER_ROUND_A, offset=13)
    sequence = list(STAGGER_ROUND_A) + list(round_b)

    rows = []
    for rank, name in enumerate(sequence, start=1):
        cid, mol = by_name[name]
        look = look_for_rank(rank)
        rows.append(make_row(rank, cid, name, mol, look))

    names = [r["compound_name"] for r in rows]
    if not window_ok(names):
        raise SystemExit("final sequence window failed")

    for key in ("shot_family", "camera_move", "surface", "lighting", "color_grade"):
        uniq = {r[key] for r in rows}
        if len(uniq) < 6:
            raise SystemExit(f"{key} has {len(uniq)} values, need 6")
        for i in range(1, len(rows)):
            if rows[i][key] == rows[i - 1][key]:
                raise SystemExit(f"adjacent ranks share {key}: {rows[i]['creation_id']}")
            # also block wrapping day 54 → day 1 if someone loops
        if rows[0][key] == rows[-1][key]:
            raise SystemExit(f"rank 1 and rank 54 share {key}")

    for r in rows:
        vp = r["video_prompt"].lower()
        mp = r["video_motion_prompt"].lower()
        if "chemical reaction" not in vp and "amino acid" not in vp:
            raise SystemExit(f"missing cellular reaction vibe {r['creation_id']}")
        if "living cell" not in vp and "cytoplasm" not in vp and "lipid" not in vp:
            raise SystemExit(f"missing living-cell scenery {r['creation_id']}")
        if "no text" not in vp:
            raise SystemExit(f"missing no-text lock {r['creation_id']}")
        if "no logo" not in vp and "no palm" not in vp:
            raise SystemExit(f"missing no-logo lock {r['creation_id']}")
        if "silent" not in mp:
            raise SystemExit(f"missing silent lock {r['creation_id']}")
        if "bottom-center" in vp or "sans-serif" in vp:
            raise SystemExit(f"overlay text still requested {r['creation_id']}")
        if len(r["video_prompt"]) > 7900:
            raise SystemExit(f"prompt too long {r['creation_id']} {len(r['video_prompt'])}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    lens = [len(r["video_prompt"]) for r in rows]
    print(f"wrote {OUT.name}: {len(rows)} rows")
    print(f"video_prompt chars min={min(lens)} max={max(lens)}")
    print("rank sequence:")
    for r in rows:
        print(f"  {r['rank']:02d}  {r['shot_family']:<14}  {r['compound_name']}")
    print("unique shot_family:", len({r['shot_family'] for r in rows}))
    print("unique camera_move:", len({r['camera_move'] for r in rows}))
    print("unique surface:", len({r['surface'] for r in rows}))
    print("unique lighting:", len({r['lighting'] for r in rows}))
    print("unique color_grade:", len({r['color_grade'] for r in rows}))
    print("round B offset compounds:", ", ".join(round_b[:5]), "...")

    patch_path = Path("/tmp/n8n-code-rebuild-chem-looks.js")
    keys = [
        "creation_id",
        "category",
        "lab_item",
        "shot_family",
        "camera_angle",
        "camera_direction",
        "framing",
        "scene_brief",
        "quality_var_count",
        "video_prompt",
        "video_motion_prompt",
        "still_edit_prompt",
        "surface",
        "lighting",
        "camera_move",
        "color_grade",
        "hero_style",
    ]
    patch = [{k: r[k] for k in keys} for r in rows]
    js = (
        "// n8n Code node: rebuild_chem_looks\n"
        "// Mode: Run Once for All Items. Execute Once OFF.\n"
        "// After: get_chem_creations  Before: sheets_update_chem_looks\n"
        "// Overlays 6-way staggered looks. Keeps times_used / last_used_at / status.\n"
        "var PATCH = "
        + json.dumps(patch, ensure_ascii=True)
        + ";\n"
        "var byId = {};\n"
        "PATCH.forEach(function (p) { byId[p.creation_id] = p; });\n"
        "var items = $input.all();\n"
        "if (items.length < 2) throw new Error('rebuild_chem_looks: need all Sheet 13 rows');\n"
        "return items.map(function (item) {\n"
        "  var row = item.json || {};\n"
        "  var id = String(row.creation_id || '').trim();\n"
        "  var p = byId[id];\n"
        "  if (!p) throw new Error('rebuild_chem_looks: no patch for ' + id);\n"
        "  var out = {};\n"
        "  Object.keys(p).forEach(function (k) { out[k] = p[k]; });\n"
        "  out.times_used = row.times_used;\n"
        "  out.last_used_at = row.last_used_at;\n"
        "  out.status = row.status || 'Active';\n"
        "  out.compound_name = row.compound_name;\n"
        "  return { json: out };\n"
        "});\n"
    )
    patch_path.write_text(js, encoding="utf-8")
    print(f"wrote {patch_path} ({len(js)} chars)")


if __name__ == "__main__":
    main()
