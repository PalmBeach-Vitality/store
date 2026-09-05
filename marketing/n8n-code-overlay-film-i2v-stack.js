// n8n Code node: overlay_film_i2v_stack
// Workflow: overlay_film_i2v_stack
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_i2v
//
// Writes I2V stack columns onto every 18-motsc-film-stills row.
// OpenRouter slugs + start URL. Does not rewrite still_prompt, picked_url, take_urls, or keepers.

var STACK = {
  'FILM-001': ['veo', '8', '9:16', '', '180'],
  'FILM-002': ['veo', '8', '9:16', '', '180'],
  'FILM-003': ['veo', '8', '9:16', '', '180'],
  'FILM-004': ['veo', '8', '9:16', '', '180'],
  'FILM-005': ['veo', '8', '9:16', '', '180'],
  'FILM-006': ['veo', '8', '9:16', '', '180'],
  'FILM-007': ['veo', '8', '9:16', '', '180'],
  'FILM-008': ['veo', '8', '9:16', '', '180'],
  'FILM-009': ['seedance', '10', '9:16', '', '300'],
  'FILM-010': ['seedance', '10', '9:16', '', '300'],
  'FILM-011': ['veo', '8', '9:16', '', '180'],
  'FILM-012': ['seedance', '10', '9:16', '', '300'],
  'FILM-013': ['seedance', '10', '9:16', '', '300'],
  'FILM-014': ['seedance', '10', '9:16', '', '300'],
  'FILM-015': ['kling', '10', '9:16', '', '180'],
  'FILM-016': ['seedance', '10', '9:16', '', '300'],
  'FILM-017': ['seedance', '10', '9:16', '', '300'],
  'FILM-018': ['seedance', '10', '9:16', '', '300'],
  'FILM-019': ['veo', '8', '9:16', '', '180'],
  'FILM-020': ['kling', '10', '9:16', '', '180'],
  'FILM-021': ['veo', '8', '9:16', '', '180'],
  'FILM-022': ['seedance', '10', '9:16', '', '300'],
  'FILM-023': ['seedance', '10', '9:16', '', '300'],
  'FILM-024': ['seedance', '10', '9:16', '', '300'],
  'FILM-025': ['kling', '10', '9:16', '', '180'],
};

var MODELS = {
  seedance: 'bytedance/seedance-2.5',
  kling: 'kwaivgi/kling-v3.0-pro',
  veo: 'google/veo-3.1',
  runway: 'gen4.5',
};

var START_URLS = {
  seedance: 'https://openrouter.ai/api/v1/videos',
  kling: 'https://openrouter.ai/api/v1/videos',
  veo: 'https://openrouter.ai/api/v1/videos',
  runway: 'https://api.dev.runwayml.com/v1/image_to_video',
};

var RESOLUTIONS = {
  seedance: '720p',
  kling: '720p',
  veo: '1080p',
  runway: '1080p',
};

var WORKFLOWS = {
  veo: 'https://stockjohnson.app.n8n.cloud/workflow/FXSBCQUQpaFm7UF6',
  seedance: 'https://stockjohnson.app.n8n.cloud/workflow/WBNhPMWNITxgPZHK',
  kling: 'https://stockjohnson.app.n8n.cloud/workflow/XxR5vPPtCNVB7Pxr',
  runway: 'https://stockjohnson.app.n8n.cloud/workflow/XLuewXSfNuVkn9aS',
};

var WORKFLOW_GROK = 'https://stockjohnson.app.n8n.cloud/workflow/qZ7qU8LVwVXAXyaL';

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
      video_resolution: RESOLUTIONS[provider],
      video_aspect_ratio: spec[2],
      audio: 'false',
      bitrate_mode: spec[3],
      wait_seconds: spec[4],
      video_start_url: START_URLS[provider],
      i2v_workflow_url: WORKFLOWS[provider],
      workflow_url_veo: WORKFLOWS.veo,
      workflow_url_seedance: WORKFLOWS.seedance,
      workflow_url_kling: WORKFLOWS.kling,
      workflow_url_runway: WORKFLOWS.runway,
      workflow_url_grok: WORKFLOW_GROK,
    },
  });
}

if (out.length !== 25) {
  throw new Error('overlay_film_i2v_stack: expected 25 rows, got ' + out.length);
}

return out;
