// n8n Code node: collect_tile_takes
// Workflow: site_tiles_flux_gen
// Mode: Run Once for All Items.
// After: upload_tile_to_drive   Before: sheets_update_tile
//
// Folds every take into the run's only sheet write. New takes are appended to the row's
// existing take_urls / take_sizes, so earlier takes Salvatore has not reviewed are kept.

var pick = $('pick_site_tile').first().json;
var checks = $('check_flux_still').all();
var uploads = $input.all();
if (uploads.length !== checks.length) {
  throw new Error(
    'collect_tile_takes: ' + checks.length + ' takes were checked but ' + uploads.length + ' reached Drive.'
  );
}

var urls = [];
var sizes = [];
var cost = 0;
uploads.forEach(function (u, i) {
  var c = checks[i].json;
  var link = u.json.webViewLink || (u.json.id ? 'https://drive.google.com/file/d/' + u.json.id + '/view' : '');
  if (!link) throw new Error('collect_tile_takes: take ' + c.take_index + ' has no Drive link.');
  urls.push(link);
  sizes.push(
    c.still_width + 'x' + c.still_height +
      (c.size_ok ? '' : ' (below ' + pick.min_width + 'x' + pick.min_height + ')')
  );
  if (c.still_cost_usd !== null) cost += c.still_cost_usd;
});

function appendTo(prev, next) {
  return prev ? prev + ' | ' + next.join(' | ') : next.join(' | ');
}

return [
  {
    json: {
      tile_id: pick.tile_id,
      take_urls: appendTo(pick.take_urls, urls),
      take_sizes: appendTo(pick.take_sizes, sizes),
      take_cost_usd: Math.round(cost * 10000) / 10000,
      times_used: pick.times_used + 1,
      last_used_at: $now.toISO(),
    },
  },
];
