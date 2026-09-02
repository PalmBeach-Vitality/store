// n8n Code node: collect_edited_takes
// Workflow: edit_film001_wrist_stills
// Mode: Run Once for All Items
// After: grok_imagine_edit_still
// Before: sheets_update_still
//
// Appends edited https URLs onto FILM-001 take_urls. Does not emit times_used.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

var items = $input.all();
var splitFirst = firstJson('split_film001_edits');
var stillId = String(splitFirst.still_id || 'FILM-001').trim();
var prior = String(splitFirst.prior_take_urls || '').trim();

var edited = [];
for (var i = 0; i < items.length; i++) {
  var j = (items[i] && items[i].json) || {};
  var data = Array.isArray(j.data) ? j.data : [];
  var u = '';
  if (data.length) u = httpsUrl(data[0].url || data[0].image_url);
  if (!u) u = httpsUrl(j.url || j.still_url);
  if (u) edited.push(u);
}

if (!edited.length) {
  throw new Error(
    'collect_edited_takes: no https URLs from grok_imagine_edit_still. Check the edit call.'
  );
}

var joined = edited.join(' | ');
var allTakes = prior ? prior + ' | ' + joined : joined;

return [
  {
    json: {
      still_id: stillId,
      edited_take_urls: joined,
      take_urls: allTakes,
      edit_count_this_run: edited.length,
    },
  },
];
