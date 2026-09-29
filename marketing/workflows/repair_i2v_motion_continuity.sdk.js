import { workflow, node, trigger, sticky, newCredential, expr, splitInBatches, nextBatch } from '@n8n/workflow-sdk';

const labJs = "var LAB = true;\nvar EXPECT = 535;\nvar LOCK = \"CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable. \";\nvar CONTINUITY = \"Keep the same setting, materials, and lighting already in the still. Every background object already in frame stays solid and visible. Nothing fades in, fades out, appears, or disappears.\";\nvar items = $input.all();\nvar out = [];\nfor (var i = 0; i < items.length; i++) {\n  var row = items[i].json || {};\n  var cid = String(row.creation_id || \"\").replace(/\\s+/g, \" \").trim();\n  if (!cid) throw new Error(\"row missing creation_id\");\n  var move = String(row.camera_move || \"\").replace(/\\s+/g, \" \").trim();\n  var family = String(row.shot_family || \"\").replace(/\\s+/g, \" \").trim();\n  var angle = String(row.camera_angle || \"\").replace(/\\s+/g, \" \").trim();\n  var direction = String(row.camera_direction || \"\").replace(/\\s+/g, \" \").trim();\n  if (!move) throw new Error(cid + \" empty camera_move\");\n  if (!family) throw new Error(cid + \" empty shot_family\");\n  if (!angle) throw new Error(cid + \" empty camera_angle\");\n  if (!direction) throw new Error(cid + \" empty camera_direction\");\n  var motion = String(row.video_motion_prompt || \"\");\n  var found = [];\n  var labelRe = /Keep label '([^']*)' unchanged/g;\n  var match;\n  while ((match = labelRe.exec(motion)) !== null) found.push(match[1]);\n  if (found.length !== 1 || !String(found[0]).replace(/\\s+/g, \" \").trim()) {\n    throw new Error(cid + \" motion prompt needs exactly one Keep label quote\");\n  }\n  var printed = found[0];\n  var noOrbit = \"\";\n  if (LAB && !/\\borbit\\b/i.test(move)) noOrbit = \"No orbit. \";\n  var nxt = LOCK +\n    \"Slow cinematic camera: \" + move + \". \" +\n    \"Shot \" + family + \", angle \" + angle + \", direction \" + direction + \". \" +\n    CONTINUITY + \" \" +\n    noOrbit +\n    \"No people, hands, faces, or burn-in. \" +\n    \"Keep label '\" + printed + \"' unchanged if visible, once only.\";\n  if (nxt.indexOf(\"No new objects\") !== -1 || nxt.indexOf(\"laboratory research scene\") !== -1) {\n    throw new Error(cid + \" fade sentence survived\");\n  }\n  if (nxt.indexOf(\"needles\") !== -1) throw new Error(cid + \" needles leaked back into motion\");\n  if (nxt.indexOf(LOCK) !== 0) throw new Error(cid + \" CAMERA LOCK missing\");\n  if (nxt.indexOf(CONTINUITY) === -1) throw new Error(cid + \" continuity sentence missing\");\n  out.push({ json: { creation_id: cid, video_motion_prompt: nxt } });\n}\nif (out.length !== EXPECT) throw new Error(\"expected \" + EXPECT + \" rows, got \" + out.length);\n  var m501 = \"\";\n  var m067 = \"\";\n  for (var s = 0; s < out.length; s++) {\n    if (out[s].json.creation_id === \"PBVita-Lab-501\") m501 = out[s].json.video_motion_prompt;\n    if (out[s].json.creation_id === \"PBVita-Lab-067\") m067 = out[s].json.video_motion_prompt;\n  }\n  if (!m501 || m501.indexOf(\"crane-down\") === -1 || m501.indexOf(\"Shot crane_settle\") === -1) {\n    throw new Error(\"PBVita-Lab-501 motion is not the crane settle on the row\");\n  }\n  if (m501.indexOf(\"side-profile\") !== -1) throw new Error(\"PBVita-Lab-501 still carries the side-profile track\");\n  if (m501.indexOf(\"No orbit.\") === -1) throw new Error(\"lab non-orbit row lost No orbit\");\n  if (!m067 || m067.indexOf(\"never a full circle\") === -1) throw new Error(\"PBVita-Lab-067 profile line is still chopped\");\nreturn out;\n";
const wellJs = "var LAB = false;\nvar EXPECT = 601;\nvar LOCK = \"CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable. \";\nvar CONTINUITY = \"Keep the same setting, materials, and lighting already in the still. Every background object already in frame stays solid and visible. Nothing fades in, fades out, appears, or disappears.\";\nvar items = $input.all();\nvar out = [];\nfor (var i = 0; i < items.length; i++) {\n  var row = items[i].json || {};\n  var cid = String(row.creation_id || \"\").replace(/\\s+/g, \" \").trim();\n  if (!cid) throw new Error(\"row missing creation_id\");\n  var move = String(row.camera_move || \"\").replace(/\\s+/g, \" \").trim();\n  var family = String(row.shot_family || \"\").replace(/\\s+/g, \" \").trim();\n  var angle = String(row.camera_angle || \"\").replace(/\\s+/g, \" \").trim();\n  var direction = String(row.camera_direction || \"\").replace(/\\s+/g, \" \").trim();\n  if (!move) throw new Error(cid + \" empty camera_move\");\n  if (!family) throw new Error(cid + \" empty shot_family\");\n  if (!angle) throw new Error(cid + \" empty camera_angle\");\n  if (!direction) throw new Error(cid + \" empty camera_direction\");\n  var motion = String(row.video_motion_prompt || \"\");\n  var found = [];\n  var labelRe = /Keep label '([^']*)' unchanged/g;\n  var match;\n  while ((match = labelRe.exec(motion)) !== null) found.push(match[1]);\n  if (found.length !== 1 || !String(found[0]).replace(/\\s+/g, \" \").trim()) {\n    throw new Error(cid + \" motion prompt needs exactly one Keep label quote\");\n  }\n  var printed = found[0];\n  var noOrbit = \"\";\n  if (LAB && !/\\borbit\\b/i.test(move)) noOrbit = \"No orbit. \";\n  var nxt = LOCK +\n    \"Slow cinematic camera: \" + move + \". \" +\n    \"Shot \" + family + \", angle \" + angle + \", direction \" + direction + \". \" +\n    CONTINUITY + \" \" +\n    noOrbit +\n    \"No people, hands, faces, or burn-in. \" +\n    \"Keep label '\" + printed + \"' unchanged if visible, once only.\";\n  if (nxt.indexOf(\"No new objects\") !== -1 || nxt.indexOf(\"laboratory research scene\") !== -1) {\n    throw new Error(cid + \" fade sentence survived\");\n  }\n  if (nxt.indexOf(\"needles\") !== -1) throw new Error(cid + \" needles leaked back into motion\");\n  if (nxt.indexOf(LOCK) !== 0) throw new Error(cid + \" CAMERA LOCK missing\");\n  if (nxt.indexOf(CONTINUITY) === -1) throw new Error(cid + \" continuity sentence missing\");\n  out.push({ json: { creation_id: cid, video_motion_prompt: nxt } });\n}\nif (out.length !== EXPECT) throw new Error(\"expected \" + EXPECT + \" rows, got \" + out.length);\n  var w501 = \"\";\n  for (var s = 0; s < out.length; s++) {\n    if (out[s].json.creation_id === \"LI-501\") w501 = out[s].json.video_motion_prompt;\n    if (out[s].json.video_motion_prompt.indexOf(\"No orbit.\") !== -1) {\n      throw new Error(out[s].json.creation_id + \" wellness motion should not say No orbit\");\n    }\n  }\n  if (!w501 || w501.indexOf(\"unique recipe LI-501\") === -1 || w501.indexOf(\"LI-028\") !== -1) {\n    throw new Error(\"LI-501 motion still names the donor recipe\");\n  }\nreturn out;\n";

