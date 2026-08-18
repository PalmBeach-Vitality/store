// n8n Code node: import_still_url
// Mode: Run Once for All Items
// After: Sheets Get on 12-import-still-queue (or filter/limit)
// Before: save_still_url
//
// Reads still_url + vid-gen fields from the sheet row. Do NOT hardcode the URL here.

function val(obj, names) {
  if (!obj) return '';
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return String(obj[n]).trim();
    }
  }
  // case-insensitive / spaced header fallback (Google Sheets quirks)
  var keys = Object.keys(obj);
  for (var j = 0; j < names.length; j++) {
    var want = names[j].toLowerCase().replace(/\s+/g, '_');
    for (var k = 0; k < keys.length; k++) {
      var got = keys[k].toLowerCase().replace(/\s+/g, '_');
      if (got === want && String(obj[keys[k]]).trim() !== '') {
        return String(obj[keys[k]]).trim();
      }
    }
  }
  return '';
}

var row = $input.first().json || {};
var keys = Object.keys(row);

var still_url = val(row, ['still_url', 'Still URL', 'image_url', 'url']);
var video_motion_prompt = val(row, ['video_motion_prompt', 'Video Motion Prompt']);
var model_video = val(row, ['model_video', 'Model Video']);
var creation_id = val(row, ['creation_id', 'Creation ID']);
var import_id = val(row, ['import_id', 'Import ID']);

if (!/^https:\/\//i.test(still_url)) {
  throw new Error(
    'import_still_url: sheet still_url must be https. ' +
      'Got: ' +
      JSON.stringify(still_url) +
      ' | keys: ' +
      keys.join(', ') +
      ' | tip: paste URL in column still_url on tab 12-import-still-queue, then re-run Sheets Get'
  );
}

if (!video_motion_prompt) {
  throw new Error(
    'import_still_url: video_motion_prompt empty. keys: ' + keys.join(', ')
  );
}

if (!model_video) {
  throw new Error('import_still_url: model_video empty. keys: ' + keys.join(', '));
}

return [
  {
    json: {
      ...row,
      still_url: still_url,
      import_id: import_id,
      creation_id: creation_id,
      still_edit_prompt: val(row, ['still_edit_prompt', 'Still Edit Prompt']),
      video_motion_prompt: video_motion_prompt,
      video_prompt: val(row, ['video_prompt', 'Video Prompt']),
      model_video: model_video,
      model_still: val(row, ['model_still', 'Model Still']),
      duration_seconds: Number(val(row, ['duration_seconds', 'Duration Seconds']) || 0),
      resolution: val(row, ['resolution', 'Resolution']),
      aspect_ratio: val(row, ['aspect_ratio', 'Aspect Ratio']),
      still_resolution: val(row, ['still_resolution', 'Still Resolution']),
      camera_move: val(row, ['camera_move', 'Camera Move']),
      shot_family: val(row, ['shot_family', 'Shot Family']),
      camera_angle: val(row, ['camera_angle', 'Camera Angle']),
      camera_direction: val(row, ['camera_direction', 'Camera Direction']),
      framing: val(row, ['framing', 'Framing']),
      surface: val(row, ['surface', 'Surface']),
      lighting: val(row, ['lighting', 'Lighting']),
      color_grade: val(row, ['color_grade', 'Color Grade']),
      hero_style: val(row, ['hero_style', 'Hero Style']),
      times_used: Number(val(row, ['times_used', 'Times Used']) || 0),
      source: 'import_url',
    },
  },
];
