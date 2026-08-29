import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const manualTrigger = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: {
    name: 'manual_trigger',
    position: [0, 304],
    output: [{ ok: true }],
  },
});

const getFilmStills = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'get_film_stills',
    executeOnce: true,
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU', cachedResultName: '18-motsc-film-stills' },
      sheetName: { __rl: true, mode: 'list', value: '1628285227', cachedResultName: '18-motsc-film-stills' },
      options: {},
    },
    position: [240, 304],
    output: [{ still_id: 'FILM-012', status: 'Active', picked_url: 'https://example.com/still.jpg', video_url: '', video_provider: 'runway', video_start_url: 'https://api.dev.runwayml.com/v1/image_to_video' }],
  },
});

const pickFilmStill = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'pick_film_still',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: pick_film_still\n// Workflow: film_i2v_runway\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: prep_runway_video_start\n//\n// SHEETS-ONLY. Next Active row with picked_url, empty video_url, and\n// video_provider matching REQUIRED_PROVIDER. Empty required cells throw.\n\nvar REQUIRED_PROVIDER = 'runway';\n\nfunction val(obj, names) {\n  obj = obj || {};\n  for (var i = 0; i < names.length; i++) {\n    var n = names[i];\n    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {\n      return obj[n];\n    }\n  }\n  return '';\n}\n\nfunction requireField(row, name, stillId) {\n  var v = String(val(row, [name]) == null ? '' : val(row, [name])).trim();\n  if (!v) {\n    throw new Error(\n      'SHEETS-ONLY: 18-motsc-film-stills row missing ' +\n        name +\n        ' (still_id=' +\n        (stillId || '?') +\n        '). Fill the cell, do not hardcode.'\n    );\n  }\n  return v;\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  return /^https:\\/\\//i.test(s) ? s : '';\n}\n\nfunction parseAudio(raw, stillId) {\n  if (raw === false || raw === true) return raw;\n  var s = String(raw === undefined || raw === null ? '' : raw)\n    .trim()\n    .toLowerCase();\n  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;\n  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;\n  throw new Error(\n    'SHEETS-ONLY: audio must be true or false (still_id=' + stillId + ', got ' + JSON.stringify(raw) + ')'\n  );\n}\n\nfunction durationOk(provider, duration) {\n  if (provider === 'seedance') return duration >= 4 && duration <= 30;\n  if (provider === 'kling') return duration >= 3 && duration <= 15;\n  if (provider === 'veo') return duration === 4 || duration === 6 || duration === 8;\n  if (provider === 'runway') return duration >= 2 && duration <= 10;\n  return false;\n}\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\n\nif (!rows.length) {\n  throw new Error('No film still rows. Check get_film_stills Document 18-motsc-film-stills.');\n}\n\nvar scored = rows\n  .map(function (r) {\n    return {\n      still_id: String(val(r, ['still_id'])).trim(),\n      rank: Number(val(r, ['rank'])) || 0,\n      category: String(val(r, ['category'])).trim(),\n      status: String(val(r, ['status'])).trim(),\n      picked_url: httpsUrl(val(r, ['picked_url'])),\n      video_url: httpsUrl(val(r, ['video_url'])),\n      video_motion_prompt: String(val(r, ['video_motion_prompt'])).trim(),\n      video_provider: String(val(r, ['video_provider'])).trim().toLowerCase(),\n      model_video: String(val(r, ['model_video'])).trim(),\n      duration_seconds: val(r, ['duration_seconds', 'duration']),\n      resolution: String(val(r, ['video_resolution', 'resolution'])).trim(),\n      video_aspect_ratio: String(val(r, ['video_aspect_ratio'])).trim(),\n      audio: val(r, ['audio', 'generate_audio']),\n      bitrate_mode: String(val(r, ['bitrate_mode'])).trim(),\n      wait_seconds: val(r, ['wait_seconds']),\n      video_start_url: String(val(r, ['video_start_url'])).trim(),\n      times_used: Number(val(r, ['times_used'])) || 0,\n    };\n  })\n  .filter(function (r) {\n    return (\n      r.still_id &&\n      r.status.toLowerCase() === 'active' &&\n      r.picked_url &&\n      !r.video_url &&\n      r.video_provider === REQUIRED_PROVIDER\n    );\n  })\n  .sort(function (a, b) {\n    return a.rank - b.rank;\n  });\n\nif (!scored.length) {\n  throw new Error(\n    'No Active ' +\n      REQUIRED_PROVIDER +\n      ' rows with picked_url and empty video_url. Run the matching film_i2v_* workflow, or fill picked_url.'\n  );\n}\n\nvar pick = scored[0];\nvar motion = requireField(pick, 'video_motion_prompt', pick.still_id);\nvar provider = requireField(pick, 'video_provider', pick.still_id);\nif (provider !== REQUIRED_PROVIDER) {\n  throw new Error(\n    'pick_film_still: row ' + pick.still_id + ' is ' + provider + ', this workflow requires ' + REQUIRED_PROVIDER\n  );\n}\nvar model = requireField(pick, 'model_video', pick.still_id);\nvar durationRaw = requireField(pick, 'duration_seconds', pick.still_id);\nvar duration = Number(durationRaw);\nif (!isFinite(duration) || !durationOk(provider, duration)) {\n  throw new Error(\n    'SHEETS-ONLY: duration_seconds out of range for ' +\n      provider +\n      ' (still_id=' +\n      pick.still_id +\n      ', got ' +\n      durationRaw +\n      ')'\n  );\n}\nvar resolution = requireField(pick, 'resolution', pick.still_id);\nvar waitRaw = requireField(pick, 'wait_seconds', pick.still_id);\nvar waitSeconds = Number(waitRaw);\nif (!isFinite(waitSeconds) || waitSeconds < 1) {\n  throw new Error(\n    'SHEETS-ONLY: wait_seconds must be a number (still_id=' + pick.still_id + ', got ' + waitRaw + ')'\n  );\n}\nvar audio = parseAudio(pick.audio, pick.still_id);\nvar startUrl = requireField(pick, 'video_start_url', pick.still_id);\n\nvar aspect = String(pick.video_aspect_ratio || '').trim();\nif (provider === 'seedance' || provider === 'veo' || provider === 'runway') {\n  aspect = requireField(pick, 'video_aspect_ratio', pick.still_id);\n}\n\nvar bitrate = String(pick.bitrate_mode || '').trim();\nif (provider === 'seedance') {\n  bitrate = requireField(pick, 'bitrate_mode', pick.still_id);\n}\n\nvar veoDuration = String(duration) + 's';\n\nreturn [\n  {\n    json: {\n      still_id: pick.still_id,\n      category: pick.category,\n      rank: pick.rank,\n      picked_url: pick.picked_url,\n      still_url: pick.picked_url,\n      video_motion_prompt: motion,\n      video_provider: provider,\n      model_video: model,\n      duration_seconds: duration,\n      duration_label: provider === 'veo' ? veoDuration : String(duration),\n      resolution: resolution,\n      video_aspect_ratio: aspect,\n      audio: audio,\n      generate_audio: audio,\n      bitrate_mode: bitrate,\n      wait_seconds: waitSeconds,\n      video_start_url: startUrl,\n      still_times_used: pick.times_used,\n      remaining_without_video: scored.length,\n    },\n  },\n];\n",
    },
    position: [496, 304],
    output: [{ still_id: 'FILM-012', still_url: 'https://example.com/still.jpg', video_motion_prompt: 'Seat the vial.', video_provider: 'runway', model_video: 'gen4.5', duration_seconds: 10, video_aspect_ratio: '720:1280', wait_seconds: 180, video_start_url: 'https://api.dev.runwayml.com/v1/image_to_video' }],
  },
});

