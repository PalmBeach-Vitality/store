// n8n Code node: overlay_film001_004_1080p
// Workflow: overlay_film001_004_1080p (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film001_004
//
// 1080p ONLY. Never write 720p.
// FILM-001 + FILM-004 only. Does not touch FILM-020.
// Same exact scenes. Exact FILM-014 beach. Clears those two video_url cells.

var BRANCH = 'cursor/film001-004-1080p-4c4b';
var STILL_001 =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film001-identity.png';
var STILL_004 =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film004-reach-empty-hand.jpeg';

var MOTION_001 =
  'Waist-up hold of the same late-20s blonde astronaut on the EXACT FILM-014 alien-galaxy coast. Soft wind in hair and navy-gold flight suit. Twin oversized moons and teal-violet glass-veined trees hold. Iridescent lilac-gold dunes and turquoise water with a golden sheen stay. Square gunmetal wrist computer stays in frame, amber screen steady. Camera holds waist-up. Same exact scene. Silent.';

var MOTION_004 =
  'Same exact reach: she extends her empty right hand toward camera. Soft wind on the EXACT FILM-014 alien-galaxy coast. Twin moons, teal-violet trees, lilac-gold dunes, and turquoise gold-sheen water hold. No vial. Empty right hand only. Left-wrist square computer locked. Silent.';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film001_004_1080p: no rows from get_film_stills.');
}

var wanted = {
  'FILM-001': {
    picked_url: STILL_001,
    video_motion_prompt: MOTION_001,
    duration_seconds: '8',
  },
  'FILM-004': {
    picked_url: STILL_004,
    video_motion_prompt: MOTION_004,
    duration_seconds: '5',
  },
};

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!wanted[stillId]) continue;
  out.push({
    json: {
      still_id: stillId,
      picked_url: wanted[stillId].picked_url,
      video_url: '',
      video_motion_prompt: wanted[stillId].video_motion_prompt,
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
      duration_seconds: wanted[stillId].duration_seconds,
      video_resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: 'false',
      wait_seconds: '300',
      video_start_url: 'https://openrouter.ai/api/v1/videos',
    },
  });
}

if (out.length !== 2) {
  throw new Error(
    'overlay_film001_004_1080p: expected FILM-001 and FILM-004, wrote ' + out.length
  );
}

return out;
