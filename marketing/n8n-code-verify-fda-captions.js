// n8n Code node: verify_fda_captions
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// After: build_captions
// Before: prep_caption_email
//
// Throws if a caption would trip human-use / benefit / typo checks.
// Linear: fail = stop. Pass = email.
// Vial 1 may use the short "Explore research-grade NAME at URL" CTA.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

var BANNED = [
  'human use',
  'not for human',
  'for humans',
  'human consumption',
  'benefits of using',
  'benefit of',
  'you will',
  'you\'ll',
  'lose weight',
  'fat loss',
  'anti-aging results',
  'treats',
  'treat your',
  'cure',
  'heals',
  'healing you',
  'therapy',
  'patient',
  'clinical use',
  'fda approved',
  'inject',
  'injection',
  'syringe',
  'dose',
  'dosage',
  'mg/ml',
  'take daily',
  'recommended for',
  'supplement',
  'buy to use',
  'works for',
  'guaranteed',
];

var b = firstJson('build_captions');
var name = String(b.compound_name || '').trim();
var captions = [
  { key: 'vial_caption_1', text: String(b.vial_caption_1 || ''), form: 'vial' },
  { key: 'vial_caption_2', text: String(b.vial_caption_2 || ''), form: 'vial' },
  { key: 'pen_caption_1', text: String(b.pen_caption_1 || ''), form: 'pen' },
  { key: 'pen_caption_2', text: String(b.pen_caption_2 || ''), form: 'pen' },
];

var errors = [];
var wantFirst = '#' + name.replace(/\+/g, 'Plus').replace(/[^a-zA-Z0-9]+/g, '');

function hashtags(text) {
  var hashLines = String(text || '')
    .split('\n')
    .filter(function (ln) {
      return ln.indexOf('#') !== -1;
    });
  var last = hashLines[hashLines.length - 1] || '';
  return last.match(/#[A-Za-z0-9]+/g) || [];
}

captions.forEach(function (c) {
  if (!c.text) {
    errors.push(c.key + ' is empty');
    return;
  }
  var low = c.text.toLowerCase();
  if (c.text.indexOf(name) !== 0) {
    errors.push(c.key + ' must start with ' + name);
  }
  BANNED.forEach(function (w) {
    if (low.indexOf(w) !== -1) errors.push(c.key + ' flagged: "' + w + '"');
  });
  var tags = hashtags(c.text);
  if (tags.length !== 5) errors.push(c.key + ' needs exactly 5 hashtags, found ' + tags.length);
  if (tags[0] && tags[0].toLowerCase() !== wantFirst.toLowerCase()) {
    errors.push(c.key + ' first hashtag must be ' + wantFirst + ' (got ' + tags[0] + ')');
  }
  if (c.text.indexOf('www.palmbeach-vitality.store') === -1) {
    errors.push(c.key + ' missing store URL');
  }
  if (c.form === 'vial' && /3ml|\bresearch pen\b|\bpen catalog\b|\bpen listing\b/i.test(c.text)) {
    errors.push(c.key + ' vial copy must not read as a pen listing');
  }
  if (c.form === 'pen' && /10ml|\blaboratory vial\b|\bresearch vial\b/i.test(c.text)) {
    errors.push(c.key + ' pen copy must not read as a vial listing');
  }
  if (c.form === 'pen' && !/3ml|\bresearch pen\b|\bpen catalog\b/i.test(c.text)) {
    errors.push(c.key + ' must mention the 3ml research pen catalog');
  }
  if (c.key === 'vial_caption_2' && !/10ml|vial/i.test(c.text)) {
    errors.push(c.key + ' must mention the 10ml vial listing');
  }
});

if (String(b.vial_caption_1 || '') === String(b.pen_caption_1 || '')) {
  errors.push('vial_caption_1 and pen_caption_1 are identical');
}
if (String(b.vial_caption_2 || '') === String(b.pen_caption_2 || '')) {
  errors.push('vial_caption_2 and pen_caption_2 are identical');
}

if (errors.length) {
  throw new Error('Caption verify failed:\n- ' + errors.join('\n- '));
}

return [
  {
    json: {
      compound_name: name,
      compound_name_input: b.compound_name_input,
      match_distance: b.match_distance,
      compound_id: b.compound_id,
      store_url: b.store_url,
      hashtag_line: b.hashtag_line,
      vial_caption_1: b.vial_caption_1,
      vial_caption_2: b.vial_caption_2,
      pen_caption_1: b.pen_caption_1,
      pen_caption_2: b.pen_caption_2,
      verify_status: 'accepted',
      created_at: new Date().toISOString(),
      input_row_count: b.input_row_count,
    },
  },
];
