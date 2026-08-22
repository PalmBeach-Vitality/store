// n8n Code node: prep_molecule_video_start
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// After: save_still_url
// Before: grok_video_start

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
motion =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. No text, no captions, no logos appear. Cellular reaction continues. ' +
  motion;
if (motion.length > 700) {
  motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';
}
if (!motion) {
  throw new Error('prep_molecule_video_start: video_motion_prompt missing from pick_molecule_creation.');
}

var modelVideo = String(
  input.model_video || pick.model_video || saveStill.model_video || 'grok-imagine-video-1.5'
).trim();
var duration = Number(input.duration_seconds || pick.duration_seconds || saveStill.duration_seconds || 15) || 15;
var resolution = String(input.resolution || pick.resolution || saveStill.resolution || '1080p').trim();

var body = {
  model: modelVideo,
  prompt: motion,
  image: { url: still },
  duration: duration,
  resolution: resolution,
  audio: false,
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
      grok_video_body_json: JSON.stringify(body),
    },
  },
];
