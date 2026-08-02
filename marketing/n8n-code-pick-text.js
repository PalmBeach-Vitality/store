// n8n Code node: pick_text
// Type: Code | Mode: Run Once for All Items
// After: get_reel_text (Google Sheets read of 10-creatomate-text-1000, Return All)
// Before: map_creatomate_mods

const rows = $input.all().map((i) => i.json);
if (!rows.length) {
  throw new Error('No text rows. Import sheets/10-creatomate-text-1000.csv and Return All.');
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
  }
  // case / space insensitive
  const keys = Object.keys(obj || {});
  for (const want of names) {
    const normWant = want.toLowerCase().replace(/\s+/g, '_');
    const found = keys.find((k) => k.toLowerCase().replace(/\s+/g, '_') === normWant);
    if (found && String(obj[found]).trim() !== '') return obj[found];
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
    .replace(/\s*[·•]\s*\d+\s*\/\s*\d+\s*$/g, '')
    .trim();
}

function isActive(status) {
  const s = String(status || '').trim().toLowerCase();
  // empty status = Active (common after partial Sheets edits)
  return !s || s === 'active' || s === 'true' || s === '1' || s === 'yes';
}

const scored = rows
  .map((r) => ({
    raw: r,
    text_id: String(val(r, ['text_id', 'Text_ID', 'textId'], '')).trim(),
    rank: Number(val(r, ['rank'], 0)),
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
  }))
  .filter((r) => r.text_id && r.mod_fact_1)
  .filter((r) => isActive(r.status))
  .sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    return String(a.last_used_at).localeCompare(String(b.last_used_at));
  });

if (!scored.length) {
  const sample = rows[0] || {};
  const sampleKeys = Object.keys(sample).join(', ');
  const sampleStatus = val(sample, ['status'], '(missing)');
  const sampleId = val(sample, ['text_id', 'Text_ID', 'textId'], '(missing)');
  const sampleFact = val(sample, ['mod_fact_1'], '(missing)');
  throw new Error(
    'No valid Active text rows (need text_id, mod_fact_1). ' +
      'rows=' +
      rows.length +
      ' | keys=' +
      sampleKeys +
      ' | sample text_id=' +
      sampleId +
      ' | status=' +
      sampleStatus +
      ' | mod_fact_1=' +
      String(sampleFact).slice(0, 80)
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

