#!/usr/bin/env python3
"""Make the vial label on Sheet 9 big enough and specific enough to render.

The still that triggered this (Cagrilintide, 2026-09-14) came back with an
unreadable label. Three causes, all in ``video_prompt``:

1. No row said how large the vial should be, so the model built a wide
   environment shot and left the label ~155px across. Small type below roughly
   20px of glyph height does not resolve into letterforms.
2. The label spec ordered a "maroon dose bar with white dose text" and a
   "black concentration line" without ever saying what those read. Ask for
   text and withhold the words and you get text-shaped noise.
3. The prompt banned research-use disclaimer lines while ordering label
   elements it never filled in, so the model rendered the empty elements as
   the generic fine print it knows.

Plus a data bug: every row hardcoded a ``10ml`` footer, so the 5ml Cagrilintide
vial printed the wrong volume.

Dose resolution never invents. A row that already states its own mg / mg-per-ml
keeps it (BPC-157 legitimately ships as both 10mg and 20mg); everything else
comes from ``compound-vial-labels.json``. Disagreements are reported, not
silently reconciled.

Usage:
    python3 marketing/scripts/fix_vial_label_legibility.py --dry-run
    python3 marketing/scripts/fix_vial_label_legibility.py --write
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SHEET = REPO / "marketing/sheets/9-lab-item-creations-500.csv"
CATALOG = REPO / "marketing/compound-vial-labels.json"
OUT_JSON = REPO / "marketing/sheets/9-lab-item-creations-label-fix.json"
OUT_CSV = REPO / "marketing/sheets/9-lab-item-creations-label-fix.csv"

# Sheet compound_name selector handles -> the name actually printed on the vial.
HANDLE_TO_LABEL = {
    "CJC-1295": "CJC",
    "Ipamorelin-Solo": "Ipamorelin",
    "Tesa-Ipa": "Tesamorelin/Ipamorelin",
}
# Printed names that differ from the catalog key.
LABEL_TO_CATALOG = {"Melanotan II": "Melanotan 2"}

LABEL_SPEC_RE = re.compile(r"Label: white face.*?footer\.", re.S)
LABEL_REQ_RE = re.compile(
    r"LABEL REQUIREMENT: if any label appears.*?"
    r"(?:or repeated lettering\.|disclaimer lines on the label\.)",
    re.S,
)
HERO_NAME_RE = re.compile(
    r"If the single hero vial or single hero pen shows a product name.*?"
    r"disclaimer lines on the label\.",
    re.S,
)
PRINTED_NAME_RE = re.compile(
    r"LABEL REQUIREMENT: if any label appears, it MUST read exactly '([^']+)'"
)
# Doses the row already states, either in the label spec or in the scene copy.
# Four Cagrilintide rows carry a truncated value (``exactly '2.`` with an
# unbalanced quote), so both captures are shape-checked before they are trusted.
STATED_DOSE_RE = re.compile(
    r"(?:white text exactly|dosage bar with white text exactly) '([^']+)'"
    r"(?:, black concentration line (?:exactly )?'([^']+)')?"
)
DOSE_SHAPE = re.compile(r"^[0-9][0-9a-zA-Z/.+-]*(?: ?mg)?(?:/[0-9a-zA-Z/.+-]+)*$")
CONC_SHAPE = re.compile(r"^[0-9][0-9a-zA-Z/. +-]{0,24}mg/ml$")

# Four Cagrilintide rows had their FULL SCENE BRIEF cut mid-value, leaving
# ``concentration line exactly '2.`` butted straight against LABEL REQUIREMENT.
TRUNCATED_RE = re.compile(
    r"black concentration line exactly '[0-9][0-9. ]{0,6}(?=(?: LABEL REQUIREMENT)|$)"
)

HERO_SCALE = (
    "HERO SCALE (MANDATORY): the vial is the dominant object in the frame. The glass body "
    "fills 40-45% of the frame width and about two thirds of the frame height, standing "
    "upright and centred with the label squarely facing camera. The environment stays "
    "visible around and behind it, but the vial is never a small prop on a large bench and "
    "the label type is never too small to read."
)


def footer(vol: str) -> str:
    return f"{vol} Sterile Multi-Use Vial"


def label_spec(name: str, mg: str, conc: str | None, vol: str) -> str:
    head = (
        "Label: white face with dark red double-helix DNA icon at top, compound name in "
        f"large bold dark maroon reading exactly '{name}', maroon dose bar with white text "
        f"reading exactly '{mg}', "
    )
    if conc:
        middle = f"black concentration line under the bar reading exactly '{conc}', "
        count = "four"
    else:
        middle = "NO mg/ml concentration line anywhere (do not invent one), "
        count = "three"
    return (
        head
        + middle
        + f"small black footer reading exactly '{footer(vol)}'. All {count} strings are "
        "printed once, spelled exactly as written, in crisp sharp type that is fully "
        "legible at full resolution."
    )


def label_requirement(name: str, mg: str, conc: str | None, vol: str) -> str:
    if conc:
        strings = f"'{name}', '{mg}', '{conc}', and '{footer(vol)}'"
        count = "four"
    else:
        strings = f"'{name}', '{mg}', and '{footer(vol)}'"
        count = "three"
    return (
        f"LABEL REQUIREMENT: the label prints exactly {count} strings and nothing else — "
        f"{strings} — each printed once, alongside the dark red DNA helix icon. No other "
        "lettering anywhere on the label: no research-use disclaimer lines, no LAB codes, "
        "no lot numbers, no fine print, no motifs, no counters, no repeated lettering. "
        f"Any text that is not one of those {count} strings is wrong."
    )


def hero_name_sentence(name: str) -> str:
    return (
        f"The product name on the single hero vial reads exactly '{name}' — never invent "
        "other compound names, and never add research-use disclaimer lines on the label."
    )


def resolve(name: str, prompt: str, catalog: dict, aliases: dict) -> tuple[str, str | None, str, str | None]:
    """Return (mg, conc, vol, warning). Row-stated dose wins over the catalog."""
    key = LABEL_TO_CATALOG.get(name, name)
    key = aliases.get(key, key)
    entry = catalog.get(key)

    stated, malformed = None, None
    for m in STATED_DOSE_RE.finditer(prompt):
        mg, conc = m.group(1), m.group(2)
        if not DOSE_SHAPE.match(mg):
            continue
        if conc is not None and not CONC_SHAPE.match(conc):
            malformed = f"{name}: row's concentration is corrupt ({conc[:24]!r}) — used the catalog"
            conc = None if entry is None else entry["conc"]
        stated = (mg, conc)
        break

    if entry is None and stated is None:
        raise SystemExit(f"no dose for '{name}' in catalog and none stated in the row")

    if stated is None:
        return entry["mg"], entry["conc"], entry["vol"], None

    mg, conc = stated
    vol = entry["vol"] if entry else "10ml"
    warn = malformed
    if warn is None and entry and (entry["mg"] != mg or (entry["conc"] or "") != (conc or "")):
        warn = (
            f"{name}: row states {mg} / {conc or 'no conc'}; catalog says "
            f"{entry['mg']} / {entry['conc'] or 'no conc'} — kept the row"
        )
    return mg, conc, vol, warn


def close_truncation(text: str, conc: str | None, vol: str) -> str:
    tail = f"'{conc}', " if conc else ""
    close = (
        f"black concentration line exactly {tail}"
        f"and a small black footer reading '{footer(vol)}'."
    ) if conc else f"no concentration line, and a small black footer reading '{footer(vol)}'."
    return TRUNCATED_RE.sub(lambda _: close, text)


def rewrite(prompt: str, name: str, mg: str, conc: str | None, vol: str) -> str:
    prompt = close_truncation(prompt, conc, vol)
    spec = label_spec(name, mg, conc, vol)
    out, n = LABEL_SPEC_RE.subn(lambda _: spec + " " + HERO_SCALE, prompt, count=1)
    if n != 1:
        raise SystemExit(f"{name}: label spec not found")

    out, n = LABEL_REQ_RE.subn(lambda _: label_requirement(name, mg, conc, vol), out, count=1)
    if n != 1:
        raise SystemExit(f"{name}: LABEL REQUIREMENT not found")

    out = HERO_NAME_RE.sub(lambda _: hero_name_sentence(name), out, count=1)
    # Scene copy restates the footer on some rows; keep the volume consistent.
    out = out.replace(footer("10ml"), footer(vol))
    return re.sub(r"[ \t]+", " ", out).strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.write or args.dry_run):
        ap.error("pass --dry-run or --write")

    cat = json.loads(CATALOG.read_text())
    catalog, aliases = cat["labels"], cat.get("aliases", {})

    with SHEET.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fields = reader.fieldnames
        rows = [dict(r) for r in reader]

    warnings, changed, audit = [], [], []
    for r in rows:
        before = r["video_prompt"]
        m = PRINTED_NAME_RE.search(before)
        if not m:
            raise SystemExit(f"{r['creation_id']}: cannot read the printed label name")
        name = m.group(1)
        mg, conc, vol, warn = resolve(name, before, catalog, aliases)
        if warn and warn not in warnings:
            warnings.append(warn)
        after = rewrite(before, name, mg, conc, vol)
        # scene_brief is derived from FULL SCENE BRIEF, so it inherits both the
        # truncation and the wrong footer volume.
        brief = close_truncation(r.get("scene_brief", ""), conc, vol)
        r["scene_brief"] = brief.replace(footer("10ml"), footer(vol))
        if after != before:
            changed.append(r["creation_id"])
            audit.append(
                {
                    "creation_id": r["creation_id"],
                    "compound_name": r["compound_name"],
                    "printed_name": name,
                    "mg": mg,
                    "conc": conc or "",
                    "vol": vol,
                    "len_before": len(before),
                    "len_after": len(after),
                }
            )
        r["video_prompt"] = after

    # QA
    fails = []
    for r, a in zip(rows, audit):
        p = r["video_prompt"]
        if "maroon dose bar with white dose text" in p:
            fails.append(f"{r['creation_id']}: unfilled dose bar survived")
        if "HERO SCALE (MANDATORY)" not in p:
            fails.append(f"{r['creation_id']}: no hero scale clause")
        if p.count("HERO SCALE (MANDATORY)") != 1:
            fails.append(f"{r['creation_id']}: hero scale duplicated")
        if a["vol"] != "10ml" and footer("10ml") in p:
            fails.append(f"{r['creation_id']}: stale 10ml footer")
        if f"'{a['mg']}'" not in p:
            fails.append(f"{r['creation_id']}: dose {a['mg']} missing")
        if a["conc"] and f"'{a['conc']}'" not in p:
            fails.append(f"{r['creation_id']}: conc {a['conc']} missing")
        if not a["conc"] and "mg/ml concentration line anywhere" not in p:
            fails.append(f"{r['creation_id']}: missing the no-concentration instruction")
        if "if any label appears" in p:
            fails.append(f"{r['creation_id']}: old LABEL REQUIREMENT survived")

    longest = max(len(r["video_prompt"]) for r in rows)
    grew = max(a["len_after"] - a["len_before"] for a in audit)
    print(f"rows: {len(rows)}   rewritten: {len(changed)}")
    print(f"prompt length: max {longest} chars (grew at most {grew})")
    print(f"QA: {'PASS' if not fails else f'{len(fails)} FAIL'}")
    for f in fails[:20]:
        print("   ", f)
    if warnings:
        print("\ncatalog disagreements (row kept, catalog not applied):")
        for w in warnings:
            print("   ", w)
    if fails:
        return 1

    if args.write:
        with SHEET.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)
        OUT_JSON.write_text(
            json.dumps(
                [{"creation_id": r["creation_id"], "video_prompt": r["video_prompt"]} for r in rows],
                indent=1,
            )
            + "\n"
        )
        with OUT_CSV.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(audit[0].keys()))
            w.writeheader()
            w.writerows(audit)
        print(f"\nwrote {SHEET.name}, {OUT_JSON.name}, {OUT_CSV.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
