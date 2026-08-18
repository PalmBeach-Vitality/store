#!/usr/bin/env python3
"""Generate unique per-row camera angle / direction / move recipes for Grok video."""

from __future__ import annotations

from itertools import product


# Parameterized families — never use orbit/spin/circle/360 as camera language.
_FAMILY_SPECS: list[dict] = [
    {
        "shot_family": "static_lock",
        "energy": "still, museum-calm",
        "angles": ["eye-level", "slight-low", "slight-high", "three-quarter-left", "three-quarter-right"],
        "directions": ["locked"],
        "starts": ["centered mid-frame", "slightly left third", "slightly right third"],
        "speeds": ["frozen", "micro-focus only"],
        "move": (
            "locked tripod hold at {angle}, subject {start}, {speed} — "
            "camera body does not travel, direction {direction}, then hold"
        ),
        "framing": "tripod-locked {angle} hero, subject {start}",
        "direction_label": "no travel / locked",
    },
    {
        "shot_family": "push_in",
        "energy": "gentle forward",
        "angles": ["eye-level", "slight-low", "slight-high", "three-quarter-left", "three-quarter-right"],
        "directions": ["straight forward"],
        "starts": ["wide", "medium", "medium-close"],
        "speeds": ["creeping", "slow", "measured"],
        "move": (
            "{speed} straight push-in from {start} toward closer detail at {angle}, "
            "path is a straight forward line only ({direction}), then hold"
        ),
        "framing": "starts {start} at {angle}, ends closer with detail readable",
        "direction_label": "forward",
    },
    {
        "shot_family": "pull_back",
        "energy": "reveal",
        "angles": ["eye-level", "slight-high", "macro-plane", "three-quarter-left", "three-quarter-right"],
        "directions": ["straight backward"],
        "starts": ["extreme close texture", "tight badge crop", "tight edge crop"],
        "speeds": ["creeping", "slow", "measured"],
        "move": (
            "start on {start} then {speed} straight pull-back to full hero at {angle}, "
            "path is a straight retreat only ({direction}), then hold"
        ),
        "framing": "starts on {start}, pulls back to full product at {angle}",
        "direction_label": "backward",
    },
    {
        "shot_family": "vertical_rise",
        "energy": "lift",
        "angles": ["eye-level rising", "slight-low rising", "profile-left rising", "profile-right rising"],
        "directions": ["straight up"],
        "starts": ["base of subject", "lower third", "foot of instrument"],
        "speeds": ["creeping", "slow", "gentle"],
        "move": (
            "{speed} vertical rise from {start} to top detail at {angle}, "
            "path is a straight up-line only ({direction}), then hold"
        ),
        "framing": "begins at {start}, rises to upper detail, {angle}",
        "direction_label": "up",
    },
    {
        "shot_family": "vertical_descend",
        "energy": "settle down",
        "angles": ["high settling to eye-level", "high three-quarter", "overhead easing down"],
        "directions": ["straight down"],
        "starts": ["above subject", "high three-quarter", "upper rim"],
        "speeds": ["creeping", "slow", "measured"],
        "move": (
            "{speed} vertical descend from {start} into settled hero at {angle}, "
            "path is a straight down-line only ({direction}), then hold"
        ),
        "framing": "starts {start}, settles downward to {angle} hero",
        "direction_label": "down",
    },
    {
        "shot_family": "lateral_ltr",
        "energy": "parallax glide left-to-right",
        "angles": ["eye-level", "slight-low", "slight-high", "three-quarter"],
        "directions": ["left to right"],
        "starts": ["left of subject", "far left negative space", "just left of center"],
        "speeds": ["creeping", "slow", "measured"],
        "move": (
            "{speed} lateral slide {direction} starting {start} at {angle}, "
            "focus locked on subject, straight horizontal path only, then hold"
        ),
        "framing": "subject off-center; camera slides {direction} at {angle}",
        "direction_label": "left-to-right",
    },
    {
        "shot_family": "lateral_rtl",
        "energy": "parallax glide right-to-left",
        "angles": ["eye-level", "slight-low", "slight-high", "three-quarter"],
        "directions": ["right to left"],
        "starts": ["right of subject", "far right negative space", "just right of center"],
        "speeds": ["creeping", "slow", "measured"],
        "move": (
            "{speed} lateral slide {direction} starting {start} at {angle}, "
            "focus locked on subject, straight horizontal path only, then hold"
        ),
        "framing": "subject off-center; camera slides {direction} at {angle}",
        "direction_label": "right-to-left",
    },
    {
        "shot_family": "top_down",
        "energy": "architectural plan view",
        "angles": ["true top-down 90 degrees", "steep high angle 75 degrees", "near-overhead 80 degrees"],
        "directions": ["straight down"],
        "starts": ["higher overhead", "already plan-view", "from ceiling height"],
        "speeds": ["creeping", "slow", "measured"],
        "move": (
            "{speed} overhead descend {direction} from {start} into {angle} composition, "
            "path is a straight vertical drop only, then hold"
        ),
        "framing": "overhead geometric catalog composition at {angle}",
        "direction_label": "down into plan view",
    },
    {
        "shot_family": "tilt_up",
        "energy": "power reveal",
        "angles": ["low-angle power pose", "worm-level looking up", "low three-quarter"],
        "directions": ["tilt up only"],
        "starts": ["underside", "base flange", "lower chassis"],
        "speeds": ["slow", "measured", "deliberate"],
        "move": (
            "{speed} tilt-up from {start} to eye level at {angle}, "
            "pivot only ({direction}) — camera body does not truck around subject, then hold"
        ),
        "framing": "{angle} looking upward; starts on {start}",
        "direction_label": "tilt-up",
    },
    {
        "shot_family": "tilt_down",
        "energy": "inspect downward",
        "angles": ["high looking down", "standing over subject", "high three-quarter down"],
        "directions": ["tilt down only"],
        "starts": ["upper rim", "top badge", "high negative space"],
        "speeds": ["slow", "measured", "deliberate"],
        "move": (
            "{speed} tilt-down from {start} onto the subject at {angle}, "
            "pivot only ({direction}) — no lateral looping path, then hold"
        ),
        "framing": "{angle}; starts at {start} then tips down onto product",
        "direction_label": "tilt-down",
    },
    {
        "shot_family": "macro_detail",
        "energy": "scientific close-up",
        "angles": ["macro flat-on", "macro three-quarter", "macro slight-low", "macro edge-on"],
        "directions": ["tiny forward drift"],
        "starts": ["engraved texture", "metal microtexture", "glass caustic detail", "label typography grain"],
        "speeds": ["creeping", "ultra-slow", "barely moving"],
        "move": (
            "extreme macro on {start} at {angle}, razor shallow depth of field, "
            "{speed} {direction} only, then hard hold"
        ),
        "framing": "tight crop on {start}; {angle} macro",
        "direction_label": "micro forward",
    },
    {
        "shot_family": "crane_settle",
        "energy": "premium settle",
        "angles": ["high three-quarter to eye-level", "high front to eye-level", "high side to three-quarter"],
        "directions": ["straight descending crane"],
        "starts": ["high three-quarter", "high front", "high side"],
        "speeds": ["slow", "measured", "graceful"],
        "move": (
            "{speed} crane-down from {start} to settled hero ({angle}), "
            "path is a straight descending line ({direction}), then hold"
        ),
        "framing": "starts {start}, settles to {angle}",
        "direction_label": "crane down",
    },
    {
        "shot_family": "push_out",
        "energy": "expand",
        "angles": ["eye-level", "slight-high", "three-quarter-left", "three-quarter-right"],
        "directions": ["straight backward"],
        "starts": ["tight badge crop", "tight port crop", "tight edge crop"],
        "speeds": ["slow", "measured", "deliberate"],
        "move": (
            "{speed} straight push-out from {start} to full product at {angle}, "
            "path is a straight retreat only ({direction}), then hold"
        ),
        "framing": "starts {start}, ends full product in frame at {angle}",
        "direction_label": "backward expand",
    },
    {
        "shot_family": "pedestal_up",
        "energy": "luxury light play rising",
        "angles": ["eye-level", "slight-low", "three-quarter-left", "three-quarter-right"],
        "directions": ["straight up pedestal"],
        "starts": ["slightly below eye-line", "chest height", "label mid-band"],
        "speeds": ["soft", "slow", "creeping"],
        "move": (
            "{speed} pedestal up a few centimeters from {start} at {angle}, "
            "lighting wrap shifts on edges, no sideways travel ({direction}), then hold"
        ),
        "framing": "catalog hero at {angle}; pedestal rises from {start}",
        "direction_label": "pedestal up",
    },
    {
        "shot_family": "pedestal_down",
        "energy": "luxury light play settling",
        "angles": ["eye-level", "slight-high", "three-quarter-left", "three-quarter-right"],
        "directions": ["straight down pedestal"],
        "starts": ["slightly above eye-line", "upper third", "cap/top band"],
        "speeds": ["soft", "slow", "creeping"],
        "move": (
            "{speed} pedestal down a few centimeters from {start} at {angle}, "
            "lighting wrap shifts on edges, no sideways travel ({direction}), then hold"
        ),
        "framing": "catalog hero at {angle}; pedestal settles from {start}",
        "direction_label": "pedestal down",
    },
    {
        "shot_family": "profile_ltr",
        "energy": "editorial side track",
        "angles": ["true side profile left", "profile easing to three-quarter"],
        "directions": ["brief lateral left to right"],
        "starts": ["strict side profile", "near-profile"],
        "speeds": ["short", "measured", "brief"],
        "move": (
            "{speed} side-profile track {direction} from {start} at {angle}, "
            "then settle and hard hold — brief lateral only, never a full circle"
        ),
        "framing": "{angle}; starts {start}, settles after short track",
        "direction_label": "profile track L→R",
    },
    {
        "shot_family": "profile_rtl",
        "energy": "editorial side track reverse",
        "angles": ["true side profile right", "profile easing to three-quarter"],
        "directions": ["brief lateral right to left"],
        "starts": ["strict side profile", "near-profile"],
        "speeds": ["short", "measured", "brief"],
        "move": (
            "{speed} side-profile track {direction} from {start} at {angle}, "
            "then settle and hard hold — brief lateral only, never a full circle"
        ),
        "framing": "{angle}; starts {start}, settles after short track",
        "direction_label": "profile track R→L",
    },
    {
        "shot_family": "doc_drift",
        "energy": "observational",
        "angles": ["eye-level documentary", "slight handheld high", "slight handheld low"],
        "directions": ["micro forward drift"],
        "starts": ["mid-shot", "loose mid-shot", "observational medium"],
        "speeds": ["handheld-stable", "documentary-slow", "barely drifting"],
        "move": (
            "{speed} micro drift {direction} from {start} at {angle}, "
            "scientific documentary energy, then hold — no circling path"
        ),
        "framing": "documentary {start} at {angle}, slightly imperfect stability",
        "direction_label": "doc forward drift",
    },
    {
        "shot_family": "label_rise",
        "energy": "typography lock",
        "angles": ["label-plane flat", "label-plane slight three-quarter", "label-plane eye-level"],
        "directions": ["straight up to label lock"],
        "starts": ["below label", "lower body", "base then up"],
        "speeds": ["short", "slow", "measured"],
        "move": (
            "{speed} vertical lift from {start} then lock off on the label plane at {angle}, "
            "straight rise only ({direction}), then hold"
        ),
        "framing": "ends locked on label/typography plane at {angle}",
        "direction_label": "rise to label",
    },
    {
        "shot_family": "wide_env",
        "energy": "facility to product",
        "angles": ["eye-level wide", "slight-high wide", "three-quarter wide"],
        "directions": ["straight forward into subject"],
        "starts": ["wide sterile environment", "room-context wide", "bench-context wide"],
        "speeds": ["very slow", "creeping", "measured"],
        "move": (
            "{speed} push-in from {start} into subject-dominant frame at {angle}, "
            "straight forward path only ({direction}), then hold"
        ),
        "framing": "starts {start}; subject becomes dominant at {angle}",
        "direction_label": "wide to hero forward",
    },
    {
        "shot_family": "offset_left",
        "energy": "asymmetric editorial left",
        "angles": ["eye-level", "slight-low", "slight-high"],
        "directions": ["subtle breathing push-in"],
        "starts": ["subject on left third", "subject far left third"],
        "speeds": ["locked with breath", "barely pushing", "micro push"],
        "move": (
            "locked offset composition with subject {start} at {angle}, "
            "{speed} {direction} only, negative space on right, then hold"
        ),
        "framing": "{start}, negative space opposite, {angle}",
        "direction_label": "offset left micro-push",
    },
    {
        "shot_family": "offset_right",
        "energy": "asymmetric editorial right",
        "angles": ["eye-level", "slight-low", "slight-high"],
        "directions": ["subtle breathing push-in"],
        "starts": ["subject on right third", "subject far right third"],
        "speeds": ["locked with breath", "barely pushing", "micro push"],
        "move": (
            "locked offset composition with subject {start} at {angle}, "
            "{speed} {direction} only, negative space on left, then hold"
        ),
        "framing": "{start}, negative space opposite, {angle}",
        "direction_label": "offset right micro-push",
    },
    {
        "shot_family": "dolly_in_low",
        "energy": "low approach",
        "angles": ["low-angle", "very slight low", "low three-quarter-left", "low three-quarter-right"],
        "directions": ["straight forward low"],
        "starts": ["low medium", "low wide", "low medium-close"],
        "speeds": ["slow", "measured", "creeping"],
        "move": (
            "{speed} low dolly-in from {start} at {angle}, "
            "straight forward path only ({direction}), then hold"
        ),
        "framing": "low approach from {start} at {angle}",
        "direction_label": "low forward",
    },
    {
        "shot_family": "dolly_in_high",
        "energy": "high approach",
        "angles": ["slight-high", "high three-quarter", "steep high"],
        "directions": ["straight forward high"],
        "starts": ["high medium", "high wide", "high medium-close"],
        "speeds": ["slow", "measured", "creeping"],
        "move": (
            "{speed} high dolly-in from {start} at {angle}, "
            "straight forward path only ({direction}), then hold"
        ),
        "framing": "high approach from {start} at {angle}",
        "direction_label": "high forward",
    },
]


