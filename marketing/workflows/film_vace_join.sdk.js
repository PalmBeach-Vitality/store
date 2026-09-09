import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const howto = sticky({
  config: {
    name: 'join_howto',
    parameters: {
      color: 4,
      width: 980,
      height: 520,
      content:
        '# film_vace_join (unpublished)\n' +
        '# One Execute = stitch all 25 Sheet 18 video_url clips via WaveSpeed VACE.\n' +
        '# Attach WaveSpeed templated credential on vace_start + vace_poll.\n' +
        '# Run overlay_film_join_25 first. Do not Publish.',
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
    position: [220, 304],
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
    output: [{ still_id: 'FILM-001', video_url: 'https://example.com/a.mp4', clip_order: '1', reel_id: 'MOTSC-FILM-01', seam_mode: 'vace', join_wait_seconds: '90' }],
  },
});

const pickReel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'pick_join_reel',
    position: [440, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        'function val(obj, names) { obj = obj || {}; for (var i = 0; i < names.length; i++) { var n = names[i]; if (obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== "") return obj[n]; } return ""; }\n' +
        'function httpsUrl(s) { s = String(s || "").trim(); if (s.indexOf("https://") === 0 || s.indexOf("HTTPS://") === 0) return s; return ""; }\n' +
        'function requireField(row, name, stillId) { var v = String(val(row, [name]) == null ? "" : val(row, [name])).trim(); if (!v) throw new Error("SHEETS-ONLY: 18-motsc-film-stills missing " + name + " (still_id=" + (stillId || "?") + "). Run overlay_film_join_25 and fill clip video_url."); return v; }\n' +
        'var rows = $input.all().map(function (i) { return i.json; });\n' +
        'if (!rows.length) throw new Error("pick_join_reel: no rows from get_film_stills.");\n' +
        'var clips = [];\n' +
        'for (var i = 0; i < rows.length; i++) {\n' +
        '  var r = rows[i] || {};\n' +
        '  var stillId = String(val(r, ["still_id"])).trim();\n' +
        '  if (!stillId) continue;\n' +
        '  var order = Number(requireField(r, "clip_order", stillId));\n' +
        '  if (!isFinite(order) || order < 1) throw new Error("SHEETS-ONLY: clip_order must be a number (still_id=" + stillId + ").");\n' +
        '  var clipUrl = httpsUrl(val(r, ["video_url", "clip_url"]));\n' +
        '  if (!clipUrl) throw new Error("SHEETS-ONLY: missing https video_url for still_id=" + stillId + ". Finish film_i2v_* for all 25 clips first.");\n' +
        '  var seamMode = String(val(r, ["seam_mode"]) || "vace").trim().toLowerCase();\n' +
        '  if (seamMode !== "vace" && seamMode !== "flf2v") throw new Error("SHEETS-ONLY: seam_mode must be vace or flf2v (still_id=" + stillId + ", got " + seamMode + ").");\n' +
        '  var bridgePrompt = String(val(r, ["bridge_prompt"])).trim();\n' +
        '  if (seamMode === "flf2v" && !bridgePrompt) throw new Error("SHEETS-ONLY: seam_mode=flf2v requires bridge_prompt (still_id=" + stillId + ").");\n' +
        '  clips.push({ still_id: stillId, clip_order: order, clip_url: clipUrl, seam_mode: seamMode, bridge_prompt: bridgePrompt, bridge_model: String(val(r, ["bridge_model"])).trim(), bridge_duration: String(val(r, ["bridge_duration"])).trim(), bridge_resolution: String(val(r, ["bridge_resolution"])).trim() });\n' +
        '}\n' +
        'clips.sort(function (a, b) { return a.clip_order - b.clip_order; });\n' +
        'if (clips.length !== 25) throw new Error("pick_join_reel: expected 25 clip rows, got " + clips.length + ".");\n' +
        'for (var j = 0; j < clips.length; j++) { if (Number(clips[j].clip_order) !== j + 1) throw new Error("pick_join_reel: clip_order must be 1..25 with no gaps (missing " + (j + 1) + ")."); }\n' +
        'var first = rows[0] || {};\n' +
        'var reelId = requireField(first, "reel_id", clips[0].still_id);\n' +
        'var waitRaw = requireField(first, "join_wait_seconds", clips[0].still_id);\n' +
        'var waitSeconds = Number(waitRaw);\n' +
        'if (!isFinite(waitSeconds) || waitSeconds < 1) throw new Error("SHEETS-ONLY: join_wait_seconds must be a number (got " + JSON.stringify(waitRaw) + ").");\n' +
        'var clipUrls = clips.map(function (c) { return c.clip_url; });\n' +
        'return [{ json: { reel_id: reelId, join_wait_seconds: waitSeconds, clip_count: clipUrls.length, clip_urls: clipUrls, remaining_urls: clipUrls.slice(), joined_url: "", batch_index: 0, has_more: true, clips: clips } }];\n',
    },
    output: [{ reel_id: 'MOTSC-FILM-01', join_wait_seconds: 90, clip_count: 25, remaining_urls: ['https://example.com/a.mp4'], has_more: true }],
  },
});

