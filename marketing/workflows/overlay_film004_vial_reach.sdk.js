import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 360,
      content: '# overlay_film004_vial_reach (unpublished)\n# FILM-004 only. Empty-hand reach toward FILM-016 alien. NO VIAL. Veo-safe over-shoulder.\n# Does not touch FILM-001. Do not Publish.',
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
      jsCode: "// n8n Code node: overlay_film004_vial_reach\n// Workflow: overlay_film004_vial_reach (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_film004\n//\n// FILM-004 only. Does not touch FILM-001.\n// Empty-hand reach toward the FILM-016 alien. NO VIAL (grab is FILM-023).\n// Over-the-shoulder / side frame so Veo 3.1 does not see a face-on portrait.\n\nfunction squeeze(s) {\n  var t = String(s || '');\n  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');\n  return t.trim();\n}\n\nfunction capPrompt(s) {\n  s = squeeze(s);\n  if (s.length > 7900) s = s.slice(0, 7900);\n  return s;\n}\n\nvar BRANCH = 'cursor/film004-vial-reach-4c4b';\nvar REACH_STILL =\n  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +\n  BRANCH +\n  '/marketing/stills/film004-reach-empty-hand.jpeg';\n\nvar still_edit_prompt = capPrompt(\n  'Keep this same woman, same navy flight suit, same circular Palm Beach patch, same golden-blonde low ponytail, same left-wrist square gunmetal device with the square amber-orange screen. Keep this same FILM-014 dusk coast. Keep the empty reach. Her right arm stays out, open right hand empty. Nothing in the hand. Nothing beyond the fingertips. No vial, no bottle, no glass, no cap, no label. Remove any vial if one appears. She is reaching toward the FILM-016 alien, not toward the camera. Put that alien in front of her in the scene: tall, slender, iridescent pearl-white skin with a soft opal sheen, large kind amber eyes, calm friendly face, simple flowing gray-silver robe. The alien’s hands are empty. Do not keep the front-view portrait. Do not keep her facing the lens. Do not keep the hand reaching at the camera. Move the camera behind her right shoulder, slightly to the side, so we see the back and side of her head and the reach going away from us toward the alien. Mid-thigh two-shot. Her face stays small in the frame, in profile, slightly soft. Sharp focus on the empty right hand. Eyes on the alien, never on the lens. Left hand, palm, fingers, and thumb stay visible past the left-wrist device. Two arms, two hands on her. No gloves. Do not change her face into someone else.'\n);\n\nvar still_prompt = capPrompt(\n  '9:16 mid-thigh two-shot, camera behind the astronaut’s right shoulder. Late-20s blonde woman in a navy flight suit with a small circular Palm Beach suit patch, golden-blonde hair in a low ponytail, square gunmetal computer on the left wrist with a square amber-orange screen. She reaches her empty right hand toward a tall slender FILM-016 alien: iridescent pearl-white skin, soft opal sheen, large kind amber eyes, simple flowing gray-silver robe, empty hands. We see the back and side of her head, face small and in profile, slightly soft. Sharp on the empty right hand. Eyes on the alien. FILM-014 dusk coast behind them. No vial. Photoreal cinematic sci-fi commercial still, 8k, HDR. No logos, no captions, no watermarks.'\n);\n\nvar video_motion_prompt =\n  '6-second clip, camera locked on this same over-the-shoulder two-shot. Same astronaut, same alien, same empty reach. Soft coastal wind in hair and robe. Eyes stay on the alien. Empty right hand holds the reach. No vial. No lock-eyes. No walk at the camera. Twin moons hold. Silent.';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film004_vial_reach: no rows from get_film_stills.');\n}\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (stillId !== 'FILM-004') continue;\n  out.push({\n    json: {\n      still_id: stillId,\n      picked_url: REACH_STILL,\n      still_prompt: still_prompt,\n      still_edit_prompt: still_edit_prompt,\n      video_motion_prompt: video_motion_prompt,\n      video_url: '',\n      n: '3',\n      video_provider: 'veo',\n      model_video: 'fal-ai/veo3.1/image-to-video',\n      duration_seconds: '6',\n      video_resolution: '1080p',\n      video_aspect_ratio: '9:16',\n      audio: 'false',\n      wait_seconds: '240',\n      video_start_url: 'https://fal.run/fal-ai/veo3.1/image-to-video',\n    },\n  });\n}\n\nif (out.length !== 1) {\n  throw new Error('overlay_film004_vial_reach: expected FILM-004, wrote ' + out.length);\n}\n\nreturn out;\n",
    },
    output: [{
      still_id: 'FILM-004',
      picked_url: 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film004-vial-reach-4c4b/marketing/stills/film004-reach-empty-hand.jpeg',
      still_prompt: '9:16 mid-thigh two-shot, camera behind the astronaut’s right shoulder.',
      still_edit_prompt: 'Keep the empty reach. Over-the-shoulder toward the FILM-016 alien. NO VIAL.',
      video_motion_prompt: '6-second clip, camera locked on this same over-the-shoulder two-shot. Eyes stay on the alien. No vial. Silent.',
      video_url: '',
      n: '3',
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
