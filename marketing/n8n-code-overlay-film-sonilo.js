// n8n Code node: overlay_film_sonilo
// Workflow: overlay_film_sonilo (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_sonilo
//
// Writes Sonilo video-to-sound columns onto every 18-motsc-film-stills row.
// Does not touch picked_url, video_url, still_prompt, join_url, or seam_mode.

var REEL_ID = 'MOTSC-FILM-01';
var AUDIO_HOST = 'sonilo';
var SOUND_TYPE = 'music_and_sfx';
var OUTPUT_MODE = 'muxed_video';
var AUDIO_ENDPOINT = 'https://api.sonilo.com/v1/video-to-video-sound';
var AUDIO_POLL_BASE = 'https://api.sonilo.com/v1/tasks';
var MUSIC_PROMPT = 'cinematic sci-fi, tense then triumphant';
var SFX_PROMPT = 'match the on-screen action.';
var WAIT_SECONDS = '90';
var MAX_POLLS = '20';
var OUTPUT_FORMAT = 'wav';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film_sonilo: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!stillId) continue;
  if (!/^FILM-\d+$/i.test(stillId)) {
    throw new Error('overlay_film_sonilo: unexpected still_id ' + stillId);
  }
  out.push({
    json: {
      still_id: stillId,
      reel_id: REEL_ID,
      audio_host: AUDIO_HOST,
      sound_type: SOUND_TYPE,
      output_mode: OUTPUT_MODE,
      audio_endpoint: AUDIO_ENDPOINT,
      audio_poll_base: AUDIO_POLL_BASE,
      music_prompt: MUSIC_PROMPT,
      sfx_prompt: SFX_PROMPT,
      sonilo_wait_seconds: WAIT_SECONDS,
      sonilo_max_polls: MAX_POLLS,
      output_format: OUTPUT_FORMAT,
      ducking: 'false',
      preserve_speech: 'false',
      keep_original_sound: 'false',
      audio_source_url: '',
      audio_url: '',
      audio_video_url: '',
      music_stem_url: '',
      sfx_stem_url: '',
      audio_status: '',
      sonilo_task_id: '',
    },
  });
}

if (out.length !== 25) {
  throw new Error('overlay_film_sonilo: expected 25 rows, got ' + out.length);
}

return out;
