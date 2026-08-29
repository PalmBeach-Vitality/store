// n8n Code node: overlay_film023_pick_keeper
// Workflow: overlay_film023_pick_keeper (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_pick
//
// Sal picked 1648 take ...-490e8b55.png. Wrist device is the
// wrong orientation; that is an edit, not a regen.
// Writes picked_url + still_edit_prompt. Does not rewrite
// still_prompt / take_urls / times_used.

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
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-d82e216e-d3b1-98b6-9381-e1ab94aba593-490e8b55.png';

var EDIT_023 =
  'Keep this exact handoff camera, vial, alien pearl-white fingers, and BARE LEFT astronaut palm. Do not add gloves. ONLY rotate the square gunmetal wrist device into FILM-004 watch orientation: screen on the BACK of the LEFT wrist facing out, TOP of the MOTS-C text toward the fingers, BOTTOM toward the forearm. NOT rotated 90 degrees. NOT sideways toward the thumb. NOT a long rectangle along the forearm. NOT a medical HUD. No other changes.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film023_pick_keeper: no rows from get_film_stills.');
}

var found = false;
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId === 'FILM-023') {
    found = true;
    return [
      {
        json: {
          still_id: stillId,
          picked_url: PICKED_023,
          still_edit_prompt: capPrompt(EDIT_023),
        },
      },
    ];
  }
}

if (!found) {
  throw new Error('overlay_film023_pick_keeper: FILM-023 missing on the sheet.');
}
