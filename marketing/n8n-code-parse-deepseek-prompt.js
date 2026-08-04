// n8n Code node: parse_deepseek_prompt
// Type: Code | Mode: Run Once for All Items
// Workflow: PBVita — Grok Daily (vid gen)
// After: deepseek_enhance_prompt (HTTP)
// Before: grok_imagine_reel_still
//
// Reads DeepSeek chat completion → merges enhanced video_prompt (+ optional short motion).
// Falls back to pick_creation if JSON parse fails.

function firstJson(name) {
  try {
    return $(name).first()?.json || {};
  } catch (e) {
    return {};
  }
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  // Strip ```json fences if present
  let t = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(t);
  } catch (e) {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

const pick = firstJson('pick_creation');
const ds = $input.first()?.json || {};

const content =
  ds.choices?.[0]?.message?.content ||
  ds.choices?.[0]?.message?.reasoning_content ||
  ds.content ||
  '';

const parsed = extractJsonObject(content);

const VIAL_CLOSURE_RULE =
  'VIAL CLOSURE RULE (MANDATORY): Every vial must be a pharmaceutical injection vial with an ' +
  'aluminum crimped seal over a rubber septum stopper. Show the crimped metal collar and rubber ' +
  'center clearly when a vial is visible. NO twist-off caps, NO screw-top vials, NO child-resistant ' +
  'twist lids, NO plastic twist closures — crimped metal + rubber only.';

function withVialClosure(prompt) {
  const p = String(prompt || '').trim();
  if (!p) return p;
  if (/VIAL CLOSURE RULE/i.test(p)) return p;
  return `${p} ${VIAL_CLOSURE_RULE}`;
}

let video_prompt = String(pick.video_prompt || '').trim();
let video_motion_prompt = String(pick.video_motion_prompt || '').trim();
let deepseek_ok = false;
let deepseek_error = '';

if (parsed && parsed.video_prompt) {
  video_prompt = withVialClosure(String(parsed.video_prompt).trim());
  deepseek_ok = true;
  const motion = String(parsed.video_motion_prompt || '').trim();
  // Keep motion short — long motion prompts break grok_video_start (400)
  if (motion && motion.length <= 700) {
    video_motion_prompt = motion;
  }
} else {
  deepseek_error =
    'DeepSeek JSON missing video_prompt — using pick_creation prompts. Raw head: ' +
    String(content).slice(0, 180);
  video_prompt = withVialClosure(video_prompt);
}

if (!video_prompt) {
  throw new Error(
    'No video_prompt after DeepSeek. Check pick_creation and deepseek_enhance_prompt output.'
  );
}

return [
  {
    json: {
      ...pick,
      video_prompt,
      video_motion_prompt,
      deepseek_ok,
      deepseek_error,
      deepseek_raw_head: String(content).slice(0, 240),
      prompt_source: deepseek_ok ? 'deepseek' : 'pick_creation_fallback',
    },
  },
];
