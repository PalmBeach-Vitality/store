import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'manual_trigger',
    output: [{ ok: true }],
  },
});

const getFilmStills = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    executeOnce: true,
    credentials: {
      googleSheetsOAuth2Api: newCredential('Google Sheets account'),
    },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      authentication: 'oAuth2',
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
    },
    output: [{ still_id: 'FILM-025', status: 'Active' }],
  },
});

const overlayKeepers = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film023_024_final',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "function squeeze(s) {\n" +
        "  var t = String(s || '');\n" +
        "  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');\n" +
        "  return t.trim();\n" +
        "}\n" +
        "function capPrompt(s) {\n" +
        "  s = squeeze(s);\n" +
        "  if (s.length > 7900) s = s.slice(0, 7900);\n" +
        "  return s;\n" +
        "}\n" +
        "var PICKED_023 = 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film023-handoff-source.jpg';\n" +
        "var PICKED_024 = 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film024-recharge-source.jpg';\n" +
        "var PICKED_025 = 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film025-takeoff-source.png';\n" +
        "var EDIT_023 = 'FINAL keeper: vial_handoff_23 (updated). Do not regenerate. Do not edit.';\n" +
        "var EDIT_024 = 'FINAL keeper: vial_recharge_24 (updated). Do not regenerate. Do not edit.';\n" +
        "var EDIT_025 = 'FINAL keeper: spaceship_takeoff_25. Do not regenerate. Do not edit.';\n" +
        "var rows = $input.all().map(function (i) { return i.json; });\n" +
        "if (!rows.length) { throw new Error('overlay_film023_024_final: no rows from get_film_stills.'); }\n" +
        "var seen = {};\n" +
        "var out = [];\n" +
        "for (var i = 0; i < rows.length; i++) {\n" +
        "  var stillId = String((rows[i] || {}).still_id || '').trim();\n" +
        "  if (stillId === 'FILM-023') {\n" +
        "    seen[stillId] = 1;\n" +
        "    out.push({ json: { still_id: stillId, picked_url: PICKED_023, take_urls: PICKED_023, still_edit_prompt: capPrompt(EDIT_023), times_used: '1' } });\n" +
        "  }\n" +
        "  if (stillId === 'FILM-024') {\n" +
        "    seen[stillId] = 1;\n" +
        "    out.push({ json: { still_id: stillId, picked_url: PICKED_024, take_urls: PICKED_024, still_edit_prompt: capPrompt(EDIT_024), times_used: '1' } });\n" +
        "  }\n" +
        "  if (stillId === 'FILM-025') {\n" +
        "    seen[stillId] = 1;\n" +
        "    out.push({ json: { still_id: stillId, picked_url: PICKED_025, take_urls: PICKED_025, still_edit_prompt: capPrompt(EDIT_025), times_used: '1' } });\n" +
        "  }\n" +
        "}\n" +
        "if (!seen['FILM-023'] || !seen['FILM-024'] || !seen['FILM-025']) {\n" +
        "  throw new Error('overlay_film023_024_final: missing FILM-023, FILM-024, or FILM-025 on the sheet.');\n" +
        "}\n" +
        "return out;\n",
    },
    output: [
      {
        still_id: 'FILM-025',
        picked_url:
          'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film025-takeoff-source.png',
        take_urls:
          'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film025-takeoff-source.png',
        still_edit_prompt: 'FINAL keeper: spaceship_takeoff_25. Do not regenerate. Do not edit.',
        times_used: '1',
      },
    ],
  },
});

const sheetsUpdateKeepers = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_keepers',
    credentials: {
      googleSheetsOAuth2Api: newCredential('Google Sheets account'),
    },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      authentication: 'oAuth2',
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
          take_urls: expr('{{ $json.take_urls }}'),
          still_edit_prompt: expr('{{ $json.still_edit_prompt }}'),
          times_used: expr('{{ $json.times_used }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'picked_url', displayName: 'picked_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'take_urls', displayName: 'take_urls', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'still_edit_prompt', displayName: 'still_edit_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'times_used', displayName: 'times_used', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
    },
    output: [
      {
        still_id: 'FILM-025',
        picked_url:
          'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film025-takeoff-source.png',
      },
    ],
  },
});

export default workflow('overlay-film023-024-final', 'overlay_film023_024_final')
  .add(manualTrigger)
  .to(getFilmStills)
  .to(overlayKeepers)
  .to(sheetsUpdateKeepers);
