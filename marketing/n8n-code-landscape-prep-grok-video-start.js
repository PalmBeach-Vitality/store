// n8n Code node: prep_grok_video_start
// Workflow: Vid_gen_landscape_scenes -500-peptide-wellness-scenes
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: save_edited_still_url
// Before: fal_kling_generate
//
// SHEETS-ONLY: model / motion / duration / aspect / resolution from pull_sheet_row.
// still_url is runtime from save_edited_still_url (edit) then save_still_url.
// Audio is the one exception: hard off, never read from the sheet.
//
// VID GEN API: fal.ai. fal_kling_generate reads model_video off this node's output,
// so the sheet owns the tier. Never pin a slug on the node.
// wait_seconds is still required here, but fal_kling_generate polls to completion
// itself, so it no longer drives the video wait. grok_video_body_json is only for
// the disabled Grok path.

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
    obj.source_still_url,
    obj.edited_still_url,
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
      'SHEETS-ONLY: ' + label + ' must come from the sheet (creation_id=' + (creationId || '?') + ').'
    );
  }
  return s;
}

function aspectFromSheet(raw, creationId) {
  var s = requireFromSheet('aspect_ratio', raw, creationId)
    .replace(/\u2236/g, ':')
    .replace(/\s+/g, '');
  if (/^\d+:\d+$/.test(s)) return s;
  throw new Error(
    'SHEETS-ONLY: aspect_ratio on the sheet must be like 9:16 (creation_id=' +
      creationId +
      ', got ' +
      raw +
      ')'
  );
}

var input = ($input.first() && $input.first().json) || {};
var pick = firstJson('pull_sheet_row');
var editedStill = firstJson('save_edited_still_url');
var stillNode = firstJson('save_still_url');
var editHttp = firstJson('grok_imagine_edit_still');

var stillResolved =
  pickUrl(editedStill) || pickUrl(input) || pickUrl(editHttp) || pickUrl(stillNode);
if (!stillResolved) {
  throw new Error('prep_grok_video_start: still_url missing from save_edited_still_url');
}

var creationId = String(val(pick, ['creation_id']) || val(input, ['creation_id']) || '');

function sheetField(names, label) {
  var v = val(pick, names);
  if (!String(v).trim()) v = val(input, names);
  if (!String(v).trim()) v = val(stillNode, names);
  return requireFromSheet(label, v, creationId);
}

var motion = sheetField(['video_motion_prompt', 'videoMotionPrompt'], 'video_motion_prompt');
var modelVideo = sheetField(['model_video', 'modelVideo'], 'model_video');
var durationRaw = sheetField(['duration_seconds', 'durationSeconds', 'duration'], 'duration_seconds');
var duration = Number(durationRaw);
if (!isFinite(duration) || duration <= 0) {
  throw new Error(
    'SHEETS-ONLY: duration_seconds on the sheet must be a positive number (creation_id=' +
      creationId +
      ', got ' +
      durationRaw +
      ')'
  );
}
var resolution = sheetField(['resolution'], 'resolution');
var aspect = aspectFromSheet(
  val(pick, ['aspect_ratio', 'aspectRatio']) ||
    val(input, ['aspect_ratio', 'aspectRatio']) ||
    val(stillNode, ['aspect_ratio', 'aspectRatio']),
  creationId
);
var cameraMove = sheetField(['camera_move', 'cameraMove', 'camera'], 'camera_move');
var waitRaw = sheetField(['wait_seconds', 'waitSeconds'], 'wait_seconds');
var waitSeconds = Number(waitRaw);
if (!isFinite(waitSeconds) || waitSeconds <= 0) {
  throw new Error(
    'SHEETS-ONLY: wait_seconds on the sheet must be a positive number (creation_id=' +
      creationId +
      ', got ' +
      waitRaw +
      ')'
  );
}

// Salvatore: audio is off on all three vid-gen workflows, always. The sheet audio
// column is not read here. The API flag alone has let Grok score a clip, so the
// motion prompt carries the same silent lock as lab and pen.
var SILENT_LOCK =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ';
var motionForVideo = motion.indexOf('Silent video') === -1 ? SILENT_LOCK + motion : motion;

var body = {
  model: modelVideo,
  prompt: motionForVideo,
  image: { url: stillResolved },
  duration: duration,
  aspect_ratio: aspect,
  resolution: resolution,
  audio: false,
};

return [
  {
    json: Object.assign({}, input, {
      still_url: stillResolved,
      reel_still_url: stillResolved,
      video_motion_prompt: motionForVideo,
      model_video: modelVideo,
      duration_seconds: duration,
      resolution: resolution,
      aspect_ratio: aspect,
      camera_move: cameraMove,
      audio: false,
      generate_audio: false,
      wait_seconds: waitSeconds,
      grok_video_body_json: JSON.stringify(body),
      creation_id: creationId,
    }),
  },
];
