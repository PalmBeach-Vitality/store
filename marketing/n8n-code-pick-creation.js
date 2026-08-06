// n8n Code node: pick_creation
// Type: Code | Mode: Run Once for All Items
// After: get_reel_creations / filter Active on 9-lab-item-creations-500
// Before: grok_imagine_reel_still
//
// Least-used rotation + skip same scene_setting / category / shot_family as recent runs.

const creations = $input.all().map((i) => i.json);

if (!creations.length) {
  throw new Error(
    'No reel creations returned. Check get_reel_creations Document/Sheet and filter status=Active.'
  );
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

/** Disclaimers belong in Buffer captions only — never in Grok/Seedance prompts. */
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

function buildMotionPrompt(row) {
  const fromSheet = stripVidDisclaimer(
    String(val(row, ['video_motion_prompt', 'videoMotionPrompt', 'motion_prompt'], '')).trim()
  );
  if (fromSheet) return fromSheet;

  const name = String(val(row, ['lab_item', 'labItem', 'item_name'], 'laboratory research item')).trim();
  const camera = String(
    val(row, ['camera_move', 'cameraMove', 'camera'], 'slow straight push-in, then hold')
  ).trim();
  const family = String(val(row, ['shot_family', 'shotFamily'], 'push_in')).trim();
  const angle = String(val(row, ['camera_angle', 'cameraAngle'], 'eye-level')).trim();
  const direction = String(
    val(row, ['camera_direction', 'cameraDirection'], 'straight forward')
  ).trim();
  const framing = String(val(row, ['framing'], 'centered editorial hero')).trim();
  const lighting = String(val(row, ['lighting'], 'clinical catalog lighting')).trim();
  const surface = String(val(row, ['surface'], 'clean laboratory surface')).trim();
  const compound = String(val(row, ['compound_name', 'compoundName'], '')).trim();
  const setting = String(val(row, ['scene_setting', 'sceneSetting'], '')).trim();
  const labelRule = compound
    ? `Keep any on-subject label unchanged and readable as '${compound}' only. `
    : `Do not add product compound labels onto the subject. `;
  const place = setting || name || 'wellness lifestyle setting';
  return (
    `Photoreal vertical 9:16 wellness lifestyle catalog film in ${place}. ` +
    `SHOT FAMILY: ${family}. CAMERA ANGLE: ${angle}. CAMERA DIRECTION: ${direction}. ` +
    `FRAMING: ${framing}. CAMERA: ${camera}. ` +
    `Path must be straight or a simple tilt/pedestal only — never travel around the subject. ` +
    `Lighting continuity: ${lighting}. Surface continuity: ${surface}. ` +
    `Keep the scene sharp and unchanged from the still. ` +
    labelRule +
    `No people, no hands, no needles, no laboratory sets. No burn-in text or watermarks.`
  );
}

const scored = creations
  .map((c) => {
    const rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
    const fromSheet = String(val(c, ['creation_id', 'creationId', 'Creation_ID'], '')).trim();
    const creation_id =
      fromSheet ||
      (rankNum > 0 ? `PBVita-Scene-${String(rankNum).padStart(3, '0')}` : '');

    return {
      raw: c,
      creation_id,
      rank: rankNum,
      row_number:
        Number(val(c, ['row_number', 'rowNumber'], 0)) ||
        (rankNum > 0 ? rankNum + 1 : 0),
      lab_item_id: val(c, ['lab_item_id', 'labItemId']),
      lab_item: val(c, ['lab_item', 'labItem', 'item_name']),
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
      quality_var_count: val(c, ['quality_var_count', 'qualityVarCount'], 12),
      video_prompt: stripVidDisclaimer(val(c, ['video_prompt', 'videoPrompt'])),
      video_motion_prompt: buildMotionPrompt(c),
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
  .filter((c) => c.creation_id && c.video_prompt)
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
    'No valid creations (need creation_id or rank + video_prompt). First row keys: ' + sampleKeys
  );
}

const previouslyUsed = scored
  .filter((c) => c.times_used > 0 || (c.last_used_at && c.last_used_at.trim()))
  .slice()
  .sort((a, b) => String(b.last_used_at).localeCompare(String(a.last_used_at)));

// Diversify against the last N runs (not just the single previous row)
const RECENT_N = 8;
const recent = previouslyUsed.slice(0, RECENT_N);
const last = recent[0] || null;
const lastId = last?.creation_id || '';
const recentFamilies = new Set(recent.map((c) => c.shot_family).filter(Boolean));
const recentCameras = new Set(recent.map((c) => c.camera_move).filter(Boolean));
const recentAngles = new Set(recent.map((c) => c.camera_angle).filter(Boolean));
const recentDirections = new Set(recent.map((c) => c.camera_direction).filter(Boolean));
const recentFramings = new Set(recent.map((c) => c.framing).filter(Boolean));
const recentCategories = new Set(recent.map((c) => c.category).filter(Boolean));
const recentSettings = new Set(recent.map((c) => c.scene_setting).filter(Boolean));
const recentBuckets = new Set(recent.map((c) => c.environment_bucket).filter(Boolean));

function scorePick(c) {
  let penalty = 0;
  if (lastId && c.creation_id === lastId) penalty += 1000;
  // Hard preference: never the same scene setting two days in a row
  if (last?.scene_setting && c.scene_setting === last.scene_setting) penalty += 2000;
  if (c.scene_setting && recentSettings.has(c.scene_setting)) penalty += 400;
  if (last?.environment_bucket && c.environment_bucket === last.environment_bucket) penalty += 180;
  if (c.environment_bucket && recentBuckets.has(c.environment_bucket)) penalty += 80;
  if (c.shot_family && recentFamilies.has(c.shot_family)) penalty += 120;
  if (c.camera_move && recentCameras.has(c.camera_move)) penalty += 140;
  if (c.camera_angle && recentAngles.has(c.camera_angle)) penalty += 50;
  if (c.camera_direction && recentDirections.has(c.camera_direction)) penalty += 50;
  if (c.framing && recentFramings.has(c.framing)) penalty += 60;
  if (c.category && recentCategories.has(c.category)) penalty += 40;
  // Extra weight against the immediate previous family/camera
  if (last?.shot_family && c.shot_family === last.shot_family) penalty += 40;
  if (last?.camera_move && c.camera_move === last.camera_move) penalty += 40;
  return penalty;
}

const diversified = scored
  .slice()
  .sort((a, b) => {
    const pa = scorePick(a);
    const pb = scorePick(b);
    if (pa !== pb) return pa - pb;
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    if (a.last_used_at !== b.last_used_at) {
      return String(a.last_used_at).localeCompare(String(b.last_used_at));
    }
    return Number(a.rank) - Number(b.rank);
  });

// Hard rule: never the same scene_setting two days in a row when alternatives exist
const lastSetting = last?.scene_setting || '';
const notSameSetting = lastSetting
  ? diversified.filter((c) => c.scene_setting !== lastSetting)
  : diversified;
const pick = (notSameSetting.length ? notSameSetting : diversified)[0];

/** Hard rule for Grok: injection vials = aluminum crimp + rubber septum only */
const VIAL_CLOSURE_RULE =
  "VIAL CLOSURE RULE (MANDATORY): Every vial must be a pharmaceutical injection vial with an " +
  "aluminum crimped seal over a rubber septum stopper. Show the crimped metal collar and rubber " +
  "center clearly when a vial is visible. NO twist-off caps, NO screw-top vials, NO child-resistant " +
  "twist lids, NO plastic twist closures — crimped metal + rubber only.";

function withVialClosure(prompt) {
  const p = String(prompt || '').trim();
  if (!p) return p;
  if (/VIAL CLOSURE RULE/i.test(p)) return p;
  return `${p} ${VIAL_CLOSURE_RULE}`;
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
      video_prompt: withVialClosure(stripVidDisclaimer(pick.video_prompt)),
      video_motion_prompt: stripVidDisclaimer(pick.video_motion_prompt),
      surface: pick.surface,
      lighting: pick.lighting,
      camera_move: pick.camera_move,
      color_grade: pick.color_grade,
      hero_style: pick.hero_style,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,

      // Creatomate overlay copy lives on Sheet 10 (pick_text) — not on Sheet 9

      template_id,
    },
  },
];
