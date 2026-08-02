// n8n Code node: pick_creation
// Type: Code | Mode: Run Once for All Items
// After: filter_creations_active (or get_reel_creations Return All on 9-lab-item-creations-500)
// Before: grok_imagine_reel_still / save_still_url
//
// Same rotation pattern as the compounds / product spreadsheet:
// least times_used → oldest last_used_at → lowest rank.
// Also skip same category AND same camera_move as the most recently used row
// so every vidgen run gets a visibly different scene + motion.

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

function buildMotionPrompt(row) {
  const fromSheet = String(
    val(row, ['video_motion_prompt', 'videoMotionPrompt', 'motion_prompt'], '')
  ).trim();
  if (fromSheet) return fromSheet;

  const name = String(val(row, ['lab_item', 'labItem', 'item_name'], 'laboratory research item')).trim();
  const camera = String(
    val(row, ['camera_move', 'cameraMove', 'camera'], 'slow push-in, no orbit')
  ).trim();
  const lighting = String(val(row, ['lighting'], 'clinical catalog lighting')).trim();
  const surface = String(val(row, ['surface'], 'clean laboratory surface')).trim();
  const compound = String(val(row, ['compound_name', 'compoundName', 'label_compound'], '')).trim();
  const labelRule = compound
    ? `Keep any on-subject label unchanged and readable as '${compound}' only (Palm Beach Vitality research compound). No motif/LAB/counter text. `
    : `Do not add product compound labels, creation motifs, LAB codes, or counters onto the subject. `;
  return (
    `Photoreal vertical 9:16 Palm Beach Vitality laboratory research catalog film of ${name}. ` +
    `CAMERA MOTION (follow exactly; do not invent a different move): ${camera}. ` +
    `Lighting continuity: ${lighting}. Surface continuity: ${surface}. ` +
    `Keep the subject sharp, recognizable, centered, and unchanged from the still. ` +
    `Do not default to spinning, orbiting, or rotating around the product unless the ` +
    `camera motion above explicitly requests a short arc. ` +
    labelRule +
    `No cardboard boxes, no trays as hero, no people, no hands, no faces, no needles, no injection, no lifestyle. ` +
    `For laboratory research use only. Not for human use or consumption.`
  );
}

const scored = creations
  .map((c) => {
    const rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
    const fromSheet = String(val(c, ['creation_id', 'creationId', 'Creation_ID'], '')).trim();
    const creation_id =
      fromSheet ||
      (rankNum > 0 ? `PBVita-Lab-${String(rankNum).padStart(3, '0')}` : '');

    return {
      raw: c,
      creation_id,
      rank: rankNum,
      // n8n Sheets "Get rows" usually includes row_number; if missing, rank+1
      // (header is row 1) only when the Sheet is in rank order — prefer creation_id for updates.
      row_number:
        Number(val(c, ['row_number', 'rowNumber'], 0)) ||
        (rankNum > 0 ? rankNum + 1 : 0),
      lab_item_id: val(c, ['lab_item_id', 'labItemId']),
      lab_item: val(c, ['lab_item', 'labItem', 'item_name']),
      compound_name: val(c, ['compound_name', 'compoundName', 'label_compound']),
      scene_id: val(c, ['scene_id', 'sceneId']),
      category: val(c, ['category', 'scene_category']),
      scene_brief: val(c, ['scene_brief', 'sceneBrief']),
      quality_suffix: val(c, ['quality_suffix', 'qualitySuffix']),
      quality_var_count: val(c, ['quality_var_count', 'qualityVarCount'], 12),
      video_prompt: val(c, ['video_prompt', 'videoPrompt']),
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

// Most recently used row (by last_used_at) — skip its category + camera_move + id.
const previouslyUsed = scored
  .filter((c) => c.times_used > 0 || (c.last_used_at && c.last_used_at.trim()))
  .slice()
  .sort((a, b) => String(b.last_used_at).localeCompare(String(a.last_used_at)));

const last = previouslyUsed[0] || null;
const lastCategory = last?.category || '';
const lastCamera = last?.camera_move || '';
const lastId = last?.creation_id || '';

function scorePick(c) {
  let penalty = 0;
  if (lastId && c.creation_id === lastId) penalty += 1000;
  if (lastCategory && c.category === lastCategory) penalty += 100;
  if (lastCamera && c.camera_move && c.camera_move === lastCamera) penalty += 50;
  return penalty;
}

let pick = scored[0];
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
pick = diversified[0];

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
      // Real catalog compound for on-product labels (BPC-157, NAD+, …). Overrides Parse spread.
      compound_name: pick.compound_name || '',
      scene_id: pick.scene_id,
      scene_category: pick.category,
      scene_brief: pick.scene_brief,
      quality_suffix: pick.quality_suffix,
      quality_var_count: pick.quality_var_count,
      video_prompt: pick.video_prompt,
      video_motion_prompt: pick.video_motion_prompt,
      surface: pick.surface,
      lighting: pick.lighting,
      camera_move: pick.camera_move,
      color_grade: pick.color_grade,
      hero_style: pick.hero_style,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,

      // Creatomate on-screen copy (prefer pick_text library over these stubs)
      mod_intro: val(pick.raw, ['mod_intro']),
      mod_fact_1: val(pick.raw, ['mod_fact_1']),
      mod_fact_2: val(pick.raw, ['mod_fact_2']),
      mod_fact_3: val(pick.raw, ['mod_fact_3']),
      mod_fact_4: val(pick.raw, ['mod_fact_4']),
      mod_fact_5: val(pick.raw, ['mod_fact_5']),
      mod_disclaimer: val(
        pick.raw,
        ['mod_disclaimer'],
        'For laboratory research use only. Not for human use or consumption.'
      ),

      template_id,
    },
  },
];
