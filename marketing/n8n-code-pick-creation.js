// n8n Code node: pick_creation
// Type: Code | Mode: Run Once for All Items
// After: filter_creations_active
// Before: map_creatomate_mods
//
// Input: ~500 creation rows from spreadsheet "7-unique-reel-creations-500"
// Output: 1 item = Parse_Grok compound fields + chosen creation

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
  // case-insensitive / space-insensitive fallback
  const keys = Object.keys(obj || {});
  for (const want of names) {
    const normWant = want.toLowerCase().replace(/\s+/g, '_');
    const found = keys.find((k) => k.toLowerCase().replace(/\s+/g, '_') === normWant);
    if (found && String(obj[found]).trim() !== '') return obj[found];
  }
  return fallback;
}

const scored = creations
  .map((c) => {
    const rankNum = Number(val(c, ['rank', 'creation_rank'], 0));
    const fromSheet = String(val(c, ['creation_id', 'creationId', 'Creation_ID'], '')).trim();
    const creation_id =
      fromSheet ||
      (rankNum > 0 ? `PBVita-Reel-${String(rankNum).padStart(3, '0')}` : '');

    return {
      raw: c,
      creation_id,
      rank: rankNum,
      scene_id: val(c, ['scene_id', 'sceneId']),
      category: val(c, ['category', 'scene_category']),
      scene_brief: val(c, ['scene_brief', 'sceneBrief']),
      quality_suffix: val(c, ['quality_suffix', 'qualitySuffix']),
      quality_var_count: val(c, ['quality_var_count', 'qualityVarCount'], 12),
      video_prompt: val(c, ['video_prompt', 'videoPrompt']),
      status: val(c, ['status', 'creation_status'], 'Active'),
      times_used: Number(val(c, ['times_used', 'creation_times_used'], 0)),
      last_used_at: String(val(c, ['last_used_at', 'lastUsedAt', 'last_reel_at'], '')),
    };
  })
  .filter((c) => c.creation_id && c.video_prompt)
  .sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    return a.last_used_at.localeCompare(b.last_used_at);
  });

if (!scored.length) {
  const sampleKeys = Object.keys(creations[0] || {}).join(', ');
  throw new Error(
    'No valid creations (need creation_id or rank + video_prompt). First row keys: ' + sampleKeys
  );
}

const pick = scored[0];

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
      // compound / Parse fields first
      ...compound,

      // chosen creation (these MUST appear in output)
      creation_id: pick.creation_id,
      creation_rank: pick.rank,
      scene_id: pick.scene_id,
      scene_category: pick.category,
      scene_brief: pick.scene_brief,
      quality_suffix: pick.quality_suffix,
      quality_var_count: pick.quality_var_count,
      video_prompt: pick.video_prompt,
      creation_status: pick.status,
      creation_times_used: pick.times_used,
      creation_last_used_at: pick.last_used_at,

      template_id,
    },
  },
];
