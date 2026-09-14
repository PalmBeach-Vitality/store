#!/usr/bin/env python3
"""Clean up four defects in the live 9-lab-item-creations-500 tab.

1. Foreign compound names inside video_prompt. Six rows describe the hero as
   "a <OTHER COMPOUND> research display", naming a compound the row is not
   about. video_prompt is the only text the still node sends to Grok, so a
   foreign name there can print on the vial. Rewrite it to the row's own
   compound.

2. The same "research display" phrase calls the hero "luminous yellow-green
   solution", which contradicts the VIAL STATE RULE fill colour locked lower
   down in the very same prompt. Drop the colour word so the state rule wins.

3. Liquid fill colour. Salvatore's rule: GLOW is blue, every other compound is
   crystal-clear colourless. Twelve non-GLOW rows carry GLOW's blue fill (one
   of them even keeps the "(GLOW only — blue liquid)" aside) and three GLOW
   rows are colourless. Snap both directions to the rule. The bright blue
   flip-off cap is a separate lock and is never touched.

4. scene_brief holds a stale copy of the prompt head. All 535 rows start the
   column with "VIAL VISUAL LOCK" instead of a brief, and 252 of those stale
   copies still name a compound the row is not about. Nothing sends
   scene_brief to an API, so this is a readability defect, not a generation
   one — but it makes the column useless for review. Re-derive it from the
   FULL SCENE BRIEF section of the row's own video_prompt.

Order matters: fixes 1-3 run first so 4 never re-derives a stale phrase.

Usage:

    python3 marketing/scripts/cleanup_sheet9_prompts.py            # dry run
    python3 marketing/scripts/cleanup_sheet9_prompts.py --write    # emit
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
MIRROR = SHEETS / "9-lab-item-creations-500.csv"

BRIEF_RE = re.compile(
    r"FULL SCENE BRIEF:\s*(.*?)\s*(?:VIAL STATE RULE|PEN STATE RULE|If the single hero)",
    re.S,
)
DISPLAY_RE = re.compile(
    r"a ([A-Za-z0-9\+\-/ ]{2,24}?) research display: luminous yellow-green solution"
)
# The vial fill. Only ever this sentence — the bright blue flip-off cap lives
# in a different clause and must survive untouched.
FILL_RE = re.compile(
    r"show a settled (crystal-clear colorless|clear bright blue) liquid fill "
    r"already inside the vial at a stable level(?: \(GLOW only — blue liquid\))?"
)
BLUE_FILL_COMPOUND = "GLOW"

# compound_name is a row selector, not always the label text. These rows carry
# a handle so choose_compound can address them without substring collisions.
ALIASES = {
    "CJC-1295": {"CJC", "CJC-1295", "Ipamorelin"},
    "Ipamorelin-Solo": {"Ipamorelin"},
    "Tesa-Ipa": {"Tesamorelin", "Ipamorelin", "Tesamorelin/Ipamorelin"},
    "CJC/Ipamorelin": {"CJC", "Ipamorelin", "CJC/Ipamorelin"},
    "GLOW": {"BPC-157", "TB-500", "GHK-Cu", "GLOW"},
    "KLOW": {"KPV", "BPC-157", "TB-500", "GHK-Cu", "KLOW"},
    "Wolverine": {"BPC-157", "TB-500", "Wolverine"},
}

LABEL_RE = re.compile(
    r"LABEL REQUIREMENT: if any label appears, it MUST read exactly '([^']+)'"
)


def label_name(row: dict[str, str]) -> str:
    """What this row actually prints on the vial."""
    match = LABEL_RE.search(row["video_prompt"])
    if not match:
        raise SystemExit(f"{row['creation_id']}: no LABEL REQUIREMENT clause")
    return match.group(1)


def own_names(row: dict[str, str]) -> set[str]:
    names = set(ALIASES.get(row["compound_name"], {row["compound_name"]}))
    names.add(label_name(row))
    return names


def fix_display_phrase(row: dict[str, str]) -> tuple[str, list[str]]:
    """Point the 'research display' phrase at this row's own compound."""
    own = own_names(row)
    swapped: list[str] = []

    def repl(match: re.Match[str]) -> str:
        named = match.group(1)
        if named in own:
            return match.group(0)
        swapped.append(named)
        return match.group(0).replace(named, label_name(row), 1)

    return DISPLAY_RE.sub(repl, row["video_prompt"]), swapped


