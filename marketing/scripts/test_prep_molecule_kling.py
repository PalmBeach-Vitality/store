#!/usr/bin/env python3
"""Local checks for the kie Kling molecule prep + overlay (no n8n, no paid API)."""

from __future__ import annotations

import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PREP = (ROOT / "n8n-code-prep-molecule-video-start.js").read_text()
SAVE = (ROOT / "n8n-code-save-molecule-video-url.js").read_text()
OVERLAY = (ROOT / "n8n-code-overlay-molecule-kling.js").read_text()
CSV = (ROOT / "sheets" / "13-chem-breakdown-54.csv").read_text()
MODEL = "kling-3.0-omni/image-to-video"


def test_prep_is_kie_kling_not_grok_video() -> None:
    assert "kling_i2v_body_json" in PREP
    assert "image_urls" in PREP
    assert "audio: false" in PREP
    assert "https://api.kie.ai/api/v1/jobs/createTask" in PREP
    assert "KLING_ACCESS_KEY" not in PREP
    assert "KLING_SECRET_KEY" not in PREP
    assert "kling_jwt" not in PREP
    assert "api.klingai.com" not in PREP
    assert "grok_video_body_json" not in PREP
    assert "grok-imagine-video-1.5" not in PREP


def test_save_reads_kie_result() -> None:
    assert "resultUrls" in SAVE
    assert "resultJson" in SAVE
    assert "taskId" in SAVE
    assert "data.task_result" not in SAVE


def test_overlay_writes_only_model_video() -> None:
    assert MODEL in OVERLAY
    assert "creation_id: id" in OVERLAY
    assert "model_video: MODEL_VIDEO" in OVERLAY
    assert "json: {" in OVERLAY
    emit = OVERLAY.split("return out")[0]
    assert "times_used:" not in emit
    assert "video_url:" not in emit
    assert "still_url:" not in emit


def test_sheet_model_video_is_kie_kling() -> None:
    header = CSV.splitlines()[0].split(",")
    model_idx = header.index("model_video")
    still_idx = header.index("model_still")
    assert header[still_idx] == "model_still"
    assert header[model_idx] == "model_video"
    assert MODEL in CSV
    assert "kling-v3" not in CSV
    assert "grok-imagine-video-1.5" not in CSV
    assert "grok-imagine-image-2.0" in CSV


if __name__ == "__main__":
    test_prep_is_kie_kling_not_grok_video()
    test_save_reads_kie_result()
    test_overlay_writes_only_model_video()
    test_sheet_model_video_is_kie_kling()
    print("ok")
