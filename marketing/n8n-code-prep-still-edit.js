// n8n Code node: prep_still_edit
// Type: Code | Mode: Run Once for All Items
// After: still_edit_instructions / if_still_edit (true)
// Before: grok_imagine_edit_still
//
// Builds xAI Image Edit JSON for POST https://api.x.ai/v1/images/edits
// so you can add/remove parts of the Grok still before grok-imagine-video-1.5.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj && obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return fallback;
}

const input = $input.first()?.json || {};
const instructions = firstJson('still_edit_instructions');
const saveStill = firstJson('save_still_url');
const imagine = firstJson('grok_imagine_reel_still');

const sourceStill = String(
  val(input, ['still_url', 'source_still_url']) ||
    val(instructions, ['still_url']) ||
    val(saveStill, ['still_url']) ||
    input?.data?.[0]?.url ||
    imagine?.data?.[0]?.url ||
    ''
).trim();

const editPrompt = String(
  val(input, ['still_edit_prompt', 'edit_prompt']) ||
    val(instructions, ['still_edit_prompt', 'edit_prompt'], '')
).trim();

if (!/^https:\/\//i.test(sourceStill)) {
  throw new Error(
    'prep_still_edit: need a public https still_url from save_still_url. Got: ' +
      JSON.stringify(sourceStill).slice(0, 160)
  );
}

if (!editPrompt) {
  throw new Error(
    'prep_still_edit: still_edit_prompt is empty. ' +
      'Fill still_edit_instructions.still_edit_prompt, or skip this branch with if_still_edit.'
  );
}

// Keep identity of the frame; only apply the user's add/remove.
const fullPrompt =
  editPrompt +
  ' Keep the same camera angle, framing, lighting, color grade, and overall composition. ' +
  'Photoreal only. No people, hands, faces, needles, syringes, watermarks, burn-in text, ' +
  'or on-screen disclaimers. Vertical 9:16.';

const body = {
  model: 'grok-imagine-image-quality',
  prompt: fullPrompt,
  image: {
    url: sourceStill,
    type: 'image_url',
  },
  aspect_ratio: '9:16',
  // resolution omitted — follow source still when supported; quality model stays on
};

return [
  {
    json: {
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      still_edit_body_json: JSON.stringify(body),
      creation_id: String(
        val(input, ['creation_id']) ||
          val(instructions, ['creation_id']) ||
          val(saveStill, ['creation_id'], '')
      ),
      _debug_edit_preview: fullPrompt.slice(0, 240),
    },
  },
];
