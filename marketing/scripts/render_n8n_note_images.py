#!/usr/bin/env python3
"""Render big-type sticky-note images for peptide_molecule_vid_gen_v2.

n8n sticky text tops out at the Markdown H1 size (36 px on the canvas), and the
editor accepts no HTML. An image with `#full-width` fills the sticky. These PNGs
carry the note text at 2x that size (72 px body, 88 px titles on the canvas),
half the first pass. They render at 2x for sharp text when zoomed in.

The images are served from raw.githubusercontent.com at a pinned commit, so the
workflow's notes keep loading after the branch is merged or deleted.

Output:
  marketing/n8n-notes/peptide_molecule_vid_gen_v2/*.png
  marketing/n8n-notes/peptide_molecule_vid_gen_v2/notes.json  (sizes + alt text for the workflow builder)
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "n8n-notes" / "peptide_molecule_vid_gen_v2"

FONT_DIR = Path("/usr/share/fonts/truetype/macos")
FONT_TITLE = FONT_DIR / "Inter-Bold.ttf"
FONT_BODY = FONT_DIR / "Inter-SemiBold.ttf"

SCALE = 2
# Canvas px. Half of the first pass (144 / 176), which is 2x n8n's H1.
TITLE_PX = 88
BODY_PX = 72
TITLE_LEADING = 1.15
BODY_LEADING = 1.22
GAP_AFTER_TITLE = 10
GAP_BLOCK = 32
INDENT = 48

# Each note is only as wide as its text. The sticky adds this much padding around the image.
STICKY_PADDING = 24

PAD_TOP = 28
PAD_BOTTOM = 32
PAD_RIGHT = 36
BAR = 14
PAD_LEFT = BAR + 32
RADIUS = 18

INK_TITLE = (15, 23, 42)
INK_BODY = (30, 41, 59)
CARD = (255, 255, 255)
BORDER = (226, 232, 240)

# n8n sticky colors: 1 yellow, 4 green, 5 blue, 6 purple.
NOTES = [
    {
        "name": "note_overview",
        "file": "0-overview.png",
        "sticky_color": 1,
        "accent": (217, 119, 6),
        "heading_ink": (180, 83, 9),
        "lines": [
            ("title", "Molecule video v2"),
            ("body", "14-chem-breakdown-54 · 54 looks"),
            ("body", "30s · 1080 × 1920 · 9:16 · no sound"),
            ("body", "Every prompt comes from the sheet"),
            ("gap", ""),
            ("heading", "How to run"),
            ("body", "1. gpt_image_molecule_still →"),
            ("indent", "Execute step (the still only)"),
            ("body", "2. Like it? Pin save_still_url"),
            ("body", "3. sheets_update_video →"),
            ("indent", "Execute step (the 30s video)"),
            ("body", "4. Unpin save_still_url"),
        ],
    },
    {
        "name": "note_1_still",
        "file": "1-still.png",
        "sticky_color": 5,
        "accent": (37, 99, 235),
        "lines": [
            ("title", "1 · The still"),
            ("body", "Least-used Active row goes first"),
            ("body", "GPT Image 2.5 (OpenRouter)"),
            ("body", "Grok Imagine 2.0 is off"),
        ],
    },
    {
        "name": "note_2_hop1",
        "file": "2-hop1.png",
        "sticky_color": 4,
        "accent": (22, 163, 74),
        "lines": [
            ("title", "2 · Hop 1 (0:00–0:15)"),
            ("body", "fal Kling v3 Pro · 1080p · 15s"),
            ("body", "Creatomate grabs frame 359,"),
            ("body", "the first frame of hop 2"),
        ],
    },
    {
        "name": "note_3_hop2",
        "file": "3-hop2.png",
        "sticky_color": 6,
        "accent": (124, 58, 237),
        "lines": [
            ("title", "3 · Hop 2 (0:15–0:30)"),
            ("body", "fal Kling v3 Pro · 1080p · 15s"),
            ("body", "Creatomate joins the 30s video"),
            ("body", "Saves the URLs to the sheet"),
        ],
    },
]


def font(kind: str) -> ImageFont.FreeTypeFont:
    if kind in ("title", "heading"):
        return ImageFont.truetype(str(FONT_TITLE), TITLE_PX * SCALE)
    return ImageFont.truetype(str(FONT_BODY), BODY_PX * SCALE)


def advance(kind: str) -> float:
    if kind == "gap":
        return GAP_BLOCK
    if kind in ("title", "heading"):
        return TITLE_PX * TITLE_LEADING + GAP_AFTER_TITLE
    return BODY_PX * BODY_LEADING


def text_px(kind: str, text: str) -> float:
    return ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(text, font=font(kind)) / SCALE


def render(note: dict) -> dict:
    widest = 0.0
    for kind, text in note["lines"]:
        if kind == "gap":
            continue
        widest = max(widest, text_px(kind, text) + (INDENT if kind == "indent" else 0))
    image_width = int((PAD_LEFT + widest + PAD_RIGHT + 19) // 20) * 20
    height = round(PAD_TOP + sum(advance(k) for k, _ in note["lines"]) + PAD_BOTTOM)
    w, h = image_width * SCALE, height * SCALE

    card = Image.new("RGBA", (w, h), CARD + (255,))
    draw = ImageDraw.Draw(card)
    draw.rectangle([0, 0, BAR * SCALE, h], fill=note["accent"] + (255,))

    max_text = (image_width - PAD_LEFT - PAD_RIGHT) * SCALE
    y = PAD_TOP * SCALE
    for kind, text in note["lines"]:
        if kind != "gap":
            f = font(kind)
            x = (PAD_LEFT + (INDENT if kind == "indent" else 0)) * SCALE
            room = max_text - (INDENT * SCALE if kind == "indent" else 0)
            used = draw.textlength(text, font=f)
            if used > room:
                raise SystemExit(
                    f"{note['file']}: '{text}' is {used / SCALE:.0f} px wide, room is {room / SCALE:.0f} px. Shorten it."
                )
            ink = INK_TITLE if kind == "title" else note.get("heading_ink", INK_TITLE) if kind == "heading" else INK_BODY
            draw.text((x, y), text, font=f, fill=ink + (255,))
        y += advance(kind) * SCALE

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=RADIUS * SCALE, fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(card, (0, 0), mask)
    ImageDraw.Draw(out).rounded_rectangle(
        [0, 0, w - 1, h - 1], radius=RADIUS * SCALE, outline=BORDER + (255,), width=2 * SCALE
    )

    path = OUT_DIR / note["file"]
    out.quantize(colors=96, method=Image.Quantize.FASTOCTREE).save(path, optimize=True)
    alt = ""
    for kind, text in note["lines"]:
        if kind == "gap":
            continue
        joins_previous = kind == "indent" or alt.endswith((",", "→"))
        alt += (" " if joins_previous else " · ") + text if alt else text
    return {
        "name": note["name"],
        "file": note["file"],
        "sticky_color": note["sticky_color"],
        "sticky_width": image_width + STICKY_PADDING,
        "image_width": image_width,
        "image_height": height,
        "alt": alt,
        "bytes": path.stat().st_size,
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = [render(n) for n in NOTES]
    (OUT_DIR / "notes.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for m in manifest:
        print(f"{m['file']}: {m['image_width']} x {m['image_height']} canvas px, {m['bytes'] // 1024} KB")


if __name__ == "__main__":
    main()
