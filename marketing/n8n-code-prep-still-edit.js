// n8n Code node: prep_still_edit
// Mode: Run Once for All Items
// After: download_still  Before: grok_imagine_edit_still
//
// Wire:
//   save_still_url → still_edit_instructions → download_still → **prep_still_edit** → grok_imagine_edit_still
//
// still_edit_prompt comes ONLY from still_edit_instructions (Fixed text you type).
// Do not read the sheet, pick, or incoming item. Do not invent a fallback.
//
// xAI /v1/images/edits cannot fetch imgen.x.ai (404 invalid_image).
// Send a real base64 data URI from download_still binary.
// Do NOT use binary.data directly — when n8n uses filesystem mode
// that field is the literal string "filesystem-v2", which xAI rejects.

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

function looksLikeRealBase64(s) {
  s = String(s || '');
  if (s.length < 200) return false;
  if (/^filesystem/i.test(s)) return false;
  return /^[A-Za-z0-9+/=\r\n]+$/.test(s.slice(0, 200));
}

const out = [];
const items = $input.all();

for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
  const inputItem = items[itemIndex] || {};
  const input = inputItem.json || {};
  const pick = firstJson('pull_sheet_row');
  const instructions = firstJson('still_edit_instructions');
  const saveStill = firstJson('save_still_url');
  let imagine = firstJson('grok_imagine_reel_still');
  if (!Object.keys(imagine).length) imagine = firstJson('grok_imagine_pen_still');

  const sourceStill = httpsUrl(
    val(input, ['still_url', 'source_still_url']) ||
      val(instructions, ['still_url']) ||
      val(saveStill, ['still_url']) ||
      (input.data && input.data[0] && input.data[0].url) ||
      (imagine.data && imagine.data[0] && imagine.data[0].url)
  );

  const editPrompt = String(val(instructions, ['still_edit_prompt', 'edit_prompt'])).trim();

  const modelStill = String(val(pick, ['model_still']) || val(input, ['model_still'])).trim();
  const aspectRatio = String(val(pick, ['aspect_ratio']) || val(input, ['aspect_ratio'])).trim();
  const creationId = String(
    val(pick, ['creation_id']) || val(input, ['creation_id']) || val(saveStill, ['creation_id'])
  );

  if (!editPrompt) {
    throw new Error(
      'still_edit_prompt missing. Type it as Fixed on still_edit_instructions (creation_id=' +
        (creationId || '?') +
        '). This is not a sheet field.'
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

  if (!inputItem.binary || !Object.keys(inputItem.binary).length) {
    throw new Error(
      'prep_still_edit: download_still returned no image bytes. ' +
        'Wire still_edit_instructions → download_still → this node. ' +
        'Do not send imgen.x.ai URLs to /v1/images/edits (xAI 404s them).'
    );
  }

  const binaryKey = Object.keys(inputItem.binary)[0];
  const bin = inputItem.binary[binaryKey] || {};
  const mime = String(bin.mimeType || 'image/png').trim() || 'image/png';

  let b64 = '';
  if (looksLikeRealBase64(bin.data)) {
    b64 = String(bin.data).replace(/\s+/g, '');
  } else {
    const buf = await this.helpers.getBinaryDataBuffer(itemIndex, binaryKey);
    b64 = Buffer.from(buf).toString('base64');
  }

  if (!b64 || b64.length < 200 || /^filesystem/i.test(b64)) {
    throw new Error(
      'prep_still_edit: could not decode download_still binary (got ' +
        String(bin.data || '').slice(0, 40) +
        '). Re-run download_still so the file is present.'
    );
  }

  const imageUrl = 'data:' + mime + ';base64,' + b64;

  const body = {
    model: modelStill,
    prompt: editPrompt,
    image: { url: imageUrl, type: 'image_url' },
    aspect_ratio: aspectRatio,
  };

  out.push({
    json: {
      still_url: sourceStill,
      source_still_url: sourceStill,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      still_edit_body_json: JSON.stringify(body),
      creation_id: creationId,
    },
  });
}

return out;
