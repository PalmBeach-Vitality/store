// n8n Code node: prep_seedance_video_start
// Type: Code | Mode: Run Once for All Items
// After: save_still_url
// Before: seedance_video_start
//
// Builds fal.ai + BytePlus Ark bodies for Seedance I2V from today's Grok still.
// generate_audio: false — PBVita adds music manually after Creatomate.

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
    'prep_seedance_video_start: still_url must be a public https URL. ' +
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

function stripVidDisclaimer(text) {
  let t = String(text || '');
  const patterns = [
    /\s*For laboratory research use only\.?\s*/gi,
    /\s*Not for human use or consumption\.?\s*/gi,
    /\s*['']For Laboratory Research Use Only['']\.?\s*/gi,
    /\s*Explicit research[- ]use only[^.]*\.?\s*/gi,
  ];
  for (const re of patterns) t = t.replace(re, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

const sheetMotion = stripVidDisclaimer(
  asciiPrompt(
    val(input, ['video_motion_prompt']) ||
      val(stillNode, ['video_motion_prompt']) ||
      val(pick, ['video_motion_prompt'], '')
  )
);

let motion = sheetMotion;
if (!motion || motion.length > 700) {
  motion = asciiPrompt(
    `Slow cinematic camera: ${camera_move}. ` +
      `Shot ${shot_family}, angle ${camera_angle}, direction ${camera_direction}. ` +
      `Keep the exact same laboratory research scene, materials, and lighting. ` +
      `No orbit. No new objects. No duplicate props. No repeated text or graphics. ` +
      `No people, hands, faces, needles, text watermarks, or burn-in. ` +
      `Silent / no soundtrack. No on-screen disclaimer or caption text.`
  );
}

if (compound) {
  motion += ` Keep label '${compound}' unchanged if visible, printed once only.`;
}

motion = stripVidDisclaimer(motion);

if (motion.length > 700) {
  motion = motion.slice(0, 697).replace(/\s+\S*$/, '') + '.';
}

// --- fal.ai Seedance 2.0 I2V (live today). Swap endpoint to 2.5 when listed. ---
const falBody = {
  prompt: motion,
  image_url: stillResolved,
  aspect_ratio: '9:16',
  resolution: '1080p',
  duration: '15',
  generate_audio: false,
  bitrate_mode: 'standard',
};

// --- BytePlus ModelArk (Seedance 2.0 today; replace model with console 2.5 ID later) ---
const arkModel =
  String(val(input, ['seedance_ark_model'], 'dreamina-seedance-2-0-260128')).trim() ||
  'dreamina-seedance-2-0-260128';

const arkBody = {
  model: arkModel,
  content: [
    { type: 'text', text: motion },
    {
      type: 'image_url',
      image_url: { url: stillResolved },
      role: 'first_frame',
    },
  ],
  ratio: '9:16',
  resolution: '1080p',
  duration: 15,
  generate_audio: false,
};

const seedance_fal_body_json = JSON.stringify(falBody);
const seedance_ark_body_json = JSON.stringify(arkBody);

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
      seedance_provider_hint: 'fal',
      seedance_fal_endpoint: 'bytedance/seedance-2.0/image-to-video',
      seedance_fal_body_json,
      seedance_ark_model: arkModel,
      seedance_ark_body_json,
      _debug_prompt_len: motion.length,
      _debug_still_host: stillResolved.split('/')[2] || '',
      _debug_fal_preview: seedance_fal_body_json.slice(0, 240),
    },
  },
];
