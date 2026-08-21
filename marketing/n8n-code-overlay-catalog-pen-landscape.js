// n8n Code node: overlay_catalog_pen_production_row_landscape
// Workflow: overlay_catalog_pen_production_row_landscape (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_catalog_pen
//
// pen_3ml rows only on 500_Peptide_Wellness_Reel_Scenes.
// Pulled-back production row of identical pens. Does NOT touch vial_10ml or set_environment.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
//
// PEPTIDE = crimson red text + logo. METABOLIC = cobalt blue text + logo.
// Metabolic only: Semaglutide, Tirzepatide, Retatrutide.

var BLUE_NAMES = { semaglutide: 1, tirzepatide: 1, retatrutide: 1 };
var BLUE_IDS = {
  'P-SEM-001': 1,
  'P-SEMA-001': 1,
  'P-TIR-001': 1,
  'P-TIRZ-001': 1,
  'P-RET-001': 1,
  'P-RETA-001': 1,
};

function isMetabolic(name, id) {
  var n = String(name || '').trim().toLowerCase();
  var i = String(id || '').trim().toUpperCase();
  return !!(BLUE_NAMES[n] || BLUE_IDS[i]);
}

function accentFor(name, id) {
  return isMetabolic(name, id) ? 'cobalt blue' : 'crimson red';
}

function familyFor(name, id) {
  return isMetabolic(name, id) ? 'metabolic' : 'peptide';
}

