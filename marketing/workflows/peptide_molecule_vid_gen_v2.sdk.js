import { workflow, node, trigger, sticky, ifElse, expr } from '@n8n/workflow-sdk';

const credSheets = { googleSheetsOAuth2Api: { id: "OGHfxWtOUeZbDesw", name: "Google Sheets account" } };

const credOpenRouter = { openRouterApi: { id: "zDmHXnCHbj14yIvl", name: "OpenRouter account" } };

const credXai = { httpHeaderAuth: { id: "z1BIQ5TSRwkwn4UG", name: "XAI Grok" } };

const credFal = { falAiApi: { id: "qfVt9MnUeOJxRexp", name: "fal.ai account" } };

const credCreatomate = { httpBearerAuth: { id: "02s8mB0EmuoResHc", name: "Bearer Auth account 2" } };

const smokeDocument = { __rl: true, mode: "id", value: "1XiCR6vs0tb4EawPE5hVlqYn3JElsOKsTDaH6HLbyHY0" };

const smokeTab = { __rl: true, mode: "list", value: "425569919", cachedResultName: "14-chem-breakdown-54" };

const strictOptions = { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 3 };

const routeRenderCode = "// n8n Code node: route_last_frame and route_concat (same code in both)\n// After: creatomate_last_frame_poll / creatomate_poll   Before: switch_last_frame / switch_concat\n//\n// done: true continues; done: false loops back to the Wait node. $runIndex counts this\n// node's own runs, so the loop stops after the sheet's creatomate_max_polls.\n\nvar pick = $('pick_molecule_creation').first().json;\nvar r = $input.first().json;\nvar polls = $runIndex + 1;\n\nif (r.status === 'succeeded') {\n  if (!/^https:\\/\\//i.test(String(r.url || ''))) {\n    throw new Error('Creatomate render ' + r.id + ' succeeded without a url.');\n  }\n  // A free Creatomate plan clamps both sides to 480 px, which would hand hop 2 a\n  // preview-size frame and ship a sub-720p cut.\n  if (r.width !== pick.render_width || r.height !== pick.render_height) {\n    throw new Error(\n      'Creatomate render ' + r.id + ' came back ' + (r.width || '?') + 'x' + (r.height || '?') +\n        ', the sheet asks for ' + pick.render_width + 'x' + pick.render_height + '. Stopped before the next paid step.'\n    );\n  }\n  return [{ json: { done: true, url: r.url, render_id: r.id } }];\n}\nif (r.status === 'failed' || r.status === 'cancelled') {\n  var reason = String(r.error_message || 'no error_message').replace(/\\.?\\s*$/, '.');\n  throw new Error('Creatomate render ' + r.id + ' ' + r.status + ': ' + reason);\n}\nif (polls >= pick.creatomate_max_polls) {\n  throw new Error(\n    'Creatomate render ' + r.id + ' still ' + r.status + ' after ' + polls +\n      ' polls. Raise creatomate_max_polls or creatomate_poll_seconds on the sheet.'\n  );\n}\nreturn [{ json: { done: false, status: r.status, polls: polls } }];\n";

const klingParameters = {
  parameters: [
    { parameter: "prompt", value: expr("{{ $json.prompt }}") },
    { parameter: "start_image_url", value: expr("{{ $json.start_image_url }}") },
    { parameter: "duration", value: expr("{{ $json.duration }}") },
    { parameter: "negative_prompt", value: expr("{{ $json.negative_prompt }}") },
    { parameter: "cfg_scale", value: expr("{{ $json.cfg_scale }}") },
    { parameter: "generate_audio", value: expr("{{ false }}") },
  ],
};

const klingOptions = {
  waitForCompletion: true,
  pollInterval: expr("{{ $json.poll_seconds }}"),
  maxWaitTime: expr("{{ $json.max_wait_seconds }}"),
};

const pickSample = {
  creation_id: "PBVita-MolSmoke-01",
  compound_name: "GHK-Cu",
  model_still: "openai/gpt-image-2.5-sunburst",
  still_prompt: "Photorealistic cinematic science-fiction film still, vertical 9:16 frame.",
  aspect_ratio: "9:16",
  still_size: "1440x2560",
  still_quality: "high",
  still_n: 1,
  still_timeout_seconds: 600,
  model_video: "fal-ai/kling-video/v3/pro/image-to-video",
  creatomate_poll_seconds: 15,
  times_used: 0,
};

const videoSample = {
  creation_id: "PBVita-MolSmoke-01",
  model_video: "fal-ai/kling-video/v3/pro/image-to-video",
  prompt: "Silent video. One continuous camera move with no cuts.",
  start_image_url: "https://example.com/still.png",
  duration: "15",
  negative_prompt: "text, letters, numbers",
  cfg_scale: 0.5,
  poll_seconds: 5,
  max_wait_seconds: 900,
};

