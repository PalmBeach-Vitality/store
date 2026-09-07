import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 820,
      height: 240,
      content:
        '# overlay_still_2.0 (unpublished)\\n# Writes model_still=grok-imagine-image-2.0 on every Sheet 18 row.\\n# Does not touch video_url. Do not Publish.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const getFilm = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    position: [240, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      options: {},
    },
    output: [{ still_id: 'FILM-001' }, { still_id: 'FILM-002' }],
  },
});

const overlayRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_still_2_0',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "// n8n Code node: overlay_still_2_0\n// Workflow: overlay_still_2.0 (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_still_model\n//\n// Writes model_still=grok-imagine-image-2.0 on every Sheet 18 row.\n// Does NOT touch video_url, picked_url, prompts, or video models.\n\nvar LATEST_STILL = 'grok-imagine-image-2.0';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) throw new Error('overlay_still_2.0: no rows from get_film_stills.');\n\nvar out = [];\nvar seen = {};\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (!stillId) continue;\n  if (seen[stillId]) throw new Error('overlay_still_2.0: duplicate still_id ' + stillId);\n  seen[stillId] = 1;\n  out.push({ json: { still_id: stillId, model_still: LATEST_STILL } });\n}\n\nif (!out.length) throw new Error('overlay_still_2.0: no still_id rows.');\nreturn out;\n",
    },
    output: [{ still_id: 'FILM-001', model_still: 'grok-imagine-image-2.0' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_still_model',
    position: [752, 304],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['still_id'],
        value: {
          still_id: expr('{{ $json.still_id }}'),
          model_still: expr('{{ $json.model_still }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'model_still', displayName: 'model_still', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ still_id: 'FILM-001', model_still: 'grok-imagine-image-2.0' }],
  },
});

export default workflow('overlay_still_2.0', 'overlay_still_2.0')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayRows)
  .to(sheetsUpdate);
