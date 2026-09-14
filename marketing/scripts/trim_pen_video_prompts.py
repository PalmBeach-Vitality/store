#!/usr/bin/env python3
"""Trim the duplicated blocks that pushed 14-pen-creations-150 video_prompt past its ceiling.

Every one of the 168 prompts carried three large blocks twice, which grew the value to
~8.5k and got the trailing copy cut off mid-word (139 rows) or mid-sentence (29 rows)
just before the closing "LABEL: only ..." line.

Each removal below is a verbatim repeat of text that survives elsewhere in the same
prompt, so no instruction is lost:

  1. HARD OUTPUT LOCK (READ FIRST) block  - repeated inside FULL SCENE BRIEF
  2. product_form_detail clause           - repeats the FORM section word for word
  3. trailing LABEL (MANDATORY) block     - the truncated copy; the complete one stays

Writes the trimmed mirror plus a JSON payload of creation_id -> video_prompt for the
live sheet update.

    python3 marketing/scripts/trim_pen_video_prompts.py --dry-run
    python3 marketing/scripts/trim_pen_video_prompts.py
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHEET = ROOT / "marketing/sheets/14-pen-creations-150.csv"
PAYLOAD = ROOT / "marketing/sheets/14-pen-creations-trim.json"

TAIL_RE = re.compile(
    r" LABEL: only '([^']*)' and badge '3ml Pen'\. No other text on the pen or in-frame\.$"
)
LABEL_HEAD = "LABEL (MANDATORY): clean white wrap-around barrel label."
LOCK_HEAD = "HARD OUTPUT LOCK (READ FIRST):"
LOCK_END = "FORBIDDEN: extra pens, production row, lineup, cluster, second pen. "
FORM_CLAUSE_RE = re.compile(r"product_form_detail — (.*?); lab_environment — ", re.S)

# Locks that must survive the trim, each still reachable by the model.
REQUIRED = [
    "PEN VISUAL LOCK",
    "HARD RULE (stills and video, READ FIRST):",
    LOCK_HEAD,
    "COLOR LOCK:",
    "FULL SCENE BRIEF:",
    "FORM (from",
    LABEL_HEAD,
    "HARD OUTPUT LOCK (FINAL CHECK)",
    "FORBIDDEN: orange DNA",
    "crimson red #DC143C",
]


def drop_repeat_lock(prompt: str) -> tuple[str, int]:
    """Delete later verbatim copies of the READ FIRST block."""
    start = prompt.find(LOCK_HEAD)
    if start == -1:
        return prompt, 0
    end = prompt.find(LOCK_END, start)
    if end == -1:
        return prompt, 0
    block = prompt[start : end + len(LOCK_END)]
    head, sep, rest = prompt.partition(block)
    if not sep:
        return prompt, 0
    trimmed = rest.count(block) * len(block)
    return head + sep + rest.replace(block, ""), trimmed


def drop_repeat_form(prompt: str) -> tuple[str, int]:
    """Delete the Supporting notes clause that restates the FORM section."""
    match = FORM_CLAUSE_RE.search(prompt)
    if not match:
        return prompt, 0
    detail = match.group(1)
    # Only safe to drop while the FORM section still carries the same wording.
    if prompt.count(detail) < 2:
        return prompt, 0
    return prompt[: match.start()] + "lab_environment — " + prompt[match.end() :], len(
        match.group(0)
    ) - len("lab_environment — ")


def drop_cut_label(prompt: str, creation_id: str) -> tuple[str, int]:
    """Delete the trailing LABEL block, which is where every prompt got cut."""
    tail = TAIL_RE.search(prompt)
    if not tail:
        raise SystemExit(f"{creation_id}: no closing LABEL line to anchor on")
    first = prompt.find(LABEL_HEAD)
    last = prompt.rfind(LABEL_HEAD, 0, tail.start())
    if last in (-1, first):
        return prompt, 0
    body = prompt[:last].rstrip()
    return body + prompt[tail.start() :], tail.start() - len(body)


def trim(row: dict[str, str]) -> tuple[str, dict[str, int]]:
    prompt = row["video_prompt"]
    prompt, lock = drop_repeat_lock(prompt)
    prompt, form = drop_repeat_form(prompt)
    prompt, label = drop_cut_label(prompt, row["creation_id"])
    prompt = re.sub(r" {2,}", " ", prompt).strip()
    return prompt, {"lock": lock, "form": form, "label": label}


def check(row: dict[str, str], before: str, after: str) -> None:
    cid = row["creation_id"]

    def fail(msg: str) -> None:
        raise SystemExit(f"{cid}: {msg}")

    tail = TAIL_RE.search(after)
    if not tail:
        fail("closing LABEL line lost")
    if not after.endswith("."):
        fail("prompt does not end on a sentence")
    if len(after) >= len(before):
        fail("trim did not shorten the prompt")
    for lock in REQUIRED:
        if lock not in after:
            fail(f"lost hard lock {lock!r}")
    if after.count(LOCK_HEAD) != 1 or after.count(LABEL_HEAD) != 1:
        fail("duplicate block survived the trim")
    # The label the pen wears has to stay spelled out in the surviving LABEL block.
    printed = tail.group(1)
    if after.count(printed) < 2:
        fail(f"printed label {printed!r} no longer named in the body")
    # Ragged punctuation predates this pass in some rows; only flag what the trim adds.
    for seam in ("  ", " ;", " ."):
        if after.count(seam) > before.count(seam):
            fail(f"trim introduced a ragged {seam!r} seam")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with SHEET.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]

    payload: list[dict[str, str]] = []
    saved = {"lock": 0, "form": 0, "label": 0}
    cut_before = 0
    for row in rows:
        before = row["video_prompt"]
        if not TAIL_RE.search(before):
            raise SystemExit(f"{row['creation_id']}: unexpected prompt shape")
        if not before[: TAIL_RE.search(before).start()].rstrip().endswith("."):
            cut_before += 1
        after, bytes_saved = trim(row)
        check(row, before, after)
        for key, value in bytes_saved.items():
            saved[key] += value
        row["video_prompt"] = after
        payload.append({"creation_id": row["creation_id"], "video_prompt": after})

    lengths = [len(r["video_prompt"]) for r in rows]
    print(f"rows trimmed            {len(rows)}")
    print(f"cut mid-sentence before {cut_before}")
    print(f"length now              {min(lengths)}-{max(lengths)} chars")
    print("duplicate bytes removed")
    print(f"  READ FIRST block      {saved['lock']:,}")
    print(f"  product_form_detail   {saved['form']:,}")
    print(f"  trailing LABEL block  {saved['label']:,}")

    if args.dry_run:
        print("\ndry run, nothing written")
        return 0

    with SHEET.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    PAYLOAD.write_text(
        json.dumps(
            {"count": len(payload), "fields": ["video_prompt"], "rows": payload},
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\nwrote {SHEET.relative_to(ROOT)}")
    print(f"wrote {PAYLOAD.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
