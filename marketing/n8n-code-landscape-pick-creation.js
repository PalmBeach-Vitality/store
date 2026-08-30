// n8n Code node: pick_creation
// Workflow: Vid_gen_landscape_scenes -500-peptide-wellness-scenes
// Mode: Run Once for All Items
// Settings → Execute Once = OFF (must receive all sheet rows)
// After: get_reel_creations / filter Active on 500_Peptide_Wellness_Reel_Scenes
// Before: grok_imagine_reel_still
//
// SHEETS-ONLY for still/video gen fields. still_edit_prompt is typed on
// still_edit_instructions — do not require it from the sheet.

function val(obj, names) {
  obj = obj || {};
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  var keys = Object.keys(obj);
  for (var w = 0; w < names.length; w++) {
    var want = String(names[w]).toLowerCase().replace(/\s+/g, '_');
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].toLowerCase().replace(/\s+/g, '_') === want && String(obj[keys[k]]).trim() !== '') {
        return obj[keys[k]];
      }
    }
  }
  return '';
}

function isActive(status) {
  var s = String(status || '').trim().toLowerCase();
  return s === 'active' || s === 'true' || s === '1' || s === 'yes';
}

/** Disclaimers belong in captions only — never in Grok prompts. */
function stripVidDisclaimer(text) {
  var t = String(text || '');
  var patterns = [
    /\s*For laboratory research use only\.?\s*/gi,
    /\s*Not for human use or consumption\.?\s*/gi,
    /\s*No treatment, cure, dosage-for-humans, or clinical outcome claims in the image\.?\s*/gi,
    /\s*with a small ['']For Laboratory Research Use Only[''] line\s*[—–-]?\s*/gi,
    /\s*,?\s*optionally with\s*['']For Laboratory Research Use Only['']\.?/gi,
    /\s*['']For Laboratory Research Use Only['']\.?\s*/gi,
    /\s*Explicit research[- ]use only[^.]*\.?\s*/gi,
    /\s*Research use only\s*[—–-]\s*not for (?:human|clinical)[^.]*\.?\s*/gi,
    /\s*Research only\s*[—–-]\s*not for human use\.?\s*/gi,
    /\s*Lab use only\s*[—–-]\s*not for clinical use\.?\s*/gi,
    /\s*[—–-]\s*lab use only\.?\s*/gi,
    /\s*Documentation must retain research-only disclaimer\.?\s*/gi,
  ];
  for (var p = 0; p < patterns.length; p++) t = t.replace(patterns[p], ' ');
  return t.replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
}

function requireField(pick, label) {
  var s = String(pick[label] == null ? '' : pick[label]).trim();
  if (!s) {
    throw new Error(
      'SHEETS-ONLY: 500_Peptide_Wellness_Reel_Scenes row missing ' +
        label +
        ' for creation_id=' +
        (pick.creation_id || '?')
    );
  }
  return s;
}

var creations = $input.all().map(function (i) {
  return i.json;
});

if (!creations.length) {
  throw new Error(
    'No reel creations returned. Check get_reel_creations Document/Sheet and filter status=Active.'
  );
}

var scored = creations
  .map(function (c) {
    return {
      creation_id: String(val(c, ['creation_id', 'creationId', 'Creation_ID'])).trim(),
      rank: Number(val(c, ['rank', 'creation_rank'])) || 0,
      row_number: Number(val(c, ['row_number', 'rowNumber'])) || 0,
      material_detail: val(c, ['material_detail', 'materialDetail']),
      compound_id: val(c, ['compound_id', 'compoundId']),
      compound_name: val(c, ['compound_name', 'compoundName', 'label_compound']),
      canonical_url: val(c, ['canonical_url', 'canonicalUrl']),
      caption_lock: val(c, ['caption_lock', 'captionLock']),
      shot_family: val(c, ['shot_family', 'shotFamily']),
      camera_angle: val(c, ['camera_angle', 'cameraAngle']),
      camera_direction: val(c, ['camera_direction', 'cameraDirection']),
      framing: val(c, ['framing']),
      category: val(c, ['category', 'scene_category']),
      scene_brief: stripVidDisclaimer(val(c, ['scene_brief', 'sceneBrief'])),
      quality_suffix: val(c, ['quality_suffix', 'qualitySuffix']),
      quality_var_count: val(c, ['quality_var_count', 'qualityVarCount']),
      aspect_ratio: val(c, ['aspect_ratio', 'aspectRatio']),
      duration_seconds: val(c, ['duration_seconds', 'durationSeconds', 'duration']),
      resolution: val(c, ['resolution']),
      model_still: val(c, ['model_still', 'modelStill']),
      model_video: val(c, ['model_video', 'modelVideo']),
      still_resolution: val(c, ['still_resolution', 'stillResolution']),
      video_prompt: stripVidDisclaimer(val(c, ['video_prompt', 'videoPrompt'])),
      video_motion_prompt: stripVidDisclaimer(
        val(c, ['video_motion_prompt', 'videoMotionPrompt', 'motion_prompt'])
      ),
      still_edit_prompt: stripVidDisclaimer(val(c, ['still_edit_prompt', 'stillEditPrompt'])),
      status: val(c, ['status', 'creation_status']),
      times_used: Number(val(c, ['times_used', 'creation_times_used'])) || 0,
      last_used_at: String(val(c, ['last_used_at', 'lastUsedAt', 'last_reel_at'])),
      surface: val(c, ['surface']),
      lighting: val(c, ['lighting']),
      camera_move: val(c, ['camera_move', 'cameraMove', 'camera']),
      color_grade: val(c, ['color_grade', 'colorGrade']),
      hero_style: val(c, ['hero_style', 'heroStyle']),
      source_id: val(c, ['source_id', 'sourceId']),
      vibe: val(c, ['vibe']),
      theme: val(c, ['theme']),
      workflow: val(c, ['workflow']),
      wait_seconds: val(c, ['wait_seconds', 'waitSeconds']),
      audio: val(c, ['audio']),
      still_n: val(c, ['still_n', 'n', 'image_n']),
    };
  })
  .filter(function (c) {
    return c.creation_id && c.video_prompt && c.video_motion_prompt && isActive(c.status);
  })
  .sort(function (a, b) {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    if (a.last_used_at !== b.last_used_at) {
      return String(a.last_used_at).localeCompare(String(b.last_used_at));
    }
    return Number(a.rank) - Number(b.rank);
  });

