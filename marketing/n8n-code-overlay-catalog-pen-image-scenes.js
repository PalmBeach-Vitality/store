// n8n Code node: overlay_catalog_pen_image_scenes
// Workflow: overlay_catalog_pen_image_scenes (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_image_scenes  Before: sheets_update_catalog_pen
//
// pen_3ml_scene rows only. Writes the catalog injector (red peptide /
// blue metabolic) into product_hero, product_form_detail, scene_brief,
// still_prompt, model_still, aspect_ratio, still_resolution, still_n.
// Does NOT emit last_used_date / caption_lock / rotation_order.
// Does NOT touch vial_10ml_scene or lab_scene.

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

function catalogClose() {
  return (
    ' HARD OUTPUT LOCK (FINAL CHECK): Count every pen and vial. Total product containers must be exactly 1 — the single capped catalog pen. ' +
    'If 2+, remove extras. No vials. COUNT = 1. Cap on. White dial. Accent plunger tip. No orange.'
  );
}

function liquidLine(name) {
  if (String(name || '').toUpperCase() === 'GLOW') {
    return 'barrel window shows settled clear bright blue liquid already inside at a stable level (GLOW only — blue liquid); never filling';
  }
  return 'barrel window shows settled crystal-clear colorless liquid already inside at a stable level; never filling';
}

function catalogMaterial(name, accent) {
  return (
    'matte white catalog insulin-style pen — ' +
    catalogHardware(accent) +
    '; ' +
    catalogLabel(name, accent) +
    '; ' +
    liquidLine(name)
  );
}

var items = $input.all();
var out = [];

for (var i = 0; i < items.length; i++) {
  var row = items[i].json || {};
  if (String(row.scene_category || '').trim() !== 'pen_3ml_scene') continue;
  var sid = String(row.scene_id || '').trim();
  if (!sid) throw new Error('overlay_catalog_pen_image_scenes: missing scene_id');
  var name = String(row.compound_name || '').trim();
  if (!name) throw new Error('overlay_catalog_pen_image_scenes: missing compound_name on ' + sid);
  var accent = accentFor(name, row.compound_id);
  var family = familyFor(name, row.compound_id);
  var lock = catalogLock(name, accent, family);
  var env = String(row.lab_environment || '').trim();
  var cam = String(row.camera || '').trim();
  var light = String(row.lighting || '').trim();
  var sceneName = String(row.scene_name || '').trim();
  var form = catalogMaterial(name, accent);
  var hero =
    'exactly one matte white catalog insulin-style pen of ' +
    name +
    ' (' +
    family +
    ' / ' +
    accent +
    ' text + logo), cap ON, white ridged dial, mid-ground in the scene environment';

  var stillPrompt = capPrompt(
    lock +
      ' Photoreal square 1:1 Palm Beach Vitality catalog still for Instagram feed. ' +
      'Wide environmental pharmaceutical / peptide R&D scene containing exactly ONE capped catalog pen. ' +
      'Scene name: ' +
      sceneName +
      '. Environment: ' +
      env +
      '. Camera: ' +
      cam +
      '. Lighting: ' +
      light +
      '. PRODUCT HERO: ' +
      hero +
      '. FORM: ' +
      form +
      '. Deep focus. Architecture readable. Pen label fully readable. ' +
      'No people, needles, vials, second pens, chrome claws, orange, or poster overlays. ' +
      'Do NOT render prompt metadata as visible text.' +
      catalogClose()
  );

  out.push({
    json: {
      scene_id: sid,
      product_hero: hero,
      product_form_detail: form,
      scene_brief: stillPrompt,
      still_prompt: stillPrompt,
      model_still: 'grok-imagine-image-2.0',
      aspect_ratio: '1:1',
      still_resolution: '2k',
      still_n: '1',
    },
  });
}

if (!out.length) {
  throw new Error('overlay_catalog_pen_image_scenes: no pen_3ml_scene rows');
}

return out;
