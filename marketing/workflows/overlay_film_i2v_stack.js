import { workflow, node, trigger, newCredential } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'manual_trigger',
    position: [0, 304],
    output: [{ ok: true }],
  },
});

const getFilmStills = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU', cachedResultName: '18-motsc-film-stills' },
      sheetName: { __rl: true, mode: 'list', value: '1628285227', cachedResultName: '18-motsc-film-stills' },
      options: {},
    },
    position: [240, 304],
    output: [{ still_id: 'FILM-001' }],
  },
});

const overlayStack = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film_i2v_stack',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: overlay_film_i2v_stack\n// Workflow: overlay_film_i2v_stack\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_i2v\n//\n// Writes I2V stack columns onto every 18-motsc-film-stills row.\n// Does not rewrite still_prompt, picked_url, take_urls, or keepers.\n\nvar STACK = {\n  'FILM-001': ['veo', '8', '9:16', '', '180'],\n  'FILM-002': ['veo', '8', '9:16', '', '180'],\n  'FILM-003': ['veo', '8', '9:16', '', '180'],\n  'FILM-004': ['veo', '8', '9:16', '', '180'],\n  'FILM-005': ['veo', '8', '9:16', '', '180'],\n  'FILM-006': ['veo', '8', '9:16', '', '180'],\n  'FILM-007': ['veo', '8', '9:16', '', '180'],\n  'FILM-008': ['veo', '8', '9:16', '', '180'],\n  'FILM-009': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-010': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-011': ['veo', '8', '9:16', '', '180'],\n  'FILM-012': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-013': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-014': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-015': ['kling', '10', '', '', '180'],\n  'FILM-016': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-017': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-018': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-019': ['veo', '8', '9:16', '', '180'],\n  'FILM-020': ['kling', '10', '', '', '180'],\n  'FILM-021': ['veo', '8', '9:16', '', '180'],\n  'FILM-022': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-023': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-024': ['seedance', '10', 'auto', 'standard', '300'],\n  'FILM-025': ['kling', '10', '', '', '180'],\n};\n\nvar MODELS = {\n  seedance: 'bytedance/seedance-2.5/image-to-video',\n  kling: 'fal-ai/kling-video/v3/pro/image-to-video',\n  veo: 'fal-ai/veo3.1/image-to-video',\n  runway: 'gen4.5',\n};\n\nvar START_URLS = {\n  seedance: 'https://fal.run/bytedance/seedance-2.5/image-to-video',\n  kling: 'https://fal.run/fal-ai/kling-video/v3/pro/image-to-video',\n  veo: 'https://fal.run/fal-ai/veo3.1/image-to-video',\n  runway: 'https://api.dev.runwayml.com/v1/image_to_video',\n};\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film_i2v_stack: no rows from get_film_stills.');\n}\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (!stillId) continue;\n  var spec = STACK[stillId];\n  if (!spec) {\n    throw new Error('overlay_film_i2v_stack: missing stack row for ' + stillId);\n  }\n  var provider = spec[0];\n  out.push({\n    json: {\n      still_id: stillId,\n      video_provider: provider,\n      model_video: MODELS[provider],\n      duration_seconds: spec[1],\n      video_resolution: '1080p',\n      video_aspect_ratio: spec[2],\n      audio: 'false',\n      bitrate_mode: spec[3],\n      wait_seconds: spec[4],\n      video_start_url: START_URLS[provider],\n    },\n  });\n}\n\nif (out.length !== 25) {\n  throw new Error('overlay_film_i2v_stack: expected 25 rows, got ' + out.length);\n}\n\nreturn out;\n",
    },
    position: [496, 304],
    output: [{ still_id: 'FILM-001', video_provider: 'veo', model_video: 'fal-ai/veo3.1/image-to-video' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_i2v',
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: { __rl: true, mode: 'id', value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU', cachedResultName: '18-motsc-film-stills' },
      sheetName: { __rl: true, mode: 'list', value: '1628285227', cachedResultName: '18-motsc-film-stills' },
      columns: {
        mappingMode: 'autoMapInputData',
        matchingColumns: ['still_id'],
        value: {},
        schema: [
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
        ],
      },
      options: {
        cellFormat: 'USER_ENTERED',
        handlingExtraData: 'insertInNewColumn',
      },
    },
    position: [752, 304],
    output: [{ still_id: 'FILM-001' }],
  },
});

const howto = node({
  type: 'n8n-nodes-base.stickyNote',
  version: 1,
  config: {
    name: 'overlay_howto',
    parameters: {
      content: "## overlay_film_i2v_stack (unpublished)\nOne-shot write of Sheet 18 I2V stack columns. Does not touch picked_url or keepers. Do not Publish.",
      height: 220,
      width: 640,
      color: 4,
    },
    position: [0, 0],
    output: [{ note: true }],
  },
});

export default workflow('overlay_film_i2v_stack', 'overlay_film_i2v_stack')
  .add(howto)
  .add(manualTrigger)
  .to(getFilmStills)
  .to(overlayStack)
  .to(sheetsUpdate);
