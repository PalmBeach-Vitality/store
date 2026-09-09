// Shared OpenRouter video helpers for n8n Code nodes.
// Paste the functions you need into each Code node — n8n has no module import.
// API: POST https://openrouter.ai/api/v1/videos  then GET polling_url.

function httpsUrl(s) {
  s = String(s || '').trim();
  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;
  return '';
}

function requireText(value, label) {
  var v = String(value == null ? '' : value).trim();
  if (!v) {
    throw new Error('SHEETS-ONLY: missing ' + label + '. Fill the sheet cell, do not hardcode.');
  }
  return v;
}

function parseAudio(raw, label) {
  if (raw === false || raw === true) return raw;
  var s = String(raw == null ? '' : raw).trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  throw new Error('SHEETS-ONLY: ' + label + ' must be true or false. Got: ' + JSON.stringify(raw));
}

function assertOpenRouterModel(model) {
  var m = String(model || '').trim();
  if (!m) {
    throw new Error('SHEETS-ONLY: model_video is empty. Use an OpenRouter slug such as kwaivgi/kling-v3.0-pro.');
  }
  if (m.indexOf('fal-ai/') === 0 || m.indexOf('fal.run/') !== -1) {
    throw new Error(
      'model_video is still a fal slug (' +
        m +
        '). Set an OpenRouter slug (kwaivgi/kling-v3.0-pro, bytedance/seedance-2.5, google/veo-3.1).'
    );
  }
  if (m.indexOf('grok-imagine-video') === 0) {
    throw new Error(
      'model_video is still Grok (' +
        m +
        '). This hop is OpenRouter. Set kwaivgi/kling-v3.0-pro or another OpenRouter video slug.'
    );
  }
  return m;
}

function openRouterPollUrl(job) {
  job = job || {};
  var poll = String(job.polling_url || '').trim();
  if (poll.indexOf('https://') === 0) return poll;
  if (poll.indexOf('/api/v1/videos/') === 0) return 'https://openrouter.ai' + poll;
  var id = String(job.id || '').trim();
  if (!id) {
    throw new Error(
      'OpenRouter submit returned no job id / polling_url. Keys: ' + Object.keys(job).join(', ')
    );
  }
  return 'https://openrouter.ai/api/v1/videos/' + id;
}

function pickOpenRouterVideoUrl(obj) {
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

function assertOpenRouterCompleted(obj, nodeName) {
  obj = obj || {};
  var status = String(obj.status || '').toLowerCase();
  var err = obj.error;
  if (err && typeof err === 'object') err = err.message || JSON.stringify(err);
  if (status !== 'completed') {
    throw new Error(
      (nodeName || 'openrouter_i2v_poll') +
        ' status is ' +
        JSON.stringify(obj.status) +
        (err ? ' error=' + err : '') +
        '. Raise wait_seconds if still pending/in_progress.'
    );
  }
  var video = pickOpenRouterVideoUrl(obj);
  if (!video) {
    throw new Error(
      (nodeName || 'openrouter_i2v_poll') +
        ' completed but returned no https video URL. Keys: ' +
        Object.keys(obj).join(', ')
    );
  }
  return video;
}

function buildOpenRouterVideoBody(opts) {
  opts = opts || {};
  var model = assertOpenRouterModel(opts.model);
  var prompt = requireText(opts.prompt, opts.promptLabel || 'prompt');
  var duration = Number(opts.duration);
  if (!isFinite(duration) || duration < 1) {
    throw new Error('SHEETS-ONLY: duration_seconds must be a number. Got: ' + JSON.stringify(opts.duration));
  }
  var resolution = requireText(opts.resolution, 'resolution');
  var body = {
    model: model,
    prompt: prompt,
    duration: duration,
    resolution: resolution,
    generate_audio: parseAudio(opts.generate_audio, 'audio'),
  };
  var aspect = String(opts.aspect_ratio || '').trim();
  if (aspect) body.aspect_ratio = aspect;
  var still = httpsUrl(opts.still_url);
  if (still) {
    body.frame_images = [
      {
        type: 'image_url',
        image_url: { url: still },
        frame_type: 'first_frame',
      },
    ];
  }
  return body;
}
