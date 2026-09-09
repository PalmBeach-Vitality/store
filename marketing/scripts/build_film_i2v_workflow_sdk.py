"""Emit n8n Workflow SDK files for the MOTS-C film I2V stack."""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "workflows"


def js(name):
    return (ROOT / name).read_text()


def lit(s):
    return json.dumps(s)


SHEET_DOC = "{ __rl: true, mode: 'id', value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU', cachedResultName: '18-motsc-film-stills' }"
SHEET_TAB = "{ __rl: true, mode: 'list', value: '1628285227', cachedResultName: '18-motsc-film-stills' }"

UPDATE_SCHEMA = """[
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_request_id', displayName: 'video_request_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'last_used_at', displayName: 'last_used_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]"""

OVERLAY_SCHEMA = """[
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_provider', displayName: 'video_provider', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'model_video', displayName: 'model_video', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'duration_seconds', displayName: 'duration_seconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_resolution', displayName: 'video_resolution', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_aspect_ratio', displayName: 'video_aspect_ratio', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio', displayName: 'audio', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'bitrate_mode', displayName: 'bitrate_mode', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'wait_seconds', displayName: 'wait_seconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_start_url', displayName: 'video_start_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]"""


def fal_params(kind):
    if kind == "seedance":
        pairs = [
            ("prompt", "{{ $json.video_motion_prompt }}"),
            ("image_url", "{{ $json.still_url }}"),
            ("resolution", "{{ $json.resolution }}"),
            ("duration", "{{ String($json.duration_seconds) }}"),
            ("aspect_ratio", "{{ $json.video_aspect_ratio }}"),
            ("generate_audio", "{{ $json.generate_audio }}"),
            ("bitrate_mode", "{{ $json.bitrate_mode }}"),
        ]
    elif kind == "kling":
        pairs = [
            ("prompt", "{{ $json.video_motion_prompt }}"),
            ("start_image_url", "{{ $json.still_url }}"),
            ("duration", "{{ String($json.duration_seconds) }}"),
            ("generate_audio", "{{ $json.generate_audio }}"),
        ]
    elif kind == "veo":
        pairs = [
            ("prompt", "{{ $json.video_motion_prompt }}"),
            ("image_url", "{{ $json.still_url }}"),
            ("aspect_ratio", "{{ $json.video_aspect_ratio }}"),
            ("duration", "{{ $json.duration_label }}"),
            ("resolution", "{{ $json.resolution }}"),
            ("generate_audio", "{{ $json.generate_audio }}"),
        ]
    else:
        raise ValueError(kind)
    items = ",\n          ".join(
        "{ parameter: '%s', value: expr('%s') }" % (k, v.replace("'", "\\'")) for k, v in pairs
    )
    return items


def fal_workflow(name, provider, pick_file, note):
    return f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const manualTrigger = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{
    name: 'manual_trigger',
    position: [0, 304],
    output: [{{ ok: true }}],
  }},
}});

const getFilmStills = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'get_film_stills',
    executeOnce: true,
    credentials: {{ googleSheetsOAuth2Api: newCredential('Google Sheets account') }},
    parameters: {{
      resource: 'sheet',
      operation: 'read',
      documentId: {SHEET_DOC},
      sheetName: {SHEET_TAB},
      options: {{}},
    }},
    position: [240, 304],
    output: [{{ still_id: 'FILM-009', status: 'Active', picked_url: 'https://example.com/still.jpg', video_url: '', video_provider: '{provider}' }}],
  }},
}});

const pickFilmStill = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'pick_film_still',
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {lit(js(pick_file))},
    }},
    position: [496, 304],
    output: [{{ still_id: 'FILM-009', still_url: 'https://example.com/still.jpg', video_motion_prompt: 'Slow fly-by.', video_provider: '{provider}', model_video: 'bytedance/seedance-2.5/image-to-video', duration_seconds: 10, duration_label: '10', resolution: '1080p', video_aspect_ratio: 'auto', generate_audio: false, bitrate_mode: 'standard', wait_seconds: 300 }}],
  }},
}});

