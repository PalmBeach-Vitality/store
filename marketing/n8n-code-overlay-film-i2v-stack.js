// n8n Code node: overlay_film_i2v_stack
// Workflow: overlay_film_i2v_stack
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_i2v
//
// Writes I2V stack columns onto every 18-motsc-film-stills row.
// Does not rewrite still_prompt, picked_url, take_urls, or keepers.

var STACK = {
  'FILM-001': ['veo', '8', '9:16', '', '180'],
  'FILM-002': ['veo', '8', '9:16', '', '180'],
  'FILM-003': ['veo', '8', '9:16', '', '180'],
  'FILM-004': ['veo', '8', '9:16', '', '180'],
  'FILM-005': ['veo', '8', '9:16', '', '180'],
  'FILM-006': ['veo', '8', '9:16', '', '180'],
  'FILM-007': ['veo', '8', '9:16', '', '180'],
  'FILM-008': ['veo', '8', '9:16', '', '180'],
  'FILM-009': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-010': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-011': ['veo', '8', '9:16', '', '180'],
  'FILM-012': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-013': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-014': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-015': ['kling', '10', '', '', '180'],
  'FILM-016': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-017': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-018': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-019': ['veo', '8', '9:16', '', '180'],
  'FILM-020': ['kling', '10', '', '', '180'],
  'FILM-021': ['veo', '8', '9:16', '', '180'],
  'FILM-022': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-023': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-024': ['seedance', '10', 'auto', 'standard', '300'],
  'FILM-025': ['kling', '10', '', '', '180'],
};

var MODELS = {
  seedance: 'bytedance/seedance-2.5/image-to-video',
  kling: 'fal-ai/kling-video/v3/pro/image-to-video',
  veo: 'fal-ai/veo3.1/image-to-video',
  runway: 'gen4.5',
};

var START_URLS = {
  seedance: 'https://fal.run/bytedance/seedance-2.5/image-to-video',
  kling: 'https://fal.run/fal-ai/kling-video/v3/pro/image-to-video',
  veo: 'https://fal.run/fal-ai/veo3.1/image-to-video',
  runway: 'https://api.dev.runwayml.com/v1/image_to_video',
};

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film_i2v_stack: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!stillId) continue;
  var spec = STACK[stillId];
  if (!spec) {
    throw new Error('overlay_film_i2v_stack: missing stack row for ' + stillId);
  }
  var provider = spec[0];
  out.push({
    json: {
      still_id: stillId,
      video_provider: provider,
      model_video: MODELS[provider],
      duration_seconds: spec[1],
      video_resolution: '1080p',
      video_aspect_ratio: spec[2],
      audio: 'false',
      bitrate_mode: spec[3],
      wait_seconds: spec[4],
      video_start_url: START_URLS[provider],
    },
  });
}

if (out.length !== 25) {
  throw new Error('overlay_film_i2v_stack: expected 25 rows, got ' + out.length);
}

return out;
