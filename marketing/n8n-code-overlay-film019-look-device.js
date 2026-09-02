// n8n Code node: overlay_film019_look_device
// Workflow: overlay_film019_look_device (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_look
//
// Keeper ...-4d9f0046.png: she glances off-camera and the square
// device faces the lens. Lock look-at-device + screen-faces-her.
// Writes picked_url. Does not touch take_urls / times_used.

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

var PICKED =
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-97eff08a-b0a1-99eb-86f1-bc1d1a62b8c2-13d57662.jpeg';

var STILL_019 =
  'Keyframe, 9:16 vertical. Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES — not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only — never the right hand, never a disembodied prop. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the left wrist like a thick rectangular smart-computer box — never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers. She stands at the FILM-013 engine core and looks DOWN at her raised left wrist: chin tucked, eyes on the device, she is reading the screen. The square screen and the glowing MOTS-C LOW text face HER — right-side-up for her eyes, upside-down or edge-on to the camera. NOT a face-on product shot pointed at the lens. Camera sees the SIDE and TOP EDGE of the square box as she reads it. Left hand and fingers still fully visible. BACKGROUND must be that SAME FILM-013 core — circular brushed-metal well, concentric rings, dim gold radial vein conduits, red warning glow — slightly out of focus behind her. NOT a different cockpit. NOT a space canopy. NOT a crystal socket. NOT a hose nest. NOT a radar HUD hero. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.';

var EDIT_019 =
  'Keep this EXACT woman, face, hair, pose, flight suit, Palm Beach chest patch, and circular brushed-metal core. Do not change her face. Do not move her left arm. Do not take the device off her left wrist. ONLY rotate the square wrist-computer screen 180 degrees so the glowing MOTS-C LOW text faces HER and is right-side-up for her eyes. From the camera the letters should appear upside-down or edge-on — she is reading it, the audience is not. The square housing stays on her LEFT wrist. Left hand, fingers, and thumb stay visible. No handheld prop. No engraved text on the core. No extra people.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film019_look_device: no rows from get_film_stills.');
}

var out = [];
var seen = false;
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId === 'FILM-019') {
    seen = true;
    out.push({
      json: {
        still_id: stillId,
        still_prompt: capPrompt(STILL_019),
        still_edit_prompt: capPrompt(EDIT_019),
        picked_url: PICKED,
      },
    });
  }
}

if (!seen) {
  throw new Error('overlay_film019_look_device: FILM-019 missing on the sheet.');
}

return out;
