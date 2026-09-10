// n8n Code node: parse_hop2_public
// After: upload_hop2_public
// Before: prep_creatomate_concat
// Litterbox/catbox returns a public https MP4 URL. Creatomate cannot fetch OpenRouter unsigned_urls.

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

var j = ($input.first() && $input.first().json) || {};
var raw = httpsUrl(j.data || j.body || j.text || j.url || j.public_video_url);
if (!raw) {
  throw new Error(
    'parse_hop2_public: upload_hop2_public did not return an https URL. Got: ' +
      String(j.data || j.body || j.text || '').slice(0, 200)
  );
}

var hop2 = firstJson('route_hop2');
if (!hop2.id) hop2 = firstJson('openrouter_i2v_extend_poll');

return [
  {
    json: {
      public_video_url: raw,
      video_url_extend: raw,
      openrouter_id: String(hop2.id || ''),
      creation_id: String(firstJson('pick_molecule_creation').creation_id || ''),
    },
  },
];
