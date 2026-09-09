// n8n Code node: overlay_film020_reentry
// Workflow: overlay_film020_reentry (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film020
//
// 1080p ONLY. Never write 720p.
// FILM-020 only. Does not touch FILM-001 or FILM-004.
// Crash-row still is atmospheric REENTRY, not the ground impact.
// Source still is the exact FILM-009 ship.

function squeeze(s) {
  var t = String(s || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  return t.trim();
}

function capPrompt(s) {
  s = squeeze(s);
  if (s.length > 7900) s = s.slice(0, 7900);
  return s;
}

var BRANCH = 'cursor/film020-reentry-4c4b';
var SHIP_STILL =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film020-reentry.jpeg';

var SHIP =
  'EXACT same interceptor as FILM-009 — copy this hull, do not invent a new ship. Elongated needle-arrowhead wedge, capital-scout scale, dark matte charcoal gunmetal plating with dense panel lines and greebles. Twin circular rear engine nacelles ONLY — two engines, never three — cool cyan-blue inner glow. Thin cyan-blue energy strips along the sides and dorsal spine. Narrow faceted cockpit canopy on the upper spine, tiny relative to the hull. One thin navy-and-gold identity stripe on the dorsal spine. No readable hull text. Not a toy, not a white shuttle, not a wreck.';

var BEACH =
  'Alien-galaxy luxury coast — same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.';

var still_prompt = capPrompt(
  'Keyframe, 9:16 vertical. Atmospheric REENTRY from space, not the crash, not ground impact. The EXACT FILM-009 ship screams nose-first into the new planet atmosphere. ' +
    SHIP +
    ' Top of the frame is still black deep space and stars. Below, the curved limb of the FILM-014 alien-galaxy beach planet fills the lower frame. ' +
    BEACH +
    ' The ship is wrapped in a THICK orange-white plasma sheath, a hard bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks, glowing ionized air, sparks peeling off the leading edges. Lots of burn-up. Hull stays INTACT — light scoring under the plasma only. NOT breaking apart. NOT a wreck. NOT torn open. NOT the crash. NOT hitting the beach. High drama, spectacle. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text, no logos, no captions, no watermarks. NO people, NO hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props.'
);

var still_edit_prompt = capPrompt(
  'Keep this EXACT FILM-009 ship. Do not redesign it. Same needle-arrowhead charcoal gunmetal hull, same twin circular cyan engines (two only, never three), same thin cyan side strips, same tiny spine canopy, same thin navy-and-gold dorsal stripe, same three-quarter nose-down angle. Change ONLY the environment to atmospheric REENTRY from space into the FILM-014 planet atmosphere. Top of frame still deep space and stars. Below, the curved limb of the FILM-014 beach planet: ' +
    BEACH +
    ' Wrap THIS same ship in a THICK orange-white plasma sheath, bow shock, and a long roaring fire trail. Heavy incandescent streaks. Lots of burn-up. Hull stays intact, light scoring only. This is REENTRY, not the crash. Do not show ground impact. Do not wreck the ship. Do not add a third engine. Do not add people, vials, or text.'
);

var video_motion_prompt =
  'Exact FILM-009 interceptor on atmospheric reentry. Starts in space, then dives into the atmosphere. Thick orange-white plasma sheath, bow shock, long fire trail. Twin cyan engines hold. FILM-014 planet limb grows below. Hull stays intact. Not the crash. Not impact. Silent.';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film020_reentry: no rows from get_film_stills.');
}

var out = [];
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId !== 'FILM-020') continue;
  out.push({
    json: {
      still_id: stillId,
      picked_url: SHIP_STILL,
      still_prompt: still_prompt,
      still_edit_prompt: still_edit_prompt,
      video_motion_prompt: video_motion_prompt,
      video_url: '',
      n: '1',
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
      duration_seconds: '8',
      video_resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: 'false',
      wait_seconds: '300',
      video_start_url: 'https://openrouter.ai/api/v1/videos',
    },
  });
}

if (out.length !== 1) {
  throw new Error('overlay_film020_reentry: expected FILM-020, wrote ' + out.length);
}

return out;
