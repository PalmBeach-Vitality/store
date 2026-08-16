// n8n Code node: flag_still_edit
// Mode: Run Once for All Items
//
// Wire:
//   still_edit_instructions → **flag_still_edit** → if → prep_still_edit / save_still_url
//
// Resolves still_edit_prompt from the Set node / pick / sheet, sets do_still_edit
// as a real boolean, and backfills still_url from grok when blank.

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

function pickPrompt() {
  var names = [
    'still_edit_instructions',
    'Still Edit Instructions',
    'pick_creation',
    'map_sheet_fields',
  ];
  var input = ($input.first() && $input.first().json) || $json || {};
  var fromInput = String(input.still_edit_prompt || input.edit_prompt || '').trim();
  if (fromInput) return fromInput;

  for (var i = 0; i < names.length; i++) {
    var o = firstJson(names[i]);
    var p = String(o.still_edit_prompt || o.edit_prompt || '').trim();
    if (p) return p;
  }
  return '';
}

var j = Object.assign({}, ($input.first() && $input.first().json) || $json || {});

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

var prompt = pickPrompt();
j.still_edit_prompt = prompt;
// Boolean for IF (compare to true, not "true"). True only when there is text to edit with.
j.do_still_edit = prompt.length > 0;

return [{ json: j }];
