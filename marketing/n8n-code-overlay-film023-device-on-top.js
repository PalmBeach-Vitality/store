// n8n Code node: overlay_film023_device_on_top
// Workflow: overlay_film023_device_on_top (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_top
//
// 023 edits left the box on the INNER / underside of the wrist.
// FILM-005 / FILM-006 sit on TOP of the wrist. Lock that.
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

var OLD_PLACE =
  'a rectangular blocky SQUARE gunmetal box strapped exactly onto the BACK (dorsal / outer side) of her LEFT wrist bone, housing no wider than the wrist.';

var NEW_PLACE =
  'a rectangular blocky SQUARE gunmetal box strapped exactly onto the TOP of her LEFT wrist — the BACK / dorsal / outer side, same as a normal watch and as FILM-005 / FILM-006, housing no wider than the wrist. NEVER underneath the wrist. NEVER on the inner wrist. NEVER on the palm side.';

var EDIT_023 =
  'Keep this exact handoff camera, vial, alien pearl-white fingers, and BARE LEFT open palm. Do not add gloves. The square gunmetal device is on the WRONG side of the wrist: it is sitting UNDERNEATH / on the inner wrist / palm side. MOVE the entire box onto the TOP of the LEFT wrist — the BACK of the wrist — SAME as FILM-005 and FILM-006. Like a watch. Screen faces out from the TOP of the wrist, away from the palm. Because the palm faces the camera, the device sits on the far side of the wrist; the camera may see only the side edge of the box. NOT under the wrist. NOT on the inner wrist. NOT a face-on screen on the palm side. Do not just rotate the text. Screen text stays MOTS-C only. No other changes.';

var EDIT_024 =
  'Keep this exact insert camera and vial. Bare LEFT hand only. MOVE the square device onto the TOP of the LEFT wrist, the BACK of the wrist, SAME as FILM-005 / FILM-006. NEVER underneath. NEVER on the inner wrist. Seat the vial in the FILM-013 circular brushed-metal well. No gloves.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film023_device_on_top: no rows from get_film_stills.');
}

var out = [];
var seen = {};
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId !== 'FILM-023' && stillId !== 'FILM-024') continue;

  var prompt = String((rows[i] || {}).still_prompt || '');
  if (prompt.indexOf(OLD_PLACE) === -1) {
    throw new Error(
      'overlay_film023_device_on_top: ' + stillId + ' missing expected placement lock.'
    );
  }

  seen[stillId] = 1;
  out.push({
    json: {
      still_id: stillId,
      still_prompt: capPrompt(prompt.split(OLD_PLACE).join(NEW_PLACE)),
      still_edit_prompt: capPrompt(stillId === 'FILM-023' ? EDIT_023 : EDIT_024),
    },
  });
}

if (!seen['FILM-023'] || !seen['FILM-024']) {
  throw new Error('overlay_film023_device_on_top: FILM-023/024 missing on the sheet.');
}

return out;
