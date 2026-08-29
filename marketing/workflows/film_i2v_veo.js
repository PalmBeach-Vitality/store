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
    output: [{ still_id: 'FILM-009', status: 'Active', picked_url: 'https://example.com/still.jpg', video_url: '', video_provider: 'veo' }],
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
      jsCode: "// n8n Code node: pick_film_still\n// Workflow: film_i2v_veo\n// Mode: Run Once for All Items\n// After: get_film_stills\n// Before: fal_i2v_generate\n//\n// SHEETS-ONLY. Next Active row with picked_url, empty video_url, and\n// video_provider matching REQUIRED_PROVIDER. Empty required cells throw.\n\nvar REQUIRED_PROVIDER = 'veo';\n\nfunction val(obj, names) {\n  obj = obj || {};\n  for (var i = 0; i < names.length; i++) {\n    var n = names[i];\n    if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') {\n      return obj[n];\n    }\n  }\n  return '';\n}\n\nfunction requireField(row, name, stillId) {\n  var v = String(val(row, [name]) == null ? '' : val(row, [name])).trim();\n  if (!v) {\n    throw new Error(\n      'SHEETS-ONLY: 18-motsc-film-stills row missing ' +\n        name +\n        ' (still_id=' +\n        (stillId || '?') +\n        '). Fill the cell, do not hardcode.'\n    );\n  }\n  return v;\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  return /^https:\\/\\//i.test(s) ? s : '';\n}\n\nfunction parseAudio(raw, stillId) {\n  if (raw === false || raw === true) return raw;\n  var s = String(raw === undefined || raw === null ? '' : raw)\n    .trim()\n    .toLowerCase();\n  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;\n  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;\n  throw new Error(\n    'SHEETS-ONLY: audio must be true or false (still_id=' + stillId + ', got ' + JSON.stringify(raw) + ')'\n  );\n}\n\nfunction durationOk(provider, duration) {\n  if (provider === 'seedance') return duration >= 4 && duration <= 30;\n  if (provider === 'kling') return duration >= 3 && duration <= 15;\n  if (provider === 'veo') return duration === 4 || duration === 6 || duration === 8;\n  if (provider === 'runway') return duration >= 2 && duration <= 10;\n  return false;\n}\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\n\nif (!rows.length) {\n  throw new Error('No film still rows. Check get_film_stills Document 18-motsc-film-stills.');\n}\n\nvar scored = rows\n  .map(function (r) {\n    return {\n      still_id: String(val(r, ['still_id'])).trim(),\n      rank: Number(val(r, ['rank'])) || 0,\n      category: String(val(r, ['category'])).trim(),\n      status: String(val(r, ['status'])).trim(),\n      picked_url: httpsUrl(val(r, ['picked_url'])),\n      video_url: httpsUrl(val(r, ['video_url'])),\n      video_motion_prompt: String(val(r, ['video_motion_prompt'])).trim(),\n      video_provider: String(val(r, ['video_provider'])).trim().toLowerCase(),\n      model_video: String(val(r, ['model_video'])).trim(),\n      duration_seconds: val(r, ['duration_seconds', 'duration']),\n      resolution: String(val(r, ['video_resolution', 'resolution'])).trim(),\n      video_aspect_ratio: String(val(r, ['video_aspect_ratio'])).trim(),\n      audio: val(r, ['audio', 'generate_audio']),\n      bitrate_mode: String(val(r, ['bitrate_mode'])).trim(),\n      wait_seconds: val(r, ['wait_seconds']),\n      video_start_url: String(val(r, ['video_start_url'])).trim(),\n      times_used: Number(val(r, ['times_used'])) || 0,\n    };\n  })\n  .filter(function (r) {\n    return (\n      r.still_id &&\n      r.status.toLowerCase() === 'active' &&\n      r.picked_url &&\n      !r.video_url &&\n      r.video_provider === REQUIRED_PROVIDER\n    );\n  })\n  .sort(function (a, b) {\n    return a.rank - b.rank;\n  });\n\nif (!scored.length) {\n  throw new Error(\n    'No Active ' +\n      REQUIRED_PROVIDER +\n      ' rows with picked_url and empty video_url. Run the matching film_i2v_* workflow, or fill picked_url.'\n  );\n}\n\nvar pick = scored[0];\nvar motion = requireField(pick, 'video_motion_prompt', pick.still_id);\nvar provider = requireField(pick, 'video_provider', pick.still_id);\nif (provider !== REQUIRED_PROVIDER) {\n  throw new Error(\n    'pick_film_still: row ' + pick.still_id + ' is ' + provider + ', this workflow requires ' + REQUIRED_PROVIDER\n  );\n}\nvar model = requireField(pick, 'model_video', pick.still_id);\nvar durationRaw = requireField(pick, 'duration_seconds', pick.still_id);\nvar duration = Number(durationRaw);\nif (!isFinite(duration) || !durationOk(provider, duration)) {\n  throw new Error(\n    'SHEETS-ONLY: duration_seconds out of range for ' +\n      provider +\n      ' (still_id=' +\n      pick.still_id +\n      ', got ' +\n      durationRaw +\n      ')'\n  );\n}\nvar resolution = requireField(pick, 'resolution', pick.still_id);\nvar waitRaw = requireField(pick, 'wait_seconds', pick.still_id);\nvar waitSeconds = Number(waitRaw);\nif (!isFinite(waitSeconds) || waitSeconds < 1) {\n  throw new Error(\n    'SHEETS-ONLY: wait_seconds must be a number (still_id=' + pick.still_id + ', got ' + waitRaw + ')'\n  );\n}\nvar audio = parseAudio(pick.audio, pick.still_id);\nvar startUrl = requireField(pick, 'video_start_url', pick.still_id);\n\nvar aspect = String(pick.video_aspect_ratio || '').trim();\nif (provider === 'seedance' || provider === 'veo' || provider === 'runway') {\n  aspect = requireField(pick, 'video_aspect_ratio', pick.still_id);\n}\n\nvar bitrate = String(pick.bitrate_mode || '').trim();\nif (provider === 'seedance') {\n  bitrate = requireField(pick, 'bitrate_mode', pick.still_id);\n}\n\nvar veoDuration = String(duration) + 's';\n\nreturn [\n  {\n    json: {\n      still_id: pick.still_id,\n      category: pick.category,\n      rank: pick.rank,\n      picked_url: pick.picked_url,\n      still_url: pick.picked_url,\n      video_motion_prompt: motion,\n      video_provider: provider,\n      model_video: model,\n      duration_seconds: duration,\n      duration_label: provider === 'veo' ? veoDuration : String(duration),\n      resolution: resolution,\n      video_aspect_ratio: aspect,\n      audio: audio,\n      generate_audio: audio,\n      bitrate_mode: bitrate,\n      wait_seconds: waitSeconds,\n      video_start_url: startUrl,\n      still_times_used: pick.times_used,\n      remaining_without_video: scored.length,\n    },\n  },\n];\n",
    },
    position: [496, 304],
    output: [{ still_id: 'FILM-009', still_url: 'https://example.com/still.jpg', video_motion_prompt: 'Slow fly-by.', video_provider: 'veo', model_video: 'bytedance/seedance-2.5/image-to-video', duration_seconds: 10, duration_label: '10', resolution: '1080p', video_aspect_ratio: 'auto', generate_audio: false, bitrate_mode: 'standard', wait_seconds: 300 }],
  },
});

