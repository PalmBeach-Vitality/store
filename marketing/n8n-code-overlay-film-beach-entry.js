// n8n Code node: overlay_film_beach_entry
// Workflow: overlay_film_beach_entry (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_beach
//
// FILM-001 / FILM-004 were never remade on the FILM-014 beach (gray studio).
// FILM-020 is a beach plunge, not space → high-speed atmospheric burn-up.
// Writes still_prompt + still_edit_prompt + video_motion_prompt and clears
// video_url so I2V re-runs after the still edit. Does not touch picked_url,
// reel_id, clip_order, or seam_mode.

function squeeze(s) {
  var t = String(s || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  return t.trim();
}

function capPrompt(s) {
  s = squeeze(s);
  if (s.length > 7900) s = s.slice(0, 7900);
  return s;
}

var BEACH =
  'Alien-galaxy luxury coast — same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.';

var IDENTITY =
  'Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES — not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only — never the right hand, never a disembodied prop. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the left wrist like a thick rectangular smart-computer box — never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers.';

var SHIP =
  'A MUCH LARGER sleek stealth interceptor, capital-scout scale: elongated arrowhead wedge silhouette, needle nose flaring into a broad blended-wing rear, dark matte charcoal gunmetal plating with dense panel lines and greebles. The faceted cockpit canopy is tiny relative to the hull so the ship reads as a long vessel, not a toy, not a one-person fighter, not a white luxury shuttle. Thin cyan-blue energy strips run along the sides and dorsal spine. Twin circular rear engine nozzles with a cool blue inner glow. One subtle thin navy-and-gold identity stripe on the upper hull. No readable hull text.';

var PATCHES = {
  'FILM-001': {
    still_prompt: capPrompt(
      'Identity portrait, front view, head and shoulders, on the FILM-014 alien-galaxy luxury coast. ' +
        IDENTITY +
        ' Helmet off, natural confident expression. Background is the FILM-014 coast only — not a gray studio, not Earth, not Florida. ' +
        BEACH +
        ' Cinematic key light from the twin moons. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.'
    ),
    still_edit_prompt: capPrompt(
      'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, pose, and the rectangular square gunmetal left-wrist computer. Square housing, square amber-orange screen, square or rectangular side buttons. NO ROUND SHAPES — not a round watch, not a curved CRT, not rotary knobs. ALWAYS on her left hand / left wrist, never the right hand. Left palm, fingers, and thumb stay fully visible past the strap. REPLACE the gray studio backdrop only. Put her on the FILM-014 alien-galaxy luxury coast: ' +
        BEACH +
        ' She stays head-and-shoulders, helmet off. Do not change her face. Do not change the wrist device. No extra people.'
    ),
    video_motion_prompt:
      'Slow cinematic push-in on her face. Hair and suit catch a soft alien-beach wind. Twin oversized moons and bioluminescent teal-violet trees hold in the background. Amber wrist-screen holds steady. Silent. Lock this exact portrait.',
  },
  'FILM-004': {
    still_prompt: capPrompt(
      'Full-body still, standing relaxed, head to boots visible, boots on the FILM-014 iridescent lilac-gold sand. ' +
        IDENTITY +
        ' Matching navy-and-gold trousers and white space boots, wrist computer clearly visible sitting on her left wrist with her left hand and fingers fully visible. Background is the FILM-014 coast only — not a gray studio, not Earth, not Florida. ' +
        BEACH +
        ' Cinematic key light from the twin moons. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.'
    ),
    still_edit_prompt: capPrompt(
      'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, full-body pose, white space boots, and the rectangular square gunmetal left-wrist computer. Square housing, square amber-orange screen, square or rectangular side buttons. NO ROUND SHAPES — not a round watch, not a curved CRT, not rotary knobs. ALWAYS on her left hand / left wrist, never the right hand. Left palm, fingers, and thumb stay fully visible past the strap. REPLACE the gray studio backdrop only. Stand her on the FILM-014 alien-galaxy luxury coast: ' +
        BEACH +
        ' Boots on the iridescent lilac-gold sand. Twin moons and bioluminescent teal-violet trees behind her. Do not change her face. Do not change the wrist device. No extra people. Not a wreck. Not a crash.'
    ),
    video_motion_prompt:
      'Slow full-body pull-back, boots to hair, on the iridescent lilac-gold shore. Suit fabric breathes. Twin moons behind her. Left-wrist square device stays locked. Silent.',
  },
  'FILM-020': {
    still_prompt: capPrompt(
      'Keyframe, 9:16 vertical. High-speed atmospheric entry into the new planet. The SAME sleek dark gunmetal arrowhead interceptor as FILM-010, nose-first, screaming down from space. Top of the frame is still black deep space and stars. Below, the curved limb of the FILM-014 alien-galaxy beach planet fills the lower frame. ' +
        BEACH +
        ' The ship is wrapped in a THICK orange-white plasma sheath, a hard bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks, glowing ionized air, sparks peeling off the leading edges. Lots of burn-up. Hull stays INTACT — only SLIGHTLY damaged, light scoring under the plasma. NOT breaking apart. NOT a wreck. NOT torn open. NOT major structural damage. ' +
        SHIP +
        ' High drama, spectacle. No wreckage debris. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text, no logos, no captions, no watermarks. NO people, NO hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props.'
    ),
    still_edit_prompt: capPrompt(
      'Keep this exact charcoal gunmetal arrowhead interceptor hull: elongated wedge, tiny canopy, cyan-blue energy strips, twin circular blue engines, navy-and-gold stripe. Change the moment to high-speed atmospheric entry. Top of frame still deep space and stars. Below, the curved limb of the FILM-014 beach planet: ' +
        BEACH +
        ' Wrap the ship in a THICK orange-white plasma sheath, bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks. Lots of burn-up. Hull stays intact, light scoring only. Do not wreck the ship. Do not tear it open. No people.'
    ),
    video_motion_prompt:
      'Start in deep space on the intact charcoal arrowhead interceptor. Then it dives at extreme speed toward the new FILM-014 beach planet. Atmosphere hits hard — thick orange-white plasma sheath, bow shock, long fire trail, heavy atmospheric burn-up. The alien coast grows fast in the lower frame: iridescent lilac-gold dunes, teal-violet trees, twin moons. Hull stays intact. Silent.',
  },
};

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film_beach_entry: no rows from get_film_stills.');
}

var seen = {};
var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  var patch = PATCHES[stillId];
  if (!patch) continue;
  if (seen[stillId]) {
    throw new Error('overlay_film_beach_entry: duplicate still_id ' + stillId);
  }
  seen[stillId] = 1;
  out.push({
    json: {
      still_id: stillId,
      still_prompt: patch.still_prompt,
      still_edit_prompt: patch.still_edit_prompt,
      video_motion_prompt: patch.video_motion_prompt,
      video_url: '',
    },
  });
}

var need = Object.keys(PATCHES);
if (out.length !== need.length) {
  throw new Error(
    'overlay_film_beach_entry: expected ' +
      need.join(',') +
      ', wrote ' +
      out.map(function (o) {
        return o.json.still_id;
      }).join(',')
  );
}

return out;
