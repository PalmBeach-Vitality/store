import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'i2v_howto',
    parameters: {
      color: 4,
      width: 1026,
      height: 360,
      content: '# film_i2v_kling_001_004 (unpublished)\\n# One Execute = next empty FILM-001 or FILM-004 Kling 1080p row.\\n# Does not pick FILM-020 or any other row. Do not Publish.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const getFilm = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    position: [240, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      options: {},
    },
    output: [{ still_id: 'FILM-001', status: 'Active', video_provider: 'kling', picked_url: 'https://example.com/a.png', video_url: '' }],
  },
});

const pickStill = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'pick_film_still',
    position: [496, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: pick_film_still\n// Workflow: film_i2v_kling_001_004 (unpublished)\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: prep_openrouter_i2v\n//\n// Picks the next Active Kling row among FILM-001 and FILM-004 only.\n// Does not pick FILM-020 or any other row.\n\nvar REQUIRED_PROVIDER = 'kling';\nvar ALLOWED = { 'FILM-001': true, 'FILM-004': true };\nfunction val(obj, names) {\n  obj = obj || {};\n  for (var i = 0; i < names.length; i++) {\n    var n = names[i];\n    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];\n  }\n  return '';\n}\nfunction requireField(row, name, stillId) {\n  var v = String(val(row, [name]) == null ? '' : val(row, [name])).trim();\n  if (!v) throw new Error('SHEETS-ONLY: 18-motsc-film-stills row missing ' + name + ' (still_id=' + (stillId || '?') + '). Fill the cell, do not hardcode.');\n  return v;\n}\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  return /^https:\\/\\//i.test(s) ? s : '';\n}\nfunction parseAudio(raw, stillId) {\n  if (raw === false || raw === true) return raw;\n  var s = String(raw === undefined || raw === null ? '' : raw).trim().toLowerCase();\n  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;\n  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;\n  throw new Error('SHEETS-ONLY: audio must be true or false (still_id=' + stillId + ', got ' + JSON.stringify(raw) + ')');\n}\nfunction durationOk(provider, duration) {\n  if (provider === 'seedance') return duration >= 4 && duration <= 30;\n  if (provider === 'kling') return duration >= 3 && duration <= 15;\n  if (provider === 'veo') return duration === 4 || duration === 6 || duration === 8;\n  if (provider === 'runway') return duration >= 2 && duration <= 10;\n  return false;\n}\nvar rows = $input.all().map(function (i) { return i.json; });\nif (!rows.length) throw new Error('No film still rows. Check get_film_stills Document 18-motsc-film-stills.');\nvar scored = rows.map(function (r) {\n  return {\n    still_id: String(val(r, ['still_id'])).trim(),\n    rank: Number(val(r, ['rank'])) || 0,\n    category: String(val(r, ['category'])).trim(),\n    status: String(val(r, ['status'])).trim(),\n    picked_url: httpsUrl(val(r, ['picked_url'])),\n    video_url: httpsUrl(val(r, ['video_url'])),\n    video_motion_prompt: String(val(r, ['video_motion_prompt'])).trim(),\n    video_provider: String(val(r, ['video_provider'])).trim().toLowerCase(),\n    model_video: String(val(r, ['model_video'])).trim(),\n    duration_seconds: val(r, ['duration_seconds', 'duration']),\n    resolution: String(val(r, ['video_resolution', 'resolution'])).trim(),\n    video_aspect_ratio: String(val(r, ['video_aspect_ratio'])).trim(),\n    audio: val(r, ['audio', 'generate_audio']),\n    bitrate_mode: String(val(r, ['bitrate_mode'])).trim(),\n    wait_seconds: val(r, ['wait_seconds']),\n    video_start_url: String(val(r, ['video_start_url'])).trim(),\n    times_used: Number(val(r, ['times_used'])) || 0,\n  };\n}).filter(function (r) {\n  return ALLOWED[r.still_id] && r.status.toLowerCase() === 'active' && r.picked_url && !r.video_url && r.video_provider === REQUIRED_PROVIDER;\n}).sort(function (a, b) { return a.rank - b.rank; });\nif (!scored.length) throw new Error('No Active FILM-001/FILM-004 ' + REQUIRED_PROVIDER + ' rows with picked_url and empty video_url.');\nvar pick = scored[0];\nvar motion = requireField(pick, 'video_motion_prompt', pick.still_id);\nvar provider = requireField(pick, 'video_provider', pick.still_id);\nif (provider !== REQUIRED_PROVIDER) throw new Error('pick_film_still: row ' + pick.still_id + ' is ' + provider + ', this workflow requires ' + REQUIRED_PROVIDER);\nvar model = requireField(pick, 'model_video', pick.still_id);\nvar durationRaw = requireField(pick, 'duration_seconds', pick.still_id);\nvar duration = Number(durationRaw);\nif (!isFinite(duration) || !durationOk(provider, duration)) throw new Error('SHEETS-ONLY: duration_seconds out of range for ' + provider + ' (still_id=' + pick.still_id + ', got ' + durationRaw + ')');\nvar resolution = requireField(pick, 'resolution', pick.still_id);\nvar waitRaw = requireField(pick, 'wait_seconds', pick.still_id);\nvar waitSeconds = Number(waitRaw);\nif (!isFinite(waitSeconds) || waitSeconds < 1) throw new Error('SHEETS-ONLY: wait_seconds must be a number (still_id=' + pick.still_id + ', got ' + waitRaw + ')');\nvar audio = parseAudio(pick.audio, pick.still_id);\nvar startUrl = requireField(pick, 'video_start_url', pick.still_id);\nvar aspect = String(pick.video_aspect_ratio || '').trim();\nif (provider === 'seedance' || provider === 'veo' || provider === 'runway') aspect = requireField(pick, 'video_aspect_ratio', pick.still_id);\nvar bitrate = String(pick.bitrate_mode || '').trim();\nif (provider === 'seedance') bitrate = requireField(pick, 'bitrate_mode', pick.still_id);\nvar veoDuration = String(duration) + 's';\nreturn [{ json: { still_id: pick.still_id, category: pick.category, rank: pick.rank, picked_url: pick.picked_url, still_url: pick.picked_url, video_motion_prompt: motion, video_provider: provider, model_video: model, duration_seconds: duration, duration_label: provider === 'veo' ? veoDuration : String(duration), resolution: resolution, video_aspect_ratio: aspect, audio: audio, generate_audio: audio, bitrate_mode: bitrate, wait_seconds: waitSeconds, video_start_url: startUrl, still_times_used: pick.times_used, remaining_without_video: scored.length } }];\n",
    },
    output: [{
      still_id: 'FILM-001',
      picked_url: 'https://example.com/a.png',
      still_url: 'https://example.com/a.png',
      video_motion_prompt: 'Waist-up hold. Silent.',
      video_provider: 'kling',
      model_video: 'kwaivgi/kling-v3.0-pro',
      duration_seconds: 8,
      resolution: '1080p',
      video_aspect_ratio: '9:16',
      audio: false,
      generate_audio: false,
      wait_seconds: 300,
      video_start_url: 'https://openrouter.ai/api/v1/videos',
    }],
  },
});

