// n8n Code node: save_film_video_url
// Workflows: film_i2v_seedance | film_i2v_kling | film_i2v_veo
// Mode: Run Once for All Items
// After: fal_i2v_generate
// Before: sheets_update_still
//
// Runtime video URL only. Prompt / model stay on the picked sheet row.

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

function pickUrl(obj) {
  if (!obj || typeof obj !== 'object') return '';
  return (
    httpsUrl(obj.video && obj.video.url) ||
    httpsUrl(obj.video_url) ||
    httpsUrl(obj.url) ||
    httpsUrl(obj.data && obj.data.video && obj.data.video.url) ||
    httpsUrl(obj.output && obj.output.video && obj.output.video.url) ||
    ''
  );
}

var fal = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_film_still');

var video_url = pickUrl(fal);
if (!video_url) {
  throw new Error(
    'save_film_video_url: fal_i2v_generate returned no https video URL. Keys: ' + Object.keys(fal).join(', ')
  );
}

var stillId = String(pick.still_id || '').trim();
if (!stillId) {
  throw new Error('save_film_video_url: missing still_id from pick_film_still.');
}

return [
  {
    json: {
      still_id: stillId,
      video_url: video_url,
      video_request_id: String(fal.request_id || fal.requestId || fal.requestID || '').trim(),
      last_used_at: $now.toISO(),
      model_video: String(pick.model_video || ''),
      video_provider: String(pick.video_provider || ''),
      duration_seconds: pick.duration_seconds,
    },
  },
];
