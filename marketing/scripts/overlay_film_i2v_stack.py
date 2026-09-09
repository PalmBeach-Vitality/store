"""Rewrite Sheet 18 I2V columns to the per-beat Seedance / Kling / Veo stack.

Does not touch still_prompt, picked_url, take_urls, or 023/024/025 keepers.
"""

from pathlib import Path
import csv

# Beat table from the MOTS-C alien movie plan.
# 023/024/025 stay FINAL keepers — only I2V model columns change.
STACK = {
    "FILM-001": ("veo", "8", "9:16", "", "180"),
    "FILM-002": ("veo", "8", "9:16", "", "180"),
    "FILM-003": ("veo", "8", "9:16", "", "180"),
    "FILM-004": ("veo", "8", "9:16", "", "180"),
    "FILM-005": ("veo", "8", "9:16", "", "180"),
    "FILM-006": ("veo", "8", "9:16", "", "180"),
    "FILM-007": ("veo", "8", "9:16", "", "180"),
    "FILM-008": ("veo", "8", "9:16", "", "180"),
    "FILM-009": ("seedance", "10", "auto", "standard", "300"),
    "FILM-010": ("seedance", "10", "auto", "standard", "300"),
    "FILM-011": ("veo", "8", "9:16", "", "180"),
    "FILM-012": ("seedance", "10", "auto", "standard", "300"),
    "FILM-013": ("seedance", "10", "auto", "standard", "300"),
    "FILM-014": ("seedance", "10", "auto", "standard", "300"),
    "FILM-015": ("kling", "10", "", "", "180"),
    "FILM-016": ("seedance", "10", "auto", "standard", "300"),
    "FILM-017": ("seedance", "10", "auto", "standard", "300"),
    "FILM-018": ("seedance", "10", "auto", "standard", "300"),
    "FILM-019": ("veo", "8", "9:16", "", "180"),
    "FILM-020": ("kling", "10", "", "", "180"),
    "FILM-021": ("veo", "8", "9:16", "", "180"),
    "FILM-022": ("seedance", "10", "auto", "standard", "300"),
    "FILM-023": ("seedance", "10", "auto", "standard", "300"),
    "FILM-024": ("seedance", "10", "auto", "standard", "300"),
    "FILM-025": ("kling", "10", "", "", "180"),
}

MODELS = {
    "seedance": "bytedance/seedance-2.5/image-to-video",
    "kling": "fal-ai/kling-video/v3/pro/image-to-video",
    "veo": "fal-ai/veo3.1/image-to-video",
    "runway": "gen4.5",
}

START_URLS = {
    "seedance": "https://fal.run/bytedance/seedance-2.5/image-to-video",
    "kling": "https://fal.run/fal-ai/kling-video/v3/pro/image-to-video",
    "veo": "https://fal.run/fal-ai/veo3.1/image-to-video",
    "runway": "https://api.dev.runwayml.com/v1/image_to_video",
}

NEW_FIELDS = [
    "still_id",
    "rank",
    "category",
    "still_prompt",
    "still_edit_prompt",
    "n",
    "aspect_ratio",
    "still_resolution",
    "model_still",
    "status",
    "times_used",
    "last_used_at",
    "take_urls",
    "picked_url",
    "video_motion_prompt",
    "video_provider",
    "model_video",
    "duration_seconds",
    "video_resolution",
    "video_aspect_ratio",
    "audio",
    "bitrate_mode",
    "wait_seconds",
    "video_start_url",
    "video_url",
]


def apply_row(row):
    sid = row.get("still_id")
    if sid not in STACK:
        raise SystemExit("overlay_film_i2v_stack: unknown still_id " + str(sid))
    provider, duration, aspect, bitrate, wait = STACK[sid]
    row["video_provider"] = provider
    row["model_video"] = MODELS[provider]
    row["duration_seconds"] = duration
    row["video_resolution"] = "1080p"
    row["video_aspect_ratio"] = aspect
    row["audio"] = "false"
    row["bitrate_mode"] = bitrate
    row["wait_seconds"] = wait
    row["video_start_url"] = START_URLS[provider]
    return row


if __name__ == "__main__":
    p = Path(__file__).resolve().parents[1] / "sheets" / "18-motsc-film-stills.csv"
    with p.open(newline="", encoding="utf-8") as f:
        rows = [apply_row(r) for r in csv.DictReader(f)]
    if len(rows) != 25:
        raise SystemExit("expected 25 rows, got " + str(len(rows)))
    with p.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=NEW_FIELDS, lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print("updated", p)
