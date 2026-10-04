import { workflow, node, trigger } from '@n8n/workflow-sdk';

const credSheets = { googleSheetsOAuth2Api: { id: 'OGHfxWtOUeZbDesw', name: 'Google Sheets account' } };
const penDoc = {
  __rl: true,
  mode: 'id',
  value: '1L7bLOMa2Ri2AnWH4d4z7ahbz468Gcl8BhfQf9DVZn-4',
  cachedResultName: '14-pen-creations-150',
};
const penTab = {
  __rl: true,
  mode: 'list',
  value: '1395194708',
  cachedResultName: '14-pen-creations-150',
};

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 240] },
  output: [{}],
});

const readPenRows = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_pen_rows',
    position: [260, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: penDoc,
      sheetName: penTab,
      options: { returnAllMatches: 'returnAllMatches' },
    },
    output: [{ creation_id: 'PBVita-Pen-169', compound_name: 'IGF-LR3', camera_move: 'locked tripod', shot_family: 'static_lock', camera_angle: 'three-quarter-right', camera_direction: 'no travel / locked' }],
  },
});

const rewriteMotion = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'rewrite_pen_motion',
    position: [520, 240],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var PEN_LOCK = 'The product matches the start image. Same silhouette, same colors, same parts.'; var NEGATIVE = 'morphing, melting, transforming, shape change, cap moving, clip sliding, uncapping, dial turning, knob rotating, plunger extending, button popping out, deformation, growing, shrinking'; function ascii(s) { var t = String(s || ''); var map = {}; map[String.fromCharCode(8216)] = String.fromCharCode(39); map[String.fromCharCode(8217)] = String.fromCharCode(39); map[String.fromCharCode(8220)] = String.fromCharCode(34); map[String.fromCharCode(8221)] = String.fromCharCode(34); map[String.fromCharCode(8211)] = '-'; map[String.fromCharCode(8212)] = '-'; map[String.fromCharCode(8722)] = '-'; map[String.fromCharCode(8230)] = '...'; map[String.fromCharCode(215)] = 'x'; var out = ''; var i; for (i = 0; i < t.length; i++) { var ch = t.charAt(i); var code = t.charCodeAt(i); if (map[ch]) out += map[ch]; else if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)) out += ch; else out += ' '; } while (out.indexOf('  ') !== -1) out = out.split('  ').join(' '); while (out.charAt(0) === ' ') out = out.slice(1); while (out.charAt(out.length - 1) === ' ') out = out.slice(0, -1); return out; } function must(row, key) { var v = ascii(row[key]); if (!v) throw new Error('rewrite_pen_motion: ' + (row.creation_id || '?') + ' missing ' + key); return v; } var rows = $input.all().map(function (i) { return i.json; }); if (rows.length !== 168) throw new Error('rewrite_pen_motion: expected 168 rows, got ' + rows.length); var seen = {}; return rows.map(function (row) { var id = must(row, 'creation_id'); if (seen[id]) throw new Error('rewrite_pen_motion: duplicate ' + id); seen[id] = true; var compound = must(row, 'compound_name'); var q = String.fromCharCode(39); var prompt = PEN_LOCK + ' ' + must(row, 'camera_move') + '. Shot ' + must(row, 'shot_family') + ', angle ' + must(row, 'camera_angle') + ', direction ' + must(row, 'camera_direction') + '. No new objects. No people, hands, faces, needles, or burn-in. Keep label ' + q + compound + q + ' and ' + q + '3ml Pen' + q + ' unchanged.'; prompt = ascii(prompt); if (prompt.length > 1400) throw new Error('rewrite_pen_motion: ' + id + ' motion is ' + prompt.length + ' characters'); var lowPrompt = prompt.toLowerCase(); if (lowPrompt.indexOf('vial visual lock') !== -1 || lowPrompt.indexOf('flip-off') !== -1 || lowPrompt.indexOf('uncap') !== -1) throw new Error('rewrite_pen_motion: ' + id + ' still has vial language'); if (prompt.indexOf(must(row, 'camera_move')) === -1) throw new Error('rewrite_pen_motion: ' + id + ' dropped the sheet camera move'); if (lowPrompt.indexOf('same place on the surface') !== -1 || lowPrompt.indexOf('stays a still object') !== -1 || lowPrompt.indexOf('camera, from the sheet') !== -1) throw new Error('rewrite_pen_motion: ' + id + ' added a camera freeze'); return { json: { creation_id: id, video_motion_prompt: prompt, negative_prompt: NEGATIVE } }; });",
    },
    output: [{ creation_id: 'PBVita-Pen-169', video_motion_prompt: 'PEN LOCK: Frozen product.' }],
  },
});

