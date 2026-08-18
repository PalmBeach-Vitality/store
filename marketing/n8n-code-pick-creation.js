// n8n Code node: pick_creation
// Type: Code | Mode: Run Once for All Items
// After: get_reel_creations / filter Active on 9-lab-item-creations-500
// Before: grok_imagine_reel_still
//
// SHEETS-ONLY: all creative fields come from the Sheet 9 row.
// Rotation each run: different compound_name AND different lab_scene (category).
// Then least-used row within that pair. No hardcoded prompts/cameras/models.

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

/** xAI images/generations prompt max = 8000. Stay under with headroom. */
const PROMPT_MAX = 7900;

/** Compact locks — must survive truncation of the middle. */
const OPENING_LOCK =
  'HARD OUTPUT LOCK: exactly 1 product container in the entire image (1 sealed vial OR 1 sealed pen). Product count = 1. No second vial, no background vial, no soft-focus vial, no product pair. ';

const CLOSING_LOCK =
  ' FINAL CHECK: count every vial and pen — total must be exactly 1. If 2+, remove extras. COUNT = 1.';

const HARD_SINGLE_HERO =
  ' SINGLE HERO (COUNT=1): exactly ONE vial OR ONE pen — never both, never two. Forbidden: background vial, large+small pair, open+capped pair, mirrored duplicate, rack/row/cluster. Architecture only in background. ONE hero.';

const HARD_STILL_EDIT =
  'CRITICAL COUNT FIX: Keep exactly ONE sealed Palm Beach Vitality hero product (one vial OR one pen). DELETE every extra vial/pen. Also DELETE any weighing scale, digital scale, platform scale, or metal tray under the product — place the single hero directly on the table/surface. After the edit count exactly 1 product and zero scales. Do not restyle lighting, camera, label text, or environment.';

function truncateMiddle(mid, budget) {
  mid = String(mid || '').trim();
  if (mid.length <= budget) return mid;
  var slice = mid.slice(0, budget);
  var cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('; '), slice.lastIndexOf(' '));
  if (cut > budget * 0.6) slice = slice.slice(0, cut + 1);
  return slice.trim();
}

function hardenStillPrompt(text) {
  var t = String(text || '').trim();

  // THIS PHRASE WAS TEACHING GROK TO DRAW MULTIPLE PRODUCTS — kill it
  t = t.replace(
    /Create an exciting, unique laboratory \/ peptide R&D \/ health-and-wellness industry scene — not a boring single product cutout\./gi,
    'Create an exciting laboratory / peptide R&D environment with exactly ONE product hero only (never two vials or pens).'
  );
  t = t.replace(
    /not a boring single product cutout/gi,
    'exactly one product hero in a full environment (never two products)'
  );
  t = t.replace(/\bnot a single boring SKU\b/gi, 'not a boring SKU catalog shot');
  t = t.replace(/\bHero cluster\b/gi, 'Hero');
  t = t.replace(
    /Nested glass doors create recursive reflections of the same hero object\./gi,
    'Glass may reflect light only — no second readable vial or pen in any reflection.'
  );
  t = t.replace(
    /recursive reflections of the same hero object/gi,
    'no second readable vial or pen in any reflection'
  );
  t = t.replace(
    /Color-blocked solvent bottles create a deliberate Pantone story behind the hero\./gi,
    'Keep the background clean behind the single hero — no extra bottles that read as product heroes.'
  );

  // Strip duplicated packaging tail that teaches two vials
  t = t.replace(
    /(10ml Sterile Multi-Use Vial')\s+with bright blue flip-off cap,[\s\S]*?footer reading '10ml Sterile Multi-Use Vial'/gi,
    "$1"
  );

  // Strip prior locks/rules so we re-wrap clean every run
  t = t.replace(/HARD OUTPUT LOCK \(READ FIRST\):[\s\S]*?(?:for depth\.\s*|depth\.\s*)/gi, '');
  t = t.replace(/HARD OUTPUT LOCK:[\s\S]*?(?:product pair\.\s*|for depth\.\s*)/gi, '');
  t = t.replace(/HARD OUTPUT LOCK \(FINAL CHECK\):[\s\S]*?COUNT = 1\./gi, '');
  t = t.replace(/FINAL CHECK:[\s\S]*?COUNT = 1\./gi, '');
  t = t.replace(
    /SINGLE HERO PRODUCT RULE \(MANDATORY[^\)]*\):[\s\S]*?(?:COUNT = 1\. Period\.|Period\.)/gi,
    ''
  );
  t = t.replace(/SINGLE HERO \(COUNT=1\):[\s\S]*?ONE hero\./gi, '');

  // Drop long disclaimer / quality fluff that burns the 8000 budget
  t = t.replace(/\s*No treatment, cure, dosage-for-humans[\s\S]*$/i, '');
  t = t.replace(/\s*Do not print research-use disclaimers[\s\S]*$/i, '');
  t = t.replace(
    /\s*Quality: ultra detailed, extremely detailed, hyper-detailed[\s\S]*?(?=VIAL PACKAGING|SINGLE HERO|ABSOLUTE RULE|HARD OUTPUT|FINAL CHECK|$)/i,
    ' Quality: photoreal, sharp focus, 8k. '
  );

  t = t.replace(/\s+/g, ' ').trim();

  var head = OPENING_LOCK;
  var tail = HARD_SINGLE_HERO + CLOSING_LOCK;
  var budget = PROMPT_MAX - head.length - tail.length;
  if (budget < 2000) budget = 2000;
  var mid = truncateMiddle(t, budget);
  var out = (head + mid + tail).trim();
  if (out.length > PROMPT_MAX) {
    out = out.slice(0, PROMPT_MAX);
  }
  return out;
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

    const video_prompt = hardenStillPrompt(
      stripVidDisclaimer(val(c, ['video_prompt', 'videoPrompt']))
    );
    const video_motion_prompt = stripVidDisclaimer(
      val(c, ['video_motion_prompt', 'videoMotionPrompt', 'motion_prompt'])
    );
    const still_edit_from_sheet = String(
      val(c, ['still_edit_prompt', 'stillEditPrompt'], '')
    ).trim();
    const still_edit_prompt = still_edit_from_sheet || HARD_STILL_EDIT;

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
      still_edit_prompt,
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
// lab_scene = Sheet column `category` (peptide_synthesis, formulation_suite, …)
const lastLabScene = String(last?.category || '').trim();

function accumulateUsage(getter) {
  const times = new Map();
  const lastAt = new Map();
  for (const c of scored) {
    const key = getter(c) || '(none)';
    times.set(key, (times.get(key) || 0) + (Number(c.times_used) || 0));
    const prev = lastAt.get(key) || '';
    if (String(c.last_used_at || '') > prev) {
      lastAt.set(key, String(c.last_used_at || ''));
    }
  }
  return { times, lastAt };
}

const compoundUsage = accumulateUsage((c) => String(c.compound_name || '').trim());
const labSceneUsage = accumulateUsage((c) => String(c.category || '').trim());

function recentDistinct(getter, n) {
  const out = [];
  const seen = new Set();
  for (const c of previouslyUsed) {
    const key = getter(c);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= n) break;
  }
  return out;
}

