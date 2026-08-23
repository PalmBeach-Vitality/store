// n8n Code node: prep_molecule_video_start
// Workflow: peptide_molecule_vid_gen
// Mode: Run Once for All Items
// After: save_still_url
// Before: kling_i2v_start
//
// Official Kling I2V. Still stays Grok. Video is POST /v1/videos/image2video.
// JWT from n8n Variables KLING_ACCESS_KEY + KLING_SECRET_KEY.

var crypto = require('crypto');

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

function readVar(name) {
  var v = '';
  try {
    if (typeof $vars !== 'undefined' && $vars && $vars[name] != null) {
      v = String($vars[name]).trim();
    }
  } catch (e) {}
  if (!v) {
    try {
      if (typeof $env !== 'undefined' && $env && $env[name] != null) {
        v = String($env[name]).trim();
      }
    } catch (e2) {}
  }
  return v;
}

function b64url(input) {
  var buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf.toString('base64').split('+').join('-').split('/').join('_').split('=').join('');
}

function mintKlingJwt(accessKey, secretKey) {
  var now = Math.floor(Date.now() / 1000);
  var header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  var payload = b64url(JSON.stringify({ iss: accessKey, iat: now, nbf: now - 5, exp: now + 1800 }));
  var sig = b64url(crypto.createHmac('sha256', secretKey).update(header + '.' + payload).digest());
  return header + '.' + payload + '.' + sig;
}

function klingModeFromResolution(resolution) {
  var r = String(resolution || '')
    .trim()
    .toLowerCase();
  if (r === '1080p' || r === '1080') return 'pro';
  if (r === '720p' || r === '720') return 'std';
  throw new Error(
    'prep_molecule_video_start: resolution must be 720p or 1080p so Kling mode can be set. Got: ' +
      JSON.stringify(resolution)
  );
}

var input = ($input.first() && $input.first().json) || {};
var pick = firstJson('pick_molecule_creation');
var saveStill = firstJson('save_still_url');
var imagine = firstJson('grok_imagine_molecule_still');

var still =
  httpsUrl(input.still_url) ||
  httpsUrl(saveStill.still_url) ||
  httpsUrl(imagine.data && imagine.data[0] && imagine.data[0].url) ||
  '';

if (!still) {
  throw new Error(
    'prep_molecule_video_start: still_url missing. save_still_url must be ={{ $json.data[0].url }} from grok_imagine_molecule_still.'
  );
}

var motion = String(
  input.video_motion_prompt || pick.video_motion_prompt || saveStill.video_motion_prompt || ''
).trim();
if (!motion) {
  throw new Error('prep_molecule_video_start: video_motion_prompt missing from pick_molecule_creation.');
}
motion =
  'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. No text, no captions, no logos appear. Cellular reaction continues. ' +
  motion;
if (motion.length > 2500) {
  motion = motion.slice(0, 2497) + '.';
}

var modelVideo = String(input.model_video || pick.model_video || saveStill.model_video || '').trim();
if (!modelVideo) {
  throw new Error(
    'prep_molecule_video_start: model_video missing. Overlay Sheet 13 model_video to a Kling model (kling-v3).'
  );
}
if (modelVideo.indexOf('grok') !== -1) {
  throw new Error(
    'prep_molecule_video_start: model_video is still ' +
      modelVideo +
      '. Overlay Sheet 13 model_video to a Kling model first.'
  );
}

var durationRaw = input.duration_seconds || pick.duration_seconds || saveStill.duration_seconds;
var duration = Number(durationRaw);
if (!duration) {
  throw new Error('prep_molecule_video_start: duration_seconds missing from the picked Sheet 13 row.');
}

var resolution = String(input.resolution || pick.resolution || saveStill.resolution || '').trim();
if (!resolution) {
  throw new Error('prep_molecule_video_start: resolution missing from the picked Sheet 13 row.');
}
var mode = klingModeFromResolution(resolution);

var accessKey = readVar('KLING_ACCESS_KEY');
var secretKey = readVar('KLING_SECRET_KEY');
if (!accessKey || !secretKey) {
  throw new Error(
    'prep_molecule_video_start: add n8n Variables KLING_ACCESS_KEY and KLING_SECRET_KEY (Kling console Access Key + Secret Key). Settings → Variables.'
  );
}

var jwt = mintKlingJwt(accessKey, secretKey);

var body = {
  model_name: modelVideo,
  image: still,
  prompt: motion,
  duration: String(duration),
  mode: mode,
  sound: 'off',
};

return [
  {
    json: {
      still_url: still,
      video_motion_prompt: motion,
      model_video: modelVideo,
      duration_seconds: duration,
      resolution: resolution,
      kling_mode: mode,
      creation_id: String(input.creation_id || pick.creation_id || ''),
      compound_name: String(input.compound_name || pick.compound_name || ''),
      kling_jwt: jwt,
      kling_start_url: 'https://api.klingai.com/v1/videos/image2video',
      kling_i2v_body_json: JSON.stringify(body),
    },
  },
];
