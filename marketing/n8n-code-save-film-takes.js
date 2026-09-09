// n8n Code node: save_film_takes
// Workflow: custom_vid_gen 1.5 (repurposed as MOTS-C film still factory)
// Mode: Run Once for All Items
// After: grok_imagine_still
// Before: sheets_update_still
//
// Collects every take URL from the Imagine response (n takes in one call)
// and joins them with " | " for the take_urls cell. Throws if zero URLs.

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

var resp = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_film_still');

var data = Array.isArray(resp.data) ? resp.data : [];
var urls = [];
for (var i = 0; i < data.length; i++) {
  var u = httpsUrl(data[i] && (data[i].url || data[i].image_url));
  if (u) urls.push(u);
}

if (!urls.length) {
  throw new Error(
    'save_film_takes: no https URLs in grok_imagine_still response. Check the Imagine call and model_still on the sheet.'
  );
}

var stillId = String(pick.still_id || '').trim();
if (!stillId) {
  throw new Error('save_film_takes: missing still_id from pick_film_still.');
}

var prior = String(pick.prior_take_urls || '').trim();
var joined = urls.join(' | ');
var allTakes = prior ? prior + ' | ' + joined : joined;

return [
  {
    json: {
      still_id: stillId,
      category: String(pick.category || ''),
      new_take_urls: joined,
      take_urls: allTakes,
      take_count_this_run: urls.length,
      times_used_next: (Number(pick.still_times_used) || 0) + 1,
      created_at: $now.toISO(),
    },
  },
];
