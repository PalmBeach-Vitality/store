// n8n Code node: overlay_landscape_vial_look
// Workflow: overlay_landscape_vial_look (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_vial_look
//
// Writes the EXACT GHK-Cu reference vial (clear glass, bright blue flip-cap,
// silver crimp, white label, maroon DNA + name + dosage bar) onto
// 500_Peptide_Wellness_Reel_Scenes vial_10ml AND set_environment rows.
// set_environment stills were inventing crimp-only vials (no blue flip-cap).
// Catalog mg / mg/ml per compound — GHK-Cu is 50mg / 5mg/ml (never 10mg/ml).
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
// Does NOT touch pen_3ml rows.

var TEXT_KEYS = [
  'scene_brief',
  'video_prompt',
  'video_motion_prompt',
  'material_detail',
  'hero_style',
  'surface',
  'still_edit_prompt',
];

var CATALOG = {
  SEMAX: { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'BPC-157': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'BPC-157/TB-500': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'AOD-9604': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'TB-500': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'SS-31': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'TA-1': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  Selank: { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'Melanotan 2': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  'CJC (no DAC)/Ipamorelin': { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  GLOW: { mg: '10mg', conc: '1mg/ml', vol: '10ml' },
  KLOW: { mg: '80mg', conc: '1mg/ml', vol: '10ml' },
  'GHK-Cu': { mg: '50mg', conc: '5mg/ml', vol: '10ml' },
  'PT-141': { mg: '20mg', conc: '2mg/ml', vol: '10ml' },
  Sermorelin: { mg: '20mg', conc: '2mg/ml', vol: '10ml' },
  Tesamorelin: { mg: '30mg', conc: '3mg/ml', vol: '10ml' },
  CJC: { mg: '100mg', conc: '10mg/ml', vol: '10ml' },
  'NAD+': { mg: '500mg', conc: '50mg/ml', vol: '10ml' },
  Semaglutide: { mg: '25mg', conc: '2.5mg/ml', vol: '10ml' },
  Tirzepatide: { mg: '100mg', conc: '10mg/ml', vol: '10ml' },
  Retatrutide: { mg: '60mg', conc: '6mg/ml', vol: '10ml' },
  Cagrilinitide: { mg: '25mg', conc: '5mg/ml', vol: '5ml' },
  'MOTS-C': { mg: '25mg', conc: '5mg/ml', vol: '5ml' },
};

var ALIASES = {
  'CJC (no DAC)': 'CJC (no DAC)/Ipamorelin',
  'BPC-157 / TB-500': 'BPC-157/TB-500',
  'BPC-157 / TB-500 / GHK-Cu': 'GLOW',
  'KPV / BPC-157 / TB-500 / GHK-Cu': 'KLOW',
  'Thymosin Alpha-1': 'TA-1',
  TA1: 'TA-1',
  'Thymosin A1': 'TA-1',
};

var OLD_VIAL_PHRASES = [
  '10mL sterile injectable-style glass vial with rubber stopper and aluminum crimp seal (NOT screw-cap, NOT black twist cap)',
  '10ml sterile injectable-style glass vial with rubber stopper and aluminum crimp seal (NOT screw-cap, NOT black twist cap)',
  '10mL sterile injectable-style clear glass vial, rubber stopper + aluminum crimp only',
  '10ml sterile injectable-style clear glass vial, rubber stopper + aluminum crimp only',
  'frosted glass bottle of cellular support',
  'frosted glass bottle',
];

var PEN_ONLY = {
  '5-Amino-1MQ': 1,
  DSIP: 1,
  KPV: 1,
  'Tesamorelin/Ipamorelin': 1,
};

var GENERIC_BARS = [
  'a solid dark maroon dosage bar with white mg strength, black mg/ml concentration text',
  'a solid dark maroon horizontal bar with white dosage strength; black concentration line (mg/ml) under the bar',
  'a solid dark maroon horizontal bar with white dosage strength, black concentration line (mg/ml) under the bar',
];

function requireId(row) {
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_landscape_vial_look: missing creation_id');
  return id;
}

function swapAll(t, oldP, newP) {
  t = String(t || '');
  if (!oldP || oldP === newP) return t;
  return t.split(oldP).join(newP);
}

function stripLock(t, marker, endMark) {
  t = String(t || '');
  var i = t.indexOf(marker);
  if (i < 0) return t.trim();
  var j = t.indexOf(endMark, i);
  if (j < 0) return t.slice(0, i).trim();
  return (t.slice(0, i) + t.slice(j + endMark.length)).trim();
}

function liquidLine(name) {
  if (name === 'GLOW') {
    return 'filled with bright GLOW-blue liquid (the only blue liquid — every other compound is clear)';
  }
  return 'filled with clear colorless liquid';
}

function catalogSpec(name) {
  if (CATALOG[name]) return { labelName: name, spec: CATALOG[name], catalogKey: name };
  var aliased = ALIASES[name];
  if (aliased && CATALOG[aliased]) {
    return { labelName: name, spec: CATALOG[aliased], catalogKey: aliased };
  }
  return null;
}

function replaceBetween(t, startMark, endMark, replacement) {
  t = String(t || '');
  var start = t.indexOf(startMark);
  if (start < 0) return t;
  var end = t.indexOf(endMark, start);
  if (end < 0) return t.slice(0, start) + replacement;
  return t.slice(0, start) + replacement + t.slice(end);
}

function doseBar(spec) {
  return (
    "a solid dark maroon horizontal dosage bar with white text exactly '" +
    spec.mg +
    "', black concentration line exactly '" +
    spec.conc +
    "'"
  );
}

function vialNoun(name, spec, catalogKey) {
  return (
    'clear pharmaceutical-grade glass multi-use injection vial of ' +
    name +
    ', ' +
    liquidLine(catalogKey || name) +
    ', sealed with a vibrant blue plastic flip-off cap on a brushed-silver aluminum crimp over a rubber septum, clean white wrap-around label with a dark maroon DNA double-helix centered at the top, the name ' +
    name +
    ' in large bold dark maroon sans-serif printed once, ' +
    doseBar(spec) +
    ", small black footer exactly '" +
    spec.vol +
    " Sterile Multi-Use Vial', standing upright on a reflective clear glass or acrylic shelf"
  );
}

function vialSpec(name, spec, catalogKey) {
  return (
    'VIAL SPEC: Copy the GHK-Cu catalog-vial still exactly — same hardware, same label layout — only swap the compound name and the catalog milligrams. ' +
    'HARDWARE: clear glass 10ml-style injection vial (not amber, not plastic, not a pen). Vibrant BLUE plastic flip-off cap sitting on a brushed-silver aluminum crimp + gray rubber septum. Show the blue cap + silver crimp stack. ' +
    'LIQUID: ' +
    liquidLine(catalogKey || name) +
    '. ' +
    'LABEL: clean white wrap-around. Top center: dark maroon DNA double-helix icon. Then large bold dark maroon ' +
    name +
    " printed once. Then a solid dark maroon bar with white '" +
    spec.mg +
    "'. Directly under the bar: black '" +
    spec.conc +
    "'. Footer: small black '" +
    spec.vol +
    " Sterile Multi-Use Vial'. " +
    "GHK-Cu catalog is 50mg / 5mg/ml — never print 10mg/ml on GHK-Cu. " +
    'FORBIDDEN: gold caps, missing blue flip-cap, bare crimp, twist/screw caps, amber glass, blank pharmacy vial, second vial, a pen in the same frame, invented concentrations. ' +
    'Stage the single vial upright on a reflective clear glass or acrylic shelf. Keep the scene environment. '
  );
}

function hardLock(name, spec) {
  return (
    "HARD OUTPUT LOCK (READ FIRST): Any vial in this image MUST copy the GHK-Cu catalog still — clear glass, vibrant blue plastic flip-off cap on brushed-silver crimp, white wrap-around label, dark maroon DNA helix at top, dark maroon '" +
    name +
    "', maroon bar white '" +
    spec.mg +
    "', black '" +
    spec.conc +
    "', footer '" +
    spec.vol +
    " Sterile Multi-Use Vial'. Never a crimp-only vial without the blue flip-cap. Never a twist cap. Never amber glass. Never 10mg/ml on GHK-Cu. "
  );
}

function lookLock(name, spec, catalogKey) {
  return (
    'VIAL LOOK LOCK (overrides COUNT FIX restyle for the vial, including glass, cap, crimp, and label): ' +
    'REPLACE the hero with this exact Palm Beach Vitality catalog vial, copied from the GHK-Cu reference still. ' +
    'Clear glass. Vibrant blue flip-off cap on brushed-silver crimp. White label. Dark maroon DNA helix at top. Dark maroon ' +
    name +
    ". Maroon bar white '" +
    spec.mg +
    "'. Black '" +
    spec.conc +
    "'. Black footer '" +
    spec.vol +
    " Sterile Multi-Use Vial'. " +
    liquidLine(catalogKey || name) +
    '. Upright on a reflective clear glass or acrylic shelf. ' +
    'If the still shows 10mg/ml on GHK-Cu, change it to 5mg/ml. If the cap is not bright blue, make it bright blue. If the glass is amber, make it clear. ' +
    'Do not restyle lighting, camera, or environment. Do restyle the vial and label to this lock.'
  );
}

function applyDoseBar(t, spec) {
  var phrase = doseBar(spec);
  for (var i = 0; i < GENERIC_BARS.length; i++) {
    t = swapAll(t, GENERIC_BARS[i], phrase);
  }
  var exactStart = 'a solid dark maroon dosage bar with white text exactly ';
  var concMark = "black concentration line exactly '";
  var start = 0;
  while (true) {
    var idx = t.indexOf(exactStart, start);
    if (idx < 0) {
      idx = t.indexOf('a solid dark maroon horizontal dosage bar with white text exactly ', start);
    }
    if (idx < 0) break;
    var cut = t.indexOf(concMark, idx);
    if (cut < 0) break;
    var qOpen = cut + concMark.length;
    var qClose = t.indexOf("'", qOpen);
    if (qClose < 0) break;
    t = t.slice(0, idx) + phrase + t.slice(qClose + 1);
    start = idx + phrase.length;
  }
  t = swapAll(t, '10ml Sterile Multi-Use Vial', spec.vol + ' Sterile Multi-Use Vial');
  t = swapAll(t, '10mL Sterile Multi-Use Vial', spec.vol + ' Sterile Multi-Use Vial');
  t = swapAll(t, '5ml Sterile Multi-Use Vial', spec.vol + ' Sterile Multi-Use Vial');
  t = swapAll(t, '5mL Sterile Multi-Use Vial', spec.vol + ' Sterile Multi-Use Vial');
  return t;
}

function paintVial(t, name, spec, noun, catalogKey) {
  t = String(t || '');
  t = stripLock(t, 'HARD OUTPUT LOCK (READ FIRST):', 'Never 10mg/ml on GHK-Cu. ');
  t = applyDoseBar(t, spec);
  for (var p = 0; p < OLD_VIAL_PHRASES.length; p++) {
    t = swapAll(t, OLD_VIAL_PHRASES[p], noun);
  }
  t = swapAll(
    t,
    '10mL sterile crimp-seal vial of ' + name + ' mid-ground; never black twist/screw cap; not extreme macro',
    noun + ' mid-ground; not extreme macro'
  );
  t = swapAll(
    t,
    '10ml sterile crimp-seal vial of ' + name + ' mid-ground; never black twist/screw cap; not extreme macro',
    noun + ' mid-ground; not extreme macro'
  );
  t = replaceBetween(t, 'VIAL SPEC:', 'SIGNAGE RULE:', vialSpec(name, spec, catalogKey));
  t = replaceBetween(t, 'Hero style:', ' Lighting:', 'Hero style: ' + noun + '.');
  t = replaceBetween(t, 'Hero style:', 'Lighting:', 'Hero style: ' + noun + '. ');
  t = swapAll(
    t,
    'Do not restyle lighting, camera, label text, or environment.',
    'Do not restyle lighting, camera, or environment (vial packaging and label ARE restyled by VIAL LOOK LOCK).'
  );
  if (t.indexOf('VIAL SPEC:') < 0) {
    t = vialSpec(name, spec, catalogKey) + t;
  }
  t = hardLock(name, spec) + t;
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  return t.trim();
}

var items = $input.all();
var out = [];
var skippedPen = 0;
var skippedOther = 0;
var unknown = {};

for (var i = 0; i < items.length; i++) {
  var row = items[i].json || {};
  var cat = String(row.category || '').trim();
  if (cat === 'pen_3ml') {
    skippedPen += 1;
    continue;
  }
  if (cat !== 'vial_10ml' && cat !== 'set_environment') {
    skippedOther += 1;
    continue;
  }
  var name = String(row.compound_name || '').trim();
  if (!name) {
    skippedOther += 1;
    continue;
  }
  if (PEN_ONLY[name]) {
    skippedOther += 1;
    continue;
  }
  var mapped = catalogSpec(name);
  if (!mapped) {
    unknown[name] = (unknown[name] || 0) + 1;
    continue;
  }
  var spec = mapped.spec;
  var labelName = mapped.labelName;
  var catalogKey = mapped.catalogKey;
  var noun = vialNoun(labelName, spec, catalogKey);
  var stillEdit = String(row.still_edit_prompt || '').trim();
  stillEdit = stripLock(stillEdit, 'VIAL LOOK LOCK', 'Do restyle the vial and label to this lock.');
  stillEdit = paintVial(stillEdit, labelName, spec, noun, catalogKey);
  stillEdit = swapAll(
    stillEdit,
    'Keep exactly ONE sealed Palm Beach Vitality hero product (one vial OR one pen).',
    'If a vial appears it must be the exact catalog vial in VIAL LOOK LOCK (blue flip-cap, maroon DNA, maroon name, maroon bar). Do not invent a crimp-only or unlabeled vial. Keep at most ONE product.'
  );
  stillEdit = (stillEdit ? stillEdit + ' ' : '') + lookLock(labelName, spec, catalogKey);

  var hero =
    cat === 'set_environment'
      ? 'environment-led landscape; if any vial appears it is exactly one ' +
        noun +
        '; no injection act, no people, no second vial, no pen in frame'
      : 'exactly one ' +
        noun +
        '; no injection act, no people, no second vial, no pen in frame';

  var json = {
    creation_id: requireId(row),
    material_detail: noun,
    hero_style: hero,
    scene_brief: paintVial(row.scene_brief, labelName, spec, noun, catalogKey),
    video_prompt: paintVial(row.video_prompt, labelName, spec, noun, catalogKey),
    video_motion_prompt: paintVial(row.video_motion_prompt, labelName, spec, noun, catalogKey),
    surface: applyDoseBar(String(row.surface || ''), spec),
    still_edit_prompt: stillEdit,
  };
  out.push({ json: json });
}

var unknownKeys = Object.keys(unknown);
if (unknownKeys.length) {
  throw new Error('overlay_landscape_vial_look: unknown compounds ' + JSON.stringify(unknown));
}
if (!out.length) {
  throw new Error('overlay_landscape_vial_look: no vial_10ml or set_environment rows in input');
}

console.log(
  JSON.stringify({
    overlay_landscape_vial_look_report: {
      patched: out.length,
      skipped_pen_3ml: skippedPen,
      skipped_other: skippedOther,
      total_in: items.length,
    },
  })
);

return out;
