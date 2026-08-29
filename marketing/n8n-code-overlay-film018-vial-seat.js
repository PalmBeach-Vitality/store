// n8n Code node: overlay_film018_vial_seat
// Workflow: overlay_film018_vial_seat (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_seat
//
// Exec 1628 metal-core takes are keepers for the well, but the vial
// hovers / sits on the rim. Lock a reseat-only still_edit_prompt.
// Also tighten still_prompt seating for later gens. Do not touch
// take_urls / times_used / picked_url.

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

var VIAL =
  "Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue plastic flip-off cap on a brushed-silver aluminum crimp over a rubber septum, clean white wrap-around label with a dark maroon DNA double-helix icon centered at the top, the name 'MOTS-C' in large bold dark maroon sans-serif printed once, a solid dark maroon rectangle badge with white text exactly '10mg'.";

var CORE =
  'SAME engine core as FILM-013 / core_port_dim: a circular recessed well of concentric dark charcoal brushed-metal rings, hex bolts, segmented gunmetal plates. Thin gold energy conduits run as radial spokes recessed into the metal like veins. Camera looks slightly down into that circular well. NOT a faceted crystal ring. NOT a glass jewel socket. NOT a nest of thick ribbed rubber hoses filling the frame. NOT a large radar or HUD monitor as the hero.';

var SEAT =
  'The vial is dropped fully into the center of the circular well: glass base flush on the socket floor, locked in like a power cartridge in a recessed bay — not hovering, not floating above the hole, not perched on the rim, not offset. Real contact shadow where glass meets metal. Perfectly vertical, label facing camera.';

var STILL_018 =
  'Opening keyframe, 9:16 vertical. Macro of the SAME engine core port as FILM-013. ' +
  CORE +
  ' ' +
  VIAL +
  ' ' +
  SEAT +
  ' The golden liquid glow is fading and flickering (not full-bright, not fully dead). Gold conduits dim one by one. A red warning glow begins to pulse at the frame edges. Tense cinematic mood. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No people, no astronaut, no hands, no wrist device, no extra vials. No readable text anywhere except the vial label. No logos, no captions, no watermarks.';

var EDIT_018 =
  'Keep this EXACT circular brushed-metal core: same concentric rings, same hex bolts, same radial gold vein conduits, same camera looking slightly down into the well. Do not redesign the core. Only reseat the MOTS-C 10mg vial: drop it fully into the center of the circular well so the glass base sits flush on the socket floor, locked in like a power cartridge in a recessed bay. Not hovering. Not floating above the hole. Not perched on the rim. Not offset to one side. Perfectly vertical, label facing camera. Add a real contact shadow where glass meets metal. Keep the fading flickering glow and red warning at the edges. No people, no extra vials, no hands.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film018_vial_seat: no rows from get_film_stills.');
}

var out = [];
var seen = false;
for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId === 'FILM-018') {
    seen = true;
    out.push({
      json: {
        still_id: stillId,
        still_prompt: capPrompt(STILL_018),
        still_edit_prompt: capPrompt(EDIT_018),
      },
    });
  }
}

if (!seen) {
  throw new Error('overlay_film018_vial_seat: FILM-018 missing on the sheet.');
}

return out;
