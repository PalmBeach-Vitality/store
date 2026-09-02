// n8n Code node: pick_film_still
// Workflow: custom_vid_gen 1.5 (repurposed as MOTS-C film still factory)
// Mode: Run Once for All Items
// Settings → Execute Once = OFF (must receive all 18-motsc-film-stills rows)
// After: get_film_stills / filter_stills_active
// Before: grok_imagine_still
//
// SHEETS-ONLY: every Grok Imagine parameter comes from the picked row.
// No fallback prompts, no fallback models. Empty cell = throw.

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
  throw new Error(
    'No film still rows. Check get_film_stills Document 18-motsc-film-stills and filter status=Active.'
  );
}

var scored = rows
  .map(function (r) {
    return {
      still_id: String(val(r, ['still_id'])).trim(),
      rank: Number(val(r, ['rank'])) || 0,
      category: String(val(r, ['category'])).trim(),
      still_prompt: String(val(r, ['still_prompt'])).trim(),
      n: val(r, ['n']),
      aspect_ratio: String(val(r, ['aspect_ratio'])).trim(),
      still_resolution: String(val(r, ['still_resolution'])).trim(),
      model_still: String(val(r, ['model_still'])).trim(),
      status: String(val(r, ['status'])).trim(),
      times_used: Number(val(r, ['times_used'])) || 0,
      last_used_at: String(val(r, ['last_used_at'])).trim(),
      take_urls: String(val(r, ['take_urls'])).trim(),
      picked_url: String(val(r, ['picked_url'])).trim(),
    };
  })
  .filter(function (r) {
    return r.still_id && r.status.toLowerCase() === 'active';
  })
  .sort(function (a, b) {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    return a.rank - b.rank;
  });

if (!scored.length) {
  throw new Error(
    'No Active rows on 18-motsc-film-stills. First row keys: ' +
      Object.keys(rows[0] || {}).join(', ')
  );
}

var pick = scored[0];

var prompt = requireField(pick, 'still_prompt', pick.still_id);
var model = requireField(pick, 'model_still', pick.still_id);
var aspect = requireField(pick, 'aspect_ratio', pick.still_id).replace(/\u2236/g, ':');
if (!/^\d+:\d+$/.test(aspect)) {
  throw new Error(
    'SHEETS-ONLY: aspect_ratio must be like 9:16 (still_id=' + pick.still_id + ', got ' + aspect + ')'
  );
}
var resolution = requireField(pick, 'still_resolution', pick.still_id);
var nRaw = requireField(pick, 'n', pick.still_id);
var n = Number(nRaw);
if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {
  throw new Error(
    'SHEETS-ONLY: n must be an integer 1-10 (still_id=' + pick.still_id + ', got ' + nRaw + ')'
  );
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
      still_id: pick.still_id,
      category: pick.category,
      rank: pick.rank,
      still_prompt: prompt,
      n: n,
      aspect_ratio: aspect,
      still_resolution: resolution,
      model_still: model,
      still_times_used: pick.times_used,
      prior_take_urls: pick.take_urls,
      still_body_json: JSON.stringify(body),
      input_row_count: scored.length,
      never_generated_count: scored.filter(function (r) {
        return r.times_used === 0;
      }).length,
    },
  },
];
