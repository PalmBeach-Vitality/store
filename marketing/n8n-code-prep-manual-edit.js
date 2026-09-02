// n8n Code node: prep_manual_edit
// Workflow: edit_one_still
// Mode: Run Once for All Items
// After: get_film_stills
// Before: grok_imagine_edit_still
//
// Form supplies source_url, still_edit_prompt, still_id, n.
// Sheet 18 supplies model_still and aspect_ratio for that still_id.
// Empty form/sheet fields throw — do not invent a fallback prompt.

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

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

function squeeze(s) {
  var t = String(s || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  return t.trim();
}

var form = firstJson('edit_form');
var stillId = String(val(form, ['still_id'])).trim();
if (!stillId) {
  throw new Error('SHEETS-ONLY: still_id missing on the form. Example: FILM-013');
}

var sourceUrl = httpsUrl(val(form, ['source_url', 'still_url']));
if (!sourceUrl) {
  throw new Error(
    'prep_manual_edit: source_url must be https (still_id=' + stillId + ').'
  );
}

var editPrompt = squeeze(val(form, ['still_edit_prompt', 'edit_prompt']));
if (!editPrompt) {
  throw new Error(
    'SHEETS-ONLY: still_edit_prompt missing on the form (still_id=' + stillId + ').'
  );
}
if (editPrompt.length > 7900) editPrompt = editPrompt.slice(0, 7900);

var nRaw = String(val(form, ['n'])).trim();
var n = Number(nRaw);
if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {
  throw new Error(
    'SHEETS-ONLY: n must be an integer 1-10 (still_id=' + stillId + ', got ' + nRaw + ')'
  );
}

var rows = $input.all().map(function (i) {
  return i.json;
});

var pick = null;
for (var i = 0; i < rows.length; i++) {
  if (String(val(rows[i], ['still_id'])).trim() === stillId) {
    pick = rows[i];
    break;
  }
}
if (!pick) {
  throw new Error(
    'prep_manual_edit: still_id ' + stillId + ' missing on 18-motsc-film-stills.'
  );
}

var modelStill = String(val(pick, ['model_still'])).trim();
if (!modelStill) {
  throw new Error('SHEETS-ONLY: model_still missing on ' + stillId + '.');
}

var aspectRatio = String(val(pick, ['aspect_ratio'])).trim().replace(/\u2236/g, ':');
if (!/^\d+:\d+$/.test(aspectRatio)) {
  throw new Error(
    'SHEETS-ONLY: aspect_ratio must be like 9:16 on ' + stillId + ', got ' + aspectRatio
  );
}

var priorTakes = String(val(pick, ['take_urls'])).trim();

var out = [];
for (var k = 0; k < n; k++) {
  var body = {
    model: modelStill,
    prompt: editPrompt,
    image: { url: sourceUrl },
    aspect_ratio: aspectRatio,
  };
  out.push({
    json: {
      still_id: stillId,
      take_index: k + 1,
      take_count: n,
      source_still_url: sourceUrl,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      prior_take_urls: priorTakes,
      still_edit_body_json: JSON.stringify(body),
    },
  });
}

return out;
