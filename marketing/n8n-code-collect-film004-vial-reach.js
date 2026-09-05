// n8n Code node: collect_film004_vial_reach
// Workflow: edit_film004_vial_reach (one-shot, unpublished)
// Mode: Run Once for All Items
// After: grok_imagine_edit_still
// Before: sheets_update_film004
//
// Appends edited https URLs onto FILM-004 take_urls.
// Does not emit picked_url or times_used. Does not touch FILM-001.

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

var grokItems = $input.all();
var preps = [];
try {
  preps = $('prep_film004_vial_reach').all();
} catch (e) {
  preps = [];
}

if (!grokItems.length) {
  throw new Error('collect_film004_vial_reach: no items from grok_imagine_edit_still.');
}
if (preps.length !== grokItems.length) {
  throw new Error(
    'collect_film004_vial_reach: prep/grok count mismatch (' +
      preps.length +
      '/' +
      grokItems.length +
      ').'
  );
}

var groups = {};
for (var i = 0; i < grokItems.length; i++) {
  var prep = (preps[i] && preps[i].json) || {};
  var stillId = String(prep.still_id || '').trim();
  if (stillId !== 'FILM-004') {
    throw new Error('collect_film004_vial_reach: expected FILM-004, got ' + stillId);
  }
  if (!groups[stillId]) {
    groups[stillId] = {
      prior: String(prep.prior_take_urls || '').trim(),
      edited: [],
    };
  }
  var j = (grokItems[i] && grokItems[i].json) || {};
  var data = Array.isArray(j.data) ? j.data : [];
  var u = '';
  if (data.length) u = httpsUrl(data[0].url || data[0].image_url);
  if (!u) u = httpsUrl(j.url || j.still_url);
  if (u) groups[stillId].edited.push(u);
}

var out = [];
var ids = Object.keys(groups);
for (var g = 0; g < ids.length; g++) {
  var id = ids[g];
  var edited = groups[id].edited;
  if (!edited.length) {
    throw new Error(
      'collect_film004_vial_reach: no https URLs from grok_imagine_edit_still for ' + id
    );
  }
  var joined = edited.join(' | ');
  var prior = groups[id].prior;
  out.push({
    json: {
      still_id: id,
      edited_take_urls: joined,
      take_urls: prior ? prior + ' | ' + joined : joined,
      edit_count_this_run: edited.length,
    },
  });
}

return out;
