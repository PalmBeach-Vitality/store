// n8n Code node: prep_imagine_request
// Workflow: image_generation_buffer -3-image-scenes-150
// Mode: Run Once for All Items
// After: Wait (captions already parsed)  Before: GROK_Imagine
//
// SHEETS-ONLY generate mapper. Prompt / model / aspect / resolution / n
// come from the 3-image-scenes-150 row (catalog-pen overlay writes them
// onto pen_3ml_scene). No template URLs, no image-edits, no overlay poster,
// no FDA burn-in, no BLUE_IDS in Code.
//
// GROK_Imagine posts $json.imagine_body_string to $json.imagine_url.

function must(obj, names, label) {
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  throw new Error(
    'prep_imagine_request: empty sheet field ' +
      label +
      ' on ' +
      String(obj.scene_id || obj.compound_name || '?') +
      '. Overlay catalog look onto pen_3ml_scene first.'
  );
}

function capPrompt(text) {
  var t = String(text || '');
  while (t.indexOf('  ') !== -1) t = t.split('  ').join(' ');
  t = t.trim();
  if (t.length > 7900) t = t.slice(0, 7900);
  return t;
}

var row = ($input.first() && $input.first().json) || {};
var prep = {};
try {
  prep = $('Prep_day_variant').first().json || {};
} catch (e) {
  prep = {};
}

var src = Object.assign({}, prep, row);
var prompt = capPrompt(must(src, ['still_prompt', 'scene_brief'], 'still_prompt or scene_brief'));
var model = String(must(src, ['model_still'], 'model_still')).trim();
var aspect = String(must(src, ['aspect_ratio'], 'aspect_ratio')).trim();
var resolution = String(must(src, ['still_resolution'], 'still_resolution')).trim();
var n = Number(must(src, ['still_n'], 'still_n'));
if (!n) {
  throw new Error('prep_imagine_request: still_n is not a number');
}

var imagineUrl = 'https://api.x.ai/v1/images/generations';
var imagineBody = {
  model: model,
  prompt: prompt,
  n: n,
  aspect_ratio: aspect,
  resolution: resolution,
};

return [
  {
    json: Object.assign({}, src, {
      imagine_mode: 'pen_generate',
      imagine_url: imagineUrl,
      imagine_body: imagineBody,
      imagine_body_string: JSON.stringify(imagineBody),
    }),
  },
];
