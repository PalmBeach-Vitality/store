import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 720,
      height: 280,
      content: '# overlay_film001_new_still (unpublished)\n# Writes FILM-001 picked_url, tighter camera-hold motion prompt, and clears video_url.',
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

const overlayFilm001 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film001_new_still',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "var BRANCH = 'cursor/film001-new-still-4c4b';\n" +
        "var PICKED = 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' + BRANCH + '/marketing/stills/film001-identity.png';\n" +
        "var MOTION = 'Late-20s blonde astronaut on the alien coast. Soft wind in hair and navy-gold flight suit. Twin moons and teal-violet trees hold behind her. Square gunmetal wrist computer stays in frame, amber screen steady. Camera holds. Silent.';\n" +
        'var rows = $input.all().map(function (i) { return i.json; });\n' +
        "if (!rows.length) throw new Error('overlay_film001_new_still: no rows from get_film_stills.');\n" +
        'var out = [];\n' +
        'for (var i = 0; i < rows.length; i++) {\n' +
        "  var stillId = String((rows[i] || {}).still_id || '').trim();\n" +
        "  if (stillId !== 'FILM-001') continue;\n" +
        '  out.push({ json: { still_id: stillId, picked_url: PICKED, video_url: \"\", video_motion_prompt: MOTION } });\n' +
        '}\n' +
        "if (out.length !== 1) throw new Error('overlay_film001_new_still: expected FILM-001, wrote ' + out.length);\n" +
        'return out;\n',
    },
    output: [{ still_id: 'FILM-001', picked_url: 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film001-new-still-4c4b/marketing/stills/film001-identity.png', video_url: '', video_motion_prompt: 'Late-20s blonde astronaut on the alien coast. Soft wind in hair and navy-gold flight suit. Twin moons and teal-violet trees hold behind her. Square gunmetal wrist computer stays in frame, amber screen steady. Camera holds. Silent.' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_film001',
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
          picked_url: expr('{{ $json.picked_url }}'),
          video_url: expr('{{ $json.video_url }}'),
          video_motion_prompt: expr('{{ $json.video_motion_prompt }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'picked_url', displayName: 'picked_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ still_id: 'FILM-001' }],
  },
});

export default workflow('overlay_film001_new_still', 'overlay_film001_new_still')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayFilm001)
  .to(sheetsUpdate);
