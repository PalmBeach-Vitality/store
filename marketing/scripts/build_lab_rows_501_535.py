#!/usr/bin/env python3
"""Append 35 new vial rows (PBVita-Lab-501..535) to the Sheet 9 mirror.

Seven compounds x 5 rows. Sheet 9 is VIALS ONLY, so every product here has a
confirmed vial SKU on palmbeach-vitality.store. Pen-only products
(5-Amino-1MQ, DSIP, Dihexa, Epithalon, Glutathione, IGF-LR3, Kisspeptin) are
deliberately excluded; their pen strengths are not interchangeable with vial
strengths.

New rows are cloned from existing live rows rather than authored from scratch,
so they inherit the current VIAL VISUAL LOCK, HARD OUTPUT LOCK, single-hero and
no-doubles language verbatim. Donors are restricted to rows that carry no
foreign compound name, so the stale `label:<old compound>` bug is not copied
forward.

Camera recipes come from camera_recipes.py. Live uses 500 of its 723 unique
recipes; these rows draw from the 223 that live has never used, which makes
camera_move and framing collision-free by construction.

Usage:
    python3 marketing/scripts/build_lab_rows_501_535.py [--handles] [--write]

Without --write it prints the QA report and touches nothing. With --handles the
compound_name column carries a collision-free selector handle so choose_compound
can address every row; see the PRODUCTS comment.
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
OUT_NEW = SHEETS / "9-lab-item-creations-501-535-new.csv"
# JSON twin of OUT_NEW. The append workflow fetches this over HTTPS rather than
# the CSV, so n8n parses it natively and no hand-rolled CSV parser can mangle a
# quoted prompt field.
OUT_NEW_JSON = SHEETS / "9-lab-item-creations-501-535-new.json"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from camera_recipes import generate_all_recipes  # noqa: E402

TEXT_FIELDS = (
    "lab_item",
    "material_detail",
    "scene_brief",
    "video_prompt",
    "video_motion_prompt",
    "still_edit_prompt",
)

# Vial specs read off palmbeach-vitality.store product pages (Sept 2026).
# `conc` is None where the store itself marks fill volume unconfirmed — in that
# case the label keeps the vial lock's generic concentration line and prints no
# invented mg/ml.
#
# `compound_name` is a SELECTOR, not label text. pull_sheet_row matches a typed
# name with a two-way normalized substring test, and grok_imagine_reel_still
# sends only video_prompt, so the name printed on the vial comes from the prompt
# body. Where a chemical name is a substring of another live compound the row
# would be unreachable, so `handle` overrides the column while `compound_name`
# stays the text in every prompt. Run with --handles to use them.
#   CJC                    is inside live CJC/Ipamorelin
#   Ipamorelin             is inside live CJC/Ipamorelin and Tesamorelin/Ipamorelin
#   Tesamorelin/Ipamorelin contains live Tesamorelin
PRODUCTS = [
    {
        "compound_name": "Semax",
        "mg": "10mg",
        "conc": "1 mg/ml",
        "vol": "10ml",
        # Salvatore 2026-09-13: vial is 10mg / 1 mg/ml on every vial sheet. The
        # store PDP showing 20 mg / 2 mg/mL is the pen strength and is stale.
        "source": "Salvatore confirmed; matches wholesale sheet 'Semax 10mg Vial'",
    },
    {
        "compound_name": "PT-141",
        "mg": "20mg",
        "conc": "2 mg/ml",
        "vol": "10ml",
        "source": "store PDP: PT-141 10 mL Vial (20 mg), 2 mg/mL",
    },
    {
        "compound_name": "Melanotan II",
        "mg": "10mg",
        "conc": "1 mg/ml",
        "vol": "10ml",
        "source": "store PDP: Melanotan II 10 mL Vial (10 mg), 1 mg/mL",
    },
    {
        "compound_name": "KPV",
        "mg": "10mg",
        "conc": "1 mg/ml",
        "vol": "10ml",
        "source": "store PDP: KPV 10mg Vial, 10 mL, 1 mg/mL",
    },
    {
        "compound_name": "CJC",
        "handle": "CJC-1295",
        "mg": "10mg",
        "conc": "1 mg/ml",
        "vol": "10ml",
        # Salvatore 2026-09-13: wholesale 'CJC-1295 10mg Vial' is correct. The
        # PDP's 100 mg / 10 mg/mL is stale, same failure mode as Semax.
        "source": "Salvatore confirmed; matches wholesale sheet 'CJC-1295 10mg Vial'",
    },
    {
        "compound_name": "Ipamorelin",
        "handle": "Ipamorelin-Solo",
        "mg": "10mg",
        "conc": "1 mg/ml",
        "vol": "10ml",
        # Salvatore 2026-09-13: 10mg in a 10 mL fill, so 1 mg/ml.
        "source": "Salvatore confirmed 10mg / 1 mg/ml, 10 mL fill",
    },
    {
        "compound_name": "Tesamorelin/Ipamorelin",
        "handle": "Tesa-Ipa",
        "mg": "12mg/3mg",
        "conc": None,
        "vol": "10ml",
        "source": "store PDP: Tesamorelin / Ipamorelin 12mg/3mg Vial; fill volume 'confirm on live PDP'",
    },
]
ROWS_PER_PRODUCT = 5

# Phrasings the live sheet uses for the dose bar, newest first.
GENERIC_BARS = (
    "a solid dark maroon dosage bar with white mg strength, black mg/ml concentration text",
    "a solid dark maroon horizontal bar with white dosage strength; black concentration line (mg/ml) under the bar",
    "a solid dark maroon horizontal bar with white dosage strength, black concentration line (mg/ml) under the bar",
    "a solid dark maroon horizontal bar with white dosage strength",
    "maroon dose bar with white dose text, black concentration line",
)
EXACT_BAR_RE = re.compile(
    r"a solid dark maroon dosage bar with white text exactly '[^']*', "
    r"black concentration line exactly '[^']*'"
)
NO_DOSE_BAR_RE = re.compile(
    r"a solid dark maroon dosage bar with NO mg number and NO mg/ml concentration "
    r"\([^)]*\)"
)
FOOTER_RE = re.compile(r"'(\d+m[lL]) Sterile Multi-Use Vial'")
DOSE_LOCK_RE = re.compile(r"VIAL DOSE LOCK:.*?Do not restyle the scene\.\s*", re.S)


def bar_phrase(spec: dict) -> str:
    if spec["conc"]:
        return (
            "a solid dark maroon dosage bar with white text exactly '"
            + spec["mg"]
            + "', black concentration line exactly '"
            + spec["conc"]
            + "'"
        )
    return (
        "a solid dark maroon dosage bar with white text exactly '"
        + spec["mg"]
        + "' and NO mg/ml concentration line (name + DNA + "
        + spec["vol"]
        + " footer only — do not invent a concentration)"
    )


def dose_lock(spec: dict) -> str:
    name = spec["compound_name"]
    if spec["conc"]:
        return (
            "VIAL DOSE LOCK: On the "
            + name
            + " vial label the maroon bar reads exactly '"
            + spec["mg"]
            + "' and the concentration line reads exactly '"
            + spec["conc"]
            + "'. Footer exactly '"
            + spec["vol"]
            + " Sterile Multi-Use Vial'. If the still shows any other strength or concentration, "
            "correct it. Do not restyle the scene. "
        )
    return (
        "VIAL DOSE LOCK: On the "
        + name
        + " vial label the maroon bar reads exactly '"
        + spec["mg"]
        + "'. The catalog fill volume is unconfirmed, so print NO mg/ml concentration line — "
        "do not invent one. Footer exactly '"
        + spec["vol"]
        + " Sterile Multi-Use Vial'. Do not restyle the scene. "
    )


def load_catalog_names() -> list[str]:
    cat = json.loads((ROOT / "compound-vial-labels.json").read_text())
    names = set(cat["labels"]) | set(cat.get("aliases") or {})
    names |= {p["compound_name"] for p in PRODUCTS}
    names |= {"Melanotan-2", "CJC-1295", "Cagrilintide"}
    return sorted(names, key=len, reverse=True)


def word_re(name: str) -> re.Pattern:
    return re.compile(r"(?<![A-Za-z0-9-])" + re.escape(name) + r"(?![A-Za-z0-9-])")


def own_keys(compound: str) -> set[str]:
    """A blend legitimately names its own components, e.g. Tesamorelin/Ipamorelin."""
    parts = [compound] + compound.split("/")
    return {re.sub(r"[^a-z0-9+]", "", p.lower()) for p in parts if p.strip()}


def foreign_names(row: dict, names: list[str], aliases: dict) -> set[str]:
    # Prompts carry the label name; compound_name may be a selector handle.
    own = own_keys(row.get("label_name") or row["compound_name"])
    blob = " ".join(row[f] or "" for f in TEXT_FIELDS)
    hits = set()
    for n in names:
        if word_re(n).search(blob):
            target = aliases.get(n, n)
            if re.sub(r"[^a-z0-9+]", "", target.lower()) not in own:
                hits.add(n)
    return hits


def scene_brief_prefix(rows: list[dict]) -> str:
    briefs = [r["scene_brief"] for r in rows]
    prefix = briefs[0]
    for s in briefs[1:]:
        i = 0
        while i < min(len(prefix), len(s)) and prefix[i] == s[i]:
            i += 1
        prefix = prefix[:i]
    return prefix


def build_row(
    donor: dict, spec: dict, recipe: dict, idx: int, sb_prefix: str, handles: bool
) -> dict:
    row = dict(donor)
    old = donor["compound_name"]
    new = spec["compound_name"]
    handle = spec.get("handle", new) if handles else new

    for field in TEXT_FIELDS:
        text = row.get(field) or ""
        if not text:
            continue
        # Camera recipe swap — these tokens are emitted verbatim by the builder.
        text = text.replace(donor["camera_move"], recipe["camera_move"])
        text = text.replace(donor["framing"], recipe["framing"])
        text = text.replace(
            f"SHOT FAMILY: {donor['shot_family']}.", f"SHOT FAMILY: {recipe['shot_family']}."
        )
        text = text.replace(
            f"CAMERA ANGLE: {donor['camera_angle']}.", f"CAMERA ANGLE: {recipe['camera_angle']}."
        )
        text = text.replace(
            f"CAMERA DIRECTION: {donor['camera_direction']}.",
            f"CAMERA DIRECTION: {recipe['camera_direction']}.",
        )
        text = text.replace(
            f"Shot {donor['shot_family']}, angle {donor['camera_angle']}, "
            f"direction {donor['camera_direction']}.",
            f"Shot {recipe['shot_family']}, angle {recipe['camera_angle']}, "
            f"direction {recipe['camera_direction']}.",
        )
        # Dose bar + footer.
        text = EXACT_BAR_RE.sub(lambda _m: bar_phrase(spec), text)
        text = NO_DOSE_BAR_RE.sub(lambda _m: bar_phrase(spec), text)
        for generic in GENERIC_BARS:
            text = text.replace(generic, bar_phrase(spec))
        text = FOOTER_RE.sub(f"'{spec['vol']} Sterile Multi-Use Vial'", text)
        # Compound name last, so it cannot be clobbered by the dose swaps.
        text = word_re(old).sub(new, text)
        row[field] = text

    # scene_brief is rebuilt rather than patched: its tail is a fixed token run
    # and the live copies are truncated mid-word.
    head = (donor["scene_brief"][len(sb_prefix) :]).split(" · shot:")[0]
    tail = (
        f"{head} · shot:{recipe['shot_family']} · angle:{recipe['camera_angle']}"
        f" · dir:{recipe['camera_direction']} · label:{new} · {recipe['camera_move']}"
    )
    tail = word_re(old).sub(new, tail)
    row["scene_brief"] = sb_prefix + tail[:379]

    lock = dose_lock(spec)
    row["still_edit_prompt"] = lock + DOSE_LOCK_RE.sub("", row["still_edit_prompt"]).strip()

    row["creation_id"] = f"PBVita-Lab-{idx:03d}"
    row["lab_item_id"] = f"LAB-{idx:03d}"
    row["rank"] = str(idx)
    row["compound_name"] = handle
    row["label_name"] = new
    row["shot_family"] = recipe["shot_family"]
    row["camera_angle"] = recipe["camera_angle"]
    row["camera_direction"] = recipe["camera_direction"]
    row["framing"] = recipe["framing"]
    row["camera_move"] = recipe["camera_move"]
    # Hard constants for this tab.
    row["aspect_ratio"] = "9:16"
    row["duration_seconds"] = "15"
    row["resolution"] = "1080p"
    row["model_still"] = "grok-imagine-image-2.0"
    row["model_video"] = "grok-imagine-video-1.5"
    row["still_resolution"] = "2k"
    row["quality_var_count"] = "12"
    row["status"] = "Active"
    row["times_used"] = "0"
    row["last_used_at"] = ""
    return row


def main() -> None:
    args = sys.argv[1:]
    write = "--write" in args
    handles = "--handles" in args
    with CSV9.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        columns = list(reader.fieldnames or [])
        live = [dict(r) for r in reader]
    if len(live) != 500:
        raise SystemExit(f"expected 500 live rows, found {len(live)}")

    cat = json.loads((ROOT / "compound-vial-labels.json").read_text())
    aliases = cat.get("aliases") or {}
    names = load_catalog_names()
    sb_prefix = scene_brief_prefix(live)

    # A donor must name its own compound inside video_prompt. The rename is a
    # substitution, so a donor that only says "compound name in large bold dark
    # maroon" gives the new row no name to print — and video_prompt is the only
    # field grok_imagine_reel_still sends, so the vial would come back unlabeled.
    clean = [
        r
        for r in live
        if not foreign_names(r, names, aliases)
        and word_re(r["compound_name"]).search(r["video_prompt"] or "")
    ]
    if len(clean) < ROWS_PER_PRODUCT * len(PRODUCTS):
        raise SystemExit(f"only {len(clean)} clean donors, need 35")

    used_moves = {(r["camera_move"] or "").strip().lower() for r in live}
    spare = [
        rec
        for rec in generate_all_recipes()
        if rec["camera_move"].strip().lower() not in used_moves
    ]
    need = ROWS_PER_PRODUCT * len(PRODUCTS)
    if len(spare) < need:
        raise SystemExit(f"only {len(spare)} unused camera recipes, need {need}")

    # Bucket donors by scene category and recipes by shot family, then walk both
    # round-robin. Each product's five rows land in five different categories
    # and five different shot families, and the window shifts per product so no
    # two products get the same sequence.
    donor_buckets: dict[str, list[dict]] = {}
    for r in sorted(clean, key=lambda r: r["creation_id"]):
        donor_buckets.setdefault(r["category"], []).append(r)
    categories = sorted(donor_buckets)

    recipe_buckets: dict[str, list[dict]] = {}
    for rec in spare:
        recipe_buckets.setdefault(rec["shot_family"], []).append(rec)
    families = sorted(recipe_buckets)

    if len(categories) < ROWS_PER_PRODUCT or len(families) < ROWS_PER_PRODUCT:
        raise SystemExit(
            f"need >= {ROWS_PER_PRODUCT} categories and families, "
            f"have {len(categories)} / {len(families)}"
        )

    new_rows = []
    idx = 501
    for p_i, spec in enumerate(PRODUCTS):
        for r_i in range(ROWS_PER_PRODUCT):
            cat = categories[(p_i * ROWS_PER_PRODUCT + r_i) % len(categories)]
            fam = families[(p_i * ROWS_PER_PRODUCT + r_i) % len(families)]
            donor = donor_buckets[cat].pop(0)
            donor_buckets[cat].append(donor)
            recipe = recipe_buckets[fam].pop(0)
            new_rows.append(build_row(donor, spec, recipe, idx, sb_prefix, handles))
            idx += 1

    qa(live, new_rows, names, aliases, columns)

    # label_name is builder scratch, not a sheet column.
    for r in new_rows:
        r.pop("label_name", None)

    with OUT_NEW.open("w", newline="\n", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(new_rows)
    print(f"\nwrote {OUT_NEW.relative_to(ROOT.parent)} ({len(new_rows)} rows)")
    OUT_NEW_JSON.write_text(
        json.dumps({"count": len(new_rows), "rows": new_rows}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT_NEW_JSON.relative_to(ROOT.parent)}")

    if not write:
        print("dry run — Sheet 9 mirror untouched. Re-run with --write to append.")
        return

    combined = live + new_rows
    for path in (CSV9, CSV9_250):
        with path.open("w", newline="\n", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
            writer.writeheader()
            writer.writerows(combined)
        print(f"wrote {path.relative_to(ROOT.parent)} ({len(combined)} rows)")
    payload = {"count": len(combined), "creations": combined}
    for path in (JSON9, JSON9_250):
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT.parent)}")


def qa(live: list[dict], new: list[dict], names, aliases, columns) -> None:
    fail = []

    def check(label: str, ok: bool, detail: str = "") -> None:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")
        if not ok:
            fail.append(label)

    print(f"QA on {len(new)} new rows:")
    check("row count is 35", len(new) == 35)
    check(
        "all 31 columns present",
        all(set(r) - {"label_name"} == set(columns) for r in new),
    )

    live_ids = {r["creation_id"] for r in live}
    live_lab = {r["lab_item_id"] for r in live}
    live_rank = {r["rank"] for r in live}
    ids = [r["creation_id"] for r in new]
    check("creation_id unique + no live collision", len(set(ids)) == 35 and not (set(ids) & live_ids))
    labs = [r["lab_item_id"] for r in new]
    check("lab_item_id unique + no live collision", len(set(labs)) == 35 and not (set(labs) & live_lab))
    ranks = [r["rank"] for r in new]
    check("rank 501..535, no live collision", ranks == [str(i) for i in range(501, 536)] and not (set(ranks) & live_rank))

    live_moves = {(r["camera_move"] or "").strip().lower() for r in live}
    moves = [(r["camera_move"] or "").strip().lower() for r in new]
    check("camera_move unique + no live collision", len(set(moves)) == 35 and not (set(moves) & live_moves))

    live_briefs = {r["scene_brief"] for r in live}
    briefs = [r["scene_brief"] for r in new]
    check("scene_brief unique + no live collision", len(set(briefs)) == 35 and not (set(briefs) & live_briefs))

    for field, want in (
        ("aspect_ratio", "9:16"),
        ("duration_seconds", "15"),
        ("resolution", "1080p"),
        ("model_still", "grok-imagine-image-2.0"),
        ("model_video", "grok-imagine-video-1.5"),
        ("still_resolution", "2k"),
        ("quality_var_count", "12"),
        ("status", "Active"),
        ("times_used", "0"),
        ("last_used_at", ""),
    ):
        check(f"{field} == {want!r}", all(r[field] == want for r in new))

    counts = {p["compound_name"]: 0 for p in PRODUCTS}
    for r in new:
        key = r.get("label_name") or r["compound_name"]
        counts[key] = counts.get(key, 0) + 1
    check("5 rows per compound", all(v == 5 for v in counts.values()), str(counts))

    bad = {r["creation_id"]: sorted(foreign_names(r, names, aliases)) for r in new}
    bad = {k: v for k, v in bad.items() if v}
    check("no foreign compound names in prompts", not bad, json.dumps(bad)[:300])

    missing = [
        r["creation_id"]
        for r in new
        if not word_re(r.get("label_name") or r["compound_name"]).search(
            " ".join(r[f] or "" for f in TEXT_FIELDS)
        )
    ]
    check("own compound name appears in prompts", not missing, str(missing))

    # video_prompt is the only field grok_imagine_reel_still sends, so the name
    # must be in it or the still comes back with a blank label.
    unnamed = [
        r["creation_id"]
        for r in new
        if not word_re(r.get("label_name") or r["compound_name"]).search(r["video_prompt"])
    ]
    check("video_prompt names the compound (still node sends only this)", not unnamed, str(unnamed))

    empty = [
        (r["creation_id"], f)
        for r in new
        for f in ("video_prompt", "video_motion_prompt", "still_edit_prompt")
        if not (r[f] or "").strip()
    ]
    check("video_prompt/motion/still_edit all non-empty", not empty, str(empty[:5]))

    # Moderation lexicon. These tokens do occur in the studio's approved vial
    # locks ("multi-use injection vial", "FORBIDDEN: ... syringe/transfer"), so
    # the meaningful invariant is that new rows introduce no context that the
    # live corpus does not already carry.
    banned = (
        "needle", "syringe", "injection", "injecting",
        "blood", "steroid", "controlled substance", "drug manufacturing",
    )
    all_names = [p["compound_name"] for p in PRODUCTS] + list(
        json.loads((ROOT / "compound-vial-labels.json").read_text())["labels"]
    )

    def mask(text: str) -> str:
        out = text.lower()
        for n in sorted(all_names, key=len, reverse=True):
            out = out.replace(n.lower(), "<c>")
        return out

    live_masked = "\n".join(mask(" ".join(r[f] or "" for f in TEXT_FIELDS)) for r in live)
    novel = {}
    for r in new:
        blob = mask(" ".join(r[f] or "" for f in TEXT_FIELDS))
        for tok in banned:
            for m in re.finditer(re.escape(tok), blob):
                window = blob[max(0, m.start() - 30) : m.start() + len(tok) + 30]
                if window not in live_masked:
                    novel.setdefault(r["creation_id"], set()).add(window)
    check(
        "no moderation token context not already in live",
        not novel,
        json.dumps({k: sorted(v) for k, v in novel.items()})[:300],
    )

    lock_missing = [
        r["creation_id"]
        for r in new
        if "VIAL VISUAL LOCK" not in (r["lab_item"] or "")
        or "HARD OUTPUT LOCK" not in (r["lab_item"] or "")
    ]
    check("vial + hard output locks inherited", not lock_missing, str(lock_missing))

    footers = {
        m.group(1)
        for r in new
        for m in [FOOTER_RE.search(" ".join(r[f] or "" for f in TEXT_FIELDS))]
        if m
    }
    check("footer volume is 10ml only", footers <= {"10ml"}, str(footers))

    if fail:
        raise SystemExit(f"\n{len(fail)} QA check(s) failed: {fail}")
    print("  all checks passed")


if __name__ == "__main__":
    main()
