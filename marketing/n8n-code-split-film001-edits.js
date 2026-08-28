// n8n Code node: split_film001_edits
// Workflow: edit_film001_wrist_stills (one-shot FILM-001 wrist edit)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: grok_imagine_edit_still
//
// SHEETS-ONLY: still_edit_prompt, model_still, aspect_ratio from Sheet 18.
// take_urls are runtime still URLs already on the FILM-001 row.
// Empty still_edit_prompt throws — do not invent a fallback.

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
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

var rows = $input.all().map(function (i) {
  return i.json;
});

var pick = null;
for (var i = 0; i < rows.length; i++) {
  if (String(val(rows[i], ['still_id'])).trim() === 'FILM-001') {
    pick = rows[i];
    break;
  }
}

if (!pick) {
  throw new Error('split_film001_edits: FILM-001 row missing on 18-motsc-film-stills.');
}

var editPrompt = String(val(pick, ['still_edit_prompt'])).trim();
if (!editPrompt) {
  throw new Error(
    'SHEETS-ONLY: still_edit_prompt missing on FILM-001. Run overlay_wrist_lock_sheet18 first.'
  );
}
if (editPrompt.length > 7900) editPrompt = editPrompt.slice(0, 7900);

var modelStill = String(val(pick, ['model_still'])).trim();
if (!modelStill) {
  throw new Error('SHEETS-ONLY: model_still missing on FILM-001.');
}

var aspectRatio = String(val(pick, ['aspect_ratio'])).trim().replace(/\u2236/g, ':');
if (!/^\d+:\d+$/.test(aspectRatio)) {
  throw new Error('SHEETS-ONLY: aspect_ratio must be like 9:16 on FILM-001, got ' + aspectRatio);
}

var rawTakes = String(val(pick, ['take_urls'])).trim();
if (!rawTakes) {
  throw new Error(
    'split_film001_edits: take_urls empty on FILM-001. Run overlay_wrist_lock_sheet18 first.'
  );
}

var parts = rawTakes.split('|');
var urls = [];
for (var u = 0; u < parts.length; u++) {
  var href = httpsUrl(parts[u]);
  if (href) urls.push(href);
}

if (!urls.length) {
  throw new Error('split_film001_edits: no https URLs in FILM-001 take_urls.');
}

var out = [];
for (var k = 0; k < urls.length; k++) {
  var body = {
    model: modelStill,
    prompt: editPrompt,
    image: { url: urls[k] },
    aspect_ratio: aspectRatio,
  };
  out.push({
    json: {
      still_id: 'FILM-001',
      take_index: k + 1,
      take_count: urls.length,
      source_still_url: urls[k],
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      prior_take_urls: rawTakes,
      still_edit_body_json: JSON.stringify(body),
    },
  });
}

return out;