const prepVace = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'prep_vace_join',
    position: [680, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        'function firstJson(name) { try { return $(name).first().json || {}; } catch (e) { return {}; } }\n' +
        'function httpsUrl(s) { s = String(s || "").trim(); if (s.indexOf("https://") === 0 || s.indexOf("HTTPS://") === 0) return s; return ""; }\n' +
        'var pick = firstJson("pick_join_reel");\n' +
        'var parsed = firstJson("parse_vace_join");\n' +
        'var remaining = [];\n' +
        'var joined = "";\n' +
        'var batchIndex = 0;\n' +
        'var reelId = String(pick.reel_id || "").trim();\n' +
        'var waitSeconds = Number(pick.join_wait_seconds);\n' +
        'if (parsed && parsed.joined_url && parsed.has_more) {\n' +
        '  remaining = Array.isArray(parsed.remaining_urls) ? parsed.remaining_urls.slice() : [];\n' +
        '  joined = httpsUrl(parsed.joined_url);\n' +
        '  batchIndex = Number(parsed.batch_index || 0);\n' +
        '  if (parsed.reel_id) reelId = String(parsed.reel_id);\n' +
        '  if (parsed.join_wait_seconds) waitSeconds = Number(parsed.join_wait_seconds);\n' +
        '} else {\n' +
        '  remaining = Array.isArray(pick.remaining_urls) ? pick.remaining_urls.slice() : [];\n' +
        '  if (!remaining.length && Array.isArray(pick.clip_urls)) remaining = pick.clip_urls.slice();\n' +
        '}\n' +
        'if (!reelId) throw new Error("prep_vace_join: missing reel_id from pick_join_reel.");\n' +
        'if (!isFinite(waitSeconds) || waitSeconds < 1) throw new Error("SHEETS-ONLY: join_wait_seconds missing or invalid.");\n' +
        'var videos = [];\n' +
        'if (joined) {\n' +
        '  videos.push(joined);\n' +
        '  var take = Math.min(3, remaining.length);\n' +
        '  if (take < 1) throw new Error("prep_vace_join: joined_url set but no remaining clips to attach.");\n' +
        '  for (var i = 0; i < take; i++) videos.push(remaining[i]);\n' +
        '  remaining = remaining.slice(take);\n' +
        '} else {\n' +
        '  var firstTake = Math.min(4, remaining.length);\n' +
        '  if (firstTake < 2) throw new Error("prep_vace_join: need at least 2 clip URLs to start a VACE join (got " + firstTake + ").");\n' +
        '  videos = remaining.slice(0, firstTake);\n' +
        '  remaining = remaining.slice(firstTake);\n' +
        '}\n' +
        'if (videos.length < 2 || videos.length > 4) throw new Error("prep_vace_join: VACE accepts 2-4 videos, got " + videos.length + ".");\n' +
        'for (var v = 0; v < videos.length; v++) { if (!httpsUrl(videos[v])) throw new Error("prep_vace_join: videos[" + v + "] is not an https URL."); }\n' +
        'var body = { videos: videos };\n' +
        'return [{ json: { reel_id: reelId, join_wait_seconds: waitSeconds, batch_index: batchIndex + 1, videos: videos, remaining_urls: remaining, has_more: remaining.length > 0, vace_url: "https://api.wavespeed.ai/api/v3/wavespeed-ai/vace-video-joiner", vace_body_json: JSON.stringify(body) } }];\n',
    },
    output: [{ reel_id: 'MOTSC-FILM-01', join_wait_seconds: 90, batch_index: 1, vace_body_json: '{"videos":["https://example.com/a.mp4","https://example.com/b.mp4"]}', remaining_urls: [], has_more: true }],
  },
});

