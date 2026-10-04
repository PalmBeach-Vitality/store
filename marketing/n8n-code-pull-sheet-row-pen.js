// n8n Code node: pull_sheet_row
// Workflow: peptide_pen_vid_gen
// Mode: Run Once for All Items
// After: alias_stack_names
// Before: grok_imagine_pen_still
//
// Passes Sheet 14 fields through, including camera_move and negative_prompt.
// Throws if negative_prompt is empty. Does not rewrite the camera.

const rows = $input.all().map((i) => i.json);
if (!rows.length) {
  throw new Error('No Active sheet rows. Check get_pen_creations + filter_pen_active.');
}

function val(obj, names, fallback) {
  fallback = fallback === undefined ? '' : fallback;
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
  }
  const keys = Object.keys(obj || {});
  for (const want of names) {
    const nw = want.toLowerCase().replace(/\s+/g, '_');
    const found = keys.find((k) => k.toLowerCase().replace(/\s+/g, '_') === nw);
    if (found && String(obj[found]).trim() !== '') return obj[found];
  }
  return fallback;
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function chooseCompound() {
  try {
    return String($('choose_compound').first().json.compound_name || '').trim();
  } catch (e) {
    return '';
  }
}

function rowMatches(rowCompound, wantRaw) {
  const want = norm(wantRaw);
  if (!want) return true;
  const row = norm(rowCompound);
  if (!row) return false;
  return row === want || row.indexOf(want) !== -1 || want.indexOf(row) !== -1;
}

function mapRow(c) {
  const rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
  return {
    creation_id: String(val(c, ['creation_id', 'creationId', 'Creation_ID'], '')).trim(),
    rank: rankNum,
    row_number: Number(val(c, ['row_number', 'rowNumber'], 0)) || 0,
    lab_item_id: val(c, ['lab_item_id', 'labItemId']),
    lab_item: val(c, ['lab_item', 'labItem', 'item_name']),
    material_detail: val(c, ['material_detail', 'materialDetail']),
    compound_name: val(c, ['compound_name', 'compoundName', 'label_compound']),
    dose: val(c, ['dose', 'dosage', 'label_dose', 'maroon_bar']),
    concentration: val(c, ['concentration', 'conc', 'label_conc']),
    compound_id: val(c, ['compound_id', 'compoundId']),
    shot_family: val(c, ['shot_family', 'shotFamily']),
    camera_angle: val(c, ['camera_angle', 'cameraAngle']),
    camera_direction: val(c, ['camera_direction', 'cameraDirection']),
    framing: val(c, ['framing']),
    scene_id: val(c, ['scene_id', 'sceneId']),
    category: val(c, ['category', 'scene_category']),
    scene_brief: val(c, ['scene_brief', 'sceneBrief']),
    quality_suffix: val(c, ['quality_suffix', 'qualitySuffix']),
    quality_var_count: val(c, ['quality_var_count', 'qualityVarCount'], ''),
    aspect_ratio: val(c, ['aspect_ratio', 'aspectRatio']),
    duration_seconds: val(c, ['duration_seconds', 'durationSeconds', 'duration']),
    resolution: val(c, ['resolution']),
    model_still: val(c, ['model_still', 'modelStill']),
    model_video: val(c, ['model_video', 'modelVideo']),
    still_resolution: val(c, ['still_resolution', 'stillResolution']),
    still_n: val(c, ['still_n', 'stillN'], ''),
    wait_seconds: val(c, ['wait_seconds', 'waitSeconds'], ''),
    audio: val(c, ['audio'], ''),
    video_prompt: val(c, ['video_prompt', 'videoPrompt']),
    video_motion_prompt: String(val(c, ['video_motion_prompt', 'videoMotionPrompt', 'motion_prompt'], '')).trim(),
    negative_prompt: String(val(c, ['negative_prompt', 'negativePrompt'], '')).trim(),
    still_edit_prompt: String(val(c, ['still_edit_prompt', 'stillEditPrompt'], '')).trim(),
    surface: val(c, ['surface']),
    lighting: val(c, ['lighting']),
    camera_move: val(c, ['camera_move', 'cameraMove', 'camera']),
    color_grade: val(c, ['color_grade', 'colorGrade']),
    hero_style: val(c, ['hero_style', 'heroStyle']),
    status: val(c, ['status', 'creation_status'], 'Active'),
    times_used: Number(val(c, ['times_used', 'creation_times_used'], 0)) || 0,
    last_used_at: String(val(c, ['last_used_at', 'lastUsedAt', 'last_reel_at'], '')),
  };
}

