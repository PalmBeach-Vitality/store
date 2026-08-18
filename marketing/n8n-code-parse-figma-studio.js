// n8n Code node: "Parse_Grok"
// Workflow: PBVita — Figma Content Studio ONLY
// After: Grok (chat/completions)  |  Before: IF_Compliance
// Do not paste this into the Buffer daily workflow.

const DISCLAIMER =
  'For laboratory research use only. Not for human use or consumption. Not a drug, dietary supplement, or cosmetic. Not evaluated by the FDA.';

const NICKNAME_RE = /\b(KLOW|Wolverine|GLOW)\b/i;

const raw = $json.choices?.[0]?.message?.content ?? '';
let parsed;

try {
  parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
} catch (error) {
  return [{
    json: {
      compound_id: '',
      compound_name: '',
      figma_headline: '',
      figma_subhead: '',
      bullet_1: '',
      bullet_2: '',
      bullet_3: '',
      cta: '',
      ig_caption_draft: '',
      fb_caption_draft: '',
      compliance_ok: false,
      compliance_flags: `Invalid JSON from Grok: ${error.message}`,
      image_url: '',
      created_at: $now.toISO(),
      used_in_figma: 'no',
      grok_raw: raw,
    },
  }];
}

const ig = parsed?.platform_copy?.instagram?.caption || '';
const fb = parsed?.platform_copy?.facebook?.caption || '';
const tt = parsed?.platform_copy?.tiktok?.caption || '';
const headline = parsed?.creative_brief?.headline || '';
const subhead = parsed?.creative_brief?.subhead || '';
const bullets = parsed?.creative_brief?.bullets || [];
const cta = parsed?.creative_brief?.cta || 'View laboratory listing';
const display = parsed?.display_name || '';

const flags = [...(parsed?.compliance_check?.flags || [])];
if (!ig.includes(DISCLAIMER)) flags.push('IG missing mandatory disclaimer');
if (!fb.includes(DISCLAIMER)) flags.push('FB missing mandatory disclaimer');
// TikTok not written to Figma queue, but still flag if Grok omitted disclaimer
if (tt && !tt.includes(DISCLAIMER)) flags.push('TikTok missing mandatory disclaimer');

const textBlob = [display, headline, subhead, ...bullets, cta, ig, fb].join(' ');
if (NICKNAME_RE.test(textBlob)) {
  flags.push('Nickname detected (KLOW / Wolverine / GLOW) — use chemical names only');
}

const prior =
  $('Prep_Compound').item?.json ||
  $('Limit').item?.json ||
  $('Edit Fields').item?.json ||
  {};

const compliance_ok = (parsed?.compliance_check?.ok === true) && flags.length === 0;

return [{
  json: {
    compound_id: parsed.compound_id || prior.compound_id || '',
    compound_name: display || prior.compound_name || '',
    figma_headline: headline,
    figma_subhead: subhead,
    bullet_1: bullets[0] || '',
    bullet_2: bullets[1] || '',
    bullet_3: bullets[2] || '',
    cta,
    ig_caption_draft: ig,
    fb_caption_draft: fb,
    compliance_ok,
    compliance_flags: flags.join('; '),
    image_url: '',
    created_at: $now.toISO(),
    used_in_figma: 'no',
    // helpers for optional Grok_Imagine (not written to queue until Save_Image_URL)
    figma_template_type:
      parsed?.creative_brief?.figma_template_type ||
      prior.figma_template_type ||
      'Hero Spotlight',
    figma_visual_notes: parsed?.creative_brief?.visual_notes || '',
    product_form: prior.product_form || '',
    canonical_url: prior.canonical_url || '',
    grok_raw: raw,
  },
}];
