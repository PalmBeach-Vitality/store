// n8n Code snippet: assert still model
// Copy into pick / prep Code nodes. Do not invent a fallback model.
//
// 18-motsc-film-stills only: black-forest-labs/flux.2-max (trial)
// Every other tab: grok-imagine-image-2.0

var GROK_STILL = 'grok-imagine-image-2.0';
var FILM_STILL = 'black-forest-labs/flux.2-max';

function assertGrokStill(model, rowId) {
  var m = String(model || '').trim();
  if (m !== GROK_STILL) {
    throw new Error(
      'STILL LOCK: model_still must be ' +
        GROK_STILL +
        ' (row=' +
        (rowId || '?') +
        ', got ' +
        (m || 'empty') +
        '). Flux is 18-motsc-film-stills only.'
    );
  }
  return m;
}

function assertFilmStill(model, rowId) {
  var m = String(model || '').trim();
  if (m !== FILM_STILL && m !== GROK_STILL) {
    throw new Error(
      'STILL LOCK: 18-motsc-film-stills model_still must be ' +
        FILM_STILL +
        ' or ' +
        GROK_STILL +
        ' (row=' +
        (rowId || '?') +
        ', got ' +
        (m || 'empty') +
        ').'
    );
  }
  return m;
}
