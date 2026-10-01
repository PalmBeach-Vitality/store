#!/usr/bin/env python3
"""Give every Sheet 14 row one slow camera move Kling can actually follow.

Exec 2635 asked Pen-169 for a locked tripod. Kling arced around the pen.
A lock sentence does not stay locked, and "then hold" stops a 15s clip.
Each row now gets one move for the whole shot, starting from the still's
angle: dolly-in, dolly-out, truck, pedestal, overhead down, or a small tilt.

video_prompt, framing, and times_used are not modified.
"""

from __future__ import annotations

import csv
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audit_pen_camera_moves import (  # noqa: E402
    ALLOWED_ANGLES,
    ALLOWED_DIRECTIONS,
    FORBIDDEN_FAMILIES,
    find_defects,
)
from shorten_pen_video_motion_prompts import (  # noqa: E402
    NEGATIVE_PROMPT,
    ascii,
    build_motion_prompt,
)

ROOT = Path(__file__).resolve().parents[1]
CSV14 = ROOT / "sheets" / "14-pen-creations-150.csv"
SDK = ROOT / "workflows" / "fix_pen_camera_moves.sdk.js"

ANGLE_ALIAS = {
    "eye-level": "eye-level",
    "slight-low": "slight-low",
    "slight-high": "slight-high",
    "three-quarter-left": "three-quarter-left",
    "three-quarter-right": "three-quarter-right",
    "low-angle": "low-angle",
    "high looking down": "high looking down",
    "true side profile left": "true side profile left",
    "true side profile right": "true side profile right",
    "true top-down 90 degrees": "true top-down 90 degrees",
    "macro flat-on": "macro flat-on",
    "label-plane flat": "label-plane flat",
    "eye-level rising": "eye-level",
    "high three-quarter to eye-level": "high three-quarter",
    "eye-level documentary": "eye-level",
    "eye-level wide": "eye-level",
    "low-angle power pose": "low-angle",
    "high settling to eye-level": "slight-high",
}

# kind, shot_family, camera_direction
PLAN = {
    "push_in": ("dolly_in", "push_in", "forward"),
    "pull_back": ("dolly_out", "pull_back", "backward"),
    "push_out": ("dolly_out", "push_out", "backward"),
    "dolly_in_low": ("dolly_in", "dolly_in_low", "forward"),
    "dolly_in_high": ("dolly_in", "dolly_in_high", "forward"),
    "wide_env": ("dolly_in", "wide_env", "forward"),
    "doc_drift": ("dolly_in", "push_in", "forward"),
    "offset_left": ("dolly_left", "offset_left", "forward"),
    "offset_right": ("dolly_right", "offset_right", "forward"),
    "lateral_ltr": ("truck_ltr", "lateral_ltr", "left to right"),
    "lateral_rtl": ("truck_rtl", "lateral_rtl", "right to left"),
    "profile_ltr": ("truck_profile_ltr", "profile_ltr", "left to right"),
    "profile_rtl": ("truck_profile_rtl", "profile_rtl", "right to left"),
    "vertical_rise": ("pedestal_up", "vertical_rise", "up"),
    "pedestal_up": ("pedestal_up", "pedestal_up", "up"),
    "label_rise": ("pedestal_up", "label_rise", "up"),
    "vertical_descend": ("pedestal_down", "vertical_descend", "down"),
    "pedestal_down": ("pedestal_down", "pedestal_down", "down"),
    "crane_settle": ("pedestal_down", "pedestal_down", "down"),
    "top_down": ("overhead", "top_down", "down"),
    "tilt_up": ("tilt_up", "tilt_up", "tilt up"),
    "tilt_down": ("tilt_down", "tilt_down", "tilt down"),
    "macro_detail": ("truck_close", "macro_detail", "left to right"),
}

FROZEN = ("video_prompt", "framing", "times_used", "compound_name", "still_edit_prompt")


