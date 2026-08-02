// n8n Code node: map_creatomate_mods
// Type: Code | Mode: Run Once for All Items
// After: save_video_url or save_extend_1_url (+ pick_creation, optional pick_text)
// Before: creatomate_render
//
// Intro-Text = PRODUCT NAME only (e.g. 5-Amino-1MQ)
// Facts = pick_text (1000 library) when present, else pick_creation
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
  if (/^palm\s*beach\s*vitality$/i.test(s)) return '';
  // Reject ISO dates like 2026-08-02 (was incorrectly becoming Intro-Text)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return '';
  let m = s.match(/^([0-9A-Za-z][0-9A-Za-z./+-]*(?:-[0-9A-Za-z./+-]+)*)\s+Research\b/i);
  if (m && !/^\d{4}-\d{2}-\d{2}$/.test(m[1])) return m[1];
  // Prefer real compound tokens; never match plain dates
  m = s.match(/\b(\d+-[A-Za-z][A-Za-z0-9-]*)\b/);
  if (m && !/^\d{4}-\d{2}-\d{2}$/.test(m[1])) return m[1];
  m = s.match(/\b([A-Z]{2,}-?\d{2,4}[A-Za-z]?)\b/);
  if (m) return m[1];
  const first = s.split(/\s+[—–|:]\s+/)[0].trim();
  if (
    first &&
    first.length <= 40 &&
    !/palm\s*beach/i.test(first) &&
    !/^\d{4}-\d{2}-\d{2}/.test(first)
  ) {
    return first;
  }
  return '';
}

function productName(srcList) {
  const preferredKeys = [
    'compound_name',
    'product_name',
    'display_name',
    'figma_headline',
  ];
  // Captions last — they often contain dates that used to leak into Intro
  const fallbackKeys = ['ig_caption_draft', 'fb_caption_draft'];
  for (const src of srcList) {
    if (!src || typeof src !== 'object') continue;
    for (const k of preferredKeys) {
      const name = extractProductName(src[k]);
      if (name) return name;
    }
  }
  for (const src of srcList) {
    if (!src || typeof src !== 'object') continue;
    for (const k of fallbackKeys) {
      const name = extractProductName(src[k]);
      if (name) return name;
    }
  }
  throw new Error(
    'PRODUCT NAME missing for Intro-Text. Need compound_name / display_name / figma_headline ' +
      '(e.g. 5-Amino-1MQ). Do not use Palm Beach Vitality, lab_item, or a date. ' +
      'Keys on input: ' +
      Object.keys(srcList[0] || {}).join(', ')
  );
}

/** Strip catalog suffixes: "· ref 0001", "· motif 0001", etc. */
function cleanFact(text) {
  return String(text || '')
    .replace(/\s*[·•|-]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .replace(/\s*\((ref|motif|card|line|cta)\s*\d+\)\s*$/i, '')
    .trim();
}

function factFrom(sources, key, fallback) {
  for (const src of sources) {
    const v = cleanFact(src?.[key] || '');
    if (v) return v;
  }
  return fallback;
}

const pick = firstJson('pick_creation');
const text = firstJson('pick_text');
const parse = firstJson('Parse_Grok');
const input = $input.first()?.json || {};

// Try common node names — n8n $() is exact/case-sensitive.
const videoNodeNames = [
  'save_video_url',
  'Save_video_url',
  'Save Video URL',
  'save video url',
  'grok_video_poll',
  'Grok_video_poll',
  'if_video_ready',
  'save_extend_1_url',
  'Save_extend_1_url',
  'prep_creatomate',
];

const videoSources = videoNodeNames.map((n) => ({ name: n, json: firstJson(n) }));

if (!text.text_id || !text.mod_fact_1) {
  throw new Error(
    'pick_text missing or empty. Run get_reel_text → pick_text first. Node name must be exactly pick_text.'
  );
}

// Never trust input.grok_video_url (stale from prior map).
let grok_video_url = '';
let videoFrom = '';
for (const src of videoSources) {
  const u = pickUrl(src.json, { allowGrokField: src.name !== 'prep_creatomate' });
  if (u) {
    grok_video_url = u;
    videoFrom = src.name;
    break;
  }
}
if (!grok_video_url) {
  grok_video_url = pickUrl(input, { allowGrokField: false }) || '';
  if (grok_video_url) videoFrom = '$input';
}

const creation_id = String(pick.creation_id || input.creation_id || '').trim();
const text_id = String(text.text_id || '').trim();
const mod_intro = productName([parse, input, pick]);

// Facts ONLY from pick_text (1000 unique sets) — not pick_creation duplicates.
const factSources = [text];

if (!grok_video_url) {
  const tried = videoSources
    .map((s) => s.name + '[' + Object.keys(s.json).join(',') + ']')
    .join(' | ');
  throw new Error(
    'grok_video_url missing. Finish Grok video first, then map. ' +
      'Need a node with video.url / video_url / url = https://vidgen...mp4. ' +
      'Tried: ' +
      tried +
      ' | $input keys=' +
      Object.keys(input).join(',')
  );
}

// Do not let pick_text.mod_intro (catalog blurb) overwrite the product name.
const { mod_intro: _textIntroIgnore, ...textRest } = text;

return [
  {
    json: {
      ...input,
      ...pick,
      ...textRest,
      grok_video_url,
      grok_video_from: videoFrom,
      // PRODUCT NAME only — never pick_text catalog line / (0001/1000)
      mod_intro,
      mod_fact_1: factFrom(
        factSources,
        'mod_fact_1',
        'Listed as research material for laboratory documentation only'
      ),
      mod_fact_2: factFrom(
        factSources,
        'mod_fact_2',
        'Supplied in research-appropriate sealed packaging'
      ),
      mod_fact_3: factFrom(
        factSources,
        'mod_fact_3',
        'Intended for in-vitro assay preparation contexts'
      ),
      mod_fact_4: factFrom(
        factSources,
        'mod_fact_4',
        'Explicit research-use only — not for clinical application'
      ),
      mod_fact_5: factFrom(
        factSources,
        'mod_fact_5',
        'View laboratory listing for full documentation'
      ),
      mod_disclaimer: factFrom(
        factSources,
        'mod_disclaimer',
        'For laboratory research use only. Not for human use or consumption.'
      ),
      text_id,
      creation_id,
      template_id: '06cd4ffd-906c-45ed-bf33-e8d2bed4312b',
    },
  },
];