def drop_display_colour(video_prompt: str) -> str:
    """The state rule owns the fill colour, not the scene brief."""
    return video_prompt.replace(
        "research display: luminous yellow-green solution",
        "research display: luminous solution",
    )


def fix_fill_colour(row: dict[str, str]) -> tuple[str, str | None]:
    """GLOW is blue. Everything else is crystal-clear colourless."""
    want = (
        "clear bright blue"
        if row["compound_name"] == BLUE_FILL_COMPOUND
        else "crystal-clear colorless"
    )
    changed: str | None = None

    def repl(match: re.Match[str]) -> str:
        nonlocal changed
        if match.group(1) != want or match.group(0).endswith(")"):
            changed = f"{match.group(1)} -> {want}"
        return (
            f"show a settled {want} liquid fill already inside the vial "
            "at a stable level"
        )

    return FILL_RE.sub(repl, row["video_prompt"]), changed


def derive_brief(video_prompt: str, creation_id: str) -> str:
    match = BRIEF_RE.search(video_prompt)
    if not match:
        raise SystemExit(f"{creation_id}: no FULL SCENE BRIEF section")
    return match.group(1).strip()


def foreign_hits(text: str, own: set[str], probe: list[str]) -> set[str]:
    return {
        p
        for p in probe
        if p not in own
        and re.search(r"(?<![A-Za-z0-9-])" + re.escape(p) + r"(?![A-Za-z0-9-])", text)
    }