def move_text(kind: str, angle: str) -> str:
    text = {
        "dolly_in": (
            "Slow steady dolly-in. The camera moves straight forward toward the pen "
            f"for the whole shot. The angle stays {angle}"
        ),
        "dolly_out": (
            "Slow steady dolly-out. The camera moves straight backward away from the pen "
            f"for the whole shot. The angle stays {angle}"
        ),
        "dolly_left": (
            "Slow steady dolly-in. The camera moves straight forward toward the pen "
            f"for the whole shot. The pen stays on the left third. The angle stays {angle}"
        ),
        "dolly_right": (
            "Slow steady dolly-in. The camera moves straight forward toward the pen "
            f"for the whole shot. The pen stays on the right third. The angle stays {angle}"
        ),
        "truck_ltr": (
            "Slow steady truck to the right. The camera slides from left to right "
            f"for the whole shot. The angle stays {angle}"
        ),
        "truck_rtl": (
            "Slow steady truck to the left. The camera slides from right to left "
            f"for the whole shot. The angle stays {angle}"
        ),
        "truck_profile_ltr": (
            "Slow steady truck to the right. The camera slides from left to right "
            f"for the whole shot and keeps the pen in side profile. The angle stays {angle}"
        ),
        "truck_profile_rtl": (
            "Slow steady truck to the left. The camera slides from right to left "
            f"for the whole shot and keeps the pen in side profile. The angle stays {angle}"
        ),
        "truck_close": (
            "Slow steady truck to the right. The camera stays close on the pen and slides "
            f"from left to right for the whole shot. The angle stays {angle}"
        ),
        "pedestal_up": (
            "Slow steady pedestal up. The camera rises straight up for the whole shot "
            f"and stays level. The angle stays {angle}"
        ),
        "pedestal_down": (
            "Slow steady pedestal down. The camera lowers straight down for the whole shot "
            f"and stays level. The angle stays {angle}"
        ),
        "tilt_up": (
            "Slow steady tilt up. The camera stays in place and tips upward for the whole shot. "
            f"It begins at {angle}"
        ),
        "tilt_down": (
            "Slow steady tilt down. The camera stays in place and tips downward for the whole shot. "
            f"It begins at {angle}"
        ),
        "overhead": (
            "Slow steady move straight down. The camera stays directly above the pen "
            f"for the whole shot. The angle stays {angle}"
        ),
    }.get(kind)
    if not text:
        raise SystemExit(f"unknown camera kind {kind}")
    return text


def plan_for(row: dict) -> tuple[str, str, str, str]:
    family = row["shot_family"]
    angle = ANGLE_ALIAS.get(row["camera_angle"])
    if not angle:
        raise SystemExit(f"{row['creation_id']}: unknown camera_angle {row['camera_angle']!r}")
    if family == "static_lock":
        low = row["camera_move"].lower()
        if "left third" in low:
            kind, new_family, direction = ("truck_rtl", "lateral_rtl", "right to left")
        elif "right third" in low:
            kind, new_family, direction = ("truck_ltr", "lateral_ltr", "left to right")
        elif "centered" in low:
            kind, new_family, direction = ("dolly_in", "push_in", "forward")
        else:
            raise SystemExit(f"{row['creation_id']}: static_lock has no subject position")
    else:
        spec = PLAN.get(family)
        if not spec:
            raise SystemExit(f"{row['creation_id']}: unknown shot_family {family}")
        kind, new_family, direction = spec
    return new_family, angle, direction, move_text(kind, angle)


def js_quote(value: str) -> str:
    if any(ch in value for ch in ("'", '"', "\\", "\n", "\r")):
        raise SystemExit(f"cannot embed in jsCode: {value!r}")
    return "'" + value + "'"


ASCII_FN = (
    "function ascii(s) { var t = String(s || ''); var map = {}; "
    "map[String.fromCharCode(8216)] = String.fromCharCode(39); "
    "map[String.fromCharCode(8217)] = String.fromCharCode(39); "
    "map[String.fromCharCode(8220)] = String.fromCharCode(34); "
    "map[String.fromCharCode(8221)] = String.fromCharCode(34); "
    "map[String.fromCharCode(8211)] = '-'; map[String.fromCharCode(8212)] = '-'; "
    "map[String.fromCharCode(8722)] = '-'; map[String.fromCharCode(8230)] = '...'; "
    "map[String.fromCharCode(215)] = 'x'; var out = ''; var i; "
    "for (i = 0; i < t.length; i++) { var ch = t.charAt(i); var code = t.charCodeAt(i); "
    "if (map[ch]) out += map[ch]; else if (code === 9 || code === 10 || code === 13 || "
    "(code >= 32 && code <= 126)) out += ch; else out += ' '; } "
    "while (out.indexOf('  ') !== -1) out = out.split('  ').join(' '); "
    "while (out.charAt(0) === ' ') out = out.slice(1); "
    "while (out.charAt(out.length - 1) === ' ') out = out.slice(0, -1); return out; } "
)


