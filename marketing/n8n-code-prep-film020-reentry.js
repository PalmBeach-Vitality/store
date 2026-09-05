// n8n Code node: prep_film020_reentry
// Workflow: edit_film020_reentry (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: grok_imagine_edit_still
//
// FILM-020 only. Does not touch FILM-001 or FILM-004.
// SHEETS-ONLY: still_edit_prompt, model_still, aspect_ratio, n, picked_url.
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

var TARGETS = ['FILM-020'];

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('prep_film020_reentry: no rows from get_film_stills.');
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
    throw new Error('prep_film020_reentry: ' + stillId + ' missing on 18-motsc-film-stills.');
  }

  var editPrompt = String(val(pick, ['still_edit_prompt'])).trim();
  if (!editPrompt) {
    throw new Error(
      'SHEETS-ONLY: still_edit_prompt missing on ' +
        stillId +
        '. Run overlay_film020_reentry first.'
    );
  }
  if (editPrompt.length > 7900) editPrompt = editPrompt.slice(0, 7900);

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

  var sourceUrl = httpsUrl(val(pick, ['picked_url']));
  if (!sourceUrl) {
    throw new Error('prep_film020_reentry: picked_url must be https on ' + stillId + '.');
  }

  var nRaw = String(val(pick, ['n'])).trim();
  var n = Number(nRaw);
  if (!isFinite(n) || n < 1 || n > 10 || n !== Math.floor(n)) {
    throw new Error('SHEETS-ONLY: n must be an integer 1-10 on ' + stillId + ', got ' + nRaw);
  }

  var priorTakes = String(val(pick, ['take_urls'])).trim();

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
}

return out;
