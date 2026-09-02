// n8n Code node: overlay_film010_ship
// Workflow: overlay_film010_sleek_ship (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_ship
//
// FILM-010 was a tiny white shuttle with hands / vials / wrist devices.
// Lock still_prompt + still_edit_prompt. Also match FILM-009 and later hull copy.
// Does NOT emit times_used / last_used_at / take_urls / picked_url.

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

function mustReplace(text, oldStr, newStr, stillId) {
  var t = String(text || '');
  if (t.indexOf(oldStr) === -1) {
    throw new Error(
      'overlay_film010_ship: ' +
        stillId +
        ' still_prompt missing expected phrase: ' +
        oldStr.slice(0, 80)
    );
  }
  return t.split(oldStr).join(newStr);
}

var HULL =
  'A MUCH LARGER sleek stealth interceptor, capital-scout scale: elongated arrowhead wedge silhouette, needle nose flaring into a broad blended-wing rear, dark matte charcoal gunmetal plating with dense panel lines and greebles. The faceted cockpit canopy is tiny relative to the hull so the ship reads as a long vessel, not a toy, not a one-person fighter, not a white luxury shuttle. Thin cyan-blue energy strips run along the sides and dorsal spine. Twin circular rear engine nozzles with a cool blue inner glow. One subtle thin navy-and-gold identity stripe on the upper hull. No readable hull text.';

var STILL_009 =
  'Establishing still, 9:16 vertical. Three-quarter front view of a starship isolated in a clean deep-space void. The ship fills most of the frame. ' +
  HULL +
  ' Soft key from a distant sun, empty star field, no other craft, no planets, no debris. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. NO other objects in the image: no people, no hands, no astronaut, no vial, no wrist device, no watch, no gloves, no floating props. No readable text, no logos, no captions, no watermarks.';

var STILL_010 =
  'Establishing still, 9:16 vertical. Clean FULL SIDE PROFILE of the same starship in flight, isolated, hull filling the frame from needle nose to twin engines. ' +
  HULL +
  ' Identical hull design and paint as the three-quarter view. Empty deep-space void, no other craft, no planets, no debris. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. NO other objects in the image: no people, no hands, no astronaut, no vial, no wrist device, no watch, no gloves, no floating props. No readable text, no logos, no captions, no watermarks.';

var SHIP_EDIT =
  'Keep this exact ship angle and lighting. Remove every extra object: no hands, no vials, no wrist devices, no people, no gloves, no floating props. Make the ship MUCH LARGER and sleeker: elongated dark charcoal gunmetal arrowhead interceptor, tiny cockpit canopy relative to the hull, cyan-blue energy strips, twin circular blue engines. Empty space only.';

var HULL_OLD =
  'Sleek compact single-pilot starship, smooth white hull with navy-and-gold accent striping, no readable text on the hull, cinematic teal-orange grade.';

var EXCEPT_OLD =
  'No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks, no people.';

var EXCEPT_NEW =
  'No readable text, no logos, no captions, no watermarks. NO people, NO hands, NO astronaut, NO vial, NO wrist device, NO gloves, NO floating props.';

var FULL = {
  'FILM-009': { still: STILL_009, edit: SHIP_EDIT },
  'FILM-010': { still: STILL_010, edit: SHIP_EDIT },
};

var HULL_IDS = {
  'FILM-015': 1,
  'FILM-020': 1,
  'FILM-025': 1,
};

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film010_ship: no rows from get_film_stills.');
}

var out = [];
var locked = 0;
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  if (FULL[stillId]) {
    out.push({
      json: {
        still_id: stillId,
        still_prompt: capPrompt(FULL[stillId].still),
        still_edit_prompt: capPrompt(FULL[stillId].edit),
      },
    });
    locked += 1;
    continue;
  }
  if (!HULL_IDS[stillId]) continue;
  var prompt = String(r.still_prompt || '');
  prompt = mustReplace(prompt, HULL_OLD, HULL, stillId);
  if (prompt.indexOf(EXCEPT_OLD) !== -1) {
    prompt = prompt.split(EXCEPT_OLD).join(EXCEPT_NEW);
  }
  out.push({
    json: {
      still_id: stillId,
      still_prompt: capPrompt(prompt),
    },
  });
  locked += 1;
}

if (locked !== 5) {
  throw new Error(
    'overlay_film010_ship: expected 5 ship rows (009/010/015/020/025), got ' + locked
  );
}

return out;
