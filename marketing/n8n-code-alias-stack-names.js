// n8n Code node: alias_stack_names
// Mode: Run Once for All Items
// Lab:    get_reel_creations → **alias_stack_names** → pull_sheet_row
// Pen:    filter_pen_active → **alias_stack_names** → pull_sheet_row
// Landscape: filter_creations_active → **alias_stack_names** → pull_sheet_row
//
// Catalog nicknames ↔ sheet chemical strings (exact groups, longest first).
// KLOW = KPV / BPC-157 / TB-500 / GHK-Cu
// GLOW = BPC-157 / TB-500 / GHK-Cu
// Wolverine = BPC-157 / TB-500
// Does not invent prompts. Rewrites in-memory compound_name + label text
// so choose_compound can match and the still prints the catalog nickname.

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function nick(name, cid) {
  var n = norm(name);
  var id = norm(cid);
  if (
    n === 'klow' ||
    n === 'klowblend' ||
    n === 'klowpeptide' ||
    n === 'kpvbpc157tb500ghkcu' ||
    id === 'pklo001' ||
    id === 'vklo001'
  ) {
    return 'KLOW';
  }
  if (
    n === 'glow' ||
    n === 'glowblend' ||
    n === 'glowpeptide' ||
    n === 'bpc157tb500ghkcu' ||
    id === 'pglo001' ||
    id === 'vglo001'
  ) {
    return 'GLOW';
  }
  if (
    n === 'wolverine' ||
    n === 'wolverineblend' ||
    n === 'wolverinestack' ||
    n === 'bpc157tb500' ||
    id === 'pwol001' ||
    id === 'vwol001'
  ) {
    return 'Wolverine';
  }
  return name;
}

function rewriteText(s) {
  s = String(s == null ? '' : s);
  if (!s) return s;
  s = s.split('KPV / BPC-157 / TB-500 / GHK-Cu').join('KLOW');
  s = s.split('KPV/BPC-157/TB-500/GHK-Cu').join('KLOW');
  s = s.split('BPC-157 / TB-500 / GHK-Cu').join('GLOW');
  s = s.split('BPC-157/TB-500/GHK-Cu').join('GLOW');
  s = s.split('BPC-157 / TB-500').join('Wolverine');
  s = s.split('BPC-157/TB-500').join('Wolverine');
  return s;
}

var TEXT_KEYS = [
  'compound_name',
  'compoundName',
  'label_compound',
  'material_detail',
  'scene_brief',
  'video_prompt',
  'video_motion_prompt',
  'still_edit_prompt',
  'caption_lock',
  'lab_item',
  'hero_style',
];

return $input.all().map(function (item) {
  var json = Object.assign({}, item.json || {});
  var raw = json.compound_name || json.compoundName || json.label_compound || '';
  var cid = json.compound_id || json.compoundId || '';
  var k;
  for (var i = 0; i < TEXT_KEYS.length; i++) {
    k = TEXT_KEYS[i];
    if (json[k] != null && String(json[k]) !== '') {
      json[k] = rewriteText(json[k]);
    }
  }
  var mapped = nick(raw, cid);
  if (mapped) json.compound_name = mapped;
  return { json: json };
});
