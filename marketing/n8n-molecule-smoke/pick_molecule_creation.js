// n8n Code node: pick_molecule_creation
// Workflow: peptide_molecule_vid_gen_v2 (smoke test on Sheet 23-molecule-smoke-2)
// Mode: Run Once for All Items. Settings → Execute Once = OFF (it must see every Active row).
// After: filter_chem_active   Before: route_still_model
//
// Picks the least-used Active row (times_used, then rank) and passes its cells through.
// Every generation value comes from the sheet. An empty or malformed cell stops the run
// here, before any paid call.

var TEXT_FIELDS = [
  'creation_id',
  'status',
  'compound_name',
  'look_name',
  'model_still',
  'still_prompt',
  'aspect_ratio',
  'model_video',
  'resolution',
  'video_motion_prompt',
  'extend_motion_prompt',
  'negative_prompt',
  'video_format',
  'last_frame_format',
];

var NUMBER_FIELDS = [
  'rank',
  'still_n',
  'still_timeout_seconds',
  'hop1_duration_seconds',
  'hop2_duration_seconds',
  'cfg_scale',
  'video_poll_seconds',
  'video_max_wait_seconds',
  'render_width',
  'render_height',
  'render_frame_rate',
  'creatomate_poll_seconds',
  'creatomate_max_polls',
  'times_used',
];

// Keyed by the model_still prefix that route_still_model sends to each still node.
var STILL_FIELDS = {
  'openai/gpt-image-': ['still_size', 'still_quality'],
  'grok-imagine-image-': ['still_resolution'],
};

function blank(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

function fail(row, msg) {
  var id = row && !blank(row.creation_id) ? String(row.creation_id).trim() + ': ' : '';
  throw new Error('pick_molecule_creation: ' + id + msg);
}

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) fail(null, 'no Active rows came through filter_chem_active.');

var seen = {};
rows.forEach(function (r) {
  if (blank(r.creation_id)) fail(r, 'a row has no creation_id.');
  var id = String(r.creation_id).trim();
  if (seen[id]) fail(r, 'creation_id appears on two rows, so the sheet write-back cannot tell them apart.');
  seen[id] = true;
  ['times_used', 'rank'].forEach(function (k) {
    if (blank(r[k]) || !isFinite(Number(r[k]))) {
      fail(r, k + ' must be a number (got ' + JSON.stringify(r[k]) + ').');
    }
  });
});

rows.sort(function (a, b) {
  return Number(a.times_used) - Number(b.times_used) || Number(a.rank) - Number(b.rank);
});
var row = rows[0];

var pick = {};
TEXT_FIELDS.forEach(function (k) {
  if (blank(row[k])) fail(row, k + ' is empty.');
  pick[k] = String(row[k]).trim();
});
NUMBER_FIELDS.forEach(function (k) {
  if (blank(row[k]) || !isFinite(Number(row[k]))) {
    fail(row, k + ' must be a number (got ' + JSON.stringify(row[k]) + ').');
  }
  pick[k] = Number(row[k]);
});

var engine = Object.keys(STILL_FIELDS).filter(function (prefix) {
  return pick.model_still.indexOf(prefix) === 0;
})[0];
if (!engine) {
  fail(row, 'model_still must start with ' + Object.keys(STILL_FIELDS).join(' or ') + ' (got ' + pick.model_still + ').');
}
STILL_FIELDS[engine].forEach(function (k) {
  if (blank(row[k])) fail(row, k + ' is empty, and ' + pick.model_still + ' needs it.');
  pick[k] = String(row[k]).trim();
});

if (pick.aspect_ratio !== '9:16') {
  fail(row, 'aspect_ratio must be 9:16, social delivery is vertical only (got ' + pick.aspect_ratio + ').');
}
function isNineBySixteen(w, h) {
  return w > 0 && h > 0 && w * 16 === h * 9;
}

var res = /^(\d+)p$/i.exec(pick.resolution);
if (!res || Number(res[1]) < 1080) {
  fail(row, 'resolution must be 1080p or higher, 720p is banned (got ' + pick.resolution + ').');
}
if (pick.model_video.indexOf('fal-ai/kling-video/v3/pro/') !== 0) {
  fail(row, 'model_video must be a fal Kling v3 Pro endpoint, the one measured at 1080 x 1920 (got ' + pick.model_video + ').');
}
['hop1_duration_seconds', 'hop2_duration_seconds'].forEach(function (k) {
  var s = pick[k];
  if (Math.floor(s) !== s || s < 3 || s > 15) {
    fail(row, k + ' must be a whole number from 3 to 15, Kling\'s range (got ' + s + ').');
  }
});
if (!(pick.cfg_scale >= 0 && pick.cfg_scale <= 1)) {
  fail(row, 'cfg_scale must be 0 to 1 (got ' + pick.cfg_scale + ').');
}

if (!isNineBySixteen(pick.render_width, pick.render_height)) {
  fail(row, 'render_width x render_height must be 9:16 (got ' + pick.render_width + 'x' + pick.render_height + ').');
}
if (pick.render_width < 1080) {
  fail(row, 'render_width must be 1080 or more, 720p is banned (got ' + pick.render_width + ').');
}
if (engine === 'openai/gpt-image-') {
  var size = /^(\d+)x(\d+)$/.exec(pick.still_size);
  if (!size || !isNineBySixteen(Number(size[1]), Number(size[2]))) {
    fail(row, 'still_size must be WIDTHxHEIGHT at 9:16 (got ' + pick.still_size + ').');
  }
  if (Number(size[1]) < pick.render_width) {
    fail(row, 'still_size ' + pick.still_size + ' is narrower than the ' + pick.render_width + 'px video, so hop 1 would start soft.');
  }
}

if (pick.still_n !== 1) fail(row, 'still_n must be 1, the workflow animates one still (got ' + pick.still_n + ').');
if (pick.video_format !== 'mp4') fail(row, 'video_format must be mp4 (got ' + pick.video_format + ').');
if (['png', 'jpg'].indexOf(pick.last_frame_format) === -1) {
  fail(row, 'last_frame_format must be png or jpg (got ' + pick.last_frame_format + ').');
}
[
  'still_timeout_seconds',
  'video_poll_seconds',
  'video_max_wait_seconds',
  'render_frame_rate',
  'creatomate_poll_seconds',
  'creatomate_max_polls',
].forEach(function (k) {
  if (!(pick[k] > 0)) fail(row, k + ' must be above 0 (got ' + pick[k] + ').');
});

pick.input_row_count = rows.length;
return [{ json: pick }];
