// n8n Code node: skip_still_edit
// Mode: Run Once for All Items
// After: save_still_url
// Before: prep_grok_video_start
//
// DISABLED when you want a still edit.
// Enable this and disable still_edit_instructions to send the raw still to video.
// Do not leave this ON at the same time as still_edit_instructions — that starts two videos.

return $input.all();
