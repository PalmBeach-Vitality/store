"""Mirror of overlay_film023_024_final for the repo CSV."""

from pathlib import Path

PICKED_023 = (
    "https://raw.githubusercontent.com/PalmBeach-Vitality/store/"
    "cursor/film018-match-013-core-4c4b/marketing/stills/film023-handoff-source.jpg"
)
PICKED_024 = (
    "https://raw.githubusercontent.com/PalmBeach-Vitality/store/"
    "cursor/film018-match-013-core-4c4b/marketing/stills/film024-recharge-source.jpg"
)
EDIT_023 = "FINAL keeper: vial_handoff_23. Do not regenerate. Do not edit."
EDIT_024 = "FINAL keeper: vial_recharge_24. Do not regenerate. Do not edit."


def apply_row(row):
    sid = row.get("still_id")
    if sid == "FILM-023":
        row["picked_url"] = PICKED_023
        row["still_edit_prompt"] = EDIT_023
        row["times_used"] = "1"
    if sid == "FILM-024":
        row["picked_url"] = PICKED_024
        row["take_urls"] = PICKED_024
        row["still_edit_prompt"] = EDIT_024
        row["times_used"] = "1"
    return row


if __name__ == "__main__":
    import csv

    p = Path(__file__).resolve().parents[1] / "sheets" / "18-motsc-film-stills.csv"
    with p.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = [apply_row(r) for r in reader]
    with p.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print("updated", p)
