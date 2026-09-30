// n8n Code node: prep_last_frame
// After: fal_kling_hop1   Before: creatomate_last_frame
//
// Grabs hop 1 one frame before its requested length. prep_creatomate_concat cuts hop 1 at
// the same moment, and hop 2 starts from this frame, so the 30s cut has no repeated or
// skipped frame at the seam.

var pick = $('pick_molecule_creation').first().json;
var hop1 = $input.first().json;
var url = String((hop1.video && hop1.video.url) || '').trim();
if (!/^https:\/\//i.test(url)) {
  throw new Error(
    'prep_last_frame: fal_kling_hop1 returned no video url' +
      (hop1.error ? ': ' + JSON.stringify(hop1.error) : '') +
      '. If it timed out, raise video_max_wait_seconds on the sheet.'
  );
}
var cut = pick.hop1_duration_seconds - 1 / pick.render_frame_rate;

return [
  {
    json: {
      hop1_video_url: url,
      hop1_cut_seconds: cut,
      creatomate_body: {
        output_format: pick.last_frame_format,
        width: pick.render_width,
        height: pick.render_height,
        snapshot_time: cut,
        elements: [{ type: 'video', track: 1, source: url }],
      },
    },
  },
];
