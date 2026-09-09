// n8n Code node: pick_film_still
// Workflow: film_i2v_runway
// Mode: Run Once for All Items
// After: get_film_stills
// Before: prep_runway_video_start
//
// SHEETS-ONLY. Next Active row with picked_url, empty video_url, and
// video_provider matching REQUIRED_PROVIDER. Empty required cells throw.

var REQUIRED_PROVIDER = 'runway';

function val(obj, names) {
  obj = obj || {};
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return '';
}

function requireField(row, name, stillId) {
  var v = String(val(row, [name]) == null ? '' : val(row, [name])).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: 18-motsc-film-stills row missing ' +
        name +
        ' (still_id=' +
        (stillId || '?') +
        '). Fill the cell, do not hardcode.'
    );
  }
  return v;
}

function httpsUrl(s) {
  s = String(s || '').trim();
  return /^https:\/\//i.test(s) ? s : '';
}

function parseAudio(raw, stillId) {
  if (raw === false || raw === true) return raw;
  var s = String(raw === undefined || raw === null ? '' : raw)
    .trim()
    .toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  throw new Error(
    'SHEETS-ONLY: audio must be true or false (still_id=' + stillId + ', got ' + JSON.stringify(raw) + ')'
  );
}

function durationOk(provider, duration) {
  if (provider === 'seedance') return duration >= 4 && duration <= 30;
  if (provider === 'kling') return duration >= 3 && duration <= 15;
  if (provider === 'veo') return duration === 4 || duration === 6 || duration === 8;
  if (provider === 'runway') return duration >= 2 && duration <= 10;
  return false;
}

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('No film still rows. Check get_film_stills Document 18-motsc-film-stills.');
}

var scored = rows
  .map(function (r) {
    return {
      still_id: String(val(r, ['still_id'])).trim(),
      rank: Number(val(r, ['rank'])) || 0,
      category: String(val(r, ['category'])).trim(),
      status: String(val(r, ['status'])).trim(),
      picked_url: httpsUrl(val(r, ['picked_url'])),
      video_url: httpsUrl(val(r, ['video_url'])),
      video_motion_prompt: String(val(r, ['video_motion_prompt'])).trim(),
      video_provider: String(val(r, ['video_provider'])).trim().toLowerCase(),
      model_video: String(val(r, ['model_video'])).trim(),
      duration_seconds: val(r, ['duration_seconds', 'duration']),
      resolution: String(val(r, ['video_resolution', 'resolution'])).trim(),
      video_aspect_ratio: String(val(r, ['video_aspect_ratio'])).trim(),
      audio: val(r, ['audio', 'generate_audio']),
      bitrate_mode: String(val(r, ['bitrate_mode'])).trim(),
      wait_seconds: val(r, ['wait_seconds']),
      video_start_url: String(val(r, ['video_start_url'])).trim(),
      times_used: Number(val(r, ['times_used'])) || 0,
    };
  })
  .filter(function (r) {
    return (
      r.still_id &&
      r.status.toLowerCase() === 'active' &&
      r.picked_url &&
      !r.video_url &&
      r.video_provider === REQUIRED_PROVIDER
    );
  })
  .sort(function (a, b) {
    return a.rank - b.rank;
  });

if (!scored.length) {
  throw new Error(
    'No Active ' +
      REQUIRED_PROVIDER +
      ' rows with picked_url and empty video_url. Run the matching film_i2v_* workflow, or fill picked_url.'
  );
}

var pick = scored[0];
var motion = requireField(pick, 'video_motion_prompt', pick.still_id);
var provider = requireField(pick, 'video_provider', pick.still_id);
if (provider !== REQUIRED_PROVIDER) {
  throw new Error(
    'pick_film_still: row ' + pick.still_id + ' is ' + provider + ', this workflow requires ' + REQUIRED_PROVIDER
  );
}
var model = requireField(pick, 'model_video', pick.still_id);
var durationRaw = requireField(pick, 'duration_seconds', pick.still_id);
var duration = Number(durationRaw);
if (!isFinite(duration) || !durationOk(provider, duration)) {
  throw new Error(
    'SHEETS-ONLY: duration_seconds out of range for ' +
      provider +
      ' (still_id=' +
      pick.still_id +
      ', got ' +
      durationRaw +
      ')'
  );
}
var resolution = requireField(pick, 'resolution', pick.still_id);
var waitRaw = requireField(pick, 'wait_seconds', pick.still_id);
var waitSeconds = Number(waitRaw);
if (!isFinite(waitSeconds) || waitSeconds < 1) {
  throw new Error(
    'SHEETS-ONLY: wait_seconds must be a number (still_id=' + pick.still_id + ', got ' + waitRaw + ')'
  );
}
var audio = parseAudio(pick.audio, pick.still_id);
var startUrl = requireField(pick, 'video_start_url', pick.still_id);

var aspect = String(pick.video_aspect_ratio || '').trim();
if (provider === 'seedance' || provider === 'veo' || provider === 'runway') {
  aspect = requireField(pick, 'video_aspect_ratio', pick.still_id);
}

var bitrate = String(pick.bitrate_mode || '').trim();
if (provider === 'seedance') {
  bitrate = requireField(pick, 'bitrate_mode', pick.still_id);
}

var veoDuration = String(duration) + 's';

return [
  {
    json: {
      still_id: pick.still_id,
      category: pick.category,
      rank: pick.rank,
      picked_url: pick.picked_url,
      still_url: pick.picked_url,
      video_motion_prompt: motion,
      video_provider: provider,
      model_video: model,
      duration_seconds: duration,
      duration_label: provider === 'veo' ? veoDuration : String(duration),
      resolution: resolution,
      video_aspect_ratio: aspect,
      audio: audio,
      generate_audio: audio,
      bitrate_mode: bitrate,
      wait_seconds: waitSeconds,
      video_start_url: startUrl,
      still_times_used: pick.times_used,
      remaining_without_video: scored.length,
    },
  },
];
