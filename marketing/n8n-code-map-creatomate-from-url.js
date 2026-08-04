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
  return String(text || '')
    .replace(/\s*[·•|-]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .replace(/\s*\((ref|motif|card|line|cta)\s*\d+\)\s*$/i, '')
    .trim();
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
  // Soft warn via throw only for known-bad hosts; allow other public CDNs with .mp4
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

const product_name = String(
  urlInput.product_name || text.product_name || urlInput.compound_name || ''
).trim();

if (!product_name) {
  throw new Error('Enter product_name on video_url_input (shown as Intro-Text).');
}

// On-screen Intro = product name only (not catalog blurbs)
const mod_intro = product_name;

// end_hold still — public HTTPS (catbox image OK); reject xAI hosts
const end_hold_url = assertCreatomateFetchable(
  String(
    urlInput.still_url ||
      urlInput.hold_image_url ||
      urlInput.end_hold ||
      urlInput.catbox_still_url ||
      input.still_url ||
      ''
  ).trim(),
  'still_url / end_hold'
);

const end_text_link = 'www.palmbeach-vitality.store';

return [
  {
    json: {
      ...input,
      ...urlInput,
      ...text,
      // Keep grok_video_url alias empty of xAI — creatomate uses catbox only
      grok_video_url: public_video_url,
      public_video_url,
      catbox_video_url: public_video_url,
      end_hold_url,
      end_text_link,
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
      template_id: 'c5d54774-b029-4786-af04-d5af345dc7f2',
      mute_audio: true,
    },
  },
];
