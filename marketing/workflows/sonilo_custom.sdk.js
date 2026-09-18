import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'sonilo_howto',
    parameters: {
      color: 4,
      width: 1100,
      height: 520,
      content: '# sonilo_custom (unpublished)\n# Scores one Active row from Sheet 22-sonilo-custom.\n# Paste video_url + music_prompt + sfx_prompt, set status=Active, Execute.\n# Attach Simplified Custom Auth (Sonilo). Do not Publish until a dry run succeeds.',
    },
  },
});

const startTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'manual_trigger', position: [0, 304] },
});

const getJobs = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_sonilo_jobs',
    position: [220, 304],
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '10J0KA0P7nitt5NLanXEXoPZQ7iRyxVZPoNZXCFD5Hb0',
        cachedResultName: '22-sonilo-custom',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1698858753',
        cachedResultName: '22-sonilo-custom',
      },
      options: {},
    },
    output: [{ job_id: 'SONILO-001', video_url: 'https://example.com/clip.mp4', music_prompt: 'bed', sfx_prompt: 'whoosh', audio_host: 'sonilo', sound_type: 'music_and_sfx', output_mode: 'muxed_video', audio_endpoint: 'https://api.sonilo.com/v1/video-to-video-sound', audio_poll_base: 'https://api.sonilo.com/v1/tasks', sonilo_wait_seconds: '90', sonilo_max_polls: '20', ducking: 'false', preserve_speech: 'false', keep_original_sound: 'false', status: 'Active', times_used: '0' }],
  },
});

