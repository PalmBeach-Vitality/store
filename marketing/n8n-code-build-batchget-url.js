// n8n Code node: build_batchget_url
// Workflow: sheet_format_as_tables
// Mode: Run Once for All Items
// After: http_get_meta
// Before: http_batchget_dims
//
// Build values:batchGet URLs (header row + column A) without pulling prompt cells.

function a1Sheet(title) {
  return "'" + String(title || '').replace(/'/g, "''") + "'";
}

var items = $input.all();
if (!items.length) throw new Error('build_batchget_url: no spreadsheet metadata.');

return items.map(function (item) {
  var meta = item.json || {};
  var id = String(meta.spreadsheetId || '').trim();
  if (!id) throw new Error('build_batchget_url: spreadsheetId missing.');
  var sheets = (meta.sheets || [])
    .map(function (s) {
      return s.properties || {};
    })
    .filter(function (p) {
      return p.sheetId !== undefined && p.title && !p.hidden;
    });
  if (!sheets.length) throw new Error('build_batchget_url: no visible tabs on ' + id);

  var ranges = [];
  sheets.forEach(function (p) {
    var a1 = a1Sheet(p.title);
    ranges.push(a1 + '!1:1');
    ranges.push(a1 + '!A:A');
  });
  var qs = ranges
    .map(function (r) {
      return 'ranges=' + encodeURIComponent(r);
    })
    .join('&');
  var batchGetUrl =
    'https://sheets.googleapis.com/v4/spreadsheets/' +
    id +
    '/values:batchGet?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&' +
    qs;

  return {
    json: {
      spreadsheetId: id,
      title: (meta.properties && meta.properties.title) || id,
      sheets: meta.sheets || [],
      batchGetUrl: batchGetUrl,
    },
  };
});
