// n8n Code node: overlay_film023_024_final
// Workflow: overlay_film023_024_final (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_keepers
//
// Sal: vial_handoff_23 and vial_recharge_24 are FINAL keepers.
// Writes picked_url, still_edit_prompt, times_used.
// FILM-024 also writes take_urls. Does not rewrite still_prompt.
// DO NOT RUN unless Sal says yes.

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

var PICKED_023 =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film023-handoff-source.jpg';
var PICKED_024 =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film024-recharge-source.jpg';

var EDIT_023 =
  'FINAL keeper: vial_handoff_23. Do not regenerate. Do not edit.';
var EDIT_024 =
  'FINAL keeper: vial_recharge_24. Do not regenerate. Do not edit.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film023_024_final: no rows from get_film_stills.');
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
        picked_url: PICKED_023,
        still_edit_prompt: capPrompt(EDIT_023),
        times_used: '1',
      },
    });
  }
  if (stillId === 'FILM-024') {
    seen[stillId] = 1;
    out.push({
      json: {
        still_id: stillId,
        picked_url: PICKED_024,
        take_urls: PICKED_024,
        still_edit_prompt: capPrompt(EDIT_024),
        times_used: '1',
      },
    });
  }
}

if (!seen['FILM-023'] || !seen['FILM-024']) {
  throw new Error('overlay_film023_024_final: missing FILM-023 or FILM-024 on the sheet.');
}

return out;
