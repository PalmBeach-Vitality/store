// n8n Code node: prep_molecule_video_extend
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// After: grok_video_poll
// Before: grok_video_extend_1
//
// 30s = two 15s Grok jobs: generate 15, then one silent 15s extend
// (API returns one combined clip). VIDEO_SECONDS=15 skips the extend
// (GET the finished 15s clip).

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  return /^https:\/\//i.test(s) ? s : '';
}

function videoUrlFrom(obj) {
  if (!obj) return '';
  return (
    httpsUrl(obj.video && obj.video.url) ||
    httpsUrl(obj.url) ||
    httpsUrl(obj.video_url) ||
    ''
  );
}

var wanted = Number(firstJson('enter_video_seconds').video_seconds || 15);
if (wanted !== 30) wanted = 15;
var doExtend = wanted === 30;

var start = firstJson('grok_video_start');
var poll = ($input.first() && $input.first().json) || {};
var sourceUrl = videoUrlFrom(poll) || videoUrlFrom(firstJson('grok_video_poll'));
var originId = String(start.request_id || '').trim();
var extendSeconds = 15;
var waitSeconds = doExtend ? 200 : 2;

if (doExtend && !sourceUrl) {
  throw new Error(
    'prep_molecule_video_extend: missing source video URL from grok_video_poll. Need status=done and video.url.'
  );
}

var motion =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ' +
  'Continue from the last frame of the same dark cinematic 3D medical animation of a live cellular chemical reaction. ' +
  'Amino acids keep colliding and docking. Peptide bonds form with energy flashes. The living-cell membrane and cytoplasm keep moving. ' +
  'Keep the same lighting, color grade, and slow camera energy. No cut. No new scene. ' +
  'NO text, NO logos, NO captions, NO vials, NO pens, NO people. Completely blank of typography.';
if (motion.length > 700) {
  motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';
}

var body = {
  model: 'grok-imagine-video-1.5',
  prompt: motion,
  duration: extendSeconds,
  video: { url: sourceUrl },
};

var httpMethod = doExtend ? 'POST' : 'GET';
var httpUrl = doExtend
  ? 'https://api.x.ai/v1/videos/extensions'
  : 'https://api.x.ai/v1/videos/' + originId;
if (!doExtend && !originId) {
  throw new Error('prep_molecule_video_extend: missing grok_video_start.request_id to re-read the 15s clip.');
}

return [
  {
    json: {
      video_seconds: wanted,
      extend_applied: doExtend,
      extend_seconds: doExtend ? extendSeconds : 0,
      wait_seconds: waitSeconds,
      source_video_url: sourceUrl,
      poll_request_id: originId,
      http_method: httpMethod,
      http_url: httpUrl,
      send_body: doExtend,
      grok_extend_body_json: doExtend ? JSON.stringify(body) : '{}',
      still_url: String(firstJson('save_still_url').still_url || ''),
      creation_id: String(firstJson('pick_molecule_creation').creation_id || ''),
      compound_name: String(firstJson('pick_molecule_creation').compound_name || ''),
    },
  },
];
