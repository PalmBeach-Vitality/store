// n8n Code node: flag_still_edit
// Mode: Run Once for All Items
//
// Wire:
//   still_edit_instructions → **flag_still_edit** → if → prep_still_edit / save_still_url
//
// n8n Cloud: Fixed Set fields often arrive blank. Put your edit text HERE when needed.

// ── EDIT THIS each run (used when Set/Sheet prompt is empty) ──────────────
var CODE_STILL_EDIT_PROMPT =
  'Keep exactly one sealed hero product (one vial OR one pen). Remove any duplicate vials, pens, or extra products. Keep lighting, camera, label text, and background identical.';

// Set true to always take the edit branch (uses prompt above / Set / Sheet).
var FORCE_STILL_EDIT = true;
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

  var names = [
    'still_edit_instructions',
    'Still Edit Instructions',
    'pick_creation',
    'map_sheet_fields',
  ];
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
    grokStillUrl(firstJson('save_still_url')) ||
    grokStillUrl(j) ||
    '';
}

if (/^https:\/\//i.test(stillUrl)) {
  j.still_url = stillUrl;
}

var prompt = pickPrompt();
j.still_edit_prompt = prompt;
j.do_still_edit = FORCE_STILL_EDIT && prompt.length > 0;
j.still_edit_prompt_source =
  String((($input.first() && $input.first().json) || {}).still_edit_prompt || '').trim()
    ? 'input'
    : String((firstJson('still_edit_instructions').still_edit_prompt || '')).trim()
      ? 'still_edit_instructions'
      : String((firstJson('pick_creation').still_edit_prompt || '')).trim()
        ? 'pick_creation'
        : 'CODE_STILL_EDIT_PROMPT';

return [{ json: j }];