const falI2vGenerate = node({
  type: '@fal-ai/n8n-nodes-fal.falAi',
  version: 1,
  config: {
    name: 'fal_i2v_generate',
    credentials: { falAiApi: newCredential('fal.ai account') },
    parameters: {
      resource: 'model',
      operation: 'generate',
      model: { __rl: true, mode: 'id', value: expr('{{ $json.model_video }}'), cachedResultName: 'veo' },
      modelParameters: {
        parameters: [
          { parameter: 'prompt', value: expr('{{ $json.video_motion_prompt }}') },
          { parameter: 'image_url', value: expr('{{ $json.still_url }}') },
          { parameter: 'aspect_ratio', value: expr('{{ $json.video_aspect_ratio }}') },
          { parameter: 'duration', value: expr('{{ $json.duration_label }}') },
          { parameter: 'resolution', value: expr('{{ $json.resolution }}') },
          { parameter: 'generate_audio', value: expr('{{ $json.generate_audio }}') }
        ],
      },
      options: {
        waitForCompletion: true,
        pollInterval: 5,
        maxWaitTime: expr('{{ Number($json.wait_seconds) }}'),
      },
    },
    position: [768, 304],
    output: [{ video: { url: 'https://example.com/out.mp4' }, request_id: 'req-1' }],
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
      jsCode: "// n8n Code node: save_film_video_url\n// Workflows: film_i2v_seedance | film_i2v_kling | film_i2v_veo\n// Mode: Run Once for All Items\n// After: fal_i2v_generate\n// Before: sheets_update_still\n//\n// Runtime video URL only. Prompt / model stay on the picked sheet row.\n\nfunction firstJson(name) {\n  try {\n    return $(name).first().json || {};\n  } catch (e) {\n    return {};\n  }\n}\n\nfunction httpsUrl(s) {\n  s = String(s || '').trim();\n  return /^https:\\/\\//i.test(s) ? s : '';\n}\n\nfunction pickUrl(obj) {\n  if (!obj || typeof obj !== 'object') return '';\n  return (\n    httpsUrl(obj.video && obj.video.url) ||\n    httpsUrl(obj.video_url) ||\n    httpsUrl(obj.url) ||\n    httpsUrl(obj.data && obj.data.video && obj.data.video.url) ||\n    httpsUrl(obj.output && obj.output.video && obj.output.video.url) ||\n    ''\n  );\n}\n\nvar fal = ($input.first() && $input.first().json) || {};\nvar pick = firstJson('pick_film_still');\n\nvar video_url = pickUrl(fal);\nif (!video_url) {\n  throw new Error(\n    'save_film_video_url: fal_i2v_generate returned no https video URL. Keys: ' + Object.keys(fal).join(', ')\n  );\n}\n\nvar stillId = String(pick.still_id || '').trim();\nif (!stillId) {\n  throw new Error('save_film_video_url: missing still_id from pick_film_still.');\n}\n\nreturn [\n  {\n    json: {\n      still_id: stillId,\n      video_url: video_url,\n      video_request_id: String(fal.request_id || fal.requestId || fal.requestID || '').trim(),\n      last_used_at: $now.toISO(),\n      model_video: String(pick.model_video || ''),\n      video_provider: String(pick.video_provider || ''),\n      duration_seconds: pick.duration_seconds,\n    },\n  },\n];\n",
    },
    position: [1040, 304],
    output: [{ still_id: 'FILM-009', video_url: 'https://example.com/out.mp4', video_request_id: 'req-1', last_used_at: '2026-08-29T00:00:00.000Z' }],
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
    position: [1312, 304],
    output: [{ still_id: 'FILM-009', video_url: 'https://example.com/out.mp4' }],
  },
});

const howto = node({
  type: 'n8n-nodes-base.stickyNote',
  version: 1,
  config: {
    name: 'film_i2v_howto',
    parameters: {
      content: "## film_i2v_veo (unpublished)\nOne Execute = next Active veo row with picked_url and empty video_url.\nVeo 3.1 I2V on fal. Faces / product close-ups. No Creatomate. Do not Publish. Do not Execute until Sal says yes.",
      height: 280,
      width: 760,
      color: 4,
    },
    position: [0, 0],
    output: [{ note: true }],
  },
});

export default workflow('film_i2v_veo', 'film_i2v_veo')
  .add(howto)
  .add(manualTrigger)
  .to(getFilmStills)
  .to(pickFilmStill)
  .to(falI2vGenerate)
  .to(saveFilmVideoUrl)
  .to(sheetsUpdateStill);
