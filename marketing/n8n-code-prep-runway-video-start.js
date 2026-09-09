// n8n Code node: prep_runway_video_start
// Workflow: film_i2v_runway
// Mode: Run Once for All Items
// After: pick_film_still
// Before: runway_video_start
//
// SHEETS-ONLY. Body fields come from pick_film_still. Empty cells already threw.

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
  throw new Error('prep_runway_video_start: picked_url / still_url missing from pick_film_still.');
}

var motion = String(input.video_motion_prompt || pick.video_motion_prompt || '').trim();
if (!motion) {
  throw new Error('prep_runway_video_start: video_motion_prompt missing from pick_film_still.');
}

var modelVideo = String(input.model_video || pick.model_video || '').trim();
if (!modelVideo) {
  throw new Error('prep_runway_video_start: model_video missing from pick_film_still.');
}

var duration = Number(input.duration_seconds || pick.duration_seconds);
if (!isFinite(duration) || duration < 1) {
  throw new Error('prep_runway_video_start: duration_seconds missing from pick_film_still.');
}

var ratio = String(input.video_aspect_ratio || pick.video_aspect_ratio || '').trim();
if (!ratio) {
  throw new Error('prep_runway_video_start: video_aspect_ratio missing from pick_film_still.');
}

var startUrl = String(input.video_start_url || pick.video_start_url || '').trim();
if (!startUrl) {
  throw new Error('prep_runway_video_start: video_start_url missing from pick_film_still.');
}

var body = {
  model: modelVideo,
  promptText: motion,
  promptImage: still,
  ratio: ratio,
  duration: duration,
};

return [
  {
    json: {
      still_id: String(input.still_id || pick.still_id || ''),
      category: String(input.category || pick.category || ''),
      still_url: still,
      picked_url: still,
      video_motion_prompt: motion,
      video_provider: 'runway',
      model_video: modelVideo,
      duration_seconds: duration,
      video_aspect_ratio: ratio,
      wait_seconds: Number(input.wait_seconds || pick.wait_seconds || 0),
      video_start_url: startUrl,
      runway_video_body_json: JSON.stringify(body),
    },
  },
];
