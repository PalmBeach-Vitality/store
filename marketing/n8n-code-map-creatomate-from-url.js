// n8n Code node: map_creatomate_from_url
// Type: Code | Mode: Run Once for All Items
// Workflow: PBVita — Creatomate Package (SEPARATE)
// After: pick_text (+ video_url_input Set node)
// Before: creatomate_render
//
// Each run: paste NEW Grok/vidgen URL + product_name into video_url_input.
// pick_text filters facts 1–3 for that product (plain-English ad tone).
// Intro-Text = product_name. Facts 4–5 stay sheet disclaimer/CTA.
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
    'Paste the NEW Grok/vidgen .mp4 URL into Set node video_url_input → field public_video_url, then re-run.'
  );
}

if (!text.text_id || !text.mod_fact_1) {
  throw new Error(
    'pick_text missing. Keep get_reel_text → pick_text → sheets_update_text before this node.'
  );
}

const product_name = String(
  urlInput.product_name || text.product_name || urlInput.compound_name || ''
).trim();

if (!product_name) {
  throw new Error('Enter product_name on video_url_input (shown as Intro-Text).');
}

// On-screen Intro = product name only (not catalog blurbs)
const mod_intro = product_name;

return [
  {
    json: {
      ...input,
      ...urlInput,
      ...text,
      grok_video_url: public_video_url,
      public_video_url,
      product_name,
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
