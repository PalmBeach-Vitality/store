// n8n Code node: overlay_landscape_single_hero
// Workflow: overlay_landscape_single_hero (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_reel_creations  Before: sheets_update_single_hero
//
// Salvatore: landscape vid-gen is ONE hero spotlight — one pen OR one vial.
// Writes onto 500_Peptide_Wellness_Reel_Scenes only.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
// Does NOT rewrite daily pick_creation.
// Does NOT restyle pen colors or the catalog vial look.

var MARKER = 'SINGLE HERO SPOTLIGHT (COUNT=1):';

var SPOTLIGHT =
  'SINGLE HERO SPOTLIGHT (COUNT=1): exactly ONE product in the entire frame. ' +
  'Pen rows: exactly ONE pen. Vial rows: exactly ONE vial. Never both. ' +
  'Forbidden: second pen, second vial, production row, lineup, rack, cluster, pair. COUNT = 1. ';

var PEN_EDIT =
  'CRITICAL COUNT FIX: Keep exactly ONE catalog pen as the only hero spotlight. ' +
  'DELETE every extra pen, production row, lineup, and rack. After the edit the viewer must count exactly 1 pen. ' +
  'Do not add a vial. Keep lighting, camera, label colors, and environment.';

var VIAL_EDIT =
  'CRITICAL COUNT FIX: Keep exactly ONE catalog vial as the only hero spotlight. ' +
  'DELETE every extra vial, pair, triangle, row, and rack. After the edit the viewer must count exactly 1 vial. ' +
  'Do not add a pen. Keep lighting, camera, label, and environment.';

function requireId(row) {
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_landscape_single_hero: missing creation_id');
  return id;
}

function swapAll(t, oldP, newP) {
  t = String(t || '');
  if (!oldP) return t;
  while (t.indexOf(oldP) !== -1) t = t.split(oldP).join(newP);
  return t;
}

function stripLock(t) {
  t = String(t || '');
  var i = t.indexOf(MARKER);
  if (i === -1) return t.trim();
  var end = t.indexOf('COUNT = 1.', i);
  if (end === -1) return (t.slice(0, i) + t.slice(i + MARKER.length)).trim();
  return (t.slice(0, i) + t.slice(end + 'COUNT = 1.'.length)).trim();
}

function prefixLock(t) {
  t = stripLock(t);
  if (!t) return SPOTLIGHT.trim();
  return SPOTLIGHT + t;
}

