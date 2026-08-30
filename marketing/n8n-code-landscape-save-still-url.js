// n8n Code node: save_still_url
// Workflow: Vid_gen_landscape_scenes -500-peptide-wellness-scenes
// Mode: Run Once for All Items
// After: grok_imagine_reel_still
// Before: still_edit_instructions
//
// Captures the fresh Imagine still. Edit prompt is typed on still_edit_instructions.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function pickUrl(obj) {
  if (!obj || typeof obj !== 'object') return '';
  var candidates = [
    obj.data && obj.data[0] && obj.data[0].url,
    obj.data && obj.data[0] && obj.data[0].image_url,
    obj.data && obj.data[0] && obj.data[0].image && obj.data[0].image.url,
    obj.url,
    obj.image_url,
    obj.reel_still_url,
    obj.still_url,
  ];
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (typeof c === 'string' && /^https:\/\//i.test(c.trim())) return c.trim();
  }
  return '';
}

var input = $json && typeof $json === 'object' ? $json : {};
var pick = firstJson('pick_creation');
var stillUrl = pickUrl(firstJson('grok_imagine_reel_still')) || pickUrl(input);

if (!stillUrl) {
  throw new Error('save_still_url: no https Imagine URL. Run grok_imagine_reel_still first.');
}

function fromPick(name) {
  var v = input[name];
  if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  if (pick[name] !== undefined && pick[name] !== null && String(pick[name]).trim() !== '') {
    return pick[name];
  }
  return '';
}

return [
  {
    json: Object.assign({}, pick, input, {
      still_url: stillUrl,
      reel_still_url: stillUrl,
      save_still_url: stillUrl,
      creation_id: String(fromPick('creation_id') || ''),
      video_prompt: String(fromPick('video_prompt') || ''),
      video_motion_prompt: String(fromPick('video_motion_prompt') || ''),
      still_edit_prompt: String(fromPick('still_edit_prompt') || ''),
      scene_brief: String(fromPick('scene_brief') || ''),
      compound_id: String(fromPick('compound_id') || ''),
      compound_name: String(fromPick('compound_name') || ''),
      model_still: String(fromPick('model_still') || ''),
      model_video: String(fromPick('model_video') || ''),
      duration_seconds: fromPick('duration_seconds'),
      resolution: String(fromPick('resolution') || ''),
      still_resolution: String(fromPick('still_resolution') || ''),
      aspect_ratio: fromPick('aspect_ratio'),
      camera_move: String(fromPick('camera_move') || ''),
      shot_family: String(fromPick('shot_family') || ''),
      wait_seconds: fromPick('wait_seconds'),
      audio: fromPick('audio'),
      still_n: fromPick('still_n'),
      row_number: Number(pick.row_number || input.row_number || 0) || 0,
      creation_times_used: Number(pick.creation_times_used || pick.times_used || 0) || 0,
    }),
  },
];
