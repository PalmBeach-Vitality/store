// n8n Code node: overlay_catalog_pen_sheet14
// Workflow: overlay_catalog_pen_sheet14 (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_pen_creations  Before: sheets_update_catalog_pen
//
// Writes the catalog injector (red peptide / blue metabolic) onto every
// 14-pen-creations-150 row. Does NOT emit times_used / last_used_at / URLs.
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
    'If 2+, remove extras. No vials. COUNT = 1. Cap on. Longer full-length barrel. White dial. Accent plunger tip. DNA helix with no hands. No orange.'
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
    ' text and logo. STRETCH the barrel longer — full-length adult injector, not stubby. DELETE hands around the DNA helix. ' +
    'DELETE orange, vials, second pens, chrome claws, needles, gray bodies, missing clips, colored dials. ' +
    'After the edit: count exactly 1 longer matte white pen, zero vials, zero hands on the logo. Cap on. Keep lighting, camera, and environment.'
  );
}

function catalogMotionKeep(name, accent) {
  return (
    'Keep the exact same single matte white catalog pen, white cap ON with white clip, white ridged dial, ' +
    accent +
    ' circular plunger tip, ' +
    accent +
    " DNA double-helix logo (no hands) above '" +
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
    'exactly one LONGER full-length matte white catalog insulin-style research pen, not stubby, product count equals 1, no second pen, no vial, ' +
    'no product pair, no duplicate products, one container only, cap on, white ridged dial, DNA helix with no hands, ' +
    accent +
    ' circular plunger tip, no orange'
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

function sliceAfter(t, mark) {
  var i = String(t || '').indexOf(mark);
  if (i === -1) return '';
  return String(t).slice(i + mark.length);
}

function sliceBefore(t, mark) {
  var i = String(t || '').indexOf(mark);
  if (i === -1) return String(t || '');
  return String(t).slice(0, i);
}

function extractEnv(labItem, sceneBrief) {
  var t = String(labItem || '');
  var afterPeople = sliceAfter(t, 'No people.');
  if (afterPeople) {
    var env = sliceBefore(afterPeople, 'PRODUCT HERO').trim();
    if (env) return env;
  }
  return String(sceneBrief || '').trim();
}

function cameraMoveOnly(motion) {
  var t = String(motion || '');
  var start = t.indexOf('Slow cinematic camera:');
  if (start === -1) start = t.indexOf('cinematic camera:');
  if (start === -1) return t.trim();
  var chunk = t.slice(start);
  var endMarks = ['Keep the exact', 'Cap stays', 'No orbit'];
  var end = chunk.length;
  for (var i = 0; i < endMarks.length; i++) {
    var e = chunk.indexOf(endMarks[i]);
    if (e !== -1 && e < end) end = e;
  }
  return chunk.slice(0, end).trim();
}

var items = $input.all();
var out = [];

for (var i = 0; i < items.length; i++) {
  var row = items[i].json || {};
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_catalog_pen_sheet14: missing creation_id');
  var name = String(row.compound_name || '').trim();
  if (!name) throw new Error('overlay_catalog_pen_sheet14: missing compound_name on ' + id);
  var accent = accentFor(name, row.lab_item_id);
  var family = familyFor(name, row.lab_item_id);
  var lock = catalogLock(name, accent, family);
  var env = extractEnv(row.lab_item, row.scene_brief);
  var heroPose = String(row.hero_style || '').trim();
  var labItem =
    lock +
    ' ' +
    env +
    ' PRODUCT HERO: ' +
    catalogMaterial(name, accent) +
    '. Lighting: ' +
    String(row.lighting || '').trim() +
    '. Empty of people; no clinical procedure staging; no needles. No poster overlay.' +
    catalogClose();

  var material = catalogMaterial(name, accent) +
    '; surface ' +
    String(row.surface || '').trim() +
    '; lighting ' +
    String(row.lighting || '').trim() +
    '. One capped catalog pen only. No vial. No orange.';

  var videoPrompt = capPrompt(
    lock +
      ' Photoreal vertical 9:16 Palm Beach Vitality cinematic research still. ' +
      'Create a laboratory / peptide R&D / health-and-wellness environment that contains exactly ONE capped catalog pen (never a vial, never two pens). ' +
      'FULL SCENE BRIEF: ' +
      labItem +
      ' Supporting notes: ' +
      material +
      ' SHOT FAMILY: ' +
      String(row.shot_family || '') +
      '. CAMERA ANGLE: ' +
      String(row.camera_angle || '') +
      '. CAMERA DIRECTION: ' +
      String(row.camera_direction || '') +
      '. FRAMING: ' +
      String(row.framing || '') +
      '. Hero style: ' +
      heroPose +
      '. Setting surface: ' +
      String(row.surface || '') +
      '. Lighting: ' +
      String(row.lighting || '') +
      '. Intended follow-on camera move: ' +
      String(row.camera_move || '') +
      '. Color grade: ' +
      String(row.color_grade || '') +
      '. Avoid: people, needles, vials, second pens, chrome claw stands, orange paint, watermarks, burn-in text. ' +
      'Do NOT render prompt metadata as visible text. Quality: ' +
      catalogQuality(accent) +
      '.' +
      catalogClose()
  );

  var cam = cameraMoveOnly(row.video_motion_prompt);
  if (!cam) cam = 'Slow cinematic camera: ' + String(row.camera_move || '').trim();
  var glow =
    String(name).toUpperCase() === 'GLOW'
      ? ' Keep the bright blue liquid level frozen in the barrel window. Liquid does not change level — pre-filled and static.'
      : ' Keep the clear liquid level frozen in the barrel window. Liquid does not change level — pre-filled and static.';

  var motion = capPrompt(
    'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ' +
      cam +
      ' ' +
      catalogMotionKeep(name, accent) +
      ' No orbit. No new objects. No people, needles, watermarks, or poster overlays.' +
      glow
  );

  out.push({
    json: {
      creation_id: id,
      lab_item: capPrompt(labItem),
      material_detail: material,
      quality_suffix: catalogQuality(accent),
      video_prompt: videoPrompt,
      video_motion_prompt: motion,
      still_edit_prompt: catalogStillEdit(name, accent, family),
      hero_style: 'catalog injector — matte white, white clip-cap ON, white ridged dial, ' +
        accent +
        ' DNA helix icon (no hands) + name + 10mg badge, ' +
        accent +
        ' plunger tip',
      still_n: '1',
    },
  });
}

if (!out.length) {
  throw new Error('overlay_catalog_pen_sheet14: no rows');
}

return out;