const recordSample = {
  creation_id: "PBVita-MolSmoke-01",
  still_url: "https://example.com/still.png",
  hop1_video_url: "https://example.com/hop1.mp4",
  last_frame_url: "https://example.com/frame.png",
  hop2_video_url: "https://example.com/hop2.mp4",
  video_url: "https://example.com/final.mp4",
  times_used: 1,
  last_used_at: "2026-09-30T03:00:00.000-04:00",
};

const renderSample = { id: "render-1", status: "succeeded", url: "https://example.com/render.png", width: 1080, height: 1920 };

const doneSample = { done: true, url: "https://example.com/render.png", render_id: "render-1" };

const noteOverview = sticky("![Molecule video v2 · 14-chem-breakdown-54 · 54 looks · 30s · 1080 × 1920 · 9:16 · no sound · Every prompt comes from the sheet · How to run · 1. gpt_image_molecule_still → Execute step (the still only) · 2. Like it? Pin save_still_url · 3. sheets_update_video → Execute step (the 30s video) · 4. Unpin save_still_url](https://raw.githubusercontent.com/PalmBeach-Vitality/store/09777bf62dfe12959788ac79565606543350c9d5/marketing/n8n-notes/peptide_molecule_vid_gen_v2/0-overview.png#full-width)", [], { name: "note_overview", color: 1, position: [0, -1060], width: 1364, height: 1140 });

const noteStill = sticky("![1 · The still · Least-used Active row goes first · GPT Image 2.5 (OpenRouter) · Grok Imagine 2.0 is off](https://raw.githubusercontent.com/PalmBeach-Vitality/store/09777bf62dfe12959788ac79565606543350c9d5/marketing/n8n-notes/peptide_molecule_vid_gen_v2/1-still.png#full-width)", [], { name: "note_1_still", color: 5, position: [1444, -400], width: 1244, height: 480 });

const noteHop1 = sticky("![2 · Hop 1 (0:00–0:15) · fal Kling v3 Pro · 1080p · 15s · Creatomate grabs frame 359, the first frame of hop 2](https://raw.githubusercontent.com/PalmBeach-Vitality/store/09777bf62dfe12959788ac79565606543350c9d5/marketing/n8n-notes/peptide_molecule_vid_gen_v2/2-hop1.png#full-width)", [], { name: "note_2_hop1", color: 4, position: [2768, -400], width: 1144, height: 480 });

const noteHop2 = sticky("![3 · Hop 2 (0:15–0:30) · fal Kling v3 Pro · 1080p · 15s · Creatomate joins the 30s video · Saves the URLs to the sheet](https://raw.githubusercontent.com/PalmBeach-Vitality/store/09777bf62dfe12959788ac79565606543350c9d5/marketing/n8n-notes/peptide_molecule_vid_gen_v2/3-hop2.png#full-width)", [], { name: "note_3_hop2", color: 6, position: [3992, -400], width: 1204, height: 480 });

const manualTrigger = trigger({
  type: "n8n-nodes-base.manualTrigger",
  version: 1,
  config: { name: "manual_trigger", position: [220, 240] },
  output: [{}],
});

const getChemCreations = node({
  type: "n8n-nodes-base.googleSheets",
  version: 4.7,
  config: {
    name: "get_chem_creations",
    position: [440, 240],
    executeOnce: true,
    credentials: credSheets,
    parameters: { resource: "sheet", operation: "read", documentId: smokeDocument, sheetName: smokeTab, options: {} },
  },
  output: [{ creation_id: "PBVita-MolSmoke-01", rank: 1, status: "Active", times_used: 0 }],
});

