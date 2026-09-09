// n8n Code node: flag_still_edit
// Workflow: Vid_gen_landscape_scenes -500-peptide-wellness-scenes
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: grok_imagine_reel_still
// Before: prep_still_edit
//
// SHEETS-ONLY: still_edit_prompt comes from pick_creation (sheet row).
// still_url is runtime from grok_imagine_reel_still.

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

var pick = firstJson('pick_creation');
var j = Object.assign({}, pick, ($input.first() && $input.first().json) || $json || {});

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

var prompt = String(pick.still_edit_prompt || j.still_edit_prompt || '').trim();
if (!prompt) {
  throw new Error(
    'SHEETS-ONLY: still_edit_prompt missing on sheet row creation_id=' +
      (pick.creation_id || j.creation_id || '?')
  );
}

j.still_url = stillUrl;
j.source_still_url = stillUrl;
j.still_edit_prompt = prompt;
j.still_edit_prompt_source = 'sheet';

return [{ json: j }];
