// n8n Code node: map_creatomate_from_url
// Type: Code | Mode: Run Once for All Items
// Workflow: PBVita — Creatomate Package (SEPARATE)
// After: pick_text (+ video_url_input Set node)
// Before: creatomate_render
//
// Each run: paste CATBOX (public) .mp4 URL + product_name into video_url_input.
// Creatomate CANNOT fetch vidgen.x.ai / Grok URLs — upload to catbox.moe first.
// Optional: still_url / hold_image_url → end_hold (also prefer catbox / public HTTPS).
// pick_text filters facts 1–3 for that product (plain-English ad tone).
// Intro-Text = product_name. Facts 4–5 stay sheet disclaimer/CTA.
// buffer_caption = unique per product/post (facts rotate) + 5 hashtags + discount CTA.
//
// Template: c5d54774-b029-4786-af04-d5af345dc7f2
// Elements: Video-8QW (catbox MP4, once) + end_hold (still). Muted.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function cleanFact(text) {
  let t = String(text || '').trim();
  const rules = [
    /\s*[·•⋅∙.\u00b7]?\s*set\s*\d+\s*$/i,
    /\s*[—–-]?\s*research card\s*\d+\s*$/i,
    /\s*[·•⋅∙.\u00b7]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i,
    /\s*[-–—|]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i,
    /\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/,
    /\s+[—–-]\s*research\s*$/i,
  ];
  let prev;
  do {
    prev = t;
    for (const re of rules) t = t.replace(re, '').trim();
  } while (t !== prev);
  return t;
}

/** Creatomate cannot pull these hosts — reject before render. */
function assertCreatomateFetchable(url, fieldLabel) {
  const u = String(url || '').trim();
  if (!u) return u;
  if (/vidgen\.x\.ai|imgen\.x\.ai|api\.x\.ai/i.test(u)) {
    throw new Error(
      `${fieldLabel} is a Grok/xAI URL. Creatomate cannot fetch it. ` +
        'Download the MP4 → upload to https://catbox.moe → paste the catbox URL ' +
        '(e.g. https://files.catbox.moe/….mp4) into video_url_input.public_video_url.'
    );
  }
  return u;
}

/** #Hashtag from product name — letters/numbers only */
function toHashtag(name) {
  const raw = String(name || '')
    .replace(/\+/g, 'Plus')
    .replace(/[^a-zA-Z0-9]+/g, '');
  return raw ? `#${raw}` : '#PeptideResearch';
}

/**
 * Product-specific research pitch tags (exactly 5 total with product + brand).
 * Keep research / lab framing — no human-use or medical outcome claims.
 */
