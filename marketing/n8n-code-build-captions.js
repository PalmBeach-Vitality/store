// n8n Code node: build_captions
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// After: match_compound
// Before: verify_fda_captions
//
// 2 vial + 2 pen captions. Same science, different product-form language.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function toHashtag(name) {
  var raw = String(name || '')
    .replace(/\+/g, 'Plus')
    .replace(/[^a-zA-Z0-9]+/g, '');
  return raw ? '#' + raw : '#PeptideResearch';
}

var m = firstJson('match_compound');
var name = String(m.compound_name || '').trim();
if (!name) throw new Error('build_captions: compound_name missing from match_compound.');

var what = String(m.science_what || '').trim();
var focus = String(m.science_focus || '').trim();
var pathways = String(m.science_pathways || '').trim();
var url = String(m.store_url || 'www.palmbeach-vitality.store').trim();

var tags = [
  toHashtag(name),
  '#' + String(m.tag2 || 'PeptideResearch').replace(/^#/, ''),
  '#' + String(m.tag3 || 'CellularScience').replace(/^#/, ''),
  '#' + String(m.tag4 || 'PeptideScience').replace(/^#/, ''),
  '#' + String(m.tag5 || 'ResearchPeptides').replace(/^#/, ''),
].join(' ');

function pack(body, cta) {
  return (body + '\n' + cta + '\n' + tags).replace(/\s+\n/g, '\n').trim();
}

var vialCtaA = 'Explore research-grade ' + name + ' in the 10ml laboratory vial catalog at ' + url;
var vialCtaB = 'Browse the 10ml research vial listing for ' + name + ' at ' + url;
var penCtaA = 'Explore research-grade ' + name + ' in the 3ml research pen catalog at ' + url;
var penCtaB = 'Browse the 3ml research pen listing for ' + name + ' at ' + url;

var vial1 = pack(
  name + ' is ' + what + '. Research focuses on ' + focus + '.',
  vialCtaA
);
var vial2 = pack(
  name + ' is studied as ' + what + '. Laboratory work examines ' + pathways + '.',
  vialCtaB
);
var pen1 = pack(
  name + ' is ' + what + '. Research focuses on ' + focus + '.',
  penCtaA
);
var pen2 = pack(
  name + ' is studied as ' + what + '. Laboratory work examines ' + pathways + '.',
  penCtaB
);

return [
  {
    json: {
      compound_name: name,
      compound_name_input: m.compound_name_input,
      match_distance: m.match_distance,
      compound_id: m.compound_id,
      store_url: url,
      hashtag_line: tags,
      vial_caption_1: vial1,
      vial_caption_2: vial2,
      pen_caption_1: pen1,
      pen_caption_2: pen2,
      input_row_count: m.input_row_count,
    },
  },
];