def main() -> int:
    write = "--write" in sys.argv

    with MIRROR.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]

    probe = sorted({label_name(r) for r in rows} | {r["compound_name"] for r in rows})

    prompt_fixes: list[dict[str, str]] = []
    for row in rows:
        fixed, swapped = fix_display_phrase(row)
        if fixed != row["video_prompt"]:
            prompt_fixes.append(
                {
                    "creation_id": row["creation_id"],
                    "compound_name": row["compound_name"],
                    "replaced": ", ".join(sorted(set(swapped))),
                    "with": label_name(row),
                    "video_prompt_before": row["video_prompt"],
                    "video_prompt": fixed,
                }
            )
            row["video_prompt"] = fixed

    colour_fixes: list[str] = []
    for row in rows:
        dropped = drop_display_colour(row["video_prompt"])
        if dropped != row["video_prompt"]:
            colour_fixes.append(f"{row['creation_id']} yellow-green -> state rule")
            row["video_prompt"] = dropped

    fill_fixes: list[str] = []
    for row in rows:
        fixed, changed = fix_fill_colour(row)
        if fixed != row["video_prompt"]:
            fill_fixes.append(
                f"{row['creation_id']:18s} {row['compound_name']:16s} {changed or 'aside removed'}"
            )
            row["video_prompt"] = fixed

    brief_fixes: list[dict[str, str]] = []
    for row in rows:
        derived = derive_brief(row["video_prompt"], row["creation_id"])
        if derived != row["scene_brief"]:
            brief_fixes.append(
                {
                    "creation_id": row["creation_id"],
                    "scene_brief_before": row["scene_brief"],
                    "scene_brief": derived,
                }
            )
            row["scene_brief"] = derived

    print(f"video_prompt rewrites : {len(prompt_fixes)}")
    for fix in prompt_fixes:
        print(f"   {fix['creation_id']:18s} {fix['replaced']:14s} -> {fix['with']}")
    print(f"hero colour conflicts : {len(colour_fixes)}")
    print(f"fill colour rewrites  : {len(fill_fixes)}")
    for line in fill_fixes:
        print(f"   {line}")
    print(f"scene_brief rewrites  : {len(brief_fixes)}")

    # --- QA -----------------------------------------------------------------
    failures: list[str] = []

    def check(label: str, ok: bool, detail: object = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label} — {detail}")
        if not ok:
            failures.append(label)

    print("\nQA")
    leaks = [
        r["creation_id"]
        for r in rows
        if foreign_hits(r["video_prompt"], own_names(r), probe)
    ]
    check("no foreign compound name reaches video_prompt", not leaks, leaks or "clean")

    leaks_sb = [
        r["creation_id"]
        for r in rows
        if foreign_hits(r["scene_brief"], own_names(r), probe)
    ]
    check("no foreign compound name left in scene_brief", not leaks_sb, leaks_sb or "clean")

    stale = [r["creation_id"] for r in rows if r["scene_brief"].startswith("VIAL VISUAL LOCK")]
    check("scene_brief is a brief, not a prompt copy", not stale, f"{len(stale)} stale")

    wrong_fill = [
        f"{r['creation_id']}:{r['compound_name']}"
        for r in rows
        if ("clear bright blue liquid" in r["video_prompt"])
        != (r["compound_name"] == BLUE_FILL_COMPOUND)
    ]
    check("only GLOW has blue liquid", not wrong_fill, wrong_fill or "clean")

    no_fill = [r["creation_id"] for r in rows if not FILL_RE.search(r["video_prompt"])]
    check("every row still states a fill colour", not no_fill, f"{len(no_fill)} missing")

    caps = sum(r["video_prompt"].count("bright blue plastic flip-off cap") for r in rows)
    check("blue flip-off cap lock untouched", caps == len(rows), f"{caps}/{len(rows)}")

    aside = [r["creation_id"] for r in rows if "GLOW only — blue liquid" in r["video_prompt"]]
    check("the 'GLOW only' aside is gone", not aside, f"{len(aside)} left")

    yellow = [r["creation_id"] for r in rows if "yellow-green solution" in r["video_prompt"]]
    check("no hero colour contradicts the state rule", not yellow, f"{len(yellow)} left")

    markers = [
        "LABEL REQUIREMENT",
        "VIAL STATE RULE",
        "SINGLE HERO PRODUCT RULE",
        "PRODUCT COUNT MUST EQUAL 1",
        "NO DOUBLES ANYWHERE",
    ]
    for marker in markers:
        missing = [r["creation_id"] for r in rows if marker not in r["video_prompt"]]
        check(f"every row still carries {marker}", not missing, f"{len(missing)} missing")

    unnamed = [
        r["creation_id"] for r in rows if label_name(r) not in r["video_prompt"]
    ]
    check("every row still names its label compound", not unnamed, unnamed or "clean")

    for field, want in (("aspect_ratio", "9:16"), ("duration_seconds", "15"), ("resolution", "1080p")):
        off = sorted({r[field] for r in rows if r[field].strip() != want})
        check(f"{field} untouched at {want}", not off, off or "clean")

    dupe_briefs = {k: v for k, v in Counter(r["scene_brief"] for r in rows).items() if v > 1}
    print(f"  NOTE  duplicate scene_brief texts after resync: {len(dupe_briefs)}")

    if failures:
        print(f"\n{len(failures)} check(s) failed.")
        return 1
    print("\nAll checks passed.")

    if not write:
        print("\nDry run. Re-run with --write to emit the payloads and update the mirror.")
        return 0

    with MIRROR.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nwrote {MIRROR.relative_to(ROOT.parent)} ({len(rows)} rows)")

    audit = SHEETS / "9-lab-item-creations-cleanup.csv"
    with audit.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["creation_id", "field", "before", "after"])
        for fix in prompt_fixes:
            writer.writerow(
                [fix["creation_id"], "video_prompt", fix["video_prompt_before"], fix["video_prompt"]]
            )
        for fix in brief_fixes:
            writer.writerow(
                [fix["creation_id"], "scene_brief", fix["scene_brief_before"], fix["scene_brief"]]
            )
    print(f"wrote {audit.relative_to(ROOT.parent)}")

    # Only ship what moved. Every row's scene_brief changed; video_prompt did
    # not, and shipping all 535 of those quadruples the payload for nothing.
    touched_prompts = {f["creation_id"] for f in prompt_fixes}
    touched_prompts |= {line.split()[0] for line in colour_fixes}
    touched_prompts |= {line.split()[0] for line in fill_fixes}
    payload_rows = []
    for row in rows:
        entry = {"creation_id": row["creation_id"], "scene_brief": row["scene_brief"]}
        if row["creation_id"] in touched_prompts:
            entry["video_prompt"] = row["video_prompt"]
        payload_rows.append(entry)
    print(f"payload carries {len(touched_prompts)} rewritten video_prompt values")
    payload = SHEETS / "9-lab-item-creations-cleanup.json"
    payload.write_text(
        json.dumps({"count": len(payload_rows), "rows": payload_rows}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {payload.relative_to(ROOT.parent)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
