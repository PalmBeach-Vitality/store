// n8n Code node: prep_still_edit
// Workflow: Vid_gen_landscape_scenes -500-peptide-wellness-scenes
// Mode: Run Once for All Items
// After: still_edit_instructions
// Before: grok_imagine_edit_still
//
// still_url is runtime from save_still_url / grok_imagine_reel_still.
// still_edit_prompt: type it on still_edit_instructions (this-run Set wins).

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

var input = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_creation');
var instructions = firstJson('still_edit_instructions');
var saveStill = firstJson('save_still_url');
var imagine = firstJson('grok_imagine_reel_still');

var sourceStill = httpsUrl(
  val(input, ['still_url', 'source_still_url']) ||
    val(instructions, ['still_url']) ||
    val(saveStill, ['still_url']) ||
    (input.data && input.data[0] && input.data[0].url) ||
    (imagine.data && imagine.data[0] && imagine.data[0].url)
);

var editPrompt = String(
  val(instructions, ['still_edit_prompt', 'edit_prompt']) ||
    val(input, ['still_edit_prompt', 'edit_prompt']) ||
    val(pick, ['still_edit_prompt'])
).trim();

var modelStill = String(val(pick, ['model_still']) || val(input, ['model_still'])).trim();
var aspectRatio = String(val(pick, ['aspect_ratio']) || val(input, ['aspect_ratio'])).trim();
var creationId = String(
  val(pick, ['creation_id']) || val(input, ['creation_id']) || val(saveStill, ['creation_id'])
);

if (!sourceStill) {
  throw new Error(
    'prep_still_edit: need https still_url from grok_imagine_reel_still / save_still_url'
  );
}
if (!editPrompt) {
  throw new Error(
    'still_edit_prompt missing. Type it on still_edit_instructions (creation_id=' +
      (creationId || '?') +
      ')'
  );
}
if (!modelStill) {
  throw new Error(
    'SHEETS-ONLY: model_still missing on sheet row creation_id=' + (creationId || '?')
  );
}
if (!aspectRatio) {
  throw new Error(
    'SHEETS-ONLY: aspect_ratio missing on sheet row creation_id=' + (creationId || '?')
  );
}

var body = {
  model: modelStill,
  prompt: editPrompt,
  image: { url: sourceStill },
  aspect_ratio: aspectRatio,
};

return [
  {
    json: {
      still_url: sourceStill,
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      still_edit_body_json: JSON.stringify(body),
      creation_id: creationId,
    },
  },
];
