// Shared catalog-pen look for Sheet 14 / image-scenes / landscape overlays.
// n8n Code cannot import this file — overlays paste a copy of these helpers.
//
// PEPTIDE PENS  = crimson red text + logo
// METABOLIC PENS = cobalt blue text + logo
// Metabolic names only: Semaglutide, Tirzepatide, Retatrutide
// (also IDs P-SEM-001 / P-SEMA-001, P-TIR-001 / P-TIRZ-001, P-RET-001 / P-RETA-001)
//
// Hardware from the catalog injector photo:
// matte white body, white cap ON + white pocket clip, white ridged dial,
// accent circular plunger tip, hands-and-DNA logo ABOVE the name, 10mg badge,
// fine-print under the name, vertical "For Research Purposes Only".
// FORBIDDEN: orange anywhere.

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
    'smooth MATTE white cylindrical insulin-style injectable research pen; ' +
    'matching white matte cap ON with integrated white pocket clip covering the tip (never a needle); ' +
    'white ridged gear-like dose dial (NOT colored, NOT orange); ' +
    'small flat circular plunger tip at the bottom of the dial in ' +
    accent
  );
}

function catalogLabel(name, accent) {
  return (
    "LABEL: white wrap-around. Logo ABOVE the name: " +
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
    'After the edit: count exactly 1 matte white pen, zero vials. Cap on. Keep lighting, camera, and environment.'
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

function liquidLine(name) {
  if (String(name || '').toUpperCase() === 'GLOW') {
    return 'barrel window shows settled clear bright blue liquid already inside at a stable level (GLOW only — blue liquid); never filling';
  }
  return 'barrel window shows settled crystal-clear colorless liquid already inside at a stable level; never filling';
}

function catalogHero(name, accent, pose) {
  return (
    'exactly one matte white catalog insulin-style pen of ' +
    name +
    ' with ' +
    accent +
    ' hands-and-DNA logo above the name, ' +
    accent +
    " '" +
    name +
    "', " +
    accent +
    " '10mg' badge, white ridged dial, " +
    accent +
    ' plunger tip, cap ON' +
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
