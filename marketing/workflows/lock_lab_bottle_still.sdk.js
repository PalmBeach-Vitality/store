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
    output: [{ creation_id: 'PBVita-Lab-398', camera_move: 'then hold', shot_family: 'pedestal_up', camera_angle: 'eye-level', camera_direction: 'pedestal up', video_motion_prompt: "CAMERA LOCK: keep label 'CJC/Ipamorelin' unchanged", video_prompt: 'VIAL VISUAL LOCK' }],
  },
});

const applyBottle = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'apply_lab_bottle_still',
    position: [520, 240],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "function squeeze(text) {\n  return String(text || '').replace(/\\s+/g, ' ').trim();\n}\n\nfunction labelOf(motion, cid) {\n  var found = String(motion || '').match(/Keep label '([^']*)'/g);\n  if (!found || found.length !== 1) {\n    throw new Error(cid + ': motion prompt needs exactly one Keep label quote');\n  }\n  var quote = found[0].replace(\"Keep label '\", '').replace(/'$/, '');\n  if (!quote.trim()) throw new Error(cid + ': empty label quote');\n  return quote;\n}\n\nvar LOCK =\n  'The glass bottle stays planted on its base, upright, the same object as the first frame. ' +\n  'The cap stays seated and closed. ' +\n  'The label is flat printed ink. The small DNA mark keeps the same shape and the same place on the glass. ' +\n  'Only the camera travels. ';\n\nvar CONTINUITY =\n  'Keep the same setting, materials, and lighting already in the still. ' +\n  'Every background object already in frame stays solid and visible. ' +\n  'Nothing fades in, fades out, appears, or disappears.';\n\nvar BANNED = [\n  'then hold',\n  'hard hold',\n  'locked tripod',\n  'does not travel',\n  'lighting wrap',\n  'forbidden',\n  'handheld',\n  'frozen',\n  'static_lock',\n  'label lock',\n  'drift',\n  'no travel',\n];\n\nfunction cleanCamera(move, family) {\n  var raw = squeeze(move);\n  var found;\n  var angle;\n  var place;\n  if (family === 'static_lock' || raw.indexOf('locked tripod') !== -1) {\n    found = raw.match(/at ([^,]+), subject ([^,]+)/);\n    angle = found ? squeeze(found[1]) : '';\n    place = found ? squeeze(found[2]) : '';\n    if (!angle || !place) throw new Error('static_lock camera could not be read: ' + raw);\n    return (\n      'slow straight dolly-in a few centimeters at ' +\n      angle +\n      ', subject ' +\n      place +\n      ', one continuous move for the whole shot'\n    );\n  }\n  if (family === 'doc_drift' || raw.indexOf('handheld') !== -1 || raw.indexOf('micro drift') !== -1) {\n    found = raw.match(/\\bat ([^,]+)/);\n    angle = found ? squeeze(found[1]) : '';\n    angle = angle.replace('slight handheld high', 'slight-high');\n    angle = angle.replace('slight handheld low', 'slight-low');\n    angle = angle.replace(/documentary/g, '');\n    angle = squeeze(angle).replace(/^[, ]+|[, ]+$/g, '');\n    if (!angle) throw new Error('doc_drift camera could not be read: ' + raw);\n    return (\n      'slow straight dolly-in a few centimeters at ' +\n      angle +\n      ', one continuous move for the whole shot, no circling path'\n    );\n  }\n  var text = raw.replace(', lighting wrap shifts on edges', '');\n  text = text.replace('lighting wrap shifts on edges, ', '');\n  text = text.replace(/(?:creeping|ultra-slow|barely moving) tiny forward drift only/gi, 'slow continuous move closer');\n  text = text.replace(/,?\\s*then settle and hard hold|,?\\s*then hard hold|,?\\s*then hold/gi, '');\n  text = text.replace(/\\u2014/g, ',');\n  text = text.replace('focus locked on subject', 'the bottle stays in focus');\n  text = text.replace('then lock off on the label plane', 'continuing across the label');\n  text = text.replace('(straight up to label lock)', '(straight up across the label)');\n  text = text.replace('locked offset composition', 'offset composition');\n  text = text.replace('locked with breath ', '');\n  text = text.replace('slight handheld high', 'slight-high');\n  text = text.replace('slight handheld low', 'slight-low');\n  text = squeeze(text).replace(/^[, ]+|[, ]+$/g, '');\n  if (text.indexOf('one continuous move for the whole shot') === -1) {\n    text = text.replace(/\\.$/, '') + ', one continuous move for the whole shot';\n  }\n  return squeeze(text);\n}\n\nfunction buildMotion(row) {\n  var cid = squeeze(row.creation_id);\n  if (!cid) throw new Error('row missing creation_id');\n  var family = squeeze(row.shot_family);\n  var angle = squeeze(row.camera_angle);\n  var direction = squeeze(row.camera_direction);\n  var move = squeeze(row.camera_move);\n  if (!family) throw new Error(cid + ': empty shot_family');\n  if (!angle) throw new Error(cid + ': empty camera_angle');\n  if (!direction) throw new Error(cid + ': empty camera_direction');\n  if (!move) throw new Error(cid + ': empty camera_move');\n  var printed = labelOf(row.video_motion_prompt, cid);\n  var camera = cleanCamera(move, family);\n  var spokenAngle = squeeze(\n    angle.replace(/documentary/g, '').replace('slight handheld high', 'slight-high').replace('slight handheld low', 'slight-low')\n  );\n  var spokenDirection = family === 'doc_drift' || family === 'static_lock' ? 'forward' : direction;\n  var noOrbit = '';\n  if (!/\\borbit\\b/i.test(move) && !/\\borbit\\b/i.test(camera)) noOrbit = 'No orbit. ';\n  var prompt = squeeze(\n    LOCK +\n      'Slow cinematic camera: ' +\n      camera +\n      '. ' +\n      'Angle ' +\n      spokenAngle +\n      ', direction ' +\n      spokenDirection +\n      '. ' +\n      CONTINUITY +\n      ' ' +\n      noOrbit +\n      'No people, hands, faces, or burn-in. ' +\n      \"Keep label '\" +\n      printed +\n      \"' unchanged if visible, once only.\"\n  );\n  var low = prompt.toLowerCase();\n  var i;\n  for (i = 0; i < BANNED.length; i++) {\n    if (low.indexOf(BANNED[i]) !== -1) throw new Error(cid + ': banned ' + BANNED[i]);\n  }\n  if (low.indexOf('the small dna mark keeps the same shape') === -1) {\n    throw new Error(cid + ': DNA mark line missing');\n  }\n  if (low.indexOf('only the camera travels') === -1) throw new Error(cid + ': camera line missing');\n  if (prompt.length > 2500) throw new Error(cid + ': motion is ' + prompt.length + ' characters');\n  return { camera: camera, motion: prompt };\n}\n\nif (typeof $input !== 'undefined') {\n  var rows = $input.all().map(function (item) {\n    return item.json;\n  });\n  if (rows.length !== 535) throw new Error('lock_lab_bottle_still: expected 535 rows, got ' + rows.length);\n  var seen = {};\n  var out = rows.map(function (row) {\n    var id = squeeze(row.creation_id);\n    if (seen[id]) throw new Error('lock_lab_bottle_still: duplicate ' + id);\n    seen[id] = true;\n    var motion = String(row.video_motion_prompt || '');\n    if (motion.indexOf(LOCK) === 0) throw new Error(id + ': bottle lock already applied');\n    if (motion.indexOf('CAMERA LOCK:') !== 0) throw new Error(id + ': motion is not the CAMERA LOCK pass');\n    var built = buildMotion(row);\n    var still = String(row.video_prompt || '');\n    if (still.indexOf('VIAL VISUAL LOCK') === -1) throw new Error(id + ': video_prompt is not the vial still');\n    return {\n      json: {\n        creation_id: id,\n        camera_move: built.camera,\n        video_motion_prompt: built.motion,\n      },\n    };\n  });\n  return out;\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { buildMotion: buildMotion, cleanCamera: cleanCamera, LOCK: LOCK };\n}\n",
    },
    output: [{ creation_id: 'PBVita-Lab-398', camera_move: 'soft pedestal up', video_motion_prompt: 'The glass bottle stays planted' }],
  },
});

