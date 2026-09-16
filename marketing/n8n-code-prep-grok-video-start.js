// n8n Code node name: prep_grok_video_start
// Workflow: Vid_gen_lab_scenes -9-lab-items-creations-500
// Mode: Run Once for All Items
// After: grok_imagine_edit_still  (edit)  or  skip_still_edit  (skip)
// Before: fal_kling_generate
//
// HARD RULE: every video generation parameter comes from the sheet via pull_sheet_row.
// This node must not invent camera, motion, duration, aspect_ratio, or resolution.
// Do not append vial lock. Do not truncate. Do not default to push-in.
// still_url may come from Imagine / save_still_url (not a sheet camera param).
//
// VID GEN API: fal.ai. Node fal_kling_generate is the API and reads model_video
// off this node's output, so the sheet owns the tier. Mute with generate_audio: false.
// Keep the silent lock on the sheet motion. Do not rewrite pull_sheet_row.
//
// This node used to pin model_video to the Standard (720p) slug, which silently
// overrode a sheet that said 1080p. Never reintroduce that — read the slug.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function val(obj, names) {
  obj = obj || {};
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return '';
}

function pickUrl(obj) {
  if (!obj || typeof obj !== 'object') return '';
  var candidates = [
    obj.still_url,
    obj.reel_still_url,
    obj.save_still_url,
    obj.data && obj.data[0] && obj.data[0].url,
    obj.url,
  ];
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (typeof c === 'string' && /^https:\/\//i.test(c.trim())) return c.trim();
  }
  return '';
}

function requireFromSheet(label, value, creationId) {
  var s = String(value == null ? '' : value).trim();
  if (!s) {
    throw new Error(
      'HARD RULE: ' +
        label +
        ' must come from the sheet (creation_id=' +
        (creationId || '?') +
        '). This node will not invent it.'
    );
  }
  return s;
}

function aspectFromSheet(raw, creationId) {
  var s = requireFromSheet('aspect_ratio', raw, creationId)
    .replace(/\u2236/g, ':')
    .replace(/[ \t\n\r]+/g, '');
  if (/^\d+:\d+$/.test(s)) return s;
  // Google Sheets may coerce 9:16 to a time serial (9:16 AM = 0.38611...)
  var n = Number(String(raw).trim());
  if (Number.isFinite(n) && n > 0 && n < 1) {
    var totalMins = Math.round(n * 24 * 60);
    var h = Math.floor(totalMins / 60);
    var m = totalMins % 60;
    return h + ':' + String(m).padStart(2, '0');
  }
  throw new Error(
    'HARD RULE: aspect_ratio on the sheet must be like 9:16 (creation_id=' +
      creationId +
      ', got ' +
      raw +
      ')'
  );
}

var input = $json && typeof $json === 'object' ? $json : {};
var pick = firstJson('pull_sheet_row');
var stillUrl =
  pickUrl(firstJson('grok_imagine_edit_still')) ||
  pickUrl(firstJson('save_edited_still_url')) ||
  pickUrl(input) ||
  pickUrl(firstJson('save_still_url')) ||
  pickUrl(firstJson('grok_imagine_reel_still'));
if (!stillUrl) {
  throw new Error('prep_grok_video_start: still_url missing — run save_still_url first');
}

var creationId = String(val(pick, ['creation_id']) || val(input, ['creation_id']) || '');

function sheetField(names, label) {
  // pull_sheet_row first, then current item. NEVER get_reel_creations (that is sheet row 1).
  var v = val(pick, names);
  if (!String(v).trim()) v = val(input, names);
  return requireFromSheet(label, v, creationId);
}

var motion = sheetField(['video_motion_prompt', 'videoMotionPrompt'], 'video_motion_prompt');
var durationRaw = sheetField(
  ['duration_seconds', 'durationSeconds', 'duration'],
  'duration_seconds'
);
var duration = Number(durationRaw);
if (!Number.isFinite(duration) || duration <= 0) {
  throw new Error(
    'HARD RULE: duration_seconds on the sheet must be a positive number (creation_id=' +
      creationId +
      ', got ' +
      durationRaw +
      ')'
  );
}
// Kling v3 accepts whole seconds from 3 to 15. Anything else 400s at fal, so fail
// here with the row id instead of burning a request.
if (!Number.isInteger(duration) || duration < 3 || duration > 15) {
  throw new Error(
    'Kling v3 I2V accepts 3-15 whole seconds (creation_id=' +
      creationId +
      ', sheet duration_seconds=' +
      durationRaw +
      ')'
  );
}
var modelVideo = sheetField(['model_video', 'modelVideo'], 'model_video');
var resolution = sheetField(['resolution'], 'resolution');
var aspect = aspectFromSheet(
  val(pick, ['aspect_ratio', 'aspectRatio']) || val(input, ['aspect_ratio', 'aspectRatio']),
  creationId
);
var cameraMove = sheetField(['camera_move', 'cameraMove', 'camera'], 'camera_move');

var SILENT_LOCK =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ';
var motionForVideo = SILENT_LOCK + motion;

return [
  {
    json: Object.assign({}, input, {
      still_url: stillUrl,
      reel_still_url: stillUrl,
      video_motion_prompt: motionForVideo,
      model_video: modelVideo,
      duration_seconds: duration,
      duration_label: String(duration),
      resolution: resolution,
      aspect_ratio: aspect,
      camera_move: cameraMove,
      audio: false,
      generate_audio: false,
    }),
  },
];
