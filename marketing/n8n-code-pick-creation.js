// n8n Code node: pick_creation
// Workflow: PBVita — Reel Studio
// After: get_reel_creations (all Active rows from tab 7-unique-reel-creations-500)
// Before: map_creatomate_mods  (or grok_imagine_from_creation)
//
// Picks the least-used Active creation, merges onto Parse_Grok / if_compliance fields.

const creations = $input.all().map((i) => i.json);

if (!creations.length) {
  throw new Error('No reel creations returned. Check Sheets tab 7-unique-reel-creations-500 and filter status=Active.');
}

const scored = creations
  .map((c) => ({
    ...c,
    _times: Number(c.times_used || 0),
    _last: String(c.last_used_at || ''),
  }))
  .sort((a, b) => {
    if (a._times !== b._times) return a._times - b._times;
    return a._last.localeCompare(b._last);
  });

const pick = scored[0];

// Prefer Parse_Grok (compliance-passed compound). Fallbacks if names differ.
const compound =
  $('Parse_Grok').item?.json ||
  $('if_compliance').item?.json ||
  {};

return [
  {
    json: {
      ...compound,

      // creation identity
      creation_id: pick.creation_id,
      creation_rank: pick.rank,
      scene_id: pick.scene_id,
      scene_category: pick.category,
      scene_brief: pick.scene_brief,
      quality_suffix: pick.quality_suffix,
      quality_var_count: pick.quality_var_count,
      video_prompt: pick.video_prompt,
      creation_status: pick.status,
      creation_times_used: pick._times,
      creation_last_used_at: pick._last,

      // keep template_id from Prep if present on compound
      template_id:
        compound.template_id ||
        $('Prep_day_variant').item?.json?.template_id ||
        '',
    },
  },
];
