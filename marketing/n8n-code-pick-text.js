// n8n Code node: pick_text
// Type: Code | Mode: Run Once for All Items
// After: get_reel_text (Return All on 10-creatomate-text-1000)
// Before: map_creatomate_mods / prep_creatomate
//
// Note: some Sheet copies have blank text_id cells — we rebuild from rank.

const rows = $input.all().map((i) => i.json);
if (!rows.length) {
  throw new Error('No text rows. Import sheets/10-creatomate-text-1000.csv and Return All.');
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
  }
  const keys = Object.keys(obj || {});
  for (const want of names) {
    const normWant = want.toLowerCase().replace(/\s+/g, '_');
    const found = keys.find((k) => k.toLowerCase().replace(/\s+/g, '_') === normWant);
    if (found && obj[found] !== undefined && obj[found] !== null && String(obj[found]).trim() !== '') {
      return obj[found];
    }
  }
  return fallback;
}

function cleanFact(text) {
  return String(text || '')
    .replace(/\s*[·•⋅∙.\u00b7]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .replace(/\s*[-–—|]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .replace(/\s+(ref|motif|card|line|cta)\s*\d+\s*$/i, '')
    .trim();
}

function cleanIntro(text) {
  return String(text || '')
    .replace(/\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/g, '')
    .trim();
}

function isActive(status) {
  const s = String(status || '').trim().toLowerCase();
  return !s || s === 'active' || s === 'true' || s === '1' || s === 'yes';
}

function buildTextId(r) {
  const fromSheet = String(val(r, ['text_id', 'Text_ID', 'textId'], '')).trim();
  if (fromSheet) return fromSheet;
  const rank = Number(val(r, ['rank', 'text_rank'], 0));
  if (rank > 0) return `PBVita-Text-${String(rank).padStart(4, '0')}`;
  const rowNum = Number(val(r, ['row_number', 'rowNumber'], 0));
  // header is row 1 → data starts row 2 → Text-0001
  if (rowNum >= 2) return `PBVita-Text-${String(rowNum - 1).padStart(4, '0')}`;
  return '';
}

const scored = rows
  .map((r) => {
    const rank = Number(val(r, ['rank', 'text_rank'], 0));
    return {
      text_id: buildTextId(r),
      rank,
      mod_intro: cleanIntro(val(r, ['mod_intro'])),
      mod_fact_1: cleanFact(val(r, ['mod_fact_1'])),
      mod_fact_2: cleanFact(val(r, ['mod_fact_2'])),
      mod_fact_3: cleanFact(val(r, ['mod_fact_3'])),
      mod_fact_4: cleanFact(val(r, ['mod_fact_4'])),
      mod_fact_5: cleanFact(val(r, ['mod_fact_5'])),
      mod_disclaimer: val(
        r,
        ['mod_disclaimer'],
        'For laboratory research use only. Not for human use or consumption.'
      ),
      status: val(r, ['status'], 'Active'),
      times_used: Number(val(r, ['times_used'], 0)) || 0,
      last_used_at: String(val(r, ['last_used_at'], '')),
    };
  })
  .filter((r) => r.text_id && r.mod_fact_1)
  .filter((r) => isActive(r.status))
  .sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    return String(a.last_used_at).localeCompare(String(b.last_used_at));
  });

if (!scored.length) {
  const sample = rows[0] || {};
  throw new Error(
    'No valid Active text rows. rows=' +
      rows.length +
      ' | keys=' +
      Object.keys(sample).join(', ') +
      ' | text_id_raw=' +
      JSON.stringify(sample.text_id) +
      ' | rank=' +
      JSON.stringify(sample.rank) +
      ' | row_number=' +
      JSON.stringify(sample.row_number) +
      ' | status=' +
      val(sample, ['status'], '(missing)') +
      ' | mod_fact_1=' +
      String(val(sample, ['mod_fact_1'], '(missing)')).slice(0, 80)
  );
}

const pick = scored[0];
return [
  {
    json: {
      text_id: pick.text_id,
      text_rank: pick.rank,
      mod_intro: pick.mod_intro,
      mod_fact_1: pick.mod_fact_1,
      mod_fact_2: pick.mod_fact_2,
      mod_fact_3: pick.mod_fact_3,
      mod_fact_4: pick.mod_fact_4,
      mod_fact_5: pick.mod_fact_5,
      mod_disclaimer: pick.mod_disclaimer,
      text_times_used: pick.times_used,
      text_last_used_at: pick.last_used_at,
    },
  },
];
]
