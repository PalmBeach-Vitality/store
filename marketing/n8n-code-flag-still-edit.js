// n8n Code node: flag_still_edit
// Mode: Run Once for All Items
//
// Wire (linear — no Switch/IF):
//   grok_imagine_reel_still → **flag_still_edit** → prep_still_edit
//
// CODE_STILL_EDIT_PROMPT wins first (what you type here). Sheet/pick is fallback only.

// ── EDIT THIS — this is the prompt Grok edit uses ───────────────────────
var CODE_STILL_EDIT_PROMPT =
  'CRITICAL COUNT FIX: Keep exactly ONE sealed Palm Beach Vitality hero product (one vial OR one pen). DELETE every extra vial/pen (background, soft-focus, smaller secondary, open/uncapped duplicates). Also DELETE any weighing scale, digital scale, platform scale, or metal tray under the product — place the single hero directly on the table/surface. After the edit the viewer must count exactly 1 product and zero scales. Do not restyle lighting, camera, label text, or environment. Do not add new products.';
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

var j = Object.assign({}, ($input.first() && $input.first().json) || $json || {});

// Always prefer the fresh Grok still (never a prior save_still_url from an old run)
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

// CODE prompt wins. Sheet/pick only if Code string is emptied on purpose.
var prompt = String(CODE_STILL_EDIT_PROMPT || '').trim();
if (!prompt) {
  prompt = String(
    j.still_edit_prompt ||
      firstJson('pick_creation').still_edit_prompt ||
      firstJson('map_sheet_fields').still_edit_prompt ||
      ''
  ).trim();
}

if (!prompt) {
  throw new Error('flag_still_edit: set CODE_STILL_EDIT_PROMPT at the top of this Code.');
}

j.still_edit_prompt = prompt;
j.still_edit_prompt_source = 'CODE_STILL_EDIT_PROMPT';
j.source_still_url = stillUrl;

return [{ json: j }];
