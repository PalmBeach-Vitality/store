// n8n Code node: prep_pen_video_start
// Workflow: peptide_pen_vid_gen
// Mode: Run Once for All Items
// After: skip_still_edit (skip) or save_edited_still_url (edit)
// Before: grok_video_start
//
// SHEETS-ONLY. Motion / model / duration / resolution from pull_sheet_row.
// Do not truncate. Do not invent a fallback prompt.
// Fail if Sheet 14 motion contains vial / flip-off language (I2V morphs the pen).

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
  var s = String(v == null ? '' : v).trim();
  if (!s) {
    throw new Error('prep_pen_video_start: empty ' + label + ' — fill it on Sheet 14');
  }
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
var pick = firstJson('pull_sheet_row');
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
    'prep_pen_video_start: still_url missing. Run save_still_url, then still_edit_instructions or skip_still_edit.'
  );
}

var motion = mustStr(pick.video_motion_prompt || input.video_motion_prompt, 'video_motion_prompt');
if (
  /vial visual lock|flip-?off|clear glass research vial|10ml sterile multi-use vial|uncap|pop off/i.test(
    motion
  )
) {
  throw new Error(
    'prep_pen_video_start: video_motion_prompt on Sheet 14 still has vial/flip-off language. Fix the sheet — I2V will morph the pen.'
  );
}
if (motion.indexOf('Silent video') === -1) {
  motion =
    'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ' +
    motion;
}

var modelVideo = mustStr(pick.model_video || input.model_video, 'model_video');
var durationRaw = mustStr(pick.duration_seconds || input.duration_seconds, 'duration_seconds');
var duration = Number(durationRaw);
if (!Number.isFinite(duration) || duration <= 0) {
  throw new Error('prep_pen_video_start: duration_seconds on Sheet 14 must be a positive number');
}
var resolution = mustStr(pick.resolution || input.resolution, 'resolution');

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
      creation_id: String(pick.creation_id || input.creation_id || ''),
      compound_name: String(pick.compound_name || input.compound_name || ''),
      grok_video_body_json: JSON.stringify(body),
    },
  },
];
