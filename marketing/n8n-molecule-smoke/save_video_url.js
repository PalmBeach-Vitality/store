// n8n Code node: save_video_url
// After: switch_concat (true)   Before: sheets_update_video
//
// Feeds the run's only sheet write. A still-only or failed run never gets here, so
// times_used counts finished videos only.

var pick = $('pick_molecule_creation').first().json;

return [
  {
    json: {
      creation_id: pick.creation_id,
      still_url: $('save_still_url').first().json.still_url,
      hop1_video_url: $('prep_last_frame').first().json.hop1_video_url,
      last_frame_url: $('prep_kling_extend').first().json.start_image_url,
      hop2_video_url: $('prep_creatomate_concat').first().json.hop2_video_url,
      video_url: $input.first().json.url,
      times_used: pick.times_used + 1,
      last_used_at: $now.toISO(),
    },
  },
];
