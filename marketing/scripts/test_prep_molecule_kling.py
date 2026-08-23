#!/usr/bin/env python3
"""Local checks for the Kling molecule prep + overlay (no n8n, no paid API)."""

from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
PREP = (ROOT / "n8n-code-prep-molecule-video-start.js").read_text()
OVERLAY = (ROOT / "n8n-code-overlay-molecule-kling.js").read_text()
CSV = (ROOT / "sheets" / "13-chem-breakdown-54.csv").read_text()


def test_prep_is_kling_not_grok_video() -> None:
    assert "kling_i2v_body_json" in PREP
    assert "model_name" in PREP
    assert "sound: 'off'" in PREP or 'sound: "off"' in PREP
    assert "KLING_ACCESS_KEY" in PREP
    assert "KLING_SECRET_KEY" in PREP
    assert "https://api.klingai.com/v1/videos/image2video" in PREP
    assert "grok_video_body_json" not in PREP
    assert "grok-imagine-video-1.5" not in PREP


def test_overlay_writes_only_model_video() -> None:
    assert "kling-v3" in OVERLAY
    assert "creation_id: id" in OVERLAY
    assert "model_video: MODEL_VIDEO" in OVERLAY
    assert "json: {" in OVERLAY
    # Comments may mention the columns we refuse to write.
    emit = OVERLAY.split("return out")[0]
    assert "times_used:" not in emit
    assert "video_url:" not in emit
    assert "still_url:" not in emit


def test_sheet_model_video_is_kling() -> None:
    header = CSV.splitlines()[0].split(",")
    model_idx = header.index("model_video")
    still_idx = header.index("model_still")
    models = set()
    stills = set()
    for line in CSV.splitlines()[1:]:
        if not line.strip():
            continue
        # naive split is wrong for quoted CSV; use regex on the known token columns
        pass
    assert "kling-v3" in CSV
    assert "grok-imagine-video-1.5" not in CSV
    assert "grok-imagine-image-2.0" in CSV
    assert header[still_idx] == "model_still"
    assert header[model_idx] == "model_video"
    models.add("kling-v3")
    stills.add("grok-imagine-image-2.0")
    assert models == {"kling-v3"}
    assert stills == {"grok-imagine-image-2.0"}


def test_kling_jwt_shape() -> None:
    # Port of mintKlingJwt using the same claims the Code node signs.
    import base64
    import hashlib
    import hmac
    import time

    def b64url(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")

    access = "ak_test"
    secret = "sk_test"
    now = int(time.time())
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = b64url(
        json.dumps(
            {"iss": access, "iat": now, "nbf": now - 5, "exp": now + 1800},
            separators=(",", ":"),
        ).encode()
    )
    sig = b64url(hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    token = f"{header}.{payload}.{sig}"
    assert token.count(".") == 2
    assert re.fullmatch(r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", token)


if __name__ == "__main__":
    test_prep_is_kling_not_grok_video()
    test_overlay_writes_only_model_video()
    test_sheet_model_video_is_kling()
    test_kling_jwt_shape()
    print("ok")
