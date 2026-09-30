// n8n Code node: prep_creatomate_concat
// After: fal_kling_hop2   Before: creatomate_concat
//
// Joins the two hops on one track. Hop 1 is cut where prep_last_frame grabbed hop 2's
// first frame.

var pick = $('pick_molecule_creation').first().json;
var lastFrame = $('prep_last_frame').first().json;
var hop2 = $input.first().json;
var url = String((hop2.video && hop2.video.url) || '').trim();
if (!/^https:\/\//i.test(url)) {
  throw new Error(
    'prep_creatomate_concat: fal_kling_hop2 returned no video url' +
      (hop2.error ? ': ' + JSON.stringify(hop2.error) : '') +
      '. If it timed out, raise video_max_wait_seconds on the sheet.'
  );
}

return [
  {
    json: {
      hop2_video_url: url,
      creatomate_body: {
        output_format: pick.video_format,
        width: pick.render_width,
        height: pick.render_height,
        frame_rate: pick.render_frame_rate,
        elements: [
          { type: 'video', track: 1, source: lastFrame.hop1_video_url, trim_duration: lastFrame.hop1_cut_seconds },
          { type: 'video', track: 1, source: url },
        ],
      },
    },
  },
];
