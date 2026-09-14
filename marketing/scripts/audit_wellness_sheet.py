#!/usr/bin/env python3
"""Audit the live 500_Peptide_Wellness_Reel_Scenes tab.

Reads the repo mirror (which must already be synced from live) and checks the
three things that can break a run:

  contract      -- the 12 fields pull_sheet_row refuses to run without, plus
                   the shapes prep_grok_video_start enforces
  reachability  -- whether choose_compound can address each compound at all,
                   given that pull_sheet_row matches substrings in BOTH
                   directions (typing 'CJC' also matches 'CJC/Ipamorelin')
  content       -- whether the prompt that actually reaches the image API
                   names its own compound, prints its own dose, and agrees
                   with the row's category and volume

Usage:
    python3 marketing/scripts/audit_wellness_sheet.py
"""

from __future__ import annotations

import collections
import csv
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SHEET = REPO / "marketing/sheets/500_Peptide_Wellness_Reel_Scenes.csv"
CATALOG = REPO / "marketing/compound-vial-labels.json"

# pull_sheet_row's `required` list, verbatim.
REQUIRED = [
    "video_prompt", "video_motion_prompt", "camera_move", "model_still",
    "model_video", "still_resolution", "duration_seconds", "resolution",
    "aspect_ratio", "wait_seconds", "still_n", "audio",
]
POSITIVE_NUMBER = ["duration_seconds", "wait_seconds", "still_n"]


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def matches(row_compound: str, wanted: str) -> bool:
    """pull_sheet_row.rowMatches, verbatim."""
    want, row = norm(wanted), norm(row_compound)
    if not want:
        return True
    if not row:
        return False
    return row == want or want in row or row in want