def apply_js(table: dict[str, list[str]]) -> str:
    entries = []
    for cid in sorted(table):
        vals = ",".join(js_quote(v) for v in table[cid])
        entries.append(js_quote(cid) + ":[" + vals + "]")
    negative = js_quote(NEGATIVE_PROMPT)
    return (
        "var PEN_LOCK = 'The product matches the start image. Same silhouette, same colors, same parts.'; "
        "var NEGATIVE = " + negative + "; "
        + ASCII_FN
        + "function must(row, key) { var v = ascii(row[key]); if (!v) throw new Error('apply_pen_camera: ' + (row.creation_id || '?') + ' missing ' + key); return v; } "
        "var TABLE = {" + ",".join(entries) + "}; "
        "var BANNED = ['hold','locked','tripod','frozen','handheld','drift','crane','orbit','creeping','start on','does not','never']; "
        "var rows = $input.all().map(function (i) { return i.json; }); "
        "if (rows.length !== 168) throw new Error('apply_pen_camera: expected 168 rows, got ' + rows.length); "
        "var seen = {}; "
        "return rows.map(function (row) { "
        "var id = must(row, 'creation_id'); "
        "if (seen[id]) throw new Error('apply_pen_camera: duplicate ' + id); "
        "seen[id] = true; "
        "var spec = TABLE[id]; "
        "if (!spec) throw new Error('apply_pen_camera: no spec for ' + id); "
        "if (ascii(row.shot_family) !== spec[0]) throw new Error('apply_pen_camera: ' + id + ' shot_family changed'); "
        "if (ascii(row.camera_move) !== spec[1]) throw new Error('apply_pen_camera: ' + id + ' camera_move changed'); "
        "var family = spec[2]; var angle = spec[3]; var direction = spec[4]; var move = spec[5]; "
        "var low = move.toLowerCase(); var b; "
        "for (b = 0; b < BANNED.length; b++) { if (low.indexOf(BANNED[b]) !== -1) throw new Error('apply_pen_camera: ' + id + ' banned ' + BANNED[b]); } "
        "var compound = must(row, 'compound_name'); "
        "var q = String.fromCharCode(39); "
        "var prompt = PEN_LOCK + ' ' + move + '. No new objects. No people, hands, faces, needles, or burn-in. Keep label ' + q + compound + q + ' and ' + q + '3ml Pen' + q + ' unchanged.'; "
        "prompt = ascii(prompt); "
        "if (prompt.length > 1400) throw new Error('apply_pen_camera: ' + id + ' motion is ' + prompt.length); "
        "if (prompt.indexOf(move) === -1) throw new Error('apply_pen_camera: ' + id + ' dropped the move'); "
        "var lowPrompt = prompt.toLowerCase(); "
        "if (lowPrompt.indexOf('vial visual lock') !== -1 || lowPrompt.indexOf('flip-off') !== -1 || lowPrompt.indexOf('uncap') !== -1) throw new Error('apply_pen_camera: ' + id + ' vial language'); "
        "if (lowPrompt.indexOf('same place on the surface') !== -1 || lowPrompt.indexOf('stays a still object') !== -1) throw new Error('apply_pen_camera: ' + id + ' freeze line'); "
        "return { json: { creation_id: id, shot_family: family, camera_angle: angle, camera_direction: direction, camera_move: move, video_motion_prompt: prompt, negative_prompt: NEGATIVE } }; "
        "});"
    )