const prepRunway = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'prep_runway_video_start',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: prep_runway_video_start\n// Workflow: film_i2v_runway\n// Mode: Run Once for All Items\n// After: pick_film_still\n// Before: runway_video_start\n//\n// SHEETS-ONLY. Body fields come from pick_film_still. Empty cells already threw.\n\nfunction firstJson(name) {\n  try {\n    return $(name).first().json || {};\n  } catch (e) {\n    return {};\n  }\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  return /^https:\\/\\//i.test(s) ? s : '';\n}\n\nvar input = ($input.first() && $input.first().json) || {};\nvar pick = firstJson('pick_film_still');\n\nvar still = httpsUrl(input.still_url) || httpsUrl(input.picked_url) || httpsUrl(pick.still_url) || httpsUrl(pick.picked_url);\nif (!still) {\n  throw new Error('prep_runway_video_start: picked_url / still_url missing from pick_film_still.');\n}\n\nvar motion = String(input.video_motion_prompt || pick.video_motion_prompt || '').trim();\nif (!motion) {\n  throw new Error('prep_runway_video_start: video_motion_prompt missing from pick_film_still.');\n}\n\nvar modelVideo = String(input.model_video || pick.model_video || '').trim();\nif (!modelVideo) {\n  throw new Error('prep_runway_video_start: model_video missing from pick_film_still.');\n}\n\nvar duration = Number(input.duration_seconds || pick.duration_seconds);\nif (!isFinite(duration) || duration < 1) {\n  throw new Error('prep_runway_video_start: duration_seconds missing from pick_film_still.');\n}\n\nvar ratio = String(input.video_aspect_ratio || pick.video_aspect_ratio || '').trim();\nif (!ratio) {\n  throw new Error('prep_runway_video_start: video_aspect_ratio missing from pick_film_still.');\n}\n\nvar startUrl = String(input.video_start_url || pick.video_start_url || '').trim();\nif (!startUrl) {\n  throw new Error('prep_runway_video_start: video_start_url missing from pick_film_still.');\n}\n\nvar body = {\n  model: modelVideo,\n  promptText: motion,\n  promptImage: still,\n  ratio: ratio,\n  duration: duration,\n};\n\nreturn [\n  {\n    json: {\n      still_id: String(input.still_id || pick.still_id || ''),\n      category: String(input.category || pick.category || ''),\n      still_url: still,\n      picked_url: still,\n      video_motion_prompt: motion,\n      video_provider: 'runway',\n      model_video: modelVideo,\n      duration_seconds: duration,\n      video_aspect_ratio: ratio,\n      wait_seconds: Number(input.wait_seconds || pick.wait_seconds || 0),\n      video_start_url: startUrl,\n      runway_video_body_json: JSON.stringify(body),\n    },\n  },\n];\n",
    },
    position: [752, 304],
    output: [{ still_id: 'FILM-012', video_start_url: 'https://api.dev.runwayml.com/v1/image_to_video', runway_video_body_json: '{}', wait_seconds: 180 }],
  },
});