const filterChemActive = node({
  type: "n8n-nodes-base.filter",
  version: 2.3,
  config: {
    name: "filter_chem_active",
    position: [680, 240],
    parameters: {
      conditions: {
        options: strictOptions,
        conditions: [
          {
            id: "flt-active-1",
            leftValue: expr("{{ $json.status }}"),
            rightValue: "Active",
            operator: { type: "string", operation: "equals" },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  output: [{ creation_id: "PBVita-MolSmoke-01", rank: 1, status: "Active", times_used: 0 }],
});

const pickMoleculeCreation = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "pick_molecule_creation",
    position: [900, 240],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: pick_molecule_creation\n// Workflow: peptide_molecule_vid_gen_v2 (Sheet 14-chem-breakdown-54)\n// Mode: Run Once for All Items. Settings → Execute Once = OFF (it must see every Active row).\n// After: filter_chem_active   Before: route_still_model\n//\n// Picks the least-used Active row (times_used, then rank) and passes its cells through.\n// Every generation value comes from the sheet. An empty or malformed cell stops the run\n// here, before any paid call.\n\nvar TEXT_FIELDS = [\n  'creation_id',\n  'status',\n  'compound_name',\n  'look_name',\n  'model_still',\n  'still_prompt',\n  'aspect_ratio',\n  'model_video',\n  'resolution',\n  'video_motion_prompt',\n  'extend_motion_prompt',\n  'negative_prompt',\n  'video_format',\n  'last_frame_format',\n];\n\nvar NUMBER_FIELDS = [\n  'rank',\n  'still_n',\n  'still_timeout_seconds',\n  'hop1_duration_seconds',\n  'hop2_duration_seconds',\n  'cfg_scale',\n  'video_poll_seconds',\n  'video_max_wait_seconds',\n  'render_width',\n  'render_height',\n  'render_frame_rate',\n  'creatomate_poll_seconds',\n  'creatomate_max_polls',\n  'times_used',\n];\n\n// Keyed by the model_still prefix that route_still_model sends to each still node.\nvar STILL_FIELDS = {\n  'openai/gpt-image-': ['still_size', 'still_quality'],\n  'grok-imagine-image-': ['still_resolution'],\n};\n\nfunction blank(v) {\n  return v === undefined || v === null || String(v).trim() === '';\n}\n\nfunction fail(row, msg) {\n  var id = row && !blank(row.creation_id) ? String(row.creation_id).trim() + ': ' : '';\n  throw new Error('pick_molecule_creation: ' + id + msg);\n}\n\nvar rows = $input.all().map(function (i) {\n  return i.json;\n});\nif (!rows.length) fail(null, 'no Active rows came through filter_chem_active.');\n\nvar seen = {};\nrows.forEach(function (r) {\n  if (blank(r.creation_id)) fail(r, 'a row has no creation_id.');\n  var id = String(r.creation_id).trim();\n  if (seen[id]) fail(r, 'creation_id appears on two rows, so the sheet write-back cannot tell them apart.');\n  seen[id] = true;\n  ['times_used', 'rank'].forEach(function (k) {\n    if (blank(r[k]) || !isFinite(Number(r[k]))) {\n      fail(r, k + ' must be a number (got ' + JSON.stringify(r[k]) + ').');\n    }\n  });\n});\n\nrows.sort(function (a, b) {\n  return Number(a.times_used) - Number(b.times_used) || Number(a.rank) - Number(b.rank);\n});\nvar row = rows[0];\n\nvar pick = {};\nTEXT_FIELDS.forEach(function (k) {\n  if (blank(row[k])) fail(row, k + ' is empty.');\n  pick[k] = String(row[k]).trim();\n});\nNUMBER_FIELDS.forEach(function (k) {\n  if (blank(row[k]) || !isFinite(Number(row[k]))) {\n    fail(row, k + ' must be a number (got ' + JSON.stringify(row[k]) + ').');\n  }\n  pick[k] = Number(row[k]);\n});\n\nvar engine = Object.keys(STILL_FIELDS).filter(function (prefix) {\n  return pick.model_still.indexOf(prefix) === 0;\n})[0];\nif (!engine) {\n  fail(row, 'model_still must start with ' + Object.keys(STILL_FIELDS).join(' or ') + ' (got ' + pick.model_still + ').');\n}\nSTILL_FIELDS[engine].forEach(function (k) {\n  if (blank(row[k])) fail(row, k + ' is empty, and ' + pick.model_still + ' needs it.');\n  pick[k] = String(row[k]).trim();\n});\n\nif (pick.aspect_ratio !== '9:16') {\n  fail(row, 'aspect_ratio must be 9:16, social delivery is vertical only (got ' + pick.aspect_ratio + ').');\n}\nfunction isNineBySixteen(w, h) {\n  return w > 0 && h > 0 && w * 16 === h * 9;\n}\n\nvar res = /^(\\d+)p$/i.exec(pick.resolution);\nif (!res || Number(res[1]) < 1080) {\n  fail(row, 'resolution must be 1080p or higher, 720p is banned (got ' + pick.resolution + ').');\n}\nif (pick.model_video.indexOf('fal-ai/kling-video/v3/pro/') !== 0) {\n  fail(row, 'model_video must be a fal Kling v3 Pro endpoint, the one measured at 1080 x 1920 (got ' + pick.model_video + ').');\n}\n['hop1_duration_seconds', 'hop2_duration_seconds'].forEach(function (k) {\n  var s = pick[k];\n  if (Math.floor(s) !== s || s < 3 || s > 15) {\n    fail(row, k + ' must be a whole number from 3 to 15, Kling\\'s range (got ' + s + ').');\n  }\n});\nif (!(pick.cfg_scale >= 0 && pick.cfg_scale <= 1)) {\n  fail(row, 'cfg_scale must be 0 to 1 (got ' + pick.cfg_scale + ').');\n}\n\nif (!isNineBySixteen(pick.render_width, pick.render_height)) {\n  fail(row, 'render_width x render_height must be 9:16 (got ' + pick.render_width + 'x' + pick.render_height + ').');\n}\nif (pick.render_width < 1080) {\n  fail(row, 'render_width must be 1080 or more, 720p is banned (got ' + pick.render_width + ').');\n}\nif (engine === 'openai/gpt-image-') {\n  var size = /^(\\d+)x(\\d+)$/.exec(pick.still_size);\n  if (!size || !isNineBySixteen(Number(size[1]), Number(size[2]))) {\n    fail(row, 'still_size must be WIDTHxHEIGHT at 9:16 (got ' + pick.still_size + ').');\n  }\n  if (Number(size[1]) < pick.render_width) {\n    fail(row, 'still_size ' + pick.still_size + ' is narrower than the ' + pick.render_width + 'px video, so hop 1 would start soft.');\n  }\n}\n\nif (pick.still_n !== 1) fail(row, 'still_n must be 1, the workflow animates one still (got ' + pick.still_n + ').');\nif (pick.video_format !== 'mp4') fail(row, 'video_format must be mp4 (got ' + pick.video_format + ').');\nif (['png', 'jpg'].indexOf(pick.last_frame_format) === -1) {\n  fail(row, 'last_frame_format must be png or jpg (got ' + pick.last_frame_format + ').');\n}\n[\n  'still_timeout_seconds',\n  'video_poll_seconds',\n  'video_max_wait_seconds',\n  'render_frame_rate',\n  'creatomate_poll_seconds',\n  'creatomate_max_polls',\n].forEach(function (k) {\n  if (!(pick[k] > 0)) fail(row, k + ' must be above 0 (got ' + pick[k] + ').');\n});\n\npick.input_row_count = rows.length;\nreturn [{ json: pick }];\n",
    },
  },
  output: [pickSample],
});

const routeStillModel = ifElse({
  version: 2.3,
  config: {
    name: "route_still_model",
    position: [1120, 240],
    parameters: {
      conditions: {
        options: strictOptions,
        conditions: [
          {
            id: "route-still-gpt",
            leftValue: expr("{{ $json.model_still }}"),
            rightValue: "openai/gpt-image-",
            operator: { type: "string", operation: "startsWith" },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  output: [pickSample],
});

const gptImageStill = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "gpt_image_molecule_still",
    position: [1340, 16],
    credentials: credOpenRouter,
    parameters: {
      method: "POST",
      url: "https://openrouter.ai/api/v1/images",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "openRouterApi",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr("{{ JSON.stringify({ model: $json.model_still, prompt: $json.still_prompt, n: $json.still_n, size: $json.still_size, aspect_ratio: $json.aspect_ratio, quality: $json.still_quality }) }}"),
      options: { timeout: expr("{{ $json.still_timeout_seconds * 1000 }}") },
    },
  },
  output: [{ data: [{ b64_json: "iVBORw0KGgo", media_type: "image/png" }], usage: { cost: 0.25 } }],
});

const checkGptStill = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "check_gpt_still",
    position: [1560, 16],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: check_gpt_still\n// After: gpt_image_molecule_still   Before: gpt_still_to_file\n//\n// OpenRouter normalizes `size` per provider, so the request alone proves nothing. This\n// reads the image header and stops the run before any video spend unless the still is\n// exactly the sheet's still_size. No output_format is sent, so the provider default comes\n// back (PNG for OpenAI); JPEG and WebP are read too so a paid still is never thrown away\n// over its container.\n\nvar res = $input.first().json;\nvar pick = $('pick_molecule_creation').first().json;\nvar img = (res.data || [])[0];\nif (!img || !img.b64_json) {\n  throw new Error(\n    'check_gpt_still: OpenRouter returned no image' + (res.error ? ': ' + JSON.stringify(res.error) : '.')\n  );\n}\n\nfunction imageSize(buf) {\n  if (buf.length >= 24 && buf.toString('ascii', 1, 4) === 'PNG' && buf.toString('ascii', 12, 16) === 'IHDR') {\n    return { mime: 'image/png', ext: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };\n  }\n  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {\n    var i = 2;\n    while (i + 9 < buf.length) {\n      if (buf[i] !== 0xff) {\n        i++;\n        continue;\n      }\n      var marker = buf[i + 1];\n      if (marker === 0xff) {\n        i++;\n        continue;\n      }\n      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {\n        i += 2;\n        continue;\n      }\n      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {\n        return { mime: 'image/jpeg', ext: 'jpg', width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };\n      }\n      i += 2 + buf.readUInt16BE(i + 2);\n    }\n    return null;\n  }\n  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {\n    var chunk = buf.toString('ascii', 12, 16);\n    var webp = { mime: 'image/webp', ext: 'webp' };\n    if (chunk === 'VP8X') {\n      webp.width = 1 + buf.readUIntLE(24, 3);\n      webp.height = 1 + buf.readUIntLE(27, 3);\n    } else if (chunk === 'VP8 ') {\n      webp.width = buf.readUInt16LE(26) & 0x3fff;\n      webp.height = buf.readUInt16LE(28) & 0x3fff;\n    } else if (chunk === 'VP8L') {\n      var bits = buf.readUInt32LE(21);\n      webp.width = 1 + (bits & 0x3fff);\n      webp.height = 1 + ((bits >> 14) & 0x3fff);\n    } else {\n      return null;\n    }\n    return webp;\n  }\n  return null;\n}\n\nvar b64 = String(img.b64_json).replace(/^data:[^,]*,/, '');\nvar size = imageSize(Buffer.from(b64, 'base64'));\nif (!size) {\n  throw new Error('check_gpt_still: could not read the image size (media_type ' + (img.media_type || 'missing') + ').');\n}\nvar want = pick.still_size.split('x').map(Number);\nif (size.width !== want[0] || size.height !== want[1]) {\n  throw new Error(\n    'check_gpt_still: got ' + size.width + 'x' + size.height + ', sheet still_size is ' + pick.still_size +\n      '. Stopped before any video spend.'\n  );\n}\n\nreturn [\n  {\n    json: {\n      still_b64: b64,\n      still_mime: size.mime,\n      still_ext: size.ext,\n      still_width: size.width,\n      still_height: size.height,\n      still_cost_usd: res.usage && res.usage.cost !== undefined ? res.usage.cost : null,\n    },\n  },\n];\n",
    },
  },
  output: [
    {
      still_b64: "iVBORw0KGgo",
      still_mime: "image/png",
      still_ext: "png",
      still_width: 1440,
      still_height: 2560,
    },
  ],
});

