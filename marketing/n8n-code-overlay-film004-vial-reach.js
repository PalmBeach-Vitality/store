// n8n Code node: overlay_film004_vial_reach
// Workflow: overlay_film004_vial_reach (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film004
//
// FILM-004 only. Does not touch FILM-001.
// Empty-hand reach toward the FILM-016 alien. NO VIAL (grab is FILM-023).
// Over-the-shoulder / side frame so Veo 3.1 does not see a face-on portrait.

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
  'Keep this same woman, same navy flight suit, same circular Palm Beach patch, same golden-blonde low ponytail, same left-wrist square gunmetal device with the square amber-orange screen. Keep this same FILM-014 dusk coast. Keep the empty reach. Her right arm stays out, open right hand empty. Nothing in the hand. Nothing beyond the fingertips. No vial, no bottle, no glass, no cap, no label. Remove any vial if one appears. She is reaching toward the FILM-016 alien, not toward the camera. Put that alien in front of her in the scene: tall, slender, iridescent pearl-white skin with a soft opal sheen, large kind amber eyes, calm friendly face, simple flowing gray-silver robe. The alien’s hands are empty. Do not keep the front-view portrait. Do not keep her facing the lens. Do not keep the hand reaching at the camera. Move the camera behind her right shoulder, slightly to the side, so we see the back and side of her head and the reach going away from us toward the alien. Mid-thigh two-shot. Her face stays small in the frame, in profile, slightly soft. Sharp focus on the empty right hand. Eyes on the alien, never on the lens. Left hand, palm, fingers, and thumb stay visible past the left-wrist device. Two arms, two hands on her. No gloves. Do not change her face into someone else.'
);

var still_prompt = capPrompt(
  '9:16 mid-thigh two-shot, camera behind the astronaut’s right shoulder. Late-20s blonde woman in a navy flight suit with a small circular Palm Beach suit patch, golden-blonde hair in a low ponytail, square gunmetal computer on the left wrist with a square amber-orange screen. She reaches her empty right hand toward a tall slender FILM-016 alien: iridescent pearl-white skin, soft opal sheen, large kind amber eyes, simple flowing gray-silver robe, empty hands. We see the back and side of her head, face small and in profile, slightly soft. Sharp on the empty right hand. Eyes on the alien. FILM-014 dusk coast behind them. No vial. Photoreal cinematic sci-fi commercial still, 8k, HDR. No logos, no captions, no watermarks.'
);

var video_motion_prompt =
  '6-second clip, camera locked on this same over-the-shoulder two-shot. Same astronaut, same alien, same empty reach. Soft coastal wind in hair and robe. Eyes stay on the alien. Empty right hand holds the reach. No vial. No lock-eyes. No walk at the camera. Twin moons hold. Silent.';

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
      n: '3',
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
