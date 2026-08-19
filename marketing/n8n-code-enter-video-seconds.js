// n8n Code node: enter_video_seconds
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: manual_trigger
// Before: get_chem_creations
//
// 15 = one Grok clip (generate max).
// 30 = two 15s jobs: generate 15s, then one 15s silent extend.

var VIDEO_SECONDS = 15;

var n = Number(VIDEO_SECONDS);
if (n !== 30) n = 15;

return [
  {
    json: {
      video_seconds: n,
    },
  },
];