const gptStillToFile = node({
  type: "n8n-nodes-base.convertToFile",
  version: 1.1,
  config: {
    name: "gpt_still_to_file",
    position: [1800, 16],
    parameters: {
      operation: "toBinary",
      sourceProperty: "still_b64",
      binaryPropertyName: "data",
      options: {
        fileName: expr("{{ $('pick_molecule_creation').first().json.creation_id }}.{{ $json.still_ext }}"),
        mimeType: expr("{{ $json.still_mime }}"),
      },
    },
  },
  output: [{ still_mime: "image/png", still_ext: "png" }],
});

const uploadGptStill = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "upload_gpt_still",
    position: [2020, 16],
    parameters: {
      method: "POST",
      url: "https://litterbox.catbox.moe/resources/internals/api.php",
      sendBody: true,
      contentType: "multipart-form-data",
      bodyParameters: {
        parameters: [
          { name: "reqtype", value: "fileupload" },
          { name: "time", value: "72h" },
          { parameterType: "formBinaryData", name: "fileToUpload", inputDataFieldName: "data" },
        ],
      },
      options: {
        response: { response: { responseFormat: "text" } },
        timeout: expr("{{ $('pick_molecule_creation').first().json.still_timeout_seconds * 1000 }}"),
      },
    },
  },
  output: [{ data: "https://example.com/still.png" }],
});

