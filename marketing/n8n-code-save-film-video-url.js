// n8n Code node: save_film_video_url
// Workflow: custom_vid_gen 1.5 -18-motsc-film-stills (film I2V)
// Mode: Run Once for All Items
// After: grok_video_poll
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
    ''
  );
}

var poll = ($input.first() && $input.first().json) || {};
var start = firstJson('grok_video_start');
var prep = firstJson('prep_film_video_start');
var pick = firstJson('pick_film_still');

var video_url = pickUrl(poll) || pickUrl(start);
if (!video_url) {
  throw new Error(
    'save_film_video_url: grok_video_poll returned no https video URL. status=' +
      String(poll.status || '') +
      ' keys=' +
      Object.keys(poll).join(', ')
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
      video_request_id: String(start.request_id || poll.request_id || '').trim(),
      last_used_at: $now.toISO(),
      model_video: String(prep.model_video || pick.model_video || ''),
      duration_seconds: prep.duration_seconds || pick.duration_seconds,
    },
  },
];
