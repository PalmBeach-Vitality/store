// n8n Code node: prep_kling_extend
// After: switch_last_frame (true)   Before: fal_kling_hop2
//
// Hop 2 of 2 starts from the frame prep_last_frame grabbed. Same silent lock as hop 1.

var SILENT_LOCK = 'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ';
// fal Kling v3 Pro rejects prompt and negative_prompt over 2500 characters.
var PROMPT_MAX = 2500;

var pick = $('pick_molecule_creation').first().json;
var frame = String($input.first().json.url || '').trim();
if (!/^https:\/\//i.test(frame)) {
  throw new Error('prep_kling_extend: route_last_frame passed no https frame url (got ' + JSON.stringify(frame.slice(0, 120)) + ').');
}

var motion = pick.extend_motion_prompt;
var prompt = motion.indexOf('Silent video') === -1 ? SILENT_LOCK + motion : motion;
if (prompt.length > PROMPT_MAX) {
  throw new Error(
    'prep_kling_extend: ' + pick.creation_id + ' extend_motion_prompt is ' + prompt.length +
      ' characters with the silent lock. Kling takes ' + PROMPT_MAX + '. Shorten the sheet cell.'
  );
}
if (pick.negative_prompt.length > PROMPT_MAX) {
  throw new Error('prep_kling_extend: ' + pick.creation_id + ' negative_prompt is over ' + PROMPT_MAX + ' characters.');
}

return [
  {
    json: {
      creation_id: pick.creation_id,
      model_video: pick.model_video,
      prompt: prompt,
      start_image_url: frame,
      duration: String(pick.hop2_duration_seconds),
      negative_prompt: pick.negative_prompt,
      cfg_scale: pick.cfg_scale,
      poll_seconds: pick.video_poll_seconds,
      max_wait_seconds: pick.video_max_wait_seconds,
    },
  },
];
