// n8n Code node: prep_seedance_video_start
// Type: Code | Mode: Run Once for All Items
// After: save_still_url
// Before: openrouter_i2v_start
//
// Builds an OpenRouter Seedance I2V body from today's Grok still.
// generate_audio: false — PBVita adds music manually after Creatomate.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function val(obj, names, fallback) {
  if (fallback === undefined) fallback = '';
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj && obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return fallback;
}

function asciiPrompt(s) {
  return String(s || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00d7/g, 'x')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requireText(value, label) {
  var v = String(value == null ? '' : value).trim();
  if (!v) {
    throw new Error('SHEETS-ONLY: prep_seedance_video_start missing ' + label + '.');
  }
  return v;
}

function assertOpenRouterModel(model) {
  var m = String(model || '').trim();
  if (!m) {
    throw new Error('SHEETS-ONLY: model_video is empty. Set bytedance/seedance-2.5.');
  }
  if (m.indexOf('fal-ai/') === 0 || m.indexOf('fal.run/') !== -1) {
    throw new Error('model_video is still a fal slug (' + m + '). Set bytedance/seedance-2.5.');
  }
  return m;
}

var input = ($input.first() && $input.first().json) || {};
var stillNode = firstJson('save_still_url');
var pick = firstJson('pick_creation');
if (!pick.creation_id) pick = firstJson('pick_seedance_scene');
var imagine = firstJson('grok_imagine_reel_still');

var stillResolved = String(
  val(input, ['still_url']) ||
    val(stillNode, ['still_url']) ||
    (input.data && input.data[0] && input.data[0].url) ||
    (stillNode.data && stillNode.data[0] && stillNode.data[0].url) ||
    (imagine.data && imagine.data[0] && imagine.data[0].url) ||
    ''
).trim();

if (stillResolved.indexOf('https://') !== 0 && stillResolved.indexOf('HTTPS://') !== 0) {
  throw new Error(
    'prep_seedance_video_start: still_url must be a public https URL. Got: ' +
      JSON.stringify(stillResolved).slice(0, 160)
  );
}

var motion = asciiPrompt(
  val(input, ['video_motion_prompt']) ||
    val(stillNode, ['video_motion_prompt']) ||
    val(pick, ['video_motion_prompt'], '')
);
if (!motion) {
  throw new Error('SHEETS-ONLY: video_motion_prompt missing from the picked row.');
}

var model = assertOpenRouterModel(val(input, ['model_video']) || val(pick, ['model_video']) || val(stillNode, ['model_video']));
var duration = Number(val(input, ['duration_seconds']) || val(pick, ['duration_seconds']));
if (!isFinite(duration) || duration < 4 || duration > 30) {
  throw new Error('SHEETS-ONLY: duration_seconds must be 4–30 for OpenRouter Seedance 2.5.');
}
var resolution = requireText(val(input, ['resolution']) || val(pick, ['resolution']), 'resolution');
var aspect = requireText(val(input, ['aspect_ratio']) || val(pick, ['aspect_ratio']), 'aspect_ratio');
var waitSeconds = Number(val(input, ['wait_seconds']) || val(pick, ['wait_seconds'], 180));
if (!isFinite(waitSeconds) || waitSeconds < 1) waitSeconds = 180;

var audioRaw = val(input, ['audio', 'generate_audio']) || val(pick, ['audio', 'generate_audio'], false);
var generate_audio = audioRaw === true || String(audioRaw).toLowerCase() === 'true';

var body = {
  model: model,
  prompt: motion,
  duration: duration,
  resolution: resolution,
  aspect_ratio: aspect,
  generate_audio: generate_audio,
  frame_images: [
    {
      type: 'image_url',
      image_url: { url: stillResolved },
      frame_type: 'first_frame',
    },
  ],
};

return [
  {
    json: {
      still_url: stillResolved,
      video_motion_prompt: motion,
      creation_id: String(val(pick, ['creation_id']) || val(stillNode, ['creation_id'], '')),
      compound_name: asciiPrompt(val(pick, ['compound_name'], '')),
      model_video: model,
      duration_seconds: duration,
      resolution: resolution,
      aspect_ratio: aspect,
      generate_audio: generate_audio,
      wait_seconds: waitSeconds,
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: JSON.stringify(body),
    },
  },
];
