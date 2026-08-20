// n8n Code node: overlay_landscape_pen_colors
// Workflow: overlay_landscape_pen_design (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_pen_colors
//
// Writes the EXACT insulin-style pen (reference still) onto
// 500_Peptide_Wellness_Reel_Scenes pen_3ml rows only.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
//
// Peptide pens: glossy white body, RED compound name.
// Metabolic pens: glossy white body, BLUE compound name.
// DNA logo is bright blue on every pen. Line 2 is black.
// Do not recolor scene blacks (void, lake, etc.).

var METABOLIC = {
  '5-Amino-1MQ': 1,
  'AOD-9604': 1,
  'Cagrilinitide': 1,
  'MOTS-C': 1,
  'NAD+': 1,
  'Retatrutide': 1,
  'Semaglutide': 1,
  'SS-31': 1,
  'Tesamorelin': 1,
  'Tesamorelin/Ipamorelin': 1,
  'Tirzepatide': 1,
};

function isMetabolic(name) {
  return !!METABOLIC[String(name || '').trim()];
}

function requireId(row) {
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_landscape_pen_colors: missing creation_id');
  return id;
}

function swapAll(t, oldP, newP) {
  t = String(t || '');
  if (!oldP) return t;
  while (t.indexOf(oldP) !== -1) t = t.split(oldP).join(newP);
  return t;
}

function stripLock(t, marker) {
  t = String(t || '');
  var i = t.indexOf(marker);
  if (i === -1) return t.trim();
  return t.slice(0, i).trim();
}

function replaceBetween(t, startMark, endMark, replacement) {
  t = String(t || '');
  var start = t.indexOf(startMark);
  if (start === -1) return t;
  var end = t.indexOf(endMark, start);
  if (end === -1) return t.slice(0, start) + replacement;
  return t.slice(0, start) + replacement + t.slice(end);
}

function paintNouns(t, noun) {
  t = String(t || '');
  t = swapAll(t, 'matte-white peptide pen with red on-pen text', noun);
  t = swapAll(t, 'matte-white metabolic pen with blue on-pen text', noun);
  t = swapAll(t, 'matte-black peptide pen', noun);
  t = swapAll(t, 'matte-white research dosage pen', 'glossy white insulin-style injector pen');
  t = swapAll(t, 'Keep the same elongated pen shape.', '');
  t = swapAll(t, 'same elongated shape', 'insulin-style injector silhouette');
  t = swapAll(t, 'elongated 3mL pen shape and design', 'insulin-style 3mL injector silhouette');
  t = swapAll(t, 'elongated 3mL research pen', 'insulin-style 3mL injector pen');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  t = swapAll(t, ' .', '.');
  return t.trim();
}

function lineTwo(name) {
  if (name === 'MOTS-C') return '20mg 3ml Pen';
  return '3ml Pen';
}

var items = $input.all();
var out = [];