def main() -> int:
    with SHEET.open(newline="", encoding="utf-8") as fh:
        rows = [dict(r) for r in csv.DictReader(fh)]
    catalog = json.loads(CATALOG.read_text())["labels"]

    print(f"{len(rows)} rows, {len(rows[0])} columns\n")

    # ---------------------------------------------------------------- contract
    print("== CONTRACT")
    blank = collections.Counter()
    bad_shape = collections.Counter()
    for r in rows:
        for f in REQUIRED:
            if not str(r.get(f, "")).strip():
                blank[f] += 1
        for f in POSITIVE_NUMBER:
            try:
                if float(r.get(f, "")) <= 0:
                    bad_shape[f] += 1
            except ValueError:
                bad_shape[f] += 1
        if not re.fullmatch(r"\d+:\d+", str(r.get("aspect_ratio", "")).strip()):
            bad_shape["aspect_ratio"] += 1
        if str(r.get("status", "")).strip() != "Active":
            bad_shape["status"] += 1
    if blank:
        for f, n in blank.most_common():
            print(f"   BLANK  {f}: {n} rows -> pull_sheet_row throws")
    if bad_shape:
        for f, n in bad_shape.most_common():
            print(f"   SHAPE  {f}: {n} rows")
    if not blank and not bad_shape:
        print("   clean")

    ids = collections.Counter(r["creation_id"] for r in rows)
    dupes = {k: v for k, v in ids.items() if v > 1}
    print(f"   duplicate creation_id: {len(dupes)}" + (f" {list(dupes)[:5]}" if dupes else ""))

    # ------------------------------------------------------------ reachability
    print("\n== REACHABILITY (can choose_compound address the row?)")
    names = collections.Counter(r["compound_name"] for r in rows)
    unreachable, ambiguous = [], []
    for name, count in sorted(names.items()):
        hits = {n for n in names if matches(n, name)}
        if len(hits) > 1:
            ambiguous.append((name, count, sorted(hits)))
    ws = [n for n in names if n != n.strip()]
    for name, count, hits in ambiguous:
        others = [h for h in hits if h != name]
        print(f"   {name!r} ({count} rows) also pulls {others}")
    if ws:
        print(f"   WHITESPACE in compound_name: {ws}")
    if not ambiguous and not ws:
        print("   clean")

    # Which names win when typed, given the least-used sort.
    print("\n   winner when typed (times_used, then last_used_at, then rank):")
    for name in sorted(names):
        cand = [r for r in rows if matches(r["compound_name"], name)]
        cand.sort(key=lambda r: (
            int(float(r.get("times_used") or 0)),
            str(r.get("last_used_at") or ""),
            float(r.get("rank") or 0),
        ))
        win = cand[0]
        flag = "" if win["compound_name"] == name else "  <-- WRONG COMPOUND"
        if flag:
            print(f"      type {name!r} -> {win['creation_id']} ({win['compound_name']!r}){flag}")

    # ----------------------------------------------------------------- content
    print("\n== CONTENT")
    cats = collections.Counter(r["category"] for r in rows)
    print(f"   category: {dict(cats)}")

    # The label strings live in the HARD OUTPUT LOCK clause, not in a
    # VIAL DOSE LOCK -- the duplicate DOSE LOCK clause was deleted from
    # video_prompt but survives, unread, in still_edit_prompt.
    edit_lock = sum(1 for r in rows if "VIAL DOSE LOCK" in r["still_edit_prompt"])
    print(f"   'VIAL DOSE LOCK' in video_prompt:      "
          f"{sum(1 for r in rows if 'VIAL DOSE LOCK' in r['video_prompt'])}")
    print(f"   'VIAL DOSE LOCK' in still_edit_prompt: {edit_lock}   "
          "(no node reads still_edit_prompt)")

    # Two shapes: the old HARD OUTPUT LOCK phrasing and the Sheet 9 phrasing
    # the rebuild uses. Accept either so this stays a real check if the tab
    # ever regresses to the old text.
    bar = sum(1 for r in rows if re.search(
        r"bar white '[^']+'|dose bar with white text reading exactly '[^']+'", r["video_prompt"]))
    conc = sum(1 for r in rows if re.search(
        r"black '[^']*mg/ml'|concentration line under the bar reading exactly '[^']+'"
        r"|NO mg/ml concentration line anywhere", r["video_prompt"]))
    foot = sum(1 for r in rows if re.search(
        r"footer '[^']+'|footer reading exactly '[^']+'", r["video_prompt"]))
    print(f"   video_prompt gives an exact dose bar:  {bar}")
    print(f"   video_prompt gives an exact conc line: {conc}")
    print(f"   video_prompt gives an exact footer:    {foot}")

    scale = sum(1 for r in rows if re.search(
        r"HERO SCALE|frame width|fills? (?:at least |about )?\d+\s*(?:%|percent)"
        r"|\d+\s*(?:%|percent) of (?:the )?frame", r["video_prompt"], re.I))
    print(f"   video_prompt states a hero scale:      {scale}")

    # Does the label text name this row's own compound? compound_name is a
    # selector handle on four compounds (CJC-1295 prints 'CJC', Tesa-Ipa prints
    # 'Tesamorelin/Ipamorelin'), so compare against the printed name.
    handles = {"CJC-1295": "CJC", "Tesa-Ipa": "Tesamorelin/Ipamorelin",
               "Ipamorelin-Solo": "Ipamorelin", "TA-1": "TA-1"}
    named = []
    for r in rows:
        own = r["compound_name"].strip()
        printed = handles.get(own, own)
        if not re.search(rf"(?:maroon|reading exactly) '{re.escape(printed)}'",
                         r["video_prompt"]):
            named.append(r["creation_id"])
    print(f"   rows whose printed label is NOT their own compound: {len(named)}")
    if named:
        print(f"      {named[:8]}")

    # Every row is told to copy one specific compound's catalog still.
    donor = collections.Counter(
        m.group(1) for r in rows
        for m in [re.search(r"MUST copy the ([\w\-\+/ ]+?) catalog still", r["video_prompt"])]
        if m)
    print(f"   'MUST copy the X catalog still' donor: {dict(donor)}")
    wrong_donor = sum(1 for r in rows
                      for m in [re.search(r"MUST copy the ([\w\-\+/ ]+?) catalog still",
                                          r["video_prompt"])]
                      if m and norm(m.group(1)) != norm(r["compound_name"]))
    print(f"      rows pointed at another compound's still: {wrong_donor}")

    # Volume footer vs the catalog.
    vol_mismatch = []
    for r in rows:
        m = re.search(r"'(\d+)\s*ml Sterile", r["video_prompt"]) or \
            re.search(r"'(\d+)\s*ml Sterile", r["still_edit_prompt"])
        if not m:
            continue
        entry = catalog.get(r["compound_name"].strip())
        if entry and entry.get("vol") and entry["vol"] != f"{m.group(1)}ml":
            vol_mismatch.append((r["creation_id"], r["compound_name"], m.group(1) + "ml", entry["vol"]))
    print(f"   footer volume disagrees with the catalog: {len(vol_mismatch)}")
    for cid, name, got, want in vol_mismatch[:6]:
        print(f"      {cid} {name}: prints {got}, catalog says {want}")

    # Colour vocabulary for the label ink.
    inks = collections.Counter()
    for r in rows:
        for m in re.finditer(r"\b(dark maroon|maroon|dark red|brick red|crimson)\b",
                             r["video_prompt"], re.I):
            inks[m.group(1).lower()] += 1
    print(f"   label ink words in video_prompt: {dict(inks)}")

    pen_with_vial = [r["creation_id"] for r in rows
                     if r["category"] == "pen_3ml" and "VIAL VISUAL LOCK" in r["video_prompt"]]
    print(f"   pen_3ml rows carrying a VIAL VISUAL LOCK: {len(pen_with_vial)}")

    env_with_vial = [r["creation_id"] for r in rows
                     if r["category"] == "set_environment" and "VIAL VISUAL LOCK" in r["video_prompt"]]
    print(f"   set_environment rows carrying a VIAL VISUAL LOCK: {len(env_with_vial)}")

    lens = [len(r["video_prompt"]) for r in rows]
    print(f"   video_prompt length: {min(lens)}-{max(lens)} chars")

    return 0


if __name__ == "__main__":
    sys.exit(main())
