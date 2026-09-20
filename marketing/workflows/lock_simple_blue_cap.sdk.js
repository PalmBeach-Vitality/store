import { workflow, node, trigger, sticky, newCredential, expr, splitInBatches, nextBatch } from '@n8n/workflow-sdk';

const pairsJs =
  'var PAIRS = [' +
  '["plain bright blue plastic flip-off cap ONLY 94 percent of body width (smooth round flip-off — FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces).","simple uniform bright blue plastic cap ONLY 94 percent of body width (smooth round one-piece disc, no tabs — FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces)."],' +
  '["plain bright blue plastic flip-off cap ONLY (smooth round flip-off — FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces).","simple uniform bright blue plastic cap ONLY (smooth round one-piece disc, no tabs — FORBIDDEN: tabs, wings, pull-tabs, tear-tabs, side flaps, hanging pieces)."],' +
  '["a flat royal-blue plastic flip-off cap, a plain smooth disc about 94% of the body width","a simple uniform royal-blue plastic cap, a plain smooth disc about 94% of the body width"],' +
  '["a flat royal-blue plastic flip-off cap, a plain smooth disc about 95% of the body width","a simple uniform royal-blue plastic cap, a plain smooth disc about 95% of the body width"],' +
  '["SEATED CAP LOCK: blue flip-off cap stays fully seated on the silver crimp; never pop off.","SEATED CAP LOCK: simple uniform blue cap stays fully seated on the silver crimp; never pop off."],' +
  '["bright blue flip-off cap","simple uniform bright blue cap"]' +
  '];\\n';

const applyFnJs =
  'function applyText(text) {' +
  '  var out = String(text || "");' +
  '  for (var p = 0; p < PAIRS.length; p++) { out = out.split(PAIRS[p][0]).join(PAIRS[p][1]); }' +
  '  return out;' +
  '}\\n';

const labMapperJs =
  pairsJs +
  applyFnJs +
  'var FIELDS = ["lab_item","material_detail","hero_style","still_edit_prompt","video_prompt"];\\n' +
  'var out = [];\\n' +
  'var items = $input.all();\\n' +
  'for (var i = 0; i < items.length; i++) {\\n' +
  '  var row = items[i].json || {};\\n' +
  '  var id = String(row.creation_id || "").trim();\\n' +
  '  if (!id) continue;\\n' +
  '  var next = { creation_id: id };\\n' +
  '  var blob = "";\\n' +
  '  for (var f = 0; f < FIELDS.length; f++) {\\n' +
  '    var key = FIELDS[f];\\n' +
  '    var patched = applyText(row[key] || "");\\n' +
  '    next[key] = patched;\\n' +
  '    blob += " " + patched;\\n' +
  '  }\\n' +
  '  if (blob.toLowerCase().indexOf("flip-off") !== -1) throw new Error(id + " leftover flip-off");\\n' +
  '  if (blob.indexOf("simple uniform") === -1) throw new Error(id + " missing simple uniform cap");\\n' +
  '  out.push({ json: next });\\n' +
  '}\\n' +
  'if (!out.length) throw new Error("no lab rows to write");\\n' +
  'return out;\\n';

const wellnessMapperJs =
  pairsJs +
  applyFnJs +
  'var FIELDS = ["material_detail","hero_style","video_prompt"];\\n' +
  'var out = [];\\n' +
  'var items = $input.all();\\n' +
  'for (var i = 0; i < items.length; i++) {\\n' +
  '  var row = items[i].json || {};\\n' +
  '  var id = String(row.creation_id || "").trim();\\n' +
  '  if (!id) continue;\\n' +
  '  var next = { creation_id: id };\\n' +
  '  var blob = "";\\n' +
  '  for (var f = 0; f < FIELDS.length; f++) {\\n' +
  '    var key = FIELDS[f];\\n' +
  '    var patched = applyText(row[key] || "");\\n' +
  '    next[key] = patched;\\n' +
  '    blob += " " + patched;\\n' +
  '  }\\n' +
  '  if (blob.toLowerCase().indexOf("flip-off") !== -1) throw new Error(id + " leftover flip-off");\\n' +
  '  if (blob.indexOf("simple uniform") === -1) throw new Error(id + " missing simple uniform cap");\\n' +
  '  out.push({ json: next });\\n' +
  '}\\n' +
  'if (!out.length) throw new Error("no wellness rows to write");\\n' +
  'return out;\\n';

const howto = sticky({
  config: {
    name: 'lock_simple_blue_cap_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 280,
      content:
        '# lock_simple_blue_cap (unpublished) Writes a simple uniform blue cap (no tabs, no flip-off) onto lab + wellness still/video prompts. Does not touch video_motion_prompt / helix / pens. Do not Publish. Do not run vid-gen.',
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
    output: [{ creation_id: 'PBVita-Lab-001', lab_item: 'flip-off cap', material_detail: 'flip-off cap', hero_style: 'flip-off cap', still_edit_prompt: 'flip-off cap', video_prompt: 'flat royal-blue plastic flip-off cap' }],
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
      jsCode: labMapperJs,
    },
    output: [{ creation_id: 'PBVita-Lab-001', lab_item: 'simple uniform', material_detail: 'simple uniform', hero_style: 'simple uniform', still_edit_prompt: 'simple uniform', video_prompt: 'simple uniform royal-blue plastic cap' }],
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
          lab_item: expr('{{ $json.lab_item }}'),
          material_detail: expr('{{ $json.material_detail }}'),
          hero_style: expr('{{ $json.hero_style }}'),
          still_edit_prompt: expr('{{ $json.still_edit_prompt }}'),
          video_prompt: expr('{{ $json.video_prompt }}'),
        },
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'lab_item', displayName: 'lab_item', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'material_detail', displayName: 'material_detail', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'hero_style', displayName: 'hero_style', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'still_edit_prompt', displayName: 'still_edit_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_prompt', displayName: 'video_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW' },
    },
    output: [{ creation_id: 'PBVita-Lab-001', video_prompt: 'simple uniform' }],
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
    output: [{ creation_id: 'LI-016', material_detail: 'flip-off cap', hero_style: 'flip-off cap', video_prompt: 'flat royal-blue plastic flip-off cap' }],
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
      jsCode: wellnessMapperJs,
    },
    output: [{ creation_id: 'LI-016', material_detail: 'simple uniform', hero_style: 'simple uniform', video_prompt: 'simple uniform royal-blue plastic cap' }],
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
          material_detail: expr('{{ $json.material_detail }}'),
          hero_style: expr('{{ $json.hero_style }}'),
          video_prompt: expr('{{ $json.video_prompt }}'),
        },
        schema: [
          { id: 'creation_id', displayName: 'creation_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'material_detail', displayName: 'material_detail', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'hero_style', displayName: 'hero_style', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_prompt', displayName: 'video_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'RAW' },
    },
    output: [{ creation_id: 'LI-016', video_prompt: 'simple uniform' }],
  },
});

const wellnessDone = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'wellness_done', position: [896, 384] },
});

export default workflow('lock_simple_blue_cap', 'lock_simple_blue_cap')
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
