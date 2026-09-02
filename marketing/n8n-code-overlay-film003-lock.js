// n8n Code node: overlay_film003_lock
// Workflow: overlay_film003_side_lock (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film003
//
// FILM-003 identity_side: wrong wrist (bicep / arm-across-chest), extra limbs,
// round device. Lock still_prompt + still_edit_prompt only.
// Does NOT emit times_used / last_used_at / take_urls.

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

var STILL =
  'Studio-lit identity portrait, true anatomical LEFT side profile, head and shoulders, 9:16 vertical. Camera is on her left side so her left ear, left cheek, and left arm are nearest the lens. Late-20s beautiful blonde woman astronaut, long golden-blonde hair in a low ponytail, bright green eyes, light freckles, athletic build, navy-and-gold flight suit with a small circular Palm Beach chest patch, helmet off. Exactly ONE head, TWO arms, TWO hands, TEN fingers — no extra limbs, no extra arms, no extra hands, no extra fingers, no fused joints, no truncated forearm. Her left arm hangs naturally down at her left side, slightly in front of her hip so the LEFT WRIST is visible in the lower frame. Do not bend the left arm across her chest. Do not raise the device to her chin. Do not put the device on her bicep, upper arm, or forearm. A square boxy watch-scale retro-futuristic wrist computer is strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist. The device is SQUARE: square dark gunmetal housing, square amber CRT screen with only slightly rounded corners, small square face. Not round, not circular, not a round watch, not a round CRT disc, not a round gauge, not a Pip-Boy gauntlet. Small rotary dials sit on the sides of the square housing, not as giant round knobs that make the silhouette circular. Her left hand, palm, fingers, and thumb continue past the strap and stay fully visible, anatomically correct. The right arm stays behind her torso in true profile — do not invent a second left arm to show the watch. Neutral soft gray backdrop, even cinematic key light, natural confident expression. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks, no people other than the astronaut.';

var EDIT =
  'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, lighting, and gray backdrop. Fix anatomy: exactly two arms and two hands, no extra limbs, no extra fingers, no third hand. Move the device OFF the bicep, upper arm, and forearm, and OFF any arm-across-chest pose. Put a SQUARE watch-scale computer on her LEFT WRIST JOINT only, left arm hanging naturally at her side in true left profile. Square housing, square amber screen with slightly rounded corners — not round, not a circular watch face. Left hand stays visible past the strap. Do not change her face.';

var rows = $input.all().map(function (i) {
  return i.json;
});

var pick = null;
for (var i = 0; i < rows.length; i++) {
  if (String((rows[i] && rows[i].still_id) || '').trim() === 'FILM-003') {
    pick = rows[i];
    break;
  }
}

if (!pick) {
  throw new Error('overlay_film003_lock: FILM-003 row missing on 18-motsc-film-stills.');
}

return [
  {
    json: {
      still_id: 'FILM-003',
      still_prompt: capPrompt(STILL),
      still_edit_prompt: capPrompt(EDIT),
    },
  },
];
