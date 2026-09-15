import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 360,
      content: '# overlay_film004_vial_reach (unpublished)\n# FILM-004 only. Centered side-view empty reach. NO ALIEN. NO VIAL.\n# Does not touch FILM-001. Do not Publish.',
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
    output: [{ still_id: 'FILM-004' }],
  },
});

const overlayFilm004 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film004_vial_reach',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: overlay_film004_vial_reach\n// Workflow: overlay_film004_vial_reach (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_film004\n//\n// FILM-004 only. Does not touch FILM-001.\n// Centered true side view, empty-hand reach. NO ALIEN. NO VIAL (grab is FILM-023).\n\nfunction squeeze(s) {\n  var t = String(s || '');\n  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');\n  return t.trim();\n}\n\nfunction capPrompt(s) {\n  s = squeeze(s);\n  if (s.length > 7900) s = s.slice(0, 7900);\n  return s;\n}\n\nvar BRANCH = 'cursor/film004-vial-reach-4c4b';\nvar REACH_STILL =\n  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +\n  BRANCH +\n  '/marketing/stills/film004-reach-empty-hand.jpeg';\n\nvar still_edit_prompt = capPrompt(\n  'Keep this same woman, same navy flight suit, same circular Palm Beach patch, same golden-blonde low ponytail, same left-wrist square gunmetal device with the square amber-orange screen. Keep this same FILM-014 dusk coast. True side view. She is the only person in the frame. Center her in the frame, mid-thigh, standing on the shore. Her right arm reaches out along the frame, empty open right hand. Nothing in the hand. Nothing beyond the fingertips. No vial, no bottle, no glass, no cap, no label. Do not add an alien. Do not add a second person. Do not add a second figure. Remove any alien or extra person if one appears. Do not keep the front-view portrait. Do not keep her facing the lens. Do not keep the hand reaching at the camera. Camera is on her side so we see a clean profile: ear, cheek, ponytail, the reach going left or right in the frame. Eyes look along the reach, never at the lens. Face stays small. Sharp focus on the empty right hand. Left hand, palm, fingers, and thumb stay visible past the left-wrist device. Two arms, two hands. No gloves. Do not change her face into someone else.'\n);\n\nvar still_prompt = capPrompt(\n  '9:16 mid-thigh still, one late-20s blonde woman centered in a true side profile on the FILM-014 dusk coast. Navy flight suit, circular Palm Beach suit patch, golden-blonde low ponytail, square gunmetal computer on the left wrist with a square amber-orange screen. Right arm reaches along the frame, empty open right hand. Eyes look along the reach. No other person. No alien. No vial. Photoreal cinematic sci-fi commercial still, 8k, HDR. No logos, no captions, no watermarks.'\n);\n\nvar video_motion_prompt =\n  '6-second clip, camera locked on this same centered side-profile. Same astronaut, same empty reach. Soft coastal wind in hair and suit. Eyes stay along the reach. Empty right hand holds the reach. No other person. No vial. No lock-eyes. No walk at the camera. Twin moons hold. Silent.';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film004_vial_reach: no rows from get_film_stills.');\n}\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (stillId !== 'FILM-004') continue;\n  out.push({\n    json: {\n      still_id: stillId,\n      picked_url: REACH_STILL,\n      still_prompt: still_prompt,\n      still_edit_prompt: still_edit_prompt,\n      video_motion_prompt: video_motion_prompt,\n      video_url: '',\n      n: '1',\n      video_provider: 'veo',\n      model_video: 'fal-ai/veo3.1/image-to-video',\n      duration_seconds: '6',\n      video_resolution: '1080p',\n      video_aspect_ratio: '9:16',\n      audio: 'false',\n      wait_seconds: '240',\n      video_start_url: 'https://fal.run/fal-ai/veo3.1/image-to-video',\n    },\n  });\n}\n\nif (out.length !== 1) {\n  throw new Error('overlay_film004_vial_reach: expected FILM-004, wrote ' + out.length);\n}\n\nreturn out;\n",
    },
    output: [{
      still_id: 'FILM-004',
      picked_url: 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film004-vial-reach-4c4b/marketing/stills/film004-reach-empty-hand.jpeg',
      still_prompt: '9:16 mid-thigh still, one woman centered in true side profile. Empty reach. No alien.',
      still_edit_prompt: 'True side view. Centered. Empty reach. NO ALIEN. NO VIAL.',
      video_motion_prompt: '6-second clip, camera locked on this same centered side-profile. Empty reach. No other person. Silent.',
      video_url: '',
      n: '1',
      video_provider: 'veo',
      model_video: 'fal-ai/veo3.1/image-to-video',
    }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_film004',
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
          still_prompt: expr('{{ $json.still_prompt }}'),
          still_edit_prompt: expr('{{ $json.still_edit_prompt }}'),
          video_motion_prompt: expr('{{ $json.video_motion_prompt }}'),
          video_url: expr('{{ $json.video_url }}'),
          n: expr('{{ $json.n }}'),
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
          { id: 'still_prompt', displayName: 'still_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'still_edit_prompt', displayName: 'still_edit_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'n', displayName: 'n', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
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
    output: [{ still_id: 'FILM-004' }],
  },
});

export default workflow('overlay_film004_vial_reach', 'overlay_film004_vial_reach')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayFilm004)
  .to(sheetsUpdate);
