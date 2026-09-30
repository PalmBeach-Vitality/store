// n8n Code node: prep_molecule_video_start
// After: save_still_url   Before: fal_kling_hop1
//
// Hop 1 of 2. Sheet values pass straight through. The only addition is the silent lock:
// audio is off on every vid-gen workflow (AGENTS.md), and the API flag alone has let a
// clip come back scored.

var SILENT_LOCK = 'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ';
// fal Kling v3 Pro rejects prompt and negative_prompt over 2500 characters.
var PROMPT_MAX = 2500;

var pick = $('pick_molecule_creation').first().json;
var still = String($input.first().json.still_url || '').trim();
if (!/^https:\/\//i.test(still)) {
  throw new Error(
    'prep_molecule_video_start: save_still_url has no https still_url (got ' + JSON.stringify(still.slice(0, 120)) + ').'
  );
}

var motion = pick.video_motion_prompt;
var prompt = motion.indexOf('Silent video') === -1 ? SILENT_LOCK + motion : motion;
if (prompt.length > PROMPT_MAX) {
  throw new Error(
    'prep_molecule_video_start: ' + pick.creation_id + ' video_motion_prompt is ' + prompt.length +
      ' characters with the silent lock. Kling takes ' + PROMPT_MAX + '. Shorten the sheet cell.'
  );
}
if (pick.negative_prompt.length > PROMPT_MAX) {
  throw new Error('prep_molecule_video_start: ' + pick.creation_id + ' negative_prompt is over ' + PROMPT_MAX + ' characters.');
}

return [
  {
    json: {
      creation_id: pick.creation_id,
      model_video: pick.model_video,
      prompt: prompt,
      start_image_url: still,
      duration: String(pick.hop1_duration_seconds),
      negative_prompt: pick.negative_prompt,
      cfg_scale: pick.cfg_scale,
      poll_seconds: pick.video_poll_seconds,
      max_wait_seconds: pick.video_max_wait_seconds,
    },
  },
];
