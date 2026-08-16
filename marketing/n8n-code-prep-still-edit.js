// n8n Code node: prep_still_edit
// Mode: Run Once for All Items
//
// Wire (true branch):
//   flag_still_edit → if → **prep_still_edit** → grok_imagine_edit_still → save_still_url
//
// still_url is runtime only (Grok still / flag). Do NOT require save_still_url —
// on this path save runs AFTER the edit.

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
var instructions = firstJson('still_edit_instructions');
var imagine = firstJson('grok_imagine_reel_still');
var saveStill = firstJson('save_still_url');
var sheet = firstJson('map_sheet_fields');
if (!Object.keys(sheet).length) sheet = firstJson('pick_creation');
if (!Object.keys(sheet).length) sheet = firstJson('import_still_from_sheet');
var importStill = firstJson('import_still_url');

var sourceStill =
  grokStillUrl(input) ||
  grokStillUrl(flag) ||
  grokStillUrl(instructions) ||
  grokStillUrl(imagine) ||
  grokStillUrl(saveStill) ||
  grokStillUrl(importStill) ||
  '';

if (!sourceStill) {
  throw new Error(
    'still_url missing — set still_url on still_edit_instructions to ' +
      "={{ $('grok_imagine_reel_still').first().json.data[0].url }} " +
      '(or re-paste this prep_still_edit Code from the repo).'
  );
}

var editPrompt = String(
  val(input, ['still_edit_prompt', 'edit_prompt']) ||
    val(flag, ['still_edit_prompt', 'edit_prompt']) ||
    val(instructions, ['still_edit_prompt', 'edit_prompt']) ||
    val(sheet, ['still_edit_prompt', 'edit_prompt']) ||
    val(importStill, ['still_edit_prompt'], '')
).trim();

var modelStill = String(
  val(input, ['model_still']) ||
    val(flag, ['model_still']) ||
    val(instructions, ['model_still']) ||
    val(sheet, ['model_still']) ||
    val(importStill, ['model_still'], '') ||
    'grok-imagine-image-2.0'
).trim();

var aspectRatio = String(
  val(input, ['aspect_ratio']) ||
    val(flag, ['aspect_ratio']) ||
    val(instructions, ['aspect_ratio']) ||
    val(sheet, ['aspect_ratio']) ||
    val(importStill, ['aspect_ratio'], '') ||
    '9:16'
).trim();

if (!editPrompt) {
  throw new Error('prep_still_edit: still_edit_prompt missing.');
}

var body = {
  model: modelStill,
  prompt: editPrompt,
  image: {
    url: sourceStill,
  },
};

if (aspectRatio) {
  body.aspect_ratio = aspectRatio;
}

return [
  {
    json: {
      still_url: sourceStill,
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      still_edit_body: body,
      still_edit_body_json: JSON.stringify(body),
      creation_id: String(
        val(input, ['creation_id']) ||
          val(flag, ['creation_id']) ||
          val(instructions, ['creation_id']) ||
          val(sheet, ['creation_id']) ||
          val(importStill, ['creation_id']) ||
          ''
      ),
      do_still_edit: true,
    },
  },
];