ASSERT_JS = (
    "var rows = $input.all().map(function (i) { return i.json; }); "
    "if (rows.length !== 168) throw new Error('assert_pen_camera: expected 168, got ' + rows.length); "
    "var bad = 0; var emptyNeg = 0; var pen169 = ''; var pen169still = ''; var pen169motion = ''; "
    "var pen003 = ''; var pen170 = ''; var i; "
    "var banned = ['hold','locked','tripod','frozen','handheld','drift','crane','orbit','creeping','start on']; "
    "for (i = 0; i < rows.length; i++) { "
    "var row = rows[i]; var move = String(row.camera_move || ''); var motion = String(row.video_motion_prompt || ''); "
    "var family = String(row.shot_family || ''); var neg = String(row.negative_prompt || ''); "
    "var low = move.toLowerCase(); var b; "
    "for (b = 0; b < banned.length; b++) { if (low.indexOf(banned[b]) !== -1) bad++; } "
    "if (family === 'static_lock' || family === 'doc_drift' || family === 'crane_settle') bad++; "
    "if (motion.indexOf(move) === -1) bad++; "
    "if (neg.indexOf('cap moving') === -1 || neg.indexOf('orbit') === -1) emptyNeg++; "
    "if (String(row.creation_id) === 'PBVita-Pen-169') { pen169 = move; pen169motion = motion; pen169still = String(row.video_prompt || ''); } "
    "if (String(row.creation_id) === 'PBVita-Pen-003') pen003 = move; "
    "if (String(row.creation_id) === 'PBVita-Pen-170') pen170 = move; "
    "} "
    "if (!pen169 || pen169.indexOf('dolly-in') === -1 || pen169.indexOf('three-quarter-right') === -1) throw new Error('assert_pen_camera: Pen-169 move is ' + pen169); "
    "if (pen169motion.indexOf('locked') !== -1 || pen169motion.indexOf('static_lock') !== -1) throw new Error('assert_pen_camera: Pen-169 motion still locks'); "
    "if (pen169still.indexOf('SHOT FAMILY: static_lock') === -1) throw new Error('assert_pen_camera: Pen-169 video_prompt changed'); "
    "if (!pen003 || pen003.indexOf('dolly-out') === -1) throw new Error('assert_pen_camera: Pen-003 lost the dolly-out'); "
    "if (!pen170 || pen170.indexOf('truck to the left') === -1) throw new Error('assert_pen_camera: Pen-170 lost the truck'); "
    "if (bad || emptyNeg) throw new Error('assert_pen_camera: bad=' + bad + ' emptyNeg=' + emptyNeg); "
    "return [{ json: { rows: 168, bad: bad, emptyNeg: emptyNeg, pen169_dolly: true, pen003_dolly_out: true, still_frozen: true } }];"
)


