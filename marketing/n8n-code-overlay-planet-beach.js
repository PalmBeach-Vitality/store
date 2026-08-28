// n8n Code node: overlay_planet_beach
// Workflow: overlay_wrist_lock_sheet18 (reused one-shot) or overlay_planet_beach_sheet18
// Mode: Run Once for All Items. Execute Once OFF.
// After: get_film_stills  Before: sheets_update_wrist_lock
//
// planet_establish was a rust-red canyon. Lock it to an otherworldly
// Palm Beach: recognizable luxury beach, clearly another planet.
// Matching crash / alien / warp rows so the world stays one planet.
// Does NOT emit times_used / last_used_at.

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

var PLANET_ESTABLISH =
  'Wide establishing shot of an otherworldly Palm Beach. You recognize it instantly as a luxury beach — pale sugar-white sand, turquoise shallows, a quiet line of royal palms — but it is clearly another planet. Twin moons hang huge and close in a violet-amber sky. The water holds a faint golden bioluminescent sheen at the horizon. Palm fronds catch an alien teal-gold rim light. The sand has a subtle opalescent sparkle, like crushed pearl. Vast lonely coastal scale, no buildings, no boats, no people, no creatures. Cinematic teal-orange grade. Not Earth Miami, not a rust-red desert, not a canyon. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks.';

var OLD_PLANET =
  'Rust-red desert planet, deep dusty canyon, distant twin moons in a violet-amber sky, wind-blown fine dust, cinematic teal-orange grade';

var NEW_PLANET =
  'Otherworldly Palm Beach coast: recognizable luxury beach — pale sugar-white sand, turquoise shallows, royal palms — but clearly another planet. Twin moons hang huge in a violet-amber sky, the ocean has a faint golden bioluminescent sheen at the horizon, palm fronds catch an alien teal-gold light, sand has a subtle opalescent sparkle, cinematic teal-orange grade. Not Earth Miami, not a rust-red desert, not a canyon';

var REPLACES = [
  [
    'at the bottom of a dusty red canyon, long skid trench behind it, hull scorched and dented but intact, thin smoke rising, dust settling',
    'on the pale otherworldly beach, a long skid trench in the sugar sand behind it, hull scorched and dented but intact, thin smoke rising, spray and sand settling',
  ],
  [
    'plunging into the rust-red canyon trailing fire and dust, heat glow on the hull, impact plume beginning at the canyon floor',
    'plunging toward the otherworldly Palm Beach shoreline trailing fire and spray, heat glow on the hull, impact plume beginning in the shallows and sand',
  ],
  [
    'Standing calmly on rust-red canyon ground, soft amber sky light',
    'Standing calmly on pale opalescent beach sand, twin moons and turquoise water behind, soft amber sky light',
  ],
  [
    'beside her smoking crashed ship in the red canyon',
    'beside her smoking crashed ship on the pale otherworldly Palm Beach shoreline',
  ],
  [
    'walks toward camera across the canyon floor',
    'walks toward camera along the pale shoreline',
  ],
  ['dusk canyon bokeh', 'dusk ocean and palm bokeh'],
  [
    'lifting off from the canyon floor on pillars of golden-white engine light, dust blasting outward',
    'lifting off from the pale beach on pillars of golden-white engine light, sand and spray blasting outward',
  ],
  [OLD_PLANET, NEW_PLANET],
];

function lockPrompt(text) {
  var t = String(text || '');
  for (var i = 0; i < REPLACES.length; i++) {
    t = t.split(REPLACES[i][0]).join(REPLACES[i][1]);
  }
  return capPrompt(t);
}

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_planet_beach: no rows from get_film_stills.');
}

var out = [];
var wroteEstablish = false;
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  if (!stillId) continue;

  var nextPrompt = String(r.still_prompt || '');
  if (stillId === 'FILM-014') {
    nextPrompt = PLANET_ESTABLISH;
    wroteEstablish = true;
  } else {
    nextPrompt = lockPrompt(nextPrompt);
  }

  if (nextPrompt === String(r.still_prompt || '')) continue;

  out.push({
    json: {
      still_id: stillId,
      still_prompt: nextPrompt,
    },
  });
}

if (!wroteEstablish) {
  throw new Error('overlay_planet_beach: FILM-014 planet_establish row missing.');
}
if (!out.length) {
  throw new Error('overlay_planet_beach: no still_prompt rows changed.');
}

return out;