const grokImageStill = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "grok_imagine_molecule_still",
    position: [1680, 464],
    disabled: true,
    credentials: credXai,
    parameters: {
      method: "POST",
      url: "https://api.x.ai/v1/images/generations",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr("{{ JSON.stringify({ model: $json.model_still, prompt: $json.still_prompt, n: $json.still_n, aspect_ratio: $json.aspect_ratio, resolution: $json.still_resolution }) }}"),
      options: { timeout: expr("{{ $json.still_timeout_seconds * 1000 }}") },
    },
  },
  output: [{ data: [{ url: "https://example.com/still.jpeg" }] }],
});

const saveStillUrl = node({
  type: "n8n-nodes-base.set",
  version: 3.5,
  config: {
    name: "save_still_url",
    position: [2240, 240],
    parameters: {
      mode: "manual",
      includeOtherFields: false,
      assignments: {
        assignments: [
          {
            id: "a1",
            name: "still_url",
            value: expr("{{ Array.isArray($json.data) ? $json.data[0].url : String($json.data).trim() }}"),
            type: "string",
          },
        ],
      },
      options: {},
    },
  },
  output: [{ still_url: "https://example.com/still.png" }],
});

const prepVideoStart = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "prep_molecule_video_start",
    position: [2460, 240],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: prep_molecule_video_start\n// After: save_still_url   Before: fal_kling_hop1\n//\n// Hop 1 of 2. Sheet values pass straight through. The only addition is the silent lock:\n// audio is off on every vid-gen workflow (AGENTS.md), and the API flag alone has let a\n// clip come back scored.\n\nvar SILENT_LOCK = 'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ';\n// fal Kling v3 Pro rejects prompt and negative_prompt over 2500 characters.\nvar PROMPT_MAX = 2500;\n\nvar pick = $('pick_molecule_creation').first().json;\nvar still = String($input.first().json.still_url || '').trim();\nif (!/^https:\\/\\//i.test(still)) {\n  throw new Error(\n    'prep_molecule_video_start: save_still_url has no https still_url (got ' + JSON.stringify(still.slice(0, 120)) + ').'\n  );\n}\n\nvar motion = pick.video_motion_prompt;\nvar prompt = motion.indexOf('Silent video') === -1 ? SILENT_LOCK + motion : motion;\nif (prompt.length > PROMPT_MAX) {\n  throw new Error(\n    'prep_molecule_video_start: ' + pick.creation_id + ' video_motion_prompt is ' + prompt.length +\n      ' characters with the silent lock. Kling takes ' + PROMPT_MAX + '. Shorten the sheet cell.'\n  );\n}\nif (pick.negative_prompt.length > PROMPT_MAX) {\n  throw new Error('prep_molecule_video_start: ' + pick.creation_id + ' negative_prompt is over ' + PROMPT_MAX + ' characters.');\n}\n\nreturn [\n  {\n    json: {\n      creation_id: pick.creation_id,\n      model_video: pick.model_video,\n      prompt: prompt,\n      start_image_url: still,\n      duration: String(pick.hop1_duration_seconds),\n      negative_prompt: pick.negative_prompt,\n      cfg_scale: pick.cfg_scale,\n      poll_seconds: pick.video_poll_seconds,\n      max_wait_seconds: pick.video_max_wait_seconds,\n    },\n  },\n];\n",
    },
  },
  output: [videoSample],
});

