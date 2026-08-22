// n8n Code node: pick_molecule_creation
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF (must receive all Sheet 13 rows)
// After: get_chem_creations / filter Active on 13-chem-breakdown-54
// Before: sheets_update_chem → grok_imagine_molecule_still
//
// Next unused row by rank (CHEM-001 then CHEM-002 …). Sheet prompts
// already include reaction locks — do NOT wrap vial rules.

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

function moleculeVibeLock(name) {
  var n = String(name || '').trim();
  return (
    "HARD VIBE LOCK (READ FIRST): DARK cinematic 3D MEDICAL ANIMATION of a LIVE CELLULAR CHEMICAL REACTION. " +
    "NOT a product photography studio. NOT a white cyclorama. NOT a frosted glass pedestal. NOT spa/lifestyle. NOT a catalog still of one floating molecule. " +
    "Setting: inside/around a living cell — lipid-bilayer membrane, cytoplasm, wet receptors. " +
    "Action: amino-acid monomers (glossy ball-and-stick) collide, dock, and form peptide bonds with energy flashes. A forming peptide chain of '" +
    n +
    "' is the unseen reaction subject. " +
    "NO TEXT anywhere — no letters, numbers, captions, titles, compound-name overlay, labels. " +
    "NO LOGO, NO palm tree, NO URL, NO watermark. No vial. No pen. Silent later — do not imply captions."
  );
}

var creations = $input.all().map(function (i) {
  return i.json;
});

if (!creations.length) {
  throw new Error(
    'No chem rows. Check get_chem_creations → Sheet 13-chem-breakdown-54, status=Active.'
  );
}

if (creations.length < 2) {
  throw new Error(
    'pick_molecule_creation saw only ' +
      creations.length +
      ' row(s) (' +
      String((creations[0] && (creations[0].lab_item_id || creations[0].creation_id)) || '?') +
      '). Execute Once must be OFF on this node so it receives all 54 Sheet 13 rows, not just CHEM-001.'
  );
}

var scored = creations
  .map(function (c) {
    var rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
    var creation_id = String(val(c, ['creation_id', 'creationId'], '')).trim();
    if (!creation_id && rankNum > 0) {
      creation_id = 'PBVita-Chem-' + String(rankNum).padStart(3, '0');
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
    'No valid Sheet 13 rows (need creation_id + compound_name + video_prompt + video_motion_prompt). Keys: ' +
      Object.keys(creations[0] || {}).join(', ')
  );
}

function usedCount(c) {
  var n = Number(c.times_used);
  if (!isFinite(n) || n < 0) n = 0;
  var last = String(c.last_used_at || '').trim();
  if (last && last !== '0') n = Math.max(n, 1);
  return n;
}

scored.sort(function (a, b) {
  var ua = usedCount(a);
  var ub = usedCount(b);
  if (ua !== ub) return ua - ub;
  return a.rank - b.rank;
});

var pick = scored[0];
var vibe = moleculeVibeLock(pick.compound_name);
var videoPrompt = capPrompt(vibe + ' ' + pick.video_prompt);

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
        "Silent video. No text, no logos, no captions. Cellular chemical reaction continues: living cells and amino acids forming peptide bonds. Same '" +
          pick.compound_name +
          "' reaction subject — never printed. No studio cut. " +
          pick.video_motion_prompt
      ),
      still_edit_prompt: capPrompt(vibe + ' ' + pick.still_edit_prompt),
      surface: pick.surface,
      lighting: pick.lighting,
      camera_move: pick.camera_move,
      color_grade: pick.color_grade,
      hero_style: pick.hero_style,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,
      input_row_count: scored.length,
      unused_row_count: scored.filter(function (c) {
        return usedCount(c) === 0;
      }).length,
    },
  },
];
