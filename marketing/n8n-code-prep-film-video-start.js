// n8n Code node: prep_film_video_start
// Workflow: custom_vid_gen 1.5 -18-motsc-film-stills (film I2V)
// Mode: Run Once for All Items
// After: pick_film_still
// Before: grok_video_start
//
// SHEETS-ONLY motion / model / duration / resolution / audio from pick_film_still.
// still_url is the sheet picked_url (runtime keeper).

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  return /^https:\/\//i.test(s) ? s : '';
}

var input = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_film_still');

var still = httpsUrl(input.still_url) || httpsUrl(input.picked_url) || httpsUrl(pick.still_url) || httpsUrl(pick.picked_url);
if (!still) {
  throw new Error('prep_film_video_start: picked_url / still_url missing from pick_film_still.');
}

var motion = String(input.video_motion_prompt || pick.video_motion_prompt || '').trim();
if (!motion) {
  throw new Error('prep_film_video_start: video_motion_prompt missing from pick_film_still.');
}
if (motion.length > 700) motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';

var modelVideo = String(input.model_video || pick.model_video || '').trim();
if (!modelVideo) {
  throw new Error('prep_film_video_start: model_video missing from pick_film_still.');
}

var duration = Number(input.duration_seconds || pick.duration_seconds);
if (!isFinite(duration) || duration < 1) {
  throw new Error('prep_film_video_start: duration_seconds missing from pick_film_still.');
}

var resolution = String(input.resolution || pick.resolution || '').trim();
if (!resolution) {
  throw new Error('prep_film_video_start: resolution missing from pick_film_still.');
}

var audio = input.audio;
if (audio === undefined) audio = pick.audio;
if (audio !== false && audio !== true) {
  throw new Error('prep_film_video_start: audio must be true or false from pick_film_still.');
}

var body = {
  model: modelVideo,
  prompt: motion,
  image: { url: still },
  duration: duration,
  resolution: resolution,
  audio: audio,
};

return [
  {
    json: {
      still_id: String(input.still_id || pick.still_id || ''),
      category: String(input.category || pick.category || ''),
      still_url: still,
      picked_url: still,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      resolution: resolution,
      audio: audio,
      wait_seconds: Number(input.wait_seconds || pick.wait_seconds || 0),
      grok_video_body_json: JSON.stringify(body),
    },
  },
];