const writeMotion = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'write_pen_motion',
    position: [800, 240],
    credentials: credSheets,
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: penDoc,
      sheetName: penTab,
      columns: {
        mappingMode: 'autoMapInputData',
        matchingColumns: ['creation_id'],
        value: {},
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'negative_prompt', displayName: 'negative_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ creation_id: 'PBVita-Pen-169', video_motion_prompt: 'PEN LOCK: Frozen product.' }],
  },
});

const readBack = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_pen_rows_back',
    position: [1040, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: penDoc,
      sheetName: penTab,
      options: { returnAllMatches: 'returnAllMatches' },
    },
    output: [{ creation_id: 'PBVita-Pen-003', video_motion_prompt: 'creeping straight pull-back', negative_prompt: 'cap moving' }],
  },
});

const assertCamera = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'assert_sheet_camera',
    position: [1280, 240],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var rows = $input.all().map(function (i) { return i.json; }); if (rows.length !== 168) throw new Error('assert_sheet_camera: expected 168, got ' + rows.length); var freeze = 0; var named = 0; var emptyNeg = 0; var pen003 = ''; var pen170 = ''; var i; for (i = 0; i < rows.length; i++) { var m = String(rows[i].video_motion_prompt || ''); var n = String(rows[i].negative_prompt || ''); var low = m.toLowerCase(); if (low.indexOf('same place on the surface') !== -1 || low.indexOf('stays a still object') !== -1 || low.indexOf('camera, from the sheet') !== -1) freeze++; if (low.indexOf('the cap does not move') !== -1 || m.indexOf('White ridged dose dial') !== -1) named++; if (n.indexOf('cap moving') === -1) emptyNeg++; if (String(rows[i].creation_id) === 'PBVita-Pen-003') pen003 = m; if (String(rows[i].creation_id) === 'PBVita-Pen-170') pen170 = m; } if (!pen003) throw new Error('assert_sheet_camera: Pen-003 missing'); if (pen003.indexOf('creeping straight pull-back') === -1) throw new Error('assert_sheet_camera: Pen-003 lost the sheet pull-back'); if (!pen170) throw new Error('assert_sheet_camera: Pen-170 missing'); if (pen170.indexOf('locked tripod hold at three-quarter-right') === -1) throw new Error('assert_sheet_camera: Pen-170 dropped the sheet camera'); if (freeze || named || emptyNeg) throw new Error('assert_sheet_camera: freeze=' + freeze + ' named=' + named + ' emptyNeg=' + emptyNeg); return [{ json: { rows: 168, freeze: freeze, named: named, emptyNeg: emptyNeg, pen003_pullback: true, pen170_sheet_camera: true } }];",
    },
    output: [{ rows: 168, freeze: 0, named: 0, emptyNeg: 0, pen003_pullback: true, pen170_sheet_camera: true }],
  },
});

export default workflow('pen_motion_from_sheet', 'One-shot. Writes each Sheet 14 camera_move into video_motion_prompt. Does not add a camera freeze.')
  .add(startTrigger)
  .to(readPenRows)
  .to(rewriteMotion)
  .to(writeMotion)
  .to(readBack)
  .to(assertCamera);
