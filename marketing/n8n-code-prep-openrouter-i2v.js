// n8n Code node: prep_openrouter_i2v
// After: pick_film_still
// Before: openrouter_i2v_start
// Sheets-only OpenRouter I2V body. Model / duration / resolution / audio from Sheet 18.

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

function requireText(value, label, stillId) {
  var v = String(value == null ? '' : value).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: missing ' + label + (stillId ? ' (still_id=' + stillId + ')' : '') + '.'
    );
  }
  return v;
}

function assertOpenRouterModel(model, stillId) {
  var m = String(model || '').trim();
  if (!m) {
    throw new Error('SHEETS-ONLY: model_video empty (still_id=' + (stillId || '?') + ').');
  }
  if (m.indexOf('fal-ai/') === 0 || m.indexOf('fal.run/') !== -1) {
    throw new Error(
      'model_video is still a fal slug (' +
        m +
        '). Run overlay_film_i2v_stack after the OpenRouter overlay, still_id=' +
        (stillId || '?')
    );
  }
  return m;
}

var pick = ($input.first() && $input.first().json) || firstJson('pick_film_still');
var stillId = String(pick.still_id || '').trim();
var still = httpsUrl(pick.still_url || pick.picked_url);
if (!still) {
  throw new Error('prep_openrouter_i2v still_url missing (still_id=' + (stillId || '?') + ').');
}

var model = assertOpenRouterModel(pick.model_video, stillId);
var motion = requireText(pick.video_motion_prompt, 'video_motion_prompt', stillId);
var duration = Number(pick.duration_seconds);
if (!isFinite(duration) || duration < 1) {
  throw new Error('SHEETS-ONLY: duration_seconds must be a number (still_id=' + stillId + ').');
}
var resolution = requireText(pick.resolution, 'resolution', stillId);
var waitSeconds = Number(pick.wait_seconds);
if (!isFinite(waitSeconds) || waitSeconds < 1) {
  throw new Error('SHEETS-ONLY: wait_seconds must be a number (still_id=' + stillId + ').');
}
var audio = pick.generate_audio;
if (audio !== true && audio !== false) {
  throw new Error('SHEETS-ONLY: audio/generate_audio must be boolean (still_id=' + stillId + ').');
}

var startUrl = String(pick.video_start_url || '').trim();
if (startUrl && startUrl.indexOf('openrouter.ai') === -1) {
  throw new Error(
    'video_start_url is not OpenRouter (' +
      startUrl +
      '). Overlay Sheet 18 video_start_url to https://openrouter.ai/api/v1/videos.'
  );
}

var body = {
  model: model,
  prompt: motion,
  duration: duration,
  resolution: resolution,
  generate_audio: audio,
  frame_images: [
    {
      type: 'image_url',
      image_url: { url: still },
      frame_type: 'first_frame',
    },
  ],
};

var aspect = String(pick.video_aspect_ratio || '').trim();
if (aspect && aspect !== 'auto') body.aspect_ratio = aspect;

return [
  {
    json: {
      still_id: stillId,
      still_url: still,
      video_motion_prompt: motion,
      video_provider: String(pick.video_provider || ''),
      model_video: model,
      duration_seconds: duration,
      resolution: resolution,
      video_aspect_ratio: aspect,
      generate_audio: audio,
      wait_seconds: waitSeconds,
      video_start_url: startUrl || 'https://openrouter.ai/api/v1/videos',
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: JSON.stringify(body),
    },
  },
];