const vaceStart = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'vace_start',
    position: [920, 304],
    credentials: { httpTemplatedCustomAuth: newCredential('WaveSpeed') },
    parameters: {
      method: 'POST',
      url: 'https://api.wavespeed.ai/api/v3/wavespeed-ai/vace-video-joiner',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.parse($json.vace_body_json) }}'),
      options: { timeout: 120000 },
    },
    output: [{ id: 'pred_1', data: { id: 'pred_1', status: 'created' } }],
  },
});

const waitVace = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'wait_vace',
    position: [1140, 304],
    parameters: {
      resume: 'timeInterval',
      amount: expr("{{ Number($('prep_vace_join').first().json.join_wait_seconds) }}"),
      unit: 'seconds',
    },
    output: [{ id: 'pred_1', data: { id: 'pred_1', status: 'created' } }],
  },
});

const vacePoll = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'vace_poll',
    position: [1360, 304],
    credentials: { httpTemplatedCustomAuth: newCredential('WaveSpeed') },
    parameters: {
      method: 'GET',
      url: expr("{{ ($json.data && $json.data.id) ? ('https://api.wavespeed.ai/api/v3/predictions/' + $json.data.id + '/result') : ('https://api.wavespeed.ai/api/v3/predictions/' + $json.id + '/result') }}"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      options: { timeout: 120000 },
    },
    output: [{ data: { id: 'pred_1', status: 'completed', outputs: ['https://example.com/joined.mp4'] } }],
  },
});

const parseVace = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'parse_vace_join',
    position: [1580, 304],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        'function firstJson(name) { try { return $(name).first().json || {}; } catch (e) { return {}; } }\n' +
        'function httpsUrl(s) { s = String(s || "").trim(); if (s.indexOf("https://") === 0 || s.indexOf("HTTPS://") === 0) return s; return ""; }\n' +
        'function pickOutputUrl(obj) { obj = obj || {}; var data = obj.data && typeof obj.data === "object" ? obj.data : obj; var outputs = data.outputs || obj.outputs; if (Array.isArray(outputs) && outputs.length) { var first = outputs[0]; if (typeof first === "string") return httpsUrl(first); if (first && typeof first === "object") return httpsUrl(first.url || first.video_url || first.output); } return httpsUrl(data.video && data.video.url) || httpsUrl(obj.video && obj.video.url) || httpsUrl(data.url) || httpsUrl(obj.url) || ""; }\n' +
        'var poll = ($input.first() && $input.first().json) || {};\n' +
        'var data = poll.data && typeof poll.data === "object" ? poll.data : poll;\n' +
        'var status = String(data.status || poll.status || "").toLowerCase();\n' +
        'var err = data.error || poll.error; if (err && typeof err === "object") err = err.message || JSON.stringify(err);\n' +
        'if (status !== "completed") throw new Error("parse_vace_join: WaveSpeed status is " + JSON.stringify(data.status || poll.status) + (err ? " error=" + err : "") + ". Raise join_wait_seconds if still processing.");\n' +
        'var joined = pickOutputUrl(poll);\n' +
        'if (!joined) throw new Error("parse_vace_join: completed but no https output URL. Keys: " + Object.keys(poll).join(", "));\n' +
        'var prep = firstJson("prep_vace_join");\n' +
        'var remaining = Array.isArray(prep.remaining_urls) ? prep.remaining_urls.slice() : [];\n' +
        'var pick = firstJson("pick_join_reel");\n' +
        'return [{ json: { reel_id: String(prep.reel_id || pick.reel_id || ""), join_wait_seconds: Number(prep.join_wait_seconds || pick.join_wait_seconds), batch_index: Number(prep.batch_index || 0), joined_url: joined, remaining_urls: remaining, has_more: remaining.length > 0, vace_prediction_id: String(data.id || poll.id || "") } }];\n',
    },
    output: [{ reel_id: 'MOTSC-FILM-01', joined_url: 'https://example.com/joined.mp4', has_more: false, remaining_urls: [], batch_index: 8 }],
  },
});

