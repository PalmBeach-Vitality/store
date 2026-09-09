// n8n Code node: build_captions
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// After: match_compound
// Before: verify_fda_captions
//
// 2 vial + 2 pen captions. Same science family, different form language.
// Hashtags are Instagram-safe: letters/numbers only (AOD-9604 → #AOD9604).

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function toHashtag(name) {
  var raw = String(name || '')
    .replace(/^#/, '')
    .replace(/\+/g, 'Plus')
    .replace(/[^a-zA-Z0-9]+/g, '');
  return raw ? '#' + raw : '#PeptideResearch';
}

function cleanSentence(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
    .replace(/\.+$/, '');
}

var m = firstJson('match_compound');
var name = String(m.compound_name || '').trim();
if (!name) throw new Error('build_captions: compound_name missing from match_compound.');

var what = cleanSentence(m.science_what);
var focus = cleanSentence(m.science_focus);
var pathways = cleanSentence(m.science_pathways);
var vialUrl = String(m.vial_url || '').trim();
var penUrl = String(m.pen_url || '').trim();
var storeUrl = String(m.store_url || vialUrl || penUrl || '').trim();
if (!what || !focus || !pathways) {
  throw new Error('build_captions: Sheet 15 science_what / science_focus / science_pathways incomplete for ' + name);
}
if (!storeUrl) {
  throw new Error('SHEETS-ONLY/build_captions: store_url / vial_url / pen_url missing from match_compound.');
}

var tags = [
  toHashtag(name),
  toHashtag(m.tag2 || 'PeptideResearch'),
  toHashtag(m.tag3 || 'CellularScience'),
  toHashtag(m.tag4 || 'PeptideScience'),
  toHashtag(m.tag5 || 'ResearchPeptides'),
].join(' ');

function pack(body, cta) {
  return (body + '\n' + cta + '\n' + tags).replace(/\s+\n/g, '\n').trim();
}

var vial1 = pack(
  name + ' is ' + what + '. Research focuses on ' + focus + '.',
  'Explore research-grade ' + name + ' at ' + (vialUrl || storeUrl)
);
var vial2 = pack(
  name + ' is studied as ' + what + '. Laboratory work examines ' + pathways + '.',
  'Browse the research vial listing for ' + name + ' at ' + (vialUrl || storeUrl)
);
var pen1 = pack(
  name + ' is ' + what + '. Research maps ' + focus + '.',
  'Explore research-grade ' + name + ' in the pen catalog at ' + (penUrl || storeUrl)
);
var pen2 = pack(
  name + ' is cataloged as ' + what + '. Laboratory work examines ' + pathways + '.',
  'Browse the research pen listing for ' + name + ' at ' + (penUrl || storeUrl)
);

return [
  {
    json: {
      compound_name: name,
      compound_name_input: m.compound_name_input,
      match_distance: m.match_distance,
      compound_id: m.compound_id,
      store_url: storeUrl,
      vial_url: vialUrl,
      pen_url: penUrl,
      hashtag_line: tags,
      vial_caption_1: vial1,
      vial_caption_2: vial2,
      pen_caption_1: pen1,
      pen_caption_2: pen2,
      input_row_count: m.input_row_count,
    },
  },
];
