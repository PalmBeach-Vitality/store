// n8n Code node: prep_molecule_video_extend
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// Settings → Execute Once = OFF
// Duplicate this node as prep_molecule_extend_1 (HOP=1) and prep_molecule_extend_2 (HOP=2).
// After: grok_video_poll / grok_extend_poll_1
// Before: grok_video_extend_1 / grok_video_extend_2
//
// Grok generate max is 15s. Extend segment max is 10s.
// 30s total = 15 + 10 + 5. VIDEO_SECONDS=15 skips both hops (GET the finished 15s clip).

var EXTEND_HOP = 1;

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

var hop = Number(EXTEND_HOP) === 2 ? 2 : 1;
var wanted = Number(firstJson('enter_video_seconds').video_seconds || 15);
if (wanted !== 30) wanted = 15;
var doExtend = wanted === 30;

var start = firstJson('grok_video_start');
var poll = ($input.first() && $input.first().json) || {};
var sourceUrl = videoUrlFrom(poll);
if (!sourceUrl) sourceUrl = videoUrlFrom(firstJson('grok_video_poll'));
if (!sourceUrl && hop === 2) sourceUrl = videoUrlFrom(firstJson('grok_extend_poll_1'));

var originId = String(start.request_id || '').trim();
var pollRequestId = originId;
if (hop === 2) {
  pollRequestId = String(firstJson('grok_video_extend_1').request_id || originId).trim();
}

var extendSeconds = hop === 1 ? 10 : 5;
var waitSeconds = doExtend ? (hop === 1 ? 180 : 140) : 2;

if (doExtend && !sourceUrl) {
  throw new Error(
    'prep_molecule_video_extend hop ' +
      hop +
      ': missing source video URL from the previous poll. Check grok_video_poll status=done and video.url.'
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
  model: 'grok-imagine-video',
  prompt: motion,
  duration: extendSeconds,
  video: { url: sourceUrl },
};

var httpMethod = doExtend ? 'POST' : 'GET';
var httpUrl = doExtend
  ? 'https://api.x.ai/v1/videos/extensions'
  : 'https://api.x.ai/v1/videos/' + pollRequestId;
if (!doExtend && !pollRequestId) {
  throw new Error('prep_molecule_video_extend: missing grok_video_start.request_id to re-read the 15s clip.');
}

return [
  {
    json: {
      video_seconds: wanted,
      extend_hop: hop,
      extend_applied: doExtend,
      extend_seconds: doExtend ? extendSeconds : 0,
      wait_seconds: waitSeconds,
      source_video_url: sourceUrl,
      poll_request_id: pollRequestId,
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