const pickJob = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'pick_sonilo_job',
    position: [460, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: pick_sonilo_job\n// After: get_sonilo_jobs\n// Before: prep_sonilo_start\n// One Active job from 22-sonilo-custom. Least times_used.\n// Requires https video_url + music_prompt + sfx_prompt. Does not invent prompts.\n\nfunction val(obj, names) {\n  obj = obj || {};\n  for (var i = 0; i < names.length; i++) {\n    var n = names[i];\n    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];\n  }\n  return '';\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;\n  return '';\n}\n\nfunction flagFalse(s, name) {\n  var v = String(s || '').trim().toLowerCase();\n  if (v === 'false' || v === '0' || v === 'no') return false;\n  if (v === 'true' || v === '1' || v === 'yes') {\n    throw new Error(\n      'SHEETS-ONLY: ' +\n        name +\n        ' is ' +\n        v +\n        '. sonilo_custom sends generated music+sfx only. Set ' +\n        name +\n        ' to false.'\n    );\n  }\n  throw new Error('SHEETS-ONLY: 22-sonilo-custom missing ' + name + ' (expected false).');\n}\n\nfunction isActive(status) {\n  return String(status || '').trim().toLowerCase() === 'active';\n}\n\nfunction usedCount(r) {\n  var n = Number(val(r, ['times_used']));\n  return isFinite(n) ? n : 0;\n}\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) {\n  throw new Error('pick_sonilo_job: no rows from get_sonilo_jobs.');\n}\n\nvar withId = [];\nfor (var i = 0; i < rows.length; i++) {\n  var r = rows[i] || {};\n  var jobId = String(val(r, ['job_id'])).trim();\n  if (!jobId) continue;\n  withId.push(r);\n}\nif (!withId.length) {\n  throw new Error('pick_sonilo_job: no job_id rows on 22-sonilo-custom.');\n}\n\nvar active = withId.filter(function (r) {\n  return isActive(val(r, ['status']));\n});\nif (!active.length) {\n  throw new Error(\n    'pick_sonilo_job: no Active rows on 22-sonilo-custom. Paste video_url + music_prompt + sfx_prompt and set status=Active.'\n  );\n}\n\nvar complete = active.filter(function (r) {\n  return httpsUrl(val(r, ['video_url'])) && String(val(r, ['music_prompt'])).trim() && String(val(r, ['sfx_prompt'])).trim();\n});\nif (!complete.length) {\n  throw new Error(\n    'SHEETS-ONLY: Active row missing video_url, music_prompt, or sfx_prompt. Fill the cells \u2014 do not invent a fallback.'\n  );\n}\n\ncomplete.sort(function (a, b) {\n  var du = usedCount(a) - usedCount(b);\n  if (du !== 0) return du;\n  var ta = String(val(a, ['last_used_at']) || '');\n  var tb = String(val(b, ['last_used_at']) || '');\n  if (ta !== tb) return ta < tb ? -1 : 1;\n  return String(val(a, ['job_id'])).localeCompare(String(val(b, ['job_id'])));\n});\n\nvar first = complete[0];\n\nfunction req(name) {\n  var v = String(val(first, [name])).trim();\n  if (!v) {\n    throw new Error(\n      'SHEETS-ONLY: 22-sonilo-custom missing ' + name + ' on ' + val(first, ['job_id']) + '. Fill the cell \u2014 do not invent a fallback.'\n    );\n  }\n  return v;\n}\n\nvar audioHost = req('audio_host').toLowerCase();\nif (audioHost !== 'sonilo') {\n  throw new Error('SHEETS-ONLY: audio_host must be sonilo (got ' + audioHost + ').');\n}\nvar soundType = req('sound_type').toLowerCase();\nif (soundType !== 'music_and_sfx') {\n  throw new Error('SHEETS-ONLY: sound_type must be music_and_sfx (got ' + soundType + ').');\n}\nvar outputMode = req('output_mode').toLowerCase();\nif (outputMode !== 'muxed_video' && outputMode !== 'audio') {\n  throw new Error('SHEETS-ONLY: output_mode must be muxed_video or audio (got ' + outputMode + ').');\n}\nvar audioEndpoint = req('audio_endpoint');\nif (audioEndpoint.indexOf('https://api.sonilo.com/v1/video-to-') !== 0) {\n  throw new Error('SHEETS-ONLY: audio_endpoint must be an https://api.sonilo.com/v1/video-to-* URL.');\n}\nif (outputMode === 'muxed_video' && audioEndpoint.indexOf('video-to-video-sound') === -1) {\n  throw new Error('SHEETS-ONLY: output_mode=muxed_video requires audio_endpoint .../video-to-video-sound.');\n}\nif (outputMode === 'audio' && !/\\/video-to-sound$/.test(audioEndpoint)) {\n  throw new Error('SHEETS-ONLY: output_mode=audio requires audio_endpoint .../video-to-sound.');\n}\nvar pollBase = req('audio_poll_base');\nif (pollBase.indexOf('https://api.sonilo.com/v1/tasks') !== 0) {\n  throw new Error('SHEETS-ONLY: audio_poll_base must be https://api.sonilo.com/v1/tasks.');\n}\nvar waitSeconds = Number(req('sonilo_wait_seconds'));\nif (!isFinite(waitSeconds) || waitSeconds < 5) {\n  throw new Error('SHEETS-ONLY: sonilo_wait_seconds must be a number >= 5.');\n}\nvar maxPolls = Number(req('sonilo_max_polls'));\nif (!isFinite(maxPolls) || maxPolls < 1) {\n  throw new Error('SHEETS-ONLY: sonilo_max_polls must be a number >= 1.');\n}\nflagFalse(req('ducking'), 'ducking');\nflagFalse(req('preserve_speech'), 'preserve_speech');\nflagFalse(req('keep_original_sound'), 'keep_original_sound');\n\nreturn [\n  {\n    json: {\n      job_id: req('job_id'),\n      title: String(val(first, ['title'])).trim(),\n      audio_host: audioHost,\n      sound_type: soundType,\n      output_mode: outputMode,\n      audio_endpoint: audioEndpoint,\n      audio_poll_base: pollBase.replace(/\\/$/, ''),\n      music_prompt: req('music_prompt'),\n      sfx_prompt: req('sfx_prompt'),\n      video_url: httpsUrl(val(first, ['video_url'])),\n      sonilo_wait_seconds: waitSeconds,\n      sonilo_max_polls: maxPolls,\n      times_used: usedCount(first),\n    },\n  },\n];\n",
    },
    output: [{ job_id: 'SONILO-001', video_url: 'https://example.com/clip.mp4', music_prompt: 'bed', sfx_prompt: 'whoosh', audio_endpoint: 'https://api.sonilo.com/v1/video-to-video-sound', audio_poll_base: 'https://api.sonilo.com/v1/tasks', sonilo_wait_seconds: 90, sonilo_max_polls: 20, output_mode: 'muxed_video', times_used: 0 }],
  },
});

