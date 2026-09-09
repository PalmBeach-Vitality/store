// n8n Code node: overlay_landscape_pen_colors
// Workflow: overlay_landscape_pen_design (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_pen_colors
//
// Writes the EXACT insulin-style pen (reference still) onto
// 500_Peptide_Wellness_Reel_Scenes pen_3ml rows only.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
//
// Peptide pens: white body, RED compound name, RED translucent bottom clicker.
// Metabolic pens: white body, BLUE compound name, BLUE translucent bottom clicker.
// DNA logo is bright blue on every pen. Line 2 is black. Dial stays white.
// Barrel is a LONGER full-length insulin-style injector (not stubby).
// Orange is the wrong color — never use orange on name or clicker.
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

function paintNouns(t, noun, clicker) {
  t = String(t || '');
  t = swapAll(t, 'matte-white peptide pen with red on-pen text', noun);
  t = swapAll(t, 'matte-white metabolic pen with blue on-pen text', noun);
  t = swapAll(t, 'matte-black peptide pen', noun);
  t = swapAll(t, 'matte-white research dosage pen', 'glossy white insulin-style injector pen');
  t = swapAll(t, 'Keep the same elongated pen shape.', '');
  t = swapAll(t, 'same elongated shape', 'longer full-length insulin-style injector');
  t = swapAll(t, 'elongated 3mL pen shape and design', 'longer full-length insulin-style 3mL injector');
  t = swapAll(t, 'elongated 3mL research pen', 'longer insulin-style 3mL injector pen');
  t = swapAll(t, 'white clicker button', clicker);
  t = swapAll(t, 'WHITE clicker button', clicker);
  t = swapAll(t, 'glossy WHITE clicker BUTTON', clicker);
  t = swapAll(t, 'orange clicker button only', clicker);
  t = swapAll(t, 'translucent orange clicker button only', clicker);
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
  var noun =
    'longer glossy-white insulin-style ' + family + ' pen with ' + ink + ' compound-name and ' + ink + ' bottom clicker';
  var clicker = 'translucent ' + inkAdj + ' bottom clicker';

  var spec =
    'PEN SPEC: Exact Palm Beach Vitality 3mL insulin-style injector (Ozempic/Wegovy silhouette) with a LONGER full-length barrel. ' +
    'Stretch the white body 10-20 percent longer than a stubby travel pen — adult full-length injector, not compact, not short. Keep the diameter. ' +
    'Smooth GLOSSY white plastic barrel — not black, not gray, not metal, not a glass vial, not a skinny research cartridge. ' +
    'LEFT: rounded glossy white cap with an integrated white pocket clip like a ballpoint; cap ON covering the tip; never a needle. ' +
    'MID: recessed band with two small vertical rectangular notches. ' +
    'RIGHT: glossy WHITE cylindrical dose dial with raised vertical grip ridges. Dial stays white. ' +
    'BOTTOM / FAR RIGHT plunger: translucent ' +
    inkAdj +
    ' clicker BUTTON — same color as the compound name. Peptide = red bottom. Metabolic = blue bottom. Not orange. Not white. Not amber. ' +
    'LABEL: bright-blue vertical DNA double-helix at far left; then ' +
    name +
    ' in large bold ' +
    inkAdj +
    ' sans-serif; then smaller thinner black ' +
    line2 +
    '. DNA logo stays blue. Compound name is ' +
    inkAdj +
    ' only — not orange, not gold, not black. Line 2 is black. ' +
    'Orange is the wrong color. FORBIDDEN: orange name, orange clicker, orange dial, orange badge, gold text, black barrel, missing clip, uncapped needle, stubby short pen. ' +
    'No injection act, no people, no needles in use. ';

  var hero =
    'exactly one LONGER glossy white insulin-style 3mL injector pen of ' +
    name +
    ' with blue DNA helix, ' +
    inkAdj +
    ' compound name, black ' +
    line2 +
    ' line, white ridged dial, translucent ' +
    inkAdj +
    ' bottom clicker, mid-ground in environment; no injection act, no people, no needle use';

  var material =
    'longer 3mL insulin-style injector — glossy white body stretched full-length, white clip-cap ON, white ridged dose dial, translucent ' +
    inkAdj +
    ' bottom clicker; bright-blue DNA helix; ' +
    inkAdj +
    ' ' +
    name +
    '; black ' +
    line2;

  var designLock =
    'PEN DESIGN LOCK (overrides COUNT FIX restyle for the pen, including shape and label): ' +
    'REPLACE the hero with this exact injector. Make the barrel LONGER — full-length adult insulin pen, 10-20 percent longer than a stubby travel pen, same diameter. ' +
    'Do not keep a short compact pen. Do not keep a black, gray, or metal barrel — the plastic is GLOSSY white. ' +
    'Hardware: rounded white cap + white clip ON; recessed mid with two small vertical notches; WHITE ridged dose dial; translucent ' +
    inkAdj +
    ' bottom clicker (same color as the name — red peptide / blue metabolic). ' +
    'Label: bright-blue vertical DNA double-helix at left; large bold ' +
    inkAdj +
    ' ' +
    name +
    '; smaller thinner black ' +
    line2 +
    '. Peptide names and bottoms are red. Metabolic names and bottoms are blue. ' +
    'Orange is the wrong color. FORBIDDEN: orange name, orange clicker, orange dial, orange badge, white clicker, gold text, black barrel, missing clip, uncapped needle, glass vial, stubby pen. ' +
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
    s = paintNouns(s, noun, clicker);
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
      video_motion_prompt: paintNouns(row.video_motion_prompt, noun, clicker),
      surface: paintNouns(row.surface, noun, clicker),
      still_edit_prompt: stillEdit,
    },
  });
}

if (!out.length) {
  throw new Error('overlay_landscape_pen_colors: no pen_3ml rows in input');
}

return out;
