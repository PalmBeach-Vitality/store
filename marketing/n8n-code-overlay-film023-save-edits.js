// n8n Code node: save_film023_edits
// Workflow: overlay_film023_use_this (one-shot, then archive)
// Mode: Run Once for All Items
// After: grok_imagine_edit_still
// Before: sheets_update_takes
//
// REPLACE take_urls with the source still plus this edit run.
// Keep picked_url as the source. Do not keep the underside generates.

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
var prep = firstJson('prep_film023_edit');
var sourceUrl = httpsUrl(prep.source_still_url);
if (!sourceUrl) {
  throw new Error('save_film023_edits: missing source_still_url from prep_film023_edit.');
}

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
  throw new Error('save_film023_edits: no https URLs from grok_imagine_edit_still.');
}

var allTakes = [sourceUrl].concat(edited).join(' | ');

return [
  {
    json: {
      still_id: 'FILM-023',
      still_edit_prompt: String(prep.still_edit_prompt || ''),
      picked_url: sourceUrl,
      take_urls: allTakes,
      edit_count_this_run: edited.length,
      times_used: Math.max(Number(prep.still_times_used) || 1, 1),
      last_used_at: $now.toISO(),
    },
  },
];
