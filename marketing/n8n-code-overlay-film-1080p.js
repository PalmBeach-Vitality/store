// n8n Code node: overlay_film_1080p
// Workflow: overlay_film_1080p (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_resolution
//
// 1080p ONLY. Never write 720p.
// Writes video_resolution=1080p on every Sheet 18 film row.
// Does not touch video_url, picked_url, prompts, or provider.

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film_1080p: no rows from get_film_stills.');
}

var out = [];
var seen = {};
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!stillId) continue;
  if (seen[stillId]) {
    throw new Error('overlay_film_1080p: duplicate still_id ' + stillId);
  }
  seen[stillId] = 1;
  out.push({
    json: {
      still_id: stillId,
      video_resolution: '1080p',
    },
  });
}

if (!out.length) {
  throw new Error('overlay_film_1080p: no still_id rows.');
}

return out;
