// n8n Code node: save_sonilo_url
// After: if_sonilo_ready (true)
// Before: sheets_update_sonilo
// Writes the mixed track / muxed video URL onto every still in the reel.

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
if (!parsed.ready) {
  throw new Error('save_sonilo_url: Sonilo is still processing. Wire this node only on if_sonilo_ready true.');
}

var outputUrl = httpsUrl(parsed.output_url);
if (!outputUrl) throw new Error('save_sonilo_url: missing output_url from parse_sonilo.');

var pick = firstJson('pick_sonilo_reel');
var stillIds = Array.isArray(parsed.still_ids)
  ? parsed.still_ids
  : Array.isArray(pick.still_ids)
    ? pick.still_ids
    : [];
if (!stillIds.length) throw new Error('save_sonilo_url: still_ids empty.');

var audioUrl = httpsUrl(parsed.audio_url);
var videoUrl = httpsUrl(parsed.audio_video_url);
var out = [];
for (var i = 0; i < stillIds.length; i++) {
  out.push({
    json: {
      still_id: stillIds[i],
      reel_id: String(parsed.reel_id || pick.reel_id || ''),
      audio_url: audioUrl,
      audio_video_url: videoUrl,
      music_stem_url: httpsUrl(parsed.music_stem_url),
      sfx_stem_url: httpsUrl(parsed.sfx_stem_url),
      audio_status: 'scored',
      sonilo_task_id: String(parsed.task_id || ''),
    },
  });
}
return out;
