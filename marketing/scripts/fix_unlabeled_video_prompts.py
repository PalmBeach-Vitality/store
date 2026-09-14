#!/usr/bin/env python3
"""Repair the 70 Sheet 9 rows whose video_prompt carries no hard locks.

grok_imagine_reel_still sends only video_prompt, so whatever that field omits
simply does not reach the still. 70 of the 500 live rows predate the lock
blocks: they never name their compound, and they carry none of LABEL
REQUIREMENT, VIAL STATE RULE, SINGLE HERO PRODUCT RULE, PRODUCT COUNT MUST
EQUAL 1, or NO DOUBLES ANYWHERE. Median length is 1905 chars against 5859 for
the other 430. Those rows can return an unlabeled vial, several vials, or a
vial being filled.

The repair is verbatim house text, not new wording:

  1. Name the compound inside the two generic label phrases.
  2. Append the lock tail that 48 live rows already end with, which is the only
     variant carrying all five markers in one block.

Nothing else in the row is touched, and the other 430 rows are passed through
byte-identical. video_prompt is column U, so the output is a single-column
paste over U2:U501.

    python3 marketing/scripts/fix_unlabeled_video_prompts.py [--write]
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "sheets"
CSV9 = SHEETS / "9-lab-item-creations-500.csv"
CSV9_250 = SHEETS / "9-lab-item-creations-250.csv"
JSON9 = ROOT / "pbvita-500-lab-item-creations.json"
JSON9_250 = ROOT / "pbvita-250-lab-item-creations.json"
OUT_TSV = SHEETS / "9-lab-item-creations-video-prompt-column.tsv"
OUT_DIFF = SHEETS / "9-lab-item-creations-unlabeled-70-fix.csv"
# creation_id + video_prompt for the repaired rows only, so a Google Sheets
# update node can match on creation_id and leave the other 430 alone.
OUT_JSON = SHEETS / "9-lab-item-creations-unlabeled-70-fix.json"

MARKERS = (
    "LABEL REQUIREMENT",
    "VIAL STATE RULE",
    "SINGLE HERO PRODUCT RULE",
    "PRODUCT COUNT MUST EQUAL 1",
    "NO DOUBLES ANYWHERE",
)

# The generic phrases the 70 rows use in place of a name. Order matters: the
# first contains the second, so the longer one is substituted first.
GENERIC = (
    "the exact compound name in large bold dark maroon type",
    "compound name in large bold dark maroon",
)


def word_re(name: str) -> re.Pattern:
    return re.compile(r"(?<![A-Za-z0-9-])" + re.escape(name) + r"(?![A-Za-z0-9-])")


def load(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), [dict(r) for r in reader]


def house_tail(rows: list[dict[str, str]]) -> str:
    """The lock tail shared by live rows, with the compound name as <NAME>.

    Taken from the sheet rather than written here, so the repair cannot drift
    from what the approved rows already say.
    """
    seen: dict[str, int] = {}
    for r in rows:
        vp, name = r["video_prompt"], r["compound_name"]
        i = vp.find("LABEL REQUIREMENT")
        if i == -1 or not word_re(name).search(vp):
            continue
        tail = vp[i:].replace(name, "<NAME>")
        if all(m in tail for m in MARKERS):
            seen[tail] = seen.get(tail, 0) + 1
    if not seen:
        raise SystemExit("no live row carries all five markers in one tail block")
    tail, n = max(seen.items(), key=lambda kv: kv[1])
    print(f"house tail: {len(tail)} chars, shared verbatim by {n} live rows")
    return tail


def repair(row: dict[str, str], tail: str) -> str:
    name = row["compound_name"]
    vp = row["video_prompt"]
    for phrase in GENERIC:
        if phrase in vp:
            named = phrase.replace("compound name", f"compound name '{name}'")
            vp = vp.replace(phrase, named)
    if not vp.rstrip().endswith("."):
        vp = vp.rstrip() + "."
    return vp.rstrip() + " " + tail.replace("<NAME>", name)


def main() -> None:
    write = "--write" in sys.argv[1:]
    columns, live = load(CSV9)
    if len(live) != 500:
        raise SystemExit(f"expected 500 live rows, found {len(live)}")

    broken = [
        r for r in live if not word_re(r["compound_name"]).search(r["video_prompt"] or "")
    ]
    print(f"{len(broken)} rows have no compound name in video_prompt")

    tail = house_tail(live)
    before = {r["creation_id"]: r["video_prompt"] for r in live}
    fixed = []
    for r in live:
        if r["creation_id"] in {b["creation_id"] for b in broken}:
            r["video_prompt"] = repair(r, tail)
            fixed.append(r)

    qa(live, fixed, before, columns)

    idx = columns.index("video_prompt")
    col = chr(ord("A") + idx // 26 - 1) + chr(ord("A") + idx % 26) if idx >= 26 else chr(ord("A") + idx)
    OUT_TSV.write_text(
        "".join(r["video_prompt"] + "\n" for r in live), encoding="utf-8"
    )
    print(
        f"\nwrote {OUT_TSV.relative_to(ROOT.parent)} ({len(live)} values) "
        f"-> paste into {col}2, fills {col}2:{col}{len(live) + 1}"
    )

    with OUT_DIFF.open("w", newline="\n", encoding="utf-8") as handle:
        w = csv.writer(handle, lineterminator="\n")
        w.writerow(["creation_id", "compound_name", "video_prompt_before", "video_prompt_after"])
        for r in fixed:
            w.writerow(
                [r["creation_id"], r["compound_name"], before[r["creation_id"]], r["video_prompt"]]
            )
    print(f"wrote {OUT_DIFF.relative_to(ROOT.parent)} ({len(fixed)} before/after pairs)")

    OUT_JSON.write_text(
        json.dumps(
            {
                "count": len(fixed),
                "rows": [
                    {"creation_id": r["creation_id"], "video_prompt": r["video_prompt"]}
                    for r in fixed
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT_JSON.relative_to(ROOT.parent)} ({len(fixed)} rows)")

    if not write:
        print("dry run — Sheet 9 mirror untouched. Re-run with --write to apply.")
        return

    for path in (CSV9, CSV9_250):
        with path.open("w", newline="\n", encoding="utf-8") as handle:
            w = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
            w.writeheader()
            w.writerows(live)
        print(f"wrote {path.relative_to(ROOT.parent)}")
    payload = {"count": len(live), "creations": live}
    for path in (JSON9, JSON9_250):
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT.parent)}")


def qa(live, fixed, before, columns) -> None:
    fail = []

    def check(label: str, ok: bool, detail: str = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")
        if not ok:
            fail.append(label)

    print(f"\nQA on {len(fixed)} repaired rows:")
    check("70 rows repaired", len(fixed) == 70)

    unnamed = [
        r["creation_id"]
        for r in live
        if not word_re(r["compound_name"]).search(r["video_prompt"])
    ]
    check("all 500 rows now name their compound", not unnamed, str(unnamed[:5]))

    for m in MARKERS:
        missing = [r["creation_id"] for r in live if m not in r["video_prompt"]]
        check(f"all 500 rows carry {m}", not missing, str(missing[:3]))

    untouched = [r for r in live if r["creation_id"] not in {f["creation_id"] for f in fixed}]
    check(
        "the other 430 rows are byte-identical",
        all(r["video_prompt"] == before[r["creation_id"]] for r in untouched),
    )
    check("430 untouched + 70 repaired == 500", len(untouched) + len(fixed) == 500)

    # The repair only appends and names; it must not drop any original text.
    lost = [
        r["creation_id"]
        for r in fixed
        if not r["video_prompt"].startswith(before[r["creation_id"]][:200])
    ]
    check("original prompt opening preserved", not lost, str(lost[:5]))

    # A foreign compound name on a label is the failure this whole pass exists
    # to prevent, so the appended tail must not introduce one.
    cat = json.loads((ROOT / "compound-vial-labels.json").read_text())
    names = set(cat["labels"]) | set(cat.get("aliases") or {})
    foreign = {}
    for r in fixed:
        own = {p.strip() for p in [r["compound_name"], *r["compound_name"].split("/")]}
        hits = sorted(n for n in names if n not in own and word_re(n).search(r["video_prompt"]))
        if hits:
            foreign[r["creation_id"]] = hits
    check("no foreign compound name in a repaired prompt", not foreign, json.dumps(foreign)[:200])

    dirty = [r["creation_id"] for r in live if re.search(r"[\t\r\n]", r["video_prompt"])]
    check("no tab or newline in any value (paste-safe)", not dirty, str(dirty[:5]))

    if fail:
        raise SystemExit(f"\n{len(fail)} QA check(s) failed: {fail}")
    print("  all checks passed")


if __name__ == "__main__":
    main()