const prepI2v = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'prep_openrouter_i2v',
    position: [720, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "function firstJson(name) { try { return $(name).first().json || {}; } catch (e) { return {}; } }\nfunction httpsUrl(s) { s = String(s || '').trim(); if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s; return ''; }\nfunction requireText(value, label, stillId) { var v = String(value == null ? '' : value).trim(); if (!v) throw new Error('SHEETS-ONLY: missing ' + label + ' (still_id=' + (stillId || '?') + ').'); return v; }\nfunction assertOpenRouterModel(model, stillId) { var m = String(model || '').trim(); if (!m) throw new Error('SHEETS-ONLY: model_video empty (still_id=' + (stillId || '?') + ').'); if (m.indexOf('fal-ai/') === 0 || m.indexOf('fal.run/') !== -1) throw new Error('model_video is still a fal slug (' + m + '). Run overlay_film_i2v_stack. still_id=' + (stillId || '?')); return m; }\nvar pick = ($input.first() && $input.first().json) || firstJson('pick_film_still');\nvar stillId = String(pick.still_id || '').trim();\nvar still = httpsUrl(pick.still_url || pick.picked_url);\nif (!still) throw new Error('prep_openrouter_i2v still_url missing (still_id=' + (stillId || '?') + ').');\nvar model = assertOpenRouterModel(pick.model_video, stillId);\nvar motion = requireText(pick.video_motion_prompt, 'video_motion_prompt', stillId);\nvar duration = Number(pick.duration_seconds);\nif (!isFinite(duration) || duration < 1) throw new Error('SHEETS-ONLY: duration_seconds must be a number (still_id=' + stillId + ').');\nvar resolution = requireText(pick.resolution, 'resolution', stillId);\nif (String(resolution).toLowerCase() !== '1080p') throw new Error('1080p ONLY. video_resolution must be 1080p (still_id=' + stillId + ', got ' + resolution + ').');\nvar waitSeconds = Number(pick.wait_seconds);\nif (!isFinite(waitSeconds) || waitSeconds < 1) throw new Error('SHEETS-ONLY: wait_seconds must be a number (still_id=' + stillId + ').');\nvar audio = pick.generate_audio;\nif (audio !== true && audio !== false) throw new Error('SHEETS-ONLY: audio must be boolean (still_id=' + stillId + ').');\nvar startUrl = String(pick.video_start_url || '').trim();\nif (startUrl && startUrl.indexOf('openrouter.ai') === -1) throw new Error('video_start_url is not OpenRouter (' + startUrl + '). Overlay Sheet 18.');\nvar body = { model: model, prompt: motion, duration: duration, resolution: resolution, generate_audio: audio, frame_images: [{ type: 'image_url', image_url: { url: still }, frame_type: 'first_frame' }] };\nvar aspect = String(pick.video_aspect_ratio || '').trim();\nif (aspect && aspect !== 'auto') body.aspect_ratio = aspect;\nreturn [{ json: { still_id: stillId, still_url: still, video_motion_prompt: motion, video_provider: String(pick.video_provider || ''), model_video: model, duration_seconds: duration, resolution: resolution, video_aspect_ratio: aspect, generate_audio: audio, wait_seconds: waitSeconds, video_start_url: startUrl || 'https://openrouter.ai/api/v1/videos', openrouter_url: 'https://openrouter.ai/api/v1/videos', openrouter_body_json: JSON.stringify(body) } }];\n",
    },
    output: [{
      still_id: 'FILM-001',
      still_url: 'https://example.com/a.png',
      openrouter_url: 'https://openrouter.ai/api/v1/videos',
      openrouter_body_json: '{}',
      wait_seconds: 300,
    }],
  },
});

