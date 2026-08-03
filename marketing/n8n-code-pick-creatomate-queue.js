// n8n Code node: pick_queue_row
// Type: Code | Mode: Run Once for All Items
// After: get_creatomate_queue (Return All on 11-creatomate-render-queue)
// Before: map_creatomate_from_queue
//
// Picks the first Ready row that has a public_video_url filled in.

const rows = $input.all().map((i) => i.json);
if (!rows.length) {
  throw new Error('No queue rows. Import sheets/11-creatomate-render-queue.csv');
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return fallback;
}

const ready = rows
  .map((r) => ({
    queue_id: String(val(r, ['queue_id'], '')).trim(),
    rank: Number(val(r, ['rank'], 0)) || 0,
    status: String(val(r, ['status'], 'Ready')).trim(),
    public_video_url: String(val(r, ['public_video_url', 'video_url'], '')).trim(),
    compound_name: String(val(r, ['compound_name'], '')).trim(),
    creation_id: String(val(r, ['creation_id'], '')).trim(),
    notes: String(val(r, ['notes'], '')).trim(),
    times_used: Number(val(r, ['times_used'], 0)) || 0,
    last_used_at: String(val(r, ['last_used_at'], '')),
    row_number: Number(val(r, ['row_number'], 0)) || 0,
    raw: r,
  }))
  .filter((r) => /^ready$/i.test(r.status))
  .filter((r) => /^https?:\/\//i.test(r.public_video_url))
  .sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    return Number(a.rank) - Number(b.rank);
  });

if (!ready.length) {
  throw new Error(
    'No Ready queue rows with public_video_url. Paste a catbox/R2/B2 .mp4 URL into 11-creatomate-render-queue and set status=Ready.'
  );
}

const pick = ready[0];

return [
  {
    json: {
      queue_id: pick.queue_id,
      rank: pick.rank,
      status: pick.status,
      public_video_url: pick.public_video_url,
      compound_name: pick.compound_name,
      creation_id: pick.creation_id,
      notes: pick.notes,
      times_used: pick.times_used,
      last_used_at: pick.last_used_at,
      row_number: pick.row_number,
      template_id: '06cd4ffd-906c-45ed-bf33-e8d2bed4312b',
    },
  },
];
