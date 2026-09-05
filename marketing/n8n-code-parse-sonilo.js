// n8n Code node: parse_sonilo
// After: sonilo_poll
// Before: if_sonilo_ready
// Reads Sonilo task status. Loops while processing. Fails clearly on error.

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

function stemUrl(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return httpsUrl(obj);
  if (typeof obj === 'object') {
    return (
      httpsUrl(obj.url) ||
      httpsUrl(obj.output_url) ||
      httpsUrl(obj.audio && obj.audio.url) ||
      ''
    );
  }
  return '';
}

var poll = ($input.first() && $input.first().json) || {};
var result = poll.result && typeof poll.result === 'object' ? poll.result : poll;
var outputs = Array.isArray(result.outputs)
  ? result.outputs
  : Array.isArray(poll.outputs)
    ? poll.outputs
    : [];
var firstOut = outputs[0] && typeof outputs[0] === 'object' ? outputs[0] : {};
var status = String(result.status || poll.status || '').trim().toLowerCase();
var err = result.error || poll.error || result.message || poll.message;
if (err && typeof err === 'object') err = err.message || JSON.stringify(err);

var prep = firstJson('prep_sonilo_start');
var pick = firstJson('pick_sonilo_reel');
var start = firstJson('sonilo_start');
var waited = firstJson('wait_sonilo');
var taskId = String(
  result.task_id ||
    poll.task_id ||
    waited.task_id ||
    start.task_id ||
    start.id ||
    prep.task_id ||
    ''
).trim();
var pollCount = Number(waited.poll_count || 0) + 1;
var maxPolls = Number(prep.sonilo_max_polls || pick.sonilo_max_polls || waited.sonilo_max_polls || 0);
var waitSeconds = Number(
  prep.sonilo_wait_seconds || pick.sonilo_wait_seconds || waited.sonilo_wait_seconds || 0
);

if (status === 'failed' || status === 'canceled' || status === 'cancelled' || status === 'error') {
  throw new Error(
    'parse_sonilo: Sonilo task ' +
      (taskId || '?') +
      ' status=' +
      status +
      (err ? ' error=' + err : '') +
      '.'
  );
}

var processing =
  status === 'processing' ||
  status === 'queued' ||
  status === 'pending' ||
  status === 'running' ||
  status === 'created';

if (processing) {
  if (pollCount >= maxPolls) {
    throw new Error(
      'parse_sonilo: still processing after ' +
        pollCount +
        ' polls (task_id=' +
        (taskId || '?') +
        '). Raise sonilo_wait_seconds or sonilo_max_polls on the sheet.'
    );
  }
  return [
    {
      json: {
        ready: false,
        status: status || 'processing',
        task_id: taskId,
        poll_count: pollCount,
        sonilo_wait_seconds: waitSeconds,
        sonilo_max_polls: maxPolls,
        reel_id: String(prep.reel_id || pick.reel_id || ''),
        audio_poll_base: String(prep.audio_poll_base || pick.audio_poll_base || ''),
      },
    },
  ];
}

if (status !== 'succeeded' && status !== 'success' && status !== 'completed') {
  throw new Error(
    'parse_sonilo: unexpected Sonilo status ' +
      JSON.stringify(result.status || poll.status) +
      ' keys=' +
      Object.keys(poll).join(',')
  );
}

var outputUrl =
  httpsUrl(result.output_url) ||
  httpsUrl(poll.output_url) ||
  httpsUrl(firstOut.output_url) ||
  httpsUrl(result.video && result.video.url) ||
  httpsUrl(result.audio && result.audio.url) ||
  httpsUrl(result.video_url) ||
  httpsUrl(result.audio_url);
if (!outputUrl) {
  throw new Error(
    'parse_sonilo: succeeded but no https output_url. Keys: ' + Object.keys(poll).join(', ')
  );
}

var outputType = String(
  result.output_type || firstOut.output_type || pick.output_mode || ''
).toLowerCase();
var isVideo =
  outputType === 'video' ||
  outputType === 'muxed_video' ||
  /\.mp4(\?|$)/i.test(outputUrl);

return [
  {
    json: {
      ready: true,
      status: 'succeeded',
      task_id: taskId,
      poll_count: pollCount,
      reel_id: String(prep.reel_id || pick.reel_id || ''),
      output_url: outputUrl,
      output_type: isVideo ? 'video' : 'audio',
      audio_url: isVideo ? '' : outputUrl,
      audio_video_url: isVideo ? outputUrl : '',
      music_stem_url: stemUrl(result.music || firstOut.music || poll.music),
      sfx_stem_url: stemUrl(result.sfx || firstOut.sfx || poll.sfx),
      still_ids: Array.isArray(pick.still_ids) ? pick.still_ids : [],
    },
  },
];
