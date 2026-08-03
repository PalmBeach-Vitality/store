// n8n Code node: map_creatomate_from_url
// Type: Code | Mode: Run Once for All Items
// Workflow: PBVita — Creatomate Package (SEPARATE)
// After: pick_text (+ video_url_input Set node)
// Before: creatomate_render
//
// Each run: paste the NEW Grok/vidgen .mp4 URL into Set node video_url_input.
// Sheets text rotation stays the same (pick_text + sheets_update_text).
// Element: main_video. Muted — add music manually later.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function cleanFact(text) {
  return String(text || '')
    .replace(/\s*[·•|-]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .replace(/\s*\((ref|motif|card|line|cta)\s*\d+\)\s*$/i, '')
    .trim();
}

const CATALOG = [
  '5-Amino-1MQ',
  'AOD-9604',
  'BPC-157',
  'BPC-157/TB-500',
  'Cagrilinitide',
  'CJC (no DAC)',
  'CJC (no DAC)/Ipamorelin',
  'DSIP',
  'GHK-Cu',
  'GLOW',
  'KLOW',
  'KPV',
  'Melanotan 2',
  'MOTS-C',
  'NAD+',
  'PT-141',
  'Retatrutide',
  'Selank',
  'Semaglutide',
  'SEMAX',
  'Sermorelin',
  'SS-31',
  'TA-1',
  'TB-500',
  'Tesamorelin',
  'Tesamorelin/Ipamorelin',
  'Tirzepatide',
];

function isJunk(s) {
  return /^(laboratory|documentation|catalog|indexed|container|research equipment|palm beach)/i.test(
    String(s || '').trim()
  );
}

const urlInput = firstJson('video_url_input');
const text = firstJson('pick_text');
const input = $input.first()?.json || {};

const public_video_url = String(
  urlInput.public_video_url ||
    urlInput.video_url ||
    urlInput.grok_video_url ||
    input.public_video_url ||
    ''
).trim();

if (!/^https?:\/\//i.test(public_video_url)) {
  throw new Error(
    'Paste the NEW Grok/vidgen .mp4 URL into Set node video_url_input → field public_video_url (or video_url), then re-run.'
  );
}

if (!text.text_id || !text.mod_fact_1) {
  throw new Error('pick_text missing. Keep get_reel_text → pick_text → sheets_update_text before this node.');
}

let mod_intro = String(urlInput.compound_name || input.compound_name || '').trim();
if (!mod_intro || isJunk(mod_intro)) {
  const rank = Number(text.text_rank || urlInput.rank || 1) || 1;
  mod_intro = CATALOG[(rank - 1) % CATALOG.length];
}

const { mod_intro: _ignore, ...textRest } = text;

return [
  {
    json: {
      ...input,
      ...urlInput,
      ...textRest,
      grok_video_url: public_video_url,
      public_video_url,
      mod_intro,
      mod_fact_1: cleanFact(text.mod_fact_1),
      mod_fact_2: cleanFact(text.mod_fact_2),
      mod_fact_3: cleanFact(text.mod_fact_3),
      mod_fact_4: cleanFact(text.mod_fact_4),
      mod_fact_5: cleanFact(text.mod_fact_5),
      mod_disclaimer:
        cleanFact(text.mod_disclaimer) ||
        'For laboratory research use only. Not for human use or consumption.',
      text_id: text.text_id,
      creation_id: String(urlInput.creation_id || '').trim(),
      template_id: '06cd4ffd-906c-45ed-bf33-e8d2bed4312b',
      mute_audio: true,
    },
  },
];
