// n8n Code node: overlay_pen_count1
// Workflow: overlay_pen_count1_sheet14 (one-shot, then archive)
// Mode: Run Once for Each Item. Execute Once OFF.
// After: get_pen_creations  Before: sheets_update_pen_count1
//
// Flips Sheet 14 from a production row of identical pens to exactly
// 1 pen / 1 compound. Keeps the live catalog lock (white dial, crimson
// peptide / cobalt Sema-Tirz-Reta, 10mg, no hands on helix, no orange).
// Does NOT emit times_used / last_used_at.

function squeeze(s) {
  var t = String(s || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  return t.trim();
}

var REPLACES = [
  [
    'This is a PRODUCTION ROW of identical freshly made pens, camera pulled back, each pen small in frame. Not one oversized close-up. Lined up as just produced. No vials. No mixed SKUs. Caps on.',
    'This is exactly ONE freshly made pen, camera closer on the one hero. Product count = 1. No extra pens. No vials. No mixed SKUs. Cap on.',
  ],
  ['caps on, production row;', 'cap on, COUNT=1;'],
  [
    'Render a production row of identical smooth matte white cylindrical insulin-style Palm Beach Vitality research pens labeled',
    'Render exactly ONE smooth matte white cylindrical insulin-style Palm Beach Vitality research pen labeled',
  ],
  [
    'a production row of identical capped research pens, lined up as just produced, camera pulled back (never a vial, never one giant close-up pen)',
    'exactly ONE capped research pen as a catalog hero (never a vial, never two pens, never a production row)',
  ],
  [
    'a collection of identical matte white catalog insulin-style research pens lined up on',
    'exactly ONE matte white catalog insulin-style research pen on',
  ],
  [
    'lined up as if they were just produced. Camera PULLED BACK. Each pen SMALL in the frame.',
    'as a single catalog hero. Camera closer on the one pen. Product count = 1.',
  ],
  [
    'Camera PULLED BACK. Each pen SMALL in the frame.',
    'Camera closer on the one pen. Product count = 1.',
  ],
  [
    'FORBIDDEN: one oversized hero pen filling the frame',
    'FORBIDDEN: extra pens, production row, lineup, cluster, second pen',
  ],
  [
    'pulled-back wide still of a production row of identical LONGER full-length matte white catalog insulin-style research pens, not stubby, each pen small in frame, not one giant close-up',
    'catalog hero still of exactly ONE LONGER full-length matte white catalog insulin-style research pen, not stubby, one pen only, not a production row',
  ],
  [
    'production row of identical catalog injectors — just produced, lined up, camera pulled back, each pen small in frame',
    'exactly ONE catalog injector — single hero, camera closer, one compound on one pen',
  ],
  [
    'Keep the exact same production row of identical matte white catalog',
    'Keep the exact same single matte white catalog',
  ],
  [
    'pens, camera pulled back, each pen small in frame',
    'pen, camera closer on the one hero, product count = 1',
  ],
  ['Do not zoom into one giant pen', 'Do not add extra pens or a production row'],
  ['production row of identical', 'exactly one'],
  ['a collection of identical', 'exactly one'],
  ['lined up as if they were just produced', 'as a single catalog hero'],
  ['Lined up as just produced', 'Single catalog hero'],
  ['lined up as just produced', 'as a single catalog hero'],
  ['each pen SMALL in the frame', 'the one pen is the catalog hero'],
  ['each pen small in frame', 'one pen only'],
  ['camera pulled back', 'camera closer on the one pen'],
  ['Camera pulled back', 'Camera closer on the one pen'],
  ['Caps stay ON', 'Cap stays ON'],
  ['on every pen', 'on the pen'],
  ['STRETCH each barrel longer', 'STRETCH the barrel longer'],
  ['pens labeled', 'pen labeled'],
];

function applyReplaces(text) {
  var t = String(text || '');
  for (var i = 0; i < REPLACES.length; i++) {
    t = t.split(REPLACES[i][0]).join(REPLACES[i][1]);
  }
  return squeeze(t);
}

function skuColor(row) {
  var p = String(row.video_prompt || '') + ' ' + String(row.still_edit_prompt || '');
  if (p.indexOf('This SKU is metabolic') !== -1 || p.indexOf('metabolic / cobalt') !== -1) {
    return { color: 'cobalt blue', sku: 'metabolic', lock: 'cobalt blue text and logo' };
  }
  return { color: 'crimson red', sku: 'peptide', lock: 'crimson red text and logo' };
}

function stillEditCount1(name, row) {
  var c = skuColor(row);
  return squeeze(
    "CRITICAL PRODUCT FIX: Keep this exact catalog pen, then remove every extra pen until only ONE remains. " +
      'White matte barrel, white clip-cap ON, white ridged dose dial (NOT orange). ' +
      'Logo ABOVE the name: ' +
      c.color +
      ' DNA double-helix icon only — no hands, no palms, no figurative hands cradling the helix. ' +
      "Name '" +
      name +
      "' large bold " +
      c.color +
      ' sans-serif. Solid ' +
      c.color +
      " rectangle badge with white '10mg'. " +
      'Fine-print black lines under the name. Vertical label text: For Research Purposes Only. ' +
      'This is a ' +
      c.sku +
      ' SKU — ' +
      c.lock +
      ' on the pen. Camera closer, 9:16, one compound / one pen. ' +
      'STRETCH the barrel longer — full-length adult injector, not stubby. ' +
      'DELETE extra pens, production rows, lineups, clusters. DELETE hands around the DNA helix. ' +
      'DELETE orange, burgundy vial branding, palm trees, mixed compounds, vials, needles, syringes, scales, trays. ' +
      'After the edit: count exactly 1 longer white pen, zero extra pens, zero vials, zero hands on the logo. Cap on.'
  );
}

function capPrompt(text) {
  var t = squeeze(text);
  if (t.length > 7900) t = t.slice(0, 7900);
  return t;
}

var row = ($input.item && $input.item.json) || $json || {};
var id = String(row.creation_id || '').trim();
var name = String(row.compound_name || '').trim();
if (!id) throw new Error('overlay_pen_count1: empty creation_id');
if (!name) throw new Error('overlay_pen_count1: empty compound_name on ' + id);

var keys = [
  'lab_item',
  'material_detail',
  'scene_brief',
  'quality_suffix',
  'hero_style',
  'video_prompt',
  'video_motion_prompt',
];
var out = {
  creation_id: id,
  compound_name: name,
  still_n: 1,
  still_edit_prompt: capPrompt(stillEditCount1(name, row)),
};
for (var k = 0; k < keys.length; k++) {
  var key = keys[k];
  out[key] = applyReplaces(row[key]);
}
out.video_prompt = capPrompt(out.video_prompt);
out.video_motion_prompt = capPrompt(out.video_motion_prompt);

if (out.video_prompt.indexOf('Render exactly ONE') === -1) {
  throw new Error('overlay_pen_count1: COUNT=1 still lock missing on ' + id);
}

return { json: out };
