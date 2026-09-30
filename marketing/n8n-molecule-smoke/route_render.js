// n8n Code node: route_last_frame and route_concat (same code in both)
// After: creatomate_last_frame_poll / creatomate_poll   Before: switch_last_frame / switch_concat
//
// done: true continues; done: false loops back to the Wait node. $runIndex counts this
// node's own runs, so the loop stops after the sheet's creatomate_max_polls.

var pick = $('pick_molecule_creation').first().json;
var r = $input.first().json;
var polls = $runIndex + 1;

if (r.status === 'succeeded') {
  if (!/^https:\/\//i.test(String(r.url || ''))) {
    throw new Error('Creatomate render ' + r.id + ' succeeded without a url.');
  }
  // A free Creatomate plan clamps both sides to 480 px, which would hand hop 2 a
  // preview-size frame and ship a sub-720p cut.
  if (r.width !== pick.render_width || r.height !== pick.render_height) {
    throw new Error(
      'Creatomate render ' + r.id + ' came back ' + (r.width || '?') + 'x' + (r.height || '?') +
        ', the sheet asks for ' + pick.render_width + 'x' + pick.render_height + '. Stopped before the next paid step.'
    );
  }
  return [{ json: { done: true, url: r.url, render_id: r.id } }];
}
if (r.status === 'failed' || r.status === 'cancelled') {
  var reason = String(r.error_message || 'no error_message').replace(/\.?\s*$/, '.');
  throw new Error('Creatomate render ' + r.id + ' ' + r.status + ': ' + reason);
}
if (polls >= pick.creatomate_max_polls) {
  throw new Error(
    'Creatomate render ' + r.id + ' still ' + r.status + ' after ' + polls +
      ' polls. Raise creatomate_max_polls or creatomate_poll_seconds on the sheet.'
  );
}
return [{ json: { done: false, status: r.status, polls: polls } }];
