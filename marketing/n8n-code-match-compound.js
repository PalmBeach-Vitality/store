// n8n Code node: match_compound
// Workflow: peptide_caption_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF (must see all Sheet 15 rows)
// After: get_caption_science
// Before: build_captions

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

var wantedRaw = String(firstJson('enter_compound').compound_name_input || '').trim();
if (!wantedRaw) {
  throw new Error('enter_compound is empty. Type a catalog name (example: BPC-157).');
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
  return a.dist - b.dist;
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
      '". Closest: ' +
      suggest +
      '. Use an exact Sheet 15 compound_name.'
  );
}

var r = hit.row;
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
      store_url: val(r, ['store_url']) || 'www.palmbeach-vitality.store',
      input_row_count: rows.length,
    },
  },
];
