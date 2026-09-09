// n8n Code node: overlay_film004_vial_reach
// Workflow: overlay_film004_vial_reach (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film004
//
// 1080p ONLY. Never write 720p.
// FILM-004 only. Does not touch FILM-001 (keep the Kling clip).
// Writes the old FILM-001 beach-reach pose onto the FILM-014 coast.
// The still is BEFORE she has the vial: empty reaching right hand. NO VIAL.

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

var BRANCH = 'cursor/film004-vial-reach-4c4b';
var REACH_STILL =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film004-reach-empty-hand.jpeg';

var BEACH =
  'Alien-galaxy luxury coast — same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.';

var IDENTITY =
  'Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES — not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only — never the right hand, never a disembodied prop. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the left wrist like a thick rectangular smart-computer box — never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers.';

var still_prompt = capPrompt(
  'Exact same scene as the old FILM-001 beach-reach still: 9:16 medium-close, late-20s blonde astronaut facing camera, RIGHT arm stretched toward the lens, EMPTY open right hand in the near foreground reaching outward. This is BEFORE she has the vial. NO VIAL anywhere. No bottle, no glass, no cap, no label, nothing in her hand, nothing just beyond her fingertips. Shallow DOF — reaching right hand slightly soft, face and suit sharp. ' +
    IDENTITY +
    ' Square gunmetal computer stays on her LEFT wrist — never a sports watch. Background is the FILM-014 alien-galaxy luxury coast only — not Earth royal palms, not an orange sunset, not a gray studio. ' +
    BEACH +
    ' Cinematic twin-moon key light. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text except the wrist-device screen. No logos, no captions, no watermarks, no extra people. NO VIAL.'
);

var still_edit_prompt = capPrompt(
  'Keep this exact reach pose from old FILM-001: she faces camera, RIGHT arm stretched toward the lens, EMPTY open right hand in the near foreground reaching outward. This still is BEFORE she has the vial. Do NOT add a vial. Do NOT put anything in her hand. Remove any vial, bottle, glass, cap, or label if one appears. Keep her face, hair, eyes, navy-and-gold flight suit, and Palm Beach chest patch. REPLACE the sports watch with the rectangular square gunmetal LEFT-wrist computer — square amber-orange screen, square side buttons, left palm and fingers visible. REPLACE the Earth-palm / orange-sunset beach with the FILM-014 alien-galaxy luxury coast: ' +
    BEACH +
    ' Empty reaching right hand only. NO VIAL. Do not change her face. No extra people.'
);

var video_motion_prompt =
  'She reaches her empty right hand outward toward camera. Soft alien-beach wind. Twin moons and teal-violet trees hold. No vial in the opening frame. Left-wrist square computer locked. Silent.';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film004_vial_reach: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId !== 'FILM-004') continue;
  out.push({
    json: {
      still_id: stillId,
      picked_url: REACH_STILL,
      still_prompt: still_prompt,
      still_edit_prompt: still_edit_prompt,
      video_motion_prompt: video_motion_prompt,
      video_url: '',
      n: '1',
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
      duration_seconds: '5',
      video_resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: 'false',
      wait_seconds: '180',
      video_start_url: 'https://openrouter.ai/api/v1/videos',
    },
  });
}

if (out.length !== 1) {
  throw new Error('overlay_film004_vial_reach: expected FILM-004, wrote ' + out.length);
}

return out;
