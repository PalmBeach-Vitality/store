import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'overlay_howto',
    parameters: {
      color: 4,
      width: 860,
      height: 420,
      content:
        '# overlay_film_beach_entry (unpublished)\n' +
        '# Writes FILM-001/004 beach + FILM-020 atmospheric-entry prompts onto Sheet 18.\n' +
        '# Clears video_url. Does not touch picked_url. Do not Publish.',
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
    output: [{ still_id: 'FILM-001' }],
  },
});

const overlayBeach = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'overlay_film_beach_entry',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: overlay_film_beach_entry\n// Workflow: overlay_film_beach_entry (one-shot, unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: sheets_update_beach\n//\n// FILM-001 / FILM-004 were never remade on the FILM-014 beach (gray studio).\n// FILM-020 is a beach plunge, not space \u2192 high-speed atmospheric burn-up.\n// Writes still_prompt + still_edit_prompt + video_motion_prompt and clears\n// video_url so I2V re-runs after the still edit. Does not touch picked_url,\n// reel_id, clip_order, or seam_mode.\n\nfunction squeeze(s) {\n  var t = String(s || '');\n  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');\n  return t.trim();\n}\n\nfunction capPrompt(s) {\n  s = squeeze(s);\n  if (s.length > 7900) s = s.slice(0, 7900);\n  return s;\n}\n\nvar BEACH =\n  'Alien-galaxy luxury coast \u2014 same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.';\n\nvar IDENTITY =\n  'Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES \u2014 not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only \u2014 never the right hand, never a disembodied prop. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the left wrist like a thick rectangular smart-computer box \u2014 never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers.';\n\nvar SHIP =\n  'A MUCH LARGER sleek stealth interceptor, capital-scout scale: elongated arrowhead wedge silhouette, needle nose flaring into a broad blended-wing rear, dark matte charcoal gunmetal plating with dense panel lines and greebles. The faceted cockpit canopy is tiny relative to the hull so the ship reads as a long vessel, not a toy, not a one-person fighter, not a white luxury shuttle. Thin cyan-blue energy strips run along the sides and dorsal spine. Twin circular rear engine nozzles with a cool blue inner glow. One subtle thin navy-and-gold identity stripe on the upper hull. No readable hull text.';\n\nvar PATCHES = {\n  'FILM-001': {\n    still_prompt: capPrompt(\n      'Identity portrait, front view, head and shoulders, on the FILM-014 alien-galaxy luxury coast. ' +\n        IDENTITY +\n        ' Helmet off, natural confident expression. Background is the FILM-014 coast only \u2014 not a gray studio, not Earth, not Florida. ' +\n        BEACH +\n        ' Cinematic key light from the twin moons. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.'\n    ),\n    still_edit_prompt: capPrompt(\n      'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, pose, and the rectangular square gunmetal left-wrist computer. Square housing, square amber-orange screen, square or rectangular side buttons. NO ROUND SHAPES \u2014 not a round watch, not a curved CRT, not rotary knobs. ALWAYS on her left hand / left wrist, never the right hand. Left palm, fingers, and thumb stay fully visible past the strap. REPLACE the gray studio backdrop only. Put her on the FILM-014 alien-galaxy luxury coast: ' +\n        BEACH +\n        ' She stays head-and-shoulders, helmet off. Do not change her face. Do not change the wrist device. No extra people.'\n    ),\n    video_motion_prompt:\n      'Slow cinematic push-in on her face. Hair and suit catch a soft alien-beach wind. Twin oversized moons and bioluminescent teal-violet trees hold in the background. Amber wrist-screen holds steady. Silent. Lock this exact portrait.',\n  },\n  'FILM-004': {\n    still_prompt: capPrompt(\n      'Full-body still, standing relaxed, head to boots visible, boots on the FILM-014 iridescent lilac-gold sand. ' +\n        IDENTITY +\n        ' Matching navy-and-gold trousers and white space boots, wrist computer clearly visible sitting on her left wrist with her left hand and fingers fully visible. Background is the FILM-014 coast only \u2014 not a gray studio, not Earth, not Florida. ' +\n        BEACH +\n        ' Cinematic key light from the twin moons. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.'\n    ),\n    still_edit_prompt: capPrompt(\n      'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, full-body pose, white space boots, and the rectangular square gunmetal left-wrist computer. Square housing, square amber-orange screen, square or rectangular side buttons. NO ROUND SHAPES \u2014 not a round watch, not a curved CRT, not rotary knobs. ALWAYS on her left hand / left wrist, never the right hand. Left palm, fingers, and thumb stay fully visible past the strap. REPLACE the gray studio backdrop only. Stand her on the FILM-014 alien-galaxy luxury coast: ' +\n        BEACH +\n        ' Boots on the iridescent lilac-gold sand. Twin moons and bioluminescent teal-violet trees behind her. Do not change her face. Do not change the wrist device. No extra people. Not a wreck. Not a crash.'\n    ),\n    video_motion_prompt:\n      'Slow full-body pull-back, boots to hair, on the iridescent lilac-gold shore. Suit fabric breathes. Twin moons behind her. Left-wrist square device stays locked. Silent.',\n  },\n  'FILM-020': {\n    still_prompt: capPrompt(\n      'Keyframe, 9:16 vertical. High-speed atmospheric entry into the new planet. The SAME sleek dark gunmetal arrowhead interceptor as FILM-010, nose-first, screaming down from space. Top of the frame is still black deep space and stars. Below, the curved limb of the FILM-014 alien-galaxy beach planet fills the lower frame. ' +\n        BEACH +\n        ' The ship is wrapped in a THICK orange-white plasma sheath, a hard bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks, glowing ionized air, sparks peeling off the leading edges. Lots of burn-up. Hull stays INTACT \u2014 only SLIGHTLY damaged, light scoring under the plasma. NOT breaking apart. NOT a wreck. NOT torn open. NOT major structural damage. ' +\n        SHIP +\n        ' High drama, spectacle. No wreckage debris. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text, no logos, no captions, no watermarks. NO people, NO hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props.'\n    ),\n    still_edit_prompt: capPrompt(\n      'Keep this exact charcoal gunmetal arrowhead interceptor hull: elongated wedge, tiny canopy, cyan-blue energy strips, twin circular blue engines, navy-and-gold stripe. Change the moment to high-speed atmospheric entry. Top of frame still deep space and stars. Below, the curved limb of the FILM-014 beach planet: ' +\n        BEACH +\n        ' Wrap the ship in a THICK orange-white plasma sheath, bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks. Lots of burn-up. Hull stays intact, light scoring only. Do not wreck the ship. Do not tear it open. No people.'\n    ),\n    video_motion_prompt:\n      'Start in deep space on the intact charcoal arrowhead interceptor. Then it dives at extreme speed toward the new FILM-014 beach planet. Atmosphere hits hard \u2014 thick orange-white plasma sheath, bow shock, long fire trail, heavy atmospheric burn-up. The alien coast grows fast in the lower frame: iridescent lilac-gold dunes, teal-violet trees, twin moons. Hull stays intact. Silent.',\n  },\n};\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('overlay_film_beach_entry: no rows from get_film_stills.');\n}\n\nvar seen = {};\nvar out = [];\nfor (var i = 0; i < rows.length; i++) {\n  var stillId = String((rows[i] || {}).still_id || '').trim();\n  var patch = PATCHES[stillId];\n  if (!patch) continue;\n  if (seen[stillId]) {\n    throw new Error('overlay_film_beach_entry: duplicate still_id ' + stillId);\n  }\n  seen[stillId] = 1;\n  out.push({\n    json: {\n      still_id: stillId,\n      still_prompt: patch.still_prompt,\n      still_edit_prompt: patch.still_edit_prompt,\n      video_motion_prompt: patch.video_motion_prompt,\n      video_url: '',\n    },\n  });\n}\n\nvar need = Object.keys(PATCHES);\nif (out.length !== need.length) {\n  throw new Error(\n    'overlay_film_beach_entry: expected ' +\n      need.join(',') +\n      ', wrote ' +\n      out.map(function (o) {\n        return o.json.still_id;\n      }).join(',')\n  );\n}\n\nreturn out;\n",
    },
    output: [{ still_id: 'FILM-001', video_url: '' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_beach',
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
        mappingMode: 'autoMapInputData',
        matchingColumns: ['still_id'],
        value: {},
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'still_prompt', displayName: 'still_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'still_edit_prompt', displayName: 'still_edit_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_motion_prompt', displayName: 'video_motion_prompt', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ still_id: 'FILM-001' }],
  },
});

export default workflow('overlay_film_beach_entry', 'overlay_film_beach_entry')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(overlayBeach)
  .to(sheetsUpdate);
