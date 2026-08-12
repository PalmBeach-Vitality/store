// n8n Code node: pick_creation
// Type: Code | Mode: Run Once for All Items
// After: get_reel_creations / filter Active on 9-lab-item-creations-500
// Before: grok_imagine_reel_still
//
// SHEETS-ONLY: all creative fields come from the Sheet 9 row.
// Rotation: cycle compounds first (compound_name), then least-used row within that compound.
// No hardcoded prompts, cameras, models, or edit text.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  const keys = Object.keys(obj || {});
  for (const want of names) {
    const normWant = want.toLowerCase().replace(/\s+/g, '_');
    const found = keys.find((k) => k.toLowerCase().replace(/\s+/g, '_') === normWant);
    if (found && String(obj[found]).trim() !== '') return obj[found];
  }
  return fallback;
}

function isActive(status) {
  const s = String(status || '').trim().toLowerCase();
  return !s || s === 'active' || s === 'true' || s === '1' || s === 'yes';
}

/** Disclaimers belong in Buffer captions only — never in Grok prompts. */
function stripVidDisclaimer(text) {
  let t = String(text || '');
  const patterns = [
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
  for (const re of patterns) t = t.replace(re, ' ');
  return t.replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
}

const creations = $input.all().map((i) => i.json);

if (!creations.length) {
  throw new Error(
    'No reel creations returned. Check get_reel_creations Document/Sheet and filter status=Active.'
  );
}

const scored = creations
  .map((c) => {
    const rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
    const fromSheet = String(val(c, ['creation_id', 'creationId', 'Creation_ID'], '')).trim();
    const creation_id =
      fromSheet ||
      (rankNum > 0 ? `PBVita-Lab-${String(rankNum).padStart(3, '0')}` : '');

    const video_prompt = stripVidDisclaimer(val(c, ['video_prompt', 'videoPrompt']));
    const video_motion_prompt = stripVidDisclaimer(
      val(c, ['video_motion_prompt', 'videoMotionPrompt', 'motion_prompt'])
    );

    return {
      raw: c,
      creation_id,
      rank: rankNum,
      row_number:
        Number(val(c, ['row_number', 'rowNumber'], 0)) ||
        (rankNum > 0 ? rankNum + 1 : 0),
      lab_item_id: val(c, ['lab_item_id', 'labItemId']),
      lab_item: val(c, ['lab_item', 'labItem', 'item_name']),
      material_detail: val(c, ['material_detail', 'materialDetail']),
      scene_setting: val(c, ['scene_setting', 'sceneSetting']),
      environment_bucket: val(c, ['environment_bucket', 'environmentBucket', 'bucket']),
      compound_name: val(c, ['compound_name', 'compoundName', 'label_compound']),
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
      video_prompt,
      video_motion_prompt,
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
  })
  .filter((c) => c.creation_id && c.video_prompt && c.video_motion_prompt)
  .filter((c) => isActive(c.status))
  .sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    if (a.last_used_at !== b.last_used_at) {
      return String(a.last_used_at).localeCompare(String(b.last_used_at));
    }
    return Number(a.rank) - Number(b.rank);
  });

if (!scored.length) {
  const sampleKeys = Object.keys(creations[0] || {}).join(', ');
  throw new Error(
    'No valid creations (need creation_id + video_prompt + video_motion_prompt from Sheet 9). First row keys: ' +
      sampleKeys
  );
}

const previouslyUsed = scored
  .filter((c) => c.times_used > 0 || (c.last_used_at && c.last_used_at.trim()))
  .slice()
  .sort((a, b) => String(b.last_used_at).localeCompare(String(a.last_used_at)));

const last = previouslyUsed[0] || null;
const lastId = last?.creation_id || '';
const lastCompound = String(last?.compound_name || '').trim();

// How many times each compound has been used (sum of row times_used)
const compoundTimesUsed = new Map();
const compoundLastUsed = new Map();
for (const c of scored) {
  const name = String(c.compound_name || '').trim() || '(none)';
  compoundTimesUsed.set(name, (compoundTimesUsed.get(name) || 0) + (Number(c.times_used) || 0));
  const prev = compoundLastUsed.get(name) || '';
  if (String(c.last_used_at || '') > prev) {
    compoundLastUsed.set(name, String(c.last_used_at || ''));
  }
}

