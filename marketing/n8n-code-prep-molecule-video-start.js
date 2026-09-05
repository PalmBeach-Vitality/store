// n8n Code node: prep_molecule_video_start
// After: save_still_url
// Before: openrouter_i2v_start
// Grok still. OpenRouter Kling I2V via POST /api/v1/videos.
// Hop 1 duration is always the sheet duration (15s). Hop 2 + Creatomate join makes 30s.

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

function requireText(value, label) {
  var v = String(value == null ? '' : value).trim();
  if (!v) {
    throw new Error('SHEETS-ONLY: prep_molecule_video_start missing ' + label + '.');
  }
  return v;
}

function assertOpenRouterModel(model) {
  var m = String(model || '').trim();
  if (!m) {
    throw new Error('SHEETS-ONLY: model_video is empty on 13-chem-breakdown-54.');
  }
  if (m.indexOf('fal-ai/') === 0 || m.indexOf('grok-imagine-video') === 0) {
    throw new Error(
      'Sheet 13 model_video must be an OpenRouter slug (kwaivgi/kling-v3.0-pro). Got: ' + m
    );
  }
  return m;
}

var input = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_molecule_creation');
var saveStill = firstJson('save_still_url');
var imagine = firstJson('grok_imagine_molecule_still');

var still =
  httpsUrl(input.still_url) ||
  httpsUrl(saveStill.still_url) ||
  httpsUrl(imagine.data && imagine.data[0] && imagine.data[0].url) ||
  '';

if (!still) {
  throw new Error(
    'prep_molecule_video_start still_url missing. save_still_url must be the Grok still URL.'
  );
}

var motion = String(
  input.video_motion_prompt || pick.video_motion_prompt || saveStill.video_motion_prompt || ''
).trim();
if (!motion) {
  throw new Error('prep_molecule_video_start video_motion_prompt missing from pick_molecule_creation.');
}
motion =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. No text, no captions, no logos appear. Cellular reaction continues. ' +
  motion;
if (motion.length > 2500) {
  motion = motion.slice(0, 2497) + '.';
}

var modelVideo = assertOpenRouterModel(
  input.model_video || pick.model_video || saveStill.model_video || ''
);
var duration = Number(input.duration_seconds || pick.duration_seconds || saveStill.duration_seconds);
if (!isFinite(duration) || duration < 3 || duration > 15) {
  throw new Error(
    'SHEETS-ONLY: duration_seconds must be 3–15 for OpenRouter Kling (got ' +
      JSON.stringify(input.duration_seconds || pick.duration_seconds) +
      ').'
  );
}
var resolution = requireText(input.resolution || pick.resolution || saveStill.resolution, 'resolution');
var aspect = requireText(input.aspect_ratio || pick.aspect_ratio || '9:16', 'aspect_ratio');
var waitSeconds = Number(input.wait_seconds || pick.wait_seconds || 180);
if (!isFinite(waitSeconds) || waitSeconds < 1) waitSeconds = 180;

var body = {
  model: modelVideo,
  prompt: motion,
  duration: duration,
  resolution: resolution,
  aspect_ratio: aspect,
  generate_audio: false,
  frame_images: [
    {
      type: 'image_url',
      image_url: { url: still },
      frame_type: 'first_frame',
    },
  ],
};

return [
  {
    json: {
      still_url: still,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      generate_audio: false,
      resolution: resolution,
      aspect_ratio: aspect,
      wait_seconds: waitSeconds,
      creation_id: String(input.creation_id || pick.creation_id || ''),
      compound_name: String(input.compound_name || pick.compound_name || ''),
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: JSON.stringify(body),
    },
  },
];
