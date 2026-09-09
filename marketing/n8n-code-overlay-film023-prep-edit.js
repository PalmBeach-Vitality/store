// n8n Code node: prep_film023_edit
// Workflow: overlay_film023_use_this (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills_locked
// Before: grok_imagine_edit_still
//
// Edit FROM the locked picked_url only. Refuse the old underside keepers.
// Sheets-only: prompt, n, model, aspect from the FILM-023 row.

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

function requireField(row, name, stillId) {
  var v = String(val(row, [name]) == null ? '' : val(row, [name])).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: 18-motsc-film-stills row missing ' +
        name +
        ' (still_id=' +
        (stillId || '?') +
        '). Fill the cell, do not hardcode.'
    );
  }
  return v;
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

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('prep_film023_edit: no rows from get_film_stills_locked.');
}

var pick = null;
for (var i = 0; i < rows.length; i++) {
  if (String(val(rows[i], ['still_id'])).trim() === 'FILM-023') {
    pick = rows[i];
    break;
  }
}
if (!pick) {
  throw new Error('prep_film023_edit: FILM-023 missing on Sheet 18.');
}

var sourceUrl = httpsUrl(requireField(pick, 'picked_url', 'FILM-023'));
if (!sourceUrl) {
  throw new Error('prep_film023_edit: picked_url must be https.');
}
if (
  sourceUrl.indexOf('490e8b55') !== -1 ||
  sourceUrl.indexOf('8f8a2c44') !== -1 ||
  sourceUrl.indexOf('d82e216e') !== -1
) {
  throw new Error(
    'prep_film023_edit: refusing the old underside FILM-023 still. Use vial_handoff_23.'
  );
}
if (sourceUrl.indexOf('film023-handoff-source.jpg') === -1) {
  throw new Error(
    'prep_film023_edit: picked_url is not the vial_handoff_23 source. Refusing to edit.'
  );
}

var editPrompt = squeeze(requireField(pick, 'still_edit_prompt', 'FILM-023'));
if (editPrompt.indexOf('WRONG side') !== -1) {
  throw new Error(
    'prep_film023_edit: still_edit_prompt still talks about moving a wrong-side device. Lock write did not stick.'
  );
}
if (editPrompt.length > 7900) editPrompt = editPrompt.slice(0, 7900);

var modelStill = requireField(pick, 'model_still', 'FILM-023');
var aspectRatio = requireField(pick, 'aspect_ratio', 'FILM-023').replace(/\u2236/g, ':');
if (!/^\d+:\d+$/.test(aspectRatio)) {
  throw new Error(
    'SHEETS-ONLY: aspect_ratio must be like 9:16 (still_id=FILM-023, got ' + aspectRatio + ')'
  );
}

var nRaw = requireField(pick, 'n', 'FILM-023');
var n = Number(nRaw);
if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {
  throw new Error('SHEETS-ONLY: n must be an integer 1-10 (still_id=FILM-023, got ' + nRaw + ')');
}

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
      still_id: 'FILM-023',
      take_index: k + 1,
      take_count: n,
      source_still_url: sourceUrl,
      still_edit_prompt: editPrompt,
      model_still: modelStill,
      aspect_ratio: aspectRatio,
      still_times_used: Number(val(pick, ['times_used'])) || 1,
      still_edit_body_json: JSON.stringify(body),
    },
  });
}

return out;
