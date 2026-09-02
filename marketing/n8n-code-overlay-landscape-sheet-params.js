// n8n Code node: overlay_landscape_sheet_params
// Workflow: overlay_landscape_sheet_params (one-shot, then archive)
// Mode: Run Once for Each Item. Execute Once = OFF
// After: get_landscape_rows  Before: sheets_update_landscape_params
//
// Adds the Grok params that used to live in n8n nodes onto the sheet
// so Vid_gen_landscape_scenes can stay sheets-only.
// Does NOT emit times_used / last_used_at / reel_still_url / video_url.

var STILL_EDIT =
  'CRITICAL COUNT FIX: Keep exactly ONE sealed Palm Beach Vitality hero product (one vial OR one pen). DELETE every extra vial/pen (background, soft-focus, smaller secondary, open/uncapped duplicates). Also DELETE any weighing scale, digital scale, platform scale, or metal tray under the product — place the single hero directly on the table/surface. After the edit the viewer must count exactly 1 product and zero scales. Do not restyle lighting, camera, label text, or environment. Do not add new products.';

var row = ($input.item && $input.item.json) || $json || {};
var id = String(row.creation_id || '').trim();
if (!id) {
  throw new Error('overlay_landscape_sheet_params: missing creation_id');
}

function keep(name) {
  var s = String(row[name] == null ? '' : row[name]).trim();
  return s;
}

return {
  json: {
    creation_id: id,
    still_edit_prompt: keep('still_edit_prompt') || STILL_EDIT,
    wait_seconds: keep('wait_seconds') || '200',
    audio: keep('audio') || 'FALSE',
    still_n: keep('still_n') || '1',
  },
};
