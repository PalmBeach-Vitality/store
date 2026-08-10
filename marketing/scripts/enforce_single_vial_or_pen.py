#!/usr/bin/env python3
"""CRITICAL: exactly ONE vial OR ONE pen per creation image — never both, never multiples.

Patches Sheet 9 / 8 / 12 (+250 compat) and JSON export.
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
    "SINGLE HERO PRODUCT RULE (MANDATORY — CRITICAL): The frame may contain exactly ONE "
    "research product hero — either ONE vial OR ONE pen — never both, never two, never a "
    "row/rack/carousel/constellation/cluster/shelf/array of vials or pens. No second vial in "
    "reflection as a readable duplicate hero. No carton + vial double hero. Background lab "
    "architecture is fine; extra vials or pens as props are forbidden."
)

TEXT_KEYS = (
    "lab_item",
    "video_prompt",
    "material_detail",
    "scene_brief",
    "product_hero",
    "product_form_detail",
    "still_edit_prompt",
)

# Order matters — longer / more specific first
REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
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
    # constellation / cluster language even when "single" was already inserted
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
    # multi pens
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
    # truncated scene_brief leftovers
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
    # generic plurals in hero/focal phrasing (not in NO-lists)
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
]

# Soften packaging-rule plurals that teach the model "vials" as the subject
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


def apply_replacements(text: str) -> str:
    out = text or ""
    for pat, repl in REPLACEMENTS:
        out = pat.sub(repl, out)
    for pat, repl in PACKAGING_PLURAL_FIXES:
        out = pat.sub(repl, out)
    # collapse accidental "a a single"
    out = re.sub(r"\ba a single\b", "a single", out, flags=re.I)
    out = re.sub(r"\s{2,}", " ", out)
    return out


def ensure_single_rule(text: str) -> str:
    t = apply_replacements(text or "")
    if "SINGLE HERO PRODUCT RULE" in t:
        # refresh wording to latest
        t = re.sub(
            r"SINGLE HERO PRODUCT RULE \(MANDATORY[^\)]*\):.*?(?:extra vials or pens as props are forbidden\.|never a row[^.]*\.)",
            SINGLE_RULE,
            t,
            count=1,
            flags=re.I | re.DOTALL,
        )
        return t

    # Insert after packaging rule if present, else before label instruction / NO DOUBLES
    if "VIAL PACKAGING RULE (MANDATORY):" in t:
        t = re.sub(
            r"(VIAL PACKAGING RULE \(MANDATORY\):.*?(?:NO duplicate labels\.|NO second vial, NO duplicate labels\.))",
            r"\1 " + SINGLE_RULE,
            t,
            count=1,
            flags=re.I | re.DOTALL,
        )
        if "SINGLE HERO PRODUCT RULE" in t:
            return t

    markers = [
        "If the single hero vial or single hero pen shows a product name",
        "If any vial, pen, carton panel",
        "ABSOLUTE RULE — NO DOUBLES",
        "ABSOLUTE RULE - NO DOUBLES",
        "Quality: ultra detailed",
    ]
    for marker in markers:
        idx = t.find(marker)
        if idx != -1:
            return t[:idx].rstrip() + " " + SINGLE_RULE + " " + t[idx:]
    return (t.rstrip() + " " + SINGLE_RULE).strip()


def patch_row(row: dict) -> bool:
    changed = False
    for key in TEXT_KEYS:
        if key not in row or row[key] is None:
            continue
        old = str(row[key])
        if not old.strip():
            continue
        if key in ("lab_item", "video_prompt", "scene_brief", "product_hero"):
            new = ensure_single_rule(old)
        else:
            new = apply_replacements(old)
            # material_detail often holds the focal — attach rule if vial/pen present
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
    for r in rows:
        blob = " ".join((r.get(k) or "") for k in ("lab_item", "video_prompt", "material_detail", "scene_brief"))
        # ignore rule/avoid sentences when flagging plurals
        scrub = re.sub(r"SINGLE HERO PRODUCT RULE.*?(?:forbidden\.|props are forbidden\.)", " ", blob, flags=re.I | re.S)
        scrub = re.sub(r"VIAL PACKAGING RULE.*?(?:duplicate labels\.|NO duplicate labels\.)", " ", scrub, flags=re.I | re.S)
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
        if re.search(r"\b(row|rack|cluster|array|lineup|pair|set) of (?:research )?(?:vials|pens)\b", scrub, re.I):
            flags.append("group of vials/pens")
        # both vial and pen as positive heroes in focal
        focals = re.findall(r"focal — ([^;]+)", scrub, flags=re.I)
        for f in focals:
            if re.search(r"\bvial\b", f, re.I) and re.search(r"\bpen\b", f, re.I):
                flags.append("vial+pen focal")
        if flags:
            bad.append((r.get("creation_id") or r.get("lab_item_id"), flags))
    print(f"AUDIT {path.name}: {len(bad)} suspect rows")
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