const howto = sticky({
  config: {
    name: 'motion_continuity_howto',
    parameters: {
      color: 4,
      width: 920,
      height: 300,
      content: '# repair_i2v_motion_continuity (unpublished) Rewrites video_motion_prompt only on Sheet 9 (535) and the wellness tab (601). Background objects already in the still stay solid. Camera path comes from each row. Does not touch video_prompt. Do not Publish. Do not run vid-gen.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 336] },
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
    output: [{
      creation_id: 'PBVita-Lab-501',
      camera_move: 'measured crane-down from high front to settled hero',
      shot_family: 'crane_settle',
      camera_angle: 'high side to three-quarter',
      camera_direction: 'crane down',
      video_motion_prompt: "Keep label 'Semax' unchanged",
    }],
  },
});

const mapLab = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'map_lab_rows',
    position: [448, 144],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: labJs,
    },
    output: [{
      creation_id: 'PBVita-Lab-501',
      video_motion_prompt: 'CAMERA LOCK: the vial never moves. Slow cinematic camera: measured crane-down. Shot crane_settle. Nothing fades in, fades out, appears, or disappears.',
    }],
  },
});

const labBatches = splitInBatches({
  version: 3,
  config: { name: 'lab_batches', position: [672, 144], parameters: { batchSize: 25 } },
});

