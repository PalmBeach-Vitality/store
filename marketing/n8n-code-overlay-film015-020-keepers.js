// n8n Code node: overlay_film015_020_keepers
// Workflow: overlay_film015_020_keepers (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_keepers
//
// Sal: FILM-015 and FILM-020 are fine — minor hull damage only.
// Confirm picks. Set FILM-015 times_used so factory will not re-pick it.
// Does not rewrite still_prompt. Does not write take_urls.

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

var PICKED_015 =
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-7fa5cb73-d4fb-992d-b288-9f5df5ad574b-96d99939.png';
var PICKED_020 =
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-3af0ba63-c3c0-9700-97d6-1c596053b963-54b3e952.png';

var EDIT_015 =
  'Keep this exact camera, beach, and ship. Hull damage is already correct: only minor scorch and light scoring. Do not add wreckage. Do not tear the ship open. Do not change the hull.';
var EDIT_020 =
  'Keep this exact plunge camera and ship. Hull damage is already correct: only minor scoring and heat glow. Do not break the ship apart. Do not add wreckage. Do not change the hull.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film015_020_keepers: no rows from get_film_stills.');
}

var seen = {};
var out = [];
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  if (stillId === 'FILM-015') {
    seen[stillId] = 1;
    out.push({
      json: {
        still_id: stillId,
        picked_url: PICKED_015,
        still_edit_prompt: capPrompt(EDIT_015),
        times_used: '1',
      },
    });
  }
  if (stillId === 'FILM-020') {
    seen[stillId] = 1;
    out.push({
      json: {
        still_id: stillId,
        picked_url: PICKED_020,
        still_edit_prompt: capPrompt(EDIT_020),
        times_used: String(r.times_used || '1'),
      },
    });
  }
}

if (!seen['FILM-015'] || !seen['FILM-020']) {
  throw new Error('overlay_film015_020_keepers: missing FILM-015 or FILM-020 on the sheet.');
}

return out;