const ifMore = ifElse({
  version: 2.2,
  config: {
    name: 'if_more_batches',
    position: [1800, 304],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        combinator: 'and',
        conditions: [
          {
            id: 'has-more',
            leftValue: expr('{{ $json.has_more }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true' },
          },
        ],
      },
    },
    output: [{ has_more: true, joined_url: 'https://example.com/joined.mp4' }],
  },
});

const saveJoin = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'save_join_url',
    position: [2040, 480],
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode:
        'function firstJson(name) { try { return $(name).first().json || {}; } catch (e) { return {}; } }\n' +
        'function httpsUrl(s) { s = String(s || "").trim(); if (s.indexOf("https://") === 0 || s.indexOf("HTTPS://") === 0) return s; return ""; }\n' +
        'var parsed = ($input.first() && $input.first().json) || {};\n' +
        'if (parsed.has_more) throw new Error("save_join_url: batches remain. Wire this node only on if_more_batches false.");\n' +
        'var joined = httpsUrl(parsed.joined_url);\n' +
        'if (!joined) throw new Error("save_join_url: missing joined_url from parse_vace_join.");\n' +
        'var pick = firstJson("pick_join_reel");\n' +
        'var clips = Array.isArray(pick.clips) ? pick.clips : [];\n' +
        'if (!clips.length) throw new Error("save_join_url: pick_join_reel.clips empty.");\n' +
        'var out = [];\n' +
        'for (var i = 0; i < clips.length; i++) {\n' +
        '  out.push({ json: { still_id: clips[i].still_id, reel_id: String(parsed.reel_id || pick.reel_id || ""), join_url: joined, join_status: "joined", vace_prediction_id: String(parsed.vace_prediction_id || ""), join_batch_count: Number(parsed.batch_index || 0) } });\n' +
        '}\n' +
        'return out;\n',
    },
    output: [{ still_id: 'FILM-001', join_url: 'https://example.com/joined.mp4', join_status: 'joined' }],
  },
});

const sheetsUpdate = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'sheets_update_join',
    position: [2260, 480],
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
          join_url: expr('{{ $json.join_url }}'),
          join_status: expr('{{ $json.join_status }}'),
        },
        schema: [
          { id: 'still_id', displayName: 'still_id', required: true, defaultMatch: true, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'join_url', displayName: 'join_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'join_status', displayName: 'join_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
        ],
      },
      options: { cellFormat: 'USER_ENTERED', handlingExtraData: 'insertInNewColumn' },
    },
    output: [{ still_id: 'FILM-001', join_url: 'https://example.com/joined.mp4' }],
  },
});

export default workflow('film_vace_join', 'film_vace_join')
  .add(howto)
  .add(startTrigger)
  .to(getFilm)
  .to(pickReel)
  .to(prepVace)
  .to(vaceStart)
  .to(waitVace)
  .to(vacePoll)
  .to(parseVace)
  .to(
    ifMore
      .onTrue(prepVace)
      .onFalse(saveJoin.to(sheetsUpdate))
  );
