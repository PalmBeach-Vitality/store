// n8n Code node: overlay_film001_new_still
// Workflow: overlay_film001_new_still (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film001
//
// Sets FILM-001 picked_url to the saved identity still, writes the tighter
// camera-hold motion prompt, and clears video_url so I2V re-runs.
// Does not touch still_prompt, join columns, or other rows.

var BRANCH = 'cursor/film001-new-still-4c4b';
var PICKED =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film001-identity.png';
var MOTION =
  'Late-20s blonde astronaut on the alien coast. Soft wind in hair and navy-gold flight suit. Twin moons and teal-violet trees hold behind her. Square gunmetal wrist computer stays in frame, amber screen steady. Camera holds. Silent.';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film001_new_still: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId !== 'FILM-001') continue;
  out.push({
    json: {
      still_id: stillId,
      picked_url: PICKED,
      video_url: '',
      video_motion_prompt: MOTION,
    },
  });
}

if (out.length !== 1) {
  throw new Error('overlay_film001_new_still: expected FILM-001, wrote ' + out.length);
}

return out;