const prepStart = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'prep_sonilo_start',
    position: [700, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: prep_sonilo_start\n// After: pick_sonilo_job\n// Before: sonilo_start\n// Maps 22-sonilo-custom fields onto the Sonilo multipart body. No invented prompts.\n\nfunction firstJson(name) {\n  try {\n    return $(name).first().json || {};\n  } catch (e) {\n    return {};\n  }\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;\n  return '';\n}\n\nvar pick = ($input.first() && $input.first().json) || firstJson('pick_sonilo_job');\nvar videoUrl = httpsUrl(pick.video_url);\nvar musicPrompt = String(pick.music_prompt || '').trim();\nvar sfxPrompt = String(pick.sfx_prompt || '').trim();\nvar endpoint = String(pick.audio_endpoint || '').trim();\nvar pollBase = String(pick.audio_poll_base || '').trim();\nif (!videoUrl) throw new Error('prep_sonilo_start: missing https video_url from pick_sonilo_job.');\nif (!musicPrompt) throw new Error('SHEETS-ONLY: music_prompt empty. Fill the sheet cell.');\nif (!sfxPrompt) throw new Error('SHEETS-ONLY: sfx_prompt empty. Fill the sheet cell.');\nif (!endpoint) throw new Error('SHEETS-ONLY: audio_endpoint empty. Fill the sheet cell.');\nif (!pollBase) throw new Error('SHEETS-ONLY: audio_poll_base empty. Fill the sheet cell.');\n\nreturn [\n  {\n    json: {\n      job_id: String(pick.job_id || ''),\n      title: String(pick.title || ''),\n      video_url: videoUrl,\n      music_prompt: musicPrompt,\n      sfx_prompt: sfxPrompt,\n      audio_endpoint: endpoint,\n      audio_poll_base: pollBase,\n      output_mode: String(pick.output_mode || ''),\n      sonilo_wait_seconds: Number(pick.sonilo_wait_seconds),\n      sonilo_max_polls: Number(pick.sonilo_max_polls),\n      times_used: Number(pick.times_used || 0),\n    },\n  },\n];\n",
    },
    output: [{ job_id: 'SONILO-001', video_url: 'https://example.com/clip.mp4', music_prompt: 'bed', sfx_prompt: 'whoosh', audio_endpoint: 'https://api.sonilo.com/v1/video-to-video-sound', audio_poll_base: 'https://api.sonilo.com/v1/tasks', sonilo_wait_seconds: 90, sonilo_max_polls: 20, times_used: 0 }],
  },
});

const downloadSource = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'download_source_mp4',
    position: [820, 304],
    parameters: {
      method: 'GET',
      url: expr('{{ $json.video_url }}'),
      authentication: 'none',
      options: {
        timeout: 180000,
        redirect: { redirect: { followRedirects: true, maxRedirects: 5 } },
        response: { response: { responseFormat: 'file', outputPropertyName: 'data' } },
      },
    },
    output: [{ mimeType: 'video/mp4' }],
  },
});

const forceMp4 = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'force_mp4_binary',
    position: [940, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "var item = $input.first();\nif (!item || !item.binary || !item.binary.data) {\n  throw new Error('force_mp4_binary: download_source_mp4 returned no file. Check video_url on the sheet.');\n}\nvar bin = item.binary.data;\nvar sz = Number(bin.fileSize || 0);\nif (sz && sz < 100000) {\n  throw new Error('force_mp4_binary: downloaded file is ' + sz + ' bytes — not an MP4. Host probably returned HTML.');\n}\nbin.fileName = 'source.mp4';\nbin.mimeType = 'video/mp4';\nbin.fileExtension = 'mp4';\nreturn [item];\n",
    },
    output: [{ mimeType: 'video/mp4' }],
  },
});

