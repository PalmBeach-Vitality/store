// n8n Code node: prep_still_edit
// Mode: Run Once for All Items
// After: if_still_edit (true)
// Before: grok_imagine_edit_still
//
// SHEETS-ONLY: edit prompt + model come from Sheet 9 via pick_creation / map_sheet_fields.
// still_url is the runtime URL from the prior still node (API output).

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

var input = ($input.first() && $input.first().json) || {};
var sheet = firstJson('map_sheet_fields');
if (!Object.keys(sheet).length) sheet = firstJson('pick_creation');
if (!Object.keys(sheet).length) sheet = firstJson('import_still_from_sheet');
var instructions = firstJson('still_edit_instructions');
var importStill = firstJson('import_still_url');
var saveStill = firstJson('save_still_url');
var imagine = firstJson('grok_imagine_reel_still');

var sourceStill = String(
  val(input, ['still_url', 'source_still_url']) ||
    val(instructions, ['still_url']) ||
    val(importStill, ['still_url']) ||
    val(saveStill, ['still_url']) ||
    (input.data && input.data[0] && input.data[0].url) ||
    (imagine.data && imagine.data[0] && imagine.data[0].url) ||
    ''
).trim();

var editPrompt = String(
  val(input, ['still_edit_prompt', 'edit_prompt']) ||
    val(instructions, ['still_edit_prompt', 'edit_prompt']) ||
    val(sheet, ['still_edit_prompt', 'edit_prompt']) ||
    val(importStill, ['still_edit_prompt'], '')
).trim();

var modelStill = String(
  val(input, ['model_still']) ||
    val(instructions, ['model_still']) ||
    val(sheet, ['model_still']) ||
    val(importStill, ['model_still'], '')
).trim();

var aspectRatio = String(
  val(input, ['aspect_ratio']) ||
    val(instructions, ['aspect_ratio']) ||
    val(sheet, ['aspect_ratio']) ||
    val(importStill, ['aspect_ratio'], '')
).trim();

if (!/^https:\/\//i.test(sourceStill)) {
  throw new Error(
    'prep_still_edit: still_url must be https (runtime from still node). Got: ' +
      JSON.stringify(sourceStill).slice(0, 160)
  );
}

if (!editPrompt) {
  throw new Error(
    'prep_still_edit: still_edit_prompt missing from Sheet (pick_creation / import sheet row).'
  );
}

if (!modelStill) {
  throw new Error('prep_still_edit: model_still missing from Sheet.');
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
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      still_edit_body: body,
      still_edit_body_json: JSON.stringify(body),
      creation_id: String(
        val(input, ['creation_id']) ||
          val(instructions, ['creation_id']) ||
          val(sheet, ['creation_id']) ||
          val(importStill, ['creation_id']) ||
          val(saveStill, ['creation_id'], '')
      ),
    },
  },
];
