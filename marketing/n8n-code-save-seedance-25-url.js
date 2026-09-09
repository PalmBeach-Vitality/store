// n8n Code node: save_video_url
// Workflow: seedance_25_vid_gen
// Mode: Run Once for All Items
// After: fal_seedance_generate
// Before: sheets_update_seedance
//
// Runtime URLs only. Prompt / model / duration stay on the picked sheet row.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  return s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0 ? s : '';
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
var pick = firstJson('pick_seedance_scene');
var video_url = pickUrl(fal);
if (!video_url) {
  throw new Error(
    'save_video_url: fal_seedance_generate returned no https video URL. Keys: ' +
      Object.keys(fal).join(', ')
  );
}

var request_id = String(
  fal.request_id || fal.requestId || fal.requestID || pick.request_id || ''
).trim();

var used = Number(pick.creation_times_used || 0) + 1;

return [
  {
    json: {
      creation_id: String(pick.creation_id || ''),
      compound_name: String(pick.compound_name || ''),
      video_url: video_url,
      request_id: request_id,
      times_used: used,
      last_used_at: $now.toISO(),
      model_video: String(pick.model_video || ''),
      duration_seconds: pick.duration_seconds,
      resolution: String(pick.resolution || ''),
    },
  },
];
