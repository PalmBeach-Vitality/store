// n8n Code node: prep_still_edit
// Mode: Run Once for All Items
//
// Wire (true branch):
//   flag_still_edit → if → **prep_still_edit** → grok_imagine_edit_still → save_still_url
//
// still_url: runtime from Grok / flag (save_still_url is AFTER edit on this path).
// still_edit_prompt: flag → Set → pick → CODE fallback below.

// ── Same fallback as flag_still_edit (edit either; flag runs first) ───────
var CODE_STILL_EDIT_PROMPT =
  'CRITICAL COUNT FIX: Keep exactly ONE sealed Palm Beach Vitality hero product visible (one vial OR one pen — never both). DELETE every extra vial and every extra pen — including background vials, soft-focus vials, smaller secondary vials, open/uncapped duplicate vials, and any product that is not the single main hero. After the edit the viewer must count exactly 1 product. Do not restyle lighting, camera angle, label text, or environment. Do not add new products. Do not leave a second vial for depth.';
// ─────────────────────────────────────────────────────────────────────────

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

function resolveEditPrompt(input, flag, instructions, sheet, importStill) {
  var sources = [input, flag, instructions, sheet, importStill, firstJson('pick_creation')];
  for (var i = 0; i < sources.length; i++) {
    var p = String(
      val(sources[i], ['still_edit_prompt', 'edit_prompt', 'Still Edit Prompt'], '')
    ).trim();
    if (p) return p;
  }
  var alts = ['still_edit_instructions', 'Still Edit Instructions', 'flag_still_edit'];
  for (var a = 0; a < alts.length; a++) {
    var o = firstJson(alts[a]);
    var q = String(o.still_edit_prompt || o.edit_prompt || '').trim();
    if (q) return q;
  }
  return String(CODE_STILL_EDIT_PROMPT || '').trim();
}

var input = ($input.first() && $input.first().json) || {};
var flag = firstJson('flag_still_edit');
var instructions = firstJson('still_edit_instructions');
if (!Object.keys(instructions).length) {
  instructions = firstJson('Still Edit Instructions');
}
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
      "={{ $('grok_imagine_reel_still').first().json.data[0].url }}"
  );
}

var editPrompt = resolveEditPrompt(input, flag, instructions, sheet, importStill);

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
  throw new Error(
    'still_edit_prompt missing everywhere (Set, Sheet, and CODE_STILL_EDIT_PROMPT). ' +
      'Edit CODE_STILL_EDIT_PROMPT at the top of flag_still_edit or prep_still_edit.'
  );
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