const falKlingHop1 = node({
  type: "@fal-ai/n8n-nodes-fal.falAi",
  version: 1,
  config: {
    name: "fal_kling_hop1",
    position: [2680, 240],
    credentials: credFal,
    parameters: {
      resource: "model",
      operation: "generate",
      model: { __rl: true, mode: "id", value: expr("{{ $json.model_video }}") },
      modelParameters: klingParameters,
      options: klingOptions,
    },
  },
  output: [{ video: { url: "https://example.com/hop1.mp4" } }],
});

const prepLastFrame = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "prep_last_frame",
    position: [2920, 240],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: prep_last_frame\n// After: fal_kling_hop1   Before: creatomate_last_frame\n//\n// Grabs hop 1 one frame before its requested length. prep_creatomate_concat cuts hop 1 at\n// the same moment, and hop 2 starts from this frame, so the 30s cut has no repeated or\n// skipped frame at the seam.\n\nvar pick = $('pick_molecule_creation').first().json;\nvar hop1 = $input.first().json;\nvar url = String((hop1.video && hop1.video.url) || '').trim();\nif (!/^https:\\/\\//i.test(url)) {\n  throw new Error(\n    'prep_last_frame: fal_kling_hop1 returned no video url' +\n      (hop1.error ? ': ' + JSON.stringify(hop1.error) : '') +\n      '. If it timed out, raise video_max_wait_seconds on the sheet.'\n  );\n}\nvar cut = pick.hop1_duration_seconds - 1 / pick.render_frame_rate;\n\nreturn [\n  {\n    json: {\n      hop1_video_url: url,\n      hop1_cut_seconds: cut,\n      creatomate_body: {\n        output_format: pick.last_frame_format,\n        width: pick.render_width,\n        height: pick.render_height,\n        snapshot_time: cut,\n        elements: [{ type: 'video', track: 1, source: url }],\n      },\n    },\n  },\n];\n",
    },
  },
  output: [
    {
      hop1_video_url: "https://example.com/hop1.mp4",
      hop1_cut_seconds: 14.958333333333334,
      creatomate_body: { output_format: "png", width: 1080, height: 1920, snapshot_time: 14.958333333333334 },
    },
  ],
});

const creatomateLastFrame = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "creatomate_last_frame",
    position: [3140, 240],
    credentials: credCreatomate,
    parameters: {
      method: "POST",
      url: "https://api.creatomate.com/v2/renders",
      authentication: "genericCredentialType",
      genericAuthType: "httpBearerAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr("{{ JSON.stringify($json.creatomate_body) }}"),
      options: {},
    },
  },
  output: [{ id: "render-1", status: "planned" }],
});

const waitLastFrame = node({
  type: "n8n-nodes-base.wait",
  version: 1.1,
  config: {
    name: "wait_last_frame",
    position: [3360, 240],
    parameters: {
      resume: "timeInterval",
      amount: expr("{{ $('pick_molecule_creation').first().json.creatomate_poll_seconds }}"),
      unit: "seconds",
    },
  },
  output: [{ id: "render-1", status: "planned" }],
});

const creatomateLastFramePoll = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "creatomate_last_frame_poll",
    position: [3580, 240],
    credentials: credCreatomate,
    parameters: {
      method: "GET",
      url: expr("https://api.creatomate.com/v2/renders/{{ $('creatomate_last_frame').first().json.id }}"),
      authentication: "genericCredentialType",
      genericAuthType: "httpBearerAuth",
      options: {},
    },
  },
  output: [renderSample],
});

const routeLastFrame = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "route_last_frame",
    position: [3800, 240],
    parameters: { mode: "runOnceForAllItems", language: "javaScript", jsCode: routeRenderCode },
  },
  output: [doneSample],
});