const falI2vGenerate = node({{
  type: '@fal-ai/n8n-nodes-fal.falAi',
  version: 1,
  config: {{
    name: 'fal_i2v_generate',
    credentials: {{ falAiApi: newCredential('fal.ai account') }},
    parameters: {{
      resource: 'model',
      operation: 'generate',
      model: {{ __rl: true, mode: 'id', value: expr('{{{{ $json.model_video }}}}'), cachedResultName: '{provider}' }},
      modelParameters: {{
        parameters: [
          {fal_params(provider)}
        ],
      }},
      options: {{
        waitForCompletion: true,
        pollInterval: 5,
        maxWaitTime: expr('{{{{ Number($json.wait_seconds) }}}}'),
      }},
    }},
    position: [768, 304],
    output: [{{ video: {{ url: 'https://example.com/out.mp4' }}, request_id: 'req-1' }}],
  }},
}});

const saveFilmVideoUrl = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'save_film_video_url',
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {lit(js('n8n-code-save-film-i2v-fal.js'))},
    }},
    position: [1040, 304],
    output: [{{ still_id: 'FILM-009', video_url: 'https://example.com/out.mp4', video_request_id: 'req-1', last_used_at: '2026-08-29T00:00:00.000Z' }}],
  }},
}});

const sheetsUpdateStill = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'sheets_update_still',
    credentials: {{ googleSheetsOAuth2Api: newCredential('Google Sheets account') }},
    parameters: {{
      resource: 'sheet',
      operation: 'update',
      documentId: {SHEET_DOC},
      sheetName: {SHEET_TAB},
      columns: {{
        mappingMode: 'defineBelow',
        matchingColumns: ['still_id'],
        value: {{
          still_id: expr('{{{{ $json.still_id }}}}'),
          video_url: expr('{{{{ $json.video_url }}}}'),
          video_request_id: expr('{{{{ $json.video_request_id }}}}'),
          last_used_at: expr('{{{{ $json.last_used_at }}}}'),
        }},
        schema: {UPDATE_SCHEMA},
      }},
      options: {{}},
    }},
    position: [1312, 304],
    output: [{{ still_id: 'FILM-009', video_url: 'https://example.com/out.mp4' }}],
  }},
}});

const howto = node({{
  type: 'n8n-nodes-base.stickyNote',
  version: 1,
  config: {{
    name: 'film_i2v_howto',
    parameters: {{
      content: {lit(note)},
      height: 280,
      width: 760,
      color: 4,
    }},
    position: [0, 0],
    output: [{{ note: true }}],
  }},
}});

export default workflow('film_i2v_{provider}', '{name}')
  .add(howto)
  .add(manualTrigger)
  .to(getFilmStills)
  .to(pickFilmStill)
  .to(falI2vGenerate)
  .to(saveFilmVideoUrl)
  .to(sheetsUpdateStill);
"""


def runway_workflow():
    note = """## film_i2v_runway (unpublished)
One Execute = next Active runway row with picked_url and empty video_url.
Runway Gen-4.5 HTTP. Attach the Runway API key later. No Creatomate. Do not Publish. Do not Execute until Sal says yes."""
    return f"""import {{ workflow, node, trigger, newCredential, expr }} from '@n8n/workflow-sdk';

const manualTrigger = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{
    name: 'manual_trigger',
    position: [0, 304],
    output: [{{ ok: true }}],
  }},
}});

const getFilmStills = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'get_film_stills',
    executeOnce: true,
    credentials: {{ googleSheetsOAuth2Api: newCredential('Google Sheets account') }},
    parameters: {{
      resource: 'sheet',
      operation: 'read',
      documentId: {SHEET_DOC},
      sheetName: {SHEET_TAB},
      options: {{}},
    }},
    position: [240, 304],
    output: [{{ still_id: 'FILM-012', status: 'Active', picked_url: 'https://example.com/still.jpg', video_url: '', video_provider: 'runway', video_start_url: 'https://api.dev.runwayml.com/v1/image_to_video' }}],
  }},
}});

const pickFilmStill = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'pick_film_still',
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {lit(js('n8n-code-pick-film-i2v-runway.js'))},
    }},
    position: [496, 304],
    output: [{{ still_id: 'FILM-012', still_url: 'https://example.com/still.jpg', video_motion_prompt: 'Seat the vial.', video_provider: 'runway', model_video: 'gen4.5', duration_seconds: 10, video_aspect_ratio: '720:1280', wait_seconds: 180, video_start_url: 'https://api.dev.runwayml.com/v1/image_to_video' }}],
  }},
}});

