// n8n Code node: skip_still_edit
// Mode: Run Once for All Items
// After: save_still_url  Before: prep_grok_video_start
//
// Same as Vid_gen_lab_scenes. Leave unwired for an edit run.
// To skip: disconnect save_still_url from still_edit_instructions,
// then wire save_still_url → this node. Do not leave both wires on.

return $input.all();
