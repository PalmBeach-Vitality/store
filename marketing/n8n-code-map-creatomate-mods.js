// n8n Code node: map_creatomate_mods
// Type: Code | Mode: Run Once for All Items
// After: save_video_url (+ pick_creation, pick_text)
// Before: creatomate_render
//
// CRITICAL: Creatomate often CANNOT fetch https://vidgen.x.ai/... MP4s.
// If you pass a vidgen URL, text mods may apply but the template bed stays default.
// Rehost the Grok MP4 to a public direct URL (Google Drive uc?export=download) and
// put that in save_video_url.public_video_url OR set FORCE_PUBLIC_VIDEO below.

// TEMP test override — public direct .mp4 (catbox / R2 / B2). Leave '' to use node output.
const FORCE_PUBLIC_VIDEO = 'https://files.catbox.moe/ehh2x2.mp4';

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function isHttp(u) {
  return typeof u === 'string' && /^https?:\/\//i.test(u.trim());
}

/** Creatomate-fetchable URL? Prefer public hosts; vidgen is kept as last resort. */
function scoreUrl(u) {
  if (!isHttp(u)) return -1;
  const s = u.trim();
  if (/drive\.google\.com\/uc\?export=download/i.test(s)) return 100;
  if (/backblazeb2\.com|storage\.googleapis\.com|amazonaws\.com|cloudflare|r2\.dev/i.test(s))
    return 90;
  if (/\.mp4(\?|$)/i.test(s) && !/vidgen\.x\.ai/i.test(s)) return 80;
  if (/vidgen\.x\.ai/i.test(s)) return 10; // Grok host — Creatomate often cannot fetch
  if (/drive\.google\.com\/file\/d\/.+\/view/i.test(s)) return 0; // HTML page, not MP4
  return 20;
}

function pickBestUrl(...candidates) {
  let best = '';
  let bestScore = -1;
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      const sc = scoreUrl(c);
      if (sc > bestScore) {
        best = c.trim();
        bestScore = sc;
      }
      continue;
    }
    if (typeof c === 'object') {
      for (const k of [
        'public_video_url',
        'creatomate_video_source',
        'drive_video_url',
        'video_url',
        'grok_video_url',
        'url',
      ]) {
        const sc = scoreUrl(c[k]);
        if (sc > bestScore) {
          best = String(c[k]).trim();
          bestScore = sc;
        }
      }
      const nested = c.video?.url || c.data?.video?.url || c.data?.url;
      const scn = scoreUrl(nested);
      if (scn > bestScore) {
        best = String(nested).trim();
        bestScore = scn;
      }
    }
  }
  return { url: best, score: bestScore };
}

function extractProductName(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^palm\s*beach\s*vitality$/i.test(s)) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return '';
  let m = s.match(/^([0-9A-Za-z][0-9A-Za-z./+-]*(?:-[0-9A-Za-z./+-]+)*)\s+Research\b/i);
  if (m && !/^\d{4}-\d{2}-\d{2}$/.test(m[1])) return m[1];
  m = s.match(/\b(\d+-[A-Za-z][A-Za-z0-9-]*)\b/);
  if (m && !/^\d{4}-\d{2}-\d{2}$/.test(m[1])) return m[1];
  m = s.match(/\b(NAD\+|SEMAX|GHK-Cu|MOTS-C|SS-31|TA-1|TB-500|DSIP|KPV|GLOW|KLOW)\b/i);
  if (m) return m[1];
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
  for (const src of srcList) {
    if (!src || typeof src !== 'object') continue;
    for (const k of preferredKeys) {
      const name = extractProductName(src[k]);
      if (name) return name;
    }
  }
  throw new Error(
    'PRODUCT NAME missing for Intro-Text. Need compound_name (e.g. BPC-157) from pick_creation. ' +
      'Keys on input: ' +
      Object.keys(srcList[0] || {}).join(', ')
  );
}

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

const videoNodeNames = [
  'save_video_url',
  'Save_video_url',
  'Save Video URL',
  'save video url',
  'grok_video_poll',
  'Grok_video_poll',
  'if_video_ready',
  'save_extend_1_url',
  'prep_creatomate',
];

const videoSources = videoNodeNames.map((n) => ({ name: n, json: firstJson(n) }));

if (!text.text_id || !text.mod_fact_1) {
  throw new Error(
    'pick_text missing or empty. Run get_reel_text → pick_text first. Node name must be exactly pick_text.'
  );
}

let grok_video_url = '';
let videoFrom = '';
let videoScore = -1;

if (FORCE_PUBLIC_VIDEO && scoreUrl(FORCE_PUBLIC_VIDEO) > 0) {
  grok_video_url = FORCE_PUBLIC_VIDEO.trim();
  videoFrom = 'FORCE_PUBLIC_VIDEO';
  videoScore = scoreUrl(FORCE_PUBLIC_VIDEO);
} else {
  for (const src of videoSources) {
    const { url, score } = pickBestUrl(src.json);
    if (score > videoScore) {
      grok_video_url = url;
      videoFrom = src.name;
      videoScore = score;
    }
  }
  if (videoScore < 0) {
    const { url, score } = pickBestUrl(input);
    if (score > videoScore) {
      grok_video_url = url;
      videoFrom = '$input';
      videoScore = score;
    }
  }
}

if (!grok_video_url) {
  const tried = videoSources
    .map((s) => s.name + '[' + Object.keys(s.json).join(',') + ']')
    .join(' | ');
  throw new Error(
    'grok_video_url missing. Finish Grok video first, then map. Tried: ' +
      tried +
      ' | $input keys=' +
      Object.keys(input).join(',')
  );
}

const creatomate_may_fail_fetch = /vidgen\.x\.ai/i.test(grok_video_url) || videoScore < 50;

const creation_id = String(pick.creation_id || input.creation_id || '').trim();
const text_id = String(text.text_id || '').trim();
const mod_intro = productName([pick, parse, input]);

const { mod_intro: _textIntroIgnore, ...textRest } = text;

return [
  {
    json: {
      ...input,
      ...pick,
      ...textRest,
      grok_video_url,
      grok_video_from: videoFrom,
      grok_video_score: videoScore,
      creatomate_may_fail_fetch,
      creatomate_fetch_warning: creatomate_may_fail_fetch
        ? 'URL looks like vidgen (or non-public). Creatomate often cannot download it and will keep the template bed. Rehost MP4 to Drive uc?export=download and set FORCE_PUBLIC_VIDEO or save_video_url.public_video_url.'
        : '',
      mod_intro,
      mod_fact_1: factFrom(
        [text],
        'mod_fact_1',
        'Listed as research material for laboratory documentation only'
      ),
      mod_fact_2: factFrom(
        [text],
        'mod_fact_2',
        'Supplied in research-appropriate sealed packaging'
      ),
      mod_fact_3: factFrom(
        [text],
        'mod_fact_3',
        'Intended for in-vitro assay preparation contexts'
      ),
      mod_fact_4: factFrom(
        [text],
        'mod_fact_4',
        'Explicit research-use only — not for clinical application'
      ),
      mod_fact_5: factFrom(
        [text],
        'mod_fact_5',
        'View laboratory listing for full documentation'
      ),
      mod_disclaimer: factFrom(
        [text],
        'mod_disclaimer',
        'For laboratory research use only. Not for human use or consumption.'
      ),
      text_id,
      creation_id,
      template_id: '06cd4ffd-906c-45ed-bf33-e8d2bed4312b',
    },
  },
];
