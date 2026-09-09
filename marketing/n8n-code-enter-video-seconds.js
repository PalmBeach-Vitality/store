// n8n Code node: enter_video_seconds
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: manual_trigger
// Before: get_chem_creations
//
// 15 = one Grok clip (generate max, grok-imagine-video-1.5).
// 30 = 15s generate (1.5) + 10s silent extend (grok-imagine-video only).
// Combined ≈ 25s. 1.5 cannot call /videos/extensions.

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