const prepRunway = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'prep_runway_video_start',
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {lit(js('n8n-code-prep-runway-video-start.js'))},
    }},
    position: [752, 304],
    output: [{{ still_id: 'FILM-012', video_start_url: 'https://api.dev.runwayml.com/v1/image_to_video', runway_video_body_json: '{{}}', wait_seconds: 180 }}],
  }},
}});

const runwayStart = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'runway_video_start',
    parameters: {{
      method: 'POST',
      url: expr('{{{{ $json.video_start_url }}}}'),
      authentication: 'none',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {{
        parameters: [
          {{ name: 'X-Runway-Version', value: '2024-11-06' }},
          {{ name: 'Content-Type', value: 'application/json' }},
        ],
      }},
      sendBody: true,
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr('{{{{ $json.runway_video_body_json }}}}'),
      options: {{ timeout: 180000 }},
    }},
    position: [1008, 304],
    output: [{{ id: 'task-1' }}],
  }},
}});

const waitVideo = node({{
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {{
    name: 'wait_video',
    parameters: {{
      resume: 'timeInterval',
      amount: expr('{{{{ Number($("pick_film_still").first().json.wait_seconds) }}}}'),
      unit: 'seconds',
    }},
    position: [1264, 304],
    output: [{{ id: 'task-1' }}],
  }},
}});

const runwayPoll = node({{
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {{
    name: 'runway_video_poll',
    parameters: {{
      method: 'GET',
      url: expr('{{{{ "https://api.dev.runwayml.com/v1/tasks/" + String($("runway_video_start").first().json.id || "") }}}}'),
      authentication: 'none',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {{
        parameters: [
          {{ name: 'X-Runway-Version', value: '2024-11-06' }},
        ],
      }},
      options: {{}},
    }},
    position: [1520, 304],
    output: [{{ id: 'task-1', status: 'SUCCEEDED', output: ['https://example.com/out.mp4'] }}],
  }},
}});

const saveFilmVideoUrl = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'save_film_video_url',
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {lit(js('n8n-code-save-film-i2v-runway.js'))},
    }},
    position: [1776, 304],
    output: [{{ still_id: 'FILM-012', video_url: 'https://example.com/out.mp4', video_request_id: 'task-1', last_used_at: '2026-08-29T00:00:00.000Z' }}],
  }},
}});

const sheetsUpdateStill = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'sheets_update_still',
    credentials: {{ googleSheetsOAuth2Api: newCredential('Google Sheets account') }},
    parameters: {{
      resource: 'sheet',
      operation: 'update',
      documentId: {SHEET_DOC},
      sheetName: {SHEET_TAB},
      columns: {{
        mappingMode: 'defineBelow',
        matchingColumns: ['still_id'],
        value: {{
          still_id: expr('{{{{ $json.still_id }}}}'),
          video_url: expr('{{{{ $json.video_url }}}}'),
          video_request_id: expr('{{{{ $json.video_request_id }}}}'),
          last_used_at: expr('{{{{ $json.last_used_at }}}}'),
        }},
        schema: {UPDATE_SCHEMA},
      }},
      options: {{}},
    }},
    position: [2032, 304],
    output: [{{ still_id: 'FILM-012', video_url: 'https://example.com/out.mp4' }}],
  }},
}});

const howto = node({{
  type: 'n8n-nodes-base.stickyNote',
  version: 1,
  config: {{
    name: 'film_i2v_howto',
    parameters: {{
      content: {lit(note)},
      height: 280,
      width: 760,
      color: 4,
    }},
    position: [0, 0],
    output: [{{ note: true }}],
  }},
}});

export default workflow('film_i2v_runway', 'film_i2v_runway')
  .add(howto)
  .add(manualTrigger)
  .to(getFilmStills)
  .to(pickFilmStill)
  .to(prepRunway)
  .to(runwayStart)
  .to(waitVideo)
  .to(runwayPoll)
  .to(saveFilmVideoUrl)
  .to(sheetsUpdateStill);
"""


def overlay_workflow():
    note = """## overlay_film_i2v_stack (unpublished)