const switchLastFrame = ifElse({
  version: 2.3,
  config: {
    name: "switch_last_frame",
    position: [4040, 240],
    parameters: {
      conditions: {
        options: strictOptions,
        conditions: [
          {
            id: "last-frame-done",
            leftValue: expr("{{ $json.done }}"),
            rightValue: "",
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  output: [doneSample],
});

const prepKlingExtend = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "prep_kling_extend",
    position: [4260, 240],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: prep_kling_extend\n// After: switch_last_frame (true)   Before: fal_kling_hop2\n//\n// Hop 2 of 2 starts from the frame prep_last_frame grabbed. Same silent lock as hop 1.\n\nvar SILENT_LOCK = 'Silent video. No soundtrack, no music, no sound effects, no dialogue, no ambient audio. ';\n// fal Kling v3 Pro rejects prompt and negative_prompt over 2500 characters.\nvar PROMPT_MAX = 2500;\n\nvar pick = $('pick_molecule_creation').first().json;\nvar frame = String($input.first().json.url || '').trim();\nif (!/^https:\\/\\//i.test(frame)) {\n  throw new Error('prep_kling_extend: route_last_frame passed no https frame url (got ' + JSON.stringify(frame.slice(0, 120)) + ').');\n}\n\nvar motion = pick.extend_motion_prompt;\nvar prompt = motion.indexOf('Silent video') === -1 ? SILENT_LOCK + motion : motion;\nif (prompt.length > PROMPT_MAX) {\n  throw new Error(\n    'prep_kling_extend: ' + pick.creation_id + ' extend_motion_prompt is ' + prompt.length +\n      ' characters with the silent lock. Kling takes ' + PROMPT_MAX + '. Shorten the sheet cell.'\n  );\n}\nif (pick.negative_prompt.length > PROMPT_MAX) {\n  throw new Error('prep_kling_extend: ' + pick.creation_id + ' negative_prompt is over ' + PROMPT_MAX + ' characters.');\n}\n\nreturn [\n  {\n    json: {\n      creation_id: pick.creation_id,\n      model_video: pick.model_video,\n      prompt: prompt,\n      start_image_url: frame,\n      duration: String(pick.hop2_duration_seconds),\n      negative_prompt: pick.negative_prompt,\n      cfg_scale: pick.cfg_scale,\n      poll_seconds: pick.video_poll_seconds,\n      max_wait_seconds: pick.video_max_wait_seconds,\n    },\n  },\n];\n",
    },
  },
  output: [videoSample],
});

const falKlingHop2 = node({
  type: "@fal-ai/n8n-nodes-fal.falAi",
  version: 1,
  config: {
    name: "fal_kling_hop2",
    position: [4480, 240],
    credentials: credFal,
    parameters: {
      resource: "model",
      operation: "generate",
      model: { __rl: true, mode: "id", value: expr("{{ $json.model_video }}") },
      modelParameters: klingParameters,
      options: klingOptions,
    },
  },
  output: [{ video: { url: "https://example.com/hop2.mp4" } }],
});

const prepCreatomateConcat = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "prep_creatomate_concat",
    position: [4700, 240],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: prep_creatomate_concat\n// After: fal_kling_hop2   Before: creatomate_concat\n//\n// Joins the two hops on one track. Hop 1 is cut where prep_last_frame grabbed hop 2's\n// first frame.\n\nvar pick = $('pick_molecule_creation').first().json;\nvar lastFrame = $('prep_last_frame').first().json;\nvar hop2 = $input.first().json;\nvar url = String((hop2.video && hop2.video.url) || '').trim();\nif (!/^https:\\/\\//i.test(url)) {\n  throw new Error(\n    'prep_creatomate_concat: fal_kling_hop2 returned no video url' +\n      (hop2.error ? ': ' + JSON.stringify(hop2.error) : '') +\n      '. If it timed out, raise video_max_wait_seconds on the sheet.'\n  );\n}\n\nreturn [\n  {\n    json: {\n      hop2_video_url: url,\n      creatomate_body: {\n        output_format: pick.video_format,\n        width: pick.render_width,\n        height: pick.render_height,\n        frame_rate: pick.render_frame_rate,\n        elements: [\n          { type: 'video', track: 1, source: lastFrame.hop1_video_url, trim_duration: lastFrame.hop1_cut_seconds },\n          { type: 'video', track: 1, source: url },\n        ],\n      },\n    },\n  },\n];\n",
    },
  },
  output: [
    {
      hop2_video_url: "https://example.com/hop2.mp4",
      creatomate_body: { output_format: "mp4", width: 1080, height: 1920, frame_rate: 24 },
    },
  ],
});

const creatomateConcat = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "creatomate_concat",
    position: [4920, 240],
    credentials: credCreatomate,
    parameters: {
      method: "POST",
      url: "https://api.creatomate.com/v2/renders",
      authentication: "genericCredentialType",
      genericAuthType: "httpBearerAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: expr("{{ JSON.stringify($json.creatomate_body) }}"),
      options: {},
    },
  },
  output: [{ id: "render-1", status: "planned" }],
});

const waitConcat = node({
  type: "n8n-nodes-base.wait",
  version: 1.1,
  config: {
    name: "wait_concat",
    position: [5160, 240],
    parameters: {
      resume: "timeInterval",
      amount: expr("{{ $('pick_molecule_creation').first().json.creatomate_poll_seconds }}"),
      unit: "seconds",
    },
  },
  output: [{ id: "render-1", status: "planned" }],
});

