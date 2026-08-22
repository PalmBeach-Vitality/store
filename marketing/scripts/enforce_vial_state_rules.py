#!/usr/bin/env python3
"""CRITICAL vial state rules for Sheet 9 / 8 / 12.

- Exactly ONE vial per image/creation
- Vial ALWAYS upright (standing on base)
- Vial ALWAYS pre-filled before the still — never filling during still or video
- Clear colorless liquid for all compounds EXCEPT GLOW (bright blue liquid only)

Safe to re-run. Patches lab_item, video_prompt, material_detail, scene_brief,
video_motion_prompt, still_edit_prompt.
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

VIAL_STATE_CLEAR = (
    "VIAL STATE RULE (MANDATORY — CRITICAL): Exactly ONE vial only in the entire frame. "
    "The vial is ALWAYS upright — standing vertical on its base, never tipped, never on its side, "
    "never diagonal, never lying down. The vial is ALWAYS pre-filled before the still is captured: "
    "show a settled crystal-clear colorless liquid fill already inside the vial at a stable level. "
    "FORBIDDEN in still and video: pouring into the vial, filling up, rising liquid level, empty vial, "
    "half-filling animation, dripping into the vial, uncapping to fill, syringe/transfer into the vial, "
    "bubbling as if just poured. Liquid does not change level during video — pre-filled and static."
)

VIAL_STATE_GLOW = (
    "VIAL STATE RULE (MANDATORY — CRITICAL): Exactly ONE vial only in the entire frame. "
    "The vial is ALWAYS upright — standing vertical on its base, never tipped, never on its side, "
    "never diagonal, never lying down. The vial is ALWAYS pre-filled before the still is captured: "
    "show a settled clear bright blue liquid fill already inside the vial at a stable level "
    "(GLOW only — blue liquid). "
    "FORBIDDEN in still and video: pouring into the vial, filling up, rising liquid level, empty vial, "
    "half-filling animation, dripping into the vial, uncapping to fill, syringe/transfer into the vial, "
    "bubbling as if just poured. Liquid does not change level during video — pre-filled and static."
)

OLD_STATE = re.compile(
    r"VIAL STATE RULE \(MANDATORY[^\)]*\):.*?(?:pre-filled and static\.|Liquid does not change level during video[^.]*\.)",
    re.I | re.S,
)

TEXT_KEYS = (
    "lab_item",
    "video_prompt",
    "material_detail",
    "scene_brief",
    "video_motion_prompt",
    "still_edit_prompt",
    "product_hero",
    "product_form_detail",
)

# Motion / fill language that implies filling during video
FILL_MOTION_FIXES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bfilling (?:up |the )?vial\b", re.I), "holding a pre-filled upright vial"),
    (re.compile(r"\bvial filling\b", re.I), "pre-filled upright vial"),
    (re.compile(r"\bpouring into (?:the )?vial\b", re.I), "pre-filled upright vial at rest"),
    (re.compile(r"\bliquid (?:level )?ris(?:e|ing)\b", re.I), "liquid level held steady"),
    (re.compile(r"\bfills? with\b", re.I), "already filled with"),
    (re.compile(r"\bempty vial\b", re.I), "pre-filled upright vial"),
    (re.compile(r"\btipped vial\b", re.I), "upright vial"),
    (re.compile(r"\bvial on its side\b", re.I), "upright vial on its base"),
    (re.compile(r"\blying (?:down )?vial\b", re.I), "upright vial"),
]


def is_glow(row: dict) -> bool:
    name = str(row.get("compound_name") or "").strip()
    return name.upper() == "GLOW"


def apply_fill_fixes(text: str) -> str:
    out = text or ""
    for pat, repl in FILL_MOTION_FIXES:
        out = pat.sub(repl, out)
    return out


def ensure_state_rule(text: str, glow: bool) -> str:
    rule = VIAL_STATE_GLOW if glow else VIAL_STATE_CLEAR
    t = apply_fill_fixes(text or "")
    if OLD_STATE.search(t):
        t = OLD_STATE.sub(rule, t)
        return t
    if "VIAL STATE RULE" in t:
        # replace any short/old copy
        t = re.sub(
            r"VIAL STATE RULE \(MANDATORY[^\)]*\):.*?(?:pre-filled and static\.|Liquid does not change level during video[^.]*\.)",
            rule,
            t,
            count=1,
            flags=re.I | re.S,
        )
        if "VIAL STATE RULE" in t:
            return t

    # Insert after SINGLE HERO or PACKAGING rule if present
    for marker in (
        "SINGLE HERO PRODUCT RULE (MANDATORY — CRITICAL):",
        "VIAL PACKAGING RULE (MANDATORY):",
    ):
        if marker in t:
            # append state rule right after the matched rule sentence block ending with period
            # simpler: insert before label instruction / NO DOUBLES
            break

    insert_before = [
        "If the single hero vial or single hero pen shows a product name",
        "If any vial, pen, carton panel",
        "ABSOLUTE RULE — NO DOUBLES",
        "ABSOLUTE RULE - NO DOUBLES",
        "Quality: ultra detailed",
        "For laboratory research use only.",
    ]
    for marker in insert_before:
        idx = t.find(marker)
        if idx != -1:
            return t[:idx].rstrip() + " " + rule + " " + t[idx:]

    # After packaging / single hero if we can find end of those
    for end_mark in (
        "extra vials or pens as props are forbidden.",
        "NO second vial, NO duplicate labels.",
        "never a row/rack/carousel/constellation of vials or pens.",
    ):
        idx = t.lower().find(end_mark.lower())
        if idx != -1:
            end = idx + len(end_mark)
            return t[:end].rstrip() + " " + rule + " " + t[end:].lstrip()

    return (t.rstrip() + " " + rule).strip()


def patch_liquid_color_mentions(text: str, glow: bool) -> str:
    """Nudge generic liquid color language toward clear vs GLOW blue."""
    t = text or ""
    if glow:
        t = re.sub(
            r"\bcrystal-clear colorless liquid\b",
            "clear bright blue liquid",
            t,
            flags=re.I,
        )
        t = re.sub(
            r"\bclear colorless liquid\b",
            "clear bright blue liquid",
            t,
            flags=re.I,
        )
    else:
        # Don't strip GLOW rule text if somehow present; only generic blue fills on non-GLOW
        if "GLOW only" not in t:
            t = re.sub(
                r"\bclear bright blue liquid\b",
                "crystal-clear colorless liquid",
                t,
                flags=re.I,
            )
            t = re.sub(
                r"\bbright blue liquid fill\b",
                "crystal-clear colorless liquid fill",
                t,
                flags=re.I,
            )
    return t


def patch_row(row: dict) -> bool:
    glow = str(row.get("compound_name") or "").strip().upper() == "GLOW"
    changed = False
    for key in TEXT_KEYS:
        if key not in row or row[key] is None:
            continue
        old = str(row[key])
        if not old.strip():
            continue
        if key in ("lab_item", "video_prompt", "scene_brief", "material_detail", "video_motion_prompt"):
            new = ensure_state_rule(old, glow)
            new = patch_liquid_color_mentions(new, glow)
        else:
            new = apply_fill_fixes(old)
            new = patch_liquid_color_mentions(new, glow)
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
    state = sum(1 for r in rows if "VIAL STATE RULE" in (r.get("video_prompt") or ""))
    glow_blue = sum(
        1
        for r in rows
        if str(r.get("compound_name") or "").strip().upper() == "GLOW"
        and "bright blue liquid" in (r.get("video_prompt") or "")
    )
    glow_n = sum(1 for r in rows if str(r.get("compound_name") or "").strip().upper() == "GLOW")
    print(f"AUDIT {path.name}: state_rule={state}/{len(rows)} glow_blue={glow_blue}/{glow_n}")


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
