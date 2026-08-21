// Shared catalog-pen look for Sheet 14 / image-scenes / landscape overlays.
// n8n Code cannot import this file — overlays paste a copy of these helpers.
//
// PEPTIDE PENS  = crimson red text + logo
// METABOLIC PENS = cobalt blue text + logo
// Metabolic names only: Semaglutide, Tirzepatide, Retatrutide
// (also IDs P-SEM-001 / P-SEMA-001, P-TIR-001 / P-TIRZ-001, P-RET-001 / P-RETA-001)
//
// Hardware from the catalog injector photo:
// LONGER full-length matte white body (not stubby), white cap ON + white pocket clip,
// white ridged dial, accent circular plunger tip, DNA helix logo ABOVE the name
// (no hands), 10mg badge, fine-print under the name, vertical "For Research Purposes Only".
// STILL COMPOSITION: a collection of identical pens lined up in a production row,
// camera pulled back, each pen small in frame — not one giant close-up.
// FORBIDDEN: orange anywhere. FORBIDDEN: hands around the DNA helix.

var BLUE_NAMES = {
  semaglutide: 1,
  tirzepatide: 1,
  retatrutide: 1,
};

var BLUE_IDS = {
  'P-SEM-001': 1,
  'P-SEMA-001': 1,
  'P-TIR-001': 1,
  'P-TIRZ-001': 1,
  'P-RET-001': 1,
  'P-RETA-001': 1,
};

function isMetabolic(name, id) {
  var n = String(name || '')
    .trim()
    .toLowerCase();
  var i = String(id || '')
    .trim()
    .toUpperCase();
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

function catalogHero(name, accent, pose) {
  return (
    'a neat production row of identical matte white catalog insulin-style pens of ' +
    name +
    ', lined up as just produced, camera pulled back, each pen small in frame, ' +
    accent +
    ' DNA double-helix logo (no hands) above the name, ' +
    accent +
    " '" +
    name +
    "', " +
    accent +
    " '10mg' badge, white ridged dial, " +
    accent +
    ' plunger tip, caps ON' +
    (pose ? '; ' + pose : '')
  );
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