const creatomatePoll = node({
  type: "n8n-nodes-base.httpRequest",
  version: 4.5,
  config: {
    name: "creatomate_poll",
    position: [5380, 240],
    credentials: credCreatomate,
    parameters: {
      method: "GET",
      url: expr("https://api.creatomate.com/v2/renders/{{ $('creatomate_concat').first().json.id }}"),
      authentication: "genericCredentialType",
      genericAuthType: "httpBearerAuth",
      options: {},
    },
  },
  output: [renderSample],
});

const routeConcat = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "route_concat",
    position: [5600, 240],
    parameters: { mode: "runOnceForAllItems", language: "javaScript", jsCode: routeRenderCode },
  },
  output: [doneSample],
});

const switchConcat = ifElse({
  version: 2.3,
  config: {
    name: "switch_concat",
    position: [5820, 240],
    parameters: {
      conditions: {
        options: strictOptions,
        conditions: [
          {
            id: "concat-done",
            leftValue: expr("{{ $json.done }}"),
            rightValue: "",
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  output: [doneSample],
});

const saveVideoUrl = node({
  type: "n8n-nodes-base.code",
  version: 2,
  config: {
    name: "save_video_url",
    position: [6040, 240],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: "// n8n Code node: save_video_url\n// After: switch_concat (true)   Before: sheets_update_video\n//\n// Feeds the run's only sheet write. A still-only or failed run never gets here, so\n// times_used counts finished videos only.\n\nvar pick = $('pick_molecule_creation').first().json;\n\nreturn [\n  {\n    json: {\n      creation_id: pick.creation_id,\n      still_url: $('save_still_url').first().json.still_url,\n      hop1_video_url: $('prep_last_frame').first().json.hop1_video_url,\n      last_frame_url: $('prep_kling_extend').first().json.start_image_url,\n      hop2_video_url: $('prep_creatomate_concat').first().json.hop2_video_url,\n      video_url: $input.first().json.url,\n      times_used: pick.times_used + 1,\n      last_used_at: $now.toISO(),\n    },\n  },\n];\n",
    },
  },
  output: [recordSample],
});

const sheetsUpdateVideo = node({
  type: "n8n-nodes-base.googleSheets",
  version: 4.7,
  config: {
    name: "sheets_update_video",
    position: [6280, 240],
    credentials: credSheets,
    parameters: {
      resource: "sheet",
      operation: "update",
      documentId: smokeDocument,
      sheetName: smokeTab,
      columns: {
        mappingMode: "defineBelow",
        matchingColumns: ["creation_id"],
        value: {
          creation_id: expr("{{ $json.creation_id }}"),
          still_url: expr("{{ $json.still_url }}"),
          hop1_video_url: expr("{{ $json.hop1_video_url }}"),
          last_frame_url: expr("{{ $json.last_frame_url }}"),
          hop2_video_url: expr("{{ $json.hop2_video_url }}"),
          video_url: expr("{{ $json.video_url }}"),
          times_used: expr("{{ $json.times_used }}"),
          last_used_at: expr("{{ $json.last_used_at }}"),
        },
        schema: [
          {
            id: "creation_id",
            displayName: "creation_id",
            required: true,
            defaultMatch: true,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
          {
            id: "still_url",
            displayName: "still_url",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
          {
            id: "hop1_video_url",
            displayName: "hop1_video_url",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
          {
            id: "last_frame_url",
            displayName: "last_frame_url",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
          {
            id: "hop2_video_url",
            displayName: "hop2_video_url",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
          {
            id: "video_url",
            displayName: "video_url",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
          {
            id: "times_used",
            displayName: "times_used",
            required: false,
            defaultMatch: false,
            display: true,
            type: "number",
            canBeUsedToMatch: true,
          },
          {
            id: "last_used_at",
            displayName: "last_used_at",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
          },
        ],
      },
      options: { cellFormat: "RAW" },
    },
  },
  output: [recordSample],
});

export default workflow('peptide_molecule_vid_gen_v2', 'peptide_molecule_vid_gen_v2')
  .add(noteOverview)
  .add(noteStill)
  .add(noteHop1)
  .add(noteHop2)
  .add(manualTrigger)
  .to(getChemCreations)
  .to(filterChemActive)
  .to(pickMoleculeCreation)
  .to(
    routeStillModel
      .onTrue(gptImageStill.to(checkGptStill.to(gptStillToFile.to(uploadGptStill.to(saveStillUrl)))))
      .onFalse(grokImageStill.to(saveStillUrl))
  )
  .add(saveStillUrl)
  .to(prepVideoStart)
  .to(falKlingHop1)
  .to(prepLastFrame)
  .to(creatomateLastFrame)
  .to(waitLastFrame)
  .to(creatomateLastFramePoll)
  .to(routeLastFrame)
  .to(switchLastFrame.onTrue(prepKlingExtend).onFalse(waitLastFrame))
  .add(prepKlingExtend)
  .to(falKlingHop2)
  .to(prepCreatomateConcat)
  .to(creatomateConcat)
  .to(waitConcat)
  .to(creatomatePoll)
  .to(routeConcat)
  .to(switchConcat.onTrue(saveVideoUrl.to(sheetsUpdateVideo)).onFalse(waitConcat));