const wanted = chooseCompound();
if (!wanted) {
  throw new Error('choose_compound is empty. Type the compound name — the sheet pulls every field for that match.');
}

let matched = rows.map(mapRow).filter((r) => r.creation_id && rowMatches(r.compound_name, wanted));
if (!matched.length) {
  throw new Error(
    'No Active sheet row with compound_name matching "' +
      wanted +
      '". Fix the sheet — nodes do not invent compounds.'
  );
}

// If several sheet rows share that compound, use the least-used sheet row (still sheet data only).
matched.sort((a, b) => {
  if (a.times_used !== b.times_used) return a.times_used - b.times_used;
  if (a.last_used_at !== b.last_used_at) return String(a.last_used_at).localeCompare(String(b.last_used_at));
  return Number(a.rank) - Number(b.rank);
});
const row = matched[0];

const required = [
  'video_prompt',
  'video_motion_prompt',
  'negative_prompt',
  'still_edit_prompt',
  'camera_move',
  'model_still',
  'model_video',
  'still_resolution',
  'still_n',
  'duration_seconds',
  'resolution',
  'aspect_ratio',
];
for (const f of required) {
  if (!row[f] && row[f] !== 0) {
    throw new Error('Sheet row ' + row.creation_id + ' missing field "' + f + '". Fill it on the sheet.');
  }
}

// Pass sheet values through unchanged. No MAP. No visual lock inventing. audio/wait_seconds optional.
return [
  {
    json: {
      creation_id: row.creation_id,
      creation_rank: row.rank,
      row_number: row.row_number,
      lab_item_id: row.lab_item_id,
      lab_item: String(row.lab_item || ''),
      material_detail: String(row.material_detail || ''),
      compound_name: String(row.compound_name || '').trim(),
      dose: String(row.dose || '').trim(),
      concentration: String(row.concentration || '').trim(),
      compound_id: String(row.compound_id || '').trim(),
      shot_family: row.shot_family,
      camera_angle: row.camera_angle,
      camera_direction: row.camera_direction,
      framing: row.framing,
      scene_id: row.scene_id,
      scene_category: row.category,
      scene_brief: String(row.scene_brief || ''),
      quality_suffix: row.quality_suffix,
      quality_var_count: row.quality_var_count,
      aspect_ratio: row.aspect_ratio,
      duration_seconds: Number(row.duration_seconds),
      resolution: row.resolution,
      model_still: row.model_still,
      model_video: row.model_video,
      still_resolution: row.still_resolution,
      still_n: row.still_n !== '' && row.still_n != null ? Number(row.still_n) : row.still_n,
      wait_seconds: row.wait_seconds,
      audio: row.audio,
      video_prompt: String(row.video_prompt || ''),
      video_motion_prompt: String(row.video_motion_prompt || ''),
      negative_prompt: String(row.negative_prompt || ''),
      still_edit_prompt: String(row.still_edit_prompt || ''),
      surface: row.surface,
      lighting: row.lighting,
      camera_move: row.camera_move,
      color_grade: row.color_grade,
      hero_style: String(row.hero_style || ''),
      creation_status: row.status,
      creation_times_used: row.times_used,
      creation_last_used_at: row.last_used_at,
      choose_compound_input: wanted,
      matched_active_count: matched.length,
    },
  },
];
