// n8n Code node: save_video_url
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// After: kling_i2v_poll
// Before: sheets_update_chem
//
// kie.ai recordInfo: data.state + data.resultJson.resultUrls[0]

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

var poll = ($input.first() && $input.first().json) || {};
var data = poll.data || {};
var state = String(data.state || '').trim().toLowerCase();
if (state !== 'success') {
  throw new Error(
    'save_video_url: kling_i2v_poll state is ' +
      JSON.stringify(data.state) +
      (data.failMsg ? ' failMsg=' + data.failMsg : '') +
      '. Raise wait_video if still generating.'
  );
}

var parsed = {};
try {
  parsed = typeof data.resultJson === 'string' ? JSON.parse(data.resultJson) : data.resultJson || {};
} catch (e) {
  throw new Error('save_video_url: resultJson is not JSON.');
}

var video = httpsUrl(parsed.resultUrls && parsed.resultUrls[0]);
if (!video) {
  throw new Error('save_video_url: missing resultUrls[0] in kling_i2v_poll resultJson.');
}

var start = firstJson('kling_i2v_start');
var pick = firstJson('pick_molecule_creation');
var saveStill = firstJson('save_still_url');
var taskId = String((start.data && start.data.taskId) || data.taskId || '').trim();
if (!taskId) {
  throw new Error('save_video_url: missing data.taskId from kling_i2v_start / kling_i2v_poll.');
}

return [
  {
    json: {
      video_url: video,
      still_url: String(saveStill.still_url || ''),
      creation_id: String(pick.creation_id || ''),
      compound_name: String(pick.compound_name || ''),
      created_at: $now.toISO(),
      duration_seconds: pick.duration_seconds,
      request_id: taskId,
    },
  },
];