const soniloStart = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'sonilo_start',
    position: [1060, 304],
    credentials: { httpTemplatedCustomAuth: newCredential('Simplified Custom Auth account') },
    parameters: {
      method: 'POST',
      url: expr("{{ $('prep_sonilo_start').item.json.audio_endpoint }}"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true,
      contentType: 'multipart-form-data',
      bodyParameters: {
        parameters: [
          { parameterType: 'formBinaryData', name: 'video', inputDataFieldName: 'data' },
          { name: 'music_prompt', value: expr("{{ $('prep_sonilo_start').item.json.music_prompt }}") },
          { name: 'sfx_prompt', value: expr("{{ $('prep_sonilo_start').item.json.sfx_prompt }}") },
        ],
      },
      options: { timeout: 180000 },
    },
    output: [{ task_id: 'task_123', status: 'processing' }],
  },
});

const waitSonilo = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'wait_sonilo',
    position: [1180, 304],
    parameters: {
      resume: 'timeInterval',
      amount: expr("{{ Number($json.sonilo_wait_seconds || $('prep_sonilo_start').first().json.sonilo_wait_seconds) }}"),
      unit: 'seconds',
    },
    output: [{ task_id: 'task_123', status: 'processing', sonilo_wait_seconds: 90, poll_count: 0 }],
  },
});

const soniloPoll = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'sonilo_poll',
    position: [1420, 304],
    credentials: { httpTemplatedCustomAuth: newCredential('Simplified Custom Auth account') },
    parameters: {
      method: 'GET',
      url: expr("{{ ($('prep_sonilo_start').first().json.audio_poll_base || $json.audio_poll_base) + '/' + ($json.task_id || $('sonilo_start').first().json.task_id) }}"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      options: { timeout: 120000 },
    },
    output: [{ task_id: 'task_123', status: 'succeeded', output_url: 'https://example.com/scored.mp4', output_type: 'video' }],
  },
});