const startI2v = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'openrouter_i2v_start',
    position: [944, 304],
    credentials: { openRouterApi: newCredential('OpenRouter account') },
    parameters: {
      authentication: 'predefinedCredentialType',
      contentType: 'json',
      jsonBody: expr('{{ JSON.parse($json.openrouter_body_json) }}'),
      method: 'POST',
      nodeCredentialType: 'openRouterApi',
      options: { timeout: 120000 },
      sendBody: true,
      specifyBody: 'json',
      url: 'https://openrouter.ai/api/v1/videos',
    },
    output: [{ id: 'job1', polling_url: 'https://openrouter.ai/api/v1/videos/job1', status: 'pending' }],
  },
});

const waitI2v = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'wait_i2v',
    position: [1168, 304],
    parameters: {
      amount: expr("{{ Number($('prep_openrouter_i2v').first().json.wait_seconds) }}"),
      resume: 'timeInterval',
      unit: 'seconds',
    },
    output: [{ id: 'job1', polling_url: 'https://openrouter.ai/api/v1/videos/job1', status: 'pending' }],
  },
});

const pollI2v = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'openrouter_i2v_poll',
    position: [1392, 304],
    credentials: { openRouterApi: newCredential('OpenRouter account') },
    parameters: {
      authentication: 'predefinedCredentialType',
      method: 'GET',
      nodeCredentialType: 'openRouterApi',
      options: { timeout: 120000 },
      url: expr("{{ ($json.polling_url && String($json.polling_url).indexOf('http') === 0) ? $json.polling_url : ('https://openrouter.ai/api/v1/videos/' + $json.id) }}"),
    },
    output: [{ id: 'job1', status: 'completed', unsigned_urls: ['https://openrouter.ai/api/v1/videos/job1/content?index=0'] }],
  },
});

const saveUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'save_film_video_url',
    position: [1616, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "function firstJson(name) { try { return $(name).first().json || {}; } catch (e) { return {}; } }\nfunction httpsUrl(s) { s = String(s || '').trim(); if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s; return ''; }\nfunction pickOpenRouterVideoUrl(obj) { obj = obj || {}; if (Array.isArray(obj.unsigned_urls) && obj.unsigned_urls.length) return httpsUrl(obj.unsigned_urls[0]); return httpsUrl(obj.video && obj.video.url) || httpsUrl(obj.video_url) || httpsUrl(obj.url) || ''; }\nvar poll = ($input.first() && $input.first().json) || {};\nvar status = String(poll.status || '').toLowerCase();\nvar err = poll.error; if (err && typeof err === 'object') err = err.message || JSON.stringify(err);\nif (status !== 'completed') throw new Error('OpenRouter video status is ' + JSON.stringify(poll.status) + (err ? ' error=' + err : '') + '. Raise wait_seconds if still pending.');\nvar video = pickOpenRouterVideoUrl(poll);\nif (!video) throw new Error('OpenRouter completed but returned no https video URL. Keys: ' + Object.keys(poll).join(', '));\nvar pick = firstJson('pick_film_still');\nvar stillId = String(pick.still_id || '').trim();\nif (!stillId) throw new Error('save_film_video_url: missing still_id from pick_film_still.');\nif (stillId !== 'FILM-001' && stillId !== 'FILM-004') throw new Error('save_film_video_url: refused still_id ' + stillId);\nreturn [{ json: { still_id: stillId, video_url: video, video_request_id: String(poll.id || poll.generation_id || '').trim(), last_used_at: $now.toISO(), model_video: String(pick.model_video || ''), video_provider: String(pick.video_provider || ''), duration_seconds: pick.duration_seconds } }];\n",
    },
    output: [{ still_id: 'FILM-001', video_url: 'https://openrouter.ai/api/v1/videos/job1/content?index=0', video_request_id: 'job1' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_still',
    position: [1840, 304],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU',
        cachedResultName: '18-motsc-film-stills',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1628285227',
        cachedResultName: '18-motsc-film-stills',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['still_id'],
        value: {
          still_id: expr('{{ $json.still_id }}'),
          video_url: expr('{{ $json.video_url }}'),
          video_request_id: expr('{{ $json.video_request_id }}'),
          last_used_at: expr('{{ $json.last_used_at }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'video_url', displayName: 'video_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'video_request_id', displayName: 'video_request_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'last_used_at', displayName: 'last_used_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: {},
    },
  },
});

export default workflow('film_i2v_kling_001_004', 'film_i2v_kling_001_004')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(pickStill)
  .to(prepI2v)
  .to(startI2v)
  .to(waitI2v)
  .to(pollI2v)
  .to(saveUrl)
  .to(sheetsUpdate);
