// n8n Code node: prep_grok_video_start
// Mode: Run Once for All Items
// After: save_edited_still_url
// Before: grok_video_start
//
// SHEETS-ONLY: model / motion / duration / resolution from Sheet via pick_creation / map_sheet_fields.
// still_url is runtime from save_edited_still_url.

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

function pickHttpsUrl(list) {
  for (var i = 0; i < list.length; i++) {
    var s = String(list[i] || '').trim();
    if (/^https:\/\//i.test(s)) return s;
  }
  return '';
}

var input = ($input.first() && $input.first().json) || {};
var sheet = firstJson('map_sheet_fields');
if (!Object.keys(sheet).length) sheet = firstJson('pick_creation');
if (!Object.keys(sheet).length) sheet = firstJson('import_still_from_sheet');
var editedStill = firstJson('save_edited_still_url');
var editInstructions = firstJson('still_edit_instructions');
var importStill = firstJson('import_still_url');
var stillNode = firstJson('save_still_url');
var imagine = firstJson('grok_imagine_reel_still');
var editHttp = firstJson('grok_imagine_edit_still');

var stillResolved = pickHttpsUrl([
  // Prefer THIS run's edit output first (never an old scale still)
  editHttp.data && editHttp.data[0] && editHttp.data[0].url,
  val(input, ['still_url', 'source_still_url', 'edited_still_url']),
  input.data && input.data[0] && input.data[0].url,
  input.url,
  val(editedStill, ['still_url']),
  editedStill.data && editedStill.data[0] && editedStill.data[0].url,
  val(stillNode, ['still_url']),
  stillNode.data && stillNode.data[0] && stillNode.data[0].url,
  // Original generate still is LAST resort only
  imagine.data && imagine.data[0] && imagine.data[0].url,
]);

var motion = String(
  val(input, ['video_motion_prompt']) ||
    val(stillNode, ['video_motion_prompt']) ||
    val(editedStill, ['video_motion_prompt']) ||
    val(sheet, ['video_motion_prompt']) ||
    val(importStill, ['video_motion_prompt'], '')
).trim();

var modelVideo = String(
  val(input, ['model_video']) ||
    val(stillNode, ['model_video']) ||
    val(editedStill, ['model_video']) ||
    val(sheet, ['model_video']) ||
    val(importStill, ['model_video'], '')
).trim();

var duration = Number(
  val(input, ['duration_seconds', 'duration']) ||
    val(stillNode, ['duration_seconds']) ||
    val(editedStill, ['duration_seconds']) ||
    val(sheet, ['duration_seconds']) ||
    val(importStill, ['duration_seconds'], 0)
);

var resolution = String(
  val(input, ['resolution']) ||
    val(stillNode, ['resolution']) ||
    val(editedStill, ['resolution']) ||
    val(sheet, ['resolution']) ||
    val(importStill, ['resolution'], '')
).trim();

if (!stillResolved) {
  throw new Error(
    'prep_grok_video_start: still_url must be https from save_still_url / grok_imagine_edit_still.'
  );
}
if (!motion) {
  throw new Error(
    'SHEETS-ONLY: video_motion_prompt missing from Sheet (pick_creation).'
  );
}
if (!modelVideo) {
  throw new Error('SHEETS-ONLY: model_video missing from Sheet (pick_creation).');
}
if (!Number.isFinite(duration) || duration <= 0) {
  throw new Error('SHEETS-ONLY: duration_seconds missing from Sheet (pick_creation).');
}
if (!resolution) {
  throw new Error('SHEETS-ONLY: resolution missing from Sheet (pick_creation).');
}

var body = {
  model: modelVideo,
  prompt: motion,
  image: { url: stillResolved },
  duration: duration,
  resolution: resolution,
};

var grok_video_body_json = JSON.stringify(body);

return [
  {
    json: {
      still_url: stillResolved,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      resolution: resolution,
      creation_id: String(
        val(input, ['creation_id']) ||
          val(editedStill, ['creation_id']) ||
          val(sheet, ['creation_id']) ||
          val(importStill, ['creation_id']) ||
          val(stillNode, ['creation_id'], '')
      ),
      camera_move: String(val(sheet, ['camera_move']) || val(importStill, ['camera_move'], '')),
      shot_family: String(val(sheet, ['shot_family']) || val(importStill, ['shot_family'], '')),
      grok_video_body_json: grok_video_body_json,
      _debug_prompt_len: motion.length,
      _debug_still_host: stillResolved.split('/')[2] || '',
    },
  },
];
