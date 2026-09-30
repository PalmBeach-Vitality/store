#!/usr/bin/env python3
"""Render big-type sticky-note images for peptide_molecule_vid_gen_v2.

n8n sticky text tops out at the Markdown H1 size (36 px on the canvas), and the
editor accepts no HTML, so text can't be set any bigger. An image with `#full-width`
fills the sticky, so these PNGs carry the note text at 4x that size (144 px body,
176 px titles on the canvas). They render at 2x for sharp text when zoomed in.

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
# Canvas px. The old sticky's H1 lines were 36 px; 4x that is the floor for every line.
TITLE_PX = 176
BODY_PX = 144
TITLE_LEADING = 1.18
BODY_LEADING = 1.28
GAP_AFTER_TITLE = 20
GAP_BLOCK = 64
INDENT = 96

# The sticky's width minus its inner padding, so the image lands at 1:1 on the canvas.
STICKY_WIDTH = 2860
STICKY_PADDING = 24
IMAGE_WIDTH = STICKY_WIDTH - STICKY_PADDING

PAD_TOP = 56
PAD_BOTTOM = 64
PAD_RIGHT = 64
BAR = 28
PAD_LEFT = BAR + 64
RADIUS = 36

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
            ("body", "Smoke test · 23-molecule-smoke-2"),
            ("body", "30s · 1080 × 1920 · 9:16 · no sound"),
            ("body", "Every prompt comes from the sheet"),
            ("gap", ""),
            ("heading", "How to run"),
            ("body", "1. save_still_url → Execute step"),
            ("indent", "Makes the still only"),
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
            ("body", "Top: GPT Image 2.5 (OpenRouter)"),
            ("body", "Bottom: Grok Imagine 2.0 (xAI)"),
            ("body", "The row’s model_still picks one"),
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


def render(note: dict) -> dict:
    height = round(PAD_TOP + sum(advance(k) for k, _ in note["lines"]) + PAD_BOTTOM)
    w, h = IMAGE_WIDTH * SCALE, height * SCALE

    card = Image.new("RGBA", (w, h), CARD + (255,))
    draw = ImageDraw.Draw(card)
    draw.rectangle([0, 0, BAR * SCALE, h], fill=note["accent"] + (255,))

    max_text = (IMAGE_WIDTH - PAD_LEFT - PAD_RIGHT) * SCALE
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
    alt = " · ".join(t for k, t in note["lines"] if k != "gap")
    return {
        "name": note["name"],
        "file": note["file"],
        "sticky_color": note["sticky_color"],
        "sticky_width": STICKY_WIDTH,
        "image_width": IMAGE_WIDTH,
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
