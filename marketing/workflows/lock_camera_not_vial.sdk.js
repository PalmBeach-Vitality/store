import { workflow, node, trigger, sticky, newCredential, expr, splitInBatches, nextBatch } from '@n8n/workflow-sdk';

const mapperJs =
  'var OLD = "CAP LOCK: One solid bright blue cap, seated and frozen. The cap stays closed. Camera may move; the cap does not. ";\n' +
  'var NEW = "CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable. ";\n' +
  'var out = [];\n' +
  'var items = $input.all();\n' +
  'for (var i = 0; i < items.length; i++) {\n' +
  '  var row = items[i].json || {};\n' +
  '  var id = String(row.creation_id || "").trim();\n' +
  '  if (!id) continue;\n' +
  '  var motion = String(row.video_motion_prompt || "");\n' +
  '  if (motion.indexOf(NEW) === 0) continue;\n' +
  '  if (motion.indexOf(OLD) !== 0) {\n' +
  '    throw new Error(id + " unexpected video_motion_prompt prefix: " + motion.slice(0, 80));\n' +
  '  }\n' +
  '  out.push({ json: { creation_id: id, video_motion_prompt: NEW + motion.slice(OLD.length) } });\n' +
  '}\n' +
  'if (!out.length) {\n' +
  '  throw new Error("no rows to write (already CAMERA LOCK, or live tab motion prefix changed)");\n' +
  '}\n' +
  'return out;\n';

const howto = sticky({
  config: {
    name: 'lock_camera_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 280,
      content:
        '# lock_camera_not_vial (unpublished) Writes video_motion_prompt CAMERA LOCK on every lab + wellness row. Vial planted. Camera travels. Cap seated. No turntable. Does not touch video_prompt / helix / pens. Do not Publish. Do not run vid-gen.',
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
    output: [{ creation_id: 'PBVita-Lab-001', video_motion_prompt: 'CAP LOCK: One solid bright blue cap, seated and frozen. The cap stays closed. Camera may move; the cap does not. Slow cinematic camera: push-in.' }],
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
      jsCode: mapperJs,
    },
    output: [{ creation_id: 'PBVita-Lab-001', video_motion_prompt: 'CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable. Slow cinematic camera: push-in.' }],
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
    output: [{ creation_id: 'PBVita-Lab-001', video_motion_prompt: 'CAMERA LOCK' }],
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
    output: [{ creation_id: 'LI-016', video_motion_prompt: 'CAP LOCK: One solid bright blue cap, seated and frozen. The cap stays closed. Camera may move; the cap does not. Slow cinematic camera: truck right.' }],
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
      jsCode: mapperJs,
    },
    output: [{ creation_id: 'LI-016', video_motion_prompt: 'CAMERA LOCK: the vial never moves. It stays planted on its base, upright and still. If anything travels, it is the camera, not the bottle. Cap stays seated and closed. FORBIDDEN: vial sliding, spinning, rolling, floating, or turning like a turntable. Slow cinematic camera: truck right.' }],
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
    output: [{ creation_id: 'LI-016', video_motion_prompt: 'CAMERA LOCK' }],
  },
});

const wellnessDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'wellness_done', position: [896, 384] },
});

export default workflow('lock_camera_not_vial', 'lock_camera_not_vial')
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
