#!/usr/bin/env python3
"""Collect every compound identification string, pens and vials, into one text file.

Reads the three live-sheet mirrors and pulls out only the parts of video_prompt that
name the product: the printed label strings and the clause that carries them. Nothing
is composed here -- every string is quoted from a sheet, so the output is a report and
never a source of truth. If a compound is missing a string the sheet is missing it too.

    python3 marketing/scripts/build_compound_identification_txt.py

Writes marketing/compound-identification-prompts.txt
"""

import csv
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHEETS = ROOT / "marketing" / "sheets"
OUT = ROOT / "marketing" / "compound-identification-prompts.txt"

VIAL_TABS = {
    "9-lab-item-creations-500": SHEETS / "9-lab-item-creations-500.csv",
    "500_Peptide_Wellness_Reel_Scenes": SHEETS / "500_Peptide_Wellness_Reel_Scenes.csv",
}
PEN_TAB = SHEETS / "14-pen-creations-150.csv"

RED = "#A63334"
VIAL_FIELDS = {
    "name": re.compile(
        r"compound name in large bold brick red " + re.escape(RED) + r" reading exactly '([^']*)'"
    ),
    "dose": re.compile(r"dose bar with white text reading exactly '([^']*)'"),
    "conc": re.compile(r"black concentration line under the bar reading exactly '([^']*)'"),
    "footer": re.compile(r"small black footer reading exactly '([^']*)'"),
}
VIAL_NO_CONC = re.compile(r"NO mg/ml concentration line anywhere \(do not invent one\)")
VIAL_BODY = re.compile(r"This is the (\d+)ml multi-dose vial")
VIAL_CLAUSE = re.compile(r"(Label: white face with .*?fully legible at full resolution\.)")

PEN_SHOWS = re.compile(r'The pen label shows ONLY "([^"]*)" and the badge "([^"]*)"')
PEN_LABELED = re.compile(r"research pen labeled '([^']*)'")
PEN_TAIL = re.compile(r"(LABEL: only '([^']*)' and badge '([^']*)'\.[^\n]*)")
PEN_CLAUSE = re.compile(
    r"(HARD RULE \(stills and video, READ FIRST\): The pen label shows ONLY .*?never burned into the still or the video\.)"
)