def _expand_family(spec: dict) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for angle, direction, start, speed in product(
        spec["angles"], spec["directions"], spec["starts"], spec["speeds"]
    ):
        ctx = {
            "angle": angle,
            "direction": direction,
            "start": start,
            "speed": speed,
        }
        camera_move = spec["move"].format(**ctx)
        framing = spec["framing"].format(**ctx)
        out.append(
            {
                "shot_family": spec["shot_family"],
                "camera_angle": angle,
                "camera_direction": spec.get("direction_label") or direction,
                "camera_move": camera_move,
                "framing": framing,
                "energy": spec["energy"],
            }
        )
    return out


def generate_all_recipes() -> list[dict[str, str]]:
    recipes: list[dict[str, str]] = []
    seen_moves: set[str] = set()
    for spec in _FAMILY_SPECS:
        for rec in _expand_family(spec):
            key = rec["camera_move"].strip().lower()
            if key in seen_moves:
                continue
            seen_moves.add(key)
            recipes.append(rec)
    return recipes


def interleave_recipes(recipes: list[dict[str, str]], n: int) -> list[dict[str, str]]:
    """Pick n recipes so adjacent items never share shot_family."""
    from collections import deque

    if len(recipes) < n:
        raise SystemExit(f"Need at least {n} unique camera recipes, got {len(recipes)}")

    buckets: dict[str, deque] = {}
    for r in recipes:
        buckets.setdefault(r["shot_family"], deque()).append(r)

    # Round-robin families for adjacency safety
    family_cycle = [s["shot_family"] for s in _FAMILY_SPECS if s["shot_family"] in buckets]
    out: list[dict[str, str]] = []
    prev = None
    guard = 0
    while len(out) < n:
        guard += 1
        if guard > n * 50:
            raise SystemExit("Failed to interleave camera recipes without adjacent family repeat")
        progress = False
        for fam in family_cycle:
            if len(out) >= n:
                break
            q = buckets.get(fam)
            if not q:
                continue
            if fam == prev:
                continue
            out.append(q.popleft())
            prev = fam
            progress = True
        if progress:
            continue
        # only prev left with items — find any other, else allow break via insert logic
        others = [f for f, q in buckets.items() if q and f != prev]
        if others:
            fam = others[0]
            out.append(buckets[fam].popleft())
            prev = fam
            continue
        # forced same family — insert earlier if possible
        fam = next(f for f, q in buckets.items() if q)
        item = buckets[fam].popleft()
        inserted = False
        for i in range(len(out), -1, -1):
            left = out[i - 1]["shot_family"] if i > 0 else None
            right = out[i]["shot_family"] if i < len(out) else None
            if left == item["shot_family"] or right == item["shot_family"]:
                continue
            if i < min(8, len(out)):
                continue
            out.insert(i, item)
            inserted = True
            break
        if not inserted:
            out.append(item)
        prev = out[-1]["shot_family"]

    for i in range(1, len(out)):
        if out[i]["shot_family"] == out[i - 1]["shot_family"]:
            raise SystemExit(
                f"Adjacent shot_family at indices {i-1}/{i}: {out[i]['shot_family']}"
            )
    return out[:n]


def build_unique_camera_sequence(n: int = 500) -> list[dict[str, str]]:
    recipes = generate_all_recipes()
    return interleave_recipes(recipes, n)


if __name__ == "__main__":
    all_r = generate_all_recipes()
    seq = build_unique_camera_sequence(500)
    print("total unique recipes available:", len(all_r))
    print("sequence:", len(seq))
    print("unique moves in sequence:", len({r["camera_move"] for r in seq}))
    print("families:", sorted({r["shot_family"] for r in seq}))
    adj = sum(
        1 for i in range(1, len(seq)) if seq[i]["shot_family"] == seq[i - 1]["shot_family"]
    )
    print("adjacent same family:", adj)
