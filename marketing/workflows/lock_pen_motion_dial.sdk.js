import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

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
      jsCode: "var PEN_LOCK = 'PEN LOCK: Frozen product. Nothing on the pen moves, rotates, extends, recolors, or changes shape. White clip-cap stays on. White ridged dose dial stays white with the same ridges, no twist and no spin. Red plunger tip stays the same size, color, and position. Window, liquid level, label, and helix stay identical to the first frame.'; function ascii(s) { var t = String(s || ''); var map = {}; map[String.fromCharCode(8216)] = String.fromCharCode(39); map[String.fromCharCode(8217)] = String.fromCharCode(39); map[String.fromCharCode(8220)] = String.fromCharCode(34); map[String.fromCharCode(8221)] = String.fromCharCode(34); map[String.fromCharCode(8211)] = '-'; map[String.fromCharCode(8212)] = '-'; map[String.fromCharCode(8722)] = '-'; map[String.fromCharCode(8230)] = '...'; map[String.fromCharCode(215)] = 'x'; var out = ''; var i; for (i = 0; i < t.length; i++) { var ch = t.charAt(i); var code = t.charCodeAt(i); if (map[ch]) out += map[ch]; else if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)) out += ch; else out += ' '; } while (out.indexOf('  ') !== -1) out = out.split('  ').join(' '); return out.replace(/^ +| +$/g, ''); } function must(row, key) { var v = ascii(row[key]); if (!v) throw new Error('rewrite_pen_motion: ' + (row.creation_id || '?') + ' missing ' + key); return v; } function cameraLine(move) { var text = ascii(move); var low = text.toLowerCase(); var at = low.indexOf('then hold'); while (at !== -1) { var start = at; if (start > 0 && text.charAt(start - 1) === ' ') start--; if (start > 0 && text.charAt(start - 1) === ',') start--; text = text.slice(0, start) + text.slice(at + 9); low = text.toLowerCase(); at = low.indexOf('then hold'); } while (text.indexOf('  ') !== -1) text = text.split('  ').join(' '); var ends = ' ,.-'; while (text.length && ends.indexOf(text.charAt(0)) !== -1) text = text.slice(1); while (text.length && ends.indexOf(text.charAt(text.length - 1)) !== -1) text = text.slice(0, -1); return text.slice(0, 160); } var rows = $input.all().map(function (i) { return i.json; }); if (rows.length !== 168) throw new Error('rewrite_pen_motion: expected 168 rows, got ' + rows.length); var seen = {}; return rows.map(function (row) { var id = must(row, 'creation_id'); if (seen[id]) throw new Error('rewrite_pen_motion: duplicate ' + id); seen[id] = true; var compound = must(row, 'compound_name'); var q = String.fromCharCode(39); var prompt = PEN_LOCK + ' Slow cinematic camera only: ' + cameraLine(must(row, 'camera_move')) + '. Shot ' + must(row, 'shot_family') + ', angle ' + must(row, 'camera_angle') + ', direction ' + must(row, 'camera_direction') + '. Keep the exact same laboratory research scene, materials, and lighting. No orbit. No new objects. No people, hands, faces, needles, or burn-in. The dose dial does not turn. The plunger does not travel. The cap does not move. Keep label ' + q + compound + q + ' and ' + q + '3ml Pen' + q + ' unchanged.'; prompt = ascii(prompt); if (prompt.length > 1400) throw new Error('rewrite_pen_motion: ' + id + ' motion is ' + prompt.length + ' characters'); var lowPrompt = prompt.toLowerCase(); if (lowPrompt.indexOf('then hold') !== -1 || lowPrompt.indexOf('vial visual lock') !== -1 || lowPrompt.indexOf('flip-off') !== -1 || lowPrompt.indexOf('flip off') !== -1 || lowPrompt.indexOf('uncap') !== -1) throw new Error('rewrite_pen_motion: ' + id + ' still has then-hold or vial language'); if (prompt.indexOf('White ridged dose dial') === -1) throw new Error('rewrite_pen_motion: ' + id + ' does not lock the dose dial'); return { json: { creation_id: id, video_motion_prompt: prompt } }; });",
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
        mappingMode: 'defineBelow',
        matchingColumns: ['creation_id'],
        value: {
          creation_id: expr('{{ $json.creation_id }}'),
          video_motion_prompt: expr('{{ $json.video_motion_prompt }}'),
        },
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: { cellFormat: 'RAW' },
    },
    output: [{ creation_id: 'PBVita-Pen-169', video_motion_prompt: 'PEN LOCK: Frozen product.' }],
  },
});

export default workflow('lock_pen_motion_dial', 'One-shot. Rewrites 14-pen video_motion_prompt so the dose dial and plunger stay frozen.')
  .add(startTrigger)
  .to(readPenRows)
  .to(rewriteMotion)
  .to(writeMotion);
