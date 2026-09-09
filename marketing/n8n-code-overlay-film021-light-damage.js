// n8n Code node: overlay_film021_light_damage
// Workflow: overlay_film021_light_damage (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_damage
//
// FILM-021 keeper ...-7910d329.png: ship is a torn-open wreck.
// Lock light-damage-only on every crash / landed-ship row.
// Writes picked_url on FILM-021. Does not touch take_urls / times_used.

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
      'overlay_film021_light_damage: ' +
        stillId +
        ' still_prompt missing expected phrase: ' +
        oldStr.slice(0, 80)
    );
  }
  return t.split(oldStr).join(newStr);
}

var PICKED_021 =
  'https://imgen.x.ai/xai-imgen/xai-tmp-imgen-8b66d32b-6ae2-9f50-941f-07875a234619-7910d329.png';

var LIGHT =
  'The ship is the SAME sleek dark gunmetal arrowhead interceptor as FILM-010. Hull stays intact and only SLIGHTLY damaged — light scorch marks, light scoring, maybe a thin wisp of smoke. NOT a wreck. NOT a complete crash ruin. NOT torn open. NOT a broken sphere. NOT missing panels. NOT major structural damage.';

var EDIT_LIGHT =
  'Keep this exact camera and subjects. Change the ship only: SAME sleek dark gunmetal arrowhead interceptor as FILM-010, hull intact, only SLIGHTLY damaged — light scorch, thin smoke. NOT a wreck. NOT torn open. NOT a broken sphere. NOT major structural damage.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film021_light_damage: no rows from get_film_stills.');
}

var seen = {};
var out = [];
for (var i = 0; i < rows.length; i++) {
  var r = rows[i] || {};
  var stillId = String(r.still_id || '').trim();
  var prompt = String(r.still_prompt || '');
  var json = {
    still_id: stillId,
    picked_url: stillId === 'FILM-021' ? PICKED_021 : String(r.picked_url || ''),
  };

  if (stillId === 'FILM-015') {
    seen[stillId] = 1;
    json.still_prompt = capPrompt(
      mustReplace(
        prompt,
        'Wide shot of the crashed starship on the pale otherworldly beach, a long skid trench in the sugar sand behind it, hull scorched and dented but intact, thin smoke rising, spray and sand settling.',
        'Wide shot of the landed starship on the pale otherworldly beach, a short skid mark in the sand behind it, spray and sand settling. ' +
          LIGHT,
        stillId
      )
    );
    json.still_edit_prompt = capPrompt(EDIT_LIGHT);
    out.push({ json: json });
  }

  if (stillId === 'FILM-020') {
    seen[stillId] = 1;
    json.still_prompt = capPrompt(
      mustReplace(
        prompt,
        'The starship plunging toward the otherworldly Palm Beach shoreline trailing fire and spray, heat glow on the hull, impact plume beginning in the shallows and sand.',
        'The starship plunging toward the otherworldly Palm Beach shoreline trailing a thin heat-glow and spray, impact plume beginning in the shallows. Hull stays INTACT — only SLIGHTLY damaged, light scoring. NOT breaking apart. NOT a wreck. NOT torn open. NOT major structural damage.',
        stillId
      )
    );
    json.still_prompt = capPrompt(
      mustReplace(json.still_prompt, 'High drama, spectacle, motion blur on debris.', 'High drama, spectacle. No wreckage debris.', stillId)
    );
    json.still_edit_prompt = capPrompt(
      'Keep this exact plunge camera. Hull stays intact: only light scoring and heat glow. NOT breaking apart. NOT a wreck. NOT major structural damage.'
    );
    out.push({ json: json });
  }

  if (stillId === 'FILM-021') {
    seen[stillId] = 1;
    json.still_prompt = capPrompt(
      mustReplace(
        prompt,
        'She stands beside her smoking crashed ship on the iridescent lilac-gold alien-galaxy shoreline',
        'She stands beside her landed ship on the iridescent lilac-gold alien-galaxy shoreline. ' +
          LIGHT,
        stillId
      )
    );
    json.still_edit_prompt = capPrompt(
      'Keep this EXACT woman, face, hair, flight suit, vial, and pose. Change the background ship only: SAME sleek dark gunmetal arrowhead interceptor as FILM-010, hull intact, only SLIGHTLY damaged — light scorch, thin smoke. NOT a wreck. NOT torn open. NOT a broken sphere. NOT major structural damage. Do not change her face.'
    );
    json.picked_url = PICKED_021;
    out.push({ json: json });
  }

  if (stillId === 'FILM-022') {
    seen[stillId] = 1;
    json.still_prompt = capPrompt(
      mustReplace(
        prompt,
        'The crashed ship is small in the background.',
        'The SAME sleek dark gunmetal arrowhead interceptor as FILM-010 sits small in the background, hull intact, only SLIGHTLY damaged — light scorch, thin smoke. NOT a wreck. NOT torn open. NOT a broken sphere. NOT major structural damage.',
        stillId
      )
    );
    json.still_edit_prompt = capPrompt(EDIT_LIGHT);
    out.push({ json: json });
  }

  if (stillId === 'FILM-025') {
    seen[stillId] = 1;
    json.still_prompt = capPrompt(
      mustReplace(
        prompt,
        'The repaired starship lifting off from the pale beach',
        'The repaired starship lifting off from the pale beach, hull fully intact, no wreckage, no major damage, same sleek arrowhead as FILM-010',
        stillId
      )
    );
    json.still_edit_prompt = capPrompt(
      'Keep this exact lift-off camera. Hull fully intact, no wreckage, no major damage. SAME sleek dark gunmetal arrowhead interceptor as FILM-010.'
    );
    out.push({ json: json });
  }
}

var need = ['FILM-015', 'FILM-020', 'FILM-021', 'FILM-022', 'FILM-025'];
for (var n = 0; n < need.length; n++) {
  if (!seen[need[n]]) {
    throw new Error('overlay_film021_light_damage: missing ' + need[n] + ' on the sheet.');
  }
}

return out;
