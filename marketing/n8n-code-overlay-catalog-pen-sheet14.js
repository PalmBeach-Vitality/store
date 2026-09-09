// n8n Code node: overlay_catalog_pen_production_row_sheet14
// Workflow: overlay_catalog_pen_production_row_sheet14 (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_pen_creations  Before: sheets_update_catalog_pen
//
// Writes pulled-back production-row catalog pens onto every
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

function catalogClose() {
  return (
    ' HARD OUTPUT LOCK (FINAL CHECK): This is a PRODUCTION ROW of identical freshly made pens, camera pulled back, each pen small in frame. ' +
    'Not one oversized close-up. Lined up as just produced. No vials. No mixed SKUs. Caps on. Longer full-length barrel on each pen. White dial. Accent plunger tip. DNA helix with no hands. No orange.'
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
    'After the edit: a neat production row of identical longer matte white pens, zero vials, zero hands on the logos. Caps on. Keep lighting and environment.'
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
  var endMark = 'No burn-in captions except the catalog label itself.';
  while (t.indexOf('HARD OUTPUT LOCK (READ FIRST):') === 0 || t.indexOf('LABEL:') === 0) {
    var i = t.indexOf(endMark);
    if (i === -1) break;
    t = t.slice(i + endMark.length).trim();
  }
  var env = sliceBefore(t, 'PRODUCT HERO').trim();
  while (env.indexOf('cradled by two hands') !== -1) {
    env = env.split('cradled by two hands').join('icon only with no hands');
  }
  while (env.indexOf('hands-and-DNA logo') !== -1) {
    env = env.split('hands-and-DNA logo').join('DNA helix icon with no hands');
  }
  if (env && env.indexOf('LABEL:') !== 0 && env.indexOf('HARD OUTPUT LOCK') !== 0) return env;
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
  if (!id) throw new Error('overlay_catalog_pen_production_row_sheet14: missing creation_id');
  var name = String(row.compound_name || '').trim();
  if (!name) throw new Error('overlay_catalog_pen_production_row_sheet14: missing compound_name on ' + id);
  var accent = accentFor(name, row.lab_item_id);
  var family = familyFor(name, row.lab_item_id);
  var lock = catalogLock(name, accent, family);
  var env = extractEnv(row.lab_item, row.scene_brief);
  var heroPose =
    'production row of identical catalog injectors — just produced, lined up, camera pulled back, each pen small in frame, matte white, white clip-cap ON, white ridged dial, ' +
    accent +
    ' DNA helix icon (no hands) + name + 10mg badge, ' +
    accent +
    ' plunger tip';
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
    '. One production row of identical capped catalog pens. No vial. No orange.';

  var videoPrompt = capPrompt(
    lock +
      ' Photoreal vertical 9:16 Palm Beach Vitality cinematic research still. ' +
      'Create a laboratory / peptide R&D / health-and-wellness environment that contains a production row of identical capped catalog pens, lined up as just produced, camera pulled back (never a vial, never one giant close-up pen). ' +
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
      '. Avoid: people, needles, vials, mixed compounds, one giant close-up pen filling the frame, chrome claw stands, orange paint, watermarks, burn-in text. ' +
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
      hero_style: heroPose,
      still_n: '1',
    },
  });
}

if (!out.length) {
  throw new Error('overlay_catalog_pen_production_row_sheet14: no rows');
}

return out;
