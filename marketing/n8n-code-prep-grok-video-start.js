// n8n Code node: prep_grok_video_start
// Type: Code | Mode: Run Once for All Items
// After: save_edited_still_url (preferred) | still_edit_instructions | import_still_url | save_still_url
// Before: grok_video_start  (model: grok-imagine-video-1.5)
//
// Resolves still_url from import path, edit path, or daily Grok still path.

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

function pickHttpsUrl(...candidates) {
  for (const c of candidates) {
    const s = String(c || '').trim();
    if (/^https:\/\//i.test(s)) return s;
  }
  return '';
}

const input = $input.first()?.json || {};
const editedStill = firstJson('save_edited_still_url');
const editInstructions = firstJson('still_edit_instructions');
const importStill = firstJson('import_still_url');
const stillNode = firstJson('save_still_url');
const pick = firstJson('pick_creation');
const imagine = firstJson('grok_imagine_reel_still');
const editHttp = firstJson('grok_imagine_edit_still');

const stillResolved = pickHttpsUrl(
  val(input, ['still_url', 'source_still_url', 'edited_still_url']),
  input?.data?.[0]?.url,
  input?.url,
  val(editedStill, ['still_url']),
  editedStill?.data?.[0]?.url,
  val(editInstructions, ['still_url']),
  val(importStill, ['still_url']),
  val(stillNode, ['still_url']),
  stillNode?.data?.[0]?.url,
  editHttp?.data?.[0]?.url,
  imagine?.data?.[0]?.url
);

if (!stillResolved) {
  throw new Error(
    'prep_grok_video_start: still_url must be https. ' +
      'Wire: save_edited_still_url → prep_grok_video_start (or import_still_url / save_still_url upstream). ' +
      'Debug sources — ' +
      'input.still_url=' +
      JSON.stringify(input?.still_url || '') +
      ' | save_edited_still_url=' +
      JSON.stringify(editedStill?.still_url || '') +
      ' | still_edit_instructions=' +
      JSON.stringify(editInstructions?.still_url || '') +
      ' | import_still_url=' +
      JSON.stringify(importStill?.still_url || '') +
      ' | save_still_url=' +
      JSON.stringify(stillNode?.still_url || '')
  );
}

const shot_family = asciiPrompt(val(pick, ['shot_family'], 'push_in'));
const camera_angle = asciiPrompt(val(pick, ['camera_angle'], 'eye-level'));
const camera_direction = asciiPrompt(val(pick, ['camera_direction'], 'forward'));
const camera_move = asciiPrompt(val(pick, ['camera_move'], 'slow push-in')).slice(0, 180);
const compound = asciiPrompt(val(pick, ['compound_name'], ''));

// SHORT motion prompt only — image already has the scene.
let motion = asciiPrompt(
  `Slow cinematic camera: ${camera_move}. ` +
    `Shot ${shot_family}, angle ${camera_angle}, direction ${camera_direction}. ` +
    `Keep the exact same scene, materials, and lighting from the still. ` +
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
      creation_id: String(
        val(input, ['creation_id']) ||
          val(editedStill, ['creation_id']) ||
          val(importStill, ['creation_id']) ||
          val(pick, ['creation_id']) ||
          val(stillNode, ['creation_id'], '')
      ),
      camera_move,
      shot_family,
      camera_angle,
      camera_direction,
      compound_name: compound,
      still_was_edited: Boolean(val(editedStill, ['still_was_edited'], false)),
      original_still_url: String(
        val(editedStill, ['original_still_url']) ||
          val(importStill, ['still_url']) ||
          val(stillNode, ['still_url'], '')
      ),
      grok_video_body_json,
      _debug_prompt_len: motion.length,
      _debug_still_host: stillResolved.split('/')[2] || '',
      _debug_body_preview: grok_video_body_json.slice(0, 240),
    },
  },
];
