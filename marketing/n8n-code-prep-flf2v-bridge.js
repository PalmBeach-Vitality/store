// n8n Code node: prep_flf2v_bridge
// After: last-frame + first-frame snapshot URLs exist on the item
// Before: openrouter_flf2v_start
// WildCut-style bridge via OpenRouter first_frame + last_frame. Sheets-only prompt.

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

function requireText(value, label, stillId) {
  var v = String(value == null ? '' : value).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: missing ' + label + (stillId ? ' (still_id=' + stillId + ')' : '') + '.'
    );
  }
  return v;
}

var item = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_join_reel');
var stillId = String(item.still_id || '').trim();
var lastFrame = httpsUrl(item.last_frame_url);
var firstFrame = httpsUrl(item.next_first_frame_url);
if (!lastFrame) {
  throw new Error(
    'prep_flf2v_bridge: last_frame_url missing (still_id=' + (stillId || '?') + '). Snapshot the outgoing clip last frame first.'
  );
}
if (!firstFrame) {
  throw new Error(
    'prep_flf2v_bridge: next_first_frame_url missing (still_id=' +
      (stillId || '?') +
      '). Snapshot the incoming clip at 0.1s first.'
  );
}

var prompt = requireText(item.bridge_prompt, 'bridge_prompt', stillId);
var model = requireText(item.bridge_model, 'bridge_model', stillId);
if (model.indexOf('fal-ai/') === 0 || model.indexOf('fal.run/') !== -1) {
  throw new Error('bridge_model is a fal slug (' + model + '). Use an OpenRouter video slug.');
}
var duration = Number(item.bridge_duration);
if (!isFinite(duration) || duration < 3) {
  throw new Error(
    'SHEETS-ONLY: bridge_duration must be a number ≥ 3 (still_id=' + stillId + ').'
  );
}
var resolution = requireText(item.bridge_resolution, 'bridge_resolution', stillId);

var body = {
  model: model,
  prompt: prompt,
  duration: duration,
  resolution: resolution,
  aspect_ratio: '9:16',
  generate_audio: false,
  frame_images: [
    { type: 'image_url', image_url: { url: lastFrame }, frame_type: 'first_frame' },
    { type: 'image_url', image_url: { url: firstFrame }, frame_type: 'last_frame' },
  ],
};

return [
  {
    json: {
      still_id: stillId,
      reel_id: String(item.reel_id || pick.reel_id || ''),
      last_frame_url: lastFrame,
      next_first_frame_url: firstFrame,
      bridge_prompt: prompt,
      bridge_model: model,
      bridge_duration: duration,
      bridge_resolution: resolution,
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: JSON.stringify(body),
    },
  },
];
