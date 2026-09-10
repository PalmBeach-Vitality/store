// n8n Code node: route_hop1
// After: openrouter_i2v_poll
// Before: switch_hop1
// Routes hop 1: completed → last-frame, pending → poll again,
// resource-pack fail → wait and resubmit. Do not treat quota as a wait issue.

function firstJson(name) {
  try {
    return $(name).first().json || {};
  } catch (e) {
    return {};
  }
}

function runCount(name) {
  var n = 0;
  try {
    for (var i = 0; i < 40; i++) {
      var items = $items(name, 0, i);
      if (!items || !items.length) break;
      n++;
    }
  } catch (e) {}
  return n;
}

function errText(raw) {
  if (raw && typeof raw === 'object') return String(raw.message || JSON.stringify(raw));
  return String(raw || '');
}

var hop1 = ($input.first() && $input.first().json) || {};
var status = String(hop1.status || '').toLowerCase();
var err = errText(hop1.error);
var waitMax = Number(firstJson('prep_molecule_video_start').wait_seconds || 180);
if (!isFinite(waitMax) || waitMax < 1) waitMax = 180;
var pollCount = runCount('openrouter_i2v_poll');
var quotaTries = runCount('retry_hop1_body');
var pendingish =
  status === 'pending' ||
  status === 'in_progress' ||
  status === 'processing' ||
  status === 'queued' ||
  status === 'running';
var quota = /resource pack|parallel task|1303/i.test(err) || /resource pack|parallel task|1303/i.test(status);

var out = Object.assign({}, hop1, {
  hop1_poll_count: pollCount,
  hop1_quota_retries: quotaTries,
});

if (status === 'completed') {
  out.hop1_route = 'done';
  return [{ json: out }];
}

if (pendingish) {
  if (pollCount * 45 >= waitMax && pollCount >= 2) {
    throw new Error(
      'OpenRouter hop 1 still ' +
        status +
        ' after ' +
        pollCount +
        ' polls. Raise wait_seconds on Sheet 13 if Kling is still generating. This is not a resource-pack failure.'
    );
  }
  out.hop1_route = 'wait';
  return [{ json: out }];
}

if (quota) {
  if (quotaTries >= 5) {
    throw new Error(
      'Kling resource pack concurrency is still full after ' +
        quotaTries +
        ' retries (parallel task over resource pack limit). Wait until other Kling jobs finish, then Execute from prep_molecule_video_start. Raising wait_i2v will not help — this job already failed.'
    );
  }
  out.hop1_route = 'quota';
  return [{ json: out }];
}

throw new Error(
  'OpenRouter hop 1 failed (status=' +
    JSON.stringify(hop1.status) +
    (err ? ' error=' + err : '') +
    '). This is not a wait issue. Do not raise wait_i2v on a failed job.'
);
