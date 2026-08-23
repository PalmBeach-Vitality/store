// n8n Code node: pick_seedance_scene
// Workflow: seedance_25_vid_gen
// Mode: Run Once for All Items
// After: filter_seedance_active
// Before: fal_seedance_generate
//
// SHEETS-ONLY. Copy prompt / model / duration / resolution / aspect /
// audio / bitrate / wait from the Sheet 17 row. Empty cells throw.
// Do not wrap a look lock here. Do not invent model or duration.

function val(obj, names) {
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  var keys = Object.keys(obj || {});
  for (var w = 0; w < names.length; w++) {
    var want = String(names[w]).toLowerCase().split(' ').join('_');
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].toLowerCase().split(' ').join('_') === want && String(obj[keys[k]]).trim() !== '') {
        return obj[keys[k]];
      }
    }
  }
  return '';
}

function must(obj, names, label, creationId) {
  var v = val(obj, names);
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new Error(
      'pick_seedance_scene: empty sheet field ' +
        label +
        ' on ' +
        (creationId || '?') +
        '. Fill 17-seedance-25-t2v first.'
    );
  }
  return v;
}

function isActive(status) {
  var s = String(status || '').trim().toLowerCase();
  return !s || s === 'active' || s === 'true' || s === '1' || s === 'yes';
}

function capPrompt(text) {
  var t = String(text || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  t = t.trim();
  if (t.length > 7900) t = t.slice(0, 7900);
  return t;
}

function parseAudio(raw, creationId) {
  if (raw === false || raw === true) return raw;
  var s = String(raw === undefined || raw === null ? '' : raw).trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  throw new Error(
    'pick_seedance_scene: audio must be true or false on ' + creationId + '. Got: ' + JSON.stringify(raw)
  );
}

var creations = $input.all().map(function (i) {
  return i.json;
});

if (!creations.length) {
  throw new Error(
    'No Seedance rows. Check get_seedance_scenes → Sheet 17-seedance-25-t2v, status=Active.'
  );
}

var scored = creations
  .map(function (c) {
    var rankNum = Number(val(c, ['rank', 'creation_rank']));
    var creation_id = String(val(c, ['creation_id', 'creationId'])).trim();
    if (!creation_id && rankNum > 0) {
      creation_id = 'SD25-' + String(rankNum).padStart(3, '0');
    }
    return {
      creation_id: creation_id,
      rank: rankNum,
      compound_id: String(val(c, ['compound_id'])).trim(),
      compound_name: String(val(c, ['compound_name'])).trim(),
      canonical_url: String(val(c, ['canonical_url'])).trim(),
      video_prompt: capPrompt(val(c, ['video_prompt'])),
      model_video: String(val(c, ['model_video'])).trim(),
      duration_seconds: val(c, ['duration_seconds', 'duration']),
      resolution: String(val(c, ['resolution'])).trim(),
      aspect_ratio: String(val(c, ['aspect_ratio'])).trim(),
      audio: val(c, ['audio', 'generate_audio']),
      bitrate_mode: String(val(c, ['bitrate_mode'])).trim(),
      wait_seconds: val(c, ['wait_seconds']),
      status: val(c, ['status']) || 'Active',
      times_used: Number(val(c, ['times_used'])) || 0,
      last_used_at: String(val(c, ['last_used_at'])),
    };
  })
  .filter(function (c) {
    return c.creation_id && c.video_prompt && c.compound_name && isActive(c.status);
  });

if (!scored.length) {
  throw new Error(
    'No valid Sheet 17 rows (need creation_id + compound_name + video_prompt). Keys: ' +
      Object.keys(creations[0] || {}).join(', ')
  );
}

var previouslyUsed = scored
  .filter(function (c) {
    return c.times_used > 0 || (c.last_used_at && c.last_used_at.trim());
  })
  .slice()
  .sort(function (a, b) {
    return String(b.last_used_at).localeCompare(String(a.last_used_at));
  });

var lastId = previouslyUsed[0] ? previouslyUsed[0].creation_id : '';

scored.sort(function (a, b) {
  if (a.times_used !== b.times_used) return a.times_used - b.times_used;
  if (lastId && a.creation_id === lastId) return 1;
  if (lastId && b.creation_id === lastId) return -1;
  return a.rank - b.rank;
});

var pick = scored[0];
must(pick, ['video_prompt'], 'video_prompt', pick.creation_id);
must(pick, ['model_video'], 'model_video', pick.creation_id);
must(pick, ['duration_seconds', 'duration'], 'duration_seconds', pick.creation_id);
must(pick, ['resolution'], 'resolution', pick.creation_id);
must(pick, ['aspect_ratio'], 'aspect_ratio', pick.creation_id);
must(pick, ['audio', 'generate_audio'], 'audio', pick.creation_id);
must(pick, ['bitrate_mode'], 'bitrate_mode', pick.creation_id);
must(pick, ['wait_seconds'], 'wait_seconds', pick.creation_id);

var duration = Number(pick.duration_seconds);
if (!duration) {
  throw new Error('pick_seedance_scene: duration_seconds is not a number on ' + pick.creation_id);
}
var waitSeconds = Number(pick.wait_seconds);
if (!waitSeconds) {
  throw new Error('pick_seedance_scene: wait_seconds is not a number on ' + pick.creation_id);
}

var generate_audio = parseAudio(pick.audio, pick.creation_id);
var videoPrompt = capPrompt(pick.video_prompt);

return [
  {
    json: {
      creation_id: pick.creation_id,
      creation_rank: pick.rank,
      compound_id: pick.compound_id,
      compound_name: pick.compound_name,
      canonical_url: pick.canonical_url,
      video_prompt: videoPrompt,
      video_prompt_len: videoPrompt.length,
      model_video: pick.model_video,
      duration_seconds: duration,
      resolution: pick.resolution,
      aspect_ratio: pick.aspect_ratio,
      audio: generate_audio,
      generate_audio: generate_audio,
      bitrate_mode: pick.bitrate_mode,
      wait_seconds: waitSeconds,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,
    },
  },
];
