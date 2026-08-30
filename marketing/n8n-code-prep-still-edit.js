// n8n Code node: prep_still_edit
// Mode: Run Once for All Items
// After: download_still  Before: grok_imagine_edit_still
//
// xAI /v1/images/edits cannot fetch imgen.x.ai (404 invalid_image).
// Send a data URI from download_still binary. Do not pass the temp URL.

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

function dataUriFromBinary(item) {
  if (!item || !item.binary) return '';
  var keys = Object.keys(item.binary);
  if (!keys.length) return '';
  var bin = item.binary[keys[0]];
  if (!bin || !bin.data) return '';
  var mime = String(bin.mimeType || 'image/png').trim() || 'image/png';
  return 'data:' + mime + ';base64,' + bin.data;
}

var inputItem = $input.first() || {};
var input = inputItem.json || {};
var pick = firstJson('pick_creation');
if (!Object.keys(pick).length) pick = firstJson('pick_pen_creation');
var instructions = firstJson('still_edit_instructions');
var urlInput = firstJson('still_url_input');
var saveStill = firstJson('save_still_url');
var imagine = firstJson('grok_imagine_reel_still');
if (!Object.keys(imagine).length) imagine = firstJson('grok_imagine_pen_still');

var sourceStill = httpsUrl(
  val(input, ['still_url', 'source_still_url']) ||
    val(instructions, ['still_url']) ||
    val(urlInput, ['still_url']) ||
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

if (!editPrompt) {
  throw new Error(
    'still_edit_prompt missing. Type it on still_edit_instructions (creation_id=' +
      (creationId || '?') +
      ')'
  );
}
if (!modelStill) {
  throw new Error('SHEETS-ONLY: model_still missing on sheet row creation_id=' + (creationId || '?'));
}
if (!aspectRatio) {
  throw new Error(
    'SHEETS-ONLY: aspect_ratio missing on sheet row creation_id=' + (creationId || '?')
  );
}

var imageUrl = dataUriFromBinary(inputItem);
if (!imageUrl) {
  throw new Error(
    'prep_still_edit: download_still returned no image bytes. ' +
      'Wire still_edit_instructions → download_still → this node. ' +
      'Do not send imgen.x.ai URLs to /v1/images/edits (xAI 404s them).'
  );
}

var body = {
  model: modelStill,
  prompt: editPrompt,
  image: { url: imageUrl, type: 'image_url' },
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
