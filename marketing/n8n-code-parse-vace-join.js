// n8n Code node: parse_vace_join
// After: vace_poll
// Before: if_more_batches
// Read WaveSpeed outputs[0]. Keep remaining clip list for the next batch.

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

function pickOutputUrl(obj) {
  obj = obj || {};
  var data = obj.data && typeof obj.data === 'object' ? obj.data : obj;
  var outputs = data.outputs || obj.outputs;
  if (Array.isArray(outputs) && outputs.length) {
    var first = outputs[0];
    if (typeof first === 'string') return httpsUrl(first);
    if (first && typeof first === 'object') {
      return httpsUrl(first.url || first.video_url || first.output);
    }
  }
  return (
    httpsUrl(data.video && data.video.url) ||
    httpsUrl(obj.video && obj.video.url) ||
    httpsUrl(data.url) ||
    httpsUrl(obj.url) ||
    ''
  );
}

var poll = ($input.first() && $input.first().json) || {};
var data = poll.data && typeof poll.data === 'object' ? poll.data : poll;
var status = String(data.status || poll.status || '').toLowerCase();
var err = data.error || poll.error;
if (err && typeof err === 'object') err = err.message || JSON.stringify(err);
if (status !== 'completed') {
  throw new Error(
    'parse_vace_join: WaveSpeed status is ' +
      JSON.stringify(data.status || poll.status) +
      (err ? ' error=' + err : '') +
      '. Raise join_wait_seconds if still processing.'
  );
}

var joined = pickOutputUrl(poll);
if (!joined) {
  throw new Error(
    'parse_vace_join: completed but no https output URL. Keys: ' + Object.keys(poll).join(', ')
  );
}

var prep = firstJson('prep_vace_join');
var remaining = Array.isArray(prep.remaining_urls) ? prep.remaining_urls.slice() : [];
var pick = firstJson('pick_join_reel');

return [
  {
    json: {
      reel_id: String(prep.reel_id || pick.reel_id || ''),
      join_wait_seconds: Number(prep.join_wait_seconds || pick.join_wait_seconds),
      batch_index: Number(prep.batch_index || 0),
      joined_url: joined,
      remaining_urls: remaining,
      has_more: remaining.length > 0,
      vace_prediction_id: String(data.id || poll.id || ''),
    },
  },
];
