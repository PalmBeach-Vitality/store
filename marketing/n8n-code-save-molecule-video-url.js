// n8n Code node: save_video_url
// After: creatomate_poll
// Before: sheets_update_chem
// Creatomate render url is the joined 30s clip.

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
var render = Array.isArray(poll) ? poll[0] : poll;
if (render && render[0] && render[0].id && !render.id) {
  render = render[0];
}
var status = String(render.status || '').toLowerCase();
var video = httpsUrl(render.url);
if (status !== 'succeeded' || !video) {
  throw new Error(
    'save_video_url Creatomate status is ' +
      JSON.stringify(render.status) +
      (render.error_message ? ' error=' + render.error_message : '') +
      '. Raise wait_concat if still rendering.'
  );
}

var prep = firstJson('prep_creatomate_concat');
var pick = firstJson('pick_molecule_creation');
var hop1 = firstJson('openrouter_i2v_poll');
var saveStill = firstJson('save_still_url');
var taskId = String(hop1.id || hop1.generation_id || '').trim();

return [
  {
    json: {
      video_url: video,
      video_url_15: String(prep.video_url_15 || ''),
      video_url_extend: String(prep.video_url_extend || ''),
      still_url: String(saveStill.still_url || prep.still_url || ''),
      creation_id: String(pick.creation_id || prep.creation_id || ''),
      compound_name: String(pick.compound_name || prep.compound_name || ''),
      created_at: $now.toISO(),
      duration_seconds: 30,
      request_id: taskId,
    },
  },
];
