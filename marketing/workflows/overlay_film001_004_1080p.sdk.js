import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 360,
      content: '# overlay_film001_004_1080p (unpublished)\\n# FILM-001 + FILM-004 only. Writes keeper stills + 1080p Kling motion.\\n# Same exact scenes. Exact FILM-014 beach. Does not touch FILM-020. Do not Publish.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const getFilm = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    position: [240, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      options: {},
    },
    output: [{ still_id: 'FILM-001' }, { still_id: 'FILM-004' }],
  },
});

const overlayRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film001_004_1080p',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: overlay_film001_004_1080p\n// Workflow: overlay_film001_004_1080p (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_film001_004\n//\n// 1080p ONLY. Never write 720p.\n// FILM-001 + FILM-004 only. Does not touch FILM-020.\n// Same exact scenes. Exact FILM-014 beach. Clears those two video_url cells.\n\nvar BRANCH = 'cursor/film001-004-1080p-4c4b';\nvar STILL_001 =\n  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +\n  BRANCH +\n  '/marketing/stills/film001-identity.png';\nvar STILL_004 =\n  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +\n  BRANCH +\n  '/marketing/stills/film004-reach-empty-hand.jpeg';\n\nvar MOTION_001 =\n  'Waist-up hold of the same late-20s blonde astronaut on the EXACT FILM-014 alien-galaxy coast. Soft wind in hair and navy-gold flight suit. Twin oversized moons and teal-violet glass-veined trees hold. Iridescent lilac-gold dunes and turquoise water with a golden sheen stay. Square gunmetal wrist computer stays in frame, amber screen steady. Camera holds waist-up. Same exact scene. Silent.';\n\nvar MOTION_004 =\n  'Same exact reach: she extends her empty right hand toward camera. Soft wind on the EXACT FILM-014 alien-galaxy coast. Twin moons, teal-violet trees, lilac-gold dunes, and turquoise gold-sheen water hold. No vial. Empty right hand only. Left-wrist square computer locked. Silent.';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film001_004_1080p: no rows from get_film_stills.');\n}\n\nvar wanted = {\n  'FILM-001': {\n    picked_url: STILL_001,\n    video_motion_prompt: MOTION_001,\n    duration_seconds: '8',\n  },\n  'FILM-004': {\n    picked_url: STILL_004,\n    video_motion_prompt: MOTION_004,\n    duration_seconds: '5',\n  },\n};\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (!wanted[stillId]) continue;\n  out.push({\n    json: {\n      still_id: stillId,\n      picked_url: wanted[stillId].picked_url,\n      video_url: '',\n      video_motion_prompt: wanted[stillId].video_motion_prompt,\n      video_provider: 'kling',\n      model_video: 'kwaivgi/kling-v3.0-pro',\n      duration_seconds: wanted[stillId].duration_seconds,\n      video_resolution: '1080p',\n      video_aspect_ratio: '9:16',\n      audio: 'false',\n      wait_seconds: '300',\n      video_start_url: 'https://openrouter.ai/api/v1/videos',\n    },\n  });\n}\n\nif (out.length !== 2) {\n  throw new Error(\n    'overlay_film001_004_1080p: expected FILM-001 and FILM-004, wrote ' + out.length\n  );\n}\n\nreturn out;\n",
    },
    output: [{
      still_id: 'FILM-001',
      picked_url: 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film001-004-1080p-4c4b/marketing/stills/film001-identity.png',
      video_url: '',
      video_motion_prompt: 'Waist-up hold on the EXACT FILM-014 coast. Silent.',
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
      duration_seconds: '8',
      video_resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: 'false',
      wait_seconds: '300',
      video_start_url: 'https://openrouter.ai/api/v1/videos',
    }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_film001_004',
    position: [752, 304],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['still_id'],
        value: {
          still_id: expr('{{ $json.still_id }}'),
          picked_url: expr('{{ $json.picked_url }}'),
          video_url: expr('{{ $json.video_url }}'),
          video_motion_prompt: expr('{{ $json.video_motion_prompt }}'),
          video_provider: expr('{{ $json.video_provider }}'),
          model_video: expr('{{ $json.model_video }}'),
          duration_seconds: expr('{{ $json.duration_seconds }}'),
          video_resolution: expr('{{ $json.video_resolution }}'),
          video_aspect_ratio: expr('{{ $json.video_aspect_ratio }}'),
          audio: expr('{{ $json.audio }}'),
          wait_seconds: expr('{{ $json.wait_seconds }}'),
          video_start_url: expr('{{ $json.video_start_url }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'picked_url', displayName: 'picked_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_provider', displayName: 'video_provider', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'model_video', displayName: 'model_video', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'duration_seconds', displayName: 'duration_seconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_resolution', displayName: 'video_resolution', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_aspect_ratio', displayName: 'video_aspect_ratio', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'audio', displayName: 'audio', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'wait_seconds', displayName: 'wait_seconds', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_start_url', displayName: 'video_start_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
  },
});

export default workflow('overlay_film001_004_1080p', 'overlay_film001_004_1080p')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayRows)
  .to(sheetsUpdate);