const runwayStart = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'runway_video_start',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.video_start_url }}'),
      authentication: 'none',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'X-Runway-Version', value: '2024-11-06' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr('{{ $json.runway_video_body_json }}'),
      options: { timeout: 180000 },
    },
    position: [1008, 304],
    output: [{ id: 'task-1' }],
  },
});

const waitVideo = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'wait_video',
    parameters: {
      resume: 'timeInterval',
      amount: expr('{{ Number($("pick_film_still").first().json.wait_seconds) }}'),
      unit: 'seconds',
    },
    position: [1264, 304],
    output: [{ id: 'task-1' }],
  },
});

const runwayPoll = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'runway_video_poll',
    parameters: {
      method: 'GET',
      url: expr('{{ "https://api.dev.runwayml.com/v1/tasks/" + String($("runway_video_start").first().json.id || "") }}'),
      authentication: 'none',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'X-Runway-Version', value: '2024-11-06' },
        ],
      },
      options: {},
    },
    position: [1520, 304],
    output: [{ id: 'task-1', status: 'SUCCEEDED', output: ['https://example.com/out.mp4'] }],
  },
});

const saveFilmVideoUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'save_film_video_url',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "// n8n Code node: save_film_video_url\n// Workflow: film_i2v_runway\n// Mode: Run Once for All Items\n// After: runway_video_poll\n// Before: sheets_update_still\n//\n// Runtime video URL only. Prompt / model stay on the picked sheet row.\n\nfunction firstJson(name) {\n  try {\n    return $(name).first().json || {};\n  } catch (e) {\n    return {};\n  }\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  return /^https:\\/\\//i.test(s) ? s : '';\n}\n\nfunction pickUrl(obj) {\n  if (!obj || typeof obj !== 'object') return '';\n  var output = obj.output;\n  if (Array.isArray(output) && output[0]) {\n    return httpsUrl(typeof output[0] === 'string' ? output[0] : output[0].url);\n  }\n  return (\n    httpsUrl(obj.video && obj.video.url) ||\n    httpsUrl(obj.video_url) ||\n    httpsUrl(obj.url) ||\n    ''\n  );\n}\n\nvar poll = ($input.first() && $input.first().json) || {};\nvar start = firstJson('runway_video_start');\nvar prep = firstJson('prep_runway_video_start');\nvar pick = firstJson('pick_film_still');\n\nvar status = String(poll.status || poll.state || '').toLowerCase();\nif (status && status !== 'succeeded' && status !== 'success' && status !== 'done') {\n  throw new Error(\n    'save_film_video_url: runway_video_poll status=' +\n      status +\n      '. Attach the Runway key and re-run, or wait longer.'\n  );\n}\n\nvar video_url = pickUrl(poll) || pickUrl(start);\nif (!video_url) {\n  throw new Error(\n    'save_film_video_url: runway_video_poll returned no https video URL. keys=' + Object.keys(poll).join(', ')\n  );\n}\n\nvar stillId = String(prep.still_id || pick.still_id || '').trim();\nif (!stillId) {\n  throw new Error('save_film_video_url: missing still_id from pick_film_still.');\n}\n\nreturn [\n  {\n    json: {\n      still_id: stillId,\n      video_url: video_url,\n      video_request_id: String(start.id || poll.id || '').trim(),\n      last_used_at: $now.toISO(),\n      model_video: String(prep.model_video || pick.model_video || ''),\n      video_provider: 'runway',\n      duration_seconds: prep.duration_seconds || pick.duration_seconds,\n    },\n  },\n];\n",
    },
    position: [1776, 304],
    output: [{ still_id: 'FILM-012', video_url: 'https://example.com/out.mp4', video_request_id: 'task-1', last_used_at: '2026-08-29T00:00:00.000Z' }],
  },
});

