// n8n Code node: prep_vace_join
// After: pick_join_reel  OR  parse_vace_join (loop)
// Before: vace_start
// Next WaveSpeed batch: first 4 clips, then joined result + next 3.

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

var pick = firstJson('pick_join_reel');
var parsed = firstJson('parse_vace_join');

var remaining = [];
var joined = '';
var batchIndex = 0;
var reelId = String(pick.reel_id || '').trim();
var waitSeconds = Number(pick.join_wait_seconds);

if (parsed && parsed.joined_url && parsed.has_more) {
  remaining = Array.isArray(parsed.remaining_urls) ? parsed.remaining_urls.slice() : [];
  joined = httpsUrl(parsed.joined_url);
  batchIndex = Number(parsed.batch_index || 0);
  if (parsed.reel_id) reelId = String(parsed.reel_id);
  if (parsed.join_wait_seconds) waitSeconds = Number(parsed.join_wait_seconds);
} else {
  remaining = Array.isArray(pick.remaining_urls) ? pick.remaining_urls.slice() : [];
  if (!remaining.length && Array.isArray(pick.clip_urls)) remaining = pick.clip_urls.slice();
}

if (!reelId) {
  throw new Error('prep_vace_join: missing reel_id from pick_join_reel.');
}
if (!isFinite(waitSeconds) || waitSeconds < 1) {
  throw new Error('SHEETS-ONLY: join_wait_seconds missing or invalid.');
}

var videos = [];
if (joined) {
  videos.push(joined);
  var take = Math.min(3, remaining.length);
  if (take < 1) {
    throw new Error('prep_vace_join: joined_url set but no remaining clips to attach.');
  }
  for (var i = 0; i < take; i++) videos.push(remaining[i]);
  remaining = remaining.slice(take);
} else {
  var firstTake = Math.min(4, remaining.length);
  if (firstTake < 2) {
    throw new Error(
      'prep_vace_join: need at least 2 clip URLs to start a VACE join (got ' + firstTake + ').'
    );
  }
  videos = remaining.slice(0, firstTake);
  remaining = remaining.slice(firstTake);
}

if (videos.length < 2 || videos.length > 4) {
  throw new Error('prep_vace_join: VACE accepts 2–4 videos, got ' + videos.length + '.');
}
for (var v = 0; v < videos.length; v++) {
  if (!httpsUrl(videos[v])) {
    throw new Error('prep_vace_join: videos[' + v + '] is not an https URL.');
  }
}

var body = { videos: videos };

return [
  {
    json: {
      reel_id: reelId,
      join_wait_seconds: waitSeconds,
      batch_index: batchIndex + 1,
      videos: videos,
      remaining_urls: remaining,
      has_more: remaining.length > 0,
      vace_url: 'https://api.wavespeed.ai/api/v3/wavespeed-ai/vace-video-joiner',
      vace_body_json: JSON.stringify(body),
    },
  },
];