const writeBottle = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'write_lab_bottle_still',
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
          { id: 'camera_move', displayName: 'camera_move', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ creation_id: 'PBVita-Lab-398', camera_move: 'soft pedestal up' }],
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
    output: [{ creation_id: 'PBVita-Lab-398', camera_move: 'one continuous move', video_motion_prompt: 'The small DNA mark keeps the same shape', video_prompt: 'VIAL VISUAL LOCK' }],
  },
});

const assertBottle = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'assert_lab_bottle_still',
    position: [1280, 240],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var rows = $input.all().map(function (i) { return i.json; }); if (rows.length !== 535) throw new Error('assert_lab_bottle_still: expected 535, got ' + rows.length); var bad = 0; var lab398 = null; var stills = 0; var i; for (i = 0; i < rows.length; i++) { var row = rows[i]; var motion = String(row.video_motion_prompt || ''); var camera = String(row.camera_move || ''); var still = String(row.video_prompt || ''); var low = (motion + ' ' + camera).toLowerCase(); if (motion.indexOf('The glass bottle stays planted') !== 0) bad++; if (motion.indexOf('The small DNA mark keeps the same shape') === -1) bad++; if (motion.indexOf('Only the camera travels') === -1) bad++; if (low.indexOf('then hold') !== -1 || low.indexOf('locked tripod') !== -1 || low.indexOf('lighting wrap') !== -1 || low.indexOf('no travel') !== -1) bad++; if (still.indexOf('VIAL VISUAL LOCK') === -1) bad++; if (String(row.shot_family) === 'static_lock') { stills++; if (camera.indexOf('dolly-in') === -1 || motion.indexOf('direction forward') === -1) bad++; } if (String(row.creation_id) === 'PBVita-Lab-398') lab398 = row; } if (stills !== 24) throw new Error('assert_lab_bottle_still: static_lock ' + stills); if (!lab398 || lab398.video_motion_prompt.indexOf('CJC/Ipamorelin') === -1) throw new Error('assert_lab_bottle_still: Lab-398 label missing'); if (lab398.camera_move.indexOf('pedestal up') === -1 || lab398.camera_move.indexOf('one continuous move') === -1) throw new Error('assert_lab_bottle_still: Lab-398 camera ' + lab398.camera_move); if (bad) throw new Error('assert_lab_bottle_still: bad=' + bad); return [{ json: { rows: 535, bad: bad, static_lock: stills, lab398_pedestal: true, still_frozen: true } }];",
    },
    output: [{ rows: 535, bad: 0, static_lock: 24, lab398_pedestal: true, still_frozen: true }],
  },
});

export default workflow('lock_lab_bottle_still', 'One-shot. Sheet 9 camera travels. The bottle and printed DNA mark stay still. Does not touch video_prompt or times_used.')
  .add(startTrigger)
  .to(readLabRows)
  .to(applyBottle)
  .to(writeBottle)
  .to(readBack)
  .to(assertBottle);
