// n8n Code node: prep_grok_video_start
// Mode: Run Once for All Items
// After: save_edited_still_url (or still_edit_instructions / import_still_url / save_still_url)
// Before: grok_video_start

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

function asciiPrompt(s) {
  return String(s || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00d7/g, 'x')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickHttpsUrl(list) {
  for (var i = 0; i < list.length; i++) {
    var s = String(list[i] || '').trim();
    if (/^https:\/\//i.test(s)) return s;
  }
  return '';
}

var input = ($input.first() && $input.first().json) || {};
var editedStill = firstJson('save_edited_still_url');
var editInstructions = firstJson('still_edit_instructions');
var importStill = firstJson('import_still_url');
var stillNode = firstJson('save_still_url');
var pick = firstJson('pick_creation');
var imagine = firstJson('grok_imagine_reel_still');
var editHttp = firstJson('grok_imagine_edit_still');

var stillResolved = pickHttpsUrl([
  val(input, ['still_url', 'source_still_url', 'edited_still_url']),
  input.data && input.data[0] && input.data[0].url,
  input.url,
  val(editedStill, ['still_url']),
  editedStill.data && editedStill.data[0] && editedStill.data[0].url,
  val(editInstructions, ['still_url']),
  val(importStill, ['still_url']),
  val(stillNode, ['still_url']),
  stillNode.data && stillNode.data[0] && stillNode.data[0].url,
  editHttp.data && editHttp.data[0] && editHttp.data[0].url,
  imagine.data && imagine.data[0] && imagine.data[0].url,
]);

if (!stillResolved) {
  throw new Error(
    'prep_grok_video_start: still_url must be https. ' +
      'Check save_edited_still_url / import_still_url / save_still_url. ' +
      'input=' +
      JSON.stringify(input.still_url || '') +
      ' edited=' +
      JSON.stringify(editedStill.still_url || '') +
      ' import=' +
      JSON.stringify(importStill.still_url || '') +
      ' save=' +
      JSON.stringify(stillNode.still_url || '')
  );
}

var shot_family = asciiPrompt(val(pick, ['shot_family'], 'push_in'));
var camera_angle = asciiPrompt(val(pick, ['camera_angle'], 'eye-level'));
var camera_direction = asciiPrompt(val(pick, ['camera_direction'], 'forward'));
var camera_move = asciiPrompt(val(pick, ['camera_move'], 'slow push-in')).slice(0, 180);
var compound = asciiPrompt(val(pick, ['compound_name'], ''));

var motion = asciiPrompt(
  'Slow cinematic camera: ' +
    camera_move +
    '. Shot ' +
    shot_family +
    ', angle ' +
    camera_angle +
    ', direction ' +
    camera_direction +
    '. Keep the exact same scene, materials, and lighting from the still. ' +
    'No orbit. No new objects. No duplicate props. No repeated text or graphics. ' +
    'No people, hands, faces, needles, text watermarks, or burn-in. ' +
    'No on-screen disclaimer or caption text.'
);

if (compound) {
  motion += " Keep label '" + compound + "' unchanged if visible, printed once only.";
}

if (motion.length > 700) {
  motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';
}

var body = {
  model: 'grok-imagine-video-1.5',
  prompt: motion,
  image: { url: stillResolved },
  duration: 15,
  resolution: '1080p',
};

var grok_video_body_json = JSON.stringify(body);

return [
  {
    json: {
      still_url: stillResolved,
      video_motion_prompt: motion,
      creation_id: String(
        val(input, ['creation_id']) ||
          val(editedStill, ['creation_id']) ||
          val(importStill, ['creation_id']) ||
          val(pick, ['creation_id']) ||
          val(stillNode, ['creation_id'], '')
      ),
      camera_move: camera_move,
      shot_family: shot_family,
      camera_angle: camera_angle,
      camera_direction: camera_direction,
      compound_name: compound,
      still_was_edited: Boolean(val(editedStill, ['still_was_edited'], false)),
      original_still_url: String(
        val(editedStill, ['original_still_url']) ||
          val(importStill, ['still_url']) ||
          val(stillNode, ['still_url'], '')
      ),
      grok_video_body_json: grok_video_body_json,
      _debug_prompt_len: motion.length,
      _debug_still_host: stillResolved.split('/')[2] || '',
      _debug_body_preview: grok_video_body_json.slice(0, 240),
    },
  },
];
