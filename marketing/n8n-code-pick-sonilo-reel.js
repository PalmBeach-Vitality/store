// n8n Code node: pick_sonilo_reel
// After: get_film_stills
// Before: prep_sonilo_start
// One reel. Requires sheet audio fields + a public joined video URL.

function val(obj, names) {
  obj = obj || {};
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
  }
  return '';
}

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

function flagFalse(s, name) {
  var v = String(s || '').trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  if (v === 'true' || v === '1' || v === 'yes') {
    throw new Error(
      'SHEETS-ONLY: ' +
        name +
        ' is ' +
        v +
        '. film_sonilo_sound sends generated music+sfx only. Set ' +
        name +
        ' to false.'
    );
  }
  throw new Error('SHEETS-ONLY: 18-motsc-film-stills missing ' + name + ' (expected false).');
}

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('pick_sonilo_reel: no rows from get_film_stills.');
}

var stillIds = [];
var first = null;
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(val(r, ['still_id'])).trim();
  if (!stillId) continue;
  stillIds.push(stillId);
  if (!first) first = r;
}

if (!first) {
  throw new Error('pick_sonilo_reel: no still_id rows on 18-motsc-film-stills.');
}

function req(name) {
  var v = String(val(first, [name])).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: 18-motsc-film-stills missing ' +
        name +
        '. Run overlay_film_sonilo and fill the cell — do not invent a fallback.'
    );
  }
  return v;
}

var reelId = req('reel_id');
var audioHost = req('audio_host').toLowerCase();
if (audioHost !== 'sonilo') {
  throw new Error(
    'SHEETS-ONLY: audio_host must be sonilo (got ' +
      audioHost +
      '). Fal splits music/sfx. Segmind is the same model but this hop calls api.sonilo.com.'
  );
}
var soundType = req('sound_type').toLowerCase();
if (soundType !== 'music_and_sfx') {
  throw new Error(
    'SHEETS-ONLY: sound_type must be music_and_sfx (got ' +
      soundType +
      '). That is the one-call mixed track.'
  );
}
var outputMode = req('output_mode').toLowerCase();
if (outputMode !== 'muxed_video' && outputMode !== 'audio') {
  throw new Error(
    'SHEETS-ONLY: output_mode must be muxed_video or audio (got ' + outputMode + ').'
  );
}
var audioEndpoint = req('audio_endpoint');
if (audioEndpoint.indexOf('https://api.sonilo.com/v1/video-to-') !== 0) {
  throw new Error(
    'SHEETS-ONLY: audio_endpoint must be an https://api.sonilo.com/v1/video-to-* URL.'
  );
}
if (outputMode === 'muxed_video' && audioEndpoint.indexOf('video-to-video-sound') === -1) {
  throw new Error(
    'SHEETS-ONLY: output_mode=muxed_video requires audio_endpoint .../video-to-video-sound.'
  );
}
if (outputMode === 'audio' && !/\/video-to-sound$/.test(audioEndpoint)) {
  throw new Error(
    'SHEETS-ONLY: output_mode=audio requires audio_endpoint .../video-to-sound (not video-to-video-sound).'
  );
}
var pollBase = req('audio_poll_base');
if (pollBase.indexOf('https://api.sonilo.com/v1/tasks') !== 0) {
  throw new Error('SHEETS-ONLY: audio_poll_base must be https://api.sonilo.com/v1/tasks.');
}
var musicPrompt = req('music_prompt');
var sfxPrompt = req('sfx_prompt');
var waitSeconds = Number(req('sonilo_wait_seconds'));
if (!isFinite(waitSeconds) || waitSeconds < 5) {
  throw new Error('SHEETS-ONLY: sonilo_wait_seconds must be a number >= 5.');
}
var maxPolls = Number(req('sonilo_max_polls'));
if (!isFinite(maxPolls) || maxPolls < 1) {
  throw new Error('SHEETS-ONLY: sonilo_max_polls must be a number >= 1.');
}
flagFalse(req('ducking'), 'ducking');
flagFalse(req('preserve_speech'), 'preserve_speech');
flagFalse(req('keep_original_sound'), 'keep_original_sound');

var videoUrl = httpsUrl(val(first, ['join_url'])) || httpsUrl(val(first, ['audio_source_url']));
if (!videoUrl) {
  throw new Error(
    'SHEETS-ONLY: missing https join_url (or audio_source_url). Finish film_vace_join or paste a public joined MP4 into audio_source_url.'
  );
}

return [
  {
    json: {
      reel_id: reelId,
      still_ids: stillIds,
      audio_host: audioHost,
      sound_type: soundType,
      output_mode: outputMode,
      audio_endpoint: audioEndpoint,
      audio_poll_base: pollBase.replace(/\/$/, ''),
      music_prompt: musicPrompt,
      sfx_prompt: sfxPrompt,
      video_url: videoUrl,
      sonilo_wait_seconds: waitSeconds,
      sonilo_max_polls: maxPolls,
      output_format: String(val(first, ['output_format'])).trim(),
    },
  },
];