const parseSonilo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'parse_sonilo',
    position: [1660, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: parse_sonilo\n// After: sonilo_poll\n// Before: if_sonilo_ready\n// Reads Sonilo task status. Loops while processing. Fails clearly on error.\n\nfunction firstJson(name) {\n  try {\n    return $(name).first().json || {};\n  } catch (e) {\n    return {};\n  }\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;\n  return '';\n}\n\nfunction stemUrl(obj) {\n  if (!obj) return '';\n  if (typeof obj === 'string') return httpsUrl(obj);\n  if (typeof obj === 'object') {\n    return (\n      httpsUrl(obj.url) ||\n      httpsUrl(obj.output_url) ||\n      httpsUrl(obj.audio && obj.audio.url) ||\n      ''\n    );\n  }\n  return '';\n}\n\nvar poll = ($input.first() && $input.first().json) || {};\nvar result = poll.result && typeof poll.result === 'object' ? poll.result : poll;\nvar outputs = Array.isArray(result.outputs)\n  ? result.outputs\n  : Array.isArray(poll.outputs)\n    ? poll.outputs\n    : [];\nvar firstOut = outputs[0] && typeof outputs[0] === 'object' ? outputs[0] : {};\nvar status = String(result.status || poll.status || '').trim().toLowerCase();\nvar err = result.error || poll.error || result.message || poll.message;\nif (err && typeof err === 'object') err = err.message || JSON.stringify(err);\n\nvar prep = firstJson('prep_sonilo_start');\nvar pick = firstJson('pick_sonilo_job');\nvar start = firstJson('sonilo_start');\nvar waited = firstJson('wait_sonilo');\nvar taskId = String(\n  result.task_id ||\n    poll.task_id ||\n    waited.task_id ||\n    start.task_id ||\n    start.id ||\n    prep.task_id ||\n    ''\n).trim();\nvar pollCount = Number(waited.poll_count || 0) + 1;\nvar maxPolls = Number(prep.sonilo_max_polls || pick.sonilo_max_polls || waited.sonilo_max_polls || 0);\nvar waitSeconds = Number(\n  prep.sonilo_wait_seconds || pick.sonilo_wait_seconds || waited.sonilo_wait_seconds || 0\n);\nvar jobId = String(prep.job_id || pick.job_id || '').trim();\n\nif (status === 'failed' || status === 'canceled' || status === 'cancelled' || status === 'error') {\n  throw new Error(\n    'parse_sonilo: Sonilo task ' +\n      (taskId || '?') +\n      ' status=' +\n      status +\n      (err ? ' error=' + err : '') +\n      '.'\n  );\n}\n\nvar processing =\n  status === 'processing' ||\n  status === 'queued' ||\n  status === 'pending' ||\n  status === 'running' ||\n  status === 'created';\n\nif (processing) {\n  if (pollCount >= maxPolls) {\n    throw new Error(\n      'parse_sonilo: still processing after ' +\n        pollCount +\n        ' polls (task_id=' +\n        (taskId || '?') +\n        '). Raise sonilo_wait_seconds or sonilo_max_polls on the sheet.'\n    );\n  }\n  return [\n    {\n      json: {\n        ready: false,\n        status: status || 'processing',\n        task_id: taskId,\n        poll_count: pollCount,\n        sonilo_wait_seconds: waitSeconds,\n        sonilo_max_polls: maxPolls,\n        job_id: jobId,\n        audio_poll_base: String(prep.audio_poll_base || pick.audio_poll_base || ''),\n      },\n    },\n  ];\n}\n\nif (status !== 'succeeded' && status !== 'success' && status !== 'completed') {\n  throw new Error(\n    'parse_sonilo: unexpected Sonilo status ' +\n      JSON.stringify(result.status || poll.status) +\n      ' keys=' +\n      Object.keys(poll).join(',')\n  );\n}\n\nvar outputUrl =\n  httpsUrl(result.output_url) ||\n  httpsUrl(poll.output_url) ||\n  httpsUrl(firstOut.output_url) ||\n  httpsUrl(result.video && result.video.url) ||\n  httpsUrl(result.audio && result.audio.url) ||\n  httpsUrl(result.video_url) ||\n  httpsUrl(result.audio_url);\nif (!outputUrl) {\n  throw new Error(\n    'parse_sonilo: succeeded but no https output_url. Keys: ' + Object.keys(poll).join(', ')\n  );\n}\n\nvar outputType = String(\n  result.output_type || firstOut.output_type || pick.output_mode || ''\n).toLowerCase();\nvar isVideo =\n  outputType === 'video' ||\n  outputType === 'muxed_video' ||\n  /\\.mp4(\\?|$)/i.test(outputUrl);\n\nreturn [\n  {\n    json: {\n      ready: true,\n      status: 'succeeded',\n      task_id: taskId,\n      poll_count: pollCount,\n      job_id: jobId,\n      output_url: outputUrl,\n      output_type: isVideo ? 'video' : 'audio',\n      audio_url: isVideo ? '' : outputUrl,\n      audio_video_url: isVideo ? outputUrl : '',\n      music_stem_url: stemUrl(result.music || firstOut.music || poll.music),\n      sfx_stem_url: stemUrl(result.sfx || firstOut.sfx || poll.sfx),\n    },\n  },\n];\n",
    },
    output: [{ ready: true, status: 'succeeded', task_id: 'task_123', output_url: 'https://example.com/scored.mp4', output_type: 'video', audio_video_url: 'https://example.com/scored.mp4', job_id: 'SONILO-001' }],
  },
});

const ifReady = ifElse({
  version: 2.2,
  config: {
    name: 'if_sonilo_ready',
    position: [1900, 304],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'is-ready',
            leftValue: expr('{{ $json.ready }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
    },
    output: [{ ready: true, output_url: 'https://example.com/scored.mp4' }],
  },
});

