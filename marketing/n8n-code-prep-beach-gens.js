// n8n Code node: prep_beach_gens
// Workflow: gen_film_beach_stills
// Mode: Run Once for All Items
// After: get_film_stills
// Before: grok_imagine_still
//
// SHEETS-ONLY: still_prompt, model_still, aspect_ratio, n, still_resolution
// from Sheet 18 for FILM-001 / FILM-004 / FILM-020.
// Empty still_prompt throws — do not invent a fallback.
// Used because current picked_url keepers 404 (catbox / imgen tmp).

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

var TARGETS = ['FILM-001', 'FILM-004', 'FILM-020'];

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('prep_beach_gens: no rows from get_film_stills.');
}

var byId = {};
for (var r = 0; r < rows.length; r++) {
  var sid = String(val(rows[r], ['still_id'])).trim();
  if (sid) byId[sid] = rows[r];
}

var out = [];
for (var t = 0; t < TARGETS.length; t++) {
  var stillId = TARGETS[t];
  var pick = byId[stillId];
  if (!pick) {
    throw new Error('prep_beach_gens: ' + stillId + ' missing on 18-motsc-film-stills.');
  }

  var prompt = String(val(pick, ['still_prompt'])).trim();
  if (!prompt) {
    throw new Error(
      'SHEETS-ONLY: still_prompt missing on ' +
        stillId +
        '. Run overlay_film_beach_entry first.'
    );
  }
  if (prompt.length > 7900) prompt = prompt.slice(0, 7900);

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

  var resolution = String(val(pick, ['still_resolution'])).trim();
  if (!resolution) {
    throw new Error('SHEETS-ONLY: still_resolution missing on ' + stillId + '.');
  }

  var nRaw = String(val(pick, ['n'])).trim();
  var n = Number(nRaw);
  if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {
    throw new Error(
      'SHEETS-ONLY: n must be an integer 1-10 on ' + stillId + ', got ' + nRaw
    );
  }

  var priorTakes = String(val(pick, ['take_urls'])).trim();

  for (var k = 0; k < n; k++) {
    var body = {
      model: modelStill,
      prompt: prompt,
      n: 1,
      aspect_ratio: aspectRatio,
      resolution: resolution,
    };
    out.push({
      json: {
        still_id: stillId,
        take_index: k + 1,
        take_count: n,
        still_prompt: prompt,
        model_still: modelStill,
        aspect_ratio: aspectRatio,
        still_resolution: resolution,
        prior_take_urls: priorTakes,
        still_gen_body_json: JSON.stringify(body),
      },
    });
  }
}

return out;
