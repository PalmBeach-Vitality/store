// n8n Code node: prep_openrouter_t2v
// After: pick_seedance_scene
// Before: openrouter_t2v_start
// Sheets-only OpenRouter T2V. No fal. No bitrate_mode passthrough (OpenRouter rejects it).

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

function requireText(value, label, creationId) {
  var v = String(value == null ? '' : value).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: missing ' + label + ' on ' + (creationId || '?') + '. Fill 17-seedance-25-t2v.'
    );
  }
  return v;
}

function assertOpenRouterModel(model, creationId) {
  var m = String(model || '').trim();
  if (!m) {
    throw new Error('SHEETS-ONLY: model_video empty on ' + (creationId || '?') + '.');
  }
  if (m.indexOf('fal-ai/') === 0 || m.indexOf('fal.run/') !== -1) {
    throw new Error(
      'model_video is still a fal slug (' +
        m +
        ') on ' +
        (creationId || '?') +
        '. Set bytedance/seedance-2.5.'
    );
  }
  return m;
}

var pick = ($input.first() && $input.first().json) || {};
var creationId = String(pick.creation_id || '').trim();
var model = assertOpenRouterModel(pick.model_video, creationId);
var prompt = requireText(pick.video_prompt, 'video_prompt', creationId);
var duration = Number(pick.duration_seconds);
if (!isFinite(duration) || duration < 4 || duration > 30) {
  throw new Error(
    'SHEETS-ONLY: duration_seconds must be 4–30 for OpenRouter Seedance 2.5 (creation_id=' +
      creationId +
      ', got ' +
      JSON.stringify(pick.duration_seconds) +
      ').'
  );
}
var resolution = requireText(pick.resolution, 'resolution', creationId);
var aspect = requireText(pick.aspect_ratio, 'aspect_ratio', creationId);
var waitSeconds = Number(pick.wait_seconds);
if (!isFinite(waitSeconds) || waitSeconds < 1) {
  throw new Error('SHEETS-ONLY: wait_seconds must be a number on ' + creationId + '.');
}
var audio = pick.generate_audio;
if (audio !== true && audio !== false) {
  throw new Error('SHEETS-ONLY: audio must be boolean on ' + creationId + '.');
}

var body = {
  model: model,
  prompt: prompt,
  duration: duration,
  resolution: resolution,
  aspect_ratio: aspect,
  generate_audio: audio,
};

return [
  {
    json: {
      creation_id: creationId,
      compound_name: String(pick.compound_name || ''),
      video_prompt: prompt,
      model_video: model,
      duration_seconds: duration,
      resolution: resolution,
      aspect_ratio: aspect,
      generate_audio: audio,
      wait_seconds: waitSeconds,
      creation_times_used: pick.creation_times_used,
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: JSON.stringify(body),
    },
  },
];
