import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 360,
      content: '# overlay_film004_vial_reach (unpublished)\n# FILM-004 only. Writes old FILM-001 reach still + alien-beach vial-grab prompts.\n# Does not touch FILM-001. Do not Publish.',
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
      jsCode: "// n8n Code node: overlay_film004_vial_reach\n// Workflow: overlay_film004_vial_reach (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_film004\n//\n// FILM-004 only. Does not touch FILM-001 (keep the Kling clip).\n// Writes the old FILM-001 beach-reach pose onto the FILM-014 coast.\n// The still is BEFORE she has the vial: empty reaching right hand. NO VIAL.\n\nfunction squeeze(s) {\n  var t = String(s || '');\n  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');\n  return t.trim();\n}\n\nfunction capPrompt(s) {\n  s = squeeze(s);\n  if (s.length > 7900) s = s.slice(0, 7900);\n  return s;\n}\n\nvar BRANCH = 'cursor/film004-vial-reach-4c4b';\nvar REACH_STILL =\n  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +\n  BRANCH +\n  '/marketing/stills/film001-beach-reach.png';\n\nvar BEACH =\n  'Alien-galaxy luxury coast \u2014 same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.';\n\nvar IDENTITY =\n  'Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES \u2014 not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only \u2014 never the right hand, never a disembodied prop. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the left wrist like a thick rectangular smart-computer box \u2014 never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers.';\n\nvar still_prompt = capPrompt(\n  'Exact same scene as the old FILM-001 beach-reach still: 9:16 medium-close, late-20s blonde astronaut facing camera, RIGHT arm stretched toward the lens, EMPTY open right hand in the near foreground reaching outward. This is BEFORE she has the vial. NO VIAL anywhere. No bottle, no glass, no cap, no label, nothing in her hand, nothing just beyond her fingertips. Shallow DOF \u2014 reaching right hand slightly soft, face and suit sharp. ' +\n    IDENTITY +\n    ' Square gunmetal computer stays on her LEFT wrist \u2014 never a sports watch. Background is the FILM-014 alien-galaxy luxury coast only \u2014 not Earth royal palms, not an orange sunset, not a gray studio. ' +\n    BEACH +\n    ' Cinematic twin-moon key light. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text except the wrist-device screen. No logos, no captions, no watermarks, no extra people. NO VIAL.'\n);\n\nvar still_edit_prompt = capPrompt(\n  'Keep this exact reach pose from old FILM-001: she faces camera, RIGHT arm stretched toward the lens, EMPTY open right hand in the near foreground reaching outward. This still is BEFORE she has the vial. Do NOT add a vial. Do NOT put anything in her hand. Remove any vial, bottle, glass, cap, or label if one appears. Keep her face, hair, eyes, navy-and-gold flight suit, and Palm Beach chest patch. REPLACE the sports watch with the rectangular square gunmetal LEFT-wrist computer \u2014 square amber-orange screen, square side buttons, left palm and fingers visible. REPLACE the Earth-palm / orange-sunset beach with the FILM-014 alien-galaxy luxury coast: ' +\n    BEACH +\n    ' Empty reaching right hand only. NO VIAL. Do not change her face. No extra people.'\n);\n\nvar video_motion_prompt =\n  'She reaches her empty right hand outward toward camera. Soft alien-beach wind. Twin moons and teal-violet trees hold. No vial in the opening frame. Left-wrist square computer locked. Silent.';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film004_vial_reach: no rows from get_film_stills.');\n}\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (stillId !== 'FILM-004') continue;\n  out.push({\n    json: {\n      still_id: stillId,\n      picked_url: REACH_STILL,\n      still_prompt: still_prompt,\n      still_edit_prompt: still_edit_prompt,\n      video_motion_prompt: video_motion_prompt,\n      video_url: '',\n      n: '1',\n      video_provider: 'kling',\n      model_video: 'kwaivgi/kling-v3.0-pro',\n      duration_seconds: '8',\n      video_resolution: '720p',\n      video_aspect_ratio: '9:16',\n      audio: 'false',\n      wait_seconds: '180',\n      video_start_url: 'https://openrouter.ai/api/v1/videos',\n    },\n  });\n}\n\nif (out.length !== 1) {\n  throw new Error('overlay_film004_vial_reach: expected FILM-004, wrote ' + out.length);\n}\n\nreturn out;\n",
    },
    output: [{
      still_id: 'FILM-004',
      picked_url: 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film004-vial-reach-4c4b/marketing/stills/film001-beach-reach.png',
      still_prompt: 'Exact same scene as the old FILM-001 beach-reach still',
      still_edit_prompt: 'Keep this exact reach pose. EMPTY hand. NO VIAL.',
      video_motion_prompt: 'She reaches her right hand to the upright MOTS-C vial in the foreground and takes it. Soft alien-beach wind. Twin moons and teal-violet trees hold. Vial stays upright. Left-wrist square computer locked. Silent.',
      video_url: '',
      n: '1',
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
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
