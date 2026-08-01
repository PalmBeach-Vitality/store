// n8n Code node: map_creatomate_mods
// Type: Code | Mode: Run Once for All Items
// After: save_extend_1_url (and pick_creation earlier in the same run)
// Before: creatomate_render

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function pickUrl(...objs) {
  for (const o of objs) {
    if (!o || typeof o !== 'object') continue;
    const candidates = [
      o.video_url,
      o.grok_video_url,
      o.url,
      o.video?.url,
      o.data?.video?.url,
      o.data?.url,
    ];
    for (const u of candidates) {
      if (typeof u === 'string' && u.startsWith('http')) return u;
    }
  }
  return '';
}

const pick = firstJson('pick_creation');
const extend1 = firstJson('save_extend_1_url');
const saveVideo = firstJson('save_video_url');
const input = $input.first()?.json || {};

const grok_video_url = pickUrl(extend1, saveVideo, input, pick);

const lab_item = String(pick.lab_item || input.lab_item || '').trim();
const creation_id = String(pick.creation_id || input.creation_id || '').trim();

function fact(key, fallback) {
  const v = String(pick[key] || input[key] || '').trim();
  return v || fallback;
}

// Product name for Intro-Text (not lab_item / vial description)
function productName() {
  const src = { ...input, ...pick };
  const raw = String(
    src.compound_name ||
      src.product_name ||
      src.display_name ||
      src.figma_headline ||
      ''
  ).trim();
  if (!raw) return lab_item || 'Palm Beach Vitality';
  // "5-Amino-1MQ Research-use clarification FAQ" → "5-Amino-1MQ"
  const m = raw.match(/^(\S+(?:-\S+)*)\s+Research\b/i);
  if (m) return m[1];
  const first = raw.split(/\s+[—–|:]\s+/)[0].trim();
  return first.length <= 48 ? first : raw;
}

if (!grok_video_url) {
  throw new Error(
    'grok_video_url missing. Run through save_extend_1_url first. ' +
      'save_extend_1_url keys=' +
      Object.keys(extend1).join(', ') +
      ' | save_video_url keys=' +
      Object.keys(saveVideo).join(', ')
  );
}

return [
  {
    json: {
      ...input,
      ...pick,
      grok_video_url,
      mod_intro: productName(),
      mod_fact_1: fact('mod_fact_1', 'Listed as research material for laboratory documentation only'),
      mod_fact_2: fact('mod_fact_2', 'Supplied in research-appropriate sealed packaging'),
      mod_fact_3: fact('mod_fact_3', 'Intended for in-vitro assay preparation contexts'),
      mod_fact_4: fact('mod_fact_4', 'Explicit research-use only — not for clinical application'),
      mod_fact_5: fact('mod_fact_5', 'View laboratory listing for full documentation'),
      mod_disclaimer: fact(
        'mod_disclaimer',
        'For laboratory research use only. Not for human use or consumption.'
      ),
      text_id: creation_id,
      creation_id,
      template_id: '06cd4ffd-906c-45ed-bf33-e8d2bed4312b',
    },
  },
];
