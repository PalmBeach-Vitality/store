// n8n Code node: match_compound
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF (must see all Sheet 15 rows)
// After: get_caption_science
// Before: build_captions
//
// Resolves live .store product URLs (vial + pen) so writeback emails
// do not fall back to the homepage.
// Slugs: live shop https://palmbeach-vitality.store/shop/ (2026-09-17).

function val(obj, names, fallback) {
  if (fallback === undefined) fallback = '';
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return fallback;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '');
}

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function lev(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  var m = [];
  for (var i = 0; i <= b.length; i++) m[i] = [i];
  for (var j = 0; j <= a.length; j++) m[0][j] = j;
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      m[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

function productUrl(slug) {
  if (!slug) return '';
  return 'https://palmbeach-vitality.store/product/' + slug + '/';
}

var PRODUCT_LINKS = {
  '5amino1mq': { vial: '', pen: '5-amino-1mq-pen' },
  'aod9604': { vial: 'aod-9604', pen: '' },
  'bpc157': { vial: 'bpc-157-10mg-vial', pen: 'bpc-157-20mg-pen' },
  'bpc157tb500': { vial: 'wolverine-vial', pen: 'wolverine-pen' },
  'wolverine': { vial: 'wolverine-vial', pen: 'wolverine-pen' },
  'cagrilinitide': { vial: 'cagrilintide-vial', pen: 'cagrilintide-10mg-pen' },
  'cagrilintide': { vial: 'cagrilintide-vial', pen: 'cagrilintide-10mg-pen' },
  'cjc': { vial: 'cjc-vial', pen: 'cjc-1295-10mg-pen' },
  'cjc1295': { vial: 'cjc-vial', pen: 'cjc-1295-10mg-pen' },
  'cjcnodac': { vial: 'cjc-vial', pen: 'cjc-1295-10mg-pen' },
  'cjcnodacipamorelin': { vial: 'cjc-ipamorelin-vial', pen: 'cjc-ipamorelin-pen' },
  'cjcipamorelin': { vial: 'cjc-ipamorelin-vial', pen: 'cjc-ipamorelin-pen' },
  'dihexa': { vial: '', pen: 'dihexa-10mg-pen' },
  'dihexia': { vial: '', pen: 'dihexa-10mg-pen' },
  'dsip': { vial: '', pen: 'dsip-pen' },
  'epithalon': { vial: '', pen: 'epithalon-50mg-pen' },
  'epitalon': { vial: '', pen: 'epithalon-50mg-pen' },
  'ghkcu': { vial: 'ghk-cu-vial', pen: 'ghk-cu-pen' },
  'glow': { vial: 'glow-vial', pen: 'glow-pen' },
  'glutathione': { vial: '', pen: 'glutathione-600mg-pen' },
  'gsh': { vial: '', pen: 'glutathione-600mg-pen' },
  'igflr3': { vial: '', pen: 'igf-lr3-1mg-pen' },
  'longr3igf': { vial: '', pen: 'igf-lr3-1mg-pen' },
  'ipamorelin': { vial: 'ipamorelin-10mg-vial', pen: 'ipamorelin-30mg-pen' },
  'ipamorelinsolo': { vial: 'ipamorelin-10mg-vial', pen: 'ipamorelin-30mg-pen' },
  'ipasolo': { vial: 'ipamorelin-10mg-vial', pen: 'ipamorelin-30mg-pen' },
  'kisspeptin': { vial: '', pen: 'kisspeptin-10mg-pen' },
  'klow': { vial: 'klow-vial', pen: 'klow-pen' },
  'kpv': { vial: 'kpv-10mg-vial', pen: 'kpv-pen' },
  'melanotan2': { vial: 'melanotan-ii', pen: 'melanotan-ii-10mg-pen' },
  'melanotanii': { vial: 'melanotan-ii', pen: 'melanotan-ii-10mg-pen' },
  'motsc': { vial: 'mots-c-vial', pen: 'mots-c-pen' },
  'nadplus': { vial: 'nad-1000mg', pen: 'nad-pen-500mg' },
  'nad': { vial: 'nad-1000mg', pen: 'nad-pen-500mg' },
  'pt141': { vial: 'pt-141-vial', pen: 'pt-141-pen' },
  'retatrutide': { vial: 'retatrutide-60mg', pen: 'retatrutide-8mg-pen' },
  'selank': { vial: 'selank-vial', pen: 'selank-pen' },
  'semaglutide': { vial: 'semaglutide-25mg', pen: 'semaglutide-10mg-pen' },
  'semax': { vial: 'semax-vial', pen: 'semax-pen' },
  'sermorelin': { vial: 'sermorelin-vial', pen: 'sermorelin-pen' },
  'ss31': { vial: 'ss-31-vial', pen: 'ss-31-pen' },
  'ta1': { vial: 'ta-1', pen: 'ta-1-2' },
  'tb500': { vial: 'tb-500-vial', pen: 'tb-500-10mg-pen' },
  'tesamorelin': { vial: 'tesamorelin-vial', pen: 'tesamorelin-10mg-pen' },
  'tesamorelinipamorelin': { vial: 'tesamorelin-ipamorelin-vial', pen: 'tesamorelin-ipamorelin-pen' },
  'tesaipa': { vial: 'tesamorelin-ipamorelin-vial', pen: 'tesamorelin-ipamorelin-pen' },
  'tirzepatide': { vial: 'tirzepatide-100mg', pen: 'tirzepatide-10mg-pen' },
};

// Storefront names that are not Sheet 15 compound_name values.
var EXTRA_ALIASES = {
  bpc157tb500: ['wolverine', 'wolverineblend', 'wolverinestack', 'wolverinepeptide'],
};

function lookupProductLinks(compoundName, aliasesCsv) {
  var keys = [norm(compoundName)];
  String(aliasesCsv || '')
    .split(',')
    .forEach(function (a) {
      var k = norm(a);
      if (k) keys.push(k);
    });
  keys = keys.concat(EXTRA_ALIASES[norm(compoundName)] || []);
  var hit = null;
  for (var i = 0; i < keys.length; i++) {
    if (PRODUCT_LINKS[keys[i]]) {
      hit = PRODUCT_LINKS[keys[i]];
      break;
    }
  }
  hit = hit || { vial: '', pen: '' };
  var vialUrl = productUrl(hit.vial);
  var penUrl = productUrl(hit.pen);
  var storeUrl = vialUrl || penUrl || 'https://palmbeach-vitality.store/';
  return { vial_url: vialUrl, pen_url: penUrl, store_url: storeUrl };
}

var wantedRaw = String(firstJson('enter_compound').compound_name_input || '').trim();
if (!wantedRaw) {
  throw new Error('enter_compound is empty. Type a catalog name (example BPC-157).');
}

var rows = $input.all().map(function (i) {
  return i.json;
});
if (rows.length < 2) {
  throw new Error(
    'match_compound saw ' +
      rows.length +
      ' sheet row(s). Execute Once must be OFF. Import tab 15-caption-science-27.'
  );
}

var wanted = norm(wantedRaw);
var scored = [];

rows.forEach(function (r) {
  var name = String(val(r, ['compound_name'], '')).trim();
  if (!name) return;
  var aliases = String(val(r, ['aliases'], ''))
    .split(',')
    .map(function (a) {
      return norm(a);
    })
    .filter(Boolean);
  var keys = [norm(name)].concat(aliases);
  var extra = EXTRA_ALIASES[norm(name)] || [];
  for (var e = 0; e < extra.length; e++) keys.push(norm(extra[e]));
  var best = 99;
  keys.forEach(function (k) {
    if (!k) return;
    if (k === wanted) best = 0;
    else if (k.indexOf(wanted) !== -1 || wanted.indexOf(k) !== -1) best = Math.min(best, 1);
    else best = Math.min(best, lev(k, wanted));
  });
  scored.push({ row: r, name: name, dist: best });
});

scored.sort(function (a, b) {
  if (a.dist !== b.dist) return a.dist - b.dist;
  // Prefer exact compound_name over a blend that merely contains the typed token.
  var aExact = norm(a.name) === wanted ? 0 : 1;
  var bExact = norm(b.name) === wanted ? 0 : 1;
  return aExact - bExact;
});

var hit = scored[0];
if (!hit || hit.dist > 2) {
  var suggest = scored
    .slice(0, 5)
    .map(function (s) {
      return s.name;
    })
    .join(', ');
  throw new Error(
    'No catalog match for "' +
      wantedRaw +
      '". Closest names - ' +
      suggest +
      '. Use an exact Sheet 15 compound_name (Wolverine maps to BPC-157/TB-500).'
  );
}

var r = hit.row;
var links = lookupProductLinks(hit.name, val(r, ['aliases']));

return [
  {
    json: {
      compound_name: hit.name,
      compound_name_input: wantedRaw,
      match_distance: hit.dist,
      compound_id: val(r, ['compound_id']),
      aliases: val(r, ['aliases']),
      science_what: val(r, ['science_what']),
      science_focus: val(r, ['science_focus']),
      science_pathways: val(r, ['science_pathways']),
      tag2: val(r, ['tag2']),
      tag3: val(r, ['tag3']),
      tag4: val(r, ['tag4']),
      tag5: val(r, ['tag5']),
      store_url: links.store_url,
      vial_url: links.vial_url,
      pen_url: links.pen_url,
      input_row_count: rows.length,
    },
  },
];
