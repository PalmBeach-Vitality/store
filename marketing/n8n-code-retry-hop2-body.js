// n8n Code node: retry_hop2_body
// After: wait_i2v_extend_quota
// Before: openrouter_i2v_extend
// Rebuild hop 2 OpenRouter POST body from prep_kling_extend after a resource-pack failure.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

var prep = firstJson('prep_kling_extend');
if (!prep.openrouter_body_json) {
  throw new Error('retry_hop2_body missing openrouter_body_json from prep_kling_extend.');
}
var n = Number($runIndex || 0) + 1;
if (n > 5) {
  throw new Error(
    'Kling resource pack still full after ' +
      n +
      ' hop 2 retries. Wait for other Kling jobs to finish, then Execute from prep_kling_extend.'
  );
}

return [
  {
    json: Object.assign({}, prep, {
      hop2_quota_retries: n,
      hop2_poll_count: 0,
    }),
  },
];
