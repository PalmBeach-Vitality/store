#!/usr/bin/env python3
"""Find compound_name handles that choose_compound can address unambiguously.

pull_sheet_row matches with a two-way normalized substring test, so two names
are only distinguishable when neither contains the other. compound_name never
reaches an image: grok_imagine_reel_still sends only video_prompt, so the name
printed on the vial comes from the prompt body. That makes compound_name a pure
selector key, free to differ from the label text.

    python3 marketing/scripts/check_compound_handles.py
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIVE = ROOT / "sheets" / "9-lab-item-creations-500.csv"

# label text (stays in video_prompt) -> candidate selector handle
CANDIDATES = {
    "Semax": "Semax",
    "PT-141": "PT-141",
    "Melanotan II": "Melanotan II",
    "KPV": "KPV",
    "CJC": "CJC-1295",
    "Ipamorelin": "Ipamorelin-Solo",
    "Tesamorelin/Ipamorelin": "Tesa-Ipa",
}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def alias(name: str) -> str:
    n = norm(name)
    if n in {"klow", "klowblend", "klowpeptide", "kpvbpc157tb500ghkcu"}:
        return "KLOW"
    if n in {"glow", "glowblend", "glowpeptide", "bpc157tb500ghkcu"}:
        return "GLOW"
    if n in {"wolverine", "wolverineblend", "wolverinestack", "bpc157tb500"}:
        return "Wolverine"
    return name


def collides(a: str, b: str) -> bool:
    x, y = norm(a), norm(b)
    return bool(x) and bool(y) and (x in y or y in x)


def main() -> int:
    with LIVE.open(newline="", encoding="utf-8") as handle:
        live = [dict(r) for r in csv.DictReader(handle)]
    live_names = sorted(
        {alias(r["compound_name"]) for r in live if (r["status"] or "").strip() == "Active"}
    )

    print("Live Active compounds:", ", ".join(live_names), "\n")

    handles = list(CANDIDATES.values())
    ok = True
    for label, handle in CANDIDATES.items():
        hits = [n for n in live_names if collides(handle, n)]
        hits += [h for h in handles if h != handle and collides(handle, h)]
        mark = "ok   " if not hits else "CLASH"
        if hits:
            ok = False
        note = "" if handle == label else f"  (label stays '{label}')"
        print(f"  {mark}  handle {handle!r}{note}")
        for h in hits:
            print(f"         collides with {h!r}")

    print()
    print("ok" if ok else "unresolved clashes remain")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
