import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const verifyJs =
  'var OLD = "CAP LOCK: One solid bright blue cap, seated and frozen. The cap stays closed. Camera may move; the cap does not. ";\n' +
  'var NEW = "CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable. ";\n' +
  'var items = $input.all();\n' +
  'var camera = 0;\n' +
  'var leftover = 0;\n' +
  'var samples = {};\n' +
  'var tails = {};\n' +
  'for (var i = 0; i < items.length; i++) {\n' +
  '  var row = items[i].json || {};\n' +
  '  var id = String(row.creation_id || "").trim();\n' +
  '  var m = String(row.video_motion_prompt || "");\n' +
  '  if (m.indexOf(NEW) === 0) camera++;\n' +
  '  if (m.indexOf(OLD) === 0) leftover++;\n' +
  '  var tail = m.indexOf(NEW) === 0 ? m.slice(NEW.length) : m;\n' +
  '  tails[tail] = (tails[tail] || 0) + 1;\n' +
  '  if (id === "LI-016" || id === "PBVita-Lab-207" || id === "PBVita-Lab-001" || id === "LI-028") {\n' +
  '    samples[id] = m;\n' +
  '  }\n' +
  '}\n' +
  'var uniqueTails = Object.keys(tails).length;\n' +
  'if (leftover) throw new Error("leftover CAP LOCK " + leftover);\n' +
  'if (camera !== items.length) throw new Error("camera lock " + camera + " != rows " + items.length);\n' +
  'if (uniqueTails !== items.length) throw new Error("unique tails " + uniqueTails + " != rows " + items.length);\n' +
  'return [{ json: {\n' +
  '  rows: items.length,\n' +
  '  camera_lock: camera,\n' +
  '  leftover_cap_lock: leftover,\n' +
  '  unique_tails: uniqueTails,\n' +
  '  li016: samples["LI-016"] || "",\n' +
  '  lab207: samples["PBVita-Lab-207"] || "",\n' +
  '  lab001: samples["PBVita-Lab-001"] || "",\n' +
  '  li028: samples["LI-028"] || ""\n' +
  '} }];\n';

const howto = sticky({
  config: {
    name: 'verify_howto',
    parameters: {
      color: 5,
      width: 820,
      height: 220,
      content:
        '# verify_lock_camera_not_vial (unpublished) Read-back CAMERA LOCK on Sheet 9 + wellness. Does not write. Do not run vid-gen.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const readLab = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_lab_9',
    position: [224, 144],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1dvY7XGwjdkQm2Sp7glAvxuSLg9RHrxJd9tXbhh74Xfc',
        cachedResultName: '9-lab-item-creations-500',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '136811109',
        cachedResultName: '9-lab-item-creations-500',
      },
      options: {},
    },
    output: [{ creation_id: 'PBVita-Lab-207', video_motion_prompt: 'CAMERA LOCK' }],
  },
});

const checkLab = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'check_lab',
    position: [448, 144],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: verifyJs,
    },
    output: [{ rows: 535, camera_lock: 535, leftover_cap_lock: 0, unique_tails: 535, lab207: 'CAMERA LOCK' }],
  },
});

const readWellness = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_wellness_500',
    position: [224, 464],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1S6UQmD4ZFW3oL4vx8BKmhWAZrt7KMGwsBS7jW3S9HPo',
        cachedResultName: '500_Peptide_Wellness_Reel_Scenes',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '444650679',
        cachedResultName: '500_Peptide_Wellness_Reel_Scenes.csv',
      },
      options: {},
    },
    output: [{ creation_id: 'LI-016', video_motion_prompt: 'CAMERA LOCK' }],
  },
});

const checkWellness = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'check_wellness',
    position: [448, 464],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: verifyJs,
    },
    output: [{ rows: 601, camera_lock: 601, leftover_cap_lock: 0, unique_tails: 601, li016: 'CAMERA LOCK' }],
  },
});

export default workflow('verify_lock_camera_not_vial', 'verify_lock_camera_not_vial')
  .add(howto)
  .add(startTrigger)
  .to(readLab.to(checkLab))
  .add(startTrigger)
  .to(readWellness.to(checkWellness));