const saveSonilo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'save_sonilo_url',
    position: [2140, 480],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: save_sonilo_url\n// After: if_sonilo_ready (true)\n// Before: sheets_update_sonilo\n// Writes muxed URL + times_used onto the scored 22-sonilo-custom job.\n\nfunction firstJson(name) {\n  try {\n    return $(name).first().json || {};\n  } catch (e) {\n    return {};\n  }\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  if (s.indexOf('https://') === 0 || s.indexOf('HTTPS://') === 0) return s;\n  return '';\n}\n\nvar parsed = ($input.first() && $input.first().json) || {};\nif (!parsed.ready) {\n  throw new Error('save_sonilo_url: Sonilo is still processing. Wire this node only on if_sonilo_ready true.');\n}\n\nvar outputUrl = httpsUrl(parsed.output_url);\nif (!outputUrl) throw new Error('save_sonilo_url: missing output_url from parse_sonilo.');\n\nvar pick = firstJson('pick_sonilo_job');\nvar prep = firstJson('prep_sonilo_start');\nvar jobId = String(parsed.job_id || pick.job_id || prep.job_id || '').trim();\nif (!jobId) throw new Error('save_sonilo_url: job_id empty.');\n\nvar audioUrl = httpsUrl(parsed.audio_url);\nvar videoUrl = httpsUrl(parsed.audio_video_url);\nvar used = Number(pick.times_used || prep.times_used || 0);\nif (!isFinite(used) || used < 0) used = 0;\n\nreturn [\n  {\n    json: {\n      job_id: jobId,\n      audio_url: audioUrl,\n      audio_video_url: videoUrl,\n      music_stem_url: httpsUrl(parsed.music_stem_url),\n      sfx_stem_url: httpsUrl(parsed.sfx_stem_url),\n      audio_status: 'scored',\n      sonilo_task_id: String(parsed.task_id || ''),\n      times_used: used + 1,\n      last_used_at: new Date().toISOString(),\n    },\n  },\n];\n",
    },
    output: [{ job_id: 'SONILO-001', audio_video_url: 'https://example.com/scored.mp4', audio_status: 'scored', sonilo_task_id: 'task_123', times_used: 1 }],
  },
});

const col = (id, match=false) => ({ id, displayName: id, required: match, defaultMatch: match, display: true, type: 'string', canBeUsedToMatch: match });

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_sonilo',
    position: [2380, 480],
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: {
        __rl: true,
        mode: 'id',
        value: '10J0KA0P7nitt5NLanXEXoPZQ7iRyxVZPoNZXCFD5Hb0',
        cachedResultName: '22-sonilo-custom',
      },
      sheetName: {
        __rl: true,
        mode: 'list',
        value: '1698858753',
        cachedResultName: '22-sonilo-custom',
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['job_id'],
        value: {
          job_id: expr('{{ $json.job_id }}'),
          audio_url: expr('{{ $json.audio_url }}'),
          audio_video_url: expr('{{ $json.audio_video_url }}'),
          music_stem_url: expr('{{ $json.music_stem_url }}'),
          sfx_stem_url: expr('{{ $json.sfx_stem_url }}'),
          audio_status: expr('{{ $json.audio_status }}'),
          sonilo_task_id: expr('{{ $json.sonilo_task_id }}'),
          times_used: expr('{{ $json.times_used }}'),
          last_used_at: expr('{{ $json.last_used_at }}'),
        },
        schema: [
          col('job_id', true),
          col('audio_url'),
          col('audio_video_url'),
          col('music_stem_url'),
          col('sfx_stem_url'),
          col('audio_status'),
          col('sonilo_task_id'),
          col('times_used'),
          col('last_used_at'),
        ],
      },
      options: { cellFormat: 'RAW', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ job_id: 'SONILO-001', audio_video_url: 'https://example.com/scored.mp4' }],
  },
});

export default workflow('sonilo_custom', 'sonilo_custom')
  .add(howto)
  .add(startTrigger)
  .to(getJobs)
  .to(pickJob)
  .to(prepStart)
  .to(downloadSource)
  .to(forceMp4)
  .to(soniloStart)
  .to(waitSonilo)
  .to(soniloPoll)
  .to(parseSonilo)
  .to(
    ifReady
      .onTrue(saveSonilo.to(sheetsUpdate))
      .onFalse(waitSonilo)
  );
