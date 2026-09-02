"""Mirror of overlay_film023_use_this lock write for the repo CSV."""

from pathlib import Path

PICKED_023 = (
    "https://raw.githubusercontent.com/PalmBeach-Vitality/store/"
    "cursor/film018-match-013-core-4c4b/marketing/stills/film023-handoff-source.jpg"
)

STILL_023 = (
    "Money-shot keyframe, 9:16 vertical. Extreme close-up of the handoff: the alien's slender "
    "pale marble-white fingers gripping the blue cap from above-left, the glowing vial seated "
    "in the astronaut's BARE LEFT open palm from below, label facing camera perfectly readable: "
    "Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue plastic flip-off "
    "cap on a brushed-silver aluminum crimp over a rubber septum, clean white wrap-around label "
    "with a dark maroon DNA double-helix icon centered at the top, the name 'MOTS-C' in large "
    "bold dark maroon sans-serif printed once, a solid dark maroon rectangle badge with white "
    "text exactly '10mg'. The liquid inside glows a warm golden-orange, backlit by sunset so "
    "light passes through the glass onto the palm. Her LEFT hand is BARE skin — palm, fingers, "
    "and thumb fully visible, anatomically correct. NO gloves. NO gauntlets. NO space-suit "
    "gloves. NO tactical gloves. SAME square left-wrist device as FILM-005 / FILM-006: a "
    "rectangular blocky SQUARE gunmetal box strapped exactly onto the TOP of her LEFT wrist — "
    "the BACK / dorsal / outer side, same as a normal watch, housing no wider than the wrist. "
    "NEVER underneath the wrist. NEVER on the inner wrist. NEVER on the palm side. Because the "
    "palm faces the camera, the device sits on the far / top side of the wrist — the camera "
    "sees the metal band and the side / edge of the box at the bottom-left of frame, like a "
    "watch band. NOT a face-on product shot of the screen on the inner wrist. Square housing, "
    "square amber-orange screen with only slightly rounded corners, square or rectangular "
    "buttons and sliders on the SIDES of the box. SAME screen orientation as FILM-005 and "
    "FILM-006: the screen sits on the back of the wrist facing OUT, not toward the palm. The "
    "TOP of the screen (MOTS-C text) points toward her forearm / elbow; the BOTTOM of the "
    "screen points toward her fingers. NOT rotated 90 degrees. NOT sideways toward the thumb. "
    "NOT a long rectangle running along the forearm. Screen shows only the square amber-orange "
    "MOTS-C readout — no heart-rate, no temperature, no 36.7, no medical HUD. NO ROUND SHAPES. "
    "ALWAYS on her LEFT wrist. Golden sunset backlight, dusk ocean and palm bokeh. Photoreal "
    "cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except "
    "the vial label and the wrist-device screen. No logos, no captions, no watermarks. No "
    "faces. No extra people. No gloves."
)

EDIT_023 = (
    "Keep this exact handoff: sunset backlight through the MOTS-C 10mg vial, pale marble "
    "fingers on the blue cap, tan BARE LEFT palm under the vial. Do not change the camera, "
    "lighting, hands, or vial. The metal link watch is already on the TOP of the LEFT wrist — "
    "that sit is correct. REPLACE only that link watch with the SAME square gunmetal MOTS-C "
    "device as FILM-005 / FILM-006. Keep it on the TOP / BACK of the wrist, like this watch. "
    "Camera should still see only the band / side / edge at the bottom-left. NEVER move it "
    "onto the inner wrist or palm. NOT a face-on screen on the palm side. Screen text stays "
    "MOTS-C only. No gloves. No other changes."
)


def apply_row(row):
    if row.get("still_id") != "FILM-023":
        return row
    row["still_prompt"] = STILL_023
    row["still_edit_prompt"] = EDIT_023
    row["picked_url"] = PICKED_023
    row["take_urls"] = PICKED_023
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
