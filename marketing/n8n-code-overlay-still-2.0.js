// n8n Code node: overlay_still_2_0
// Workflow: overlay_still_2.0 (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_still_model
//
// Writes model_still=grok-imagine-image-2.0 on every Sheet 18 row.
// Does NOT touch video_url, picked_url, prompts, or video models.

var LATEST_STILL = 'grok-imagine-image-2.0';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) throw new Error('overlay_still_2.0: no rows from get_film_stills.');

var out = [];
var seen = {};
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!stillId) continue;
  if (seen[stillId]) throw new Error('overlay_still_2.0: duplicate still_id ' + stillId);
  seen[stillId] = 1;
  out.push({
    json: {
      still_id: stillId,
      model_still: LATEST_STILL,
    },
  });
}

if (!out.length) throw new Error('overlay_still_2.0: no still_id rows.');
return out;
