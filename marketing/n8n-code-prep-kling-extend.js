// n8n Code node: prep_kling_extend
// After: creatomate_last_frame_poll
// Before: openrouter_i2v_extend
// Hop 2 is a fresh OpenRouter Kling I2V from the last frame of hop 1.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

function pickVideoUrl(obj) {
  obj = obj || {};
  if (Array.isArray(obj.unsigned_urls) && obj.unsigned_urls.length) {
    return httpsUrl(obj.unsigned_urls[0]);
  }
  return (
    httpsUrl(obj.video && obj.video.url) ||
    httpsUrl(obj.video_url) ||
    httpsUrl(obj.url) ||
    httpsUrl(obj.data && obj.data.video && obj.data.video.url) ||
    ''
  );
}

function pickImageUrl(obj) {
  obj = obj || {};
  var imgs = obj.images;
  if (Array.isArray(imgs) && imgs[0]) return httpsUrl(imgs[0].url);
  return httpsUrl(obj.image && obj.image.url) || httpsUrl(obj.url) || '';
}

var extract = ($input.first() && $input.first().json) || {};
var hop1 = firstJson('openrouter_i2v_poll');
var start = firstJson('prep_molecule_video_start');
var pick = firstJson('pick_molecule_creation');

var video1 = pickVideoUrl(hop1);
if (!video1) {
  throw new Error(
    'prep_kling_extend openrouter_i2v_poll returned no https video URL. Keys: ' +
      Object.keys(hop1).join(', ')
  );
}

var lastFrame = pickImageUrl(extract);
if (!lastFrame) {
  throw new Error(
    'prep_kling_extend last-frame poll returned no image URL. Keys: ' + Object.keys(extract).join(', ')
  );
}

var compound = String(pick.compound_name || start.compound_name || '').trim();
var motion = String(start.video_motion_prompt || pick.video_motion_prompt || '').trim();
motion =
  'Continue from the last frame of the same silent cellular chemical reaction. No cut. Same lighting, color grade, and camera energy. Amino acids keep colliding and docking. Peptide bonds form with energy flashes. Completely silent. NO text, NO logos, NO captions, NO vials, NO pens. ' +
  (compound ? "Same '" + compound + "' reaction subject, never printed. " : '') +
  motion;
if (motion.length > 2500) {
  motion = motion.slice(0, 2497) + '.';
}

var modelVideo = String(start.model_video || '').trim();
if (!modelVideo || modelVideo.indexOf('fal-ai/') === 0) {
  throw new Error('prep_kling_extend model_video missing from prep_molecule_video_start.');
}
var resolution = String(start.resolution || pick.resolution || '').trim();
var aspect = String(start.aspect_ratio || pick.aspect_ratio || '9:16').trim();
var duration = Number(start.duration_seconds || 15);
var waitSeconds = Number(start.wait_seconds || 180);

var body = {
  model: modelVideo,
  prompt: motion,
  duration: duration,
  resolution: resolution,
  aspect_ratio: aspect,
  generate_audio: false,
  frame_images: [
    {
      type: 'image_url',
      image_url: { url: lastFrame },
      frame_type: 'first_frame',
    },
  ],
};

return [
  {
    json: {
      video_url_15: video1,
      last_frame_url: lastFrame,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      generate_audio: false,
      resolution: resolution,
      aspect_ratio: aspect,
      wait_seconds: waitSeconds,
      creation_id: String(pick.creation_id || start.creation_id || ''),
      compound_name: compound,
      still_url: String(firstJson('save_still_url').still_url || start.still_url || ''),
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: JSON.stringify(body),
    },
  },
];