const RECENT_N = 8;
const recentCompounds = recentDistinct((c) => String(c.compound_name || '').trim(), RECENT_N);
const recentLabScenes = recentDistinct((c) => String(c.category || '').trim(), RECENT_N);
const recentCompoundSet = new Set(recentCompounds);
const recentLabSceneSet = new Set(recentLabScenes);

function scorePick(c) {
  const compound = String(c.compound_name || '').trim() || '(none)';
  const labScene = String(c.category || '').trim() || '(none)';
  let penalty = 0;

  // Never repeat the exact same creation back-to-back
  if (lastId && c.creation_id === lastId) penalty += 8000;

  // CRITICAL each workflow run: rotate compound_name AND lab_scene
  if (lastCompound && compound === lastCompound) penalty += 4000;
  if (lastLabScene && labScene === lastLabScene) penalty += 4000;

  // Soft-avoid recent compounds / lab scenes so the full set rotates
  if (compound && recentCompoundSet.has(compound)) {
    const idx = recentCompounds.indexOf(compound);
    penalty += 300 + (RECENT_N - idx) * 40;
  }
  if (labScene && recentLabSceneSet.has(labScene)) {
    const idx = recentLabScenes.indexOf(labScene);
    penalty += 300 + (RECENT_N - idx) * 40;
  }

  // Prefer least-used compound and least-used lab scene overall
  penalty += (compoundUsage.times.get(compound) || 0) * 25;
  penalty += (labSceneUsage.times.get(labScene) || 0) * 25;

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
    const sa = String(a.category || '').trim() || '(none)';
    const sb = String(b.category || '').trim() || '(none)';

    const cuA = compoundUsage.times.get(ca) || 0;
    const cuB = compoundUsage.times.get(cb) || 0;
    if (cuA !== cuB) return cuA - cuB;

    const suA = labSceneUsage.times.get(sa) || 0;
    const suB = labSceneUsage.times.get(sb) || 0;
    if (suA !== suB) return suA - suB;

    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    if (a.last_used_at !== b.last_used_at) {
      return String(a.last_used_at).localeCompare(String(b.last_used_at));
    }
    return Number(a.rank) - Number(b.rank);
  });

// Prefer rows that change BOTH compound and lab_scene vs last run
function differsBoth(c) {
  const compound = String(c.compound_name || '').trim();
  const labScene = String(c.category || '').trim();
  const compoundOk = !lastCompound || compound !== lastCompound;
  const sceneOk = !lastLabScene || labScene !== lastLabScene;
  return compoundOk && sceneOk;
}
function differsEither(c) {
  const compound = String(c.compound_name || '').trim();
  const labScene = String(c.category || '').trim();
  const compoundOk = !lastCompound || compound !== lastCompound;
  const sceneOk = !lastLabScene || labScene !== lastLabScene;
  return compoundOk || sceneOk;
}

const bothDifferent = diversified.filter(differsBoth);
const eitherDifferent = diversified.filter(differsEither);
const pick = (bothDifferent.length
  ? bothDifferent
  : eitherDifferent.length
    ? eitherDifferent
    : diversified)[0];

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
      lab_scene: pick.category || '',
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
      video_prompt_len: String(pick.video_prompt || '').length,
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