One-shot write of Sheet 18 I2V stack columns. Does not touch picked_url or keepers. Do not Publish."""
    return f"""import {{ workflow, node, trigger, newCredential }} from '@n8n/workflow-sdk';

const manualTrigger = trigger({{
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {{
    name: 'manual_trigger',
    position: [0, 304],
    output: [{{ ok: true }}],
  }},
}});

const getFilmStills = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'get_film_stills',
    executeOnce: true,
    credentials: {{ googleSheetsOAuth2Api: newCredential('Google Sheets account') }},
    parameters: {{
      resource: 'sheet',
      operation: 'read',
      documentId: {SHEET_DOC},
      sheetName: {SHEET_TAB},
      options: {{}},
    }},
    position: [240, 304],
    output: [{{ still_id: 'FILM-001' }}],
  }},
}});

const overlayStack = node({{
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {{
    name: 'overlay_film_i2v_stack',
    parameters: {{
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: {lit(js('n8n-code-overlay-film-i2v-stack.js'))},
    }},
    position: [496, 304],
    output: [{{ still_id: 'FILM-001', video_provider: 'veo', model_video: 'fal-ai/veo3.1/image-to-video' }}],
  }},
}});

const sheetsUpdate = node({{
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {{
    name: 'sheets_update_i2v',
    credentials: {{ googleSheetsOAuth2Api: newCredential('Google Sheets account') }},
    parameters: {{
      resource: 'sheet',
      operation: 'update',
      documentId: {SHEET_DOC},
      sheetName: {SHEET_TAB},
      columns: {{
        mappingMode: 'autoMapInputData',
        matchingColumns: ['still_id'],
        value: {{}},
        schema: {OVERLAY_SCHEMA},
      }},
      options: {{
        cellFormat: 'USER_ENTERED',
        handlingExtraData: 'insertInNewColumn',
      }},
    }},
    position: [752, 304],
    output: [{{ still_id: 'FILM-001' }}],
  }},
}});

const howto = node({{
  type: 'n8n-nodes-base.stickyNote',
  version: 1,
  config: {{
    name: 'overlay_howto',
    parameters: {{
      content: {lit(note)},
      height: 220,
      width: 640,
      color: 4,
    }},
    position: [0, 0],
    output: [{{ note: true }}],
  }},
}});

export default workflow('overlay_film_i2v_stack', 'overlay_film_i2v_stack')
  .add(howto)
  .add(manualTrigger)
  .to(getFilmStills)
  .to(overlayStack)
  .to(sheetsUpdate);
"""


def main():
    OUT.mkdir(exist_ok=True)
    specs = [
        (
            "film_i2v_seedance.js",
            fal_workflow(
                "film_i2v_seedance",
                "seedance",
                "n8n-code-pick-film-i2v.js",
                "## film_i2v_seedance (unpublished)\nOne Execute = next Active seedance row with picked_url and empty video_url.\nSeedance 2.5 I2V on fal. Motion / model / duration from Sheet 18. No Creatomate. Do not Publish. Do not Execute until Sal says yes.",
            ),
        ),
        (
            "film_i2v_kling.js",
            fal_workflow(
                "film_i2v_kling",
                "kling",
                "n8n-code-pick-film-i2v-kling.js",
                "## film_i2v_kling (unpublished)\nOne Execute = next Active kling row with picked_url and empty video_url.\nKling 3.0 Pro I2V on fal. Crash / warp. No Creatomate. Do not Publish. Do not Execute until Sal says yes.",
            ),
        ),
        (
            "film_i2v_veo.js",
            fal_workflow(
                "film_i2v_veo",
                "veo",
                "n8n-code-pick-film-i2v-veo.js",
                "## film_i2v_veo (unpublished)\nOne Execute = next Active veo row with picked_url and empty video_url.\nVeo 3.1 I2V on fal. Faces / product close-ups. No Creatomate. Do not Publish. Do not Execute until Sal says yes.",
            ),
        ),
        ("film_i2v_runway.js", runway_workflow()),
        ("overlay_film_i2v_stack.js", overlay_workflow()),
    ]
    for name, body in specs:
        path = OUT / name
        path.write_text(body)
        print("wrote", path)


if __name__ == "__main__":
    main()
