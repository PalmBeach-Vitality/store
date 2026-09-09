import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 360,
      content: '# overlay_film020_space_still (unpublished)\\n# FILM-020 only. Writes SPACE reentry still + 6s 1080p Kling motion.\\n# Clears FILM-020 video_url for one I2V. Does not touch FILM-001 or FILM-004. Do not Publish.',
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
    output: [{ still_id: 'FILM-020' }],
  },
});

const overlayRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film020_space_still',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: overlay_film020_space_still\n// Workflow: overlay_film020_space_still (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_film020\n//\n// FILM-020 only. Writes SPACE reentry still + 6s 1080p Kling motion.\n// Clears FILM-020 video_url so one I2V can run. Does not touch FILM-001 or FILM-004.\n\nfunction squeeze(s) {\n  var t = String(s || '');\n  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');\n  return t.trim();\n}\n\nfunction capPrompt(s) {\n  s = squeeze(s);\n  if (s.length > 7900) s = s.slice(0, 7900);\n  return s;\n}\n\nvar BRANCH = 'cursor/film020-space-still-4c4b';\nvar SHIP_STILL =\n  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +\n  BRANCH +\n  '/marketing/stills/film020-space-reentry.jpeg';\n\nvar SHIP =\n  'EXACT same interceptor as FILM-009 \u2014 copy this hull, do not invent a new ship. Elongated needle-arrowhead wedge, capital-scout scale, dark matte charcoal gunmetal plating with dense panel lines and greebles. Twin circular rear engine nacelles ONLY \u2014 two engines, never three \u2014 cool cyan-blue inner glow. Thin cyan-blue energy strips along the sides and dorsal spine. Narrow faceted cockpit canopy on the upper spine, tiny relative to the hull. One thin navy-and-gold identity stripe on the dorsal spine. No readable hull text. Not a toy, not a white shuttle, not a wreck.';\n\nvar SPACE =\n  'High-altitude atmospheric REENTRY from deep space. Top two-thirds of the frame is black outer space and stars. Twin oversized moons may hang far away as distant space bodies only. The ship is at orbital altitude, far above any surface. Below, ONLY a thin curved planetary limb with a glowing violet-magenta atmosphere band. No surface detail. No coastline. No beach. No sand. No dunes. No trees. No palms. No water. No shoreline. No ground. No landscape. Not a flyover. Not a landing.';\n\nvar still_prompt = capPrompt(\n  'Keyframe, 9:16 vertical. Atmospheric REENTRY from space, not the crash, not ground impact. The EXACT FILM-009 ship screams nose-first into the planet atmosphere. ' +\n    SHIP +\n    ' ' +\n    SPACE +\n    ' The ship is wrapped in a THICK orange-white plasma sheath, a hard bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks, glowing ionized air, sparks peeling off the leading edges. Lots of burn-up. Hull stays INTACT \u2014 light scoring under the plasma only. NOT breaking apart. NOT a wreck. NOT torn open. NOT the crash. NOT hitting the ground. High drama, spectacle. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text, no logos, no captions, no watermarks. NO people, NO hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props.'\n);\n\nvar still_edit_prompt = capPrompt(\n  'Keep this EXACT FILM-009 ship. Do not redesign it. Same needle-arrowhead charcoal gunmetal hull, same twin circular cyan engines (two only, never three), same thin cyan side strips, same tiny spine canopy, same thin navy-and-gold dorsal stripe, same three-quarter nose-down angle. Change ONLY the environment to high-altitude atmospheric REENTRY from deep space. ' +\n    SPACE +\n    ' Wrap THIS same ship in a THICK orange-white plasma sheath, bow shock, and a long roaring fire trail. Heavy incandescent streaks. Lots of burn-up. Hull stays intact, light scoring only. This is REENTRY from space, not the crash. Do not show ground. Do not show a beach. Do not show trees. Do not show sand. Do not show water. Do not wreck the ship. Do not add a third engine. Do not add people, vials, or text.'\n);\n\nvar video_motion_prompt =\n  'Exact FILM-009 interceptor on high-altitude atmospheric reentry from deep space. Starts in black space and stars, then dives into the atmosphere. Thick orange-white plasma sheath, bow shock, long fire trail. Twin cyan engines hold. Only a thin curved planetary limb with a violet-magenta atmosphere band grows below. No beach. No sand. No trees. No water. No ground. Hull stays intact. Not the crash. Not impact. Silent.';\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film020_space_still: no rows from get_film_stills.');\n}\n\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  if (stillId !== 'FILM-020') continue;\n  out.push({\n    json: {\n      still_id: stillId,\n      picked_url: SHIP_STILL,\n      still_prompt: still_prompt,\n      still_edit_prompt: still_edit_prompt,\n      video_motion_prompt: video_motion_prompt,\n      video_url: '',\n      n: '1',\n      video_provider: 'kling',\n      model_video: 'kwaivgi/kling-v3.0-pro',\n      duration_seconds: '6',\n      video_resolution: '1080p',\n      video_aspect_ratio: '9:16',\n      audio: 'false',\n      wait_seconds: '300',\n      video_start_url: 'https://openrouter.ai/api/v1/videos',\n    },\n  });\n}\n\nif (out.length !== 1) {\n  throw new Error('overlay_film020_space_still: expected FILM-020, wrote ' + out.length);\n}\n\nreturn out;\n",
    },
    output: [{
      still_id: 'FILM-020',
      picked_url: 'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film020-space-still-4c4b/marketing/stills/film020-space-reentry.jpeg',
      video_url: '',
      video_motion_prompt: 'Exact FILM-009 interceptor on high-altitude atmospheric reentry from deep space. Silent.',
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
      duration_seconds: '6',
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
    name: 'sheets_update_film020',
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
    output: [{ still_id: 'FILM-020' }],
  },
});

export default workflow('overlay_film020_space_still', 'overlay_film020_space_still')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayRows)
  .to(sheetsUpdate);
