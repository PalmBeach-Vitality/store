// n8n Code node: build_captions
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// After: match_compound
// Before: verify_fda_captions
//
// 2 vial + 2 pen captions. Same science family, different form language.
// Vial 1 matches the short catalog format Salvatore approved.

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
var url = String(m.store_url || 'www.palmbeach-vitality.store').trim();
if (!what || !focus || !pathways) {
  throw new Error('build_captions: Sheet 15 science_what / science_focus / science_pathways incomplete for ' + name);
}

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

// Vial 1 = approved short CTA. Vial 2 names the 10ml vial listing.
// Pen copy stays in the same science family with different verbs + 3ml pen CTA.
var vial1 = pack(
  name + ' is ' + what + '. Research focuses on ' + focus + '.',
  'Explore research-grade ' + name + ' at ' + url
);
var vial2 = pack(
  name + ' is studied as ' + what + '. Laboratory work examines ' + pathways + '.',
  'Browse the 10ml research vial listing for ' + name + ' at ' + url
);
var pen1 = pack(
  name + ' is ' + what + '. Research maps ' + focus + '.',
  'Explore research-grade ' + name + ' in the 3ml pen catalog at ' + url
);
var pen2 = pack(
  name + ' is cataloged as ' + what + '. Laboratory work examines ' + pathways + '.',
  'Browse the 3ml research pen listing for ' + name + ' at ' + url
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
