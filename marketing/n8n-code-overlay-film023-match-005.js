// n8n Code node: overlay_film023_match_005
// Workflow: overlay_film023_match_005 (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_orient
//
// 1650 edits rotated MOTS-C toward the fingers. FILM-005 / FILM-006
// have the opposite: TOP of MOTS-C toward the forearm / elbow.
// Writes still_prompt + still_edit_prompt on 023 and 024.
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

var OLD_ORIENT =
  'Watch orientation: the screen sits on the back of the wrist facing OUT, not toward the palm. The TOP of the screen (MOTS-C text) points toward her fingers; the BOTTOM of the screen points toward her forearm.';

var NEW_ORIENT =
  'SAME screen orientation as FILM-005 and FILM-006: the screen sits on the back of the wrist facing OUT, not toward the palm. The TOP of the screen (MOTS-C text) points toward her forearm / elbow; the BOTTOM of the screen points toward her fingers.';

var EDIT_023 =
  'Keep this exact handoff camera, vial, alien pearl-white fingers, and BARE LEFT astronaut palm. Do not add gloves. ONLY rotate the square gunmetal wrist device to match FILM-005 and FILM-006: screen on the BACK of the LEFT wrist, TOP of the MOTS-C text toward the forearm / elbow, BOTTOM of the MOTS-C text toward the fingers. Screen text stays MOTS-C only — do not print FILM-004 or any other extra words. NOT rotated 90 degrees. NOT sideways toward the thumb. NOT a long rectangle along the forearm. NOT a medical HUD. No other changes.';

var EDIT_024 =
  'Keep this exact insert camera and vial. REMOVE every glove. Bare LEFT hand only. Square device on the BACK of her LEFT wrist, SAME orientation as FILM-005 / FILM-006: MOTS-C text toward the forearm / elbow, bottom toward the fingers, not rotated 90 degrees. Seat the vial in the FILM-013 circular brushed-metal well, not a crystal socket. No gloves.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film023_match_005: no rows from get_film_stills.');
}

var out = [];
var seen = {};
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId !== 'FILM-023' && stillId !== 'FILM-024') continue;

  var prompt = String((rows[i] || {}).still_prompt || '');
  if (prompt.indexOf(OLD_ORIENT) === -1) {
    throw new Error(
      'overlay_film023_match_005: ' + stillId + ' missing expected orientation lock.'
    );
  }

  seen[stillId] = 1;
  out.push({
    json: {
      still_id: stillId,
      still_prompt: capPrompt(prompt.split(OLD_ORIENT).join(NEW_ORIENT)),
      still_edit_prompt: capPrompt(stillId === 'FILM-023' ? EDIT_023 : EDIT_024),
    },
  });
}

if (!seen['FILM-023'] || !seen['FILM-024']) {
  throw new Error('overlay_film023_match_005: FILM-023/024 missing on the sheet.');
}

return out;
