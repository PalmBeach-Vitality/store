// n8n Code node: overlay_ig_aspect
// Workflow: overlay_image_scenes_ig_aspect
// Mode: Run Once for All Items
// After: get_image_scenes  Before: sheets_update_aspect
//
// Writes aspect_ratio=3:4 on every 3-image-scenes-150 row.
// Buffer Instagram feed posts reject 9:16.

var rows = $input.all().map(function (i) {
  return i.json;
});

if (!rows.length) {
  throw new Error('overlay_ig_aspect: no rows from 3-image-scenes-150');
}

return rows
  .map(function (r) {
    var sceneId = String(r.scene_id || '').trim();
    if (!sceneId) return null;
    return {
      json: {
        scene_id: sceneId,
        aspect_ratio: '3:4',
      },
    };
  })
  .filter(Boolean);
