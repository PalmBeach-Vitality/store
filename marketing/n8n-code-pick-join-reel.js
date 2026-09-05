// n8n Code node: pick_join_reel
// After: get_film_stills
// Before: prep_vace_join
// Assemble 25 public clip URLs from Sheet 18. Fail if any clip or join field is missing.

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

function requireField(row, name, stillId) {
  var v = String(val(row, [name]) == null ? '' : val(row, [name])).trim();
  if (!v) {
    throw new Error(
      'SHEETS-ONLY: 18-motsc-film-stills missing ' +
        name +
        ' (still_id=' +
        (stillId || '?') +
        '). Run overlay_film_join_25 and fill clip video_url.'
    );
  }
  return v;
}

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('pick_join_reel: no rows from get_film_stills.');
}

var clips = [];
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(val(r, ['still_id'])).trim();
  if (!stillId) continue;
  var order = Number(requireField(r, 'clip_order', stillId));
  if (!isFinite(order) || order < 1) {
    throw new Error('SHEETS-ONLY: clip_order must be a number (still_id=' + stillId + ').');
  }
  var clipUrl = httpsUrl(val(r, ['video_url', 'clip_url']));
  if (!clipUrl) {
    throw new Error(
      'SHEETS-ONLY: missing https video_url for still_id=' +
        stillId +
        '. Finish film_i2v_* for all 25 clips first.'
    );
  }
  var seamMode = String(val(r, ['seam_mode']) || 'vace')
    .trim()
    .toLowerCase();
  if (seamMode !== 'vace' && seamMode !== 'flf2v') {
    throw new Error(
      'SHEETS-ONLY: seam_mode must be vace or flf2v (still_id=' + stillId + ', got ' + seamMode + ').'
    );
  }
  var bridgePrompt = String(val(r, ['bridge_prompt'])).trim();
  if (seamMode === 'flf2v' && !bridgePrompt) {
    throw new Error(
      'SHEETS-ONLY: seam_mode=flf2v requires bridge_prompt (still_id=' + stillId + ').'
    );
  }
  clips.push({
    still_id: stillId,
    clip_order: order,
    clip_url: clipUrl,
    seam_mode: seamMode,
    bridge_prompt: bridgePrompt,
    bridge_model: String(val(r, ['bridge_model'])).trim(),
    bridge_duration: String(val(r, ['bridge_duration'])).trim(),
    bridge_resolution: String(val(r, ['bridge_resolution'])).trim(),
  });
}

clips.sort(function (a, b) {
  return a.clip_order - b.clip_order;
});

if (clips.length !== 25) {
  throw new Error('pick_join_reel: expected 25 clip rows, got ' + clips.length + '.');
}

for (var j = 0; j < clips.length; j++) {
  if (Number(clips[j].clip_order) !== j + 1) {
    throw new Error(
      'pick_join_reel: clip_order must be 1..25 with no gaps (missing ' + (j + 1) + ').'
    );
  }
}

var first = rows[0] || {};
var reelId = requireField(first, 'reel_id', clips[0].still_id);
var waitRaw = requireField(first, 'join_wait_seconds', clips[0].still_id);
var waitSeconds = Number(waitRaw);
if (!isFinite(waitSeconds) || waitSeconds < 1) {
  throw new Error(
    'SHEETS-ONLY: join_wait_seconds must be a number (got ' + JSON.stringify(waitRaw) + ').'
  );
}

var clipUrls = clips.map(function (c) {
  return c.clip_url;
});

return [
  {
    json: {
      reel_id: reelId,
      join_wait_seconds: waitSeconds,
      clip_count: clipUrls.length,
      clip_urls: clipUrls,
      remaining_urls: clipUrls.slice(),
      joined_url: '',
      batch_index: 0,
      has_more: true,
      clips: clips,
    },
  },
];
