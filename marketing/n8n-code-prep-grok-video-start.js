// n8n Code node: prep_grok_video_start
// Type: Code | Mode: Run Once for All Items
// After: save_still_url
// Before: grok_video_start
//
// Builds a MINIMAL, validated xAI I2V body. Most "Bad request - please check
// your parameters" errors are:
//   1) still_url empty / undefined / not https
//   2) n8n body sent as { "": "" } (JSON params mode with empty rows)
//   3) prompt still the long full-scene paragraph
// Auth problems are HTTP 401 — not 400.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function val(obj, names, fallback = '') {
  for (const n of names) {
    if (obj && obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {
      return obj[n];
    }
  }
  return fallback;
}

function asciiPrompt(s) {
  return String(s || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00d7/g, 'x')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const input = $input.first()?.json || {};
const stillNode = firstJson('save_still_url');
const pick = firstJson('pick_creation');
const imagine = firstJson('grok_imagine_reel_still');

const stillResolved = String(
  val(input, ['still_url']) ||
    val(stillNode, ['still_url']) ||
    input?.data?.[0]?.url ||
    stillNode?.data?.[0]?.url ||
    imagine?.data?.[0]?.url ||
    ''
).trim();

if (!/^https:\/\//i.test(stillResolved)) {
  throw new Error(
    'prep_grok_video_start: still_url must be a public https URL. ' +
      'In save_still_url set still_url = {{ $json.data[0].url }} from grok_imagine_reel_still. ' +
      'Got: ' +
      JSON.stringify(stillResolved).slice(0, 160)
  );
}

const shot_family = asciiPrompt(val(pick, ['shot_family'], 'push_in'));
const camera_angle = asciiPrompt(val(pick, ['camera_angle'], 'eye-level'));
const camera_direction = asciiPrompt(val(pick, ['camera_direction'], 'forward'));
const camera_move = asciiPrompt(val(pick, ['camera_move'], 'slow push-in')).slice(0, 180);
const compound = asciiPrompt(val(pick, ['compound_name'], ''));

// SHORT motion prompt only — image already has the scene.
// Official xAI I2V examples use ~1 sentence of camera direction.
let motion = asciiPrompt(
  `Slow cinematic camera: ${camera_move}. ` +
    `Shot ${shot_family}, angle ${camera_angle}, direction ${camera_direction}. ` +
    `Keep the exact same laboratory research scene, materials, and lighting. ` +
    `No orbit. No new objects. No duplicate props. No repeated text or graphics. ` +
    `No people, hands, faces, needles, text watermarks, or burn-in. ` +
    `No on-screen disclaimer or caption text.`
);

if (compound) {
  motion += ` Keep label '${compound}' unchanged if visible, printed once only.`;
}

if (motion.length > 700) {
  motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';
}

// Minimal body matching official xAI I2V curl (plus resolution).
// Omit aspect_ratio so output follows the 9:16 still (avoids stretch conflicts).
const body = {
  model: 'grok-imagine-video-1.5',
  prompt: motion,
  image: { url: stillResolved },
  duration: 15,
  resolution: '1080p',
};

const grok_video_body_json = JSON.stringify(body);

return [
  {
    json: {
      still_url: stillResolved,
      video_motion_prompt: motion,
      creation_id: String(val(pick, ['creation_id']) || val(stillNode, ['creation_id'], '')),
      camera_move,
      shot_family,
      camera_angle,
      camera_direction,
      compound_name: compound,
      // Use THIS string as the Raw body of grok_video_start
      grok_video_body_json,
      // Debug mirrors (open in n8n output to verify before HTTP call)
      _debug_prompt_len: motion.length,
      _debug_still_host: stillResolved.split('/')[2] || '',
      _debug_body_preview: grok_video_body_json.slice(0, 240),
    },
  },
];
