// n8n Code node: flag_still_edit
// Mode: Run Once for All Items
//
// Wire:
//   still_edit_instructions → **flag_still_edit** → if → prep_still_edit / save_still_url
//
// Forces do_still_edit (boolean) for the IF node, and backfills still_url from
// grok_imagine_reel_still when the Set expression left it empty.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function grokStillUrl(obj) {
  if (!obj) return '';
  if (obj.data && obj.data[0] && obj.data[0].url) return String(obj.data[0].url).trim();
  if (obj.still_url) return String(obj.still_url).trim();
  return '';
}

var j = Object.assign({}, ($json || {}));

var stillUrl = String(j.still_url || '').trim();
if (!/^https:\/\//i.test(stillUrl)) {
  stillUrl =
    grokStillUrl(firstJson('grok_imagine_reel_still')) ||
    grokStillUrl(firstJson('save_still_url')) ||
    grokStillUrl(j) ||
    '';
}

if (/^https:\/\//i.test(stillUrl)) {
  j.still_url = stillUrl;
}

var prompt = String(j.still_edit_prompt || j.edit_prompt || '').trim();
j.still_edit_prompt = prompt;
j.do_still_edit = true;

return [{ json: j }];
