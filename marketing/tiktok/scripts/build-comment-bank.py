#!/usr/bin/env python3
"""Build and QC the TikTok comment bank from the per-category source files.

Reads marketing/tiktok/source/*.txt, validates every line against the
compliance ban list and the style rules, then writes tiktok_comment_bank.csv
and tiktok_comment_bank.txt. Exits non-zero on any hard failure.
"""

import csv
import itertools
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

TIKTOK_DIR = Path(__file__).resolve().parent.parent
SOURCE_DIR = TIKTOK_DIR / "source"
CSV_OUT = TIKTOK_DIR / "tiktok_comment_bank.csv"
TXT_OUT = TIKTOK_DIR / "tiktok_comment_bank.txt"

CATEGORY_ORDER = [
    "peptide_science",
    "lab_methods_study_design",
    "pathways_mechanisms",
    "recovery_research",
    "longevity_cellular",
    "skin_hair_science",
    "sleep_focus_research",
    "biohacking_science",
    "regulatory_ruo_education",
    "general_science_curiosity",
]

VALID_TONES = {"curious", "technical", "light"}

TARGET_TOTAL = 1000
WORD_MIN = 5
WORD_MAX_TYPICAL = 20
WORD_MAX_HARD = 28

# Whole-word bans. Matched against alphanumeric tokens so "cure" does not
# trip on "obscure" and "mg" does not trip on a word that merely contains it.
BAN_TOKENS = {
    "cure", "cures", "cured", "curing",
    "treats", "treat",
    "therapy", "therapies",
    "patient", "patients",
    "guaranteed",
    "dose", "doses", "dosage", "dosing",
    "heals", "healed",
    "mg",
    "buy", "buys", "discount", "sale", "sales",
    "results", "result",
}

# Prefix bans. "inject" catches injection/injecting/injectable.
BAN_PREFIXES = ("inject", "syring")

# Substring bans, checked against the normalized lowercase text.
BAN_PHRASES = (
    "treat your",
    "cure for",
    "fda approved",
    "fda-approved",
    "clinical use",
    "recommended for",
    "works for",
    "you will",
    "you'll",
    "lose weight",
    "weight loss",
    "fat loss",
    "burn fat",
    "anti-aging results",
    "reverse aging",
    "healing you",
    "take daily",
    "mg/ml",
    "human use",
    "for human",
    "for humans",
    "human consumption",
    "not for human",
    "dm me",
    "link in bio",
    "before/after",
    "before and after",
    "stack for",
    "protocol for taking",
)

EMOJI_RANGES = (
    (0x1F300, 0x1FAFF),
    (0x2600, 0x27BF),
    (0x1F000, 0x1F2FF),
    (0xFE00, 0xFE0F),
)


def normalize(text):
    """Lowercase, straighten quotes, collapse whitespace."""
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\u2019", "'").replace("\u2018", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    return re.sub(r"\s+", " ", text).strip().lower()


def tokens(text):
    return re.findall(r"[a-z0-9]+", normalize(text))


def dedupe_key(text):
    """Identity after stripping punctuation and case."""
    return " ".join(tokens(text))


def has_emoji(text):
    return any(
        any(lo <= ord(ch) <= hi for lo, hi in EMOJI_RANGES) for ch in text
    )


def shouty_words(text):
    return [
        w for w in re.findall(r"[A-Za-z]+", text)
        if len(w) >= 3 and w.isupper()
    ]


def ban_hits(text):
    low = normalize(text)
    toks = tokens(text)
    hits = []
    for tok in toks:
        if tok in BAN_TOKENS:
            hits.append(tok)
        for prefix in BAN_PREFIXES:
            if tok.startswith(prefix):
                hits.append(tok)
        # A bare milligram amount such as 5mg or 250mg.
        if re.fullmatch(r"\d+mg", tok):
            hits.append(tok)
    for phrase in BAN_PHRASES:
        if phrase in low:
            hits.append(phrase)
    return sorted(set(hits))


def load_source():
    rows = []
    errors = []
    for index, category in enumerate(CATEGORY_ORDER, start=1):
        path = SOURCE_DIR / f"{index:02d}-{category}.txt"
        if not path.exists():
            errors.append(f"missing source file: {path.name}")
            continue
        lines = [
            ln.strip()
            for ln in path.read_text(encoding="utf-8").splitlines()
            if ln.strip() and not ln.lstrip().startswith("#")
        ]
        for lineno, line in enumerate(lines, start=1):
            if "::" not in line:
                errors.append(f"{path.name}:{lineno} missing '::' separator")
                continue
            tone, comment = (part.strip() for part in line.split("::", 1))
            if tone not in VALID_TONES:
                errors.append(f"{path.name}:{lineno} bad tone {tone!r}")
            rows.append(
                {
                    "category": category,
                    "tone": tone,
                    "comment": comment,
                    "source": f"{path.name}:{lineno}",
                }
            )
    return rows, errors


