// n8n Code node: flag_still_edit
// Mode: Run Once for All Items
//
// Wire (linear — no Switch/IF):
//   grok_imagine_reel_still → **flag_still_edit** → prep_still_edit
//
// SHEETS-ONLY: still_edit_prompt comes from pick_creation / the sheet row.
// This node does not invent an edit prompt.

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

var j = Object.assign({}, ($input.first() && $input.first().json) || $json || {});
var pick = firstJson('pick_creation');

var stillUrl =
  grokStillUrl(firstJson('grok_imagine_reel_still')) ||
  grokStillUrl(j) ||
  String(j.still_url || '').trim() ||
  '';

if (!/^https:\/\//i.test(stillUrl)) {
  throw new Error(
    'flag_still_edit: no https still from grok_imagine_reel_still — run the still node first.'
  );
}
j.still_url = stillUrl;
j.source_still_url = stillUrl;

var prompt = String(
  j.still_edit_prompt ||
    pick.still_edit_prompt ||
    firstJson('map_sheet_fields').still_edit_prompt ||
    ''
).trim();

if (!prompt) {
  throw new Error(
    'SHEETS-ONLY: still_edit_prompt missing on sheet row creation_id=' +
      (j.creation_id || pick.creation_id || '?')
  );
}

j.still_edit_prompt = prompt;
j.still_edit_prompt_source = 'sheet';
if (!j.model_still) j.model_still = pick.model_still || '';
if (!j.aspect_ratio) j.aspect_ratio = pick.aspect_ratio || '';

return [{ json: j }];
