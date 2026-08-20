// n8n Code node: overlay_landscape_pen_colors
// Workflow: overlay_landscape_pen_colors (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_landscape_rows  Before: sheets_update_landscape_pen_colors
//
// Writes pen color onto 500_Peptide_Wellness_Reel_Scenes pen_3ml rows only.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.
//
// Peptide pens: matte white body, red on-pen text.
// Metabolic pens: matte white body, blue on-pen text.
// Shape / design unchanged. Do not recolor scene blacks (void, lake, etc.).

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

var PEN_NOUN_RE = /matte-black peptide pen/gi;

function isMetabolic(name) {
  return !!METABOLIC[String(name || '').trim()];
}

function paintPen(text, family, ink) {
  var t = String(text || '');
  if (!t) return t;
  var noun = 'matte-white ' + family + ' pen with ' + ink + ' on-pen text';
  t = t.replace(PEN_NOUN_RE, noun);
  return t;
}

function requireId(row) {
  var id = String(row.creation_id || '').trim();
  if (!id) throw new Error('overlay_landscape_pen_colors: missing creation_id');
  return id;
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

  var colorLock =
    'PEN COLOR LOCK (overrides COUNT FIX restyle only for the pen): ' +
    'Keep the same elongated 3mL pen shape and design. ' +
    'If the pen is black, dark, gray, metal, or gold-lettered, recolor it now. ' +
    'Body, cap, and clip must be matte white — not black, not gray, not metal. ' +
    'All on-pen lettering must be ' +
    inkAdj +
    ' only. No gold text. No black barrel. ' +
    'Do not restyle lighting, camera, or environment. ' +
    'Do not recolor scene blacks such as a void or lake.';

  var stillEdit = String(row.still_edit_prompt || '').trim();
  if (stillEdit.indexOf('PEN COLOR LOCK') === -1) {
    stillEdit = (stillEdit ? stillEdit + ' ' : '') + colorLock;
  }

  var specLead =
    'PEN SPEC: 3mL pre-filled research dosage pen. Matte white body, cap, and clip. On-pen text is ' +
    inkAdj +
    ' only — not gold, not black. Keep the same elongated pen shape.';

  function withSpec(s) {
    s = paintPen(s, family, ink);
    s = s.replace(/PEN SPEC:\s*3mL pre-filled research dosage pen\./gi, specLead);
    s = s.replace(
      /Hero style: 3mL research dosage pen of .+? mid-ground in environment/gi,
      'Hero style: 3mL matte-white research dosage pen of ' + name + ' with ' + inkAdj + ' on-pen text, mid-ground in environment'
    );
    return s;
  }

  var hero =
    '3mL matte-white research dosage pen of ' +
    name +
    ' with ' +
    inkAdj +
    ' on-pen text, mid-ground in environment; no injection act, no people, no needle use';

  var material =
    '3mL pre-filled research dosage pen — matte white body, cap, and clip; ' + inkAdj + ' on-pen text; same elongated shape';

  out.push({
    json: {
      creation_id: requireId(row),
      material_detail: material,
      hero_style: hero,
      scene_brief: withSpec(row.scene_brief),
      video_prompt: withSpec(row.video_prompt),
      video_motion_prompt: paintPen(row.video_motion_prompt, family, ink),
      surface: paintPen(row.surface, family, ink),
      still_edit_prompt: stillEdit,
    },
  });
}

if (!out.length) {
  throw new Error('overlay_landscape_pen_colors: no pen_3ml rows in input');
}

return out;
