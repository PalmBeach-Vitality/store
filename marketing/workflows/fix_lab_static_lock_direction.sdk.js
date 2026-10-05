import { workflow, node, trigger } from '@n8n/workflow-sdk';

const credSheets = { googleSheetsOAuth2Api: { id: 'OGHfxWtOUeZbDesw', name: 'Google Sheets account' } };
const labDoc = {
  __rl: true,
  mode: 'id',
  value: '1dvY7XGwjdkQm2Sp7glAvxuSLg9RHrxJd9tXbhh74Xfc',
  cachedResultName: '9-lab-item-creations-500',
};
const labTab = {
  __rl: true,
  mode: 'list',
  value: '136811109',
  cachedResultName: '9-lab-item-creations-500',
};

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 240] },
  output: [{}],
});

const readLabRows = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_lab_rows',
    position: [260, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: labDoc,
      sheetName: labTab,
      options: { returnAllMatches: 'returnAllMatches' },
    },
    output: [{ creation_id: 'PBVita-Lab-206', shot_family: 'static_lock', camera_move: 'dolly-in', video_motion_prompt: 'direction no travel / locked', video_prompt: 'VIAL VISUAL LOCK' }],
  },
});

const applyDirection = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'apply_static_lock_direction',
    position: [520, 240],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var rows = $input.all().map(function (item) { return item.json; }); if (rows.length !== 535) throw new Error('fix_lab_static_lock_direction: expected 535 rows, got ' + rows.length); var out = []; var i; for (i = 0; i < rows.length; i++) { var row = rows[i]; var id = String(row.creation_id || ''); var motion = String(row.video_motion_prompt || ''); if (motion.indexOf('The glass bottle stays planted') !== 0) throw new Error(id + ': bottle lock missing'); if (motion.indexOf('direction no travel / locked') === -1) continue; if (String(row.shot_family) !== 'static_lock') throw new Error(id + ': no-travel line is not static_lock'); var next = motion.replace('direction no travel / locked', 'direction forward'); if (next === motion || next.toLowerCase().indexOf('no travel') !== -1) throw new Error(id + ': replace failed'); if (String(row.camera_move || '').indexOf('dolly-in') === -1) throw new Error(id + ': camera is not a dolly-in'); out.push({ json: { creation_id: id, video_motion_prompt: next } }); } if (out.length !== 24) throw new Error('fix_lab_static_lock_direction: expected 24 rows, got ' + out.length); return out;",
    },
    output: [{ creation_id: 'PBVita-Lab-206', video_motion_prompt: 'direction forward' }],
  },
});

const writeDirection = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'write_static_lock_direction',
    position: [800, 240],
    credentials: credSheets,
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: labDoc,
      sheetName: labTab,
      columns: {
        mappingMode: 'autoMapInputData',
        matchingColumns: ['creation_id'],
        value: {},
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ creation_id: 'PBVita-Lab-206', video_motion_prompt: 'direction forward' }],
  },
});

const readBack = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_lab_rows_back',
    position: [1040, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: labDoc,
      sheetName: labTab,
      options: { returnAllMatches: 'returnAllMatches' },
    },
    output: [{ creation_id: 'PBVita-Lab-398', shot_family: 'pedestal_up', camera_move: 'pedestal up', video_motion_prompt: 'The glass bottle stays planted direction forward', video_prompt: 'VIAL VISUAL LOCK' }],
  },
});

const assertDirection = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'assert_static_lock_direction',
    position: [1280, 240],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var rows = $input.all().map(function (item) { return item.json; }); if (rows.length !== 535) throw new Error('assert_static_lock_direction: expected 535, got ' + rows.length); var stills = 0; var bad = 0; var lab398 = null; var i; for (i = 0; i < rows.length; i++) { var row = rows[i]; var motion = String(row.video_motion_prompt || ''); var camera = String(row.camera_move || ''); var still = String(row.video_prompt || ''); if (motion.indexOf('The glass bottle stays planted') !== 0) bad++; if (motion.toLowerCase().indexOf('no travel') !== -1) bad++; if (still.indexOf('VIAL VISUAL LOCK') === -1) bad++; if (String(row.shot_family) === 'static_lock') { stills++; if (motion.indexOf('direction forward') === -1 || camera.indexOf('dolly-in') === -1) bad++; } if (String(row.creation_id) === 'PBVita-Lab-398') lab398 = row; } if (stills !== 24) throw new Error('assert_static_lock_direction: static_lock ' + stills); if (!lab398 || lab398.video_motion_prompt.indexOf('CJC/Ipamorelin') === -1 || lab398.camera_move.indexOf('pedestal up') === -1) throw new Error('assert_static_lock_direction: Lab-398'); if (bad) throw new Error('assert_static_lock_direction: bad=' + bad); return [{ json: { rows: 535, bad: 0, static_lock: 24, direction_forward: true, lab398_pedestal: true } }];",
    },
    output: [{ rows: 535, bad: 0, static_lock: 24, direction_forward: true, lab398_pedestal: true }],
  },
});

export default workflow('fix_lab_static_lock_direction', 'One-shot. Sheet 9 static_lock rows speak direction forward. Does not touch camera_move, video_prompt, or times_used.')
  .add(startTrigger)
  .to(readLabRows)
  .to(applyDirection)
  .to(writeDirection)
  .to(readBack)
  .to(assertDirection);
