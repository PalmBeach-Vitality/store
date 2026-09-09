// n8n Code node: prep_last_frame
// After: openrouter_i2v_poll
// Before: creatomate_last_frame
// Creatomate snapshot of hop 1 last frame. Replaces fal-ai/ffmpeg-api/extract-frame.

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

function pickVideoUrl(obj) {
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

var hop1 = ($input.first() && $input.first().json) || {};
var start = firstJson('prep_molecule_video_start');
var pick = firstJson('pick_molecule_creation');

var status = String(hop1.status || '').toLowerCase();
var err = hop1.error;
if (err && typeof err === 'object') err = err.message || JSON.stringify(err);
if (status !== 'completed') {
  throw new Error(
    'prep_last_frame: OpenRouter hop 1 status is ' +
      JSON.stringify(hop1.status) +
      (err ? ' error=' + err : '') +
      '. Raise wait_i2v if still pending/in_progress.'
  );
}

var video1 = pickVideoUrl(hop1);
if (!video1) {
  throw new Error(
    'prep_last_frame: openrouter_i2v_poll returned no https video URL. Keys: ' +
      Object.keys(hop1).join(', ')
  );
}

var duration = Number(start.duration_seconds || pick.duration_seconds || 15);
var snapshot = duration > 0.2 ? duration - 0.1 : 0.1;
var resolution = String(start.resolution || pick.resolution || '720p').toLowerCase();
var aspect = String(start.aspect_ratio || pick.aspect_ratio || '9:16');
var w = 720;
var h = 1280;
if (resolution === '1080p') {
  w = 1080;
  h = 1920;
}
if (resolution === '4k') {
  w = 2160;
  h = 3840;
}
if (aspect === '16:9') {
  var tmp = w;
  w = h;
  h = tmp;
}
if (aspect === '1:1') {
  h = w;
}

var body = {
  source: {
    output_format: 'jpg',
    width: w,
    height: h,
    snapshot_time: snapshot,
    elements: [{ type: 'video', source: video1 }],
  },
};

return [
  {
    json: {
      video_url_15: video1,
      snapshot_time: snapshot,
      snapshot_width: w,
      snapshot_height: h,
      creation_id: String(pick.creation_id || start.creation_id || ''),
      compound_name: String(pick.compound_name || start.compound_name || ''),
      creatomate_url: 'https://api.creatomate.com/v1/renders',
      creatomate_body_json: JSON.stringify(body),
    },
  },
];
