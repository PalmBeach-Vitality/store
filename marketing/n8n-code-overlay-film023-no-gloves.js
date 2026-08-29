// n8n Code node: overlay_film023_no_gloves
// Workflow: overlay_film023_no_gloves (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_hands
//
// FILM-023 exec 1639 takes are no good: gloves + wrist device
// rotated the wrong way (90 deg / along the forearm / medical HUD).
// Lock bare left hand + FILM-004 watch orientation on 023 and 024.
// Does not write take_urls / times_used / picked_url.

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

var VIAL =
  "Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue plastic flip-off cap on a brushed-silver aluminum crimp over a rubber septum, clean white wrap-around label with a dark maroon DNA double-helix icon centered at the top, the name 'MOTS-C' in large bold dark maroon sans-serif printed once, a solid dark maroon rectangle badge with white text exactly '10mg'. The liquid inside glows a warm golden-white from within like a charged power cell, soft light spilling onto nearby surfaces.";

var DEVICE =
  'SAME square left-wrist device as FILM-004 / FILM-005: a rectangular blocky SQUARE gunmetal box strapped exactly onto the BACK (dorsal / outer side) of her LEFT wrist bone, housing no wider than the wrist. Square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. Watch orientation: the screen sits on the back of the wrist facing OUT, not toward the palm. The TOP of the screen (MOTS-C text) points toward her fingers; the BOTTOM of the screen points toward her forearm. NOT rotated 90 degrees. NOT sideways toward the thumb. NOT a long rectangle running along the forearm. NOT on the inner wrist. NOT a face-on product shot pointed at the camera. Screen shows only the square amber-orange MOTS-C readout — no heart-rate, no temperature, no 36.7, no medical HUD. NO ROUND SHAPES. ALWAYS on her LEFT wrist.';

var NO_GLOVES =
  'Her LEFT hand is BARE skin — palm, fingers, and thumb fully visible, anatomically correct. NO gloves. NO gauntlets. NO space-suit gloves. NO tactical gloves.';

var STILL_023 =
  'Money-shot keyframe, 9:16 vertical. Extreme close-up of the handoff: the alien\'s slender pearl-white fingers placing the glowing vial into the astronaut\'s BARE LEFT open palm, label facing camera perfectly readable: ' +
  VIAL +
  ' ' +
  NO_GLOVES +
  ' ' +
  DEVICE +
  ' Golden glow lighting both bare hands, shallow depth of field, dusk ocean and palm bokeh. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks. No faces. No extra people. No gloves.';

var STILL_024 =
  'Keyframe, 9:16 vertical. Close on the astronaut\'s BARE LEFT hand seating the glowing vial into the SAME FILM-013 circular brushed-metal core well: ' +
  VIAL +
  ' ' +
  NO_GLOVES +
  ' ' +
  DEVICE +
  ' Golden energy floods outward through the recessed gold radial vein conduits, sparks of light, the red warning glow dying as gold takes over. NOT a crystal socket. NOT a hose nest. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks. No faces. No extra people. No gloves.';

var EDIT_023 =
  'Keep this exact handoff camera, vial, and alien pearl-white fingers. REMOVE every glove. The astronaut hand must be BARE LEFT skin — palm, fingers, thumb visible. Put the FILM-004 square gunmetal wrist computer on the BACK of her LEFT wrist in watch orientation: screen faces out from the dorsal wrist, MOTS-C text toward the fingers, not rotated 90 degrees, not along the forearm, not a medical HUD. No gloves.';

var EDIT_024 =
  'Keep this exact insert camera and vial. REMOVE every glove. Bare LEFT hand only. FILM-004 square device on the BACK of her LEFT wrist, watch orientation: MOTS-C text toward the fingers, not rotated 90 degrees. Seat the vial in the FILM-013 circular brushed-metal well, not a crystal socket. No gloves.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film023_no_gloves: no rows from get_film_stills.');
}

var seen = {};
var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId === 'FILM-023') {
    seen[stillId] = 1;
    out.push({
      json: {
        still_id: stillId,
        still_prompt: capPrompt(STILL_023),
        still_edit_prompt: capPrompt(EDIT_023),
      },
    });
  }
  if (stillId === 'FILM-024') {
    seen[stillId] = 1;
    out.push({
      json: {
        still_id: stillId,
        still_prompt: capPrompt(STILL_024),
        still_edit_prompt: capPrompt(EDIT_024),
      },
    });
  }
}

if (!seen['FILM-023'] || !seen['FILM-024']) {
  throw new Error('overlay_film023_no_gloves: missing FILM-023 or FILM-024 on the sheet.');
}

return out;