const sheetsUpdateStill = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_still',
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account') },
    parameters: {
      resource: 'sheet',
      operation: 'update',
      documentId: { __rl: true, mode: 'id', value: '1ChDI33MVdCwGXcPDBvETRoc5xY8DEgZS3KU5VC09dnU', cachedResultName: '18-motsc-film-stills' },
      sheetName: { __rl: true, mode: 'list', value: '1628285227', cachedResultName: '18-motsc-film-stills' },
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
          { id: 'last_used_at', displayName: 'last_used_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ],
      },
      options: {},
    },
    position: [2032, 304],
    output: [{ still_id: 'FILM-012', video_url: 'https://example.com/out.mp4' }],
  },
});

const howto = node({
  type: 'n8n-nodes-base.stickyNote',
  version: 1,
  config: {
    name: 'film_i2v_howto',
    parameters: {
      content: "## film_i2v_runway (unpublished)\nOne Execute = next Active runway row with picked_url and empty video_url.\nRunway Gen-4.5 HTTP. Attach the Runway API key later. No Creatomate. Do not Publish. Do not Execute until Sal says yes.",
      height: 280,
      width: 760,
      color: 4,
    },
    position: [0, 0],
    output: [{ note: true }],
  },
});

export default workflow('film_i2v_runway', 'film_i2v_runway')
  .add(howto)
  .add(manualTrigger)
  .to(getFilmStills)
  .to(pickFilmStill)
  .to(prepRunway)
  .to(runwayStart)
  .to(waitVideo)
  .to(runwayPoll)
  .to(saveFilmVideoUrl)
  .to(sheetsUpdateStill);
