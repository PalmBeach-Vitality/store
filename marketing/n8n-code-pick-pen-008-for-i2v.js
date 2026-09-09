// n8n Code node: pick_pen_008
// Overlay: pen_i2v_from_url (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_pen_creations
// Before: prep_pen_video_start
//
// Uses the live still Sal generated (exec 1620). Motion / models from Sheet 14.

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

var WANT_ID = 'PBVita-Pen-008';
var STILL =
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8020980f-f348-9244-b5f0-42e7e56c36da-c22a66e6.png';

var rows = $input.all().map(function (i) {
  return i.json;
});
var row = null;
for (var i = 0; i < rows.length; i++) {
  if (String(val(rows[i], ['creation_id'])).trim() === WANT_ID) {
    row = rows[i];
    break;
  }
}
if (!row) {
  throw new Error('pick_pen_008: no Sheet 14 row ' + WANT_ID);
}

var motion = String(val(row, ['video_motion_prompt'])).trim();
if (!motion) {
  throw new Error('pick_pen_008: empty video_motion_prompt on ' + WANT_ID);
}
if (motion.indexOf('Silent video') === -1) {
  motion =
    'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ' +
    motion;
}
if (motion.length > 700) {
  motion = motion.slice(0, 697);
  var sp = motion.lastIndexOf(' ');
  if (sp > 600) motion = motion.slice(0, sp);
  motion = motion + '.';
}

var modelVideo = String(val(row, ['model_video'])).trim();
var duration = Number(val(row, ['duration_seconds']));
var resolution = String(val(row, ['resolution'])).trim();
if (!modelVideo || !duration || !resolution) {
  throw new Error('pick_pen_008: missing model_video / duration_seconds / resolution on ' + WANT_ID);
}

var body = {
  model: modelVideo,
  prompt: motion,
  image: { url: STILL },
  duration: duration,
  resolution: resolution,
  audio: false,
};

return [
  {
    json: {
      creation_id: WANT_ID,
      compound_name: String(val(row, ['compound_name'])),
      still_url: STILL,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      resolution: resolution,
      creation_times_used: Number(val(row, ['times_used'])) || 0,
      grok_video_body_json: JSON.stringify(body),
    },
  },
];
