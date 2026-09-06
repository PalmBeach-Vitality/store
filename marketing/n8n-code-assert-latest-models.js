// n8n Code snippet: assert latest still model
// Copy into pick / prep Code nodes. Do not invent a fallback model.

var LATEST_STILL = 'grok-imagine-image-2.0';

function assertLatestStill(model, rowId) {
  var m = String(model || '').trim();
  if (m !== LATEST_STILL) {
    throw new Error(
      'STILL LOCK: model_still must be ' +
        LATEST_STILL +
        ' (row=' +
        (rowId || '?') +
        ', got ' +
        (m || 'empty') +
        '). Never grok-imagine-image or grok-imagine-image-quality.'
    );
  }
  return m;
}
