// n8n Code node: overlay_film_join_25
// Workflow: overlay_film_join_25
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_join
//
// Writes join-queue columns onto every 18-motsc-film-stills row.
// Does not rewrite still_prompt, picked_url, video_url, or keepers.
// seam_mode defaults to vace. Mark flf2v + fill bridge_prompt on story beats.

var REEL_ID = 'MOTSC-FILM-01';
var JOIN_WAIT = '90';
var BRIDGE_MODEL = 'kwaivgi/kling-v3.0-pro';
var BRIDGE_DURATION = '5';
var BRIDGE_RESOLUTION = '720p';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film_join_25: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!stillId) continue;
  var m = stillId.match(/^FILM-(\d+)$/i);
  if (!m) {
    throw new Error('overlay_film_join_25: unexpected still_id ' + stillId);
  }
  var order = String(Number(m[1]));
  out.push({
    json: {
      still_id: stillId,
      reel_id: REEL_ID,
      clip_order: order,
      seam_mode: 'vace',
      bridge_prompt: '',
      bridge_model: BRIDGE_MODEL,
      bridge_duration: BRIDGE_DURATION,
      bridge_resolution: BRIDGE_RESOLUTION,
      join_wait_seconds: JOIN_WAIT,
      music_prompt: '',
      sfx_prompt: '',
      join_url: '',
      join_status: '',
    },
  });
}

if (out.length !== 25) {
  throw new Error('overlay_film_join_25: expected 25 rows, got ' + out.length);
}

return out;
