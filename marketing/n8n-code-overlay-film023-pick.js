// n8n Code node: pick_film023
// Workflow: overlay_film023_bare_hand_gen (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills_locked
// Before: grok_imagine_still
//
// Force FILM-023 only. Prompt must already be the no-gloves lock on the sheet.
// Empty cell = throw. Do not invent a fallback prompt.

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

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('pick_film023: no rows from get_film_stills_locked.');
}

var pick = null;
for (var i = 0; i < rows.length; i++) {
  var sid = String(val(rows[i], ['still_id'])).trim();
  if (sid === 'FILM-023') {
    pick = rows[i];
    break;
  }
}

if (!pick) {
  throw new Error('pick_film023: FILM-023 missing on Sheet 18.');
}

var prompt = requireField(pick, 'still_prompt', 'FILM-023');
if (prompt.indexOf('gloved open palm') !== -1) {
  throw new Error('pick_film023: still_prompt still says gloved open palm. Lock write did not stick.');
}
if (prompt.indexOf('NO gloves') === -1 || prompt.indexOf('BARE LEFT') === -1) {
  throw new Error('pick_film023: still_prompt missing no-gloves lock. Refusing to generate.');
}

var model = requireField(pick, 'model_still', 'FILM-023');
var aspect = requireField(pick, 'aspect_ratio', 'FILM-023').replace(/\u2236/g, ':');
if (!/^\d+:\d+$/.test(aspect)) {
  throw new Error('SHEETS-ONLY: aspect_ratio must be like 9:16 (still_id=FILM-023, got ' + aspect + ')');
}
var resolution = requireField(pick, 'still_resolution', 'FILM-023');
var nRaw = requireField(pick, 'n', 'FILM-023');
var n = Number(nRaw);
if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {
  throw new Error('SHEETS-ONLY: n must be an integer 1-10 (still_id=FILM-023, got ' + nRaw + ')');
}

if (prompt.length > 7900) prompt = prompt.slice(0, 7900);

var body = {
  model: model,
  prompt: prompt,
  n: n,
  aspect_ratio: aspect,
  resolution: resolution,
};

return [
  {
    json: {
      still_id: 'FILM-023',
      category: String(val(pick, ['category'])).trim(),
      rank: Number(val(pick, ['rank'])) || 23,
      still_prompt: prompt,
      still_edit_prompt: String(val(pick, ['still_edit_prompt'])).trim(),
      n: n,
      aspect_ratio: aspect,
      still_resolution: resolution,
      model_still: model,
      still_times_used: Number(val(pick, ['times_used'])) || 0,
      still_body_json: JSON.stringify(body),
    },
  },
];
