// n8n Code node: flag_still_edit
// Mode: Run Once for All Items
//
// Wire (edit branch only):
//   switch_still_path (edit) → **flag_still_edit** → prep_still_edit
//
// Routing is the Switch node (still_path = edit|skip). This node only
// prepares the edit prompt + still_url for the edit path.

// ── EDIT THIS when still_path = edit ─────────────────────────────────────
// HARD single-hero cleanup — always remove extra vials/pens.
var CODE_STILL_EDIT_PROMPT =
  'CRITICAL COUNT FIX: Keep exactly ONE sealed Palm Beach Vitality hero product visible (one vial OR one pen — never both). DELETE every extra vial and every extra pen — including background vials, soft-focus vials, smaller secondary vials, open/uncapped duplicate vials, and any product that is not the single main hero. After the edit the viewer must count exactly 1 product. Do not restyle lighting, camera angle, label text, or environment. Do not add new products. Do not leave a second vial for depth.';
// ─────────────────────────────────────────────────────────────────────────

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
  var input = ($input.first() && $input.first().json) || $json || {};
  var fromInput = String(input.still_edit_prompt || input.edit_prompt || '').trim();
  if (fromInput) return fromInput;

  var names = ['choose_still_path', 'still_edit_instructions', 'pick_creation', 'map_sheet_fields'];
  for (var i = 0; i < names.length; i++) {
    var o = firstJson(names[i]);
    var p = String(o.still_edit_prompt || o.edit_prompt || '').trim();
    if (p) return p;
  }

  return String(CODE_STILL_EDIT_PROMPT || '').trim();
}

var j = Object.assign({}, ($input.first() && $input.first().json) || $json || {});

var stillUrl = String(j.still_url || '').trim();
if (!/^https:\/\//i.test(stillUrl)) {
  stillUrl =
    grokStillUrl(firstJson('grok_imagine_reel_still')) ||
    grokStillUrl(firstJson('choose_still_path')) ||
    grokStillUrl(firstJson('save_still_url')) ||
    grokStillUrl(j) ||
    '';
}

if (/^https:\/\//i.test(stillUrl)) {
  j.still_url = stillUrl;
}

var prompt = pickPrompt();
j.still_edit_prompt = prompt;
j.still_path = 'edit';
j.still_edit_prompt_source = String(CODE_STILL_EDIT_PROMPT || '').trim() === prompt
  ? 'CODE_STILL_EDIT_PROMPT'
  : 'upstream';

if (!prompt) {
  throw new Error(
    'flag_still_edit: empty CODE_STILL_EDIT_PROMPT — set edit text at top of this Code, or use Switch skip.'
  );
}

return [{ json: j }];
