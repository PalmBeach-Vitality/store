// n8n Code node: overlay_film014_planet
// Workflow: overlay_film014_alien_galaxy (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_planet
//
// FILM-014 looked like Earth and invited people/vials via the vial-label closer.
// Lock an alien-galaxy coast. Match planet copy on crash/warp rows.
// FILM-014 also clears take_urls and sets times_used to 0 so the factory re-picks it.
// Does NOT emit last_used_at / picked_url.

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

function mustReplaceAny(text, oldList, newStr, stillId) {
  var t = String(text || '');
  for (var i = 0; i < oldList.length; i++) {
    if (t.indexOf(oldList[i]) !== -1) {
      return t.split(oldList[i]).join(newStr);
    }
  }
  throw new Error(
    'overlay_film014_planet: ' +
      stillId +
      ' still_prompt missing expected phrase: ' +
      oldList[0].slice(0, 80)
  );
}

var PLANET =
  'Alien-galaxy luxury coast — same wide empty shoreline idea as Palm Beach, but NOT Earth and NOT Florida. The sand is from another galaxy: iridescent crushed-pearl lilac-gold dunes that glow faintly, never ordinary sugar-white Florida sand. The trees are extra-terrestrial, not Earth royal palms: taller glass-veined trunks, bioluminescent teal-violet fronds, unfamiliar silhouettes against the sky. Twin oversized moons hang huge and close in a deep violet-magenta sky with alien stars. Water is turquoise with a golden bioluminescent sheen. Not Miami, not Earth, not a rust-red desert, not a canyon.';

var STILL_014 =
  'Wide establishing shot, 9:16 vertical. Empty alien-galaxy luxury coastline filling the frame. ' +
  PLANET +
  ' Vast lonely coastal scale, no buildings, no boats, no cities, no Earth landmarks, no Miami skyline. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. NO other objects in the image: no people, no astronaut, no hands, no vial, no bottle, no wrist device, no watch, no gloves, no floating props. No readable text, no logos, no captions, no watermarks.';

var EDIT_014 =
  'Keep this exact empty coastline camera. Remove every person, hand, astronaut, vial, bottle, wrist device, and floating prop. Make the sand and trees look like another galaxy: iridescent lilac-gold glowing sand, glass-veined bioluminescent teal-violet trees that are not Earth palms, twin huge moons, violet-magenta sky. Not Earth, not Miami, not Florida.';

var OLD_PLANET =
  'Otherworldly Palm Beach coast: recognizable luxury beach — pale sugar-white sand, turquoise shallows, royal palms — but clearly another planet. Twin moons hang huge in a violet-amber sky, the ocean has a faint golden bioluminescent sheen at the horizon, palm fronds catch an alien teal-gold light, sand has a subtle opalescent sparkle, cinematic teal-orange grade. Not Earth Miami, not a rust-red desert, not a canyon';

var OLD_PLANET_HYPHEN =
  'Otherworldly Palm Beach coast: recognizable luxury beach - pale sugar-white sand, turquoise shallows, royal palms - but clearly another planet. Twin moons hang huge in a violet-amber sky, the ocean has a faint golden bioluminescent sheen at the horizon, palm fronds catch an alien teal-gold light, sand has a subtle opalescent sparkle, cinematic teal-orange grade. Not Earth Miami, not a rust-red desert, not a canyon';

var OLD_SAND =
  'Standing calmly on pale opalescent beach sand, twin moons and turquoise water behind, soft amber sky light';

var NEW_SAND =
  'Standing calmly on iridescent lilac-gold alien-galaxy beach sand, glass-veined bioluminescent teal-violet trees and twin huge moons behind, soft violet-amber sky light. Not Earth, not Florida palms';

var OLD_SHORE =
  'beside her smoking crashed ship on the pale otherworldly Palm Beach shoreline';

var NEW_SHORE =
  'beside her smoking crashed ship on the iridescent lilac-gold alien-galaxy shoreline';

var PLANET_IDS = {
  'FILM-015': 1,
  'FILM-020': 1,
  'FILM-025': 1,
};

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film014_planet: no rows from get_film_stills.');
}

var out = [];
var locked = 0;
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  if (stillId === 'FILM-014') {
    out.push({
      json: {
        still_id: stillId,
        still_prompt: capPrompt(STILL_014),
        still_edit_prompt: capPrompt(EDIT_014),
        take_urls: ' ',
        times_used: 0,
      },
    });
    locked += 1;
    continue;
  }
  var prompt = String(r.still_prompt || '');
  var next = prompt;
  if (PLANET_IDS[stillId]) {
    next = mustReplaceAny(next, [OLD_PLANET, OLD_PLANET_HYPHEN], PLANET, stillId);
  }
  if (stillId === 'FILM-016' && next.indexOf(OLD_SAND) !== -1) {
    next = next.split(OLD_SAND).join(NEW_SAND);
  }
  if (stillId === 'FILM-021' && next.indexOf(OLD_SHORE) !== -1) {
    next = next.split(OLD_SHORE).join(NEW_SHORE);
  }
  if (next === prompt) continue;
  out.push({
    json: {
      still_id: stillId,
      still_prompt: capPrompt(next),
      still_edit_prompt: String(r.still_edit_prompt || ''),
      take_urls: String(r.take_urls || ''),
      times_used: r.times_used === undefined || r.times_used === null ? '' : r.times_used,
    },
  });
  locked += 1;
}

if (locked < 4) {
  throw new Error(
    'overlay_film014_planet: expected FILM-014 plus matching coast rows, got ' + locked
  );
}

return out;
