// n8n Code node: overlay_molecule_kling
// Workflow: overlay_molecule_kling (one-shot, then archive)
// Mode: Run Once for All Items. Execute Once = OFF
// After: get_chem_creations  Before: sheets_update_model_video
//
// Salvatore: molecule video is kie.ai Kling I2V (one Bearer API key).
// Writes model_video only onto 13-chem-breakdown-54.
// Does NOT emit times_used / last_used_at / still_url / video_url.
// Does NOT rewrite daily pick_molecule_creation.

var MODEL_VIDEO = 'kling-3.0-omni/image-to-video';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_molecule_kling: no Sheet 13 rows from get_chem_creations.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var row = rows[i];
  var id = String(row.creation_id || '').trim();
  if (!id) {
    throw new Error('overlay_molecule_kling: missing creation_id on row ' + i);
  }
  out.push({
    json: {
      creation_id: id,
      model_video: MODEL_VIDEO,
    },
  });
}

return out;
