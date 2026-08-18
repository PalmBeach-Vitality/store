// n8n Code node: pick_pen_creation
// Workflow: peptide_pen_vid_gen
// Mode: Run Once for All Items
// After: get_pen_creations / filter Active on 14-pen-creations-150
// Before: grok_imagine_pen_still
//
// Rotates by compound_name (one video per compound cycle). Sheet prompts
// already include pen COUNT=1 + cap-ON locks — do NOT wrap vial rules.

function val(obj, names, fallback) {
  if (fallback === undefined) fallback = '';
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  var keys = Object.keys(obj || {});
  for (var w = 0; w < names.length; w++) {
    var want = String(names[w]).toLowerCase().replace(/\s+/g, '_');
    for (var k = 0; k < keys.length; k++) {
      if (keys[k].toLowerCase().replace(/\s+/g, '_') === want && String(obj[keys[k]]).trim() !== '') {
        return obj[keys[k]];
      }
    }
  }
  return fallback;
}

function isActive(status) {
  var s = String(status || '').trim().toLowerCase();
  return !s || s === 'active' || s === 'true' || s === '1' || s === 'yes';
}

function capPrompt(text) {
  var t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length > 7900) t = t.slice(0, 7900);
  return t;
}

function penLookLock(name) {
  var n = String(name || '').trim();
  return (
    "HARD OUTPUT LOCK (READ FIRST): The hero is exactly ONE white matte plastic insulin-style injectable research pen " +
    "(medical injection pen), NOT a glass vial, NOT brushed-silver metal, NOT a perfume cartridge, NOT a chrome display claw. " +
    "Body: smooth matte white plastic cylinder. Left: white plastic cap WITH a white pocket clip — cap ON covering the tip, never a needle. " +
    "Small rectangular transparent window on the barrel beside the label (a glimpse of liquid only — not a tall glass reservoir). " +
    "Right: bright orange ridged dose-dial / injection button matching the orange on the label. " +
    "LABEL: white wrap-around. Far left bright BLUE DNA double-helix icon. Then '" +
    n +
    "' in large bold ORANGE sans-serif. Then a solid ORANGE rounded-rectangle badge with white text exactly '3ml pen'. " +
    "The only readable words on the entire pen are '" +
    n +
    "' and '3ml pen'. FORBIDDEN: milligram dosage, milligram-per-milliliter, milligram-per-vial, concentration numbers, burgundy vial branding, palm tree, extra words. Product count = 1. No vial. No second pen."
  );
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
    var rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
    var creation_id = String(val(c, ['creation_id', 'creationId'], '')).trim();
    if (!creation_id && rankNum > 0) {
      creation_id = 'PBVita-Pen-' + String(rankNum).padStart(3, '0');
    }
    return {
      creation_id: creation_id,
      rank: rankNum,
      lab_item_id: val(c, ['lab_item_id']),
      lab_item: val(c, ['lab_item']),
      material_detail: val(c, ['material_detail']),
      compound_name: String(val(c, ['compound_name'], '')).trim(),
      shot_family: val(c, ['shot_family']),
      camera_angle: val(c, ['camera_angle']),
      camera_direction: val(c, ['camera_direction']),
      framing: val(c, ['framing']),
      category: val(c, ['category', 'scene_category']),
      scene_brief: val(c, ['scene_brief']),
      quality_suffix: val(c, ['quality_suffix']),
      quality_var_count: val(c, ['quality_var_count'], ''),
      aspect_ratio: val(c, ['aspect_ratio']) || '9:16',
      duration_seconds: Number(val(c, ['duration_seconds', 'duration'], 15)) || 15,
      resolution: val(c, ['resolution']) || '1080p',
      model_still: val(c, ['model_still']) || 'grok-imagine-image-2.0',
      model_video: val(c, ['model_video']) || 'grok-imagine-video-1.5',
      still_resolution: val(c, ['still_resolution']) || '2k',
      video_prompt: capPrompt(val(c, ['video_prompt'])),
      video_motion_prompt: capPrompt(val(c, ['video_motion_prompt'])),
      still_edit_prompt: String(val(c, ['still_edit_prompt'], '')).trim(),
      surface: val(c, ['surface']),
      lighting: val(c, ['lighting']),
      camera_move: val(c, ['camera_move']),
      color_grade: val(c, ['color_grade']),
      hero_style: val(c, ['hero_style']),
      status: val(c, ['status'], 'Active'),
      times_used: Number(val(c, ['times_used'], 0)) || 0,
      last_used_at: String(val(c, ['last_used_at'], '')),
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
var lastAt = {};
scored.forEach(function (c) {
  var k = c.compound_name;
  compoundTimes[k] = (compoundTimes[k] || 0) + c.times_used;
  if (String(c.last_used_at || '') > String(lastAt[k] || '')) lastAt[k] = c.last_used_at;
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
var look = penLookLock(pick.compound_name);
var videoPrompt = capPrompt(look + ' ' + pick.video_prompt);

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
      duration_seconds: pick.duration_seconds,
      resolution: pick.resolution,
      model_still: pick.model_still,
      model_video: pick.model_video,
      still_resolution: pick.still_resolution,
      video_prompt: videoPrompt,
      video_prompt_len: videoPrompt.length,
      video_motion_prompt: capPrompt(
        "Keep the exact same white insulin-style pen, orange dial, blue DNA, orange '" +
          pick.compound_name +
          "' and orange '3ml pen' badge. Cap ON. No milligram dosage text. " +
          pick.video_motion_prompt
      ),
      still_edit_prompt: capPrompt(look + ' ' + pick.still_edit_prompt),
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
