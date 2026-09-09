// n8n Code node: save_film_video_url
// Workflow: film_i2v_runway
// Mode: Run Once for All Items
// After: runway_video_poll
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
  var output = obj.output;
  if (Array.isArray(output) && output[0]) {
    return httpsUrl(typeof output[0] === 'string' ? output[0] : output[0].url);
  }
  return (
    httpsUrl(obj.video && obj.video.url) ||
    httpsUrl(obj.video_url) ||
    httpsUrl(obj.url) ||
    ''
  );
}

var poll = ($input.first() && $input.first().json) || {};
var start = firstJson('runway_video_start');
var prep = firstJson('prep_runway_video_start');
var pick = firstJson('pick_film_still');

var status = String(poll.status || poll.state || '').toLowerCase();
if (status && status !== 'succeeded' && status !== 'success' && status !== 'done') {
  throw new Error(
    'save_film_video_url: runway_video_poll status=' +
      status +
      '. Attach the Runway key and re-run, or wait longer.'
  );
}

var video_url = pickUrl(poll) || pickUrl(start);
if (!video_url) {
  throw new Error(
    'save_film_video_url: runway_video_poll returned no https video URL. keys=' + Object.keys(poll).join(', ')
  );
}

var stillId = String(prep.still_id || pick.still_id || '').trim();
if (!stillId) {
  throw new Error('save_film_video_url: missing still_id from pick_film_still.');
}

return [
  {
    json: {
      still_id: stillId,
      video_url: video_url,
      video_request_id: String(start.id || poll.id || '').trim(),
      last_used_at: $now.toISO(),
      model_video: String(prep.model_video || pick.model_video || ''),
      video_provider: 'runway',
      duration_seconds: prep.duration_seconds || pick.duration_seconds,
    },
  },
];
