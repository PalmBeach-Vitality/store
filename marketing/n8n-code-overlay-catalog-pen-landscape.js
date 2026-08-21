// n8n Code node: overlay_catalog_pen_landscape
// Workflow: overlay_catalog_pen_landscape (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_catalog_pen
//
// pen_3ml rows only on 500_Peptide_Wellness_Reel_Scenes.
// Does NOT touch vial_10ml or set_environment.
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
    'smooth MATTE white cylindrical insulin-style injectable research pen; ' +
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
    ' DNA double-helix cradled by two hands (not maroon vial DNA, not a lone helix with no hands). ' +
    "Compound name '" +
    name +
    "' in large bold " +
    accent +
    ' sans-serif. Solid ' +
    accent +
    " rectangle badge with white text exactly '10mg'. " +
    'Small dense black/dark-grey fine-print lines under the name. ' +
    'Vertical side text on the label: For Research Purposes Only.'
  );
}

function catalogLock(name, accent, family) {
  return (
    'HARD OUTPUT LOCK (READ FIRST): Copy the catalog injector still. Exactly ONE ' +
    catalogHardware(accent) +
    '. NOT a glass vial, NOT brushed-silver metal, NOT a perfume cartridge, NOT a chrome claw stand. ' +
    'Product count = 1. No second pen. No vial. No syringe. No people. ' +
    catalogLabel(name, accent) +
    ' COLOR LOCK: Peptide pens = crimson red text + logo. Metabolic pens (Semaglutide / Tirzepatide / Retatrutide only) = cobalt blue text + logo. ' +
    'This pen is ' +
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
    'CRITICAL PRODUCT FIX: Replace any wrong injector, vial, chrome claw, gray body, clear cap, or colored dial with exactly ONE catalog pen. ' +
    catalogHardware(accent) +
    '. ' +
    catalogLabel(name, accent) +
    ' This is a ' +
    family +
    ' pen — ' +
    accent +
    ' text and logo. DELETE orange, vials, second pens, chrome claws, needles, gray bodies, missing clips, colored dials. ' +
    'After the edit: count exactly 1 matte white pen, zero vials. Cap on. Keep lighting, camera, and environment. Do not recolor scene blacks such as a void or lake.'
  );
}

function catalogMotionKeep(name, accent) {
  return (
    'Keep the exact same single matte white catalog pen, white cap ON with white clip, white ridged dial, ' +
    accent +
    ' circular plunger tip, ' +
    accent +
    " hands-and-DNA logo above '" +
    name +
    "', " +
    accent +
    " '10mg' badge, vertical For Research Purposes Only on the label. No orange. Cap stays ON. No vial. No second pen."
  );
}

function catalogQuality(accent) {
  return (
    'ultra detailed, extremely detailed, hyper-detailed, razor sharp focus, tack sharp, ' +
    'crystal clear, ultra sharp, 8k resolution, photorealistic, hyperrealistic, ultra realistic, HDR, ' +
    'exactly one matte white catalog insulin-style research pen, product count equals 1, no second pen, no vial, ' +
    'no product pair, no duplicate products, one container only, cap on, white ridged dial, ' +
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
  t = swapAll(t, 'bright-blue vertical DNA double-helix', 'accent-color DNA double-helix cradled by two hands');
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
  if (!id) throw new Error('overlay_catalog_pen_landscape: missing creation_id');
  var name = String(row.compound_name || '').trim();
  if (!name) throw new Error('overlay_catalog_pen_landscape: missing compound_name on ' + id);
  var accent = accentFor(name, row.compound_id);
  var family = familyFor(name, row.compound_id);
  var lock = catalogLock(name, accent, family);
  var noun =
    'matte white catalog ' +
    family +
    ' pen with ' +
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
    'exactly one matte white catalog insulin-style pen of ' +
    name +
    ' with ' +
    accent +
    ' hands-and-DNA logo above the name, ' +
    accent +
    ' compound name, white 10mg badge on a ' +
    accent +
    ' rectangle, white ridged dial, ' +
    accent +
    ' circular plunger tip, cap ON, mid-ground in environment; no injection act, no people';

  function withSpec(s) {
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
  throw new Error('overlay_catalog_pen_landscape: no pen_3ml rows in input');
}

return out;
