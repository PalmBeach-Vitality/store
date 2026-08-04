// n8n Code node: prep_grok_video_start
// Type: Code | Mode: Run Once for All Items
// After: save_still_url
// Before: grok_video_start
//
// Validates still_url + builds a short I2V-safe motion prompt.
// Long scene paragraphs in video_motion_prompt cause xAI HTTP 400 Bad Request.
// Auth failures are 401 — if you see 400, it is almost never the API key.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return fallback;
}

const input = $input.first()?.json || {};
const stillNode = firstJson('save_still_url');
const pick = firstJson('pick_creation');

const stillResolved = String(
  val(input, ['still_url']) ||
    val(stillNode, ['still_url']) ||
    input?.data?.[0]?.url ||
    ''
).trim();

if (!/^https?:\/\//i.test(stillResolved)) {
  throw new Error(
    'prep_grok_video_start: still_url missing/invalid. ' +
      'Fix save_still_url → still_url = {{ $json.data[0].url }} from grok_imagine_reel_still. ' +
      'Got: ' +
      JSON.stringify(stillResolved).slice(0, 120)
  );
}

const sheetMotion = String(
  val(pick, ['video_motion_prompt']) ||
    val(stillNode, ['video_motion_prompt']) ||
    val(input, ['video_motion_prompt']) ||
    ''
).trim();

const shot_family = String(val(pick, ['shot_family'], 'push_in'));
const camera_angle = String(val(pick, ['camera_angle'], 'eye-level'));
const camera_direction = String(val(pick, ['camera_direction'], 'forward'));
const camera_move = String(val(pick, ['camera_move'], 'slow push-in'));
const framing = String(val(pick, ['framing'], 'medium product framing'));
const lighting = String(val(pick, ['lighting'], 'clinical catalog lighting'));
const surface = String(val(pick, ['surface'], 'clean laboratory surface'));
const compound = String(val(pick, ['compound_name'], '')).trim();

// Prefer sheet motion if already short; otherwise rebuild a safe camera prompt
let motion = sheetMotion;
if (
  !motion ||
  motion.length > 1200 ||
  /FULL SCENE BRIEF|continuing this exact scene:/i.test(motion)
) {
  const label = compound
    ? `Keep any visible product label as '${compound}' only.`
    : 'Do not add new product labels or counters.';
  motion =
    `Animate this exact Palm Beach Vitality laboratory research still in vertical 9:16. ` +
    `SHOT: ${shot_family}. ANGLE: ${camera_angle}. DIRECTION: ${camera_direction}. ` +
    `CAMERA MOVE: ${camera_move}. FRAMING: ${framing}. ` +
    `Keep lighting (${lighting}) and surface (${surface}) unchanged. ` +
    `Preserve every object, material, and depth cue from the still — no morphing, no new props. ` +
    `Motion path is straight or a simple tilt/pedestal/truck only — never orbit. ` +
    `${label} ` +
    `No people, hands, faces, needles, injection, watermarks, captions, or burn-in text. ` +
    `For laboratory research use only. Not for human use or consumption.`;
}

if (motion.length > 1200) {
  motion = motion.slice(0, 1199).replace(/\s+\S*$/, '') + '.';
}

return [
  {
    json: {
      ...input,
      ...stillNode,
      still_url: stillResolved,
      video_motion_prompt: motion,
      creation_id: val(pick, ['creation_id']) || val(stillNode, ['creation_id'], ''),
      camera_move,
      shot_family,
      camera_angle,
      camera_direction,
      grok_video_model: 'grok-imagine-video-1.5',
      grok_video_duration: 15,
      grok_video_aspect_ratio: '9:16',
      grok_video_resolution: '1080p',
    },
  },
];
