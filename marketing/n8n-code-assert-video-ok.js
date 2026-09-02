// n8n Code node: assert_video_ok
// Workflow: peptide_pen_vid_gen
// Mode: Run Once for All Items
// After: grok_video_poll
// Before: save_video_url
//
// Stops a failed Grok I2V poll from looking like success and incrementing times_used.

function httpsUrl(s) {
  s = String(s || '').trim();
  return /^https:\/\//i.test(s) ? s : '';
}

var poll = ($input.first() && $input.first().json) || {};
var videoUrl = httpsUrl((poll.video && poll.video.url) || poll.url);
var status = String(poll.status || '').toLowerCase();
var errMsg = poll.error && poll.error.message ? String(poll.error.message) : '';

if (!videoUrl || status === 'failed' || status === 'error') {
  throw new Error(
    'assert_video_ok: Grok video failed (' +
      (status || 'no-status') +
      '). ' +
      (errMsg || 'no video_url') +
      ' If the message is image 404: Unpin grok_imagine_pen_still (it may be pinned to a different dead imgen URL), then Execute so video uses the still you just generated.'
  );
}

return $input.all();
