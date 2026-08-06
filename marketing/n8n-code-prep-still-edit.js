// n8n Code node: prep_still_edit
// Mode: Run Once for All Items
// After: if_still_edit (true)
// Before: grok_imagine_edit_still
//
// Builds minimal JSON for POST https://api.x.ai/v1/images/edits

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
    val(instructions, ['still_edit_prompt', 'edit_prompt'], '')
).trim();

if (!/^https:\/\//i.test(sourceStill)) {
  throw new Error(
    'prep_still_edit: still_url must be https. Got: ' + JSON.stringify(sourceStill).slice(0, 160)
  );
}

if (!editPrompt) {
  throw new Error('prep_still_edit: still_edit_prompt is empty.');
}

var fullPrompt =
  editPrompt +
  ' Keep the same camera angle, framing, lighting, color grade, and overall composition. ' +
  'Photoreal only. No people, hands, faces, needles, syringes, watermarks, burn-in text, ' +
  'or on-screen disclaimers. Vertical 9:16.';

// Minimal body matching xAI docs (no extra fields that can 404)
var body = {
  model: 'grok-imagine-image-quality',
  prompt: fullPrompt,
  image: {
    url: sourceStill,
  },
};

return [
  {
    json: {
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      still_edit_body: body,
      still_edit_body_json: JSON.stringify(body),
      creation_id: String(
        val(input, ['creation_id']) ||
          val(instructions, ['creation_id']) ||
          val(importStill, ['creation_id']) ||
          val(saveStill, ['creation_id'], '')
      ),
      _debug_edit_preview: fullPrompt.slice(0, 240),
    },
  },
];
