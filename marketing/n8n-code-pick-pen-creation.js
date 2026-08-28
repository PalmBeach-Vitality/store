// n8n Code node: pick_pen_creation
// Workflow: peptide_pen_vid_gen
// Mode: Run Once for All Items
// After: get_pen_creations / filter Active on 14-pen-creations-150
// Before: grok_imagine_pen_still
//
// SHEETS-ONLY. Copy video_prompt / video_motion_prompt / still_edit_prompt
// from the Sheet 14 row. Do NOT wrap a look lock here — catalog crimson/cobalt
// COUNT=1 lives on the sheet. Empty cells throw.

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
      'pick_pen_creation: empty sheet field ' +
        label +
        ' on ' +
        (creationId || '?') +
        '. Overlay COUNT=1 catalog look onto Sheet 14 first.'
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

var creations = $input.all().map(function (i) {
  return i.json;
});

if (!creations.length) {
  throw new Error(
    'No pen rows. Check get_pen_creations → Sheet 14-pen-creations-150, status=Active.'
  );
}

var scored = creations
  .map(function (c) {
    var rankNum = Number(val(c, ['rank', 'creation_rank']));
    var creation_id = String(val(c, ['creation_id', 'creationId'])).trim();
    if (!creation_id && rankNum > 0) {
      creation_id = 'PBVita-Pen-' + String(rankNum).padStart(3, '0');
    }
    return {
      creation_id: creation_id,
      rank: rankNum,
      lab_item_id: val(c, ['lab_item_id']),
      lab_item: val(c, ['lab_item']),
      material_detail: val(c, ['material_detail']),
      compound_name: String(val(c, ['compound_name'])).trim(),
      shot_family: val(c, ['shot_family']),
      camera_angle: val(c, ['camera_angle']),
      camera_direction: val(c, ['camera_direction']),
      framing: val(c, ['framing']),
      category: val(c, ['category', 'scene_category']),
      scene_brief: val(c, ['scene_brief']),
      quality_suffix: val(c, ['quality_suffix']),
      quality_var_count: val(c, ['quality_var_count']),
      aspect_ratio: val(c, ['aspect_ratio']),
      duration_seconds: val(c, ['duration_seconds', 'duration']),
      resolution: val(c, ['resolution']),
      model_still: val(c, ['model_still']),
      model_video: val(c, ['model_video']),
      still_resolution: val(c, ['still_resolution']),
      still_n: val(c, ['still_n']),
      video_prompt: capPrompt(val(c, ['video_prompt'])),
      video_motion_prompt: capPrompt(val(c, ['video_motion_prompt'])),
      still_edit_prompt: String(val(c, ['still_edit_prompt'])).trim(),
      surface: val(c, ['surface']),
      lighting: val(c, ['lighting']),
      camera_move: val(c, ['camera_move']),
      color_grade: val(c, ['color_grade']),
      hero_style: val(c, ['hero_style']),
      status: val(c, ['status']) || 'Active',
      times_used: Number(val(c, ['times_used'])) || 0,
      last_used_at: String(val(c, ['last_used_at'])),
    };
  })
  .filter(function (c) {
    return c.creation_id && c.video_prompt && c.video_motion_prompt && c.compound_name && isActive(c.status);
  });

if (!scored.length) {
  throw new Error(
    'No valid Sheet 14 rows (need creation_id + compound_name + video_prompt + video_motion_prompt). Keys: ' +
      Object.keys(creations[0] || {}).join(', ')
  );
}

var compoundTimes = {};
scored.forEach(function (c) {
  var k = c.compound_name;
  compoundTimes[k] = (compoundTimes[k] || 0) + c.times_used;
});

var previouslyUsed = scored
  .filter(function (c) {
    return c.times_used > 0 || (c.last_used_at && c.last_used_at.trim());
  })
  .slice()
  .sort(function (a, b) {
    return String(b.last_used_at).localeCompare(String(a.last_used_at));
  });

var RECENT_N = 5;
var recentCompounds = [];
var seenRecent = {};
for (var r = 0; r < previouslyUsed.length; r++) {
  var nm = previouslyUsed[r].compound_name;
  if (!nm || seenRecent[nm]) continue;
  seenRecent[nm] = true;
  recentCompounds.push(nm);
  if (recentCompounds.length >= RECENT_N) break;
}
var lastCompound = recentCompounds[0] || '';

function scorePick(c) {
  var penalty = c.times_used * 100;
  penalty += (compoundTimes[c.compound_name] || 0) * 40;
  var recentIdx = recentCompounds.indexOf(c.compound_name);
  if (recentIdx !== -1) {
    penalty += 8000 + (RECENT_N - recentIdx) * 400;
  }
  if (lastCompound && c.compound_name === lastCompound) penalty += 5000;
  penalty += c.rank * 0.001;
  return penalty;
}

scored.sort(function (a, b) {
  var pa = scorePick(a);
  var pb = scorePick(b);
  if (pa !== pb) return pa - pb;
  if (a.times_used !== b.times_used) return a.times_used - b.times_used;
  return a.rank - b.rank;
});

var pick = scored[0];
must(pick, ['video_prompt'], 'video_prompt', pick.creation_id);
must(pick, ['video_motion_prompt'], 'video_motion_prompt', pick.creation_id);
must(pick, ['still_edit_prompt'], 'still_edit_prompt', pick.creation_id);
must(pick, ['aspect_ratio'], 'aspect_ratio', pick.creation_id);
must(pick, ['duration_seconds', 'duration'], 'duration_seconds', pick.creation_id);
must(pick, ['resolution'], 'resolution', pick.creation_id);
must(pick, ['model_still'], 'model_still', pick.creation_id);
must(pick, ['model_video'], 'model_video', pick.creation_id);
must(pick, ['still_resolution'], 'still_resolution', pick.creation_id);
must(pick, ['still_n'], 'still_n', pick.creation_id);

var duration = Number(pick.duration_seconds);
if (!duration) {
  throw new Error('pick_pen_creation: duration_seconds is not a number on ' + pick.creation_id);
}
var stillN = Number(pick.still_n);
if (!stillN) {
  throw new Error('pick_pen_creation: still_n is not a number on ' + pick.creation_id);
}

var videoPrompt = capPrompt(pick.video_prompt);

return [
  {
    json: {
      creation_id: pick.creation_id,
      creation_rank: pick.rank,
      lab_item_id: pick.lab_item_id,
      lab_item: pick.lab_item,
      material_detail: pick.material_detail,
      compound_name: pick.compound_name,
      lab_scene: pick.category,
      shot_family: pick.shot_family,
      camera_angle: pick.camera_angle,
      camera_direction: pick.camera_direction,
      framing: pick.framing,
      scene_category: pick.category,
      scene_brief: pick.scene_brief,
      quality_suffix: pick.quality_suffix,
      quality_var_count: pick.quality_var_count,
      aspect_ratio: pick.aspect_ratio,
      duration_seconds: duration,
      resolution: pick.resolution,
      model_still: pick.model_still,
      model_video: pick.model_video,
      still_resolution: pick.still_resolution,
      still_n: stillN,
      video_prompt: videoPrompt,
      video_prompt_len: videoPrompt.length,
      video_motion_prompt: capPrompt(pick.video_motion_prompt),
      still_edit_prompt: capPrompt(pick.still_edit_prompt),
      surface: pick.surface,
      lighting: pick.lighting,
      camera_move: pick.camera_move,
      color_grade: pick.color_grade,
      hero_style: pick.hero_style,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,
    },
  },
];
