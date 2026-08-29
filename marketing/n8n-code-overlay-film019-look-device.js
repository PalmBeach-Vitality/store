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
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-b2f7e139-d98d-9030-8862-3614b91f5719-4d9f0046.png';

var STILL_019 =
  'Keyframe, 9:16 vertical. Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES — not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only — never the right hand, never a disembodied prop. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the left wrist like a thick rectangular smart-computer box — never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers. She stands at the FILM-013 engine core and looks DOWN at her raised left wrist: chin tucked, eyes on the device, she is reading the screen. The square screen faces HER face, tilted toward her eyes — NOT facing the camera, NOT a face-on product shot pointed at the lens. Camera sees the device in 3/4 from above as she reads it. The screen flashes an almost-empty amber-red bar and blocky uppercase MOTS-C LOW, text tack sharp and still readable from that high 3/4 angle. Left hand and fingers still fully visible. BACKGROUND must be that SAME FILM-013 core — circular brushed-metal well, concentric rings, dim gold radial vein conduits, red warning glow — slightly out of focus behind her. NOT a different cockpit. NOT a space canopy. NOT a crystal socket. NOT a hose nest. NOT a radar HUD hero. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.';

var EDIT_019 =
  'Keep this EXACT woman, face, hair, flight suit, Palm Beach chest patch, and the circular brushed-metal core behind her. Do not change her face. Do not add any engraved text on the core. CHANGE the left-arm pose: she lifts the square wrist computer up toward her face like a person reading a watch. Her chin tucks. Her eyes lock on the screen. Rotate the left wrist so the square screen points at HER eyes — the device must NOT face out at the camera. From the camera we see the SIDE and TOP EDGE of the square gunmetal box. Only a sliver or steep 3/4 of the amber MOTS-C LOW screen is visible as she reads it. Left hand, palm, fingers, and thumb stay fully visible past the strap. No round shapes. No extra people. No readable text on the core.';

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