const writeLab = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'write_lab_9',
    position: [896, 192],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
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
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['creation_id'],
        value: {
          creation_id: expr('{{ $json.creation_id }}'),
          video_motion_prompt: expr('{{ $json.video_motion_prompt }}'),
        },
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW' },
    },
    output: [{ creation_id: 'PBVita-Lab-501', video_motion_prompt: 'CAMERA LOCK' }],
  },
});

const labDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'lab_done', position: [896, 0] },
});

const readWellness = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'read_wellness_500',
    position: [224, 528],
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
    output: [{
      creation_id: 'LI-501',
      camera_move: 'glacial clockwise orbit around the hero, unique recipe LI-501',
      shot_family: 'vial_landscape',
      camera_angle: 'eye-level',
      camera_direction: 'around',
      video_motion_prompt: "Keep label 'Semax' unchanged",
    }],
  },
});

const mapWellness = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'map_wellness_rows',
    position: [448, 528],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: wellJs,
    },
    output: [{
      creation_id: 'LI-501',
      video_motion_prompt: 'CAMERA LOCK: the vial never moves. Slow cinematic camera: unique recipe LI-501. Nothing fades in, fades out, appears, or disappears.',
    }],
  },
});

const wellnessBatches = splitInBatches({
  version: 3,
  config: { name: 'wellness_batches', position: [672, 528], parameters: { batchSize: 25 } },
});

const writeWellness = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'write_wellness_500',
    position: [896, 576],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
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
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['creation_id'],
        value: {
          creation_id: expr('{{ $json.creation_id }}'),
          video_motion_prompt: expr('{{ $json.video_motion_prompt }}'),
        },
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW' },
    },
    output: [{ creation_id: 'LI-501', video_motion_prompt: 'CAMERA LOCK' }],
  },
});

const wellnessDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'wellness_done', position: [896, 384] },
});

export default workflow('repair_i2v_motion_continuity', 'repair_i2v_motion_continuity')
  .add(howto)
  .add(startTrigger)
  .to(
    readLab.to(
      mapLab.to(labBatches.onDone(labDone).onEachBatch(writeLab.to(nextBatch(labBatches))))
    )
  )
  .add(startTrigger)
  .to(
    readWellness.to(
      mapWellness.to(
        wellnessBatches.onDone(wellnessDone).onEachBatch(writeWellness.to(nextBatch(wellnessBatches)))
      )
    )
  );
