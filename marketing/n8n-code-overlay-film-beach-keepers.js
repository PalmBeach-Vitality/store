// n8n Code node: overlay_film_beach_keepers
// Workflow: overlay_film_beach_keepers (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_keepers
//
// Writes GitHub raw picked_url for the FILM-001 / 004 / 020 beach-entry keepers.
// Does not touch still_prompt or video_url.

var BRANCH = 'cursor/film-001-004-beach-entry-4c4b';
var BASE =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' + BRANCH + '/marketing/stills/';

var KEEPERS = {
  'FILM-001': BASE + 'film001-beach.png',
  'FILM-004': BASE + 'film004-beach.png',
  'FILM-020': BASE + 'film020-atmo-entry.png',
};

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film_beach_keepers: no rows from get_film_stills.');
}

var seen = {};
var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  var url = KEEPERS[stillId];
  if (!url) continue;
  if (seen[stillId]) {
    throw new Error('overlay_film_beach_keepers: duplicate still_id ' + stillId);
  }
  seen[stillId] = 1;
  out.push({ json: { still_id: stillId, picked_url: url } });
}

var need = Object.keys(KEEPERS);
if (out.length !== need.length) {
  throw new Error(
    'overlay_film_beach_keepers: expected ' +
      need.join(',') +
      ', wrote ' +
      out.map(function (o) {
        return o.json.still_id;
      }).join(',')
  );
}

return out;