def main():
    rows, errors = load_source()

    for row in rows:
        comment = row["comment"]
        where = row["source"]
        words = comment.split()
        row["word_count"] = len(words)
        row["asks_question"] = "?" in comment

        hits = ban_hits(comment)
        if hits:
            errors.append(f"{where} banned {hits}: {comment}")
        if len(words) > WORD_MAX_HARD:
            errors.append(f"{where} {len(words)} words exceeds hard max: {comment}")
        if len(words) < WORD_MIN:
            errors.append(f"{where} only {len(words)} words: {comment}")
        if has_emoji(comment):
            errors.append(f"{where} contains emoji: {comment}")
        if "#" in comment:
            errors.append(f"{where} contains hashtag: {comment}")
        shouty = shouty_words(comment)
        if shouty:
            errors.append(f"{where} all-caps {shouty}: {comment}")

    # Exact duplicates after normalizing punctuation and case.
    seen = {}
    for row in rows:
        key = dedupe_key(row["comment"])
        if key in seen:
            errors.append(
                f"{row['source']} duplicates {seen[key]}: {row['comment']}"
            )
        else:
            seen[key] = row["source"]

    # Fuzzy near-duplicates by token overlap.
    token_sets = [(row, set(tokens(row["comment"]))) for row in rows]
    near = []
    for (row_a, set_a), (row_b, set_b) in itertools.combinations(token_sets, 2):
        union = set_a | set_b
        if not union:
            continue
        overlap = len(set_a & set_b) / len(union)
        if overlap >= 0.70:
            near.append((overlap, row_a, row_b))
    for overlap, row_a, row_b in sorted(near, reverse=True, key=lambda t: t[0]):
        errors.append(
            f"near-duplicate {overlap:.2f} {row_a['source']} / {row_b['source']}: "
            f"{row_a['comment']!r} vs {row_b['comment']!r}"
        )

    category_counts = Counter(row["category"] for row in rows)
    tone_counts = Counter(row["tone"] for row in rows)
    question_count = sum(1 for row in rows if row["asks_question"])
    long_count = sum(1 for row in rows if row["word_count"] > WORD_MAX_TYPICAL)

    if len(rows) != TARGET_TOTAL:
        errors.append(f"expected {TARGET_TOTAL} comments, found {len(rows)}")

    for category in CATEGORY_ORDER:
        count = category_counts[category]
        if not 90 <= count <= 110:
            errors.append(f"category {category} has {count}, outside 90-110")

    if rows:
        question_share = question_count / len(rows)
        if not 0.38 <= question_share <= 0.52:
            errors.append(
                f"question share {question_share:.1%} outside the 40-50% target"
            )

    print(f"comments parsed:  {len(rows)}")
    print(f"questions:        {question_count} "
          f"({question_count / max(len(rows), 1):.1%})")
    print(f"over {WORD_MAX_TYPICAL} words:    {long_count} "
          f"(hard max {WORD_MAX_HARD})")
    print(f"unique after norm: {len(seen)}")
    print()
    print("category balance:")
    for category in CATEGORY_ORDER:
        print(f"  {category:<28} {category_counts[category]}")
    print()
    print("tone balance:")
    for tone in ("curious", "technical", "light"):
        print(f"  {tone:<28} {tone_counts[tone]}")

    if errors:
        print()
        print(f"FAILED with {len(errors)} issue(s):")
        for err in errors[:60]:
            print(f"  - {err}")
        if len(errors) > 60:
            print(f"  ... and {len(errors) - 60} more")
        return 1

    with CSV_OUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["id", "category", "comment", "tone", "asks_question"])
        for index, row in enumerate(rows, start=1):
            writer.writerow(
                [
                    index,
                    row["category"],
                    row["comment"],
                    row["tone"],
                    "true" if row["asks_question"] else "false",
                ]
            )

    TXT_OUT.write_text(
        "\n".join(row["comment"] for row in rows) + "\n", encoding="utf-8"
    )

    print()
    print(f"wrote {CSV_OUT.relative_to(TIKTOK_DIR.parent.parent)}")
    print(f"wrote {TXT_OUT.relative_to(TIKTOK_DIR.parent.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
