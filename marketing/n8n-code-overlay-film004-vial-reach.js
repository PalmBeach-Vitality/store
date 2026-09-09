// n8n Code node: overlay_film004_vial_reach
// Workflow: overlay_film004_vial_reach (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film004
//
// FILM-004 only. Does not touch FILM-001.
// Centered true side view, empty-hand reach. NO ALIEN. NO VIAL (grab is FILM-023).

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

var BRANCH = 'cursor/film004-vial-reach-4c4b';
var REACH_STILL =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film004-reach-empty-hand.jpeg';

var still_edit_prompt = capPrompt(
  'Keep this same woman, same navy flight suit, same circular Palm Beach patch, same golden-blonde low ponytail, same left-wrist square gunmetal device with the square amber-orange screen. Keep this same FILM-014 dusk coast. True side view. She is the only person in the frame. Center her in the frame, mid-thigh, standing on the shore. Her right arm reaches out along the frame, empty open right hand. Nothing in the hand. Nothing beyond the fingertips. No vial, no bottle, no glass, no cap, no label. Do not add an alien. Do not add a second person. Do not add a second figure. Remove any alien or extra person if one appears. Do not keep the front-view portrait. Do not keep her facing the lens. Do not keep the hand reaching at the camera. Camera is on her side so we see a clean profile: ear, cheek, ponytail, the reach going left or right in the frame. Eyes look along the reach, never at the lens. Face stays small. Sharp focus on the empty right hand. Left hand, palm, fingers, and thumb stay visible past the left-wrist device. Two arms, two hands. No gloves. Do not change her face into someone else.'
);

var still_prompt = capPrompt(
  '9:16 mid-thigh still, one late-20s blonde woman centered in a true side profile on the FILM-014 dusk coast. Navy flight suit, circular Palm Beach suit patch, golden-blonde low ponytail, square gunmetal computer on the left wrist with a square amber-orange screen. Right arm reaches along the frame, empty open right hand. Eyes look along the reach. No other person. No alien. No vial. Photoreal cinematic sci-fi commercial still, 8k, HDR. No logos, no captions, no watermarks.'
);

var video_motion_prompt =
  '6-second clip, camera locked on this same centered side-profile. Same astronaut, same empty reach. Soft coastal wind in hair and suit. Eyes stay along the reach. Empty right hand holds the reach. No other person. No vial. No lock-eyes. No walk at the camera. Twin moons hold. Silent.';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film004_vial_reach: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId !== 'FILM-004') continue;
  out.push({
    json: {
      still_id: stillId,
      picked_url: REACH_STILL,
      still_prompt: still_prompt,
      still_edit_prompt: still_edit_prompt,
      video_motion_prompt: video_motion_prompt,
      video_url: '',
      n: '1',
      video_provider: 'veo',
      model_video: 'fal-ai/veo3.1/image-to-video',
      duration_seconds: '6',
      video_resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: 'false',
      wait_seconds: '240',
      video_start_url: 'https://fal.run/fal-ai/veo3.1/image-to-video',
    },
  });
}

if (out.length !== 1) {
  throw new Error('overlay_film004_vial_reach: expected FILM-004, wrote ' + out.length);
}

return out;
