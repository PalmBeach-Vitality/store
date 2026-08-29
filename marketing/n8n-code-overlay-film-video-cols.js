// n8n Code node: overlay_film_video_cols
// Workflow: overlay_film023_024_final (second pass)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_keepers
//
// Writes I2V columns onto every 18-motsc-film-stills row.
// Does not rewrite still_prompt or picked_url.

var MOTIONS = {
  "FILM-001": "Slow cinematic push-in on her face. Hair drifts. Amber wrist-screen holds steady. Silent. Lock this exact portrait.",
  "FILM-002": "Slow orbit from three-quarter toward her left cheek. Ponytail shifts. Device stays on the left wrist. Silent.",
  "FILM-003": "True left-profile hold with a tiny dolly right. Left arm hangs. Square device stays on the left wrist joint. Silent.",
  "FILM-004": "Slow full-body pull-back, boots to hair. Suit fabric breathes. Left-wrist square device stays locked. Silent.",
  "FILM-005": "Macro push on the square gunmetal box on TOP of the left wrist. Amber screen flickers. Fingers stay visible. Silent.",
  "FILM-006": "Low camera tilt up the left wrist. Box sits on the dorsal TOP, never underneath. MOTS-C toward the elbow. Silent.",
  "FILM-007": "Slow orbit of the full MOTS-C 10mg vial. Gold liquid turns. Label locked. No extra hands. Silent.",
  "FILM-008": "Slow push on the spent vial. Last gold film slides down glass. Cap and label locked. Silent.",
  "FILM-009": "Slow three-quarter fly-by of the intact arrowhead ship. Cyan strips pulse. No wreckage. Silent.",
  "FILM-010": "Side-on tracking shot of the intact interceptor. Engine glow breathes. Hull stays sleek. Silent.",
  "FILM-011": "Slow cockpit push through the canopy. Console lights pulse. No extra pilots. Silent.",
  "FILM-012": "Push into the circular core well, amber glow rising. Brushed metal locked. Silent.",
  "FILM-013": "Hold on the dim core well. Amber light fades then steadies. Same metal, no new props. Silent.",
  "FILM-014": "Wide establish of the pale beach planet. Clouds drift. One sun. Empty shore. Silent.",
  "FILM-015": "Slow crash-site push. Light hull scoring only, ship intact. Sand skitters. Silent.",
  "FILM-016": "Slow push on the alien face. Skin sheen shifts. No extra limbs. Silent.",
  "FILM-017": "Three-quarter orbit of the alien. Cloth moves. Anatomy locked. Silent.",
  "FILM-018": "Close on the vial seating into the core. Glow dimming. Hands locked. Silent.",
  "FILM-019": "She looks down at the left-wrist box. Head tilts. Device on TOP of the wrist. Silent.",
  "FILM-020": "Crash-site hold, light damage only. Heat haze. Ship intact. Silent.",
  "FILM-021": "Macro on the spent vial in hand. Last drop moves. Label locked. Silent.",
  "FILM-022": "Alien approaches across the pale beach. Slow walk. One figure. Silent.",
  "FILM-023": "Handoff close-up. Sunset through the MOTS-C vial. Fingers on the blue cap. Device on TOP of the left wrist. Silent.",
  "FILM-024": "Hand seats the vial into the circular brushed-metal well. Amber glow rises. Silent.",
  "FILM-025": "Intact arrowhead ship lifts off the pale beach on golden-white pillars. Sand blasts out, then star-lines. Light hull damage only. Silent."
};

var rows = $input.all().map(function (i) { return i.json; });
if (!rows.length) {
  throw new Error('overlay_film_video_cols: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (!stillId) continue;
  var motion = MOTIONS[stillId];
  if (!motion) {
    throw new Error('overlay_film_video_cols: missing video_motion_prompt for ' + stillId);
  }
  out.push({
    json: {
      still_id: stillId,
      video_motion_prompt: motion,
      model_video: 'grok-imagine-video-1.5',
      duration_seconds: '15',
      video_resolution: '1080p',
      audio: 'false',
      wait_seconds: '120',
    },
  });
}

if (out.length !== 25) {
  throw new Error('overlay_film_video_cols: expected 25 rows, got ' + out.length);
}

return out;