if (!scored.length) {
  var sampleKeys = Object.keys(creations[0] || {}).join(', ');
  throw new Error(
    'No valid creations (need creation_id + video_prompt + video_motion_prompt + status=Active). First row keys: ' +
      sampleKeys
  );
}

var previouslyUsed = scored
  .filter(function (c) {
    return c.times_used > 0 || (c.last_used_at && String(c.last_used_at).trim());
  })
  .slice()
  .sort(function (a, b) {
    return String(b.last_used_at).localeCompare(String(a.last_used_at));
  });

var last = previouslyUsed[0] || null;
var lastId = last ? last.creation_id : '';
var lastCompound = last ? String(last.compound_name || '').trim() : '';
var lastLabScene = last ? String(last.category || last.scene_category || '').trim() : '';
if (!lastLabScene && last) lastLabScene = String(last.lab_scene || '').trim();

function accumulateUsage(getter) {
  var times = {};
  for (var i = 0; i < scored.length; i++) {
    var key = getter(scored[i]) || '(none)';
    times[key] = (times[key] || 0) + (Number(scored[i].times_used) || 0);
  }
  return times;
}

var compoundTimes = accumulateUsage(function (c) {
  return String(c.compound_name || '').trim();
});
var labSceneTimes = accumulateUsage(function (c) {
  return String(c.category || '').trim();
});

function recentDistinct(getter, n) {
  var out = [];
  var seen = {};
  for (var i = 0; i < previouslyUsed.length; i++) {
    var key = getter(previouslyUsed[i]);
    if (!key || seen[key]) continue;
    seen[key] = true;
    out.push(key);
    if (out.length >= n) break;
  }
  return out;
}

var RECENT_N = 8;
var recentCompounds = recentDistinct(function (c) {
  return String(c.compound_name || '').trim();
}, RECENT_N);
var recentLabScenes = recentDistinct(function (c) {
  return String(c.category || '').trim();
}, RECENT_N);

function scorePick(c) {
  var compound = String(c.compound_name || '').trim() || '(none)';
  var labScene = String(c.category || '').trim() || '(none)';
  var penalty = 0;
  if (lastId && c.creation_id === lastId) penalty += 8000;
  if (lastCompound && compound === lastCompound) penalty += 4000;
  if (lastLabScene && labScene === lastLabScene) penalty += 4000;
  var ci = recentCompounds.indexOf(compound);
  if (compound && ci >= 0) penalty += 300 + (RECENT_N - ci) * 40;
  var si = recentLabScenes.indexOf(labScene);
  if (labScene && si >= 0) penalty += 300 + (RECENT_N - si) * 40;
  penalty += (compoundTimes[compound] || 0) * 25;
  penalty += (labSceneTimes[labScene] || 0) * 25;
  return penalty;
}

