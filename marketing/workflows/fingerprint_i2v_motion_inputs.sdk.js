import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const fingerJs =
  'function djb2(s) {\n' +
  '  var h = 5381;\n' +
  '  for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;\n' +
  '  return h.toString(16);\n' +
  '}\n' +
  'var items = $input.all();\n' +
  'var lines = [];\n' +
  'var promptLines = [];\n' +
  'for (var i = 0; i < items.length; i++) {\n' +
  '  var row = items[i].json || {};\n' +
  '  var cid = String(row.creation_id || "").replace(/\\s+/g, " ").trim();\n' +
  '  if (!cid) throw new Error("row missing creation_id");\n' +
  '  var move = String(row.camera_move || "").replace(/\\s+/g, " ").trim();\n' +
  '  var family = String(row.shot_family || "").replace(/\\s+/g, " ").trim();\n' +
  '  var angle = String(row.camera_angle || "").replace(/\\s+/g, " ").trim();\n' +
  '  var direction = String(row.camera_direction || "").replace(/\\s+/g, " ").trim();\n' +
  '  var motion = String(row.video_motion_prompt || "");\n' +
  '  var found = [];\n' +
  '  var labelRe = /Keep label \'([^\']*)\' unchanged/g;\n' +
  '  var match;\n' +
  '  while ((match = labelRe.exec(motion)) !== null) found.push(match[1]);\n' +
  '  var printed = found.length === 1 ? found[0] : "";\n' +
  '  var prompt = String(row.video_prompt || "");\n' +
  '  lines.push([cid, move, family, angle, direction, printed].join("\\t"));\n' +
  '  promptLines.push(cid + "\\t" + djb2(prompt) + "\\t" + String(prompt.length));\n' +
  '}\n' +
  'lines.sort();\n' +
  'promptLines.sort();\n' +
  'return [{ json: { count: items.length, inputs: djb2(lines.join("\\n")), prompts: djb2(promptLines.join("\\n")) } }];\n';

const howto = sticky({
  config: {
    name: 'fingerprint_howto',
    parameters: {
      color: 3,
      width: 720,
      height: 180,
      content:
        '# fingerprint_i2v_motion_inputs (unpublished) Read-only. Digests camera columns, the Keep label quote, and video_prompt. Does not write.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 240] },
});

const readLab = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_lab_9',
    position: [240, 80],
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
    output: [{ creation_id: 'PBVita-Lab-001', camera_move: 'push-in', shot_family: 'push_in', camera_angle: 'eye', camera_direction: 'in', video_motion_prompt: "Keep label 'BPC-157' unchanged", video_prompt: 'still' }],
  },
});

const hashLab = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'hash_lab',
    position: [480, 80],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: fingerJs },
    output: [{ count: 535, inputs: 'abc', prompts: 'def' }],
  },
});

const readWellness = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_wellness_500',
    position: [240, 400],
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
    output: [{ creation_id: 'LI-001', camera_move: 'orbit', shot_family: 'vial_landscape', camera_angle: 'eye', camera_direction: 'around', video_motion_prompt: "Keep label 'BPC-157' unchanged", video_prompt: 'still' }],
  },
});

const hashWellness = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'hash_wellness',
    position: [480, 400],
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: fingerJs },
    output: [{ count: 601, inputs: 'abc', prompts: 'def' }],
  },
});

export default workflow('fingerprint_i2v_motion_inputs', 'fingerprint_i2v_motion_inputs')
  .add(howto)
  .add(startTrigger)
  .to(readLab.to(hashLab))
  .add(startTrigger)
  .to(readWellness.to(hashWellness));