function collapseSpaces(t) {
  t = String(t || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  t = swapAll(t, ' .', '.');
  return t.trim();
}

function neutralizeMultiVial(t) {
  t = String(t || '');
  t = swapAll(
    t,
    'while two vials slowly lean toward each other until labels almost touch',
    'while light crawls across the single vial label'
  );
  t = swapAll(
    t,
    'with three vials arranged in a triangle and soft light circulating between them like a circuit',
    'with light circulating across the single vial like a circuit'
  );
  t = swapAll(t, 'two vials', 'the single vial');
  t = swapAll(t, 'three vials', 'the single vial');
  return t;
}

function spotlightPen(t) {
  t = String(t || '');
  t = swapAll(t, 'Render a production row of identical', 'Render exactly ONE');
  t = swapAll(t, 'a neat production row of identical', 'exactly ONE');
  t = swapAll(t, 'a production row of identical', 'exactly ONE');
  t = swapAll(
    t,
    'COMPOSITION: Camera PULLED BACK. Do NOT fill the frame with one giant pen. Show a collection of identical freshly manufactured catalog pens of \'',
    'COMPOSITION: Single hero spotlight. Show exactly ONE catalog pen of \''
  );
  t = swapAll(
    t,
    '\' lined up in a neat straight production row, as if they were just produced. Every pen is the same compound, same label, same hardware, same orientation, caps ON, evenly spaced, parallel. Each pen is SMALL in the frame — the row sits mid-ground so the environment stays readable. Wide shot. FORBIDDEN: one oversized hero pen filling the frame, extreme close-up packshot, mixed compounds, vials, syringes, people.',
    '\' as the only product in the frame. Cap ON. FORBIDDEN: second pen, production row, lineup, rack, cluster, mixed compounds, vials, syringes, people.'
  );
  t = swapAll(
    t,
    'CRITICAL PRODUCT FIX: Replace the giant single-pen close-up with a pulled-back production row of identical catalog pens of ',
    'CRITICAL PRODUCT FIX: Keep exactly ONE catalog pen of '
  );
  t = swapAll(
    t,
    ', lined up as if they were just produced. Camera PULLED BACK. Each pen SMALL in the frame. Each pen is one smooth',
    ' as the only hero spotlight. DELETE extra pens and production rows. The pen is one smooth'
  );
  t = swapAll(
    t,
    'After the edit: a neat production row of identical longer matte white pens, zero vials, zero hands on the logos.',
    'After the edit: exactly ONE longer matte white pen, zero extras, zero vials, zero hands on the logo.'
  );
  t = swapAll(t, 'DELETE one oversized hero filling the frame.', 'DELETE extra pens and production rows.');
  t = swapAll(t, 'STRETCH each barrel longer', 'STRETCH the barrel longer');
  t = swapAll(t, 'crimson red text and logo on every pen', 'crimson red text and logo on the single pen');
  t = swapAll(t, 'Keep the exact same production row of identical matte white catalog pens of ', 'Keep the exact same single matte white catalog pen of ');
  t = swapAll(t, ', camera pulled back, each pen small in frame', ' as the only hero spotlight');
  t = swapAll(t, 'on every pen label', 'on the single pen label');
  t = swapAll(t, 'on every label', 'on the single label');
  t = swapAll(t, 'Do not zoom into one giant pen. Do not scramble the row.', 'Do not add a second pen. Do not form a row.');
  t = swapAll(t, 'lined up as just produced, camera pulled back, each pen small in frame', 'as the only hero spotlight');
  t = swapAll(t, 'lined up as if they were just produced', 'as the only hero spotlight');
  t = swapAll(t, 'production row', 'single hero pen');
  t = swapAll(t, 'pens labeled', 'pen labeled');
  return collapseSpaces(t);
}

function rewriteHero(row, cat) {
  var name = String(row.compound_name || '').trim();
  var hero = String(row.hero_style || '');
  if (cat === 'pen_3ml') {
    hero = spotlightPen(hero);
    if (hero.indexOf('exactly ONE') === -1 && hero.indexOf('exactly one') === -1) {
      hero =
        'exactly one catalog pen of ' +
        name +
        ' as the only hero spotlight, cap ON, mid-ground in environment; no second pen, no production row, no vial, no people';
    }
    return collapseSpaces(hero);
  }
  hero = neutralizeMultiVial(hero);
  return collapseSpaces(hero);
}

var items = $input.all();
var out = [];
var pens = 0;
var vials = 0;

for (var i = 0; i < items.length; i++) {
  var row = items[i].json || {};
  var cat = String(row.category || '').trim();
  if (cat !== 'pen_3ml' && cat !== 'vial_10ml' && cat !== 'set_environment') continue;

  var scene = String(row.scene_brief || '');
  var video = String(row.video_prompt || '');
  var motion = String(row.video_motion_prompt || '');
  var edit = String(row.still_edit_prompt || '');
  var material = String(row.material_detail || '');
  var surface = String(row.surface || '');
  var hero = rewriteHero(row, cat);

  if (cat === 'pen_3ml') {
    scene = spotlightPen(scene);
    video = spotlightPen(video);
    motion = spotlightPen(motion);
    edit = spotlightPen(edit);
    material = spotlightPen(material);
    surface = spotlightPen(surface);
    if (edit.indexOf('CRITICAL COUNT FIX:') === -1) edit = (edit ? edit + ' ' : '') + PEN_EDIT;
    pens += 1;
  } else {
    scene = neutralizeMultiVial(scene);
    video = neutralizeMultiVial(video);
    motion = neutralizeMultiVial(motion);
    edit = neutralizeMultiVial(edit);
    material = neutralizeMultiVial(material);
    surface = neutralizeMultiVial(surface);
    if (edit.indexOf('CRITICAL COUNT FIX:') === -1) edit = (edit ? edit + ' ' : '') + VIAL_EDIT;
    vials += 1;
  }

  out.push({
    json: {
      creation_id: requireId(row),
      category: cat,
      material_detail: prefixLock(material),
      hero_style: prefixLock(hero),
      scene_brief: prefixLock(scene),
      video_prompt: prefixLock(video),
      video_motion_prompt: prefixLock(motion),
      surface: prefixLock(surface),
      still_edit_prompt: prefixLock(edit),
    },
  });
}

if (!out.length) {
  throw new Error('overlay_landscape_single_hero: no pen_3ml / vial_10ml / set_environment rows');
}
if (!pens) {
  throw new Error('overlay_landscape_single_hero: expected pen_3ml rows');
}
if (!vials) {
  throw new Error('overlay_landscape_single_hero: expected vial rows');
}

return out;
