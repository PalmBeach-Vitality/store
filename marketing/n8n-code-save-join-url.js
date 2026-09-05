// n8n Code node: save_join_url
// After: parse_vace_join (has_more = false)
// Before: sheets_update_join
// Write the final joined MP4 onto every Sheet 18 row for this reel.

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

var parsed = ($input.first() && $input.first().json) || {};
if (parsed.has_more) {
  throw new Error('save_join_url: batches remain. Wire this node only on if_more_batches false.');
}
var joined = httpsUrl(parsed.joined_url);
if (!joined) {
  throw new Error('save_join_url: missing joined_url from parse_vace_join.');
}

var pick = firstJson('pick_join_reel');
var clips = Array.isArray(pick.clips) ? pick.clips : [];
if (!clips.length) {
  throw new Error('save_join_url: pick_join_reel.clips empty.');
}

var out = [];
for (var i = 0; i < clips.length; i++) {
  out.push({
    json: {
      still_id: clips[i].still_id,
      reel_id: String(parsed.reel_id || pick.reel_id || ''),
      join_url: joined,
      join_status: 'joined',
      vace_prediction_id: String(parsed.vace_prediction_id || ''),
      join_batch_count: Number(parsed.batch_index || 0),
    },
  });
}
return out;
