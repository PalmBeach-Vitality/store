// n8n Code node: prep_creatomate_concat
// After: openrouter_i2v_extend_poll
// Before: creatomate_concat
// Join two 15s OpenRouter Kling clips on the same Creatomate track into one 30s mp4.

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

var hop2 = ($input.first() && $input.first().json) || {};
var status = String(hop2.status || '').toLowerCase();
var err = hop2.error;
if (err && typeof err === 'object') err = err.message || JSON.stringify(err);
if (status !== 'completed') {
  throw new Error(
    'prep_creatomate_concat: OpenRouter hop 2 status is ' +
      JSON.stringify(hop2.status) +
      (err ? ' error=' + err : '') +
      '. Raise wait_i2v_extend if still pending/in_progress.'
  );
}

var video2 = pickVideoUrl(hop2);
var ext = firstJson('prep_kling_extend');
var video1 = httpsUrl(ext.video_url_15);
if (!video1) {
  throw new Error('prep_creatomate_concat missing video_url_15 from prep_kling_extend.');
}
if (!video2) {
  throw new Error(
    'prep_creatomate_concat hop 2 returned no https video URL. Keys: ' + Object.keys(hop2).join(', ')
  );
}

var pick = firstJson('pick_molecule_creation');
var resolution = String(ext.resolution || pick.resolution || '720p').toLowerCase();
var aspect = String(ext.aspect_ratio || pick.aspect_ratio || '9:16');
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
    output_format: 'mp4',
    width: w,
    height: h,
    snapshot_time: 0.1,
    elements: [
      { type: 'video', source: video1, track: 1 },
      { type: 'video', source: video2, track: 1 },
    ],
  },
};

return [
  {
    json: {
      video_url_15: video1,
      video_url_extend: video2,
      resolution: resolution,
      aspect_ratio: aspect,
      concat_width: w,
      concat_height: h,
      creatomate_url: 'https://api.creatomate.com/v1/renders',
      creatomate_body_json: JSON.stringify(body),
      creation_id: String(pick.creation_id || ext.creation_id || ''),
      compound_name: String(pick.compound_name || ext.compound_name || ''),
      still_url: String(firstJson('save_still_url').still_url || ext.still_url || ''),
    },
  },
];
