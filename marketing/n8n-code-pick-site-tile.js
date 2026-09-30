// n8n Code node: pick_site_tile
// Workflow: site_tiles_flux_gen (sheet 24-site-tiles-4)
// Mode: Run Once for All Items. Settings → Execute Once = OFF (it must see every Active row).
// After: filter_tiles_active   Before: flux_2_max_still
//
// Takes the row whose tile_id matches choose_tile and emits one item per take
// (still_takes), so flux_2_max_still runs once per take. Every generation value comes
// from the sheet. An empty or malformed cell stops the run here, before any paid call.

var TEXT_FIELDS = [
  'tile_id',
  'status',
  'slug',
  'theme_filename',
  'model_still',
  'aspect_ratio',
  'output_format',
  'input_reference_urls',
  'still_prompt',
];

var NUMBER_FIELDS = ['still_n', 'still_takes', 'still_timeout_seconds', 'min_width', 'min_height', 'times_used'];

// OpenRouter's FLUX.2 endpoint record: n max 1, input_references max 8, no size/resolution.
var FLUX_ASPECTS = ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', 'auto'];
var FLUX_FORMATS = ['png', 'jpeg'];
var FLUX_MAX_REFS = 8;
var MAX_TAKES = 4;

function blank(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

function fail(row, msg) {
  var id = row && !blank(row.tile_id) ? String(row.tile_id).trim() + ': ' : '';
  throw new Error('pick_site_tile: ' + id + msg);
}

var chosen = String($('choose_tile').first().json.tile_id || '').trim().toUpperCase();
if (!chosen) fail(null, 'choose_tile.tile_id is empty. Type TILE-01, TILE-02, TILE-03 or TILE-04.');

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) fail(null, 'no Active rows came through filter_tiles_active.');

var matches = rows.filter(function (r) {
  return String(r.tile_id || '').trim().toUpperCase() === chosen;
});
if (!matches.length) {
  fail(null, chosen + ' is not an Active row on 24-site-tiles-4. Active: ' +
    rows.map(function (r) { return r.tile_id; }).join(', ') + '.');
}
if (matches.length > 1) fail(matches[0], 'tile_id appears on two rows, so the sheet write-back cannot tell them apart.');
var row = matches[0];

var pick = {};
TEXT_FIELDS.forEach(function (k) {
  if (blank(row[k])) fail(row, k + ' is empty.');
  pick[k] = String(row[k]).trim();
});
NUMBER_FIELDS.forEach(function (k) {
  if (blank(row[k]) || !isFinite(Number(row[k]))) {
    fail(row, k + ' must be a number (got ' + JSON.stringify(row[k]) + ').');
  }
  pick[k] = Number(row[k]);
});
pick.take_urls = blank(row.take_urls) ? '' : String(row.take_urls).trim();
pick.take_sizes = blank(row.take_sizes) ? '' : String(row.take_sizes).trim();

if (pick.model_still.indexOf('black-forest-labs/flux.2-') !== 0) {
  fail(row, 'model_still must be an OpenRouter black-forest-labs/flux.2-* slug (got ' + pick.model_still + ').');
}
if (FLUX_ASPECTS.indexOf(pick.aspect_ratio) === -1) {
  fail(row, 'aspect_ratio must be one of ' + FLUX_ASPECTS.join(', ') + ' (got ' + pick.aspect_ratio + ').');
}
if (FLUX_FORMATS.indexOf(pick.output_format) === -1) {
  fail(row, 'output_format must be png or jpeg (got ' + pick.output_format + ').');
}
if (pick.still_n !== 1) fail(row, 'still_n must be 1, FLUX.2 on OpenRouter returns one image per call (got ' + pick.still_n + ').');
if (Math.floor(pick.still_takes) !== pick.still_takes || pick.still_takes < 1 || pick.still_takes > MAX_TAKES) {
  fail(row, 'still_takes must be a whole number from 1 to ' + MAX_TAKES + ' (got ' + pick.still_takes + ').');
}
if (!(pick.still_timeout_seconds > 0)) fail(row, 'still_timeout_seconds must be above 0.');
if (!(pick.min_width > 0 && pick.min_height > 0)) fail(row, 'min_width and min_height must be above 0.');

var refs = pick.input_reference_urls.split('|').map(function (u) {
  return u.trim();
}).filter(function (u) {
  return u;
});
if (refs.length > FLUX_MAX_REFS) fail(row, 'input_reference_urls has ' + refs.length + ' images, FLUX.2 takes ' + FLUX_MAX_REFS + '.');
refs.forEach(function (u) {
  if (!/^https:\/\//i.test(u)) fail(row, 'input_reference_urls must be https URLs separated by | (got ' + u + ').');
});

var body = {
  model: pick.model_still,
  prompt: pick.still_prompt,
  n: pick.still_n,
  aspect_ratio: pick.aspect_ratio,
  output_format: pick.output_format,
  input_references: refs.map(function (u) {
    return { type: 'image_url', image_url: { url: u } };
  }),
};

var stamp = $now.toFormat('yyyyLLdd-HHmmss');
var out = [];
for (var t = 1; t <= pick.still_takes; t++) {
  out.push({
    json: Object.assign({}, pick, {
      take_index: t,
      take_file_name: pick.tile_id + '-' + pick.slug + '-' + stamp + '-take' + t,
      reference_count: refs.length,
      flux_body: body,
    }),
  });
}
return out;
