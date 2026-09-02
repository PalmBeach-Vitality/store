// n8n Code node: overlay_film023_use_this
// Workflow: overlay_film023_use_this (one-shot, then archive)
// Mode: Run Once for All Items
// After: get_film_stills
// Before: sheets_update_lock
//
// Sal's vial_handoff_23.jpg is the FILM-023 source.
// Writes still_prompt, still_edit_prompt, picked_url, take_urls.
// Does not write times_used.

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

var PICKED_023 =
  'https://raw.githubusercontent.com/PalmBeach-Vitality/store/cursor/film018-match-013-core-4c4b/marketing/stills/film023-handoff-source.jpg';

var STILL_023 =
  "Money-shot keyframe, 9:16 vertical. Extreme close-up of the handoff: the alien's slender pale marble-white fingers gripping the blue cap from above-left, the glowing vial seated in the astronaut's BARE LEFT open palm from below, label facing camera perfectly readable: Clear pharmaceutical-grade glass multi-use injection vial, vibrant blue plastic flip-off cap on a brushed-silver aluminum crimp over a rubber septum, clean white wrap-around label with a dark maroon DNA double-helix icon centered at the top, the name 'MOTS-C' in large bold dark maroon sans-serif printed once, a solid dark maroon rectangle badge with white text exactly '10mg'. The liquid inside glows a warm golden-orange, backlit by sunset so light passes through the glass onto the palm. Her LEFT hand is BARE skin — palm, fingers, and thumb fully visible, anatomically correct. NO gloves. NO gauntlets. NO space-suit gloves. NO tactical gloves. SAME square left-wrist device as FILM-005 / FILM-006: a rectangular blocky SQUARE gunmetal box strapped exactly onto the TOP of her LEFT wrist — the BACK / dorsal / outer side, same as a normal watch, housing no wider than the wrist. NEVER underneath the wrist. NEVER on the inner wrist. NEVER on the palm side. Because the palm faces the camera, the device sits on the far / top side of the wrist — the camera sees the metal band and the side / edge of the box at the bottom-left of frame, like a watch band. NOT a face-on product shot of the screen on the inner wrist. Square housing, square amber-orange screen with only slightly rounded corners, square or rectangular buttons and sliders on the SIDES of the box. SAME screen orientation as FILM-005 and FILM-006: the screen sits on the back of the wrist facing OUT, not toward the palm. The TOP of the screen (MOTS-C text) points toward her forearm / elbow; the BOTTOM of the screen points toward her fingers. NOT rotated 90 degrees. NOT sideways toward the thumb. NOT a long rectangle running along the forearm. Screen shows only the square amber-orange MOTS-C readout — no heart-rate, no temperature, no 36.7, no medical HUD. NO ROUND SHAPES. ALWAYS on her LEFT wrist. Golden sunset backlight, dusk ocean and palm bokeh. Photoreal cinematic sci-fi commercial still, 8k, HDR, razor sharp. No readable text anywhere except the vial label and the wrist-device screen. No logos, no captions, no watermarks. No faces. No extra people. No gloves.";

var EDIT_023 =
  'Keep this exact handoff: sunset backlight through the MOTS-C 10mg vial, pale marble fingers on the blue cap, tan BARE LEFT palm under the vial. Do not change the camera, lighting, hands, or vial. The metal link watch is already on the TOP of the LEFT wrist — that sit is correct. REPLACE only that link watch with the SAME square gunmetal MOTS-C device as FILM-005 / FILM-006. Keep it on the TOP / BACK of the wrist, like this watch. Camera should still see only the band / side / edge at the bottom-left. NEVER move it onto the inner wrist or palm. NOT a face-on screen on the palm side. Screen text stays MOTS-C only. No gloves. No other changes.';

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_film023_use_this: no rows from get_film_stills.');
}

for (var i = 0; i < rows.length; i++) {
  var stillId = String((rows[i] || {}).still_id || '').trim();
  if (stillId === 'FILM-023') {
    return [
      {
        json: {
          still_id: stillId,
          still_prompt: capPrompt(STILL_023),
          still_edit_prompt: capPrompt(EDIT_023),
          picked_url: PICKED_023,
          take_urls: PICKED_023,
        },
      },
    ];
  }
}

throw new Error('overlay_film023_use_this: FILM-023 missing on the sheet.');
