// n8n Code node: prep_molecule_video_start
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// After: save_still_url
// Before: kling_i2v_start
//
// kie.ai Kling I2V (single Bearer API key — no Secret Key).
// Still stays Grok. Video is POST /api/v1/jobs/createTask.

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

function kieResolution(resolution) {
  var r = String(resolution || '').trim().toLowerCase();
  if (r === '720p' || r === '1080p' || r === '4k') return r;
  throw new Error(
    'prep_molecule_video_start: resolution must be 720p, 1080p, or 4k from the picked Sheet 13 row. Got: ' +
      JSON.stringify(resolution)
  );
}

function kieDuration(raw) {
  var duration = Number(raw);
  if (!duration || duration !== Math.floor(duration) || duration < 3 || duration > 15) {
    throw new Error(
      'prep_molecule_video_start: duration_seconds must be an integer 3-15 from the picked Sheet 13 row. Got: ' +
        JSON.stringify(raw)
    );
  }
  return duration;
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
    'prep_molecule_video_start: still_url missing. save_still_url must be ={{ $json.data[0].url }} from grok_imagine_molecule_still.'
  );
}

var motion = String(
  input.video_motion_prompt || pick.video_motion_prompt || saveStill.video_motion_prompt || ''
).trim();
if (!motion) {
  throw new Error('prep_molecule_video_start: video_motion_prompt missing from pick_molecule_creation.');
}
motion =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. No text, no captions, no logos appear. Cellular reaction continues. ' +
  motion;
if (motion.length > 3072) {
  motion = motion.slice(0, 3069) + '.';
}

var modelVideo = String(input.model_video || pick.model_video || saveStill.model_video || '').trim();
if (!modelVideo) {
  throw new Error(
    'prep_molecule_video_start: model_video missing. Overlay Sheet 13 model_video to kling-3.0-omni/image-to-video.'
  );
}
if (modelVideo.indexOf('grok') !== -1) {
  throw new Error(
    'prep_molecule_video_start: model_video is still ' +
      modelVideo +
      '. Overlay Sheet 13 model_video to kling-3.0-omni/image-to-video first.'
  );
}

var duration = kieDuration(input.duration_seconds || pick.duration_seconds || saveStill.duration_seconds);
var resolution = kieResolution(input.resolution || pick.resolution || saveStill.resolution);

var body = {
  model: modelVideo,
  input: {
    prompt: motion,
    image_urls: [still],
    duration: duration,
    resolution: resolution,
    audio: false,
  },
};

return [
  {
    json: {
      still_url: still,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      resolution: resolution,
      creation_id: String(input.creation_id || pick.creation_id || ''),
      compound_name: String(input.compound_name || pick.compound_name || ''),
      kling_start_url: 'https://api.kie.ai/api/v1/jobs/createTask',
      kling_i2v_body_json: JSON.stringify(body),
    },
  },
];
