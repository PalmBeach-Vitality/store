#!/usr/bin/env python3
"""CRITICAL: exactly ONE vial OR ONE pen per creation image — never both, never multiples.

Patches Sheet 9 / 8 / 12 (+250 compat) and JSON export.
Also fills still_edit_prompt with a hard single-hero cleanup for every row.
Safe to re-run.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"

CSV_PATHS = [
    SHEETS / "9-lab-item-creations-500.csv",
    SHEETS / "9-lab-item-creations-250.csv",
    SHEETS / "8-lab-items-500.csv",
    SHEETS / "8-lab-items-250.csv",
    SHEETS / "12-import-still-queue.csv",
]
JSON_PATHS = [
    ROOT / "pbvita-500-lab-item-creations.json",
]

VIAL_HERO = (
    "a single clear glass Palm Beach Vitality injection vial with bright blue flip-off cap, "
    "brushed-silver aluminum crimp seal over rubber septum, and a clean white wrap-around "
    "label bearing a dark maroon DNA double-helix logo, the exact compound name in large bold "
    "dark maroon type, a solid dark maroon dosage bar with white mg strength, black mg/ml "
    "concentration text, and a small black footer reading '10ml Sterile Multi-Use Vial'"
)

PEN_HERO = (
    "a single sealed Palm Beach Vitality research pen on a matte acrylic pedestal, "
    "cap on, one pen only — no second pen, no carousel, no pen tray"
)

SINGLE_RULE = (
    "SINGLE HERO PRODUCT RULE (MANDATORY — CRITICAL — COUNT = 1): The finished image must "
    "contain exactly ONE research product container total — either ONE vial OR ONE pen — "
    "never both, never two, never three. PRODUCT COUNT MUST EQUAL 1. If you can see more than "
    "one vial or more than one pen anywhere in the frame (including background, blur, edges, "
    "reflections, or depth), the image is WRONG. Forbidden: second vial, background vial, "
    "foreground+background vial pair, large+small vial, open+capped vial pair, mirrored "
    "duplicate, row/rack/carousel/cluster/shelf/array of vials or pens, carton+vial double hero, "
    "extra bottles that read as products. Background = architecture and atmosphere only. "
    "ONE object. ONE hero. COUNT = 1. Period."
)

OPENING_LOCK = (
    "HARD OUTPUT LOCK (READ FIRST): Render exactly 1 product container in the entire image — "
    "either 1 sealed vial OR 1 sealed pen. Product count = 1. No second vial. No background vial. "
    "No soft-focus vial. No product pair for depth. "
)

CLOSING_LOCK = (
    " HARD OUTPUT LOCK (FINAL CHECK): Before finishing, count every vial and pen in the image. "
    "The total must be exactly 1. If the count is 2 or more, remove the extras until only one "
    "hero remains. COUNT = 1."
)

STILL_EDIT_HARD = (
    "CRITICAL COUNT FIX: Keep exactly ONE sealed Palm Beach Vitality hero product "
    "(one vial OR one pen). DELETE every extra vial/pen. Also DELETE any weighing scale, "
    "digital scale, platform scale, or metal tray under the product — place the single hero "
    "directly on the table/surface. After the edit count exactly 1 product and zero scales. "
    "Do not restyle lighting, camera, label text, or environment."
)

TEXT_KEYS = (
    "lab_item",
    "video_prompt",
    "material_detail",
    "scene_brief",
    "product_hero",
    "product_form_detail",
    "still_edit_prompt",
    "quality_suffix",
)

# Order matters — longer / more specific first
REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    # duplicated packaging pasted after VIAL_HERO (causes model to draw two vials)
    (
        re.compile(
            r"(10ml Sterile Multi-Use Vial')\s+with bright blue flip-off cap, "
            r"brushed-silver aluminum crimp seal over rubber septum, and a clean white "
            r"wrap-around label bearing a dark maroon DNA double-helix logo, the exact "
            r"compound name in large bold dark maroon type, a solid dark maroon dosage bar "
            r"with white mg strength, black mg/ml concentration text, and a small black "
            r"footer reading '10ml Sterile Multi-Use Vial'",
            re.I,
        ),
        r"\1",
    ),
    # "not a single boring SKU" confuses count language
    (re.compile(r"\bnot a single boring SKU\b", re.I), "not a boring SKU catalog shot"),
    (re.compile(r"\bThis is not a single boring SKU\b", re.I), "This is not a boring SKU catalog shot"),
    # Hero cluster wording
    (re.compile(r"\bHero cluster\b", re.I), "Hero"),
    # double article bug
    (re.compile(r"\ba a single clear glass Palm Beach Vitality injection vial\b", re.I), VIAL_HERO),
    # carton + vial double hero → vial only
    (
        re.compile(
            r"a marble console holding one premium research carton silhouette plus "
            r"(?:a |an )?clear glass Palm Beach Vitality injection vial[^.;]*",
            re.I,
        ),
        f"a marble console holding {VIAL_HERO} as the only product hero",
    ),
    (
        re.compile(
            r"one premium research carton silhouette plus (?:a |an )?clear glass "
            r"Palm Beach Vitality injection vial[^.;]*",
            re.I,
        ),
        f"{VIAL_HERO} as the only product hero",
    ),
    (
        re.compile(
            r"premium research carton silhouette plus (?:a |an )?clear glass "
            r"Palm Beach Vitality injection vial[^.;]*",
            re.I,
        ),
        f"{VIAL_HERO} as the only product hero",
    ),
    (
        re.compile(
            r"(?:Hero cluster — )?(?:a )?constellation of (?:a single )?clear glass "
            r"Palm Beach Vitality injection vial[^.;]*",
            re.I,
        ),
        f"{VIAL_HERO} as the only product hero",
    ),
    (
        re.compile(r"Hero cluster — a constellation of[^.;]*", re.I),
        f"Hero — {VIAL_HERO}",
    ),
    (
        re.compile(r"\ba constellation of a single clear glass\b", re.I),
        "a single clear glass",
    ),
    (
        re.compile(r"\ba constellation of\b", re.I),
        "a single",
    ),
    (
        re.compile(
            r"a carousel of research pens on matte acrylic like jewelry, caps sealed",
            re.I,
        ),
        PEN_HERO,
    ),
    (
        re.compile(r"\bcarousel of research pens\b", re.I),
        "single sealed research pen",
    ),
    (
        re.compile(r"\bresearch pens on matte acrylic like jewelry, caps sealed\b", re.I),
        "single sealed research pen on matte acrylic, cap on",
    ),
    (
        re.compile(r"a carousel of research pens on matte acrylic lik…", re.I),
        "a single sealed research pen on matte acrylic…",
    ),
    (
        re.compile(r"a constellation of a single clear glass PB Vitality vial[^·]*", re.I),
        "a single clear glass PB Vitality vial with blue flip-cap…",
    ),
    (
        re.compile(
            r"a marble console holding one premium research carton silhouette plus a clear glass PB Vitality vial[^·]*",
            re.I,
        ),
        "a marble console holding a single clear glass PB Vitality vial…",
    ),
    (
        re.compile(
            r"a floating glass shelf of research powders in sealed jars, labeled for laboratory use only",
            re.I,
        ),
        "a single sealed research powder jar on a floating glass shelf, labeled for laboratory use only "
        "(one jar only — no second jar, no shelf of multiples)",
    ),
    (re.compile(r"\bmulti-vial storyboard\b", re.I), "single-vial catalog hero"),
    (re.compile(r"\bmulti-vial\b", re.I), "single-vial"),
    (re.compile(r"\bpair of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\bpair of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\bset of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\bset of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\brow of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\brow of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\brack of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\brack of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\bcluster of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\bcluster of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\barray of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\barray of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\blineup of (?:research )?vials\b", re.I), "single research vial"),
    (re.compile(r"\blineup of (?:research )?pens\b", re.I), "single research pen"),
    (re.compile(r"\bmultiple (?:research )?vials\b", re.I), "a single research vial"),
    (re.compile(r"\bmultiple (?:research )?pens\b", re.I), "a single research pen"),
    (re.compile(r"\bseveral (?:research )?vials\b", re.I), "a single research vial"),
    (re.compile(r"\bseveral (?:research )?pens\b", re.I), "a single research pen"),
    (re.compile(r"\btwin vials\b", re.I), "a single vial"),
    (re.compile(r"\btwo vials\b", re.I), "one vial"),
    (re.compile(r"\b2 vials\b", re.I), "1 vial"),
]

PACKAGING_PLURAL_FIXES: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(r"NO amber-glass hero vials", re.I),
        "NO amber-glass hero vial",
    ),
    (
        re.compile(r"NO blank/unbranded pharmacy vials", re.I),
        "NO blank/unbranded pharmacy vial",
    ),
    (
        re.compile(
            r"If any vial, pen, carton panel, or pedestal plaque shows a product name",
            re.I,
        ),
        "If the single hero vial or single hero pen shows a product name",
    ),
]

# Phrases that actively teach the model to draw MORE than one product
ANTI_MULTI_FIXES: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"Create an exciting, unique laboratory / peptide R&D / health-and-wellness "
            r"industry scene — not a boring single product cutout\.",
            re.I,
        ),
        "Create an exciting, unique laboratory / peptide R&D / health-and-wellness "
        "industry environment scene that still contains exactly ONE product hero only "
        "(never two vials, never two pens, never a product pair).",
    ),
    (
        re.compile(r"not a boring single product cutout", re.I),
        "exactly one product hero in a full environment (never two products)",
    ),
    (
        re.compile(
            r"Nested glass doors create recursive reflections of the same hero object\.",
            re.I,
        ),
        "Glass may reflect light only — no second readable vial or pen in any reflection.",
    ),
    (
        re.compile(r"recursive reflections of the same hero object", re.I),
        "no second readable vial or pen in any reflection",
    ),
    (
        re.compile(
            r"Color-blocked solvent bottles create a deliberate Pantone story behind the hero\.",
            re.I,
        ),
        "Keep the background clean behind the single hero — no extra bottles that read as product heroes.",
    ),
]

QUALITY_NEGATIVES = (
    "exactly one product hero only, product count equals 1, no second vial anywhere, "
    "no background vial, no soft-focus vial, no twin vials, no product pair, "
    "no duplicate products, one container only"
)


def apply_replacements(text: str) -> str:
    out = text or ""
    for pat, repl in REPLACEMENTS:
        out = pat.sub(repl, out)
    for pat, repl in PACKAGING_PLURAL_FIXES:
        out = pat.sub(repl, out)
    for pat, repl in ANTI_MULTI_FIXES:
        out = pat.sub(repl, out)
    out = re.sub(r"\ba a single\b", "a single", out, flags=re.I)
    out = re.sub(r"\s{2,}", " ", out)
    return out


def strip_locks_and_old_rules(text: str) -> str:
    t = text or ""
    t = re.sub(r"HARD OUTPUT LOCK \(READ FIRST\):.*?(?:for depth\.\s*|depth\.\s*)", "", t, flags=re.I | re.S)
    t = re.sub(r"HARD OUTPUT LOCK \(FINAL CHECK\):.*?COUNT = 1\.", "", t, flags=re.I | re.S)
    t = re.sub(
        r"SINGLE HERO PRODUCT RULE \(MANDATORY[^\)]*\):.*?(?:COUNT = 1\. Period\.|Period\.|props are forbidden\.)",
        "",
        t,
        flags=re.I | re.S,
    )
    return re.sub(r"\s{2,}", " ", t).strip()


def ensure_single_rule(text: str) -> str:
    t = apply_replacements(text or "")
    t = strip_locks_and_old_rules(t)
    # Always wrap: opening lock + body + single rule + closing lock
    if not t.startswith("HARD OUTPUT LOCK"):
        t = OPENING_LOCK + t
    if "SINGLE HERO PRODUCT RULE" not in t:
        # insert before Quality / ABSOLUTE / end
        markers = [
            "ABSOLUTE RULE — NO DOUBLES",
            "ABSOLUTE RULE - NO DOUBLES",
            "Quality: ultra detailed",
        ]
        placed = False
        for marker in markers:
            idx = t.find(marker)
            if idx != -1:
                t = t[:idx].rstrip() + " " + SINGLE_RULE + " " + t[idx:]
                placed = True
                break
        if not placed:
            t = t + " " + SINGLE_RULE
    if "HARD OUTPUT LOCK (FINAL CHECK)" not in t:
        t = t.rstrip() + CLOSING_LOCK
    return t.strip()


def ensure_quality_negatives(text: str) -> str:
    t = apply_replacements((text or "").strip())
    # Always refresh negatives block
    t = re.sub(
        r",?\s*exactly one product hero only.*$",
        "",
        t,
        flags=re.I,
    ).rstrip(", ")
    if not t:
        return QUALITY_NEGATIVES
    return t + ", " + QUALITY_NEGATIVES


def patch_row(row: dict) -> bool:
    changed = False
    for key in TEXT_KEYS:
        if key not in row or row[key] is None:
            continue
        old = str(row[key])
        if key == "still_edit_prompt":
            # Always refresh to hard cleanup (sheet was blank / soft)
            if old.strip() != STILL_EDIT_HARD:
                row[key] = STILL_EDIT_HARD
                changed = True
            continue
        if key == "quality_suffix":
            new = ensure_quality_negatives(apply_replacements(old))
            if new != old:
                row[key] = new
                changed = True
            continue
        if not old.strip():
            continue
        if key in ("lab_item", "video_prompt", "scene_brief", "product_hero"):
            new = ensure_single_rule(old)
        else:
            new = apply_replacements(old)
            if re.search(r"\b(vial|pen)\b", new, re.I) and "SINGLE HERO PRODUCT RULE" not in new:
                new = ensure_single_rule(new)
        if new != old:
            row[key] = new
            changed = True
    return changed


def patch_csv(path: Path) -> int:
    if not path.exists():
        print(f"skip missing {path.name}")
        return 0
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fields = list(rows[0].keys()) if rows else []
    n = 0
    for r in rows:
        if patch_row(r):
            n += 1
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    return n


def patch_json(path: Path) -> int:
    if not path.exists():
        print(f"skip missing {path.name}")
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data if isinstance(data, list) else data.get("creations") or data.get("items") or []
    n = 0
    for r in items:
        if isinstance(r, dict) and patch_row(r):
            n += 1
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return n


def audit(path: Path) -> None:
    if not path.exists():
        return
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    bad = []
    dup_pack = 0
    edit_filled = 0
    for r in rows:
        if (r.get("still_edit_prompt") or "").strip():
            edit_filled += 1
        blob = " ".join(
            (r.get(k) or "") for k in ("lab_item", "video_prompt", "material_detail", "scene_brief")
        )
        if re.search(
            r"10ml Sterile Multi-Use Vial' with bright blue flip-off", blob, re.I
        ):
            dup_pack += 1
        scrub = re.sub(
            r"SINGLE HERO PRODUCT RULE.*?(?:Period\.|forbidden\.)",
            " ",
            blob,
            flags=re.I | re.S,
        )
        scrub = re.sub(
            r"VIAL PACKAGING RULE.*?(?:duplicate labels\.|NO duplicate labels\.)",
            " ",
            scrub,
            flags=re.I | re.S,
        )
        scrub = re.sub(r"Avoid:.*", " ", scrub, flags=re.I)
        flags = []
        if re.search(r"\bcarousel of research pens\b", scrub, re.I):
            flags.append("carousel pens")
        if re.search(r"\bconstellation of\b", scrub, re.I):
            flags.append("constellation")
        if re.search(r"carton silhouette plus", scrub, re.I):
            flags.append("carton+vial")
        if re.search(r"\bmulti-vial\b", scrub, re.I):
            flags.append("multi-vial")
        if re.search(
            r"\b(row|rack|cluster|array|lineup|pair|set) of (?:research )?(?:vials|pens)\b",
            scrub,
            re.I,
        ):
            flags.append("group of vials/pens")
        if flags:
            bad.append((r.get("creation_id") or r.get("lab_item_id"), flags))
    print(f"AUDIT {path.name}: {len(bad)} suspect, dup_pack={dup_pack}, still_edit_filled={edit_filled}/{len(rows)}")
    for cid, flags in bad[:15]:
        print(" ", cid, flags)


def main() -> None:
    for p in CSV_PATHS:
        n = patch_csv(p)
        print(f"{p.name}: patched {n} rows")
        audit(p)
    for p in JSON_PATHS:
        n = patch_json(p)
        print(f"{p.name}: patched {n} items")


if __name__ == "__main__":
    main()
