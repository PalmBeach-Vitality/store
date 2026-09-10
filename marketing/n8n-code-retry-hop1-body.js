// n8n Code node: retry_hop1_body
// After: wait_i2v_quota
// Before: openrouter_i2v_start
// Rebuild the OpenRouter POST body from prep after a resource-pack failure.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

var prep = firstJson('prep_molecule_video_start');
if (!prep.openrouter_body_json) {
  throw new Error('retry_hop1_body missing openrouter_body_json from prep_molecule_video_start.');
}
var n = Number($runIndex || 0) + 1;
if (n > 5) {
  throw new Error(
    'Kling resource pack still full after ' +
      n +
      ' hop 1 retries. Wait for other Kling jobs to finish, then Execute from prep_molecule_video_start.'
  );
}

return [
  {
    json: Object.assign({}, prep, {
      hop1_quota_retries: n,
      hop1_poll_count: 0,
    }),
  },
];