for (var i = 0; i < items.length; i++) {
  var row = items[i].json || {};
  if (String(row.category || '').trim() !== 'pen_3ml') continue;

  var name = String(row.compound_name || '').trim();
  var metabolic = isMetabolic(name);
  var family = metabolic ? 'metabolic' : 'peptide';
  var ink = metabolic ? 'blue' : 'red';
  var inkAdj = metabolic ? 'bright blue' : 'bright red';
  var line2 = lineTwo(name);
  var noun = 'glossy-white insulin-style ' + family + ' pen with ' + ink + ' compound-name';

  var spec =
    'PEN SPEC: Exact Palm Beach Vitality 3mL insulin-style injector (Ozempic/Wegovy silhouette). ' +
    'Smooth GLOSSY white plastic barrel — not matte, not black, not gray, not metal, not a glass vial, not an elongated slim research cartridge. ' +
    'LEFT: rounded glossy white cap with an integrated white pocket clip like a ballpoint; cap ON covering the tip; never a needle. ' +
    'MID: recessed band with two small vertical rectangular notches. ' +
    'RIGHT: glossy WHITE cylindrical dose dial with raised vertical grip ridges — the dial is white, not orange. ' +
    'FAR RIGHT: translucent orange-tinted clicker BUTTON only. Orange exists ONLY on that button. ' +
    'LABEL: bright-blue vertical DNA double-helix at far left; then ' +
    name +
    ' in large bold ' +
    inkAdj +
    ' sans-serif; then smaller thinner black ' +
    line2 +
    '. DNA logo stays blue. Compound name is ' +
    inkAdj +
    ' only — not orange, not gold, not black. Line 2 is black. ' +
    'FORBIDDEN: orange dose dial, orange name, orange badge, gold text, black barrel, missing clip, uncapped needle. ' +
    'No injection act, no people, no needles in use. ';

  var hero =
    'exactly one glossy white insulin-style 3mL injector pen of ' +
    name +
    ' with blue DNA helix, ' +
    inkAdj +
    ' compound name, black ' +
    line2 +
    ' line, white ridged dial, orange clicker button only, mid-ground in environment; no injection act, no people, no needle use';

  var material =
    '3mL insulin-style injector — glossy white body, white clip-cap ON, white ridged dose dial, translucent orange clicker button only; bright-blue DNA helix; ' +
    inkAdj +
    ' ' +
    name +
    '; black ' +
    line2;

  var designLock =
    'PEN DESIGN LOCK (overrides COUNT FIX restyle for the pen, including shape and label): ' +
    'REPLACE the hero with this exact injector. Do not keep an elongated research pen. Do not keep a black, gray, metal, or matte barrel — the plastic is GLOSSY white. ' +
    'Hardware: rounded white cap + white clip ON; recessed mid with two small vertical notches; WHITE ridged dose dial; translucent ORANGE clicker button on the far right only. ' +
    'Label: bright-blue vertical DNA double-helix at left; large bold ' +
    inkAdj +
    ' ' +
    name +
    '; smaller thinner black ' +
    line2 +
    '. Peptide names are red. Metabolic names are blue. ' +
    'FORBIDDEN: orange dial, orange name, orange badge, gold text, black barrel, missing clip, uncapped needle, glass vial. ' +
    'Keep lighting, camera, and environment. Do not recolor scene blacks such as a void or lake.';

  var stillEdit = String(row.still_edit_prompt || '').trim();
  stillEdit = stripLock(stillEdit, 'PEN DESIGN LOCK');
  stillEdit = stripLock(stillEdit, 'PEN COLOR LOCK');
  stillEdit = swapAll(
    stillEdit,
    'Do not restyle lighting, camera, label text, or environment.',
    'Do not restyle lighting, camera, or environment (pen shape and label ARE restyled by PEN DESIGN LOCK).'
  );
  stillEdit = (stillEdit ? stillEdit + ' ' : '') + designLock;

  function withSpec(s) {
    s = paintNouns(s, noun);
    s = replaceBetween(s, 'PEN SPEC:', 'SIGNAGE RULE:', spec);
    s = replaceBetween(s, 'Hero style:', ' Lighting:', 'Hero style: ' + hero + '.');
    s = replaceBetween(s, 'Hero style:', 'Lighting:', 'Hero style: ' + hero + '. ');
    s = swapAll(s, '3mL research dosage pen of ' + name, 'glossy white insulin-style 3mL injector pen of ' + name);
    s = swapAll(s, '3mL pre-filled research dosage pen', '3mL insulin-style injector pen');
    s = swapAll(s, '3mL matte-white research dosage pen of ' + name + ' with ' + inkAdj + ' on-pen text', hero);
    while (s.indexOf('  ') !== -1) s = s.split('  ').join(' ');
    return s.trim();
  }

  out.push({
    json: {
      creation_id: requireId(row),
      material_detail: material,
      hero_style: hero,
      scene_brief: withSpec(row.scene_brief),
      video_prompt: withSpec(row.video_prompt),
      video_motion_prompt: paintNouns(row.video_motion_prompt, noun),
      surface: paintNouns(row.surface, noun),
      still_edit_prompt: stillEdit,
    },
  });
}

if (!out.length) {
  throw new Error('overlay_landscape_pen_colors: no pen_3ml rows in input');
}

return out;
