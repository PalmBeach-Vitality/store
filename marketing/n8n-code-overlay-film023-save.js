// n8n Code node: save_film023_takes
// Workflow: overlay_film023_regen_from_prompt (one-shot, then archive)
// Mode: Run Once for All Items
// After: grok_imagine_still
// Before: sheets_update_takes
//
// REPLACE take_urls with this generate run only. Clear picked_url.
// Do not keep underside-device takes. Do not append.

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
var pick = firstJson('pick_film023');

var data = Array.isArray(resp.data) ? resp.data : [];
var urls = [];
for (var i = 0; i < data.length; i++) {
  var u = httpsUrl(data[i] && (data[i].url || data[i].image_url));
  if (u) urls.push(u);
}

if (!urls.length) {
  throw new Error('save_film023_takes: no https URLs in grok_imagine_still response.');
}

var joined = urls.join(' | ');

return [
  {
    json: {
      still_id: 'FILM-023',
      still_prompt: String(pick.still_prompt || ''),
      still_edit_prompt: String(pick.still_edit_prompt || ''),
      take_urls: joined,
      take_count_this_run: urls.length,
      times_used: (Number(pick.still_times_used) || 0) + 1,
      last_used_at: $now.toISO(),
      picked_url: '',
    },
  },
];