function capPrompt(text) {
  var t = String(text || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  t = t.trim();
  if (t.length > 7900) t = t.slice(0, 7900);
  return t;
}

function swapAll(t, oldP, newP) {
  t = String(t || '');
  if (!oldP) return t;
  while (t.indexOf(oldP) !== -1) t = t.split(oldP).join(newP);
  return t;
}

function stripLeadingCatalogLock(t) {
  t = String(t || '');
  var endMark = 'No burn-in captions except the catalog label itself.';
  while (t.indexOf('HARD OUTPUT LOCK (READ FIRST):') === 0) {
    var i = t.indexOf(endMark);
    if (i === -1) break;
    t = t.slice(i + endMark.length).trim();
  }
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

function catalogHardware(accent) {
  return (
    'smooth MATTE white cylindrical insulin-style injectable research pen with a LONGER full-length barrel — ' +
    'PROPORTION: barrel 10-20 percent longer than a stubby travel pen, full-length elongated adult injector, not compact, not short. Stretch the white barrel, keep the diameter the same; ' +
    'matching white matte cap ON with integrated white pocket clip covering the tip (never a needle); ' +
    'white ridged gear-like dose dial (NOT colored, NOT orange); ' +
    'small flat circular plunger tip at the bottom of the dial in ' +
    accent
  );
}

function catalogLabel(name, accent) {
  return (
    'LABEL: white wrap-around. Logo ABOVE the name: ' +
    accent +
    ' DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. ' +
    "Compound name '" +
    name +
    "' in large bold " +
    accent +
    ' sans-serif. Solid ' +
    accent +
    " rectangle badge with white text exactly '10mg'. " +
    'Small dense black/dark-grey fine-print lines under the name. ' +
    'Vertical side text on the label: For Research Purposes Only. FORBIDDEN on the logo: hands near the DNA helix.'
  );
}

function catalogLayout(name) {
  return (
    "COMPOSITION: Camera PULLED BACK. Do NOT fill the frame with one giant pen. " +
    "Show a collection of identical freshly manufactured catalog pens of '" +
    name +
    "' lined up in a neat straight production row, as if they were just produced. " +
    'Every pen is the same compound, same label, same hardware, same orientation, caps ON, evenly spaced, parallel. ' +
    'Each pen is SMALL in the frame — the row sits mid-ground so the environment stays readable. Wide shot. ' +
    'FORBIDDEN: one oversized hero pen filling the frame, extreme close-up packshot, mixed compounds, vials, syringes, people.'
  );
}

function catalogLock(name, accent, family) {
  return (
    'HARD OUTPUT LOCK (READ FIRST): Copy the catalog injector still. Render a production row of identical ' +
    catalogHardware(accent) +
    " pens labeled '" +
    name +
    "'. NOT a glass vial, NOT brushed-silver metal, NOT a perfume cartridge, NOT a chrome claw stand. " +
    catalogLayout(name) +
    ' ' +
    catalogLabel(name, accent) +
    ' COLOR LOCK: Peptide pens = crimson red text + logo. Metabolic pens (Semaglutide / Tirzepatide / Retatrutide only) = cobalt blue text + logo. ' +
    'This SKU is ' +
    family +
    ' / ' +
    accent +
    '. FORBIDDEN: orange DNA, orange name, orange badge, orange dial, orange anywhere. ' +
    "Ignore neon/synthwave backgrounds; keep this row's scene environment. " +
    'No poster overlay. No burn-in captions except the catalog label itself.'
  );
}

function catalogStillEdit(name, accent, family) {
  return (
    'CRITICAL PRODUCT FIX: Replace the giant single-pen close-up with a pulled-back production row of identical catalog pens of ' +
    name +
    ', lined up as if they were just produced. Camera PULLED BACK. Each pen SMALL in the frame. Each pen is one ' +
    catalogHardware(accent) +
    '. ' +
    catalogLabel(name, accent) +
    ' This is a ' +
    family +
    ' SKU — ' +
    accent +
    ' text and logo on every pen. STRETCH each barrel longer — full-length adult injector, not stubby. DELETE hands around the DNA helix. ' +
    'DELETE one oversized hero filling the frame. DELETE orange, vials, mixed compounds, chrome claws, needles, gray bodies, missing clips, colored dials. ' +
    'After the edit: a neat production row of identical longer matte white pens, zero vials, zero hands on the logos. Caps on. Keep lighting and environment. Do not recolor scene blacks such as a void or lake.'
  );
}

function catalogMotionKeep(name, accent) {
  return (
    'Keep the exact same production row of identical matte white catalog pens of ' +
    name +
    ', camera pulled back, each pen small in frame, white caps ON with white clips, white ridged dials, ' +
    accent +
    ' circular plunger tips, ' +
    accent +
    " DNA double-helix logo (no hands) above '" +
    name +
    "', " +
    accent +
    " '10mg' badge, vertical For Research Purposes Only on every label. No orange. Caps stay ON. No vial. Do not zoom into one giant pen. Do not scramble the row."
  );
}

function catalogQuality(accent) {
  return (
    'ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, ' +
    'crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR, ' +
    'pulled-back wide still of a production row of identical LONGER full-length matte white catalog insulin-style research pens, not stubby, each pen small in frame, ' +
    'not one giant close-up, no vial, caps on, white ridged dial, DNA helix with no hands, ' +
    accent +
    ' circular plunger tip, no orange'
  );
}

function catalogMaterial(name, accent) {
  return (
    'matte white catalog insulin-style pen — ' +
    catalogHardware(accent) +
    '; ' +
    catalogLabel(name, accent)
  );
}

function paintOld(t, noun) {
  t = String(t || '');
  t = swapAll(t, 'longer glossy-white insulin-style peptide pen with red compound-name and red bottom clicker', noun);
  t = swapAll(t, 'longer glossy-white insulin-style metabolic pen with blue compound-name and blue bottom clicker', noun);
  t = swapAll(t, 'glossy white insulin-style injector pen', noun);
  t = swapAll(t, 'glossy-white insulin-style', 'matte white catalog');
  t = swapAll(t, 'GLOSSY white', 'MATTE white');
  t = swapAll(t, 'glossy WHITE cylindrical dose dial', 'white ridged gear-like dose dial');
  t = swapAll(t, 'translucent bright red bottom clicker', 'crimson red circular plunger tip');
  t = swapAll(t, 'translucent bright blue bottom clicker', 'cobalt blue circular plunger tip');
  t = swapAll(t, 'bright-blue vertical DNA double-helix', 'accent-color DNA double-helix icon only with no hands');
  t = swapAll(t, 'DNA double-helix cradled by two hands', 'DNA double-helix icon only with no hands');
  t = swapAll(t, 'cradled by two hands', 'icon only with no hands');
  t = swapAll(t, 'hands-and-DNA logo', 'DNA helix icon with no hands');
  t = swapAll(t, 'not a lone helix with no hands', 'helix icon only');
  t = swapAll(t, 'Keep any visible vial sticker as', 'Do not show a vial. Keep');
  t = swapAll(t, 'VIAL LABEL LOCK (MANDATORY): If a vial is visible, the sticker has exactly two lines: peptide name, then 10ml. No milligram marks, no per-milliliter marks, no extra numbers.', '');
  t = swapAll(t, 'Keep any visible vial sticker', 'Do not show a vial');
  t = swapAll(t, 'if a vial is visible keep the catalog vial sticker unchanged', '');
  t = swapAll(t, 'Product count = 1', 'a production row of identical pens');
  t = swapAll(t, 'exactly ONE', 'a production row of identical');
  t = swapAll(t, 'exactly one', 'a production row of identical');
  t = swapAll(t, 'No second pen', 'No mixed compounds. No vials');
  t = swapAll(t, 'one container only', 'a lined-up production collection');
  t = swapAll(t, 'COUNT = 1', 'production row, camera pulled back');
  t = swapAll(t, 'black 3ml Pen', "white '10mg' badge");
  t = swapAll(t, 'black 20mg 3ml Pen', "white '10mg' badge");
  t = swapAll(t, '3ml Pen', '10mg');
  t = swapAll(t, '3mL Pen', '10mg');
  t = swapAll(t, 'orange clicker', 'accent circular plunger tip');
  t = swapAll(t, 'orange dial', 'white ridged dial');
  t = swapAll(t, 'orange name', 'accent-color name');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  t = swapAll(t, ' .', '.');
  return t.trim();
}

var items = $input.all();
var out = [];

for (var i = 0; i < items.length; i++) {
  var row = items[i].json || {};
  if (String(row.category || '').trim() !== 'pen_3ml') continue;
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_catalog_pen_production_row_landscape: missing creation_id');
  var name = String(row.compound_name || '').trim();
  if (!name) throw new Error('overlay_catalog_pen_production_row_landscape: missing compound_name on ' + id);
  var accent = accentFor(name, row.compound_id);
  var family = familyFor(name, row.compound_id);
  var lock = catalogLock(name, accent, family);
  var noun =
    'a production row of identical matte white catalog ' +
    family +
    ' pens with ' +
    accent +
    ' text and logo';
  var spec =
    'PEN SPEC: Exact Palm Beach Vitality catalog injector. ' +
    catalogHardware(accent) +
    '. ' +
    catalogLabel(name, accent) +
    ' ' +
    family +
    ' = ' +
    accent +
    '. Orange is the wrong color. No injection act, no people, no needles in use. ';
  var hero =
    'a neat production row of identical LONGER full-length matte white catalog insulin-style pens of ' +
    name +
    ' with ' +
    accent +
    ' DNA helix icon (no hands) above the name, lined up as just produced, camera pulled back, each pen small in frame, ' +
    accent +
    ' compound name, white 10mg badge on a ' +
    accent +
    ' rectangle, white ridged dial, ' +
    accent +
    ' circular plunger tip, caps ON, mid-ground in environment; no injection act, no people';

  function withSpec(s) {
    s = stripLeadingCatalogLock(s);
    s = paintOld(s, noun);
    s = replaceBetween(s, 'PEN SPEC:', 'SIGNAGE RULE:', spec);
    s = replaceBetween(s, 'Hero style:', ' Lighting:', 'Hero style: ' + hero + '.');
    s = replaceBetween(s, 'Hero style:', 'Lighting:', 'Hero style: ' + hero + '. ');
    s = lock + ' ' + s;
    return capPrompt(s);
  }

  var stillEdit = String(row.still_edit_prompt || '').trim();
  stillEdit = stripLock(stillEdit, 'PEN DESIGN LOCK');
  stillEdit = stripLock(stillEdit, 'PEN COLOR LOCK');
  stillEdit = stripLock(stillEdit, 'CRITICAL PRODUCT FIX');
  stillEdit = capPrompt((stillEdit ? stillEdit + ' ' : '') + catalogStillEdit(name, accent, family));

  var motion = capPrompt(
    'Silent video. No soundtrack. ' +
      paintOld(row.video_motion_prompt, noun) +
      ' ' +
      catalogMotionKeep(name, accent)
  );

  out.push({
    json: {
      creation_id: id,
      material_detail: catalogMaterial(name, accent),
      hero_style: hero,
      scene_brief: withSpec(row.scene_brief),
      video_prompt: withSpec(row.video_prompt),
      video_motion_prompt: motion,
      surface: paintOld(row.surface, noun),
      still_edit_prompt: stillEdit,
      quality_suffix: catalogQuality(accent),
    },
  });
}

if (!out.length) {
  throw new Error('overlay_catalog_pen_production_row_landscape: no pen_3ml rows in input');
}

return out;
