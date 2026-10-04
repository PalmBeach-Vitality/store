#!/usr/bin/env python3
"""Build the n8n Workflow SDK code for peptide_molecule_vid_gen_v2.

v2 is a new workflow, so the old peptide_molecule_vid_gen (EcGTbpZ9VG3C69pq) keeps all
42 of its nodes untouched. Every Code node embeds its file from
marketing/n8n-molecule-smoke/ byte for byte. Every generation value is read from Sheet
14-chem-breakdown-54 through pick_molecule_creation; the nodes only map fields.

The four sticky notes are the images from render_n8n_note_images.py, loaded from
raw.githubusercontent.com at --notes-sha so they keep working after a merge.

Output:
  marketing/workflows/peptide_molecule_vid_gen_v2.sdk.js
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE_DIR = ROOT / "n8n-molecule-smoke"
NOTES_DIR = ROOT / "n8n-notes" / "peptide_molecule_vid_gen_v2"
OUT = ROOT / "workflows" / "peptide_molecule_vid_gen_v2.sdk.js"
RAW_BASE = "https://raw.githubusercontent.com/PalmBeach-Vitality/store/{sha}/marketing/n8n-notes/peptide_molecule_vid_gen_v2/{file}#full-width"

SHEET_DOC = "1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0"
SHEET_GID = "425569919"
SHEET_TAB = "14-chem-breakdown-54"
PICK = "$('pick_molecule_creation').first().json"

# Same canvas rhythm as the other vid-gen workflows: one row of nodes at y=240,
# 224 px apart, starting at x=224. The GPT branch sits one row above. Grok sits
# one row below and is deactivated. Notes sit above the row, only as big as their text.
STEP = 224
MAIN_Y = 240
BRANCH = 224
NOTE_GAP = 80
NOTE_PAD = 40
LINE = 110


class Expr(str):
    pass


class Raw(str):
    pass


IDENT = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]*$")


def key(k: str) -> str:
    return k if IDENT.match(k) else json.dumps(k)


def inline(v) -> str:
    if isinstance(v, Raw):
        return str(v)
    if isinstance(v, Expr):
        return "expr(" + json.dumps(str(v), ensure_ascii=False) + ")"
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list):
        return "[" + ", ".join(inline(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{ " + ", ".join(key(k) + ": " + inline(x) for k, x in v.items()) + " }" if v else "{}"
    raise TypeError(f"cannot serialize {type(v)}")


def js(v, indent: int = 0) -> str:
    one = inline(v)
    if not isinstance(v, (list, dict)) or len(one) + 2 * indent <= LINE:
        return one
    inner = "  " * (indent + 1)
    if isinstance(v, list):
        body = ",\n".join(inner + js(x, indent + 1) for x in v)
        return "[\n" + body + ",\n" + "  " * indent + "]"
    body = ",\n".join(inner + key(k) + ": " + js(x, indent + 1) for k, x in v.items())
    return "{\n" + body + ",\n" + "  " * indent + "}"


def code(file: str) -> str:
    return (CODE_DIR / file).read_text(encoding="utf-8")


def snap(v: float) -> int:
    return int(round(v / 20.0)) * 20


def build(notes_sha: str) -> str:
    notes = {n["name"]: n for n in json.loads((NOTES_DIR / "notes.json").read_text(encoding="utf-8"))}

    # Still stage uses slots 0-9 (the GPT branch occupies 5-8 above the row).
    # Hop 1 uses 10-17 and hop 2 uses 18-27, so the chain stays one row.
    def x1(i: float) -> int:
        return snap(STEP + i * STEP)

    def x2(i: int) -> int:
        return snap(STEP + (10 + i) * STEP)

    def x3(i: int) -> int:
        return snap(STEP + (18 + i) * STEP)

    y1 = MAIN_Y
    y2 = MAIN_Y

    out: list[str] = []

    def const(name: str, value) -> None:
        out.append(f"const {name} = {js(value)};")

    def call(name: str, factory: str, spec: dict) -> None:
        out.append(f"const {name} = {factory}({js(spec)});")

    const("credSheets", {"googleSheetsOAuth2Api": {"id": "OGHfxWtOUeZbDesw", "name": "Google Sheets account"}})
    const("credOpenRouter", {"openRouterApi": {"id": "zDmHXnCHbj14yIvl", "name": "OpenRouter account"}})
    const("credXai", {"httpHeaderAuth": {"id": "z1BIQ5TSRwkwn4UG", "name": "XAI Grok"}})
    const("credFal", {"falAiApi": {"id": "qfVt9MnUeOJxRexp", "name": "fal.ai account"}})
    const("credCreatomate", {"httpBearerAuth": {"id": "02s8mB0EmuoResHc", "name": "Bearer Auth account 2"}})
    const("smokeDocument", {"__rl": True, "mode": "id", "value": SHEET_DOC})
    const("smokeTab", {"__rl": True, "mode": "list", "value": SHEET_GID, "cachedResultName": SHEET_TAB})
    const("strictOptions", {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 3})
    const("routeRenderCode", code("route_render.js"))
    const("klingParameters", {
        "parameters": [
            {"parameter": "prompt", "value": Expr("{{ $json.prompt }}")},
            {"parameter": "start_image_url", "value": Expr("{{ $json.start_image_url }}")},
            {"parameter": "duration", "value": Expr("{{ $json.duration }}")},
            {"parameter": "negative_prompt", "value": Expr("{{ $json.negative_prompt }}")},
            {"parameter": "cfg_scale", "value": Expr("{{ $json.cfg_scale }}")},
            {"parameter": "generate_audio", "value": Expr("{{ false }}")},
        ]
    })
    const("klingOptions", {
        "waitForCompletion": True,
        "pollInterval": Expr("{{ $json.poll_seconds }}"),
        "maxWaitTime": Expr("{{ $json.max_wait_seconds }}"),
    })
    const("pickSample", {
        "creation_id": "PBVita-MolSmoke-01",
        "compound_name": "GHK-Cu",
        "model_still": "openai/gpt-image-2.5-sunburst",
        "still_prompt": "Photorealistic cinematic science-fiction film still, vertical 9:16 frame.",
        "aspect_ratio": "9:16",
        "still_size": "1440x2560",
        "still_quality": "high",
        "still_n": 1,
        "still_timeout_seconds": 600,
        "model_video": "fal-ai/kling-video/v3/pro/image-to-video",
        "creatomate_poll_seconds": 15,
        "times_used": 0,
    })
    const("videoSample", {
        "creation_id": "PBVita-MolSmoke-01",
        "model_video": "fal-ai/kling-video/v3/pro/image-to-video",
        "prompt": "Silent video. One continuous camera move with no cuts.",
        "start_image_url": "https://example.com/still.png",
        "duration": "15",
        "negative_prompt": "text, letters, numbers",
        "cfg_scale": 0.5,
        "poll_seconds": 5,
        "max_wait_seconds": 900,
    })
    record = {
        "creation_id": "PBVita-MolSmoke-01",
        "still_url": "https://example.com/still.png",
        "hop1_video_url": "https://example.com/hop1.mp4",
        "last_frame_url": "https://example.com/frame.png",
        "hop2_video_url": "https://example.com/hop2.mp4",
        "video_url": "https://example.com/final.mp4",
        "times_used": 1,
        "last_used_at": "2026-09-30T03:00:00.000-04:00",
    }
    const("recordSample", record)
    const("renderSample", {"id": "render-1", "status": "succeeded", "url": "https://example.com/render.png", "width": 1080, "height": 1920})
    const("doneSample", {"done": True, "url": "https://example.com/render.png", "render_id": "render-1"})

    note_x = 0
    for name, note_key in [
        ("noteOverview", "note_overview"),
        ("noteStill", "note_1_still"),
        ("noteHop1", "note_2_hop1"),
        ("noteHop2", "note_3_hop2"),
    ]:
        n = notes[note_key]
        height = snap(n["image_height"] + NOTE_PAD)
        pos = [note_x, snap(MAIN_Y - 160 - height)]
        content = "![" + n["alt"] + "](" + RAW_BASE.format(sha=notes_sha, file=n["file"]) + ")"
        cfg = {
            "name": note_key,
            "color": n["sticky_color"],
            "position": pos,
            "width": n["sticky_width"],
            "height": height,
        }
        out.append(f"const {name} = sticky({js(content)}, [], {js(cfg)});")
        note_x += n["sticky_width"] + NOTE_GAP

    def code_node(name: str, node_name: str, source, pos: list, sample) -> None:
        call(name, "node", {
            "type": "n8n-nodes-base.code",
            "version": 2,
            "config": {
                "name": node_name,
                "position": pos,
                "parameters": {"mode": "runOnceForAllItems", "language": "javaScript", "jsCode": source},
            },
            "output": [sample],
        })

    def http(name: str, node_name: str, pos: list, params: dict, sample, cred=None, disabled=False) -> None:
        cfg = {"name": node_name, "position": pos}
        if disabled:
            cfg["disabled"] = True
        if cred:
            cfg["credentials"] = Raw(cred)
        cfg["parameters"] = params
        call(name, "node", {"type": "n8n-nodes-base.httpRequest", "version": 4.5, "config": cfg, "output": [sample]})

    def done_if(name: str, node_name: str, pos: list, cond_id: str) -> None:
        call(name, "ifElse", {
            "version": 2.3,
            "config": {
                "name": node_name,
                "position": pos,
                "parameters": {
                    "conditions": {
                        "options": Raw("strictOptions"),
                        "conditions": [{
                            "id": cond_id,
                            "leftValue": Expr("{{ $json.done }}"),
                            "rightValue": "",
                            "operator": {"type": "boolean", "operation": "true", "singleValue": True},
                        }],
                        "combinator": "and",
                    },
                    "options": {},
                },
            },
            "output": [Raw("doneSample")],
        })

    def fal(name: str, node_name: str, pos: list, file: str) -> None:
        call(name, "node", {
            "type": "@fal-ai/n8n-nodes-fal.falAi",
            "version": 1,
            "config": {
                "name": node_name,
                "position": pos,
                "credentials": Raw("credFal"),
                "parameters": {
                    "resource": "model",
                    "operation": "generate",
                    "model": {"__rl": True, "mode": "id", "value": Expr("{{ $json.model_video }}")},
                    "modelParameters": Raw("klingParameters"),
                    "options": Raw("klingOptions"),
                },
            },
            "output": [{"video": {"url": "https://example.com/" + file}}],
        })

    def creatomate_post(name: str, node_name: str, pos: list) -> None:
        http(name, node_name, pos, {
            "method": "POST",
            "url": "https://api.creatomate.com/v2/renders",
            "authentication": "genericCredentialType",
            "genericAuthType": "httpBearerAuth",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": Expr("{{ JSON.stringify($json.creatomate_body) }}"),
            "options": {},
        }, {"id": "render-1", "status": "planned"}, "credCreatomate")

    def creatomate_get(name: str, node_name: str, post_name: str, pos: list) -> None:
        http(name, node_name, pos, {
            "method": "GET",
            "url": Expr("https://api.creatomate.com/v2/renders/{{ $('" + post_name + "').first().json.id }}"),
            "authentication": "genericCredentialType",
            "genericAuthType": "httpBearerAuth",
            "options": {},
        }, Raw("renderSample"), "credCreatomate")

    def wait(name: str, node_name: str, pos: list) -> None:
        call(name, "node", {
            "type": "n8n-nodes-base.wait",
            "version": 1.1,
            "config": {
                "name": node_name,
                "position": pos,
                "parameters": {
                    "resume": "timeInterval",
                    "amount": Expr("{{ " + PICK + ".creatomate_poll_seconds }}"),
                    "unit": "seconds",
                },
            },
            "output": [{"id": "render-1", "status": "planned"}],
        })

    # Stage 1: pick a row and make the still.
    call("manualTrigger", "trigger", {
        "type": "n8n-nodes-base.manualTrigger",
        "version": 1,
        "config": {"name": "manual_trigger", "position": [x1(0), y1]},
        "output": [{}],
    })
    call("getChemCreations", "node", {
        "type": "n8n-nodes-base.googleSheets",
        "version": 4.7,
        "config": {
            "name": "get_chem_creations",
            "position": [x1(1), y1],
            "executeOnce": True,
            "credentials": Raw("credSheets"),
            "parameters": {
                "resource": "sheet",
                "operation": "read",
                "documentId": Raw("smokeDocument"),
                "sheetName": Raw("smokeTab"),
                "options": {},
            },
        },
        "output": [{"creation_id": "PBVita-MolSmoke-01", "rank": 1, "status": "Active", "times_used": 0}],
    })
    call("filterChemActive", "node", {
        "type": "n8n-nodes-base.filter",
        "version": 2.3,
        "config": {
            "name": "filter_chem_active",
            "position": [x1(2), y1],
            "parameters": {
                "conditions": {
                    "options": Raw("strictOptions"),
                    "conditions": [{
                        "id": "flt-active-1",
                        "leftValue": Expr("{{ $json.status }}"),
                        "rightValue": "Active",
                        "operator": {"type": "string", "operation": "equals"},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
        },
        "output": [{"creation_id": "PBVita-MolSmoke-01", "rank": 1, "status": "Active", "times_used": 0}],
    })
    code_node("pickMoleculeCreation", "pick_molecule_creation", code("pick_molecule_creation.js"), [x1(3), y1], Raw("pickSample"))
    call("routeStillModel", "ifElse", {
        "version": 2.3,
        "config": {
            "name": "route_still_model",
            "position": [x1(4), y1],
            "parameters": {
                "conditions": {
                    "options": Raw("strictOptions"),
                    "conditions": [{
                        "id": "route-still-gpt",
                        "leftValue": Expr("{{ $json.model_still }}"),
                        "rightValue": "openai/gpt-image-",
                        "operator": {"type": "string", "operation": "startsWith"},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
        },
        "output": [Raw("pickSample")],
    })
    http("gptImageStill", "gpt_image_molecule_still", [x1(5), y1 - BRANCH], {
        "method": "POST",
        "url": "https://openrouter.ai/api/v1/images",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openRouterApi",
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": Expr(
            "{{ JSON.stringify({ model: $json.model_still, prompt: $json.still_prompt, n: $json.still_n, "
            "size: $json.still_size, aspect_ratio: $json.aspect_ratio, quality: $json.still_quality }) }}"
        ),
        "options": {"timeout": Expr("{{ $json.still_timeout_seconds * 1000 }}")},
    }, {"data": [{"b64_json": "iVBORw0KGgo", "media_type": "image/png"}], "usage": {"cost": 0.25}}, "credOpenRouter")
    code_node("checkGptStill", "check_gpt_still", code("check_gpt_still.js"), [x1(6), y1 - BRANCH], {
        "still_b64": "iVBORw0KGgo", "still_mime": "image/png", "still_ext": "png", "still_width": 1440, "still_height": 2560,
    })
    call("gptStillToFile", "node", {
        "type": "n8n-nodes-base.convertToFile",
        "version": 1.1,
        "config": {
            "name": "gpt_still_to_file",
            "position": [x1(7), y1 - BRANCH],
            "parameters": {
                "operation": "toBinary",
                "sourceProperty": "still_b64",
                "binaryPropertyName": "data",
                "options": {
                    "fileName": Expr("{{ " + PICK + ".creation_id }}.{{ $json.still_ext }}"),
                    "mimeType": Expr("{{ $json.still_mime }}"),
                },
            },
        },
        "output": [{"still_mime": "image/png", "still_ext": "png"}],
    })
    http("uploadGptStill", "upload_gpt_still", [x1(8), y1 - BRANCH], {
        "method": "POST",
        "url": "https://litterbox.catbox.moe/resources/internals/api.php",
        "sendBody": True,
        "contentType": "multipart-form-data",
        "bodyParameters": {"parameters": [
            {"name": "reqtype", "value": "fileupload"},
            {"name": "time", "value": "72h"},
            {"parameterType": "formBinaryData", "name": "fileToUpload", "inputDataFieldName": "data"},
        ]},
        "options": {
            "response": {"response": {"responseFormat": "text"}},
            "timeout": Expr("{{ " + PICK + ".still_timeout_seconds * 1000 }}"),
        },
    }, {"data": "https://example.com/still.png"})
    http("grokImageStill", "grok_imagine_molecule_still", [x1(6.5), y1 + BRANCH], {
        "method": "POST",
        "url": "https://api.x.ai/v1/images/generations",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": Expr(
            "{{ JSON.stringify({ model: $json.model_still, prompt: $json.still_prompt, n: $json.still_n, "
            "aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}"
        ),
        "options": {"timeout": Expr("{{ $json.still_timeout_seconds * 1000 }}")},
    }, {"data": [{"url": "https://example.com/still.jpeg"}]}, "credXai", disabled=True)
    call("saveStillUrl", "node", {
        "type": "n8n-nodes-base.set",
        "version": 3.5,
        "config": {
            "name": "save_still_url",
            "position": [x1(9), y1],
            "parameters": {
                "mode": "manual",
                "includeOtherFields": False,
                "assignments": {"assignments": [{
                    "id": "a1",
                    "name": "still_url",
                    "value": Expr("{{ Array.isArray($json.data) ? $json.data[0].url : String($json.data).trim() }}"),
                    "type": "string",
                }]},
                "options": {},
            },
        },
        "output": [{"still_url": "https://example.com/still.png"}],
    })

    # Stage 2: hop 1 and the hand-off frame.
    code_node("prepVideoStart", "prep_molecule_video_start", code("prep_molecule_video_start.js"), [x2(0), y2], Raw("videoSample"))
    fal("falKlingHop1", "fal_kling_hop1", [x2(1), y2], "hop1.mp4")
    code_node("prepLastFrame", "prep_last_frame", code("prep_last_frame.js"), [x2(2), y2], {
        "hop1_video_url": "https://example.com/hop1.mp4",
        "hop1_cut_seconds": 14.958333333333334,
        "creatomate_body": {"output_format": "png", "width": 1080, "height": 1920, "snapshot_time": 14.958333333333334},
    })
    creatomate_post("creatomateLastFrame", "creatomate_last_frame", [x2(3), y2])
    wait("waitLastFrame", "wait_last_frame", [x2(4), y2])
    creatomate_get("creatomateLastFramePoll", "creatomate_last_frame_poll", "creatomate_last_frame", [x2(5), y2])
    code_node("routeLastFrame", "route_last_frame", Raw("routeRenderCode"), [x2(6), y2], Raw("doneSample"))
    done_if("switchLastFrame", "switch_last_frame", [x2(7), y2], "last-frame-done")

    # Stage 3: hop 2, the 30s join, and the sheet write.
    code_node("prepKlingExtend", "prep_kling_extend", code("prep_kling_extend.js"), [x3(0), y2], Raw("videoSample"))
    fal("falKlingHop2", "fal_kling_hop2", [x3(1), y2], "hop2.mp4")
    code_node("prepCreatomateConcat", "prep_creatomate_concat", code("prep_creatomate_concat.js"), [x3(2), y2], {
        "hop2_video_url": "https://example.com/hop2.mp4",
        "creatomate_body": {"output_format": "mp4", "width": 1080, "height": 1920, "frame_rate": 24},
    })
    creatomate_post("creatomateConcat", "creatomate_concat", [x3(3), y2])
    wait("waitConcat", "wait_concat", [x3(4), y2])
    creatomate_get("creatomatePoll", "creatomate_poll", "creatomate_concat", [x3(5), y2])
    code_node("routeConcat", "route_concat", Raw("routeRenderCode"), [x3(6), y2], Raw("doneSample"))
    done_if("switchConcat", "switch_concat", [x3(7), y2], "concat-done")
    code_node("saveVideoUrl", "save_video_url", code("save_video_url.js"), [x3(8), y2], Raw("recordSample"))

    columns = list(record.keys())
    call("sheetsUpdateVideo", "node", {
        "type": "n8n-nodes-base.googleSheets",
        "version": 4.7,
        "config": {
            "name": "sheets_update_video",
            "position": [x3(9), y2],
            "credentials": Raw("credSheets"),
            "parameters": {
                "resource": "sheet",
                "operation": "update",
                "documentId": Raw("smokeDocument"),
                "sheetName": Raw("smokeTab"),
                "columns": {
                    "mappingMode": "defineBelow",
                    "matchingColumns": ["creation_id"],
                    "value": {c: Expr("{{ $json." + c + " }}") for c in columns},
                    "schema": [
                        {
                            "id": c,
                            "displayName": c,
                            "required": c == "creation_id",
                            "defaultMatch": c == "creation_id",
                            "display": True,
                            "type": "number" if c == "times_used" else "string",
                            "canBeUsedToMatch": True,
                        }
                        for c in columns
                    ],
                },
                "options": {"cellFormat": "RAW"},
            },
        },
        "output": [Raw("recordSample")],
    })

    wiring = """export default workflow('peptide_molecule_vid_gen_v2', 'peptide_molecule_vid_gen_v2')
  .add(noteOverview)
  .add(noteStill)
  .add(noteHop1)
  .add(noteHop2)
  .add(manualTrigger)
  .to(getChemCreations)
  .to(filterChemActive)
  .to(pickMoleculeCreation)
  .to(
    routeStillModel
      .onTrue(gptImageStill.to(checkGptStill.to(gptStillToFile.to(uploadGptStill.to(saveStillUrl)))))
      .onFalse(grokImageStill.to(saveStillUrl))
  )
  .add(saveStillUrl)
  .to(prepVideoStart)
  .to(falKlingHop1)
  .to(prepLastFrame)
  .to(creatomateLastFrame)
  .to(waitLastFrame)
  .to(creatomateLastFramePoll)
  .to(routeLastFrame)
  .to(switchLastFrame.onTrue(prepKlingExtend).onFalse(waitLastFrame))
  .add(prepKlingExtend)
  .to(falKlingHop2)
  .to(prepCreatomateConcat)
  .to(creatomateConcat)
  .to(waitConcat)
  .to(creatomatePoll)
  .to(routeConcat)
  .to(switchConcat.onTrue(saveVideoUrl.to(sheetsUpdateVideo)).onFalse(waitConcat));
"""

    head = "import { workflow, node, trigger, sticky, ifElse, expr } from '@n8n/workflow-sdk';\n"
    return head + "\n" + "\n\n".join(out) + "\n\n" + wiring


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--notes-sha", required=True, help="commit that holds the note images")
    args = ap.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.notes_sha):
        raise SystemExit("--notes-sha must be a full 40-character commit SHA")
    text = build(args.notes_sha)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT.parent)} ({len(text)} chars)")


if __name__ == "__main__":
    main()
