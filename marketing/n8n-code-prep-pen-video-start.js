// n8n Code node: prep_pen_video_start
// Workflow: peptide_pen_vid_gen
// Mode: Run Once for All Items
// After: save_edited_still_url (edit) or skip_still_edit (skip)
// Before: grok_video_start
//
// SHEETS-ONLY for model / duration / resolution / motion.
// still_url is runtime: prefer edited still, then save_still_url, then original imagine.
// audio: false is the mute lock (not a look fallback).

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

function mustStr(v, label) {
  var s = String(v || '').trim();
  if (!s) throw new Error('prep_pen_video_start: empty ' + label);
  return s;
}

function pickUrl(obj) {
  if (!obj || typeof obj !== 'object') return '';
  return (
    httpsUrl(obj.still_url) ||
    httpsUrl(obj.source_still_url) ||
    httpsUrl(obj.data && obj.data[0] && obj.data[0].url) ||
    httpsUrl(obj.url) ||
    ''
  );
}

var input = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_pen_creation');
var saveStill = firstJson('save_still_url');
var editedStill = firstJson('save_edited_still_url');
var editHttp = firstJson('grok_imagine_edit_still');
var imagine = firstJson('grok_imagine_pen_still');

var still =
  pickUrl(editHttp) ||
  pickUrl(editedStill) ||
  httpsUrl(input.still_url) ||
  pickUrl(saveStill) ||
  pickUrl(imagine) ||
  '';

if (!still) {
  throw new Error(
    'prep_pen_video_start: still_url missing. Run save_still_url, then either still_edit_instructions or skip_still_edit.'
  );
}

var motion = String(
  input.video_motion_prompt || pick.video_motion_prompt || saveStill.video_motion_prompt || ''
).trim();
if (!motion) {
  throw new Error('prep_pen_video_start: video_motion_prompt missing from pick_pen_creation.');
}
if (motion.indexOf('Silent video') === -1) {
  motion =
    'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ' + motion;
}
if (motion.length > 700) {
  motion = motion.slice(0, 697);
  var sp = motion.lastIndexOf(' ');
  if (sp > 600) motion = motion.slice(0, sp);
  motion = motion + '.';
}

var modelVideo = mustStr(
  input.model_video || pick.model_video || saveStill.model_video,
  'model_video'
);
var duration = Number(input.duration_seconds || pick.duration_seconds || saveStill.duration_seconds);
if (!duration) {
  throw new Error('prep_pen_video_start: duration_seconds missing from pick_pen_creation.');
}
var resolution = mustStr(
  input.resolution || pick.resolution || saveStill.resolution,
  'resolution'
);

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