def sdk_source(apply: str) -> str:
    for label, code in (("apply", apply), ("assert", ASSERT_JS)):
        if '"' in code or "\\" in code or "\n" in code:
            raise SystemExit(f"{label} jsCode has a forbidden character")
    return f"""import {{ workflow, node, trigger }} from '@n8n/workflow-sdk';

const credSheets = {{ googleSheetsOAuth2Api: {{ id: 'OGHfxWtOUeZbDesw', name: 'Google Sheets account' }} }};
const penDoc = {{
  __rl: true,
  mode: 'id',
  value: '1L7bLOMa2Ri2AnWH4d4z7ahbz468Gcl8BhfQf9DVZn-4',
  cachedResultName: '14-pen-creations-150',
}};
const penTab = {{
  __rl: true,
  mode: 'list',
  value: '1395194708',
  cachedResultName: '14-pen-creations-150',
}};

const startTrigger = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{ name: 'manual_trigger', position: [0, 240] }},
  output: [{{}}],
}});

const readPenRows = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'read_pen_rows',
    position: [260, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: {{
      resource: 'sheet',
      operation: 'read',
      documentId: penDoc,
      sheetName: penTab,
      options: {{ returnAllMatches: 'returnAllMatches' }},
    }},
    output: [{{ creation_id: 'PBVita-Pen-169', compound_name: 'IGF-LR3', camera_move: 'locked tripod', shot_family: 'static_lock' }}],
  }},
}});

const applyCamera = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'apply_pen_camera',
    position: [520, 240],
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "{apply}",
    }},
    output: [{{ creation_id: 'PBVita-Pen-169', camera_move: 'Slow steady dolly-in', shot_family: 'push_in', camera_angle: 'three-quarter-right', camera_direction: 'forward', video_motion_prompt: 'Slow steady dolly-in', negative_prompt: 'orbit' }}],
  }},
}});

const writeCamera = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'write_pen_camera',
    position: [800, 240],
    credentials: credSheets,
    parameters: {{
      resource: 'sheet',
      operation: 'update',
      documentId: penDoc,
      sheetName: penTab,
      columns: {{
        mappingMode: 'autoMapInputData',
        matchingColumns: ['creation_id'],
        value: {{}},
        schema: [
          {{ id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true }},
          {{ id: 'shot_family', displayName: 'shot_family', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }},
          {{ id: 'camera_angle', displayName: 'camera_angle', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }},
          {{ id: 'camera_direction', displayName: 'camera_direction', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }},
          {{ id: 'camera_move', displayName: 'camera_move', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }},
          {{ id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }},
          {{ id: 'negative_prompt', displayName: 'negative_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }},
        ],
      }},
      options: {{ cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' }},
    }},
    output: [{{ creation_id: 'PBVita-Pen-169', camera_move: 'Slow steady dolly-in' }}],
  }},
}});

const readBack = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'read_pen_rows_back',
    position: [1040, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: {{
      resource: 'sheet',
      operation: 'read',
      documentId: penDoc,
      sheetName: penTab,
      options: {{ returnAllMatches: 'returnAllMatches' }},
    }},
    output: [{{ creation_id: 'PBVita-Pen-169', camera_move: 'Slow steady dolly-in', video_prompt: 'SHOT FAMILY: static_lock', negative_prompt: 'cap moving' }}],
  }},
}});

const assertCamera = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'assert_pen_camera',
    position: [1280, 240],
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "{ASSERT_JS}",
    }},
    output: [{{ rows: 168, bad: 0, emptyNeg: 0, pen169_dolly: true, pen003_dolly_out: true, still_frozen: true }}],
  }},
}});

export default workflow('fix_pen_camera_moves', 'One-shot. Rewrites each Sheet 14 camera to one slow move and rebuilds video_motion_prompt. Does not touch video_prompt or times_used.')
  .add(startTrigger)
  .to(readPenRows)
  .to(applyCamera)
  .to(writeCamera)
  .to(readBack)
  .to(assertCamera);
"""


EVAL_JS = r"""
const fs = require('fs');
const sdk = fs.readFileSync(process.argv[2], 'utf8');
const at = sdk.indexOf("name: 'apply_pen_camera'");
if (at < 0) throw new Error('apply node missing');
const slice = sdk.slice(at);
const key = 'jsCode: "';
const start = slice.indexOf(key);
if (start < 0) throw new Error('jsCode missing');
const from = start + key.length;
const end = slice.indexOf('"', from);
if (end < 0) throw new Error('jsCode unterminated');
const code = slice.slice(from, end);
const rows = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const expect = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
const fn = new Function('$input', code);
const out = fn({ all() { return rows.map((r) => ({ json: r })); } });
if (!Array.isArray(out) || out.length !== rows.length) {
  console.error('bad length', out && out.length);
  process.exit(2);
}
const byId = {};
for (const item of out) byId[item.json.creation_id] = item.json;
let mismatch = 0;
for (const exp of expect) {
  const got = byId[exp.creation_id];
  if (!got) { mismatch++; console.error('missing', exp.creation_id); continue; }
  const keys = Object.keys(got).sort().join(',');
  if (keys !== 'camera_angle,camera_direction,camera_move,creation_id,negative_prompt,shot_family,video_motion_prompt') {
    mismatch++;
    console.error('keys', exp.creation_id, keys);
  }
  for (const k of ['camera_move','shot_family','camera_angle','camera_direction','video_motion_prompt','negative_prompt']) {
    if (got[k] !== exp[k]) {
      mismatch++;
      if (mismatch <= 6) console.error(exp.creation_id, k, '\n GOT', got[k], '\n EXP', exp[k]);
    }
  }
}
if (mismatch) { console.error('mismatches', mismatch); process.exit(1); }
console.log('node-eval PASS', out.length);
"""


