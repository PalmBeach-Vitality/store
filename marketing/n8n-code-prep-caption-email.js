// n8n Code node: prep_caption_email
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// After: verify_fda_captions
// Before: sheets_append_captions → gmail_send_captions

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

var v = firstJson('verify_fda_captions');
var name = String(v.compound_name || '').trim();
if (String(v.verify_status || '') !== 'accepted') {
  throw new Error('prep_caption_email: captions were not accepted.');
}

var body = [
  name + ' captions — verified (research language only)',
  '',
  'Resolved from: ' + String(v.compound_name_input || name),
  'Match distance: ' + String(v.match_distance),
  '',
  '—— VIAL 1 ——',
  v.vial_caption_1,
  '',
  '—— VIAL 2 ——',
  v.vial_caption_2,
  '',
  '—— PEN 1 ——',
  v.pen_caption_1,
  '',
  '—— PEN 2 ——',
  v.pen_caption_2,
  '',
  'Copy one block into IG. Logo / extra text / sound stay off the Grok clip.',
].join('\n');

return [
  {
    json: {
      compound_name: name,
      compound_id: v.compound_id,
      compound_name_input: v.compound_name_input,
      match_distance: v.match_distance,
      store_url: v.store_url,
      hashtag_line: v.hashtag_line,
      vial_caption_1: v.vial_caption_1,
      vial_caption_2: v.vial_caption_2,
      pen_caption_1: v.pen_caption_1,
      pen_caption_2: v.pen_caption_2,
      verify_status: v.verify_status,
      created_at: v.created_at,
      caption_run_id: 'CAP-' + name.replace(/[^a-zA-Z0-9]+/g, '') + '-' + Date.now(),
      email_to: 'salvatorejohnson1984@gmail.com',
      email_cc: 'sales@palmbeach-vitality.com',
      email_subject: 'PB Vitality captions — ' + name + ' (vial + pen)',
      email_body: body,
    },
  },
];
