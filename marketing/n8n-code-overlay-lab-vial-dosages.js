// n8n Code node: overlay_lab_vial_dosages
// Workflow: overlay_lab_vial_dosages (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_vial_dosages
//
// Writes catalog mg + mg/ml onto Sheet 9 vial label prompts.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
// Map: marketing/compound-vial-labels.json

var TEXT_KEYS = ['lab_item', 'video_prompt', 'material_detail', 'scene_brief', 'still_edit_prompt'];

var GENERICS = [
  'a solid dark maroon dosage bar with white mg strength, black mg/ml concentration text',
  'a solid dark maroon horizontal bar with white dosage strength; black concentration line (mg/ml) under the bar',
  'a solid dark maroon horizontal bar with white dosage strength, black concentration line (mg/ml) under the bar',
];

var EXACT_START = 'a solid dark maroon dosage bar with white text exactly ';
var CONC_MARK = "black concentration line exactly '";

var CATALOG = {
  SEMAX: { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'BPC-157': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'BPC-157/TB-500': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'AOD-9604': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'TB-500': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'SS-31': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'TA-1': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  Selank: { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'Melanotan 2': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  'CJC (no DAC)/Ipamorelin': { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  GLOW: { mg: '10mg', conc: '1 mg/ml', vol: '10ml' },
  KLOW: { mg: '80mg', conc: '1 mg/ml', vol: '10ml' },
  'GHK-Cu': { mg: '50mg', conc: '5 mg/ml', vol: '10ml' },
  'PT-141': { mg: '20mg', conc: '2 mg/ml', vol: '10ml' },
  Sermorelin: { mg: '20mg', conc: '2 mg/ml', vol: '10ml' },
  Tesamorelin: { mg: '30mg', conc: '3 mg/ml', vol: '10ml' },
  CJC: { mg: '100mg', conc: '10 mg/ml', vol: '10ml' },
  'NAD+': { mg: '500mg', conc: '50 mg/ml', vol: '10ml' },
  Semaglutide: { mg: '25mg', conc: '2.5 mg/ml', vol: '10ml' },
  Tirzepatide: { mg: '100mg', conc: '10 mg/ml', vol: '10ml' },
  Retatrutide: { mg: '60mg', conc: '6 mg/ml', vol: '10ml' },
  Cagrilinitide: { mg: '25mg', conc: '5 mg/ml', vol: '5ml' },
  'MOTS-C': { mg: '25mg', conc: '5 mg/ml', vol: '5ml' },
};

var PEN_ONLY = {
  '5-Amino-1MQ': 1,
  DSIP: 1,
  KPV: 1,
  'Tesamorelin/Ipamorelin': 1,
};

function dosePhrase(spec) {
  return (
    "a solid dark maroon dosage bar with white text exactly '" +
    spec.mg +
    "', black concentration line exactly '" +
    spec.conc +
    "'"
  );
}

function footerPhrase(spec) {
  return spec.vol + ' Sterile Multi-Use Vial';
}

function swapAll(t, oldP, newP) {
  t = String(t || '');
  if (!oldP || oldP === newP) return t;
  return t.split(oldP).join(newP);
}

function stripDoseLock(s) {
  s = String(s || '');
  var lock = 'VIAL DOSE LOCK:';
  var endMark = 'Do not restyle the scene.';
  var i = s.indexOf(lock);
  if (i < 0) return s.trim();
  var j = s.indexOf(endMark, i);
  if (j < 0) return s.slice(0, i).trim();
  return (s.slice(0, i) + s.slice(j + endMark.length)).trim();
}

function applyCatalogDose(s, spec) {
  var t = String(s || '');
  var phrase = dosePhrase(spec);
  for (var g = 0; g < GENERICS.length; g++) {
    t = swapAll(t, GENERICS[g], phrase);
  }
  var start = 0;
  while (true) {
    var idx = t.indexOf(EXACT_START, start);
    if (idx < 0) break;
    var cut = t.indexOf(CONC_MARK, idx);
    if (cut < 0) break;
    var qOpen = cut + CONC_MARK.length;
    var qClose = t.indexOf("'", qOpen);
    if (qClose < 0) break;
    t = t.slice(0, idx) + phrase + t.slice(qClose + 1);
    start = idx + phrase.length;
  }
  var footer = footerPhrase(spec);
  t = swapAll(t, '10ml Sterile Multi-Use Vial', footer);
  t = swapAll(t, '10mL Sterile Multi-Use Vial', footer);
  t = swapAll(t, '5ml Sterile Multi-Use Vial', footer);
  t = swapAll(t, '5mL Sterile Multi-Use Vial', footer);
  return t;
}

function applyNoInvented(s) {
  var t = String(s || '');
  var noDose =
    'a solid dark maroon dosage bar with NO mg number and NO mg/ml concentration ' +
    '(name + DNA + 10ml footer only — do not invent 2 mg/ml or 10mg)';
  for (var g = 0; g < GENERICS.length; g++) {
    t = swapAll(t, GENERICS[g], noDose);
  }
  return t;
}

function stillEditLock(spec, name) {
  return (
    'VIAL DOSE LOCK: On the ' +
    name +
    " vial label the maroon bar reads exactly '" +
    spec.mg +
    "' and the concentration line reads exactly '" +
    spec.conc +
    "'. Footer exactly '" +
    footerPhrase(spec) +
    "'. If the still shows 2 mg/ml or any other concentration, change it to " +
    spec.conc +
    '. Do not restyle the scene.'
  );
}

function stillEditLockPenOnly(name) {
  return (
    'VIAL DOSE LOCK: ' +
    name +
    ' has no 10 mL liquid SKU in the catalog. Do not invent a mg strength or mg/ml concentration on the maroon bar. Name + DNA helix + 10ml footer only. Do not restyle the scene.'
  );
}

function requireId(row) {
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_lab_vial_dosages: missing creation_id');
  return id;
}

var items = $input.all();
var out = [];
var patched = 0;
var skipped = 0;
var unknown = {};

for (var i = 0; i < items.length; i++) {
  var row = Object.assign({}, items[i].json);
  var compound = String(row.compound_name || '').trim();
  if (!compound) {
    skipped += 1;
    continue;
  }
  var penOnly = !!PEN_ONLY[compound];
  var spec = CATALOG[compound];
  if (!penOnly && !spec) {
    unknown[compound] = (unknown[compound] || 0) + 1;
    skipped += 1;
    continue;
  }
  var id = requireId(row);
  for (var k = 0; k < TEXT_KEYS.length; k++) {
    var key = TEXT_KEYS[k];
    if (row[key] == null) continue;
    var neu = String(row[key]);
    if (!neu.trim()) continue;
    if (spec) neu = applyCatalogDose(neu, spec);
    else neu = applyNoInvented(neu);
    if (key === 'still_edit_prompt') {
      neu = stripDoseLock(neu);
      var lock = spec ? stillEditLock(spec, compound) : stillEditLockPenOnly(compound);
      neu = lock + ' ' + neu;
    }
    row[key] = neu;
  }
  var json = { creation_id: id };
  for (k = 0; k < TEXT_KEYS.length; k++) {
    key = TEXT_KEYS[k];
    if (row[key] == null) continue;
    json[key] = row[key];
  }
  patched += 1;
  out.push({ json: json });
}

var unknownKeys = Object.keys(unknown);
if (unknownKeys.length) {
  throw new Error('overlay_lab_vial_dosages: unknown compounds ' + JSON.stringify(unknown));
}

console.log(
  JSON.stringify({ overlay_vial_dose_report: { patched: patched, skipped: skipped, total_in: items.length } })
);

if (!out.length) {
  throw new Error('overlay_lab_vial_dosages: no rows patched');
}

return out;
