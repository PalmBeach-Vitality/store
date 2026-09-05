// n8n Code node: parse_openrouter_video / save_film_video_url / save_video_url
// After: openrouter_i2v_poll
// Reads OpenRouter job JSON (status + unsigned_urls).

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

function pickOpenRouterVideoUrl(obj) {
  obj = obj || {};
  if (Array.isArray(obj.unsigned_urls) && obj.unsigned_urls.length) {
    return httpsUrl(obj.unsigned_urls[0]);
  }
  return (
    httpsUrl(obj.video && obj.video.url) ||
    httpsUrl(obj.video_url) ||
    httpsUrl(obj.url) ||
    httpsUrl(obj.data && obj.data.video && obj.data.video.url) ||
    ''
  );
}

var poll = ($input.first() && $input.first().json) || {};
var status = String(poll.status || '').toLowerCase();
var err = poll.error;
if (err && typeof err === 'object') err = err.message || JSON.stringify(err);
if (status !== 'completed') {
  throw new Error(
    'OpenRouter video status is ' +
      JSON.stringify(poll.status) +
      (err ? ' error=' + err : '') +
      '. Raise wait_seconds if still pending/in_progress.'
  );
}

var video = pickOpenRouterVideoUrl(poll);
if (!video) {
  throw new Error(
    'OpenRouter completed but returned no https video URL. Keys: ' + Object.keys(poll).join(', ')
  );
}

var pick = firstJson('pick_film_still');
if (!pick.still_id) pick = firstJson('pick_seedance_scene');
if (!pick.still_id && !pick.creation_id) pick = firstJson('pick_molecule_creation');

var stillId = String(pick.still_id || '').trim();
var creationId = String(pick.creation_id || '').trim();

var out = {
  video_url: video,
  video_request_id: String(poll.id || poll.generation_id || '').trim(),
  request_id: String(poll.id || poll.generation_id || '').trim(),
  last_used_at: $now.toISO(),
  model_video: String(pick.model_video || ''),
  video_provider: String(pick.video_provider || ''),
  duration_seconds: pick.duration_seconds,
};

if (stillId) out.still_id = stillId;
if (creationId) {
  out.creation_id = creationId;
  out.compound_name = String(pick.compound_name || '');
  out.times_used = Number(pick.creation_times_used || 0) + 1;
  out.resolution = String(pick.resolution || '');
}

return [{ json: out }];
