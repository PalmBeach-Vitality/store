function squeeze(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function labelOf(motion, cid) {
  var found = String(motion || '').match(/Keep label '([^']*)'/g);
  if (!found || found.length !== 1) {
    throw new Error(cid + ': motion prompt needs exactly one Keep label quote');
  }
  var quote = found[0].replace("Keep label '", '').replace(/'$/, '');
  if (!quote.trim()) throw new Error(cid + ': empty label quote');
  return quote;
}

var LOCK =
  'The glass bottle stays planted on its base, upright, the same object as the first frame. ' +
  'The cap stays seated and closed. ' +
  'The label is flat printed ink. The small DNA mark keeps the same shape and the same place on the glass. ' +
  'Only the camera travels. ';

var CONTINUITY =
  'Keep the same setting, materials, and lighting already in the still. ' +
  'Every background object already in frame stays solid and visible. ' +
  'Nothing fades in, fades out, appears, or disappears.';

var BANNED = [
  'then hold',
  'hard hold',
  'locked tripod',
  'does not travel',
  'lighting wrap',
  'forbidden',
  'handheld',
  'frozen',
  'static_lock',
  'label lock',
  'drift',
  'no travel',
];

function cleanCamera(move, family) {
  var raw = squeeze(move);
  var found;
  var angle;
  var place;
  if (family === 'static_lock' || raw.indexOf('locked tripod') !== -1) {
    found = raw.match(/at ([^,]+), subject ([^,]+)/);
    angle = found ? squeeze(found[1]) : '';
    place = found ? squeeze(found[2]) : '';
    if (!angle || !place) throw new Error('static_lock camera could not be read: ' + raw);
    return (
      'slow straight dolly-in a few centimeters at ' +
      angle +
      ', subject ' +
      place +
      ', one continuous move for the whole shot'
    );
  }
  if (family === 'doc_drift' || raw.indexOf('handheld') !== -1 || raw.indexOf('micro drift') !== -1) {
    found = raw.match(/\bat ([^,]+)/);
    angle = found ? squeeze(found[1]) : '';
    angle = angle.replace('slight handheld high', 'slight-high');
    angle = angle.replace('slight handheld low', 'slight-low');
    angle = angle.replace(/documentary/g, '');
    angle = squeeze(angle).replace(/^[, ]+|[, ]+$/g, '');
    if (!angle) throw new Error('doc_drift camera could not be read: ' + raw);
    return (
      'slow straight dolly-in a few centimeters at ' +
      angle +
      ', one continuous move for the whole shot, no circling path'
    );
  }
  var text = raw.replace(', lighting wrap shifts on edges', '');
  text = text.replace('lighting wrap shifts on edges, ', '');
  text = text.replace(/(?:creeping|ultra-slow|barely moving) tiny forward drift only/gi, 'slow continuous move closer');
  text = text.replace(/,?\s*then settle and hard hold|,?\s*then hard hold|,?\s*then hold/gi, '');
  text = text.replace(/\u2014/g, ',');
  text = text.replace('focus locked on subject', 'the bottle stays in focus');
  text = text.replace('then lock off on the label plane', 'continuing across the label');
  text = text.replace('(straight up to label lock)', '(straight up across the label)');
  text = text.replace('locked offset composition', 'offset composition');
  text = text.replace('locked with breath ', '');
  text = text.replace('slight handheld high', 'slight-high');
  text = text.replace('slight handheld low', 'slight-low');
  text = squeeze(text).replace(/^[, ]+|[, ]+$/g, '');
  if (text.indexOf('one continuous move for the whole shot') === -1) {
    text = text.replace(/\.$/, '') + ', one continuous move for the whole shot';
  }
  return squeeze(text);
}

function buildMotion(row) {
  var cid = squeeze(row.creation_id);
  if (!cid) throw new Error('row missing creation_id');
  var family = squeeze(row.shot_family);
  var angle = squeeze(row.camera_angle);
  var direction = squeeze(row.camera_direction);
  var move = squeeze(row.camera_move);
  if (!family) throw new Error(cid + ': empty shot_family');
  if (!angle) throw new Error(cid + ': empty camera_angle');
  if (!direction) throw new Error(cid + ': empty camera_direction');
  if (!move) throw new Error(cid + ': empty camera_move');
  var printed = labelOf(row.video_motion_prompt, cid);
  var camera = cleanCamera(move, family);
  var spokenAngle = squeeze(
    angle.replace(/documentary/g, '').replace('slight handheld high', 'slight-high').replace('slight handheld low', 'slight-low')
  );
  var spokenDirection = family === 'doc_drift' || family === 'static_lock' ? 'forward' : direction;
  var noOrbit = '';
  if (!/\borbit\b/i.test(move) && !/\borbit\b/i.test(camera)) noOrbit = 'No orbit. ';
  var prompt = squeeze(
    LOCK +
      'Slow cinematic camera: ' +
      camera +
      '. ' +
      'Angle ' +
      spokenAngle +
      ', direction ' +
      spokenDirection +
      '. ' +
      CONTINUITY +
      ' ' +
      noOrbit +
      'No people, hands, faces, or burn-in. ' +
      "Keep label '" +
      printed +
      "' unchanged if visible, once only."
  );
  var low = prompt.toLowerCase();
  var i;
  for (i = 0; i < BANNED.length; i++) {
    if (low.indexOf(BANNED[i]) !== -1) throw new Error(cid + ': banned ' + BANNED[i]);
  }
  if (low.indexOf('the small dna mark keeps the same shape') === -1) {
    throw new Error(cid + ': DNA mark line missing');
  }
  if (low.indexOf('only the camera travels') === -1) throw new Error(cid + ': camera line missing');
  if (prompt.length > 2500) throw new Error(cid + ': motion is ' + prompt.length + ' characters');
  return { camera: camera, motion: prompt };
}

if (typeof $input !== 'undefined') {
  var rows = $input.all().map(function (item) {
    return item.json;
  });
  if (rows.length !== 535) throw new Error('lock_lab_bottle_still: expected 535 rows, got ' + rows.length);
  var seen = {};
  var out = rows.map(function (row) {
    var id = squeeze(row.creation_id);
    if (seen[id]) throw new Error('lock_lab_bottle_still: duplicate ' + id);
    seen[id] = true;
    var motion = String(row.video_motion_prompt || '');
    if (motion.indexOf(LOCK) === 0) throw new Error(id + ': bottle lock already applied');
    if (motion.indexOf('CAMERA LOCK:') !== 0) throw new Error(id + ': motion is not the CAMERA LOCK pass');
    var built = buildMotion(row);
    var still = String(row.video_prompt || '');
    if (still.indexOf('VIAL VISUAL LOCK') === -1) throw new Error(id + ': video_prompt is not the vial still');
    return {
      json: {
        creation_id: id,
        camera_move: built.camera,
        video_motion_prompt: built.motion,
      },
    };
  });
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildMotion: buildMotion, cleanCamera: cleanCamera, LOCK: LOCK };
}
