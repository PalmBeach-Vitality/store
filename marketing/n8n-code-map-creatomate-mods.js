// n8n Code node: map_creatomate_mods
// Type: Code | Mode: Run Once for All Items
// After: save_extend_1_url (and pick_creation earlier in the same run)
// Before: creatomate_render
//
// Intro-Text = PRODUCT NAME only (e.g. 5-Amino-1MQ)
// Never use business name "Palm Beach Vitality" or lab_item for Intro.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function pickUrl(o, { allowGrokField = true } = {}) {
  if (!o || typeof o !== 'object') return '';
  const candidates = [
    o.video_url,
    allowGrokField ? o.grok_video_url : null,
    o.url,
    o.video?.url,
    o.data?.video?.url,
    o.data?.url,
  ];
  for (const u of candidates) {
    if (typeof u === 'string' && u.startsWith('http') && u.includes('vidgen')) return u;
  }
  return '';
}

/** Pull a clean product/compound name from messy headline/caption strings. */
function extractProductName(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  // Reject business name
  if (/^palm\s*beach\s*vitality$/i.test(s)) return '';
  // "5-Amino-1MQ Research-use clarification FAQ" → "5-Amino-1MQ"
  let m = s.match(/^([0-9A-Za-z][0-9A-Za-z./+-]*(?:-[0-9A-Za-z./+-]+)*)\s+Research\b/i);
  if (m) return m[1];
  // Caption: "…FAQ: 5-Amino-1MQ is provided…"
  m = s.match(/\b([0-9]+-[A-Za-z0-9-]+|[A-Z]{2,}-?\d{2,4}[A-Za-z]?)\b/);
  if (m) return m[1];
  // Short clean token / phrase
  const first = s.split(/\s+[—–|:]\s+/)[0].trim();
  if (first && first.length <= 40 && !/palm\s*beach/i.test(first)) return first;
  return '';
}

function productName(srcList) {
  const preferredKeys = [
    'compound_name',
    'product_name',
    'display_name',
    'figma_headline',
    'ig_caption_draft',
    'fb_caption_draft',
  ];
  for (const src of srcList) {
    if (!src || typeof src !== 'object') continue;
    for (const k of preferredKeys) {
      const name = extractProductName(src[k]);
      if (name) return name;
    }
  }
  throw new Error(
    'PRODUCT NAME missing for Intro-Text. Need compound_name / display_name / figma_headline ' +
      '(e.g. 5-Amino-1MQ). Do not use Palm Beach Vitality or lab_item. ' +
      'Keys on input: ' +
      Object.keys(srcList[0] || {}).join(', ')
  );
}

const pick = firstJson('pick_creation');
const parse = firstJson('Parse_Grok');
const extend1 = firstJson('save_extend_1_url');
const saveVideo = firstJson('save_video_url');
const pollVideo = firstJson('grok_video_poll');
const input = $input.first()?.json || {};

// FORCE latest vial clip for this run (remove after pipeline is stable).
// Old pen URL was sticking via input.grok_video_url / stale save_extend_1_url.
const FORCE_GROK_VIDEO_URL =
  'https://vidgen.x.ai/xai-vidgen-bucket/xai-video-b1503378-2de8-90f4-be1c-9a2244a26ec6.mp4';

// NEVER trust input.grok_video_url — it sticks from the previous map run (old pen clip).
const grok_video_url =
  FORCE_GROK_VIDEO_URL ||
  pickUrl(saveVideo) ||
  pickUrl(pollVideo) ||
  pickUrl(extend1) ||
  pickUrl(input, { allowGrokField: false }) ||
  pickUrl(pick, { allowGrokField: false });
const creation_id = String(pick.creation_id || input.creation_id || '').trim();
const mod_intro = productName([parse, input, pick]);

/** Strip catalog suffixes: "· ref 0001", "· motif 0001", "· card 0001", "· line 0001", "· CTA 0001" */
function cleanFact(text) {
  return String(text || '')
    .replace(/\s*[·•|-]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .replace(/\s*\((ref|motif|card|line|cta)\s*\d+\)\s*$/i, '')
    .trim();
}

function fact(key, fallback) {
  const v = cleanFact(pick[key] || input[key] || '');
  return v || fallback;
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
      mod_intro,
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