def main() -> None:
    with CSV14.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
        fields = list(rows[0].keys()) if rows else []
    if len(rows) != 168:
        raise SystemExit(f"expected 168 rows, got {len(rows)}")

    frozen = [{key: row.get(key, "") for key in FROZEN} for row in rows]
    old_counts: Counter[str] = Counter()
    for row in rows:
        blob = " ".join(row.get(key) or "" for key in ("camera_move", "camera_direction", "camera_angle", "shot_family"))
        for hit in find_defects(blob):
            old_counts[hit] += 1
    print("old defect hits:")
    for label, n in old_counts.most_common():
        print(f"  {n:4d}  {label}")

    table: dict[str, list[str]] = {}
    expected = []
    families: Counter[str] = Counter()
    for row in rows:
        new_family, angle, direction, move = plan_for(row)
        if new_family in FORBIDDEN_FAMILIES:
            raise SystemExit(f"{row['creation_id']}: still a forbidden family")
        if angle not in ALLOWED_ANGLES or direction not in ALLOWED_DIRECTIONS:
            raise SystemExit(f"{row['creation_id']}: bad angle or direction")
        draft = dict(row)
        draft["shot_family"] = new_family
        draft["camera_angle"] = angle
        draft["camera_direction"] = direction
        draft["camera_move"] = move
        prompt = build_motion_prompt(draft)
        defects = find_defects(" ".join((move, direction, angle, new_family, prompt)))
        if defects:
            raise SystemExit(f"{row['creation_id']}: {defects}")
        table[row["creation_id"]] = [
            ascii(row["shot_family"]),
            ascii(row["camera_move"]),
            new_family,
            angle,
            direction,
            move,
        ]
        expected.append(
            {
                "creation_id": row["creation_id"],
                "shot_family": new_family,
                "camera_angle": angle,
                "camera_direction": direction,
                "camera_move": move,
                "video_motion_prompt": prompt,
                "negative_prompt": NEGATIVE_PROMPT,
            }
        )
        families[new_family] += 1

    apply = apply_js(table)
    source = sdk_source(apply)
    tmp_sdk = Path("/tmp/fix_pen_camera_moves.sdk.js")
    tmp_old = Path("/tmp/pen_rows_old.json")
    tmp_exp = Path("/tmp/pen_rows_expected.json")
    tmp_eval = Path("/tmp/eval_pen_camera.js")
    tmp_sdk.write_text(source, encoding="utf-8")
    tmp_old.write_text(json.dumps(rows), encoding="utf-8")
    tmp_exp.write_text(json.dumps(expected), encoding="utf-8")
    tmp_eval.write_text(EVAL_JS, encoding="utf-8")
    proc = subprocess.run(
        ["node", str(tmp_eval), str(tmp_sdk), str(tmp_old), str(tmp_exp)],
        capture_output=True,
        text=True,
    )
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        raise SystemExit(f"node-eval failed ({proc.returncode})")

    by_id = {item["creation_id"]: item for item in expected}
    for row, snap in zip(rows, frozen):
        spec = by_id[row["creation_id"]]
        for key in ("shot_family", "camera_angle", "camera_direction", "camera_move", "video_motion_prompt", "negative_prompt"):
            row[key] = spec[key]
        for key in FROZEN:
            if row.get(key, "") != snap[key]:
                raise SystemExit(f"{row['creation_id']}: froze {key}")

    with CSV14.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    SDK.write_text(source, encoding="utf-8")
    print(f"Wrote {CSV14}")
    print(f"Wrote {SDK} ({len(source)} chars)")
    print("families:")
    for name, n in families.most_common():
        print(f"  {n:4d}  {name}")
    for cid in ("PBVita-Pen-169", "PBVita-Pen-170", "PBVita-Pen-003"):
        print(cid, by_id[cid]["shot_family"], "|", by_id[cid]["camera_move"])


if __name__ == "__main__":
    main()
