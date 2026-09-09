import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 420,
      content:
        '# overlay_film_join_25 (unpublished)\n' +
        '# Writes VACE / FLF2V join columns onto Sheet 18.\n' +
        '# Does not touch picked_url or video_url. Do not Publish.',
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
    output: [{ still_id: 'FILM-001' }],
  },
});

const overlayJoin = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film_join_25',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "var REEL_ID = 'MOTSC-FILM-01';\n" +
        "var JOIN_WAIT = '90';\n" +
        "var BRIDGE_MODEL = 'kwaivgi/kling-v3.0-pro';\n" +
        "var BRIDGE_DURATION = '5';\n" +
        "var BRIDGE_RESOLUTION = '720p';\n" +
        'var rows = $input.all().map(function (i) { return i.json; });\n' +
        "if (!rows.length) throw new Error('overlay_film_join_25: no rows from get_film_stills.');\n" +
        'var out = [];\n' +
        'for (var i = 0; i < rows.length; i++) {\n' +
        "  var stillId = String((rows[i] || {}).still_id || '').trim();\n" +
        '  if (!stillId) continue;\n' +
        '  var m = stillId.match(/^FILM-(\\d+)$/i);\n' +
        "  if (!m) throw new Error('overlay_film_join_25: unexpected still_id ' + stillId);\n" +
        '  var order = String(Number(m[1]));\n' +
        '  out.push({ json: {\n' +
        '    still_id: stillId,\n' +
        '    reel_id: REEL_ID,\n' +
        '    clip_order: order,\n' +
        "    seam_mode: 'vace',\n" +
        "    bridge_prompt: '',\n" +
        '    bridge_model: BRIDGE_MODEL,\n' +
        '    bridge_duration: BRIDGE_DURATION,\n' +
        '    bridge_resolution: BRIDGE_RESOLUTION,\n' +
        '    join_wait_seconds: JOIN_WAIT,\n' +
        "    music_prompt: '',\n" +
        "    sfx_prompt: '',\n" +
        "    join_url: '',\n" +
        "    join_status: ''\n" +
        '  } });\n' +
        '}\n' +
        "if (out.length !== 25) throw new Error('overlay_film_join_25: expected 25 rows, got ' + out.length);\n" +
        'return out;\n',
    },
    output: [{ still_id: 'FILM-001', reel_id: 'MOTSC-FILM-01', clip_order: '1', seam_mode: 'vace' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_join',
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
        mappingMode: 'autoMapInputData',
        matchingColumns: ['still_id'],
        value: {},
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'reel_id', displayName: 'reel_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'clip_order', displayName: 'clip_order', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'seam_mode', displayName: 'seam_mode', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'bridge_prompt', displayName: 'bridge_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'bridge_model', displayName: 'bridge_model', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'bridge_duration', displayName: 'bridge_duration', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'bridge_resolution', displayName: 'bridge_resolution', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'join_wait_seconds', displayName: 'join_wait_seconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'music_prompt', displayName: 'music_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'sfx_prompt', displayName: 'sfx_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'join_url', displayName: 'join_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'join_status', displayName: 'join_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ still_id: 'FILM-001' }],
  },
});

export default workflow('overlay_film_join_25', 'overlay_film_join_25')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayJoin)
  .to(sheetsUpdate);
