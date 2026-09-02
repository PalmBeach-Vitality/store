import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'manual_trigger',
    position: [0, 304],
    output: [{ ok: true }],
  },
});

const getImageScenes = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_image_scenes',
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1O7jqmmq8ysf41QzquHuhHxTIJPW47kgBCXyA37z3FLs',
        cachedResultName: '3-image-scenes-150',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '853830068',
        cachedResultName: '3-image-scenes-150',
      },
      options: {},
    },
    position: [240, 304],
    output: [{ scene_id: 'SCN-001', aspect_ratio: '' }],
  },
});

const overlayIgAspect = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_ig_aspect',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        "var rows = $input.all().map(function (i) { return i.json; });\n" +
        "if (!rows.length) throw new Error('overlay_ig_aspect: no rows from 3-image-scenes-150');\n" +
        "return rows.map(function (r) {\n" +
        "  var sceneId = String(r.scene_id || '').trim();\n" +
        "  if (!sceneId) return null;\n" +
        "  return { json: { scene_id: sceneId, aspect_ratio: '3:4' } };\n" +
        "}).filter(Boolean);\n",
    },
    position: [496, 304],
    output: [{ scene_id: 'SCN-001', aspect_ratio: '3:4' }],
  },
});

const sheetsUpdateAspect = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_aspect',
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1O7jqmmq8ysf41QzquHuhHxTIJPW47kgBCXyA37z3FLs',
        cachedResultName: '3-image-scenes-150',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '853830068',
        cachedResultName: '3-image-scenes-150',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['scene_id'],
        value: {
          scene_id: expr('{{ $json.scene_id }}'),
          aspect_ratio: expr('{{ $json.aspect_ratio }}'),
        },
        schema: [
          {
            id: 'scene_id',
            displayName: 'scene_id',
            required: true,
            defaultMatch: true,
            display: true,
            type: 'string',
            canBeUsedToMatch: true,
          },
          {
            id: 'aspect_ratio',
            displayName: 'aspect_ratio',
            required: false,
            defaultMatch: false,
            display: true,
            type: 'string',
            canBeUsedToMatch: false,
          },
        ],
      },
      options: { handlingExtraData: 'insertInNewColumn' },
    },
    position: [752, 304],
    output: [{ scene_id: 'SCN-001', aspect_ratio: '3:4' }],
  },
});

export default workflow('overlay_image_scenes_ig_aspect', 'overlay_image_scenes_ig_aspect')
  .add(manualTrigger)
  .to(getImageScenes)
  .to(overlayIgAspect)
  .to(sheetsUpdateAspect);
