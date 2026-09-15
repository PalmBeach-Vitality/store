#!/usr/bin/env python3
"""Independently verify the comment bank against the live FDA compliance gate.

The rule lists below are transcribed verbatim from the `fda_compliance_gate`
Code node in n8n (workflow NSAwidweoS1JcTIJ), so a PASS here means the same
verdict the gate would return. Deliberately kept separate from
build-comment-bank.py: that script enforces this brief's ban list, this one
reproduces the gate. Exits non-zero if any comment is not a clean PASS.
"""

import csv
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

CSV_IN = Path(__file__).resolve().parent.parent / "tiktok_comment_bank.csv"

# Whole-word violations (gate: VTOK)
VTOK = [
    "cure", "cures", "cured", "curing", "treats", "therapy",
    "patient", "patients", "guaranteed", "dose", "dosage", "dosing", "heals",
]

# Prefix violations (gate: VSTEM)
VSTEM = ["inject", "syring"]

# Substring violations (gate: VMULTI)
VMULTI = [
    "treat your", "cure for", "fda approved", "fda-approved",
    "you will", "you'll", "lose weight", "fat loss", "burn fat",
    "weight loss", "anti-aging results", "reverse aging", "take daily",
    "mg/ml", "clinical use", "recommended for", "works for", "healing you",
]

# Substring cautions (gate: CMULTI)
CMULTI = [
    "not for human", "human use", "for human", "human consumption",
]


def normalize(text):
    text = unicodedata.normalize("NFKC", text)
    return text.replace("\u2019", "'").replace("\u2018", "'").lower()


def tokens(low):
    return re.findall(r"[a-z0-9]+", low)


def has_mg(toks):
    """Gate's hasMg(): bare 'mg' or a digits-then-mg token such as 5mg."""
    for tok in toks:
        if tok == "mg":
            return True
        if len(tok) > 2 and tok.endswith("mg") and tok[:-2].isdigit():
            return True
    return False


def evaluate(text):
    low = normalize(text)
    toks = tokens(low)
    violations = []
    cautions = []

    for word in VTOK:
        if word in toks:
            violations.append(word)
    for stem in VSTEM:
        if any(tok == stem or tok.startswith(stem) for tok in toks):
            violations.append(stem)
    if has_mg(toks):
        violations.append("mg")
    for phrase in VMULTI:
        if phrase in low:
            violations.append(phrase)

    disclaimer_present = CMULTI[0] in low
    for index, phrase in enumerate(CMULTI):
        if index > 0 and disclaimer_present:
            continue
        if phrase in low:
            cautions.append(phrase)

    if violations:
        verdict = "FAIL"
    elif cautions:
        verdict = "CAUTION"
    else:
        verdict = "PASS"
    return verdict, violations, cautions


def main():
    if not CSV_IN.exists():
        print(f"missing {CSV_IN}; run build-comment-bank.py first")
        return 1

    with CSV_IN.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))

    verdicts = Counter()
    failures = []
    for row in rows:
        verdict, violations, cautions = evaluate(row["comment"])
        verdicts[verdict] += 1
        if verdict != "PASS":
            failures.append((row["id"], verdict, violations + cautions, row["comment"]))

    print(f"comments checked against the gate rules: {len(rows)}")
    for verdict in ("PASS", "CAUTION", "FAIL"):
        print(f"  {verdict:<8} {verdicts[verdict]}")

    if failures:
        print()
        print(f"{len(failures)} comment(s) would not pass the gate:")
        for row_id, verdict, hits, comment in failures[:40]:
            print(f"  id {row_id} {verdict} {hits}: {comment}")
        return 1

    print()
    print("every comment returns PASS under the live gate's rule set.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
