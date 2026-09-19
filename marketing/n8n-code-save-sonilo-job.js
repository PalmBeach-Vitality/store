// n8n Code node: save_sonilo_url
// After: if_sonilo_ready (true)
// Before: sheets_update_sonilo
// Writes muxed URL + times_used onto the scored 22-sonilo-custom job.

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

var pick = firstJson('pick_sonilo_job');
var prep = firstJson('prep_sonilo_start');
var jobId = String(parsed.job_id || pick.job_id || prep.job_id || '').trim();
if (!jobId) throw new Error('save_sonilo_url: job_id empty.');

var audioUrl = httpsUrl(parsed.audio_url);
var videoUrl = httpsUrl(parsed.audio_video_url);
var used = Number(pick.times_used || prep.times_used || 0);
if (!isFinite(used) || used < 0) used = 0;

return [
  {
    json: {
      job_id: jobId,
      audio_url: audioUrl,
      audio_video_url: videoUrl,
      music_stem_url: httpsUrl(parsed.music_stem_url),
      sfx_stem_url: httpsUrl(parsed.sfx_stem_url),
      audio_status: 'scored',
      sonilo_task_id: String(parsed.task_id || ''),
      times_used: used + 1,
      last_used_at: new Date().toISOString(),
    },
  },
];
