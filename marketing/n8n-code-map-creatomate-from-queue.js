// n8n Code node: map_creatomate_from_queue
// Type: Code | Mode: Run Once for All Items
// Workflow: PBVita — Creatomate Package (SEPARATE from Grok daily)
// After: pick_queue_row (+ pick_text)
// Before: creatomate_render
//
// Reads public_video_url from the queue Sheet (you paste the catbox/R2 .mp4).
// Element name: main_video. Audio muted — add music manually later.

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
  'CJC',
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

const queue = firstJson('pick_queue_row');
const text = firstJson('pick_text');
const input = $input.first()?.json || {};

const public_video_url = String(
  queue.public_video_url || input.public_video_url || ''
).trim();

if (!/^https?:\/\//i.test(public_video_url)) {
  throw new Error(
    'public_video_url missing on queue row. Paste a direct .mp4 URL (catbox/R2/B2) into Sheet 11-creatomate-render-queue.'
  );
}
if (/vidgen\.x\.ai/i.test(public_video_url)) {
  throw new Error(
    'vidgen.x.ai URLs usually fail in Creatomate. Rehost to catbox/R2/B2 first, then paste that URL.'
  );
}
if (/drive\.google\.com\/file\/d\//i.test(public_video_url)) {
  throw new Error('Use a direct .mp4 host, not a Google Drive /view page.');
}

if (!text.text_id || !text.mod_fact_1) {
  throw new Error('pick_text missing. Run get_reel_text → pick_text first.');
}

let mod_intro = String(queue.compound_name || input.compound_name || '').trim();
if (!mod_intro || isJunk(mod_intro)) {
  const rank = Number(queue.rank || text.text_rank || 1) || 1;
  mod_intro = CATALOG[(rank - 1) % CATALOG.length];
}

const { mod_intro: _ignore, ...textRest } = text;

return [
  {
    json: {
      ...input,
      ...queue,
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
      queue_id: queue.queue_id || '',
      creation_id: queue.creation_id || '',
      template_id: 'c5d54774-b029-4786-af04-d5af345dc7f2',
      // No music — mute source; you add music manually later
      mute_audio: true,
    },
  },
];
