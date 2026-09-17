#!/usr/bin/env python3
"""Rewrite the pen tab's visual lock to the pen Palm Beach Vitality actually sells.

Salvatore, 2026-09-16, on the first fal Kling Pro pen clip: "the red bottom part
of the pen should not be wider then the rest of the pen."

The lock asked for a "small flat circular plunger tip at the bottom of the dial
in crimson red" and never bounded its width, so the model was free to flare it
into a base. Measuring the thirteen peptide pens on
palmbeach-vitality.store/product-category/peptide-pens/ showed the lock was
wrong about more than the width — see marketing/peptide-pen-visual-spec.md for
the numbers and the side-by-side of every block replaced here.

    length : barrel diameter   8.3 : 1   (7.61-8.77)
    button : barrel            0.92      (0.916-0.933), always steps in
    button                     orange    #BE4718, knurled
    compound name              brick red #B13A3B
    DNA helix                  steel blue #8FA7C1
    dose line                  graphite  #19191A

He approved the replacement text and chose "match the catalog" on the dose
question, so the label now keeps its dose line instead of stripping it.

    python3 marketing/scripts/apply_measured_pen_spec.py           # dry run
    python3 marketing/scripts/apply_measured_pen_spec.py --write
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
MIRROR = SHEETS / "14-pen-creations-150.csv"
PAYLOAD = SHEETS / "14-pen-creations-measured-spec.json"

# Every field that carries pen-look copy. quality_suffix and video_motion_prompt
# are included because they name the plunger and the label too.
FIELDS = [
    "lab_item",
    "material_detail",
    "hero_style",
    "scene_brief",
    "video_prompt",
    "still_edit_prompt",
    "video_motion_prompt",
    "quality_suffix",
]

NAME_RED = "brick red #B13A3B"
HELIX_BLUE = "steel-blue #8FA7C1"
BUTTON_ORANGE = "orange #BE4718"
DOSE_GRAPHITE = "graphite #19191A"

LOCK_OLD = (
    "PEN VISUAL LOCK (identical every frame, ZERO EXCEPTIONS): Exactly ONE Palm Beach "
    "Vitality 3ml injection pen. Same pen size, shape, and design every time: longer "
    "full-length matte white barrel, white clip-cap ON, white ridged dose dial, accent "
    "plunger tip. RED ACCENTS only (peptide): crimson red compound name, logo, helix, "
    "and plunger/accent bits. Logo = crimson red double-helix DNA icon only — no hands "
    "near the helix. No blue accents. No orange. No vial. No second pen."
)

LOCK_NEW = (
    "PEN VISUAL LOCK (identical every frame, ZERO EXCEPTIONS): Exactly ONE Palm Beach "
    "Vitality 3ml injection pen, built to the catalog photo. ONE CONSTANT DIAMETER from "
    "cap to dial — the cap, both steel collars and the white ridged dose dial are all "
    "flush with the barrel at the same width. Nothing on this pen is ever wider than the "
    "barrel: no flare, no skirt, no foot, no cone, no pedestal, no widening base. "
    "PROPORTION: total length is 8.3x the barrel diameter. TOP TO BOTTOM: white gloss cap "
    "with a flat top and an integrated white pocket clip, cap = top 36 percent of the pen, "
    "clip running down the top 27 percent; a brushed-steel collar (6 percent of length, "
    "flush) carrying TWO small rounded-square dose windows side by side; the white gloss "
    "label barrel (44 percent); a second brushed-steel collar (4 percent, flush); the WHITE "
    "ridged dose dial with vertical flutes (6 percent, flush); and last, a short knurled "
    f"ORANGE {BUTTON_ORANGE.split()[1]} push button with gear-tooth ridges around its rim at "
    "0.92x the barrel diameter — it STEPS IN, narrower than the barrel, never as wide, never "
    f"wider. LABEL: {HELIX_BLUE} double-helix DNA icon on top — no hands near the helix; "
    f"below it the compound name in bold condensed {NAME_RED}, set along the "
    "barrel axis so it reads bottom-to-top; beside the name one "
    f"{DOSE_GRAPHITE} line reading the dose and '3ml'. No badge, no red rectangle. Orange "
    "appears ONLY on the bottom push button — never on the dial, the name, the helix, or the "
    "cap. Blue appears ONLY on the helix. No vial. No second pen."
)

OUTPUT_OLD = (
    "Copy the catalog injector still. Render exactly ONE smooth matte white cylindrical "
    "insulin-style Palm Beach Vitality research pen labeled '{COMPOUND}', as a single "
    "catalog hero. Camera closer on the one pen. Product count = 1. LONGER full-length "
    "barrel — stretch 10-20 percent longer than a stubby travel pen, adult injector, not "
    "compact, not short, keep the diameter. This is a medical injection pen, NOT a glass "
    "vial, NOT brushed-silver metal, NOT a perfume cartridge, NOT a chrome claw stand. "
    "White matte cap ON with integrated white pocket clip covering the tip — never removed, "
    "never sitting beside the pen, never showing a needle. White ridged gear-like dose dial "
    "(NOT colored, NOT orange). Small flat circular plunger tip at the bottom of the dial in "
    "crimson red. No mixed compounds. No vial. No syringe. No people. COLOR LOCK: Every pen "
    "on this sheet is a peptide pen = crimson red text + logo. No other accent colour exists "
    "on this sheet. This SKU is peptide / crimson red. FORBIDDEN: orange anywhere. FORBIDDEN: "
    "hands near the DNA helix."
)

OUTPUT_NEW = (
    "Copy the catalog injector still. Render exactly ONE smooth white gloss cylindrical "
    "insulin-style Palm Beach Vitality research pen labeled '{COMPOUND}', as a single "
    "catalog hero. Camera closer on the one pen. Product count = 1. PROPORTION: total length "
    "is 8.3x the barrel diameter, full-length adult injector, not compact, not short. ONE "
    "CONSTANT DIAMETER cap to dial — both steel collars and the white dial are flush; nothing "
    "steps out or flares. The pen body is a medical injection pen, NOT a glass vial, NOT an "
    "all-metal body, NOT a perfume cartridge, NOT a chrome claw stand — the only metal is the "
    "two flush brushed-steel collars, one below the cap with two small rounded-square dose "
    "windows and one above the dial. White gloss cap ON with integrated white pocket clip "
    "covering the tip — never removed, never sitting beside the pen, never showing a needle. "
    "White ridged gear-like dose dial (NOT colored, NOT orange). Bottom push button: short "
    f"knurled {BUTTON_ORANGE} cylinder at 0.92x the barrel diameter, stepped IN — never as wide "
    "as the barrel, never wider, never a flared base. No mixed compounds. No vial. No syringe. "
    f"No people. COLOR LOCK: Every pen on this sheet is a peptide pen = {NAME_RED} compound "
    f"name, {HELIX_BLUE} helix, {BUTTON_ORANGE} bottom button. No other accent colour exists on "
    "this sheet. FORBIDDEN: orange on the dial, cap, name, or helix. FORBIDDEN: hands near the "
    "DNA helix."
)

FORM_OLD = (
    "smooth matte white cylindrical insulin-style injectable research pen with a LONGER "
    "full-length barrel — PROPORTION: barrel 10-20 percent longer than a stubby travel pen, "
    "full-length elongated adult injector, not compact, not short; stretch the white barrel, "
    "keep the diameter the same; matching white matte cap ON with integrated white pocket clip "
    "covering the tip; white ridged gear-like dose dial (NOT colored, NOT orange); small flat "
    "circular plunger tip at the bottom of the dial in the accent color; small rectangular "
    "transparent barrel window beside the label (a glimpse of liquid/mechanism only — NOT a "
    "tall glass reservoir, NOT most of the body as glass)"
)

FORM_NEW = (
    "smooth white gloss cylindrical insulin-style injectable research pen — PROPORTION: total "
    "length 8.3x the barrel diameter, full-length adult injector, not compact, not short; ONE "
    "CONSTANT DIAMETER from cap to dial, every section flush, nothing wider than the barrel "
    "anywhere; matching white gloss cap ON with a flat top and integrated white pocket clip "
    "covering the tip, cap = top 36 percent of the pen; flush brushed-steel collar below the "
    "cap with TWO small rounded-square dose windows side by side (the only windows on the pen "
    "— NOT a barrel window, NOT a glass reservoir, NOT a glass body); white ridged gear-like "
    "dose dial with vertical flutes, flush (NOT colored, NOT orange); bottom push button = "
    f"short knurled {BUTTON_ORANGE} cylinder at 0.92x the barrel diameter, stepped IN, narrower "
    "than the barrel, never wider, never flared"
)

LABEL_OLD = (
    "LABEL (MANDATORY): clean white wrap-around barrel label. Logo ABOVE the name: crimson red "
    "DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. "
    "Exact compound name '{COMPOUND}' in large bold crimson red sans-serif (Helvetica/Arial). "
    "Solid crimson red rectangle badge with white text exactly '3ml Pen'. FORBIDDEN: orange "
    "DNA, orange name, orange badge, orange dial, orange anywhere, burgundy vial branding, "
    "palm tree, extra class names, poster overlays."
)

LABEL_NEW = (
    "LABEL (MANDATORY): clean white gloss wrap-around barrel label. Logo ABOVE the name: "
    f"{HELIX_BLUE} DNA double-helix icon only — no hands, no palms, no figurative hands "
    "cradling the helix. Exact compound name '{COMPOUND}' in large bold condensed "
    f"{NAME_RED} sans-serif (Helvetica/Arial), set along the barrel axis so it reads "
    f"bottom-to-top. One {DOSE_GRAPHITE} line beside the name reading the dose and '3ml'. No "
    "badge, no red rectangle, no white-on-red text. FORBIDDEN: orange DNA, orange name, orange "
    "dial, orange cap, red helix, blue name, burgundy vial branding, palm tree, extra class "
    "names, poster overlays."
)

FINAL_OLD = (
    "HARD OUTPUT LOCK (FINAL CHECK): This is exactly ONE freshly made pen, camera closer on the "
    "one hero. Product count = 1. No extra pens. No vials. No mixed SKUs. Cap on. Longer "
    "full-length barrel on each pen. White dial. Accent plunger tip. DNA helix with no hands. "
    "No orange."
)

FINAL_NEW = (
    "HARD OUTPUT LOCK (FINAL CHECK): This is exactly ONE freshly made pen, camera closer on the "
    "one hero. Product count = 1. No extra pens. No vials. No mixed SKUs. Cap on. Length 8.3x "
    "the barrel diameter. One constant diameter cap to dial, every section flush. White ridged "
    "dial. Bottom push button orange and narrower than the barrel — if the bottom is as wide as "
    "the barrel or wider, the frame is wrong. DNA helix in steel blue with no hands. Compound "
    "name in brick red."
)

FIX_OLD = (
    "CRITICAL PRODUCT FIX: Keep this exact catalog pen, then remove every extra pen until only "
    "ONE remains. White matte barrel, white clip-cap ON, white ridged dose dial (NOT orange). "
    "Logo ABOVE the name: crimson red DNA double-helix icon only — no hands, no palms, no "
    "figurative hands cradling the helix. Name '{COMPOUND}' large bold crimson red sans-serif. "
    "Solid crimson red rectangle badge with white '3ml Pen'. This is a peptide SKU — crimson "
    "red text and logo on the pen."
)

FIX_NEW = (
    "CRITICAL PRODUCT FIX: Keep this exact catalog pen, then remove every extra pen until only "
    "ONE remains. White gloss barrel at one constant diameter, white clip-cap ON, white ridged "
    "dose dial (NOT orange), two flush brushed-steel collars. NARROW THE BOTTOM: the bottom "
    f"push button must be {BUTTON_ORANGE} and 0.92x the barrel diameter — if it is as wide as "
    "the barrel or wider, or reads as a flared base, skirt, or foot, shrink it until it steps "
    f"in. Logo ABOVE the name: {HELIX_BLUE} DNA double-helix icon only — no hands, no palms, no "
    "figurative hands cradling the helix. Name '{COMPOUND}' large bold condensed "
    f"{NAME_RED} sans-serif along the barrel axis. No badge, no red rectangle."
)

# Six approved blocks, longest first so a block never eats a fragment of another.
BLOCKS = [
    ("PEN VISUAL LOCK", LOCK_OLD, LOCK_NEW),
    ("HARD OUTPUT LOCK (READ FIRST)", OUTPUT_OLD, OUTPUT_NEW),
    ("FORM", FORM_OLD, FORM_NEW),
    ("LABEL (MANDATORY)", LABEL_OLD, LABEL_NEW),
    ("HARD OUTPUT LOCK (FINAL CHECK)", FINAL_OLD, FINAL_NEW),
    ("CRITICAL PRODUCT FIX", FIX_OLD, FIX_NEW),
]

# Leftovers that live outside the six blocks, in hero and supporting-note prose.
# Order matters: the longest, most specific phrase goes first.
PHRASES = [
    # the dose line, now kept because Salvatore chose "match the catalog"
    (
        "REMOVE all disclaimer, research-use, purity, milligram, 10mg, and fine-print text",
        "REMOVE all disclaimer, research-use, purity, and fine-print text",
    ),
    (
        'Keep only "{COMPOUND}" and a "3ml Pen" badge.',
        'Keep the catalog label: "{COMPOUND}", the dose line, and "3ml".',
    ),
    (
        "No lyophilized. No purity. No milligram dose. No 10mg. No fine print. No vertical side text.",
        "No lyophilized. No purity. No fine print. The pen's own dose line is allowed and is set "
        "along the barrel axis with the name.",
    ),
    (
        'The pen label shows ONLY "{COMPOUND}" and the badge "3ml Pen".',
        'The pen label shows ONLY "{COMPOUND}", its dose, and "3ml".',
    ),
    # Six CJC/Ipamorelin rows carry a mangled duplicate of this clause, left by an
    # earlier script that substituted a name containing a slash. Match the whole
    # corrupt run first so the clean clause below never rewrites only its head.
    (
        "the catalog label ('{COMPOUND}', '3ml Pen', DNA helix icon with no hands)"
        "/Ipamorelin', '3ml Pen', DNA helix icon with no hands, vertical )",
        "the catalog label ('{COMPOUND}', the dose line with '3ml', DNA helix icon with no hands)",
    ),
    (
        "the catalog label ('{COMPOUND}', '3ml Pen', DNA helix icon with no hands)",
        "the catalog label ('{COMPOUND}', the dose line with '3ml', DNA helix icon with no hands)",
    ),
    (
        "Keep label '{COMPOUND}' and '3ml Pen' unchanged if visible.",
        "Keep the label '{COMPOUND}', its dose line, and '3ml' unchanged if visible.",
    ),
    (
        "LABEL: only '{COMPOUND}' and badge '3ml Pen'.",
        "LABEL: only '{COMPOUND}' with its dose line and '3ml'.",
    ),
    # The liquid window the product does not have. Leave the terminator off both
    # sides: the same clause ends '.' on lab_item and video_prompt, ';' on
    # material_detail, and nothing at all on scene_brief, and pinning the period
    # matched only two of the four fields.
    (
        "barrel window shows settled crystal-clear colorless liquid already inside at a stable "
        "level; never filling",
        "no liquid window anywhere on the pen; the only windows are the two dose windows in the "
        "upper steel collar",
    ),
    (
        "barrel window shows settled clear bright blue liquid already inside at a stable level "
        "(GLOW only — blue liquid); never filling",
        "no liquid window anywhere on the pen; the only windows are the two dose windows in the "
        "upper steel collar",
    ),
    (
        "lined up so barrel windows stay readable",
        "lined up so labels stay readable",
    ),
    # remaining colour and finish words in hero prose
    (
        "crimson red DNA double-helix icon only",
        f"{HELIX_BLUE} DNA double-helix icon only",
    ),
    (
        "crimson red DNA helix icon (no hands) + name + 3ml Pen badge, crimson red plunger tip",
        f"{HELIX_BLUE} DNA helix icon (no hands) + name + {DOSE_GRAPHITE} dose line, "
        f"{BUTTON_ORANGE} push button narrower than the barrel",
    ),
    (
        "crimson red circular plunger tip, no orange",
        f"{BUTTON_ORANGE} knurled push button narrower than the barrel, one constant barrel diameter",
    ),
    (
        "This is a peptide SKU — crimson red text and logo on the pen.",
        f"This is a peptide SKU — {NAME_RED} name, {HELIX_BLUE} helix, {BUTTON_ORANGE} bottom button.",
    ),
    (
        "DELETE orange, burgundy vial branding",
        "DELETE orange anywhere except the bottom push button, burgundy vial branding",
    ),
    (
        "accent-color circular plunger tip in frame",
        f"{BUTTON_ORANGE} push button in frame, narrower than the barrel",
    ),
    # A shot name carried over from 3-image-scenes-150 product_hero. The part it
    # frames is a push button, so the shot has to be renamed with it.
    ("research pen plunger-tip macro", "research pen push-button macro"),
    ("White dial. Accent plunger tip.", "White dial. Orange push button, narrower than the barrel."),
    ("white ridged dose dial, accent plunger tip", "white ridged dose dial, orange push button"),
    ("each white body and accent plunger tip", f"each white body and {BUTTON_ORANGE} push button"),
    ("matte white", "white gloss"),
]

# Wording the rewrite has to leave nothing of. emit_pen_spec_code_node.py hands
# this same list to the n8n node, so the live sheet is held to the mirror's bar.
#
# Two entries are deliberately blunter than the block they came from: "plunger"
# is scanned bare because the old tip was worded four different ways, and
# "barrel window shows" is scanned instead of "barrel window" because the new
# FORM block legitimately says "NOT a barrel window".
STALE = [
    "crimson red",
    "#DC143C",
    "matte white",
    "plunger",
    "FORBIDDEN: orange anywhere",
    "No blue accents",
    "NOT brushed-silver metal",
    "small rectangular transparent barrel window",
    "barrel window shows",
    "rectangle badge",
    "3ml Pen",
    "vertical )",
    "stretch 10-20 percent longer",
    "No milligram dose",
]

# Stacks label differently; one sentence covers all three without naming a dose.
STACK_NOTE = (
    " STACK SKUs: a stack pen prints its own catalog wording — the BPC-157/TB-500 stack prints "
    "that contents name, KLOW and GLOW print the stack name, and the dose line carries every part "
    "of the dose. GLOW alone sets its name in white with a red glow instead of solid red."
)


def compile_block(old: str) -> re.Pattern[str]:
    """Match a block whatever label name the row prints inside it.

    compound_name is the choose_compound key, not the printed name: row 26 is
    keyed 'Tesa-Ipa' but its label reads 'Tesamorelin/Ipamorelin', and
    'Ipamorelin-Solo' prints 'Ipamorelin'. Matching on compound_name skipped 16
    rows, so capture the name from the text instead and put it back unchanged.
    """
    parts = old.split("{COMPOUND}")
    return re.compile("([^'\"]+?)".join(re.escape(p) for p in parts))


def apply_pattern(
    pattern: re.Pattern[str], new: str, text: str, hits: Counter[str], key: str
) -> str:
    def replace(match: re.Match[str]) -> str:
        names = set(match.groups())
        if len(names) > 1:
            raise SystemExit(f"{key}: one block printed two different names {sorted(names)}")
        if "{COMPOUND}" in new and not names:
            raise SystemExit(f"{key}: replacement wants a name but the old text printed none")
        hits[key] += 1
        name = next(iter(names)) if names else ""
        return new.replace("{COMPOUND}", name)

    return pattern.sub(replace, text)


def main() -> int:
    write = "--write" in sys.argv

    with MIRROR.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]

    print(f"{len(rows)} rows, {len(columns)} columns\n")

    # The hex was pinned onto every "crimson red" by pin_pen_red_and_spec.py, but
    # only on video_prompt and still_edit_prompt. Drop it everywhere first so each
    # block has exactly one spelling to match.
    unpinned = 0
    for row in rows:
        for field in FIELDS:
            before = row[field]
            row[field] = before.replace("crimson red #DC143C", "crimson red")
            unpinned += before.count("crimson red #DC143C")
    print(f"normalised {unpinned} 'crimson red #DC143C' to 'crimson red' so blocks match once")

    block_hits: Counter[str] = Counter()
    phrase_hits: Counter[str] = Counter()
    stacks = 0

    # Record the name each field actually prints, so QA can prove the rewrite
    # kept it. compound_name is the selector key and often differs.
    printed = re.compile(r"research pen labeled '([^']+)'|Name '([^']+)' large bold")
    before_names = {
        r["creation_id"]: {
            field: {g for m in printed.finditer(r[field]) for g in m.groups() if g}
            for field in ("video_prompt", "still_edit_prompt")
        }
        for r in rows
    }

    compiled_blocks = [(label, compile_block(old), new) for label, old, new in BLOCKS]
    compiled_phrases = [(old[:46], compile_block(old), new) for old, new in PHRASES]

    for row in rows:
        compound = row["compound_name"].strip()
        if not compound:
            raise SystemExit(f"{row['creation_id']}: empty compound_name")

        for field in FIELDS:
            value = row[field]

            for label, pattern, new in compiled_blocks:
                value = apply_pattern(pattern, new, value, block_hits, f"{label}/{field}")

            for key, pattern, new in compiled_phrases:
                value = apply_pattern(pattern, new, value, phrase_hits, key)

            row[field] = value

        # Stack rows get the extra sentence once, on the two fields that reach an API.
        if "/" in compound or compound.upper() in {"GLOW", "KLOW", "WOLVERINE"}:
            stacks += 1
            for field in ("video_prompt", "still_edit_prompt"):
                if STACK_NOTE.strip() not in row[field]:
                    row[field] = row[field].rstrip() + STACK_NOTE

    print(f"\nblocks replaced ({sum(block_hits.values())} total)")
    for key, n in sorted(block_hits.items()):
        print(f"  {n:5d}  {key}")

    print(f"\nphrases replaced ({sum(phrase_hits.values())} total)")
    for key, n in sorted(phrase_hits.items(), key=lambda kv: -kv[1]):
        print(f"  {n:5d}  {key!r}")

    print(f"\nstack rows given the stack note: {stacks}")

    # --- QA -----------------------------------------------------------------
    failures: list[str] = []

    def check(label: str, ok: bool, detail: object = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label} — {detail}")
        if not ok:
            failures.append(label)

    print("\nQA")

    def scan(needle: str) -> list[str]:
        return [
            f"{r['creation_id']}:{f}"
            for r in rows
            for f in columns
            if needle in str(r[f])
        ]

    for gone in STALE:
        hit = scan(gone)
        check(f"no {gone!r} left", not hit, f"{len(hit)} fields")

    for want, fields in (
        ("ONE CONSTANT DIAMETER", ("lab_item", "video_prompt", "still_edit_prompt")),
        ("0.92x the barrel diameter", ("lab_item", "video_prompt", "still_edit_prompt")),
        ("8.3x the barrel diameter", ("lab_item", "video_prompt")),
        (BUTTON_ORANGE, ("lab_item", "video_prompt", "still_edit_prompt", "quality_suffix")),
        (HELIX_BLUE, ("lab_item", "video_prompt", "still_edit_prompt")),
        (NAME_RED, ("lab_item", "video_prompt", "still_edit_prompt")),
    ):
        missing = [
            f"{r['creation_id']}:{f}" for r in rows for f in fields if want not in r[f]
        ]
        check(f"{want!r} on every row", not missing, f"{len(missing)} missing")

    # The printed label name must survive the rewrite on both prompt fields.
    lost = [
        f"{r['creation_id']}:{field}:{name}"
        for r in rows
        for field, names in before_names[r["creation_id"]].items()
        for name in names
        if name not in r[field]
    ]
    check("printed label name survived", not lost, lost[:4] or f"{len(lost)} lost")

    named = [
        r["creation_id"]
        for r in rows
        if not before_names[r["creation_id"]]["video_prompt"]
        or not before_names[r["creation_id"]]["still_edit_prompt"]
    ]
    check("every row printed a label name to begin with", not named, f"{len(named)} rows")

    empty = [r["creation_id"] for r in rows for f in FIELDS if not r[f].strip()]
    check("no field emptied", not empty, f"{len(empty)} blank")

    for field in ("scene_brief", "camera_move"):
        dupes = [k for k, n in Counter(r[field] for r in rows).items() if n > 1]
        check(f"{field} still unique", not dupes, f"{len(dupes)} duplicated")

    for field, want in (
        ("aspect_ratio", "9:16"),
        ("duration_seconds", "15"),
        ("resolution", "1080p"),
        ("model_video", "fal-ai/kling-video/v3/pro/image-to-video"),
    ):
        off = sorted({str(r[field]) for r in rows if str(r[field]).strip() != want})
        check(f"{field} untouched at {want}", not off, off or "clean")

    others = re.compile(r"#(?!B13A3B\b|8FA7C1\b|BE4718\b|19191A\b)[0-9A-Fa-f]{6}\b")
    stray = sorted(
        {m.group(0) for r in rows for f in FIELDS for m in others.finditer(r[f])}
    )
    check("only the four measured colour numbers appear", not stray, stray or "clean")

    lengths = sorted(len(r["video_prompt"]) for r in rows)
    print(f"        video_prompt length is now {lengths[0]}-{lengths[-1]}")

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1
    print("\nAll checks passed.")

    if not write:
        print("\nDry run. Re-run with --write to update the mirror and emit the payload.")
        return 0

    with MIRROR.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nwrote {MIRROR.relative_to(ROOT.parent)} ({len(rows)} rows)")

    PAYLOAD.write_text(
        json.dumps(
            {
                "count": len(rows),
                "fields": FIELDS,
                "rows": [
                    {"creation_id": r["creation_id"], **{f: r[f] for f in FIELDS}}
                    for r in rows
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {PAYLOAD.relative_to(ROOT.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