def read(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def vial_ident(prompt):
    out = {}
    for key, pat in VIAL_FIELDS.items():
        m = pat.search(prompt)
        out[key] = m.group(1) if m else None
    if out["conc"] is None and VIAL_NO_CONC.search(prompt):
        out["conc"] = "(none - sheet says do not invent one)"
    m = VIAL_BODY.search(prompt)
    out["body"] = f"{m.group(1)}ml" if m else None
    m = VIAL_CLAUSE.search(prompt)
    out["clause"] = m.group(1) if m else None
    return out


def pen_ident(prompt):
    out = {"name": None, "badge": None, "clause": None, "tail": None}
    m = PEN_SHOWS.search(prompt)
    if m:
        out["name"], out["badge"] = m.group(1), m.group(2)
    m = PEN_CLAUSE.search(prompt)
    if m:
        out["clause"] = m.group(1)
    m = PEN_TAIL.search(prompt)
    if m:
        out["tail"] = m.group(1)
        # The prompt states the label three times; they have to agree or the model picks one.
        if out["name"] and (m.group(2) != out["name"] or m.group(3) != out["badge"]):
            out["disagrees"] = True
    m = PEN_LABELED.search(prompt)
    if m and out["name"] and m.group(1) != out["name"]:
        out["disagrees"] = True
    return out


def collect(rows, extract, keys):
    """selector -> {identification tuple -> (count, first full record)}"""
    got = defaultdict(lambda: defaultdict(lambda: [0, None]))
    for row in rows:
        sel = (row.get("compound_name") or "").strip()
        ident = extract(row.get("video_prompt") or "")
        sig = tuple(ident.get(k) for k in keys)
        slot = got[sel][sig]
        slot[0] += 1
        if slot[1] is None:
            slot[1] = ident
    return got


def wrap(text, width=96, indent="    "):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > width:
            lines.append(indent + cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(indent + cur)
    return lines


def main():
    for p in [*VIAL_TABS.values(), PEN_TAB]:
        if not p.exists():
            sys.exit(f"missing mirror: {p}")

    vials = {name: collect(read(p), vial_ident, ["name", "dose", "conc", "footer", "body"])
             for name, p in VIAL_TABS.items()}
    pens = collect(read(PEN_TAB), pen_ident, ["name", "badge"])

    primary = vials["9-lab-item-creations-500"]
    secondary = vials["500_Peptide_Wellness_Reel_Scenes"]

    L = []
    add = L.append

    add("PALM BEACH VITALITY - COMPOUND IDENTIFICATION STRINGS")
    add("=" * 96)
    add("")
    add("Every string the image model is told to print on a product, vials and pens, in one place.")
    add("Quoted verbatim from the live sheet mirrors. Nothing here was composed for this file: if a")
    add("string looks wrong, fix the sheet, not this file, then regenerate:")
    add("")
    add("    python3 marketing/scripts/build_compound_identification_txt.py")
    add("")
    add("Sources")
    add(f"  vials  marketing/sheets/9-lab-item-creations-500.csv          ({sum(c for v in primary.values() for c, _ in v.values())} rows)")
    add(f"  vials  marketing/sheets/500_Peptide_Wellness_Reel_Scenes.csv  ({sum(c for v in secondary.values() for c, _ in v.values())} rows)")
    add(f"  pens   marketing/sheets/14-pen-creations-150.csv              ({sum(c for v in pens.values() for c, _ in v.values())} rows)")
    add("")
    add("A vial carries FOUR printed strings, a pen carries TWO. That is deliberate - the pen prompt")
    add("forbids a dose or concentration anywhere in frame, so a pen never shows mg or mg/mL.")
    add("")
    add("SELECTOR vs PRINTED NAME. The left-hand heading is the compound_name you type into")
    add("choose_compound. It is not always what gets printed: the blends need a unique selector")
    add("because the node matches on a two-way substring. Print name is the quoted string.")
    add("")

    # ---------------- vials ----------------
    add("")
    add("=" * 96)
    add("VIALS")
    add("=" * 96)
    add("")
    for sel in sorted(primary, key=str.lower):
        variants = primary[sel]
        add("-" * 96)
        head = sel
        skus = len(variants)
        if skus > 1:
            head += f"     [{skus} SKUs on the sheet]"
        add(head)
        add("-" * 96)
        for sig, (count, ident) in sorted(variants.items(), key=lambda kv: -kv[1][0]):
            add(f"  rows: {count}")
            add(f"  print name     {ident['name']!r}")
            add(f"  dose bar       {ident['dose']!r}")
            add(f"  concentration  {ident['conc']!r}")
            add(f"  footer         {ident['footer']!r}")
            add(f"  vial body      {ident['body']!r}")
            if ident["clause"]:
                add("  copy:")
                L.extend(wrap(ident["clause"]))
            else:
                add("  copy:          MISSING - no label clause found in video_prompt")
            add("")

    # ---------------- pens ----------------
    add("")
    add("=" * 96)
    add("PENS")
    add("=" * 96)
    add("")
    for sel in sorted(pens, key=str.lower):
        variants = pens[sel]
        add("-" * 96)
        add(sel)
        add("-" * 96)
        for sig, (count, ident) in sorted(variants.items(), key=lambda kv: -kv[1][0]):
            add(f"  rows: {count}")
            add(f"  print name     {ident['name']!r}")
            add(f"  badge          {ident['badge']!r}")
            add("  dose / conc    none - a pen never prints mg or mg/mL")
            if ident.get("disagrees"):
                add("  WARNING        the prompt states the label more than once and the copies disagree")
            if ident["clause"]:
                add("  copy:")
                L.extend(wrap(ident["clause"]))
            if ident["tail"]:
                add("  copy (tail):")
                L.extend(wrap(ident["tail"]))
            add("")

    # ---------------- cross checks ----------------
    add("")
    add("=" * 96)
    add("CROSS-CHECKS")
    add("=" * 96)
    add("")

    add("Same product, different printed name by form factor:")
    printed_vial = {s: {i["name"] for _, i in v.values()} for s, v in primary.items()}
    printed_pen = {s: {i["name"] for _, i in v.values()} for s, v in pens.items()}

    def same_product(a, b):
        """Roman-numeral and case differences still mean the same SKU."""
        norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower()).replace("iii", "3").replace("ii", "2")
        return norm(a) == norm(b)

    clashes = []
    for vsel, vnames in printed_vial.items():
        for psel, pnames in printed_pen.items():
            for vn in vnames:
                for pn in pnames:
                    if vn != pn and same_product(vn, pn):
                        clashes.append((vn, pn, vsel, psel))
    if clashes:
        for vn, pn, vsel, psel in sorted(set(clashes)):
            add(f"  vial prints {vn!r} (selector {vsel!r})  but pen prints {pn!r} (selector {psel!r})")
        add("")
        add("  These are the same product wearing two different names. Pick one spelling per product")
        add("  and fix the losing sheet; a reel that cuts a vial next to a pen shows both.")
    else:
        add("  none")
    add("")

    add("Vial label agreement between the two vial tabs:")
    diffs = []
    for sel in sorted(set(primary) | set(secondary)):
        a = set(primary.get(sel, {}))
        b = set(secondary.get(sel, {}))
        if sel not in primary:
            diffs.append(f"  {sel}: on the wellness tab only")
        elif sel not in secondary:
            diffs.append(f"  {sel}: on Sheet 9 only")
        elif a != b:
            extra_9 = a - b
            extra_w = b - a
            if extra_9:
                diffs.append(f"  {sel}: Sheet 9 also prints {sorted(extra_9)}")
            if extra_w:
                diffs.append(f"  {sel}: wellness also prints {sorted(extra_w)}")
    L.extend(diffs or ["  identical on both tabs"])
    add("")

    # Compare on the printed product, not the selector: the two spelling clashes above would
    # otherwise show up as four one-sided products.
    norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower()).replace("iii", "3").replace("ii", "2")
    vial_products = {norm(n): n for names in printed_vial.values() for n in names}
    pen_products = {norm(n): n for names in printed_pen.values() for n in names}

    add("Products with a pen but no vial:")
    only_pen = sorted(pen_products[k] for k in set(pen_products) - set(vial_products))
    L.extend([f"  {s}" for s in only_pen] or ["  none"])
    add("")
    add("Products with a vial but no pen:")
    only_vial = sorted(vial_products[k] for k in set(vial_products) - set(pen_products))
    L.extend([f"  {s}" for s in only_vial] or ["  none"])
    add("")
    add(f"Products in both forms: {len(set(vial_products) & set(pen_products))}")
    add("")

    missing = []
    for label, table, keys in [("vial", primary, ["name", "dose", "conc", "footer", "body"]),
                               ("pen", pens, ["name", "badge"])]:
        for sel, variants in table.items():
            for _, (count, ident) in variants.items():
                blank = [k for k in keys if not ident.get(k)]
                if blank:
                    missing.append(f"  {label} {sel}: missing {blank} on {count} row(s)")
    add("Rows missing an identification string:")
    L.extend(sorted(missing) or ["  none - every row names its own product"])
    add("")

    OUT.write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}  ({len(L)} lines)")
    print(f"  vials {len(primary)} selectors, pens {len(pens)} selectors")
    if clashes:
        print(f"  {len(clashes)} printed-name clash(es) between pen and vial")
    if missing:
        print(f"  {len(missing)} row group(s) missing a string")


if __name__ == "__main__":
    main()
