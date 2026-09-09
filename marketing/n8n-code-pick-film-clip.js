// n8n Code node: pick_film_still
// Workflow: custom_vid_gen 1.5 -18-motsc-film-stills (film I2V)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: prep_film_video_start
//
// SHEETS-ONLY. Next Active row with picked_url and empty video_url.
// Empty video_motion_prompt / model_video / duration / resolution / audio throws.

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

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error(
    'No film still rows. Check get_film_stills Document 18-motsc-film-stills.'
  );
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
      model_video: String(val(r, ['model_video'])).trim(),
      duration_seconds: val(r, ['duration_seconds', 'duration']),
      resolution: String(val(r, ['video_resolution', 'resolution'])).trim(),
      audio: val(r, ['audio', 'generate_audio']),
      wait_seconds: val(r, ['wait_seconds']),
      times_used: Number(val(r, ['times_used'])) || 0,
    };
  })
  .filter(function (r) {
    return (
      r.still_id &&
      r.status.toLowerCase() === 'active' &&
      r.picked_url &&
      !r.video_url
    );
  })
  .sort(function (a, b) {
    return a.rank - b.rank;
  });

if (!scored.length) {
  throw new Error(
    'No Active film rows with picked_url and empty video_url. First row keys: ' +
      Object.keys(rows[0] || {}).join(', ')
  );
}

var pick = scored[0];
var motion = requireField(pick, 'video_motion_prompt', pick.still_id);
var model = requireField(pick, 'model_video', pick.still_id);
var durationRaw = requireField(pick, 'duration_seconds', pick.still_id);
var duration = Number(durationRaw);
if (!isFinite(duration) || duration < 1 || duration > 15) {
  throw new Error(
    'SHEETS-ONLY: duration_seconds must be 1-15 (still_id=' + pick.still_id + ', got ' + durationRaw + ')'
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

if (motion.length > 700) motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';

return [
  {
    json: {
      still_id: pick.still_id,
      category: pick.category,
      rank: pick.rank,
      picked_url: pick.picked_url,
      still_url: pick.picked_url,
      video_motion_prompt: motion,
      model_video: model,
      duration_seconds: duration,
      resolution: resolution,
      audio: audio,
      wait_seconds: waitSeconds,
      still_times_used: pick.times_used,
      remaining_without_video: scored.length,
    },
  },
];
