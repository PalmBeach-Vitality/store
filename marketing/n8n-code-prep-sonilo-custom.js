// n8n Code node: prep_sonilo_start
// After: pick_sonilo_job
// Before: sonilo_start
// Maps 22-sonilo-custom fields onto the Sonilo multipart body. No invented prompts.

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

var pick = ($input.first() && $input.first().json) || firstJson('pick_sonilo_job');
var videoUrl = httpsUrl(pick.video_url);
var musicPrompt = String(pick.music_prompt || '').trim();
var sfxPrompt = String(pick.sfx_prompt || '').trim();
var endpoint = String(pick.audio_endpoint || '').trim();
var pollBase = String(pick.audio_poll_base || '').trim();
if (!videoUrl) throw new Error('prep_sonilo_start: missing https video_url from pick_sonilo_job.');
if (!musicPrompt) throw new Error('SHEETS-ONLY: music_prompt empty. Fill the sheet cell.');
if (!sfxPrompt) throw new Error('SHEETS-ONLY: sfx_prompt empty. Fill the sheet cell.');
if (!endpoint) throw new Error('SHEETS-ONLY: audio_endpoint empty. Fill the sheet cell.');
if (!pollBase) throw new Error('SHEETS-ONLY: audio_poll_base empty. Fill the sheet cell.');

return [
  {
    json: {
      job_id: String(pick.job_id || ''),
      title: String(pick.title || ''),
      video_url: videoUrl,
      music_prompt: musicPrompt,
      sfx_prompt: sfxPrompt,
      audio_endpoint: endpoint,
      audio_poll_base: pollBase,
      output_mode: String(pick.output_mode || ''),
      sonilo_wait_seconds: Number(pick.sonilo_wait_seconds),
      sonilo_max_polls: Number(pick.sonilo_max_polls),
      times_used: Number(pick.times_used || 0),
    },
  },
];
