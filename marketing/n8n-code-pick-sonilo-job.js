// n8n Code node: pick_sonilo_job
// After: get_sonilo_jobs
// Before: prep_sonilo_start
// One Active job from 22-sonilo-custom. Least times_used.
// Requires https video_url + music_prompt + sfx_prompt. Does not invent prompts.

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
        '. sonilo_custom sends generated music+sfx only. Set ' +
        name +
        ' to false.'
    );
  }
  throw new Error('SHEETS-ONLY: 22-sonilo-custom missing ' + name + ' (expected false).');
}

function isActive(status) {
  return String(status || '').trim().toLowerCase() === 'active';
}

function usedCount(r) {
  var n = Number(val(r, ['times_used']));
  return isFinite(n) ? n : 0;
}

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('pick_sonilo_job: no rows from get_sonilo_jobs.');
}

var withId = [];
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var jobId = String(val(r, ['job_id'])).trim();
  if (!jobId) continue;
  withId.push(r);
}
if (!withId.length) {
  throw new Error('pick_sonilo_job: no job_id rows on 22-sonilo-custom.');
}

var active = withId.filter(function (r) {
  return isActive(val(r, ['status']));
});
if (!active.length) {
  throw new Error(
    'pick_sonilo_job: no Active rows on 22-sonilo-custom. Paste video_url + music_prompt + sfx_prompt and set status=Active.'
  );
}

var complete = active.filter(function (r) {
  return httpsUrl(val(r, ['video_url'])) && String(val(r, ['music_prompt'])).trim() && String(val(r, ['sfx_prompt'])).trim();
});
if (!complete.length) {
  throw new Error(
    'SHEETS-ONLY: Active row missing video_url, music_prompt, or sfx_prompt. Fill the cells — do not invent a fallback.'
  );
}

complete.sort(function (a, b) {
  var du = usedCount(a) - usedCount(b);
  if (du !== 0) return du;
  var ta = String(val(a, ['last_used_at']) || '');
  var tb = String(val(b, ['last_used_at']) || '');
  if (ta !== tb) return ta < tb ? -1 : 1;
  return String(val(a, ['job_id'])).localeCompare(String(val(b, ['job_id'])));
});

var first = complete[0];

function req(name) {
  var v = String(val(first, [name])).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: 22-sonilo-custom missing ' + name + ' on ' + val(first, ['job_id']) + '. Fill the cell — do not invent a fallback.'
    );
  }
  return v;
}

var audioHost = req('audio_host').toLowerCase();
if (audioHost !== 'sonilo') {
  throw new Error('SHEETS-ONLY: audio_host must be sonilo (got ' + audioHost + ').');
}
var soundType = req('sound_type').toLowerCase();
if (soundType !== 'music_and_sfx') {
  throw new Error('SHEETS-ONLY: sound_type must be music_and_sfx (got ' + soundType + ').');
}
var outputMode = req('output_mode').toLowerCase();
if (outputMode !== 'muxed_video' && outputMode !== 'audio') {
  throw new Error('SHEETS-ONLY: output_mode must be muxed_video or audio (got ' + outputMode + ').');
}
var audioEndpoint = req('audio_endpoint');
if (audioEndpoint.indexOf('https://api.sonilo.com/v1/video-to-') !== 0) {
  throw new Error('SHEETS-ONLY: audio_endpoint must be an https://api.sonilo.com/v1/video-to-* URL.');
}
if (outputMode === 'muxed_video' && audioEndpoint.indexOf('video-to-video-sound') === -1) {
  throw new Error('SHEETS-ONLY: output_mode=muxed_video requires audio_endpoint .../video-to-video-sound.');
}
if (outputMode === 'audio' && !/\/video-to-sound$/.test(audioEndpoint)) {
  throw new Error('SHEETS-ONLY: output_mode=audio requires audio_endpoint .../video-to-sound.');
}
var pollBase = req('audio_poll_base');
if (pollBase.indexOf('https://api.sonilo.com/v1/tasks') !== 0) {
  throw new Error('SHEETS-ONLY: audio_poll_base must be https://api.sonilo.com/v1/tasks.');
}
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

return [
  {
    json: {
      job_id: req('job_id'),
      title: String(val(first, ['title'])).trim(),
      audio_host: audioHost,
      sound_type: soundType,
      output_mode: outputMode,
      audio_endpoint: audioEndpoint,
      audio_poll_base: pollBase.replace(/\/$/, ''),
      music_prompt: req('music_prompt'),
      sfx_prompt: req('sfx_prompt'),
      video_url: httpsUrl(val(first, ['video_url'])),
      sonilo_wait_seconds: waitSeconds,
      sonilo_max_polls: maxPolls,
      times_used: usedCount(first),
    },
  },
];
