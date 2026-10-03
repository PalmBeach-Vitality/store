#!/usr/bin/env python3
"""Build `14-chem-breakdown-54` in the smoke-test shape.

Same columns, still engine, and 15s+15s 1080p video plan as `23-molecule-smoke-2`.
54 rows keep the PBVita-Chem-001…054 ids and compound order of Sheet 13.
Every still is GPT Image 2.5. Every look is its own scene. times_used starts at 0,
including the rows Sheet 13 had already counted. Output columns start blank.

Does NOT modify 13-chem-breakdown-54.csv. The old workflow keeps that tab.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "sheets" / "13-chem-breakdown-54.csv"
OUT = ROOT / "sheets" / "14-chem-breakdown-54.csv"
TAB = "14-chem-breakdown-54"

FIELDS = [
    "creation_id",
    "rank",
    "status",
    "compound_name",
    "look_name",
    "model_still",
    "still_prompt",
    "aspect_ratio",
    "still_resolution",
    "still_size",
    "still_quality",
    "still_n",
    "still_timeout_seconds",
    "model_video",
    "resolution",
    "hop1_duration_seconds",
    "video_motion_prompt",
    "hop2_duration_seconds",
    "extend_motion_prompt",
    "negative_prompt",
    "cfg_scale",
    "video_poll_seconds",
    "video_max_wait_seconds",
    "render_width",
    "render_height",
    "render_frame_rate",
    "video_format",
    "last_frame_format",
    "creatomate_poll_seconds",
    "creatomate_max_polls",
    "times_used",
    "last_used_at",
    "still_url",
    "hop1_video_url",
    "last_frame_url",
    "hop2_video_url",
    "video_url",
]

NUMERIC = {
    "rank",
    "still_n",
    "still_timeout_seconds",
    "hop1_duration_seconds",
    "hop2_duration_seconds",
    "cfg_scale",
    "video_poll_seconds",
    "video_max_wait_seconds",
    "render_width",
    "render_height",
    "render_frame_rate",
    "creatomate_poll_seconds",
    "creatomate_max_polls",
    "times_used",
}

OUTPUT_COLUMNS = {
    "last_used_at",
    "still_url",
    "hop1_video_url",
    "last_frame_url",
    "hop2_video_url",
    "video_url",
}

PROMPT_COLUMNS = ("still_prompt", "video_motion_prompt", "extend_motion_prompt", "negative_prompt")

SILENT_PREFIX = "Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio."
KLING_PROMPT_MAX = 2500

STILL_HEADER = (
    "Photorealistic cinematic science-fiction film still, vertical 9:16 frame. "
    "Hyperreal, as if a real cinema camera with a macro probe lens were floating inside "
    "living tissue: physically accurate light, refraction, reflections and depth of field. "
    "Premium feature-film visual effects, like the hero shot of a big-budget science-fiction movie. "
)

STILL_LOCK = (
    "The image contains no text, letters, numbers, labels, logos or watermarks, "
    "and no people, hands, vials or pens."
)

NEGATIVE = (
    "text, letters, numbers, labels, captions, logos, watermark, people, hands, faces, "
    "vials, pens, bottles, cartoon, clay, plastic toy look, flat diagram, infographic, "
    "grainy microscope footage, low resolution, blur, noise, flicker, morphing, warping, "
    "distortion, jitter, cuts, scene change, fade to black, low quality"
)

SHARED = {
    "status": "Active",
    "aspect_ratio": "9:16",
    "still_resolution": "2k",
    "still_size": "1440x2560",
    "still_quality": "high",
    "still_n": 1,
    "still_timeout_seconds": 600,
    "model_still": "openai/gpt-image-2.5-sunburst",
    "model_video": "fal-ai/kling-video/v3/pro/image-to-video",
    "resolution": "1080p",
    "hop1_duration_seconds": 15,
    "hop2_duration_seconds": 15,
    "negative_prompt": NEGATIVE,
    "cfg_scale": 0.5,
    "video_poll_seconds": 5,
    "video_max_wait_seconds": 900,
    "render_width": 1080,
    "render_height": 1920,
    "render_frame_rate": 24,
    "video_format": "mp4",
    "last_frame_format": "png",
    "creatomate_poll_seconds": 15,
    "creatomate_max_polls": 20,
    "times_used": 0,
}

# Sheet 13 spelled this name wrong. The new tab uses the catalog spelling.
NAME_FIX = {"Cagrilinitide": "Cagrilintide"}

RISKY = [
    "needle", "syringe", "inject", "injection", "jab", "drug", "narcotic", "steroid",
    "blood", "gore", "wound", "serum", "plasma", "vein", "veins",
    "crash", "impact", "collide", "collision", "wreck", "debris", "explosion", "explode",
    "blast", "bomb", "fire", "flames", "burning", "shoot", "weapon", "missile", "violent",
    "crystal", "crystalline", "child", "kid", "baby", "teen", "celebrity", "wolverine",
]

GPT_SIZE_MIN_PX = 655_360
GPT_SIZE_MAX_PX = 8_294_400
GPT_SIZE_STABLE_PX = 3_686_400
GPT_EDGE_MAX = 3840

# One record per PBVita-Chem row, in Sheet 13 order. Two looks per compound.
# hero, world, light, camera, color, hop1 action, hop2 action, look_name
# Imported from the sibling module so this file stays the checker and writer.
from chem14_looks import LOOKS  # noqa: E402


def still_prompt(look: dict) -> str:
    return (
        STILL_HEADER
        + "HERO: " + look["hero"] + " "
        + "WORLD: " + look["world"] + " "
        + "LIGHT: " + look["light"] + " "
        + "CAMERA: " + look["camera"] + " "
        + "COLOR: " + look["color"] + " "
        + STILL_LOCK
    )


def hop(move: str, action: str, keep: str) -> str:
    return (
        "One continuous camera move with no cuts. "
        + move
        + " "
        + action
        + " "
        + keep
        + " The camera is still moving on the last frame."
    )


def ratio(aspect: str) -> tuple[int, int]:
    w, h = aspect.split(":")
    return int(w), int(h)


def check_rows(rows: list[dict]) -> None:
    if len(rows) != 54:
        raise SystemExit(f"expected 54 rows, got {len(rows)}")
    ids = [r["creation_id"] for r in rows]
    if ids != [f"PBVita-Chem-{i:03d}" for i in range(1, 55)]:
        raise SystemExit("creation ids must stay PBVita-Chem-001 through 054 in order")
    if len({r["look_name"] for r in rows}) != 54:
        raise SystemExit("look_name values are not unique")
    if len({r["still_prompt"] for r in rows}) != 54:
        raise SystemExit("still prompts are not unique")

    for r in rows:
        cid = r["creation_id"]
        for k in FIELDS:
            if k in OUTPUT_COLUMNS:
                if r[k] != "":
                    raise SystemExit(f"{cid}: output column {k} must start blank")
                continue
            if r[k] == "" or r[k] is None:
                raise SystemExit(f"{cid}: {k} is empty")
        if r["model_still"] != "openai/gpt-image-2.5-sunburst":
            raise SystemExit(f"{cid}: model_still must be GPT Image 2.5 Sunburst")
        if int(r["times_used"]) != 0:
            raise SystemExit(f"{cid}: times_used must reset to 0")
        if r["compound_name"] == "Cagrilinitide":
            raise SystemExit(f"{cid}: use the catalog spelling Cagrilintide")

        for col in PROMPT_COLUMNS:
            text = r[col].lower()
            for word in RISKY:
                if re.search(rf"\b{re.escape(word)}\b", text):
                    raise SystemExit(f"{cid}: {col} carries risky token '{word}'")
            if re.search(
                rf"(?<![a-z0-9]){re.escape(r['compound_name'].lower())}(?![a-z0-9])",
                text,
            ):
                raise SystemExit(f"{cid}: {col} prints the compound name")

        for col in ("video_motion_prompt", "extend_motion_prompt"):
            sent = f"{SILENT_PREFIX} {r[col]}"
            if len(sent) > KLING_PROMPT_MAX:
                raise SystemExit(f"{cid}: {col} + silent prefix is {len(sent)} chars > {KLING_PROMPT_MAX}")
            if "no cuts" not in r[col] or "last frame" not in r[col]:
                raise SystemExit(f"{cid}: {col} must ask for one take and motion on the last frame")
        if len(r["negative_prompt"]) > KLING_PROMPT_MAX:
            raise SystemExit(f"{cid}: negative_prompt over {KLING_PROMPT_MAX}")

        aw, ah = ratio(r["aspect_ratio"])
        if (aw, ah) != (9, 16):
            raise SystemExit(f"{cid}: 9:16 only")
        sw, sh = (int(x) for x in r["still_size"].split("x"))
        if sw * ah != sh * aw:
            raise SystemExit(f"{cid}: still_size {r['still_size']} is not {r['aspect_ratio']}")
        if sw % 16 or sh % 16 or max(sw, sh) > GPT_EDGE_MAX:
            raise SystemExit(f"{cid}: still_size edges must be multiples of 16 and <= {GPT_EDGE_MAX}")
        if not GPT_SIZE_MIN_PX <= sw * sh <= GPT_SIZE_MAX_PX:
            raise SystemExit(f"{cid}: still_size pixel count outside GPT Image range")
        if sw * sh > GPT_SIZE_STABLE_PX:
            raise SystemExit(f"{cid}: still_size above {GPT_SIZE_STABLE_PX} px is experimental")
        if r["render_width"] * ah != r["render_height"] * aw:
            raise SystemExit(f"{cid}: render size is not {r['aspect_ratio']}")
        if min(sw, sh) < r["render_width"]:
            raise SystemExit(f"{cid}: still short side is softer than the video")
        if r["resolution"] != "1080p" or "720" in r["resolution"]:
            raise SystemExit(f"{cid}: resolution must be 1080p")
        if not r["model_video"].startswith("fal-ai/kling-video/v3/pro/"):
            raise SystemExit(f"{cid}: model_video must be fal Kling v3 Pro")
        if r["hop1_duration_seconds"] + r["hop2_duration_seconds"] != 30:
            raise SystemExit(f"{cid}: hops must add up to the 30s cut")
        if r["video_motion_prompt"] == r["extend_motion_prompt"]:
            raise SystemExit(f"{cid}: hop 2 reuses the hop 1 prompt")

    for col in ("video_motion_prompt", "extend_motion_prompt", "look_name"):
        if len({r[col] for r in rows}) != 54:
            raise SystemExit(f"{col} values are not unique")
    worlds = [r["still_prompt"].split("WORLD: ", 1)[1].split(" LIGHT:", 1)[0] for r in rows]
    if len(set(worlds)) != 54:
        raise SystemExit("rows share a WORLD")


def build_rows() -> list[dict]:
    src = list(csv.DictReader(SRC.open(encoding="utf-8")))
    if len(src) != 54 or len(LOOKS) != 54:
        raise SystemExit(f"source {len(src)} looks {len(LOOKS)}")
    rows = []
    for src_row, look in zip(src, LOOKS):
        name = NAME_FIX.get(src_row["compound_name"], src_row["compound_name"])
        row = {k: "" for k in FIELDS}
        row.update(SHARED)
        row.update(
            {
                "creation_id": src_row["creation_id"],
                "rank": int(src_row["rank"]),
                "compound_name": name,
                "look_name": look["look_name"],
                "still_prompt": still_prompt(look),
                "video_motion_prompt": hop(look["hop1_move"], look["hop1_action"], look["keep"]),
                "extend_motion_prompt": hop(look["hop2_move"], look["hop2_action"], look["keep"]),
            }
        )
        rows.append(row)
    return rows


def main() -> None:
    rows = build_rows()
    check_rows(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {OUT.relative_to(ROOT.parent)}: {len(rows)} rows x {len(FIELDS)} columns")
    for r in rows:
        print(
            f"  {r['creation_id']}  {r['compound_name']:<24} {r['look_name']:<28} "
            f"still={len(r['still_prompt'])} "
            f"hop1={len(SILENT_PREFIX) + 1 + len(r['video_motion_prompt'])} "
            f"hop2={len(SILENT_PREFIX) + 1 + len(r['extend_motion_prompt'])}"
        )


if __name__ == "__main__":
    main()