// Recent compound streak — avoid reusing these until others catch up
const RECENT_COMPOUND_N = 8;
const recentCompounds = [];
const seenCompounds = new Set();
for (const c of previouslyUsed) {
  const name = String(c.compound_name || '').trim();
  if (!name || seenCompounds.has(name)) continue;
  seenCompounds.add(name);
  recentCompounds.push(name);
  if (recentCompounds.length >= RECENT_COMPOUND_N) break;
}
const recentCompoundSet = new Set(recentCompounds);

function scorePick(c) {
  const name = String(c.compound_name || '').trim() || '(none)';
  let penalty = 0;

  // Never repeat the exact same creation back-to-back
  if (lastId && c.creation_id === lastId) penalty += 5000;

  // Primary: rotate compounds — hard avoid last compound
  if (lastCompound && name === lastCompound) penalty += 3000;

  // Avoid compounds used in the last N distinct picks
  if (name && recentCompoundSet.has(name)) {
    const idx = recentCompounds.indexOf(name);
    penalty += 400 + (RECENT_COMPOUND_N - idx) * 50;
  }

  // Prefer compounds with fewer total uses across all their rows
  penalty += (compoundTimesUsed.get(name) || 0) * 20;

  return penalty;
}

const diversified = scored
  .slice()
  .sort((a, b) => {
    const pa = scorePick(a);
    const pb = scorePick(b);
    if (pa !== pb) return pa - pb;

    const ca = String(a.compound_name || '').trim() || '(none)';
    const cb = String(b.compound_name || '').trim() || '(none)';
    const cuA = compoundTimesUsed.get(ca) || 0;
    const cuB = compoundTimesUsed.get(cb) || 0;
    if (cuA !== cuB) return cuA - cuB;

    const clA = compoundLastUsed.get(ca) || '';
    const clB = compoundLastUsed.get(cb) || '';
    if (clA !== clB) return String(clA).localeCompare(String(clB));

    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    if (a.last_used_at !== b.last_used_at) {
      return String(a.last_used_at).localeCompare(String(b.last_used_at));
    }
    return Number(a.rank) - Number(b.rank);
  });

// Prefer a different compound than last when any alternative exists
const notSameCompound = lastCompound
  ? diversified.filter((c) => String(c.compound_name || '').trim() !== lastCompound)
  : diversified;
const pick = (notSameCompound.length ? notSameCompound : diversified)[0];

if (!pick.model_still) {
  throw new Error('Sheet 9 row missing model_still for ' + pick.creation_id);
}
if (!pick.model_video) {
  throw new Error('Sheet 9 row missing model_video for ' + pick.creation_id);
}
if (!pick.duration_seconds) {
  throw new Error('Sheet 9 row missing duration_seconds for ' + pick.creation_id);
}
if (!pick.resolution) {
  throw new Error('Sheet 9 row missing resolution for ' + pick.creation_id);
}
if (!pick.aspect_ratio) {
  throw new Error('Sheet 9 row missing aspect_ratio for ' + pick.creation_id);
}
if (!pick.still_resolution) {
  throw new Error('Sheet 9 row missing still_resolution for ' + pick.creation_id);
}

let compound = {};
try {
  compound = $('Parse_Grok').item?.json || {};
} catch (e) {
  compound = {};
}
if (!Object.keys(compound).length) {
  try {
    compound = $('if_compliance').item?.json || {};
  } catch (e) {
    compound = {};
  }
}

let template_id = compound.template_id || '';
if (!template_id) {
  try {
    template_id = $('Prep_day_variant').item?.json?.template_id || '';
  } catch (e) {
    template_id = '';
  }
}

return [
  {
    json: {
      ...compound,

      creation_id: pick.creation_id,
      creation_rank: pick.rank,
      row_number: pick.row_number,
      lab_item_id: pick.lab_item_id,
      lab_item: pick.lab_item,
      material_detail: pick.material_detail,
      scene_setting: pick.scene_setting,
      environment_bucket: pick.environment_bucket,
      compound_name: pick.compound_name || '',
      shot_family: pick.shot_family,
      camera_angle: pick.camera_angle,
      camera_direction: pick.camera_direction,
      framing: pick.framing,
      scene_id: pick.scene_id,
      scene_category: pick.category,
      scene_brief: pick.scene_brief,
      quality_suffix: pick.quality_suffix,
      quality_var_count: pick.quality_var_count,
      aspect_ratio: pick.aspect_ratio,
      duration_seconds: Number(pick.duration_seconds),
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
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,

      template_id,
    },
  },
];
