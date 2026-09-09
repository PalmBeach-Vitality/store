// n8n Code node: overlay_film004_device_lock
// Workflow: overlay_film004_square_left_wrist (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_device_lock
//
// FILM-004 keeper is a rectangular blocky gunmetal box on her LEFT wrist.
// Close-ups still said curved CRT + rotary dials + "no people".
// Lock still_prompt + still_edit_prompt only.
// Does NOT emit times_used / last_used_at / take_urls / picked_url.

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

function mustReplaceAny(text, oldList, newStr, stillId) {
  var t = String(text || '');
  for (var i = 0; i < oldList.length; i++) {
    if (t.indexOf(oldList[i]) !== -1) {
      return t.split(oldList[i]).join(newStr);
    }
  }
  throw new Error(
    'overlay_film004_device_lock: ' +
      stillId +
      ' still_prompt missing expected phrase: ' +
      String(oldList[0] || '').slice(0, 80)
  );
}

var ROTARY_PHRASE = ', with rotary dials and a small amber CRT.';
var SQUARE_LOCK =
  '. The device is a rectangular blocky SQUARE gunmetal box: square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES — not a round watch, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges. ALWAYS on her LEFT wrist and left hand only — never the right hand, never a disembodied prop.';

var SMARTWATCH_OLDS = [
  'The device sits ON the wrist like a thick smartwatch — never a gauntlet',
  'The device sits ON the wrist like a thick smartwatch - never a gauntlet',
];
var SMARTWATCH_NEW =
  'The device sits ON the left wrist like a thick rectangular smart-computer box — never a gauntlet';

var FILM003_CRT_OLD = 'square amber CRT screen with only slightly rounded corners';
var FILM003_CRT_NEW = 'square amber-orange screen with only slightly rounded corners';
var FILM003_ROTARY_OLD =
  'Small rotary dials sit on the sides of the square housing, not as giant round knobs that make the silhouette circular.';
var FILM003_ROTARY_NEW =
  'Square or rectangular buttons and sliders sit on the SIDES of the box. NO ROUND SHAPES — not rotary knobs, not a round watch, not a circular bezel, not a curved CRT, not round gauges. ALWAYS on her LEFT wrist and left hand only — never the right hand.';

var STILL_005 =
  "Extreme close-up macro of HER LEFT WRIST and LEFT HAND, 9:16 vertical. Late-20s beautiful blonde woman astronaut, navy-and-gold flight-suit sleeve filling the frame. A rectangular blocky SQUARE gunmetal wrist computer is strapped exactly onto her LEFT wrist bone (the joint between forearm and hand), housing no wider than the wrist. The device is a thick square box: brushed dark gunmetal, exposed screws, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES: not a round watch face, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges, not a Pip-Boy gauntlet. ALWAYS on her LEFT hand — never the right hand, never a floating device with no person attached. Her left palm, fingers, and thumb continue past the strap and stay fully visible, anatomically correct. The screen shows a full bright green horizontal charge bar and the blocky uppercase word 'MOTS-C' above it, steady and healthy. Screen text is tack sharp and perfectly legible. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the wrist-device screen. No logos, no captions, no watermarks.";

var STILL_006 =
  "Extreme close-up macro of HER LEFT WRIST and LEFT HAND, 9:16 vertical. Late-20s beautiful blonde woman astronaut, navy-and-gold flight-suit sleeve filling the frame. A rectangular blocky SQUARE gunmetal wrist computer is strapped exactly onto her LEFT wrist bone (the joint between forearm and hand), housing no wider than the wrist. The device is a thick square box: brushed dark gunmetal, exposed screws, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. NO ROUND SHAPES: not a round watch face, not a circular bezel, not a curved CRT, not rotary knobs, not round gauges, not a Pip-Boy gauntlet. ALWAYS on her LEFT hand — never the right hand, never a floating device with no person attached. Her left palm, fingers, and thumb continue past the strap and stay fully visible, anatomically correct. The screen flashes a nearly empty amber-red charge bar and the blocky uppercase words 'MOTS-C LOW' in warning red, glow reflecting on the housing. Screen text is tack sharp and perfectly legible, exactly the characters 'MOTS-C LOW'. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the wrist-device screen. No logos, no captions, no watermarks.";

var ASTRONAUT_EDIT =
  'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, lighting, backdrop, and pose. Put a rectangular blocky SQUARE gunmetal wrist computer on her LEFT wrist joint only. Square housing, square amber-orange screen, square or rectangular side buttons. NO ROUND SHAPES — not a round watch, not a curved CRT, not rotary knobs. ALWAYS on her left hand / left wrist, never the right hand. Left palm, fingers, and thumb stay fully visible past the strap. Do not change her face.';

var FILM003_EDIT =
  'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, lighting, and gray backdrop. Fix anatomy: exactly two arms and two hands, no extra limbs, no extra fingers, no third hand. Move the device OFF the bicep, upper arm, and forearm, and OFF any arm-across-chest pose. Put a rectangular blocky SQUARE gunmetal computer on her LEFT WRIST JOINT only, left arm hanging naturally at her side in true left profile. Square housing, square amber-orange screen with slightly rounded corners, square or rectangular side buttons. NO ROUND SHAPES — not a round watch, not a curved CRT, not rotary knobs. ALWAYS on her left hand, never the right hand. Left hand stays visible past the strap. Do not change her face.';

var DEVICE_EDIT =
  'Keep this exact left hand, navy flight-suit sleeve, lighting, and square gunmetal wrist computer. The device must stay a rectangular blocky SQUARE box on her LEFT wrist joint only — square housing, square amber-orange screen, square or rectangular side buttons. NO ROUND SHAPES: not a round watch, not a curved CRT, not rotary knobs. ALWAYS on the left hand, never the right hand, never a floating prop. Left palm, fingers, and thumb stay fully visible past the strap. Do not change the screen text.';

var TARGETS = {
  'FILM-001': 'astronaut',
  'FILM-002': 'astronaut',
  'FILM-003': 'side',
  'FILM-004': 'astronaut',
  'FILM-005': 'closeup_ok',
  'FILM-006': 'closeup_low',
  'FILM-019': 'astronaut',
  'FILM-021': 'astronaut',
};

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film004_device_lock: no rows from get_film_stills.');
}

var out = [];
var locked = 0;
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  var kind = TARGETS[stillId];
  if (!kind) continue;

  var prompt = String(r.still_prompt || '');
  var edit = '';

  if (kind === 'closeup_ok') {
    prompt = STILL_005;
    edit = DEVICE_EDIT;
  } else if (kind === 'closeup_low') {
    prompt = STILL_006;
    edit = DEVICE_EDIT;
  } else if (kind === 'side') {
    prompt = mustReplaceAny(prompt, [FILM003_CRT_OLD], FILM003_CRT_NEW, stillId);
    prompt = mustReplaceAny(prompt, [FILM003_ROTARY_OLD], FILM003_ROTARY_NEW, stillId);
    edit = FILM003_EDIT;
  } else {
    prompt = mustReplaceAny(prompt, [ROTARY_PHRASE], SQUARE_LOCK, stillId);
    prompt = mustReplaceAny(prompt, SMARTWATCH_OLDS, SMARTWATCH_NEW, stillId);
    edit = ASTRONAUT_EDIT;
  }

  out.push({
    json: {
      still_id: stillId,
      still_prompt: capPrompt(prompt),
      still_edit_prompt: capPrompt(edit),
    },
  });
  locked += 1;
}

if (locked !== 8) {
  throw new Error(
    'overlay_film004_device_lock: expected 8 device/astronaut rows, got ' + locked
  );
}

return out;
