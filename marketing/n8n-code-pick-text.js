// n8n Code node: pick_text
// Type: Code | Mode: Run Once for All Items
// After: get_reel_text (Return All on 10-creatomate-text-1000)
// Before: map_creatomate_from_url
//
// Filters by product_name from Set node video_url_input, then picks least-used
// Active row. Facts 1–3 are product-specific science lines; intro / 4 / 5 unchanged.

const rows = $input.all().map((i) => i.json);
if (!rows.length) {
  throw new Error('No text rows. Import sheets/10-creatomate-text-1000.csv and Return All.');
}

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
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
  // One highest-priority strip per loop so 'research card N' wins over bare 'card N'
  let t = String(text || '').trim();
  const rules = [
    /\s*[—–-]?\s*research card\s*\d+\s*$/i,
    /\s*[·•⋅∙.\u00b7]?\s*set\s*\d+\s*$/i,
    /\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/,
    /\s*[·•⋅∙.\u00b7]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i,
    /\s*[-–—|]\s*(ref|motif|card|line|cta)\s*\d+\s*$/i,
    /\s+(ref|motif|card|line|cta)\s*\d+\s*$/i,
  ];
  while (true) {
    let progressed = false;
    for (const re of rules) {
      const nxt = t.replace(re, '').trim();
      if (nxt !== t) {
        t = nxt;
        progressed = true;
        break;
      }
    }
    if (!progressed) {
      const nxt = t.replace(/\s*[—–-]\s*research\s*$/i, '').trim();
      if (nxt !== t) {
        t = nxt;
        continue;
      }
      break;
    }
  }
  return t;
}

function cleanIntro(text) {
  return cleanFact(text);
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
  if (rowNum >= 2) return `PBVita-Text-${String(rowNum - 1).padStart(4, '0')}`;
  return '';
}

/** Normalize for matching: lowercase, keep + , collapse other punctuation to spaces */
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\+/g, '+')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const urlInput = firstJson('video_url_input');
const wantedRaw = String(
  urlInput.product_name || urlInput.compound_name || urlInput.Product_Name || ''
).trim();

if (!wantedRaw) {
  throw new Error(
    'Enter product_name on Set node video_url_input (e.g. BPC-157, NAD+, Tesamorelin/Ipamorelin).'
  );
}

const wanted = normName(wantedRaw);

const scored = rows
  .map((r) => {
    const rank = Number(val(r, ['rank', 'text_rank'], 0));
    return {
      text_id: buildTextId(r),
      rank,
      product_name: String(val(r, ['product_name', 'Product_Name', 'compound_name'], '')).trim(),
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
  // EXACT match only — never let "Tesamorelin" steal "Tesamorelin/Ipamorelin"
  .filter((r) => normName(r.product_name) === wanted)
  .sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    return String(a.last_used_at).localeCompare(String(b.last_used_at));
  });

if (!scored.length) {
  const products = [
    ...new Set(
      rows
        .map((r) => String(val(r, ['product_name', 'Product_Name'], '')).trim())
        .filter(Boolean)
    ),
  ].sort();
  throw new Error(
    'No Active text rows for product_name="' +
      wantedRaw +
      '" (exact match required). Try exact sheet value. Available: ' +
      (products.slice(0, 40).join(', ') || '(none — re-import CSV with product_name column)')
  );
}

const pick = scored[0];

return [
  {
    json: {
      text_id: pick.text_id,
      text_rank: pick.rank,
      product_name: pick.product_name,
      mod_intro: pick.mod_intro,
      mod_fact_1: pick.mod_fact_1,
      mod_fact_2: pick.mod_fact_2,
      mod_fact_3: pick.mod_fact_3,
      mod_fact_4: pick.mod_fact_4,
      mod_fact_5: pick.mod_fact_5,
      mod_disclaimer: pick.mod_disclaimer,
      text_times_used: pick.times_used,
      text_last_used_at: pick.last_used_at,
      requested_product_name: wantedRaw,
    },
  },
];