const PRODUCT_TAGS = {
  '5-Amino-1MQ': ['#MetabolicResearch', '#CellularEnergy', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'AOD-9604': ['#AOD9604Research', '#MetabolicScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'BPC-157': ['#BPC157Research', '#PeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'BPC-157/TB-500': ['#BPC157', '#TB500Research', '#PeptideScience', '#PalmBeachVitality', '#ResearchOnly'],
  CJC: ['#CJC', '#CJCResearch', '#EndocrineLab', '#PalmBeachVitality', '#ResearchOnly'],
  'CJC (no DAC)/Ipamorelin': ['#CJCIpamorelin', '#EndocrineLab', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Cagrilinitide: ['#Cagrilinitide', '#MetabolicResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  DSIP: ['#DSIPResearch', '#NeuropeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'GHK-Cu': ['#GHKCu', '#CopperPeptide', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  GLOW: ['#GLOWBlend', '#PeptideResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  KLOW: ['#KLOWBlend', '#PeptideResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  KPV: ['#KPVResearch', '#PeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'MOTS-C': ['#MOTSC', '#MitochondrialResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'Melanotan 2': ['#Melanotan2', '#PeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'NAD+': ['#NADPlus', '#CellularResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'PT-141': ['#PT141', '#PeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Retatrutide: ['#Retatrutide', '#MetabolicResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  SEMAX: ['#SEMAX', '#NeuropeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'SS-31': ['#SS31', '#MitochondrialResearch', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Selank: ['#Selank', '#NeuropeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Semaglutide: ['#SemaglutideResearch', '#MetabolicScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Sermorelin: ['#Sermorelin', '#EndocrineLab', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'TA-1': ['#TA1', '#PeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'TB-500': ['#TB500', '#PeptideScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Tesamorelin: ['#Tesamorelin', '#EndocrineLab', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  'Tesamorelin/Ipamorelin': ['#Tesamorelin', '#Ipamorelin', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
  Tirzepatide: ['#TirzepatideResearch', '#MetabolicScience', '#LabGradePeptides', '#PalmBeachVitality', '#ResearchOnly'],
};

function fiveHashtags(productName) {
  const mapped = PRODUCT_TAGS[productName];
  if (mapped && mapped.length >= 5) return mapped.slice(0, 5);
  // Fallback: product tag + research bank
  const bank = [
    toHashtag(productName),
    '#PeptideResearch',
    '#LabGradePeptides',
    '#PalmBeachVitality',
    '#ResearchOnly',
  ];
  return [...new Set(bank)].slice(0, 5);
}

/**
 * Upbeat, audience-friendly Buffer caption for viewers (4+ sentences).
 * Product-specific sales pitch/description; research-only disclaimer kept.
 * No human-use / medical outcome claims.
 */
function buildBufferCaption(productName, fact1, fact2, fact3) {
  const p = String(productName || '').trim();
  const f1 = cleanFact(fact1);
  const f2 = cleanFact(fact2);
  const f3 = cleanFact(fact3);

  const trimDot = (s) => String(s || '').replace(/\.$/, '').trim();

  const s1 = `Looking for ${p}? Palm Beach Vitality makes it easy to find a research listing that feels premium, clear, and ready for your next project.`;
  const s2 = f1
    ? `${trimDot(f1)} — a confident pick when you want material that fits real laboratory workflows.`
    : `${p} is a standout option for research teams who care about clarity, consistency, and quality.`;
  const lowerStart = (s) => {
    const t = trimDot(s);
    return t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
  };

  const s3 = f2
    ? `Here’s why teams keep coming back: ${lowerStart(f2)}.`
    : `It’s an upbeat, no-drama choice when you want research-grade supply without the guesswork.`;
  const s4 = `Ready to check it out? Explore ${p} and shop the full listing at www.palmbeach-vitality.store.`;
  const s5 =
    'For laboratory research use only. Not for human use or consumption.';
  // Fixed closer on every caption
  const s6 = 'For a 10% discount code drop Peptides in the comments!';

  const paragraph = [s1, s2, s3, s4, s5, s6].join(' ');
  const tags = fiveHashtags(p).join(' ');
  return `${paragraph}\n\n${tags}`;
}

const urlInput = firstJson('video_url_input');
const text = firstJson('pick_text');
const input = $input.first()?.json || {};

// Prefer explicit catbox field, then public_video_url (must be catbox / public CDN)
const public_video_url = assertCreatomateFetchable(
  String(
    urlInput.catbox_video_url ||
      urlInput.public_video_url ||
      urlInput.video_url ||
      input.catbox_video_url ||
      input.public_video_url ||
      ''
  ).trim(),
  'public_video_url'
);

if (!/^https?:\/\//i.test(public_video_url)) {
  throw new Error(
    'Paste the CATBOX .mp4 URL into video_url_input → public_video_url ' +
      '(https://files.catbox.moe/….mp4). Do not use vidgen.x.ai.'
  );
}

if (!/\.mp4(\?|$)/i.test(public_video_url) && !/catbox\.moe/i.test(public_video_url)) {
  if (!/\.mp4(\?|$)/i.test(public_video_url)) {
    throw new Error(
      'public_video_url should be a direct .mp4 link (catbox: https://files.catbox.moe/….mp4).'
    );
  }
}

if (!text.text_id || !text.mod_fact_1) {
  throw new Error(
    'pick_text missing. Keep get_reel_text → pick_text → sheets_update_text before this node.'
  );
}

// Sheet-canonical name from pick_text (exact product_name, e.g. CJC).
const product_name = String(
  text.product_name || urlInput.product_name || urlInput.compound_name || ''
).trim();

if (!product_name) {
  throw new Error('Enter product_name on video_url_input (shown as Intro-Text).');
}

// On-screen Intro + captions use canonical sheet product name
const mod_intro = product_name;

// end_hold still — must be a real https image URL (catbox). Never the element name "end_hold".
function pickStillUrl(...candidates) {
  for (const c of candidates) {
    const u = String(c || '').trim();
    if (!u) continue;
    if (/^end_hold$/i.test(u)) continue;
    if (!/^https?:\/\//i.test(u)) continue;
    return assertCreatomateFetchable(u, 'still_url / end_hold');
  }
  return '';
}

const end_hold_url = pickStillUrl(
  urlInput.still_url,
  urlInput.hold_image_url,
  urlInput.catbox_still_url,
  urlInput.end_hold,
  input.still_url,
  input.end_hold_url
);

const end_text_link = 'www.palmbeach-vitality.store';

const mod_fact_1 = cleanFact(text.mod_fact_1);
const mod_fact_2 = cleanFact(text.mod_fact_2);
const mod_fact_3 = cleanFact(text.mod_fact_3);
const mod_fact_4 = cleanFact(text.mod_fact_4);
const mod_fact_5 = cleanFact(text.mod_fact_5);
const mod_disclaimer =
  cleanFact(text.mod_disclaimer) ||
  'For laboratory research use only. Not for human use or consumption.';

const buffer_caption = buildBufferCaption(
  product_name,
  mod_fact_1,
  mod_fact_2,
  mod_fact_3
);
// Same caption for IG / FB / TikTok — separate draft keys for Sheets/Buffer clarity
const ig_caption_draft = buffer_caption;
const fb_caption_draft = buffer_caption;
const tiktok_caption_draft = buffer_caption;

return [
  {
    json: {
      ...input,
      ...urlInput,
      ...text,
      grok_video_url: public_video_url,
      public_video_url,
      catbox_video_url: public_video_url,
      end_hold_url,
      end_hold: end_hold_url || undefined,
      end_text_link,
      product_name,
      mod_intro,
      mod_fact_1,
      mod_fact_2,
      mod_fact_3,
      mod_fact_4,
      mod_fact_5,
      mod_disclaimer,
      buffer_caption,
      ig_caption_draft,
      fb_caption_draft,
      tiktok_caption_draft,
      text_id: text.text_id,
      creation_id: String(urlInput.creation_id || '').trim(),
      template_id: 'c5d54774-b029-4786-af04-d5af345dc7f2',
      mute_audio: true,
    },
  },
];