var diversified = scored.slice().sort(function (a, b) {
  var pa = scorePick(a);
  var pb = scorePick(b);
  if (pa !== pb) return pa - pb;
  var ca = String(a.compound_name || '').trim() || '(none)';
  var cb = String(b.compound_name || '').trim() || '(none)';
  var sa = String(a.category || '').trim() || '(none)';
  var sb = String(b.category || '').trim() || '(none)';
  if ((compoundTimes[ca] || 0) !== (compoundTimes[cb] || 0)) {
    return (compoundTimes[ca] || 0) - (compoundTimes[cb] || 0);
  }
  if ((labSceneTimes[sa] || 0) !== (labSceneTimes[sb] || 0)) {
    return (labSceneTimes[sa] || 0) - (labSceneTimes[sb] || 0);
  }
  if (a.times_used !== b.times_used) return a.times_used - b.times_used;
  if (a.last_used_at !== b.last_used_at) {
    return String(a.last_used_at).localeCompare(String(b.last_used_at));
  }
  return Number(a.rank) - Number(b.rank);
});

function differsBoth(c) {
  var compound = String(c.compound_name || '').trim();
  var labScene = String(c.category || '').trim();
  var compoundOk = !lastCompound || compound !== lastCompound;
  var sceneOk = !lastLabScene || labScene !== lastLabScene;
  return compoundOk && sceneOk;
}
function differsEither(c) {
  var compound = String(c.compound_name || '').trim();
  var labScene = String(c.category || '').trim();
  var compoundOk = !lastCompound || compound !== lastCompound;
  var sceneOk = !lastLabScene || labScene !== lastLabScene;
  return compoundOk || sceneOk;
}

var bothDifferent = diversified.filter(differsBoth);
var eitherDifferent = diversified.filter(differsEither);
var pick = (bothDifferent.length ? bothDifferent : eitherDifferent.length ? eitherDifferent : diversified)[0];

requireField(pick, 'creation_id');
requireField(pick, 'video_prompt');
requireField(pick, 'video_motion_prompt');
requireField(pick, 'scene_brief');
requireField(pick, 'model_still');
requireField(pick, 'model_video');
requireField(pick, 'duration_seconds');
requireField(pick, 'resolution');
requireField(pick, 'still_resolution');
requireField(pick, 'aspect_ratio');
requireField(pick, 'camera_move');
requireField(pick, 'wait_seconds');
requireField(pick, 'audio');
requireField(pick, 'still_n');

var duration = Number(pick.duration_seconds);
if (!isFinite(duration) || duration <= 0) {
  throw new Error(
    'SHEETS-ONLY: duration_seconds must be a positive number (creation_id=' +
      pick.creation_id +
      ', got ' +
      pick.duration_seconds +
      ')'
  );
}
var waitSeconds = Number(pick.wait_seconds);
if (!isFinite(waitSeconds) || waitSeconds <= 0) {
  throw new Error(
    'SHEETS-ONLY: wait_seconds must be a positive number (creation_id=' +
      pick.creation_id +
      ', got ' +
      pick.wait_seconds +
      ')'
  );
}
var stillN = Number(pick.still_n);
if (!isFinite(stillN) || stillN <= 0) {
  throw new Error(
    'SHEETS-ONLY: still_n must be a positive number (creation_id=' +
      pick.creation_id +
      ', got ' +
      pick.still_n +
      ')'
  );
}
var audioRaw = String(pick.audio).trim().toLowerCase();
var audio;
if (audioRaw === 'true' || audioRaw === '1' || audioRaw === 'yes') audio = true;
else if (audioRaw === 'false' || audioRaw === '0' || audioRaw === 'no') audio = false;
else {
  throw new Error(
    'SHEETS-ONLY: audio must be TRUE or FALSE (creation_id=' +
      pick.creation_id +
      ', got ' +
      pick.audio +
      ')'
  );
}

return [
  {
    json: {
      creation_id: pick.creation_id,
      creation_rank: pick.rank,
      row_number: pick.row_number,
      material_detail: pick.material_detail,
      compound_id: pick.compound_id,
      compound_name: pick.compound_name,
      canonical_url: pick.canonical_url,
      caption_lock: pick.caption_lock,
      shot_family: pick.shot_family,
      camera_angle: pick.camera_angle,
      camera_direction: pick.camera_direction,
      framing: pick.framing,
      scene_id: pick.creation_id,
      scene_category: pick.category,
      category: pick.category,
      lab_scene: pick.category,
      scene_brief: pick.scene_brief,
      quality_suffix: pick.quality_suffix,
      quality_var_count: pick.quality_var_count,
      aspect_ratio: pick.aspect_ratio,
      duration_seconds: duration,
      resolution: pick.resolution,
      model_still: pick.model_still,
      model_video: pick.model_video,
      still_resolution: pick.still_resolution,
      video_prompt: pick.video_prompt,
      video_motion_prompt: pick.video_motion_prompt,
      still_edit_prompt: pick.still_edit_prompt,
      surface: pick.surface,
      lighting: pick.lighting,
      camera_move: pick.camera_move,
      color_grade: pick.color_grade,
      hero_style: pick.hero_style,
      source_id: pick.source_id,
      vibe: pick.vibe,
      theme: pick.theme,
      workflow: pick.workflow,
      wait_seconds: waitSeconds,
      audio: audio,
      still_n: stillN,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,
    },
  },
];
