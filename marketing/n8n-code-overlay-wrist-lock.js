// n8n Code node: overlay_wrist_lock
// Workflow: overlay_wrist_lock_sheet18 (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once OFF.
// After: get_film_stills  Before: sheets_update_wrist_lock
//
// Wrist meter was a giant gauntlet replacing her left hand on FILM-001.
// Overlay locks still_prompt + still_edit_prompt on astronaut / device rows.
// Writes FILM-001 take_urls from exec 1588 if that cell is empty.
// Does NOT emit times_used / last_used_at.

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

var OLD_WRIST =
  'chunky retro-futuristic wrist computer on her left forearm with rotary dials and a small amber CRT screen';

var NEW_WRIST =
  'a small watch-scale retro-futuristic wrist computer strapped exactly onto her left wrist bone (the joint between forearm and hand), housing no wider than her wrist, with rotary dials and a small amber CRT. Her left hand, palm, fingers, and thumb stay fully visible past the device, anatomically correct. The device sits ON the wrist like a thick smartwatch — never a gauntlet, never a forearm tank, never a prosthetic, never replacing the hand, never covering the fingers';

var OLD_FOREARM_VISIBLE = 'wrist computer clearly visible on left forearm';
var NEW_FOREARM_VISIBLE =
  'wrist computer clearly visible sitting on her left wrist with her left hand and fingers fully visible';

var OLD_DEVICE =
  'Chunky retro-futuristic wrist-mounted computer strapped to a flight-suit forearm';
var NEW_DEVICE =
  'Watch-scale retro-futuristic wrist-mounted computer strapped exactly onto a flight-suit WRIST (the joint, not the hand), housing no wider than the wrist. A natural human left hand with palm, fingers, and thumb continues past the strap and stays fully visible. The device does not replace the hand, does not cover the fingers, and is not a giant gauntlet';

var OLD_RAISED = 'looking down at her raised left forearm:';
var NEW_RAISED =
  'looking down at her raised left wrist, her left hand and fingers still fully visible:';

var ASTRONAUT_EDIT =
  'Keep this exact woman, face, hair, eyes, flight suit, Palm Beach chest patch, lighting, backdrop, and pose. The wrist meter is too big and is replacing her left hand. Shrink it to a watch-scale device sitting EXACTLY on her left wrist only. Restore her natural left hand — palm, fingers, and thumb fully visible past the strap, anatomically correct, attached to her left arm. The device is a small retro-futuristic wrist computer with rotary dials and a small amber CRT, strapped around the wrist like a thick smartwatch. It must not cover or replace the hand, must not be a gauntlet, must not sit on the fingers. Do not change her face or anything else in the frame.';

var DEVICE_EDIT =
  'Keep this exact wrist device, screen, and lighting. The device is too big and is replacing the hand. Shrink it to a watch-scale unit sitting EXACTLY on the wrist. Restore the natural left hand — palm, fingers, and thumb fully visible past the strap. Not a gauntlet, not a prosthetic. Do not change the screen text.';

var FILM001_TAKES = [
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-922976ae-4cd1-97eb-94da-2eae310a0ea0-e4873b78.png',
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-922976ae-4cd1-97eb-94da-2eae310a0ea0-de377bb3.png',
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-922976ae-4cd1-97eb-94da-2eae310a0ea0-90d66e5a.png',
];

var ASTRONAUT_IDS = {
  'FILM-001': 1,
  'FILM-002': 1,
  'FILM-003': 1,
  'FILM-004': 1,
  'FILM-019': 1,
  'FILM-021': 1,
};

var DEVICE_IDS = {
  'FILM-005': 1,
  'FILM-006': 1,
};

function lockPrompt(text) {
  var t = String(text || '');
  t = t.split(OLD_WRIST).join(NEW_WRIST);
  t = t.split(OLD_FOREARM_VISIBLE).join(NEW_FOREARM_VISIBLE);
  t = t.split(OLD_DEVICE).join(NEW_DEVICE);
  t = t.split(OLD_RAISED).join(NEW_RAISED);
  return capPrompt(t);
}

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_wrist_lock: no rows from get_film_stills.');
}

var out = [];
var locked = 0;
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  if (!stillId) continue;

  if (!ASTRONAUT_IDS[stillId] && !DEVICE_IDS[stillId]) continue;

  var item = {
    still_id: stillId,
    still_prompt: lockPrompt(r.still_prompt),
  };

  if (ASTRONAUT_IDS[stillId]) {
    item.still_edit_prompt = capPrompt(ASTRONAUT_EDIT);
  } else {
    item.still_edit_prompt = capPrompt(DEVICE_EDIT);
  }
  locked += 1;

  if (stillId === 'FILM-001' && !String(r.take_urls || '').trim()) {
    item.take_urls = FILM001_TAKES.join(' | ');
  }

  out.push({ json: item });
}

if (!out.length) {
  throw new Error('overlay_wrist_lock: no still_id rows to write.');
}
if (locked < 8) {
  throw new Error(
    'overlay_wrist_lock: expected 8 astronaut/device rows, got ' + locked
  );
}

return out;
