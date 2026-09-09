// n8n Code node: overlay_film020_space_still
// Workflow: overlay_film020_space_still (one-shot, unpublished)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_film020
//
// FILM-020 only. Writes SPACE reentry still + 6s 1080p Kling motion.
// Clears FILM-020 video_url so one I2V can run. Does not touch FILM-001 or FILM-004.

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

var BRANCH = 'cursor/film020-space-still-4c4b';
var SHIP_STILL =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/' +
  BRANCH +
  '/marketing/stills/film020-space-reentry.jpeg';

var SHIP =
  'EXACT same interceptor as FILM-009 — copy this hull, do not invent a new ship. Elongated needle-arrowhead wedge, capital-scout scale, dark matte charcoal gunmetal plating with dense panel lines and greebles. Twin circular rear engine nacelles ONLY — two engines, never three — cool cyan-blue inner glow. Thin cyan-blue energy strips along the sides and dorsal spine. Narrow faceted cockpit canopy on the upper spine, tiny relative to the hull. One thin navy-and-gold identity stripe on the dorsal spine. No readable hull text. Not a toy, not a white shuttle, not a wreck.';

var SPACE =
  'High-altitude atmospheric REENTRY from deep space. Top two-thirds of the frame is black outer space and stars. Twin oversized moons may hang far away as distant space bodies only. The ship is at orbital altitude, far above any surface. Below, ONLY a thin curved planetary limb with a glowing violet-magenta atmosphere band. No surface detail. No coastline. No beach. No sand. No dunes. No trees. No palms. No water. No shoreline. No ground. No landscape. Not a flyover. Not a landing.';

var still_prompt = capPrompt(
  'Keyframe, 9:16 vertical. Atmospheric REENTRY from space, not the crash, not ground impact. The EXACT FILM-009 ship screams nose-first into the planet atmosphere. ' +
    SHIP +
    ' ' +
    SPACE +
    ' The ship is wrapped in a THICK orange-white plasma sheath, a hard bow shock, and a long roaring fire trail of atmospheric burn-up. Heavy incandescent streaks, glowing ionized air, sparks peeling off the leading edges. Lots of burn-up. Hull stays INTACT — light scoring under the plasma only. NOT breaking apart. NOT a wreck. NOT torn open. NOT the crash. NOT hitting the ground. High drama, spectacle. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text, no logos, no captions, no watermarks. NO people, NO hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props.'
);

var still_edit_prompt = capPrompt(
  'Keep this EXACT FILM-009 ship. Do not redesign it. Same needle-arrowhead charcoal gunmetal hull, same twin circular cyan engines (two only, never three), same thin cyan side strips, same tiny spine canopy, same thin navy-and-gold dorsal stripe, same three-quarter nose-down angle. Change ONLY the environment to high-altitude atmospheric REENTRY from deep space. ' +
    SPACE +
    ' Wrap THIS same ship in a THICK orange-white plasma sheath, bow shock, and a long roaring fire trail. Heavy incandescent streaks. Lots of burn-up. Hull stays intact, light scoring only. This is REENTRY from space, not the crash. Do not show ground. Do not show a beach. Do not show trees. Do not show sand. Do not show water. Do not wreck the ship. Do not add a third engine. Do not add people, vials, or text.'
);

var video_motion_prompt =
  'Exact FILM-009 interceptor on high-altitude atmospheric reentry from deep space. Starts in black space and stars, then dives into the atmosphere. Thick orange-white plasma sheath, bow shock, long fire trail. Twin cyan engines hold. Only a thin curved planetary limb with a violet-magenta atmosphere band grows below. No beach. No sand. No trees. No water. No ground. Hull stays intact. Not the crash. Not impact. Silent.';

var rows = $input.all().map(function (i) {
  return i.json;
});
if (!rows.length) {
  throw new Error('overlay_film020_space_still: no rows from get_film_stills.');
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
      duration_seconds: '6',
      video_resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: 'false',
      wait_seconds: '300',
      video_start_url: 'https://openrouter.ai/api/v1/videos',
    },
  });
}

if (out.length !== 1) {
  throw new Error('overlay_film020_space_still: expected FILM-020, wrote ' + out.length);
}

return out;
