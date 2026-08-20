// n8n Code node: prep_still_edit
// Workflow: Vid_gen_landscape_scenes -500-peptide-wellness-scenes
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: flag_still_edit
// Before: grok_imagine_edit_still
//
// SHEETS-ONLY: model_still, aspect_ratio, still_edit_prompt from pick_creation.
// still_url is runtime from grok_imagine_reel_still / flag_still_edit.

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

function httpsUrl(s) {
  s = String(s || '').trim();
  return /^https:\/\//i.test(s) ? s : '';
}

function grokStillUrl(obj) {
  if (!obj) return '';
  return (
    httpsUrl(obj.still_url) ||
    httpsUrl(obj.source_still_url) ||
    httpsUrl(obj.data && obj.data[0] && obj.data[0].url) ||
    ''
  );
}

var input = ($input.first() && $input.first().json) || {};
var flag = firstJson('flag_still_edit');
var pick = firstJson('pick_creation');
var imagine = firstJson('grok_imagine_reel_still');

var sourceStill =
  grokStillUrl(input) || grokStillUrl(flag) || grokStillUrl(imagine) || grokStillUrl(pick) || '';

if (!sourceStill) {
  throw new Error('prep_still_edit: still_url missing from grok_imagine_reel_still / flag_still_edit.');
}

var creationId = String(val(pick, ['creation_id']) || val(flag, ['creation_id']) || val(input, ['creation_id']) || '');

function requireFromSheet(label, value) {
  var s = String(value == null ? '' : value).trim();
  if (!s) {
    throw new Error('SHEETS-ONLY: ' + label + ' missing on sheet row creation_id=' + (creationId || '?'));
  }
  return s;
}

var editPrompt = requireFromSheet(
  'still_edit_prompt',
  val(pick, ['still_edit_prompt']) || val(flag, ['still_edit_prompt']) || val(input, ['still_edit_prompt'])
);
var modelStill = requireFromSheet(
  'model_still',
  val(pick, ['model_still']) || val(flag, ['model_still']) || val(input, ['model_still'])
);
var aspectRatio = requireFromSheet(
  'aspect_ratio',
  val(pick, ['aspect_ratio']) || val(flag, ['aspect_ratio']) || val(input, ['aspect_ratio'])
);

var body = {
  model: modelStill,
  prompt: editPrompt,
  image: { url: sourceStill },
  aspect_ratio: aspectRatio,
};

return [
  {
    json: Object.assign({}, pick, flag, input, {
      still_url: sourceStill,
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      still_edit_body: body,
      still_edit_body_json: JSON.stringify(body),
      creation_id: creationId,
    }),
  },
];
